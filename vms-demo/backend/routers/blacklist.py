from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session, Blacklist
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/blacklist", tags=["blacklist"])

class BlacklistRequest(BaseModel):
    name: str
    aadhaar_masked: str
    reason: str
    severity: str
    blacklisted_by: str

@router.get("/")
async def get_blacklist(session: Session = Depends(get_session)):
    return session.exec(select(Blacklist)).all()

@router.post("/")
async def add_to_blacklist(request: BlacklistRequest, session: Session = Depends(get_session)):
    item = Blacklist(**request.dict())
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.delete("/{item_id}")
async def remove_from_blacklist(item_id: int, session: Session = Depends(get_session)):
    item = session.get(Blacklist, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    return {"message": "Removed from blacklist"}
