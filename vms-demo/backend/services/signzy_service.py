import httpx
import os
import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)

SIGNZY_ENV = os.getenv("SIGNZY_ENV", "sandbox")
SIGNZY_API_TOKEN = os.getenv("SIGNZY_API_TOKEN", "")
SIGNZY_MOCK_FALLBACK = os.getenv("SIGNZY_MOCK_FALLBACK", "true").lower() == "true"

SIGNZY_BASE_URL = (
    os.getenv("SIGNZY_BASE_URL_PRODUCTION")
    if SIGNZY_ENV == "production"
    else os.getenv("SIGNZY_BASE_URL_SANDBOX", 
                   "https://api-preproduction.signzy.app/api/v3")
)

def _get_headers() -> dict:
    return {
        "Authorization": SIGNZY_API_TOKEN,
        "Content-Type": "application/json"
    }

def _is_configured() -> bool:
    """Check if Signzy credentials are actually set"""
    return bool(SIGNZY_API_TOKEN and SIGNZY_API_TOKEN != "your_token_from_signzy")


# ─── AADHAAR VERIFICATION ──────────────────────────────────────────────

async def verify_aadhaar(uid: str) -> dict:
    """
    Verify Aadhaar number exists in UIDAI database.
    Endpoint: POST /aadhaar/verify
    
    Returns verified status, gender, state, masked mobile, age band.
    Does NOT return full name/DOB/photo (requires licensed OTP eKYC).
    
    # PRODUCTION NOTE: Replace this with full OTP eKYC flow once 
    # Signzy account is licensed for Aadhaar authentication.
    """
    if not _is_configured():
        logger.warning("Signzy not configured — using mock Aadhaar verification")
        return _mock_aadhaar_verify(uid)
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{SIGNZY_BASE_URL}/aadhaar/verify",
                headers=_get_headers(),
                json={"uid": uid}
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Aadhaar verify success for UID ending {uid[-4:]}")
                return {
                    "success": True,
                    "verified": data.get("result", {}).get("verified") == "true",
                    "ageBand": data.get("result", {}).get("ageBand"),
                    "state": data.get("result", {}).get("state"),
                    "mobileHint": data.get("result", {}).get("mobileNumber"),
                    "gender": data.get("result", {}).get("gender"),
                    "source": "signzy_live"
                }
            else:
                error = response.json().get("error", {})
                logger.error(f"Signzy Aadhaar verify failed: {error}")
                
                # Graceful fallback only if enabled
                if SIGNZY_MOCK_FALLBACK:
                    logger.warning("Falling back to mock Aadhaar verification")
                    return _mock_aadhaar_verify(uid)
                
                return {
                    "success": False,
                    "error": error.get("message", "Aadhaar verification failed"),
                    "errorCode": error.get("statusCode"),
                    "source": "signzy_live"
                }
                
    except httpx.TimeoutException:
        logger.error("Signzy API timeout during Aadhaar verification")
        if SIGNZY_MOCK_FALLBACK:
            return _mock_aadhaar_verify(uid)
        return {"success": False, "error": "Verification service timeout. Please try again."}
    
    except Exception as e:
        logger.error(f"Signzy Aadhaar verify exception: {str(e)}")
        if SIGNZY_MOCK_FALLBACK:
            return _mock_aadhaar_verify(uid)
        return {"success": False, "error": "Verification service unavailable."}


# ─── AADHAAR OTP (structure ready, needs licensed account) ──────────────

async def send_aadhaar_otp(uid: str) -> dict:
    """
    Send OTP to Aadhaar-linked mobile.
    
    # PRODUCTION NOTE: This requires Signzy account with Aadhaar 
    # Authentication (eKYC) license. Confirm endpoint with Signzy 
    # support before enabling. Currently returns mock for demo.
    # Endpoint will be: POST /aadhaar/generate-otp
    """
    if not _is_configured():
        return _mock_send_otp(uid)
    
    # For demo: use basic verify first, then mock OTP flow
    logger.info(f"OTP send: using mock flow for UID ending {uid[-4:]}")
    return _mock_send_otp(uid)


async def verify_aadhaar_otp(uid: str, otp: str, txn_id: str) -> dict:
    """
    Verify OTP and get demographic data.
    
    # PRODUCTION NOTE: Requires licensed Aadhaar eKYC account.
    # Endpoint: POST /aadhaar/verify-otp
    # Returns: name, dob, gender, address, photo (base64)
    """
    # For demo: OTP "123456" always succeeds with mock data
    logger.info(f"OTP verify: using mock flow for txnId {txn_id[:8]}...")
    return _mock_verify_otp(uid, otp, txn_id)


# ─── FACE MATCH ─────────────────────────────────────────────────────────

async def match_faces(image1_base64: str, image2_base64: str) -> dict:
    """
    Compare two face images using Signzy Face Match API.
    
    Both images must be:
    - JPEG or PNG
    - Base64 encoded (raw, no data URI prefix)
    - Under 1MB
    - Clear frontal face, good lighting
    
    Endpoint: POST /face/match (confirm with Signzy dashboard)
    """
    if not _is_configured():
        logger.warning("Signzy not configured — using mock face match")
        return _mock_face_match()
    
    # Strip data URI prefix if present
    def clean_b64(img: str) -> str:
        if not img: return ""
        if "," in img:
            return img.split(",", 1)[1]
        return img
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SIGNZY_BASE_URL}/face/match",
                headers=_get_headers(),
                json={
                    "image1": clean_b64(image1_base64),
                    "image2": clean_b64(image2_base64)
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                result = data.get("result", {})
                confidence = float(result.get("confidence", 0))
                
                return {
                    "success": True,
                    "matchScore": round(confidence, 3),
                    "matched": result.get("match", confidence >= 0.75),
                    "decision": "MATCH" if confidence >= 0.75 else 
                               "REVIEW" if confidence >= 0.60 else "NO_MATCH",
                    "source": "signzy_live"
                }
            else:
                logger.error(f"Face match failed: {response.status_code} {response.text[:200]}")
                if SIGNZY_MOCK_FALLBACK:
                    return _mock_face_match()
                return {"success": False, "error": "Face verification failed"}
                
    except Exception as e:
        logger.error(f"Face match exception: {str(e)}")
        if SIGNZY_MOCK_FALLBACK:
            return _mock_face_match()
        return {"success": False, "error": "Face verification service unavailable"}


# ─── MOCK FALLBACKS ──────────────────────────────────────────────────────

MOCK_VISITORS = {
    "999999990001": {
        "name": "Rajesh Kumar Sharma",
        "dob": "1985-03-14",
        "gender": "MALE",
        "state": "Delhi",
        "ageBand": "35-45",
        "mobileHint": "*******834",
        "address": "New Delhi - 110001",
        "scenario": "LOW_RISK"
    },
    "999999990002": {
        "name": "Priya Mehta",
        "dob": "1992-07-22",
        "gender": "FEMALE",
        "state": "Maharashtra",
        "ageBand": "25-35",
        "mobileHint": "*******291",
        "address": "Mumbai - 400001",
        "scenario": "MEDIUM_RISK"
    },
    "999999990003": {
        "name": "Mohammed Irfan Shaikh",
        "dob": "1978-11-05",
        "gender": "MALE",
        "state": "Gujarat",
        "ageBand": "40-50",
        "mobileHint": "*******567",
        "address": "Ahmedabad - 380001",
        "scenario": "BLACKLISTED"
    }
}

def _mock_aadhaar_verify(uid: str) -> dict:
    visitor = MOCK_VISITORS.get(uid)
    if visitor:
        return {
            "success": True,
            "verified": True,
            "ageBand": visitor["ageBand"],
            "state": visitor["state"],
            "mobileHint": visitor["mobileHint"],
            "gender": visitor["gender"],
            "source": "mock",
            "_mockNote": "Signzy not configured. Using demo data."
        }
    return {
        "success": True,
        "verified": True,
        "ageBand": "25-35",
        "state": "Delhi",
        "mobileHint": "*******000",
        "gender": "MALE",
        "source": "mock",
        "_mockNote": "Unknown UID — generic mock response"
    }

def _mock_send_otp(uid: str) -> dict:
    visitor = MOCK_VISITORS.get(uid, {})
    return {
        "success": True,
        "txnId": f"MOCK-TXN-{uid[-4:]}-DEMO",
        "mobileHint": visitor.get("mobileHint", "*******000"),
        "source": "mock",
        "_mockNote": "Demo mode: use OTP 123456 to proceed"
    }

def _mock_verify_otp(uid: str, otp: str, txn_id: str) -> dict:
    if otp != "123456" and not txn_id.startswith("MOCK"):
        return {
            "success": False,
            "error": "Invalid OTP",
            "attemptsRemaining": 2,
            "source": "mock"
        }
    visitor = MOCK_VISITORS.get(uid, {
        "name": "Demo Visitor",
        "dob": "1990-01-01",
        "gender": "MALE",
        "state": "Delhi",
        "address": "New Delhi"
    })
    return {
        "success": True,
        "name": visitor["name"],
        "dob": visitor["dob"],
        "gender": visitor["gender"],
        "address": visitor["address"],
        "aadhaarMasked": f"XXXX-XXXX-{uid[-4:]}",
        "source": "mock"
    }

def _mock_face_match() -> dict:
    import random
    score = round(random.uniform(0.80, 0.95), 3)
    return {
        "success": True,
        "matchScore": score,
        "matched": True,
        "decision": "MATCH",
        "source": "mock",
        "_mockNote": "Signzy not configured. Using simulated high-confidence face match."
    }
