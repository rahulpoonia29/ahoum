from django.urls import path, include

urlpatterns = [
    path("api/auth/", include("users.auth_urls")),
    path("api/users/", include("users.profile_urls")),
    path("api/sessions/", include("marketplace.urls")),
    path("api/bookings/", include("marketplace.bookings_urls")),
]
