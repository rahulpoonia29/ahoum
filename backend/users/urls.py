from django.urls import include, path

urlpatterns = [
    # Backwards-compatible single include. Prefer using users.auth_urls and users.profile_urls directly.
    path("", include("users.auth_urls")),
    path("", include("users.profile_urls")),
]
