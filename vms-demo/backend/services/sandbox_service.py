import os
import httpx
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)

SANDBOX_BASE_URL = "https://api.sandbox.co.in"
SANDBOX_API_KEY = os.getenv("SANDBOX_API_KEY", "")
SANDBOX_API_SECRET = os.getenv("SANDBOX_API_SECRET", "")

_sandbox_token_cache = {"token": None, "expires_at": 0}

async def get_sandbox_auth_token() -> str:
    """Sandbox.co.in uses token-based auth, refresh before calls with caching"""
    if _sandbox_token_cache["token"] and time.time() < _sandbox_token_cache["expires_at"]:
        return _sandbox_token_cache["token"]
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{SANDBOX_BASE_URL}/authenticate",
                headers={
                    "x-api-key": SANDBOX_API_KEY,
                    "x-api-secret": SANDBOX_API_SECRET,
                    "x-api-version": "1.0"
                }
            )
            response.raise_for_status()
            token = response.json()["access_token"]
            
            # Cache for 1 hour (3600s)
            _sandbox_token_cache["token"] = token
            _sandbox_token_cache["expires_at"] = time.time() + 3500 # slightly under 1 hour for safety
            
            return token
    except Exception as e:
        logger.error(f"Sandbox authentication failed: {str(e)}")
        raise

async def send_aadhaar_otp(uid: str) -> dict:
    """Send OTP to Aadhaar-linked mobile via Sandbox.co.in"""
    if not SANDBOX_API_KEY or SANDBOX_API_KEY == "your_sandbox_key":
        return _mock_send_otp(uid)
        
    try:
        token = await get_sandbox_auth_token()
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{SANDBOX_BASE_URL}/kyc/aadhaar/okyc/otp",
                headers={
                    "Authorization": token,
                    "x-api-key": SANDBOX_API_KEY,
                    "Content-Type": "application/json"
                },
                json={"@entity": "in.co.sandbox.kyc.aadhaar.okyc.request", "uid": uid}
            )
            data = response.json()
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "referenceId": data.get("data", {}).get("reference_id"),
                    "message": "OTP sent to Aadhaar-linked mobile",
                    "source": "sandbox_live"
                }
            else:
                logger.error(f"Sandbox send OTP failed: {data}")
                return {"success": False, "error": data.get("message", "Failed to send OTP")}
                
    except Exception as e:
        logger.error(f"Sandbox send OTP exception: {str(e)}")
        return _mock_send_otp(uid) # Fallback to mock for demo stability

async def verify_aadhaar_otp(reference_id: str, otp: str, share_code: str = "1234") -> dict:
    """Verify OTP and get demographic data + photo via Sandbox.co.in"""
    if not SANDBOX_API_KEY or SANDBOX_API_KEY == "your_sandbox_key" or reference_id.startswith("MOCK"):
        return _mock_verify_otp(reference_id, otp)
        
    try:
        token = await get_sandbox_auth_token()
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SANDBOX_BASE_URL}/kyc/aadhaar/okyc/otp/verify",
                headers={
                    "Authorization": token,
                    "x-api-key": SANDBOX_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "@entity": "in.co.sandbox.kyc.aadhaar.okyc",
                    "reference_id": reference_id,
                    "otp": otp,
                    "share_code": share_code
                }
            )
            data_full = response.json()
            data = data_full.get("data", {})
            
            if response.status_code == 200 and data.get("status") == "VALID":
                return {
                    "success": True,
                    "name": data.get("name"),
                    "dob": data.get("date_of_birth"),
                    "gender": data.get("gender"),
                    "address": data.get("full_address"),
                    "photo": data.get("photo"), # base64 string
                    "careOf": data.get("care_of"),
                    "source": "sandbox_live"
                }
            else:
                logger.error(f"Sandbox verify OTP failed: {data_full}")
                return {"success": False, "error": data_full.get("message", "Incorrect OTP")}
                
    except Exception as e:
        logger.error(f"Sandbox verify OTP exception: {str(e)}")
        return {"success": False, "error": "Verification service error"}

def _mock_send_otp(uid: str) -> dict:
    return {
        "success": True,
        "referenceId": f"MOCK-REF-{uid[-4:]}",
        "message": "DEMO MODE: OTP 123456 sent (Mock)",
        "source": "mock"
    }

def _mock_verify_otp(ref_id: str, otp: str) -> dict:
    if otp != "123456":
        return {"success": False, "error": "Invalid OTP (Demo use 123456)"}
    
    return {
        "success": True,
        "name": "Rajesh Kumar Sharma",
        "dob": "1985-03-14",
        "gender": "MALE",
        "address": "New Delhi - 110001",
        "photo": None, # Use real photo when live
        "source": "mock"
    }
