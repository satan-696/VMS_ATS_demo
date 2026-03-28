from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
import re
from services.signzy_service import verify_aadhaar, match_faces as signzy_match_faces
from services.surepass_service import (
    send_aadhaar_otp, 
    verify_aadhaar_otp, 
    face_match as surepass_match_faces
)
from services.sandbox_service import (
    send_aadhaar_otp as sandbox_send_otp,
    verify_aadhaar_otp as sandbox_verify_otp
)
from typing import Optional

router = APIRouter(prefix="/api/aadhaar", tags=["aadhaar"])


class AadhaarVerifyRequest(BaseModel):
    uid: str
    
    @field_validator("uid")
    @classmethod
    def validate_uid(cls, v):
        clean = re.sub(r"[\s\-]", "", v)
        if not re.match(r"^\d{12}$", clean):
            raise ValueError("Aadhaar must be exactly 12 digits")
        return clean


class OTPSendRequest(BaseModel):
    uid: str
    
    @field_validator("uid")
    @classmethod
    def validate_uid(cls, v):
        clean = re.sub(r"[\s\-]", "", v)
        if not re.match(r"^\d{12}$", clean):
            raise ValueError("Aadhaar must be exactly 12 digits")
        return clean


class OTPVerifyRequest(BaseModel):
    otp: str
    uid: str
    referenceId: Optional[str] = None
    txnId: Optional[str] = None
    
    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v):
        if not re.match(r"^\d{6}$", v):
            raise ValueError("OTP must be exactly 6 digits")
        return v


class FaceMatchRequest(BaseModel):
    image1: str    # base64 encoded
    image2: str    # base64 encoded


@router.post("/verify")
async def aadhaar_verify(req: AadhaarVerifyRequest):
    """
    Step 1 of manual entry flow.
    Verifies Aadhaar number is valid in UIDAI database.
    Returns demographic signals (NOT full eKYC data).
    """
    result = await verify_aadhaar(req.uid)
    
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail={
                "message": result.get("error", "Aadhaar verification failed"),
                "code": result.get("errorCode"),
                "hindiMessage": "आधार सत्यापन विफल। कृपया पुनः प्रयास करें।"
            }
        )
    
    return {
        "verified": result.get("verified", False),
        "ageBand": result.get("ageBand"),
        "state": result.get("state"),
        "mobileHint": result.get("mobileHint"),
        "gender": result.get("gender"),
        "aadhaarMasked": f"XXXX-XXXX-{req.uid[-4:]}",
        "source": result.get("source"),
        "_isMock": result.get("source") == "mock"
    }


@router.post("/send-otp")
async def aadhaar_send_otp(req: OTPSendRequest):
    """
    Step 1: Send OTP via Surepass (Primary) or Sandbox (Fallback)
    """
    # Primary: Surepass
    result = await send_aadhaar_otp(req.uid)
    
    if not result.get("success"):
        # Manual fallback to Sandbox if Surepass fails and Sandbox is available
        from services.sandbox_service import SANDBOX_API_KEY
        if SANDBOX_API_KEY and SANDBOX_API_KEY != "your_sandbox_key":
            result = await sandbox_send_otp(req.uid)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail={
            "message": result.get("error", "Failed to send OTP"),
            "hindiMessage": "OTP नहीं भेजा जा सका। आधार नंबर जाँचें।"
        })
    
    # Return both referenceId and txnId for backward compatibility
    ref_id = result.get("client_id") or result.get("referenceId")
    return {
        "client_id": ref_id,
        "referenceId": ref_id,
        "txnId": ref_id,
        "message": result.get("message"),
        "_isMock": result.get("source") == "mock",
        "_demoHint": result.get("_demoHint")
    }


@router.post("/verify-otp")  
async def aadhaar_verify_otp(req: OTPVerifyRequest):
    """
    Step 2: Verify OTP via Surepass (Primary) or Sandbox (Fallback)
    """
    ref_id = req.referenceId or req.txnId
    if not ref_id:
        raise HTTPException(status_code=400, detail="referenceId or txnId required")

    # Try Surepass first
    result = await verify_aadhaar_otp(ref_id, req.otp)
    
    # Fallback to Sandbox if Surepass result failed or was a mock mismatch
    if not result.get("success"):
         result = await sandbox_verify_otp(ref_id, req.otp)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail={
            "message": result.get("error", "Invalid OTP"),
            "hindiMessage": "OTP गलत है। कृपया पुनः प्रयास करें।"
        })
    
    return {
        "name": result.get("name"),
        "dob": result.get("dob"),
        "gender": result.get("gender"),
        "address": result.get("address"),
        "photo": result.get("photo"), # Returning real photo for face match reference
        "aadhaarMasked": result.get("aadhaarMasked") or f"XXXX-XXXX-{req.uid[-4:]}",
        "_isMock": result.get("source") == "mock"
    }


@router.get("/health/verification")
async def verification_health():
    """Check connectivity for all identity services"""
    from services.surepass_service import SUREPASS_TOKEN, SUREPASS_BASE_URL, _is_configured as surepass_config
    from services.signzy_service import _is_configured as signzy_config, SIGNZY_BASE_URL, _get_headers
    from services.sandbox_service import SANDBOX_API_KEY
    import httpx
    from datetime import datetime
    
    results = {}
    
    # 1. Check Surepass
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.post(
                f"{SUREPASS_BASE_URL}/aadhaar-v2/generate-otp",
                headers={"Authorization": SUREPASS_TOKEN, "Content-Type": "application/json"},
                json={"id_number": "000000000000"}
            )
            # 401/403/404 = bad config/unreachable, 400/422 = reachable but bad input
            results["surepass"] = "reachable" if r.status_code in [200, 400, 422] else f"error_{r.status_code}"
    except:
        results["surepass"] = "unreachable"

    # 2. Check Signzy
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.post(f"{SIGNZY_BASE_URL}/aadhaar/verify", 
                                headers=_get_headers(), 
                                json={"uid": "000000000000"})
            results["signzy"] = "reachable" if r.status_code in [200, 400] else "error"
    except:
        results["signzy"] = "unreachable"
        
    return {
        "status": "online",
        "surepass_configured": surepass_config(),
        "signzy_configured": signzy_config(),
        "sandbox_configured": bool(SANDBOX_API_KEY and SANDBOX_API_KEY != "your_sandbox_key"),
        "connectivity": results,
        "timestamp": datetime.now().isoformat()
    }


@router.post("/face-match")
async def face_match_api(req: FaceMatchRequest):
    """
    Compare two face images.
    image1: live capture from camera
    image2: reference (from Aadhaar or uploaded)
    Both must be base64 encoded JPEG/PNG.
    """
    if not req.image1 or not req.image2:
        raise HTTPException(status_code=400, detail="Both images required")
    
    result = await match_faces(req.image1, req.image2)
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail={
            "message": "Face verification failed. Please retake photo.",
            "hindiMessage": "चेहरा सत्यापन विफल। फिर से फोटो लें।"
        })
    
    return {
        "matchScore": result.get("matchScore"),
        "matched": result.get("matched"),
        "decision": result.get("decision"),
        "_isMock": result.get("source") == "mock"
    }
