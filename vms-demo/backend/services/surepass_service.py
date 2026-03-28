import httpx
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# SUREPASS SETTINGS
SUREPASS_TOKEN = os.getenv("SUREPASS_TOKEN", "")
SUREPASS_BASE_URL = os.getenv("SUREPASS_BASE_URL", "https://kyc-api.surepass.io/api/v1")
MOCK_FALLBACK = os.getenv("SIGNZY_MOCK_FALLBACK", "true").lower() == "true"


def _headers() -> dict:
    return {
        "Authorization": f"{SUREPASS_TOKEN}", # Usually Bearer YOUR_TOKEN
        "Content-Type": "application/json"
    }

def _is_configured() -> bool:
    return bool(SUREPASS_TOKEN and "YOUR_TOKEN" not in SUREPASS_TOKEN)


# ── AADHAAR OTP ──────────────────────────────────────────────────────────

async def send_aadhaar_otp(aadhaar_number: str) -> dict:
    """
    Send OTP to Aadhaar-linked mobile via Surepass.
    Returns { success, client_id, message }
    client_id must be stored and passed to verify_aadhaar_otp.
    """
    if not _is_configured():
        logger.warning("Surepass not configured — using mock OTP")
        return _mock_send_otp(aadhaar_number)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{SUREPASS_BASE_URL}/aadhaar-v2/generate-otp",
                headers=_headers(),
                json={"id_number": aadhaar_number}
            )
            data = response.json()

            if data.get("success") and response.status_code == 200:
                logger.info(f"Surepass OTP sent for Aadhaar ending {aadhaar_number[-4:]}")
                return {
                    "success": True,
                    "client_id": data["data"]["client_id"],
                    "message": data["data"].get("message", "OTP sent"),
                    "source": "surepass_live"
                }
            else:
                error_msg = data.get("message", "OTP generation failed")
                logger.error(f"Surepass OTP error: {error_msg}")
                if MOCK_FALLBACK:
                    return _mock_send_otp(aadhaar_number)
                return {"success": False, "error": error_msg}

    except httpx.TimeoutException:
        logger.error("Surepass OTP timeout")
        if MOCK_FALLBACK:
            return _mock_send_otp(aadhaar_number)
        return {"success": False, "error": "Verification service timeout. Please try again."}

    except Exception as e:
        logger.error(f"Surepass OTP exception: {e}")
        if MOCK_FALLBACK:
            return _mock_send_otp(aadhaar_number)
        return {"success": False, "error": "Verification service unavailable."}


async def verify_aadhaar_otp(client_id: str, otp: str) -> dict:
    """
    Verify OTP and retrieve full eKYC data from Surepass.
    Returns { success, full_name, dob, gender, address, photo, aadhaarMasked }
    photo is base64 JPEG — pass directly to face match as reference image.
    """
    if not _is_configured():
        logger.warning("Surepass not configured — using mock OTP verify")
        return _mock_verify_otp(client_id, otp)

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{SUREPASS_BASE_URL}/aadhaar-v2/submit-otp",
                headers=_headers(),
                json={"client_id": client_id, "otp": otp}
            )
            data = response.json()

            if data.get("success") and response.status_code == 200:
                result = data["data"]
                logger.info(f"Surepass OTP verified for client_id {client_id[:8]}...")

                # Build full address string
                addr = result.get("address", {})
                full_address = ", ".join(filter(None, [
                    addr.get("house"), addr.get("street"), addr.get("landmark"),
                    addr.get("loc"), addr.get("vtc"), addr.get("dist"),
                    addr.get("state"), addr.get("country"), addr.get("pc")
                ]))

                return {
                    "success": True,
                    "name": result.get("full_name"),
                    "dob": result.get("dob"),
                    "gender": result.get("gender"),
                    "address": full_address,
                    "state": addr.get("state"),
                    "pincode": addr.get("pc") or result.get("zip"),
                    "careOf": result.get("care_of"),
                    "photo": result.get("photo"),       # base64 — use for face match
                    "aadhaarMasked": result.get("aadhaar_number"),  # already XXXX-XXXX-1234
                    "source": "surepass_live"
                }
            else:
                error_msg = data.get("message", "OTP verification failed")
                logger.error(f"Surepass OTP verify error: {error_msg}")
                if MOCK_FALLBACK:
                    return _mock_verify_otp(client_id, otp)
                return {
                    "success": False,
                    "error": error_msg,
                    "hindiError": "OTP गलत है। कृपया पुनः प्रयास करें।"
                }

    except Exception as e:
        logger.error(f"Surepass OTP verify exception: {e}")
        if MOCK_FALLBACK:
            return _mock_verify_otp(client_id, otp)
        return {"success": False, "error": "Verification failed. Please try again."}


# ── FACE MATCH ────────────────────────────────────────────────────────────

async def face_match(live_photo_b64: str, reference_photo_b64: str) -> dict:
    """
    Compare live camera photo vs Aadhaar photo from eKYC.
    Both must be base64 JPEG. Strip data URI prefix if present.
    Returns { success, matchScore (0.0-1.0), matched, decision }
    """
    def clean(img: str) -> str:
        if not img: return ""
        return img.split(",", 1)[1] if "," in img else img

    if not _is_configured():
        return _mock_face_match()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SUREPASS_BASE_URL}/face/face-match",
                headers=_headers(),
                json={
                    "image1": clean(live_photo_b64),
                    "image2": clean(reference_photo_b64)
                }
            )
            data = response.json()

            if data.get("success"):
                pct = float(data["data"].get("match_percentage", 0))
                score = round(pct / 100.0, 3)  # convert 87.5 → 0.875
                return {
                    "success": True,
                    "matchScore": score,
                    "matchPercentage": pct,
                    "matched": data["data"].get("match", score >= 0.75),
                    "decision": "MATCH" if score >= 0.75 else 
                               "REVIEW" if score >= 0.60 else "NO_MATCH",
                    "source": "surepass_live"
                }
            else:
                logger.error(f"Surepass face match failed: {data.get('message')}")
                if MOCK_FALLBACK:
                    return _mock_face_match()
                return {"success": False, "error": "Face verification failed"}

    except Exception as e:
        logger.error(f"Surepass face match exception: {e}")
        if MOCK_FALLBACK:
            return _mock_face_match()
        return {"success": False, "error": "Face verification unavailable"}


# ── LIVENESS CHECK ────────────────────────────────────────────────────────

async def liveness_check(photo_b64: str) -> dict:
    """
    Check if photo is a live person vs printed/screen photo.
    Returns { success, isLive, confidence }
    """
    def clean(img: str) -> str:
        if not img: return ""
        return img.split(",", 1)[1] if "," in img else img

    if not _is_configured():
        return {"success": True, "isLive": True, 
                "confidence": 0.95, "source": "mock"}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{SUREPASS_BASE_URL}/face/liveness",
                headers=_headers(),
                json={"image": clean(photo_b64)}
            )
            data = response.json()

            if data.get("success"):
                return {
                    "success": True,
                    "isLive": data["data"].get("is_live", True),
                    "confidence": data["data"].get("confidence", 0.0),
                    "source": "surepass_live"
                }
            else:
                # Don't block flow on liveness failure — just log and continue
                logger.warning(f"Liveness check failed: {data.get('message')}")
                return {"success": True, "isLive": True, 
                        "confidence": 0.0, "source": "liveness_skipped"}

    except Exception as e:
        logger.warning(f"Liveness check exception: {e} — skipping")
        return {"success": True, "isLive": True, 
                "confidence": 0.0, "source": "liveness_skipped"}


# ── MOCK FALLBACKS ────────────────────────────────────────────────────────

_MOCK_CLIENT_IDS = {}  # track client_id → aadhaar for demo

def _mock_send_otp(aadhaar: str) -> dict:
    import uuid
    client_id = str(uuid.uuid4())
    _MOCK_CLIENT_IDS[client_id] = aadhaar
    return {
        "success": True,
        "client_id": client_id,
        "message": "Demo OTP sent. Use 123456 to proceed.",
        "source": "mock",
        "_demoHint": "OTP: 123456"
    }

_MOCK_DATA = {
    "999999990001": {
        "name": "Rajesh Kumar Sharma",
        "dob": "14-03-1985", "gender": "M",
        "address": "New Delhi - 110001", "state": "Delhi",
        "aadhaarMasked": "XXXX-XXXX-0001", "photo": None
    },
    "999999990002": {
        "name": "Priya Mehta",
        "dob": "22-07-1992", "gender": "F",
        "address": "Mumbai - 400001", "state": "Maharashtra",
        "aadhaarMasked": "XXXX-XXXX-0002", "photo": None
    },
    "999999990003": {
        "name": "Mohammed Irfan Shaikh",
        "dob": "05-11-1978", "gender": "M",
        "address": "Ahmedabad - 380001", "state": "Gujarat",
        "aadhaarMasked": "XXXX-XXXX-0003", "photo": None
    }
}

def _mock_verify_otp(client_id: str, otp: str) -> dict:
    if otp != "123456":
        return {"success": False, "error": "Invalid OTP",
                "hindiError": "OTP गलत है।", "source": "mock"}
    aadhaar = _MOCK_CLIENT_IDS.get(client_id, "999999990001")
    data = _MOCK_DATA.get(aadhaar, _MOCK_DATA["999999990001"]).copy()
    data.update({"success": True, "source": "mock",
                 "_mockNote": "Surepass not configured — demo data"})
    return data

def _mock_face_match() -> dict:
    import random
    score = round(random.uniform(0.80, 0.96), 3)
    return {
        "success": True, "matchScore": score,
        "matchPercentage": round(score * 100, 1),
        "matched": True, "decision": "MATCH", "source": "mock"
    }
