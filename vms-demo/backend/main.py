from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from routers import aadhaar, visitors, blacklist, health, aadhaar_manual
from database import engine, create_db_and_tables, get_session, Visitor, Visit, Blacklist
from services.config import validate_services
from dotenv import load_dotenv
import uvicorn
import os

load_dotenv()

app = FastAPI(title="ATS Visitor Management System API")

from fastapi.staticfiles import StaticFiles

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/documents", exist_ok=True)
os.makedirs("uploads/photos", exist_ok=True)
os.makedirs("uploads/aadhaar-photos", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
async def on_startup():
    create_db_and_tables()
    validate_services()

# Include routers
app.include_router(aadhaar.router)
app.include_router(visitors.router)
app.include_router(aadhaar_manual.router)
app.include_router(blacklist.router)
app.include_router(health.router)

@app.get("/")
def read_root():
    return {"message": "ATS VMS API is running"}

@app.post("/api/demo/reset")
def reset_demo(session: Session = Depends(get_session)):
    from sqlmodel import SQLModel
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    
    # Seed Blacklist (Scenario 3: Mohammed Irfan Shaikh)
    blacklist_item = Blacklist(
        name="Mohammed Irfan Shaikh",
        aadhaar_masked="XXXX-XXXX-0003",
        reason="Security database flag: Restricted access.",
        severity="HIGH",
        blacklisted_by="Admin"
    )
    session.add(blacklist_item)
    session.commit()
    return {"message": "Demo data reset successfully with seeded scenarios"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
