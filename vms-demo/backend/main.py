from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from routers import aadhaar, visitors, blacklist
from database import engine, create_db_and_tables, get_session, Visitor, Visit, Blacklist
from services.config import validate_all_services
import uvicorn
import os
from datetime import datetime

app = FastAPI(title="ATS Visitor Management System API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    create_db_and_tables()
    validate_all_services()

# Include routers
app.include_router(aadhaar.router)
app.include_router(visitors.router)
app.include_router(blacklist.router)

@app.get("/")
def read_root():
    return {"message": "ATS VMS API is running"}

@app.get("/api/visits/{visit_id}/status")
async def get_visit_status(visit_id: str, session: Session = Depends(get_session)):
    statement = select(Visit).where(Visit.visit_id_str == visit_id)
    visit = session.exec(statement).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"status": visit.status, "visit_id": visit_id}

@app.post("/api/demo/reset")
def reset_demo(session: Session = Depends(get_session)):
    from sqlmodel import SQLModel
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    
    # 1. Seed Blacklist (Scenario 3: Mohammed Irfan Shaikh)
    blacklist_item = Blacklist(
        name="Mohammed Irfan Shaikh",
        aadhaar_masked="XXXX-XXXX-0003",
        reason="Security database flag: Restricted access.",
        severity="HIGH",
        blacklisted_by="Admin"
    )
    session.add(blacklist_item)
    
    # 2. Add some initial visits for dashboard
    # (Optional: Add more seed data here if needed for demo charts)
    
    session.commit()
    return {"message": "Demo data reset successfully with seeded scenarios"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
