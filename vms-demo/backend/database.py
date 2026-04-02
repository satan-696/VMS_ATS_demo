from sqlmodel import SQLModel, create_engine, Session, Field
from typing import Optional
from datetime import datetime
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
SQLITE_PATH = os.getenv("SQLITE_PATH", "").strip()

# Render/Postgres commonly provides "postgres://", but SQLAlchemy expects "postgresql://".
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        echo=os.getenv("SQL_ECHO", "false").lower() == "true"
    )
else:
    # Priority for SQLite path:
    # 1) SQLITE_PATH env var
    # 2) Render persistent disk path if mounted
    # 3) backend-local file for local dev
    if SQLITE_PATH:
        sqlite_file_path = Path(SQLITE_PATH)
    elif Path("/var/data").exists():
        sqlite_file_path = Path("/var/data/vms_database.db")
    else:
        sqlite_file_path = BASE_DIR / "vms_database.db"

    sqlite_url = f"sqlite:///{sqlite_file_path.as_posix()}"
    engine = create_engine(
        sqlite_url,
        echo=os.getenv("SQL_ECHO", "false").lower() == "true",
        connect_args={"check_same_thread": False}
    )

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
    verification_type: Optional[str] = Field(default="aadhaar_ovse")
    document_type: Optional[str] = Field(default=None)
    document_photo_path: Optional[str] = Field(default=None)
    ovse_client_id: Optional[str] = Field(default=None)
    live_photo_path: Optional[str] = Field(default=None) # Mandatory for all visitors
    aadhaar_photo_path: Optional[str] = Field(default=None) # From OVSE or DigiLocker
    aadhaar_encrypted: Optional[str] = Field(default=None) # AES-256 for manual path
    aadhaar_masked: Optional[str] = Field(default=None) # XXXX-XXXX-1234
    pending_otp: Optional[str] = Field(default=None) # Relay for officer
    otp_submitted_at: Optional[datetime] = Field(default=None)
    face_match_source: Optional[str] = "unknown"
    liveness_source: Optional[str] = "unknown"
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
