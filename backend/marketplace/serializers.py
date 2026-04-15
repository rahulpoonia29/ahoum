from rest_framework import serializers

from .models import Booking, Session


class SessionSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField()

    class Meta:
        model = Session
        fields = (
            "id",
            "creator",
            "title",
            "description",
            "price",
            "start_time",
            "end_time",
            "max_participants",
            "cover_image",
        )


class SessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = (
            "id",
            "title",
            "description",
            "price",
            "start_time",
            "end_time",
            "max_participants",
            "cover_image",
        )

    def create(self, validated_data):
        request = self.context.get("request")
        session = Session(creator=request.user, **validated_data)
        session.full_clean()
        session.save()
        return session


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ("id", "session", "status", "payment_reference", "created_at")
        read_only_fields = ("id", "status", "payment_reference", "created_at")


class BookingDetailSerializer(serializers.ModelSerializer):
    session = SessionSerializer()
    user = serializers.StringRelatedField()

    class Meta:
        model = Booking
        fields = ("id", "session", "user", "status", "payment_reference", "created_at")
