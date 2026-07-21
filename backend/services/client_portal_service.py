import base64
import hashlib
import hmac
import os


def _secret() -> bytes:
    value = os.getenv("PFA_PORTAL_SECRET", "").strip()
    if len(value) < 32:
        raise RuntimeError(
            "PFA_PORTAL_SECRET deve possuir pelo menos 32 caracteres."
        )
    return value.encode("utf-8")


def create_portal_token(portal_id: str, version: int) -> str:
    payload = f"{portal_id}.{version}".encode("utf-8")
    encoded = base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")
    signature = hmac.new(_secret(), encoded.encode("ascii"), hashlib.sha256)
    return f"{encoded}.{signature.hexdigest()}"


def verify_portal_token(token: str) -> tuple[str, int] | None:
    try:
        encoded, received_signature = token.split(".", 1)
        expected_signature = hmac.new(
            _secret(), encoded.encode("ascii"), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(received_signature, expected_signature):
            return None
        padding = "=" * (-len(encoded) % 4)
        decoded = base64.urlsafe_b64decode(encoded + padding).decode("utf-8")
        portal_id, version_text = decoded.rsplit(".", 1)
        return portal_id, int(version_text)
    except (ValueError, UnicodeDecodeError):
        return None


def fingerprint_visitor(ip_address: str, user_agent: str) -> str:
    raw = f"{ip_address}|{user_agent}".encode("utf-8")
    return hmac.new(_secret(), raw, hashlib.sha256).hexdigest()
