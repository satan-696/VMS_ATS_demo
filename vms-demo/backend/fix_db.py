import sqlite3
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "vms_database.db"

def fix_visit_table():
    if not DB_PATH.exists():
        print(f"ERROR: Database not found at {DB_PATH}")
        return

    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    # Get current columns
    cursor.execute("PRAGMA table_info(visit)")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"Current columns: {columns}")

    # Columns to add
    new_columns = [
        ("verification_type", "TEXT DEFAULT 'aadhaar_ovse'"),
        ("document_type", "TEXT"),
        ("document_photo_path", "TEXT"),
        ("ovse_client_id", "TEXT"),
        ("live_photo_path", "TEXT"),
        ("face_match_source", "TEXT DEFAULT 'unknown'"),
        ("liveness_source", "TEXT DEFAULT 'unknown'")
    ]

    for col_name, col_def in new_columns:
        if col_name not in columns:
            print(f"Adding column: {col_name}...")
            try:
                cursor.execute(f"ALTER TABLE visit ADD COLUMN {col_name} {col_def}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")

    conn.commit()
    conn.close()
    print("Database schema fix complete.")

if __name__ == "__main__":
    fix_visit_table()
