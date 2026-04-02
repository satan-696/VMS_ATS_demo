from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from database import get_session, Visit, Visitor
from services.encryption import encrypt, decrypt
from datetime import datetime
import re
import uuid
from typing import Optional

router = APIRouter(prefix="/api/aadhaar/manual-otp", tags=["aadhaar_manual"])

class AadhaarManualInitRequest(BaseModel):
    full_name: str
    aadhaar_number: str
    purpose: str
    department: str
    host_officer: str
    mobile: Optional[str] = "9999999999"
    live_photo_base64: Optional[str] = None
    document_photo_base64: Optional[str] = None

    @field_validator("aadhaar_number")
    @classmethod
    def validate_aadhaar(cls, v):
        clean = re.sub(r"[\s\-]", "", v)
        if not re.match(r"^\d{12}$", clean):
            raise ValueError("Aadhaar must be exactly 12 digits")
        return clean

class OTPVerifyManualRequest(BaseModel):
    visit_id: str
    otp: str
    
    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v):
        if not re.match(r"^\d{6}$", v):
            raise ValueError("OTP must be exactly 6 digits")
        return v

@router.post("/initiate")
async def initiate_manual_otp(req: AadhaarManualInitRequest, db: Session = Depends(get_session)):
    """
    Step 1: Visitor enters Aadhaar number. We create a pending visit and encrypt Aadhaar.
    """
    try:
        from services.utils import save_live_photo
        from services.surepass_service import save_aadhaar_photo

        # 1. Mask the Aadhaar
        masked = f"XXXX-XXXX-{req.aadhaar_number[-4:]}"
        
        # 2. Encrypt the full Aadhaar
        encrypted = encrypt(req.aadhaar_number)
        
        # 3. Create or Update Visitor
        visitor = db.query(Visitor).filter(Visitor.name == req.full_name, Visitor.mobile == req.mobile).first()
        if not visitor:
            visitor = Visitor(
                name=req.full_name,
                aadhaar_masked=masked,
                dob="As per verification", # To be updated after OTP
                gender="U",
                mobile=req.mobile
            )
            db.add(visitor)
            db.commit()
            db.refresh(visitor)
        
        # 4. Save Photos
        visit_id_str = f"VMS-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
        
        live_photo_path = None
        if req.live_photo_base64:
            live_photo_path = await save_live_photo(visit_id_str, req.live_photo_base64)
            
        doc_photo_path = None
        if req.document_photo_base64:
            # Re-using save_aadhaar_photo pattern (or saving to documents folder)
            import os
            import aiofiles
            import base64
            os.makedirs("uploads/documents", exist_ok=True)
            clean = req.document_photo_base64.split(",", 1)[1] if "," in req.document_photo_base64 else req.document_photo_base64
            filename = f"{uuid.uuid4().hex}.jpg"
            file_path = os.path.join("uploads/documents", filename)
            async with aiofiles.open(file_path, "wb") as f:
                await f.write(base64.b64decode(clean))
            doc_photo_path = filename

        # 5. Create Visit record with status PENDING_MANUAL_OTP
        new_visit = Visit(
            visitor_id=visitor.id,
            visit_id_str=visit_id_str,
            purpose=req.purpose,
            department=req.department,
            host_officer=req.host_officer,
            duration="2 Hours",
            match_score=0.0,
            risk_level="MEDIUM",
            status="PENDING_MANUAL_OTP",
            verification_type="aadhaar_manual_otp",
            aadhaar_encrypted=encrypted,
            aadhaar_masked=masked,
            live_photo_path=live_photo_path,
            document_photo_path=doc_photo_path,
            document_type="aadhaar_card"
        )
        db.add(new_visit)
        db.commit()
        db.refresh(new_visit)
        
        return {
            "success": True,
            "visit_id": visit_id_str,
            "masked_aadhaar": masked,
            "message": "Visit initiated. Please enter OTP after officer triggers it."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit")
async def submit_manual_otp(req: OTPVerifyManualRequest, db: Session = Depends(get_session)):
    """
    Step 2: Visitor enters the OTP they received. We store it for the officer to relay.
    """
    visit = db.query(Visit).filter(Visit.visit_id_str == req.visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    visit.pending_otp = req.otp
    visit.otp_submitted_at = datetime.utcnow()
    db.commit()
    
    return {"success": True, "message": "OTP relayed to officer for verification."}

@router.get("/status/{visit_id}")
async def get_manual_status(visit_id: str, db: Session = Depends(get_session)):
    """
    Polling for kiosk: Check if officer has approved/rejected after OTP.
    """
    visit = db.query(Visit).filter(Visit.visit_id_str == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    return {
        "status": visit.status,
        "otp_received": bool(visit.pending_otp)
    }

# Admin (Sensitive)
@router.get("/aadhaar/{visit_id}")
async def get_full_aadhaar_for_officer(visit_id: str, db: Session = Depends(get_session)):
    """
    Officer view: Decrypts Aadhaar for entry into Tathya portal.
    This action should be logged.
    """
    visit = db.query(Visit).filter(Visit.visit_id_str == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    if not visit.aadhaar_encrypted:
         raise HTTPException(status_code=400, detail="No encrypted Aadhaar available for this visit.")

    full_aadhaar = decrypt(visit.aadhaar_encrypted)
    
    # Optional: Log this access in an Audit table
    print(f"AUDIT: Officer accessed full Aadhaar for {visit_id} at {datetime.now()}")
    
    return {
        "aadhaar_number": full_aadhaar,
        "masked": visit.aadhaar_masked,
        "pending_otp": visit.pending_otp
    }
