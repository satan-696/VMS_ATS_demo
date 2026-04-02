from fastapi import APIRouter
from services.surepass_service import is_configured as surepass_config
import os
import httpx
from datetime import datetime

router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("/verification")
async def verification_health():
    """Check connectivity for consolidated Surepass.io service"""
    results = {}
    
    base_url = os.getenv("SUREPASS_BASE_URL", "https://sandbox.surepass.app/api/v1")
    raw_token = os.getenv("SUREPASS_TOKEN", "").strip()
    surepass_token = raw_token if raw_token.startswith("Bearer ") else f"Bearer {raw_token}"

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.post(
                f"{base_url}/aadhaar-v2/generate-otp",
                headers={
                    "Authorization": surepass_token,
                    "Content-Type": "application/json"
                },
                json={"id_number": "000000000000"}
            )
            results["surepass"] = (
                "reachable" if r.status_code in [200, 400, 422] 
                else f"error_{r.status_code}"
            )
    except Exception as e:
        results["surepass"] = f"unreachable: {str(e)}"

    return {
        "status": "online",
        "surepass_configured": surepass_config(),
        "connectivity": results,
        "timestamp": datetime.now().isoformat()
    }