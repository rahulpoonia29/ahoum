from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsCreator(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "CREATOR"
        )


class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.creator == request.user


class IsSessionCreator(BasePermission):
    """Permission for views that accept a session_id kwarg and should be
    accessible only to the session's creator."""

    def has_permission(self, request, view):
        session_id = view.kwargs.get("session_id")
        if not session_id:
            return False
        from .models import Session

        try:
            session = Session.objects.get(pk=session_id)
        except Session.DoesNotExist:
            return False
        return bool(
            request.user
            and request.user.is_authenticated
            and session.creator == request.user
        )
