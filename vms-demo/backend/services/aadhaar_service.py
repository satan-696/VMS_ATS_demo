import os
from dotenv import load_dotenv

load_dotenv()

AADHAAR_MODE = os.getenv("AADHAAR_MODE", "mock").lower()

def get_aadhaar_data(aadhaar_number: str):
    """
    Simulates fetching Aadhaar data.
    In MOCK mode, returns pre-seeded data for specific numbers.
    """
    if AADHAAR_MODE == "mock":
        # Pre-seeded mock data
        mock_data = {
            "999999990001": {
                "name": "Rajesh Kumar Sharma",
                "dob": "1985-03-14",
                "gender": "Male",
                "address": "New Delhi - 110001",
                "mobile_hint": "●●●●●●7834",
                "photo_url": None  # Will use initials for now
            },
            "999999990003": {
                "name": "Mohammed Irfan Shaikh",
                "dob": "1990-07-22",
                "gender": "Male",
                "address": "Mumbai - 400001",
                "mobile_hint": "●●●●●●1234",
                "photo_url": None
            }
        }
        return mock_data.get(aadhaar_number, {
            "name": "John Doe",
            "dob": "2000-01-01",
            "gender": "Other",
            "address": "Unknown",
            "mobile_hint": "●●●●●●0000",
            "photo_url": None
        })
    elif AADHAAR_MODE == "sandbox":
        # Placeholder for UIDAI Sandbox integration
        return {"error": "Sandbox mode not fully implemented"}
    else:
        return {"error": "Production mode requires credentials"}

def verify_otp(aadhaar_number: str, otp: str):
    """
    Verifies OTP for Aadhaar.
    In MOCK mode, '123456' always succeeds.
    """
    if AADHAAR_MODE == "mock":
        return otp == "123456"
    return False # Default to fail if not mock for now
