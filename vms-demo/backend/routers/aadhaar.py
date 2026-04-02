from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
import re
from services.surepass_service import (
    send_otp, 
    verify_otp, 
    face_match,
    ovse_initialize,
    ovse_status,
    ovse_result,
    digilocker_initialize,
    digilocker_status,
    digilocker_result
)
from typing import Optional

router = APIRouter(prefix="/api/aadhaar", tags=["aadhaar"])

class OVSEInitializeRequest(BaseModel):
    channel: Optional[str] = "qr"
    demo_visitor: Optional[int] = None # 1, 2, or 3


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
    client_id: Optional[str] = None # Added for compatibility
    
    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v):
        if not re.match(r"^\d{6}$", v):
            raise ValueError("OTP must be exactly 6 digits")
        return v


class FaceMatchRequest(BaseModel):
    image1: str    # base64 encoded
    image2: str    # base64 encoded


@router.post("/send-otp")
async def aadhaar_send_otp(req: OTPSendRequest):
    """
    Step 1: Send OTP via Surepass.io
    """
    result = await send_otp(req.uid)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail={
            "message": result.get("error", "Failed to send OTP"),
            "hindiMessage": "OTP नहीं भेजा जा सका। आधार नंबर जाँचें।"
        })
    
    # Return client_id, referenceId, and txnId for maximum backward compatibility
    ref_id = result.get("client_id")
    return {
        "client_id": ref_id,
        "referenceId": ref_id,
        "txnId": ref_id,
        "message": result.get("message"),
        "source": result.get("source"),
        "_isMock": result.get("source") == "mock",
        "_demoHint": result.get("_demoHint")
    }


@router.post("/verify-otp")  
async def aadhaar_verify_otp(req: OTPVerifyRequest):
    """
    Step 2: Verify OTP via Surepass.io
    """
    ref_id = req.client_id or req.referenceId or req.txnId
    if not ref_id:
        raise HTTPException(status_code=400, detail="client_id, referenceId or txnId required")

    result = await verify_otp(ref_id, req.otp)
    
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
        "photo": result.get("photo"), 
        "aadhaarMasked": result.get("aadhaarMasked"),
        "source": result.get("source"),
        "_isMock": result.get("source") == "mock"
    }


@router.post("/ovse/initialize")
async def ovse_initialize_api(req: OVSEInitializeRequest):
    """
    Step 1: Initialize Aadhaar OVSE session
    """
    result = await ovse_initialize(req.channel, req.demo_visitor)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return {
        "client_id": result.get("client_id"),
        "qr_data": result.get("qr_data"),
        "web_link": result.get("web_link"),
        "source": result.get("source"),
        "expires_in": 300
    }

@router.get("/ovse/status/{client_id}")
async def ovse_status_api(client_id: str):
    """
    Step 2: Check OVSE session status (Polling)
    """
    result = await ovse_status(client_id)
    return result

@router.get("/ovse/result/{client_id}")
async def ovse_result_api(client_id: str):
    """
    Step 3: Retrieve verified Aadhaar claims
    """
    result = await ovse_result(client_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result

@router.post("/face-match")
async def face_match_api(req: FaceMatchRequest):
    """
    Compare live camera photo vs Aadhaar reference photo.
    """
    if not req.image1 or not req.image2:
        raise HTTPException(status_code=400, detail="Both images required")
    
    result = await face_match(req.image1, req.image2)
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail={
            "message": result.get("error", "Face verification failed"),
            "hindiMessage": "चेहरा सत्यापन विफल। फिर से फोटो लें।"
        })
    
    return {
        "matchScore": result.get("matchScore"),
        "matched": result.get("matched"),
        "decision": result.get("decision"),
        "source": result.get("source"),
        "_isMock": result.get("source") == "mock"
    }


# ── DIGILOCKER ENDPOINTS ──────────────────────────────────────────────────

@router.post("/digilocker/initialize")
async def digilocker_initialize_api(req: Optional[dict] = None):
    """
    Step 1: Initialize DigiLocker session
    """
    redirect_url = req.get("redirect_url") if req else "http://localhost:5173/callback"
    result = await digilocker_initialize(redirect_url)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.get("/digilocker/status/{client_id}")
async def digilocker_status_api(client_id: str):
    """
    Step 2: Check DigiLocker session status
    """
    result = await digilocker_status(client_id)
    return result

@router.get("/digilocker/result/{client_id}")
async def digilocker_result_api(client_id: str):
    """
    Step 3: Retrieve verified DigiLocker claims
    """
    result = await digilocker_result(client_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result
