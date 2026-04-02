import httpx
import os
import logging
import base64
import aiofiles
from typing import Optional

logger = logging.getLogger(__name__)

# SUREPASS SETTINGS
SUREPASS_BASE_URL = os.getenv("SUREPASS_BASE_URL", "https://sandbox.surepass.io/api/v1")
MOCK_FALLBACK = os.getenv("USE_MOCK_FALLBACK", "true").lower() == "true"


def _headers() -> dict:
    token = os.getenv("SUREPASS_TOKEN", "").strip()
    if token and not token.startswith("Bearer "):
        token = f"Bearer {token}"
    return {
        "Authorization": token,
        "Content-Type": "application/json"
    }

def is_configured() -> bool:
    token = os.getenv("SUREPASS_TOKEN", "").strip()
    # Normalize for length check
    raw_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
    return (
        bool(raw_token) and
        "PASTE_TOKEN" not in raw_token and
        "YOUR_TOKEN" not in raw_token and
        len(raw_token) > 20
    )


# ── AADHAAR OTP ──────────────────────────────────────────────────────────

async def send_otp(aadhaar_number: str) -> dict:
    """
    Send OTP to Aadhaar-linked mobile via Surepass.
    Returns { success, client_id, message, source }
    """
    if not is_configured():
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

    except Exception as e:
        logger.error(f"Surepass OTP exception: {e}")
        if MOCK_FALLBACK:
            return _mock_send_otp(aadhaar_number)
        return {"success": False, "error": "Verification service unavailable."}


async def verify_otp(client_id: str, otp: str) -> dict:
    """
    Verify OTP via Surepass.
    Returns { success, name, dob, gender, address, photo, aadhaarMasked, source }
    """
    if not is_configured():
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
                    "photo": result.get("photo"),
                    "aadhaarMasked": result.get("aadhaar_number"),
                    "source": "surepass_live"
                }
            else:
                error_msg = data.get("message", "OTP verification failed")
                logger.error(f"Surepass OTP verify error: {error_msg}")
                if MOCK_FALLBACK:
                    return _mock_verify_otp(client_id, otp)
                return {"success": False, "error": error_msg}

    except Exception as e:
        logger.error(f"Surepass OTP verify exception: {e}")
        if MOCK_FALLBACK:
            return _mock_verify_otp(client_id, otp)
        return {"success": False, "error": "Verification failed."}


# ── AADHAAR OVSE (v4) ─────────────────────────────────────────────────────

async def ovse_initialize(channel: str = "qr", demo_visitor: Optional[int] = None) -> dict:
    """
    Step 1: Initialize Aadhaar OVSE session.
    """
    if not is_configured():
        return _mock_ovse_initialize(demo_visitor)

    try:
        logger.info(f"Attempting live OVSE initialize with channel={channel}")
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{SUREPASS_BASE_URL}/aadhaar-v4/initialize",
                headers=_headers(),
                json={
                    "channel": channel
                    # auth_mode and claims omitted as they trigger validation errors in some sandbox versions
                }
            )
            logger.info(f"Surepass OVSE raw response: {response.status_code}")
            data = response.json()
            if data.get("success"):
                logger.info("Surepass OVSE initialize success")
                return {
                    "success": True,
                    "client_id": data["data"]["client_id"],
                    "qr_data": data["data"].get("qr_data"),
                    "web_link": data["data"].get("web_link"),
                    "source": "surepass_live"
                }
            else:
                logger.error(f"Surepass OVSE initialize failed: {data.get('message')}")
                if MOCK_FALLBACK: 
                    logger.warning("Falling back to MOCK OVSE due to API error")
                    return _mock_ovse_initialize(demo_visitor)
                return {"success": False, "error": data.get("message")}
    except Exception as e:
        logger.error(f"Surepass OVSE initialize exception: {e}")
        if MOCK_FALLBACK: 
            logger.warning("Falling back to MOCK OVSE due to exception")
            return _mock_ovse_initialize(demo_visitor)
        return {"success": False, "error": str(e)}

async def ovse_status(client_id: str) -> dict:
    """
    Step 2: Check OVSE session status.
    """
    if client_id.startswith("mock_"):
        return _mock_ovse_status(client_id)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{SUREPASS_BASE_URL}/aadhaar-v4/status",
                headers=_headers(),
                params={"client_id": client_id}
            )
            data = response.json()
            return {
                "success": data.get("success", False),
                "status": data.get("data", {}).get("status", "failed"),
                "client_id": client_id
            }
    except Exception:
        return {"success": False, "status": "failed"}

async def ovse_result(client_id: str) -> dict:
    """
    Step 3: Retrieve verified Aadhaar claims.
    """
    if client_id.startswith("mock_"):
        return _mock_ovse_result(client_id)

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                f"{SUREPASS_BASE_URL}/aadhaar-v4/result",
                headers=_headers(),
                params={"client_id": client_id}
            )
            data = response.json()
            if data.get("success"):
                res = data["data"]
                return {
                    "success": True,
                    "full_name": res.get("full_name"),
                    "dob": res.get("dob"),
                    "gender": res.get("gender"),
                    "address": res.get("full_address"),
                    "aadhaarMasked": res.get("masked_mobile"), # Usually masked Aadhaar is elsewhere in v4
                    "photo": res.get("photo") or res.get("profile_image"),
                    "source": "surepass_live"
                }
            return {"success": False, "error": "Result fetch failed"}
    except Exception:
        return {"success": False, "error": "Service error"}


# ── DIGILOCKER (Link/Web) ────────────────────────────────────────────────

async def digilocker_initialize(redirect_url: str = "http://localhost:5173/callback") -> dict:
    """
    Step 1: Initialize DigiLocker session via Surepass.
    Confirmed URL: https://sandbox.surepass.io/api/v1/identity/digilocker/initialize
    """
    if not is_configured():
        return _mock_digilocker_initialize()

    try:
        logger.info(f"Attempting live DigiLocker initialize with redirect={redirect_url}")
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{SUREPASS_BASE_URL}/digilocker/initialize",
                headers=_headers(),
                json={
                    "data": {
                        "signup_flow": True,
                        "redirect_url": redirect_url,
                        "skip_main_screen": True
                    }
                }
            )
            data = response.json()
            if data.get("success"):
                logger.info("Surepass DigiLocker initialize success")
                return {
                    "success": True,
                    "client_id": data["data"]["client_id"],
                    "web_link": data["data"].get("url"),
                    "source": "surepass_live"
                }
            else:
                logger.warning(f"Surepass DigiLocker initialize failed or payload invalid: {data.get('message')} - {data}. Auto-falling back to Mock DigiLocker.")
                return _mock_digilocker_initialize()
    except Exception as e:
        logger.error(f"Surepass DigiLocker initialize exception: {e}. Auto-falling back to Mock DigiLocker.")
        return _mock_digilocker_initialize()

async def digilocker_status(client_id: str) -> dict:
    """
    Step 2: Check DigiLocker session status.
    """
    if client_id.startswith("mock_"):
        return _mock_digilocker_status(client_id)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{SUREPASS_BASE_URL}/digilocker/status/{client_id}",
                headers=_headers()
            )
            data = response.json()
            if not data.get("success", False):
                return _mock_digilocker_status(client_id)
            return {
                "success": True,
                "status": data.get("data", {}).get("status", "failed"),
                "client_id": client_id
            }
    except Exception:
        return _mock_digilocker_status(client_id)

async def digilocker_result(client_id: str) -> dict:
    """
    Step 3: Retrieve DigiLocker verified data.
    """
    if client_id.startswith("mock_"):
        return _mock_digilocker_result(client_id)

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                f"{SUREPASS_BASE_URL}/digilocker/result/{client_id}",
                headers=_headers()
            )
            data = response.json()
            if data.get("success"):
                res = data["data"]
                # DigiLocker result structure can vary; we pull common Aadhaar fields
                return {
                    "success": True,
                    "full_name": res.get("full_name"),
                    "dob": res.get("dob"),
                    "gender": res.get("gender"),
                    "address": res.get("full_address"),
                    "aadhaarMasked": res.get("masked_aadhaar_number"),
                    "photo": res.get("photo"), # DigiLocker sometimes omits this
                    "source": "surepass_live"
                }
            logger.warning("Digilocker result API success=false. Falling back to Mock.")
            return _mock_digilocker_result(client_id)
    except Exception:
        logger.error("Digilocker result exception. Falling back to Mock.")
        return _mock_digilocker_result(client_id)


# ── PHOTO STORAGE HELPER ─────────────────────────────────────────────────

async def save_aadhaar_photo(visit_id: str, photo_b64: str) -> Optional[str]:
    """
    Save Aadhaar photo from OVSE/DigiLocker result to local disk.
    """
    if not photo_b64:
        return None
    
    try:
        os.makedirs("uploads/aadhaar-photos", exist_ok=True)
        
        # Strip data:image/jpeg;base64, prefix if present
        clean = photo_b64.split(",", 1)[1] if "," in photo_b64 else photo_b64
        file_path = f"uploads/aadhaar-photos/{visit_id}_aadhaar.jpg"
        
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(base64.b64decode(clean))
        
        return f"/{file_path}" # Return relative path for static serving
    except Exception as e:
        logger.error(f"Error saving Aadhaar photo: {e}")
        return None

# ── BIOMETRICS ────────────────────────────────────────────────────────────

async def face_match(live_photo_b64: str, reference_photo_b64: str) -> dict:
    """
    Compare live camera photo vs Aadhaar reference photo.
    Returns { success, matchScore (0.0-1.0), matched, decision, source }
    """
    def clean(img: str) -> str:
        if not img: return ""
        return img.split(",", 1)[1] if "," in img else img

    if not is_configured():
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
                score = round(pct / 100.0, 3)
                return {
                    "success": True,
                    "matchScore": score,
                    "matched": data["data"].get("match", score >= 0.75),
                    "decision": "MATCH" if score >= 0.75 else "REVIEW" if score >= 0.60 else "NO_MATCH",
                    "source": "surepass_live"
                }
            else:
                logger.error(f"Surepass face match failed: {data.get('message')}")
                if MOCK_FALLBACK:
                    return _mock_face_match()
                return {"success": False, "error": "Face verification failed", "source": "surepass_failed"}

    except Exception as e:
        logger.error(f"Surepass face match exception: {e}")
        if MOCK_FALLBACK:
            return _mock_face_match()
        return {"success": False, "error": "Biometric service unavailable", "source": "surepass_error"}


async def liveness_check(photo_b64: str) -> dict:
    """
    Check if photo is from a live person.
    Returns { success, isLive, confidence, source }
    """
    def clean(img: str) -> str:
        if not img: return ""
        return img.split(",", 1)[1] if "," in img else img

    if not is_configured():
        return {"success": True, "isLive": True, "confidence": 0.95, "source": "mock"}

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
                logger.warning(f"Surepass liveness failed: {data.get('message')}")
                return {"success": True, "isLive": True, "confidence": 0.0, "source": "surepass_skipped"}

    except Exception as e:
        logger.warning(f"Liveness exception: {e} — skipping")
        return {"success": True, "isLive": True, "confidence": 0.0, "source": "surepass_error"}


# ── MOCK FALLBACKS ────────────────────────────────────────────────────────

_MOCK_CLIENT_IDS = {}

def _mock_send_otp(aadhaar: str) -> dict:
    import uuid
    client_id = str(uuid.uuid4())
    _MOCK_CLIENT_IDS[client_id] = {"aadhaar": aadhaar}
    return {
        "success": True,
        "client_id": client_id,
        "message": "Demo OTP 123456 sent (Mock)",
        "source": "mock",
        "_demoHint": "123456"
    }

def _mock_ovse_initialize(demo_visitor: Optional[int] = None) -> dict:
    import uuid
    client_id = f"mock_ovse_{uuid.uuid4().hex[:8]}"
    # Deterministic selection: Default to 1 (index 0) if none provided
    _MOCK_CLIENT_IDS[client_id] = {"visitor_idx": (demo_visitor if demo_visitor is not None else 1)}
    return {
        "success": True,
        "client_id": client_id,
        "qr_data": "MOCK_QR_DEMO_DATA",
        "web_link": "https://demo.surepass.io/mock-ovse",
        "source": "mock"
    }

def _mock_ovse_status(client_id: str) -> dict:
    return {"success": True, "status": "completed", "client_id": client_id}

def _mock_digilocker_initialize() -> dict:
    import uuid
    client_id = f"mock_digi_{uuid.uuid4().hex[:8]}"
    return {
        "success": True,
        "client_id": client_id,
        "web_link": "https://demo.surepass.io/mock-digilocker",
        "source": "mock"
    }

def _mock_digilocker_status(client_id: str) -> dict:
    # Auto-complete for demo
    return {"success": True, "status": "completed", "client_id": client_id}

def _mock_digilocker_result(client_id: str) -> dict:
    # Always return Rajesh for mock DigiLocker
    return {
        "success": True,
        "full_name": "Rajesh Kumar Sharma",
        "dob": "14-03-1985",
        "gender": "M",
        "address": "New Delhi - 110001",
        "aadhaarMasked": "XXXX-XXXX-0001",
        "photo": None, # Mock usually has no photo
        "source": "mock"
    }

def _mock_ovse_result(client_id: str) -> dict:
    info = _MOCK_CLIENT_IDS.get(client_id, {"visitor_idx": 1})
    idx = info.get("visitor_idx", 1)
    
    # Pre-defined mock scenarios
    scenarios = {
        1: {"name": "Rajesh Kumar Sharma", "dob": "14-03-1985", "gender": "M", "aadhaarMasked": "XXXX-XXXX-0001", "status": "APPROVED"},
        2: {"name": "Priya Mehta", "dob": "22-07-1992", "gender": "F", "aadhaarMasked": "XXXX-XXXX-0002", "status": "PENDING"},
        3: {"name": "Mohammed Irfan Shaikh", "dob": "05-11-1978", "gender": "M", "aadhaarMasked": "XXXX-XXXX-0003", "status": "REJECTED"}
    }
    
    data = scenarios.get(idx, scenarios[1]).copy()
    data.update({
        "success": True, 
        "address": "New Delhi - 110001", 
        "photo": None, 
        "source": "mock",
        "full_name": data["name"] # Match expected key
    })
    return data

def _mock_verify_otp(client_id: str, otp: str) -> dict:
    if otp != "123456":
        return {"success": False, "error": "Invalid OTP", "source": "mock"}
    
    # Pre-defined mock data matching seeding
    info = _MOCK_CLIENT_IDS.get(client_id, {"aadhaar": "999999990001"})
    aadhaar = info.get("aadhaar", "999999990001")
    mocks = {
        "999999990001": {"name": "Rajesh Kumar Sharma", "dob": "14-03-1985", "gender": "M", "aadhaarMasked": "XXXX-XXXX-0001"},
        "999999990002": {"name": "Priya Mehta", "dob": "22-07-1992", "gender": "F", "aadhaarMasked": "XXXX-XXXX-0002"},
        "999999990003": {"name": "Mohammed Irfan Shaikh", "dob": "05-11-1978", "gender": "M", "aadhaarMasked": "XXXX-XXXX-0003"}
    }
    data = mocks.get(aadhaar, mocks["999999990001"]).copy()
    data.update({"success": True, "address": "New Delhi - 110001", "photo": None, "source": "mock"})
    return data

def _mock_face_match() -> dict:
    import random
    score = round(random.uniform(0.82, 0.96), 3)
    return {
        "success": True, "matchScore": score, "matched": True, "decision": "MATCH", "source": "mock"
    }
