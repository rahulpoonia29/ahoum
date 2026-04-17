import os

import requests
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .serializers import GithubAuthSerializer, UserSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        # Only allow updating select profile fields
        allowed = {"first_name", "last_name", "bio", "avatar"}
        # accept both form data and files
        data = {k: v for k, v in request.data.items() if k in allowed}
        serializer = UserSerializer(
            request.user, data=data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # If an avatar file was uploaded, save it with username-based key
        if "avatar" in request.FILES:
            avatar_file = request.FILES["avatar"]
            # determine extension
            content_type = getattr(avatar_file, "content_type", "")
            ext = None
            if "png" in content_type:
                ext = "png"
            elif "gif" in content_type:
                ext = "gif"
            elif "jpeg" in content_type or "jpg" in content_type:
                ext = "jpg"
            if not ext:
                # fallback to original filename extension
                name = getattr(avatar_file, "name", "")
                if ".png" in name:
                    ext = "png"
                elif ".gif" in name:
                    ext = "gif"
                else:
                    ext = "jpg"

            filename = f"{request.user.username}.{ext}"
            request.user.avatar.save(filename, avatar_file, save=True)
        return Response(serializer.data)


class LogoutView(APIView):
    """Blacklist a refresh token to log the user out."""

    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("refresh")
        if not token:
            return Response(
                {"detail": "refresh token required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            RefreshToken(token).blacklist()
        except Exception as e:
            return Response(
                {"detail": "invalid token or already blacklisted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_205_RESET_CONTENT)


class GitHubLoginView(APIView):
    """Exchange a GitHub OAuth code for a local JWT.

    Accepts JSON: {"code": "<github-code>", "redirect_uri": "<optional>", "role": "<optional>"}
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GithubAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"].strip()
        redirect_uri = request.data.get("redirect_uri")
        role = request.data.get("role", "USER").upper()
        creator_code = request.data.get("creator_code")

        client_id = os.environ.get("GITHUB_CLIENT_ID")
        client_secret = os.environ.get("GITHUB_CLIENT_SECRET")
        if not client_id or not client_secret:
            return Response(
                {
                    "detail": "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set in the environment"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Exchange code for access token
        token_url = "https://github.com/login/oauth/access_token"
        data = {"client_id": client_id, "client_secret": client_secret, "code": code}
        if redirect_uri:
            data["redirect_uri"] = redirect_uri

        headers = {"Accept": "application/json"}
        try:
            token_resp = requests.post(
                token_url, data=data, headers=headers, timeout=10
            )
        except requests.RequestException as e:
            return Response(
                {"detail": f"error exchanging code: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if token_resp.status_code != 200:
            return Response(
                {
                    "detail": "failed to exchange code for token",
                    "status_code": token_resp.status_code,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_json = token_resp.json()
        access_token = token_json.get("access_token")
        if not access_token:
            return Response(
                {"detail": "no access_token returned from GitHub", "error": token_json},
                status=status.HTTP_400_BAD_REQUEST,
            )

        auth_headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/json",
            "User-Agent": "ahoum",
        }

        # Get user profile
        try:
            user_resp = requests.get(
                "https://api.github.com/user", headers=auth_headers, timeout=10
            )
        except requests.RequestException as e:
            return Response(
                {"detail": f"error fetching github user: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if user_resp.status_code != 200:
            return Response(
                {
                    "detail": "failed to fetch github user",
                    "status_code": user_resp.status_code,
                    "body": user_resp.text,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_json = user_resp.json()
        gh_login = user_json.get("login")
        gh_name = user_json.get("name")
        gh_avatar = user_json.get("avatar_url")
        gh_email = user_json.get("email")

        # Fetch emails to find primary verified email if available
        primary_email = None
        try:
            emails_resp = requests.get(
                "https://api.github.com/user/emails", headers=auth_headers, timeout=10
            )
            if emails_resp.status_code == 200:
                emails = emails_resp.json()
                # prefer primary & verified, then any verified
                primary = next(
                    (e for e in emails if e.get("primary") and e.get("verified")), None
                )
                if not primary:
                    primary = next((e for e in emails if e.get("verified")), None)
                if primary:
                    primary_email = primary.get("email")
        except requests.RequestException:
            # ignore and fallback
            primary_email = None

        email = primary_email or gh_email

        User = get_user_model()

        # Allow requesting the CREATOR role without a code (removed creator_code requirement)

        user = None
        if email:
            user = User.objects.filter(email__iexact=email).first()

        if not user and gh_login:
            user = User.objects.filter(username__iexact=gh_login).first()

        if not user:
            # create a new user
            # choose username: prefer gh_login, else local part of email, else generate
            base_username = gh_login or (
                email.split("@")[0] if email and "@" in email else "user"
            )
            username = base_username
            counter = 0
            while User.objects.filter(username=username).exists():
                counter += 1
                username = f"{base_username}{counter}"

            user = User(username=username, email=email or "")
            user.set_unusable_password()
            user.auth_provider = "github"
        
        # Update role for both new and existing users
        user.role = role if role in (User.USER, User.CREATOR) else User.USER

        # Update profile fields
        if gh_name:
            parts = gh_name.split(None, 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ""
        if gh_avatar:
            # Download avatar and save to user's avatar FileField using username as key
            try:
                resp = requests.get(gh_avatar, timeout=10)
                if resp.status_code == 200 and resp.content:
                    # determine extension from content-type or url
                    ct = resp.headers.get("Content-Type", "")
                    if "png" in ct:
                        ext = "png"
                    elif "gif" in ct:
                        ext = "gif"
                    else:
                        ext = "jpg"

                    # Use filename without the upload_to prefix; storage will place it under avatars/
                    filename = f"{user.username}.{ext}"
                    # overwrite existing avatar file
                    user.avatar.save(filename, ContentFile(resp.content), save=False)
                else:
                    pass
            except requests.RequestException:
                pass
        user.auth_provider = "github"
        user.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            }
        )
