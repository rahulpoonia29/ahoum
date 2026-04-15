import uuid


def create_payment_intent(amount_cents: int, currency: str = "usd") -> dict:
    """Return a mock payment intent dict."""
    return {
        "id": f"pi_{uuid.uuid4().hex[:8]}",
        "amount": amount_cents,
        "currency": currency,
        "status": "requires_payment",
    }


def confirm_payment_intent(intent_id: str) -> dict:
    return {"id": intent_id, "status": "succeeded"}
