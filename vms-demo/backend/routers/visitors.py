from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from database import get_session, Visitor, Visit, Blacklist
from services.risk_engine import calculate_risk
from services.face_service import mock_match_face
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api", tags=["visitors"])

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

@router.post("/visitors/register")
async def register_visitor(req: RegisterVisitorRequest, db: Session = Depends(get_session)):
    """
    Full visitor registration with Surepass Liveness + Face Match + Risk Engine.
    """
    from services.surepass_service import liveness_check, face_match as surepass_face_match
    from services.signzy_service import match_faces as signzy_face_match
    from services.risk_engine import calculate_risk
    from services.utils import (
        check_blacklist, 
        get_recent_visit_count, 
        generate_short_id, 
        create_visit_record,
        log_audit_action
    )
    from datetime import datetime
    
    # 0. Get the correct reference photo
    ref_photo = req.reference_photo_base64 or req.referencePhotoBase64

    # 1. Liveness check (if live photo provided)
    if req.live_photo_base64:
        liveness = await liveness_check(req.live_photo_base64)
        if not liveness.get("isLive") and liveness.get("source") == "surepass_live":
            raise HTTPException(status_code=400, detail={
                "message": "Liveness check failed. Please retake photo in good lighting.",
                "hindiMessage": "फोटो सही नहीं है। कृपया अच्छी रोशनी में फिर से फोटो लें।"
            })

    # 2. Check blacklist
    is_blacklisted = check_blacklist(db, req.aadhaar_masked)
    
    # 3. Face match
    face_result = {"matchScore": 0.0, "matched": False, "decision": "NO_PHOTO", "source": "mock"}
    
    if req.live_photo_base64 and ref_photo:
        # Try Surepass face match first
        face_result = await surepass_face_match(req.live_photo_base64, ref_photo)
        
        # Fallback to Signzy if Surepass failed/unconfigured
        if not face_result.get("success"):
            face_result = await signzy_face_match(req.live_photo_base64, ref_photo)
            
        if not face_result.get("success"):
            # Log failure but don't block — route to officer review
            face_result = {"matchScore": 0.5, "matched": False, 
                          "decision": "MATCH_FAILED", "success": False, "source": "verification_error"}
    
    face_score = face_result.get("matchScore", 0.5)
    
    # 4. Risk calculation
    now = datetime.now()
    is_odd_hours = now.hour < 8 or now.hour >= 19
    visit_count = get_recent_visit_count(db, req.aadhaar_masked, days=30)
    
    risk = calculate_risk(
        face_score=face_score,
        is_blacklisted=is_blacklisted,
        visit_frequency=visit_count,
        is_odd_hours=is_odd_hours,
        department_sensitivity=req.department_sensitivity or "NORMAL"
    )

    # Demo-mode override: allow pass generation for non-blacklisted mock users.
    if req.is_mock_verification and not is_blacklisted and risk["action"] == "REJECT":
        risk["action"] = "AUTO_APPROVE"
        risk["riskLevel"] = "LOW"
        risk["riskScore"] = min(risk.get("riskScore", 0.0), 0.32)
    
    # 4. Create visit record
    visit_id = f"VMS-{now.strftime('%Y%m%d')}-{generate_short_id()}"
    
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
        "faceDecision": face_result.get("decision"),
        "riskScore": risk["riskScore"],
        "riskLevel": risk["riskLevel"],
        "status": status,
        "isBlacklisted": is_blacklisted,
        "faceMatchSource": face_result.get("source", "unknown")
    })
    
    # 5. Log to audit
    log_audit_action(db, {
        "action": "REGISTRATION",
        "entityId": visit_id,
        "metadata": {
            "faceScore": face_score,
            "riskScore": risk["riskScore"],
            "riskLevel": risk["riskLevel"],
            "action": risk["action"],
            "blacklisted": is_blacklisted,
            "faceSource": face_result.get("source")
        }
    })
    
    return {
        "visitId": visit_id,
        "status": status,
        "faceScore": face_score,
        "riskScore": risk["riskScore"],
        "riskLevel": risk["riskLevel"],
        "action": risk["action"],
        "isMockFaceMatch": face_result.get("source") == "mock",
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
        "on_premise": approved # Mock on-premise as approved for demo
    }

@router.get("/approvals/pending")
async def get_pending_approvals(session: Session = Depends(get_session)):
    statement = select(Visit, Visitor).where(Visit.status == "PENDING").where(Visit.visitor_id == Visitor.id)
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
            "status": v.status,
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
    statement = select(Visit).where(Visit.visit_id_str == visit_id)
    visit = session.exec(statement).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"status": visit.status}
