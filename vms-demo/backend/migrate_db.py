import sqlite3
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "vms_database.db"

def migrate():
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}. It will be created on startup.")
        return

    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if liveness_source already exists
    cursor.execute("PRAGMA table_info(visit)")
    columns = [col[1] for col in cursor.fetchall()]

    if "liveness_source" not in columns:
        print("Adding 'liveness_source' column to 'visit' table...")
        try:
            cursor.execute("ALTER TABLE visit ADD COLUMN liveness_source VARCHAR DEFAULT 'unknown'")
            conn.commit()
            print("Column added successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")
    else:
        print("'liveness_source' column already exists.")

    conn.close()

if __name__ == "__main__":
    migrate()
