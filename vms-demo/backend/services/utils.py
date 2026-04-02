import random
import string
from sqlmodel import Session
from database import Visit, Visitor
from datetime import datetime
import base64
import aiofiles
import os

def generate_short_id(length=6):
    """Generate a random alphanumeric ID."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def create_visit_record(db: Session, data: dict):
    """Create a new visit record in the database."""
    # Find visitor by masked Aadhaar (or create if needed, though usually they are created first)
    # For this demo, we assume the visitor is already in the DB or we create them here.
    
    # 1. Get or Create Visitor
    from sqlmodel import select
    statement = select(Visitor).where(Visitor.aadhaar_masked == data["aadhaarMasked"])
    visitor = db.exec(statement).first()
    
    if not visitor:
        visitor = Visitor(
            name=data["name"],
            aadhaar_masked=data["aadhaarMasked"],
            dob=data.get("dob", "Unknown"),
            gender=data.get("gender", "Unknown"),
            mobile=data.get("mobile", "Unknown")
        )
        db.add(visitor)
        db.commit()
        db.refresh(visitor)
    
    # 2. Create Visit
    visit = Visit(
        visitor_id=visitor.id,
        visit_id_str=data["visitId"],
        purpose=data["purpose"],
        department=data["department"],
        host_officer=data["hostOfficer"],
        duration=data.get("duration", "1-2 Hours"),
        match_score=data.get("faceScore", 0.0),
        risk_level=data.get("riskLevel", "LOW"),
        status=data.get("status", "PENDING"),
        verification_type=data.get("verificationType", "aadhaar_ovse"),
        document_type=data.get("documentType"),
        document_photo_path=data.get("documentPhotoPath"),
        ovse_client_id=data.get("ovseClientId"),
        live_photo_path=data.get("livePhotoPath"),
        aadhaar_photo_path=data.get("aadhaarPhotoPath"),
        aadhaar_encrypted=data.get("aadhaarEncrypted"),
        aadhaar_masked=data.get("aadhaarMasked"),
        pending_otp=data.get("pendingOtp"),
        otp_submitted_at=data.get("otpSubmittedAt"),
        face_match_source=data.get("faceMatchSource", "unknown"),
        liveness_source=data.get("livenessSource", "unknown")
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit

def log_audit_action(db: Session, data: dict):
    """Log an action to the audit/blacklist/logs as per requirements."""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"AUDIT: action={data['action']}, entityId={data['entityId']}, metadata={data['metadata']}")

def check_blacklist(db: Session, aadhaar_masked: str) -> bool:
    """Check if a visitor is on the blacklist."""
    from database import Blacklist
    from sqlmodel import select
    statement = select(Blacklist).where(Blacklist.aadhaar_masked == aadhaar_masked)
    result = db.exec(statement).first()
    return result is not None

def get_recent_visit_count(db: Session, aadhaar_masked: str, days: int = 30) -> int:
    """Count visits for this Aadhaar in the last X days."""
    from database import Visit, Visitor
    from sqlmodel import select, func
    from datetime import datetime, timedelta
    
    since = datetime.utcnow() - timedelta(days=days)
    
    # Need to join Visit and Visitor to filter by Aadhaar
    statement = (
        select(func.count())
        .select_from(Visit)
        .join(Visitor, Visit.visitor_id == Visitor.id)
        .where(Visitor.aadhaar_masked == aadhaar_masked)
        .where(Visit.created_at >= since)
    )
    result = db.exec(statement).one()
    return result

async def save_live_photo(visit_id: str, photo_b64: str) -> str:
    """
    Accepts base64 JPEG string (with or without data URI prefix).
    Saves to uploads/photos/{visit_id}_live.jpg
    Returns the relative file path.
    """
    os.makedirs("uploads/photos", exist_ok=True)
    
    # Strip data URI prefix if present
    if "," in photo_b64:
        photo_b64 = photo_b64.split(",", 1)[1]
    
    file_path = f"uploads/photos/{visit_id}_live.jpg"
    
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(base64.b64decode(photo_b64))
    
    return file_path
