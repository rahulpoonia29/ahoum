from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SessionsViewSet

router = DefaultRouter()
router.register(r"", SessionsViewSet, basename="sessions")
urlpatterns = [
    path("", include(router.urls)),
]
