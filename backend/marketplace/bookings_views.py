from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from . import payments
from .models import Booking, Session
from .permissions import IsSessionCreator
from .serializers import BookingDetailSerializer, BookingSerializer


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_booking(request):
    serializer = BookingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    session = serializer.validated_data["session"]

    if session.creator == request.user:
        return Response(
            {"detail": "Creators cannot book their own sessions"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    current = session.bookings.filter(
        status__in=[Booking.PENDING, Booking.CONFIRMED]
    ).count()
    if current >= session.max_participants:
        return Response(
            {"detail": "Session is full"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Prevent duplicate booking
    if Booking.objects.filter(session=session, user=request.user).exists():
        return Response(
            {"detail": "User already booked this session"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    booking = Booking.objects.create(
        session=session, user=request.user, status=Booking.PENDING
    )
    # create mock payment intent and store its id
    intent = payments.create_payment_intent(int(session.price * 100))
    booking.payment_reference = intent["id"]
    booking.save()
    return Response(
        BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_bookings(request):
    qs = Booking.objects.filter(user=request.user).order_by("-created_at")
    paginator = Paginator(qs, 20)
    page = request.query_params.get("page", 1)
    items = paginator.get_page(page)
    serializer = BookingDetailSerializer(items, many=True)
    return Response({"count": paginator.count, "results": serializer.data})


@api_view(["GET"])
@permission_classes([IsSessionCreator])
def bookings_for_session(request, session_id):
    session = get_object_or_404(Session, pk=session_id)
    qs = session.bookings.all().order_by("-created_at")
    paginator = Paginator(qs, 20)
    page = request.query_params.get("page", 1)
    items = paginator.get_page(page)
    serializer = BookingDetailSerializer(items, many=True)
    return Response({"count": paginator.count, "results": serializer.data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def pay_booking(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    # allow booking.user or session.creator to create payment intent
    if not (booking.user == request.user or booking.session.creator == request.user):
        return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

    intent = payments.create_payment_intent(int(booking.session.price * 100))
    booking.payment_reference = intent["id"]
    booking.save()
    return Response(intent)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def confirm_booking(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    if not (booking.user == request.user or booking.session.creator == request.user):
        return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

    intent_id = booking.payment_reference
    if not intent_id:
        return Response(
            {"detail": "No payment intent present"}, status=status.HTTP_400_BAD_REQUEST
        )

    result = payments.confirm_payment_intent(intent_id)
    if result.get("status") == "succeeded":
        booking.status = Booking.CONFIRMED
        booking.payment_reference = result.get("id")
        booking.save()
        return Response(
            {
                "detail": "Payment confirmed",
                "booking": BookingDetailSerializer(booking).data,
            }
        )
    return Response(
        {"detail": "Payment failed", "result": result},
        status=status.HTTP_400_BAD_REQUEST,
    )
