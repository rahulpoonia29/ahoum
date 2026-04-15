from django.conf import settings
from django.db import models


class Session(models.Model):
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sessions"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    max_participants = models.PositiveIntegerField(default=1)  # type: ignore
    cover_image = models.FileField(upload_to="session_covers/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.creator}"

    def clean(self):
        from django.core.exceptions import ValidationError

        # Ensure start_time is before end_time
        if self.end_time and self.start_time and self.start_time >= self.end_time:
            raise ValidationError("start_time must be before end_time")

        # Ensure price is non-negative
        if self.price and self.price < 0:
            raise ValidationError("price must be non-negative")


class Booking(models.Model):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    STATUS_CHOICES = (
        (PENDING, "Pending"),
        (CONFIRMED, "Confirmed"),
        (CANCELLED, "Cancelled"),
    )

    session = models.ForeignKey(
        Session, on_delete=models.CASCADE, related_name="bookings"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    payment_reference = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("session", "user")

    def __str__(self):
        return f"Booking: {self.user} -> {self.session} ({self.status})"
