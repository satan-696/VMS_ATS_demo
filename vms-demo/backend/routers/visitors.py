from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlmodel import Session, select, func
from database import get_session, Visitor, Visit, Blacklist
from services.risk_engine import calculate_risk
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import uuid
import aiofiles

router = APIRouter(prefix="/api", tags=["visitors"])

@router.post("/visitors/manual-document")
async def register_manual_document(
    document_type: str = Form(...),
    full_name: str = Form(...),
    purpose: str = Form(...),
    department: str = Form(...),
    host_officer: str = Form(...),
    document_photo: UploadFile = File(...),
    live_photo_base64: str = Form(...),
    db: Session = Depends(get_session)
):
    """
    Path B: Manual document submission for visitors without Aadhaar/mAadhaar.
    Now includes mandatory live photo capture.
    """
    from services.utils import generate_short_id, create_visit_record, save_live_photo
    
    # 1. Save File
    upload_dir = os.getenv("UPLOAD_DIR", "uploads/documents")
    os.makedirs(upload_dir, exist_ok=True)
    
    ext = os.path.splitext(document_photo.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, filename)
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await document_photo.read()
        await out_file.write(content)

    # 2. Setup & Save Live Photo
    now = datetime.now()
    visit_id = f"VMS-{now.strftime('%Y%m%d')}-{generate_short_id()}"
    
    live_photo_path = await save_live_photo(visit_id, live_photo_base64)
    
    # Use a placeholder Aadhaar-masked for manual entries
    aadhaar_placeholder = f"MANUAL-{uuid.uuid4().hex[:6].upper()}"

    # 3. Create Visit (PENDING_MANUAL_REVIEW)
    visit = create_visit_record(db, {
        "visitId": visit_id,
        "aadhaarMasked": aadhaar_placeholder,
        "name": full_name,
        "purpose": purpose,
        "department": department,
        "hostOfficer": host_officer,
        "duration": "1-2 Hours",
        "faceScore": 0.0,
        "riskScore": 0.5,
        "riskLevel": "MEDIUM",
        "status": "PENDING_MANUAL_REVIEW", # Explicit state for admin UI
        "verificationType": "manual_document",
        "documentType": document_type,
        "documentPhotoPath": filename,
        "livePhotoPath": live_photo_path,
        "faceMatchSource": "manual",
        "livenessSource": "manual"
    })

    return {
        "visitId": visit_id,
        "status": "PENDING_MANUAL_REVIEW",
        "live_photo_url": f"/uploads/photos/{visit_id}_live.jpg",
        "message": "Your documents have been submitted for officer review.",
        "estimated_wait": "10-15 minutes"
    }

class RegisterVisitorRequest(BaseModel):
    name: str
    aadhaar_masked: str
    dob: str
    gender: str
    mobile: str
    live_photo_base64: Optional[str] = None
    reference_photo_base64: Optional[str] = None
    referencePhotoBase64: Optional[str] = None # Added for compatibility
    purpose: str
    department: str
    host_officer: str
    duration: str
    department_sensitivity: Optional[str] = "NORMAL"
    is_mock_verification: Optional[bool] = False
    ovse_client_id: Optional[str] = None # Track OVSE session
    verification_type: Optional[str] = "aadhaar_ovse"

@router.post("/visitors/register")
async def register_visitor(req: RegisterVisitorRequest, db: Session = Depends(get_session)):
    """
    Consolidated visitor registration using Surepass.io.
    Implements risk modifiers for liveness failure and missing photos.
    """
    from services.surepass_service import liveness_check, face_match as surepass_face_match
    from services.risk_engine import calculate_risk
    from services.utils import (
        check_blacklist, 
        get_recent_visit_count, 
        generate_short_id, 
        create_visit_record,
        log_audit_action,
        save_live_photo
    )
    from services.surepass_service import save_aadhaar_photo
    
    # 0. Setup
    now = datetime.now()
    ref_photo = req.reference_photo_base64 or req.referencePhotoBase64
    liveness_modifier = 0.0
    liveness_source = "not_checked"

    # 1. Liveness check
    if req.live_photo_base64:
        liveness = await liveness_check(req.live_photo_base64)
        liveness_source = liveness.get("source", "unknown")
        
        # If liveness fails, we don't reject, we add a risk penalty
        if not liveness.get("isLive", True):
            liveness_modifier = 0.2 # Increase risk score
            # Note: We still allow the flow to continue as per new policy

    # 2. Check blacklist
    is_blacklisted = check_blacklist(db, req.aadhaar_masked)
    
    # 3. Face match
    face_result = {"matchScore": 0.5, "matched": False, "decision": "NO_PHOTO", "source": "no_photo"}
    
    if req.live_photo_base64 and ref_photo:
        face_result = await surepass_face_match(req.live_photo_base64, ref_photo)
    elif req.live_photo_base64:
        # Live photo but no reference photo (uncommon in eKYC flow)
        face_result = {"matchScore": 0.5, "matched": False, "decision": "NO_REF_PHOTO", "source": "system"}
    
    face_score = face_result.get("matchScore", 0.5)
    
    # 4. Risk calculation
    is_odd_hours = now.hour < 8 or now.hour >= 19
    visit_count = get_recent_visit_count(db, req.aadhaar_masked, days=30)
    
    risk = calculate_risk(
        face_score=face_score,
        is_blacklisted=is_blacklisted,
        visit_frequency=visit_count,
        is_odd_hours=is_odd_hours,
        department_sensitivity=req.department_sensitivity or "NORMAL"
    )

    # Apply Liveness Penalty
    risk["riskScore"] = min(1.0, risk.get("riskScore", 0.0) + liveness_modifier)
    if risk["riskScore"] > 0.7 and risk["action"] == "AUTO_APPROVE":
        risk["action"] = "OFFICER_REVIEW"
        risk["riskLevel"] = "HIGH"

    # Demo-mode override: allow pass generation for non-blacklisted mock users.
    if req.is_mock_verification and not is_blacklisted and risk["action"] == "REJECT":
        risk["action"] = "AUTO_APPROVE"
        risk["riskLevel"] = "LOW"
        risk["riskScore"] = min(risk.get("riskScore", 0.0), 0.32)
    
    # 5. Create visit record & Save Live Photo
    visit_id = f"VMS-{now.strftime('%Y%m%d')}-{generate_short_id()}"
    
    live_photo_path = None
    if req.live_photo_base64:
        live_photo_path = await save_live_photo(visit_id, req.live_photo_base64)
    
    # 5.1 Save Aadhaar Photo (if available from OVSE/DigiLocker)
    aadhaar_photo_path = None
    if ref_photo and (req.verification_type in ['aadhaar_ovse', 'digilocker']):
        aadhaar_photo_path = await save_aadhaar_photo(visit_id, ref_photo)
    
    status_map = {
        "AUTO_APPROVE": "APPROVED",
        "OFFICER_REVIEW": "PENDING",
        "REJECT": "REJECTED"
    }
    status = status_map.get(risk["action"], "PENDING")
    
    visit = create_visit_record(db, {
        "visitId": visit_id,
        "aadhaarMasked": req.aadhaar_masked,
        "name": req.name,
        "dob": req.dob,
        "gender": req.gender,
        "mobile": req.mobile,
        "purpose": req.purpose,
        "department": req.department,
        "hostOfficer": req.host_officer,
        "duration": req.duration,
        "faceScore": face_score,
        "riskScore": risk["riskScore"],
        "riskLevel": risk["riskLevel"],
        "status": status,
        "verificationType": req.verification_type or "aadhaar_ovse",
        "ovseClientId": req.ovse_client_id,
        "livePhotoPath": live_photo_path,
        "aadhaarPhotoPath": aadhaar_photo_path,
        "faceMatchSource": face_result.get("source", "unknown"),
        "livenessSource": liveness_source
    })
    
    # 6. Log to audit
    log_audit_action(db, {
        "action": "REGISTRATION",
        "entityId": visit_id,
        "metadata": {
            "faceScore": face_score,
            "riskScore": risk["riskScore"],
            "riskLevel": risk["riskLevel"],
            "action": risk["action"],
            "blacklisted": is_blacklisted,
            "faceSource": face_result.get("source"),
            "livenessSource": liveness_source
        }
    })
    
    return {
        "visitId": visit_id,
        "status": status,
        "live_photo_url": f"/uploads/photos/{visit_id}_live.jpg" if live_photo_path else None,
        "faceScore": face_score,
        "riskScore": risk["riskScore"],
        "riskLevel": risk["riskLevel"],
        "action": risk["action"],
        "message": {
            "AUTO_APPROVE": "Access approved. Gate pass generated.",
            "OFFICER_REVIEW": "Under review. Officer will approve shortly.",
            "REJECT": "Entry not permitted at this time."
        }.get(risk["action"], "Under review.")
    }

@router.get("/stats")
async def get_stats(session: Session = Depends(get_session)):
    all_visits = session.exec(select(Visit)).all()
    today_count = len(all_visits)
    approved = len([v for v in all_visits if v.status == "APPROVED"])
    pending = len([v for v in all_visits if v.status == "PENDING"])
    rejected = len([v for v in all_visits if v.status == "REJECTED"])
    
    return {
        "today_visits": today_count,
        "approved": approved,
        "pending": pending,
        "rejected": rejected,
        "on_premise": approved 
    }

@router.get("/approvals/pending")
async def get_pending_approvals(session: Session = Depends(get_session)):
    # Fetch PENDING, PENDING_MANUAL_REVIEW, and PENDING_MANUAL_OTP
    statement = select(Visit, Visitor).where(Visit.status.in_(["PENDING", "PENDING_MANUAL_REVIEW", "PENDING_MANUAL_OTP"])).where(Visit.visitor_id == Visitor.id)
    results = session.exec(statement).all()
    
    return [
        {
            "visit_id": v.visit_id_str,
            "visitor_name": vr.name,
            "purpose": v.purpose,
            "department": v.department,
            "host_officer": v.host_officer,
            "risk_level": v.risk_level,
            "match_score": v.match_score,
            "status": v.status,
            "verification_type": v.verification_type,
            "document_type": v.document_type,
            "document_photo_path": f"/uploads/documents/{v.document_photo_path}" if v.document_photo_path else None,
            "live_photo_url": f"/uploads/photos/{v.visit_id_str}_live.jpg" if v.live_photo_path else None,
            "aadhaar_photo_url": v.aadhaar_photo_path, 
            "aadhaar_masked": v.aadhaar_masked,
            "face_match_source": v.face_match_source,
            "liveness_source": v.liveness_source,
            "created_at": v.created_at.isoformat()
        } for v, vr in results
    ]

@router.get("/visits")
async def get_all_visits(session: Session = Depends(get_session)):
    statement = select(Visit, Visitor).where(Visit.visitor_id == Visitor.id).order_by(Visit.created_at.desc())
    results = session.exec(statement).all()
    
    return [
        {
            "visit_id": v.visit_id_str,
            "visitor_name": vr.name,
            "purpose": v.purpose,
            "department": v.department,
            "host_officer": v.host_officer,
            "risk_level": v.risk_level,
            "match_score": v.match_score,
            "face_match_source": v.face_match_source,
            "liveness_source": v.liveness_source,
            "status": v.status,
            "verification_type": v.verification_type,
            "document_type": v.document_type,
            "document_photo_path": f"/uploads/documents/{v.document_photo_path}" if v.document_photo_path else None,
            "live_photo_url": f"/uploads/photos/{v.visit_id_str}_live.jpg" if v.live_photo_path else None,
            "aadhaar_photo_url": v.aadhaar_photo_path,
            "aadhaar_masked": v.aadhaar_masked,
            "created_at": v.created_at.isoformat()
        } for v, vr in results
    ]

@router.post("/approvals/{visit_id}/approve")
async def approve_visit(visit_id: str, session: Session = Depends(get_session)):
    statement = select(Visit).where(Visit.visit_id_str == visit_id)
    visit = session.exec(statement).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    visit.status = "APPROVED"
    session.add(visit)
    session.commit()
    return {"message": "Visit approved"}

@router.post("/approvals/{visit_id}/reject")
async def reject_visit(visit_id: str, session: Session = Depends(get_session)):
    statement = select(Visit).where(Visit.visit_id_str == visit_id)
    visit = session.exec(statement).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    visit.status = "REJECTED"
    session.add(visit)
    session.commit()
    return {"message": "Visit rejected"}

@router.get("/visits/{visit_id}/status")
async def get_visit_status(visit_id: str, session: Session = Depends(get_session)):
    """Kiosk polls this to auto-update when admin approves/rejects a pending visit."""
    statement = select(Visit, Visitor).where(Visit.visit_id_str == visit_id).where(Visit.visitor_id == Visitor.id)
    result = session.exec(statement).first()
    if not result:
        raise HTTPException(status_code=404, detail="Visit not found")
    visit, visitor = result
    return {
        "visitId": visit.visit_id_str,
        "status": visit.status,
        "visitor_name": visitor.name,
        "department": visit.department,
        "host_officer": visit.host_officer,
        "verification_type": visit.verification_type,
        "live_photo_url": f"/uploads/photos/{visit.visit_id_str}_live.jpg" if visit.live_photo_path else None,
        "aadhaar_photo_url": visit.aadhaar_photo_path,
        "aadhaar_masked": visit.aadhaar_masked
    }
