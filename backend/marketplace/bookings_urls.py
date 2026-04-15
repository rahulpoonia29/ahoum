from django.urls import path

from . import bookings_views

urlpatterns = [
    path("", bookings_views.create_booking, name="create-booking"),
    path("my/", bookings_views.my_bookings, name="my-bookings"),
    path(
        "session/<int:session_id>/",
        bookings_views.bookings_for_session,
        name="bookings-for-session",
    ),
    path("<int:pk>/pay/", bookings_views.pay_booking, name="pay-booking"),
    path("<int:pk>/confirm/", bookings_views.confirm_booking, name="confirm-booking"),
]
