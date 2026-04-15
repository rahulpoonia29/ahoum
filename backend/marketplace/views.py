from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Booking, Session
from .permissions import IsCreator, IsOwnerOrReadOnly
from .serializers import (
    BookingDetailSerializer,
    BookingSerializer,
    SessionCreateSerializer,
    SessionSerializer,
)


class SessionsViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all().order_by("start_time")

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        if self.action == "create":
            return [IsAuthenticated(), IsCreator()]
        return [IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return SessionCreateSerializer
        return SessionSerializer

    def perform_update(self, serializer):
        # Validate and save
        instance = serializer.save()
        instance.full_clean()
        instance.save()

    def perform_create(self, serializer):
        # Ensure creator is set and validate
        serializer.save(creator=self.request.user)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_booking(request):
    # Expect payload: {"session": <id>}
    serializer = BookingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    session = serializer.validated_data["session"]

    # Prevent creators from booking their own session
    if session.creator == request.user:
        return Response(
            {"detail": "Creators cannot book their own sessions"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check availability
    current = session.bookings.filter(
        status__in=[Booking.PENDING, Booking.CONFIRMED]
    ).count()
    if current >= session.max_participants:
        return Response(
            {"detail": "Session is full"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Create booking
    with transaction.atomic():
        booking = Booking.objects.create(
            session=session, user=request.user, status=Booking.PENDING
        )
    # For now, attach a mock payment_reference; real integration will replace this
    booking.payment_reference = f"MOCK-{booking.id}"
    booking.save()
    return Response(
        BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED
    )
