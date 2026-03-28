from sqlmodel import SQLModel, create_engine, Session, Field
from typing import Optional
from datetime import datetime
import os

sqlite_file_name = "vms_database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, echo=True, connect_args={"check_same_thread": False})

class Visitor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    aadhaar_masked: str
    dob: str
    gender: str
    mobile: str
    photo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Visit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    visitor_id: int
    visit_id_str: str  # e.g., VMS-2024-001
    purpose: str
    department: str
    host_officer: str
    duration: str
    match_score: float
    risk_level: str  # LOW, MEDIUM, HIGH
    status: str  # PENDING, APPROVED, REJECTED
    face_match_source: Optional[str] = "unknown"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Blacklist(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    aadhaar_masked: str
    reason: str
    severity: str  # LOW, MEDIUM, HIGH
    blacklisted_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
