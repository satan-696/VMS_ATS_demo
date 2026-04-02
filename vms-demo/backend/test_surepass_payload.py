import httpx
import os
from dotenv import load_dotenv

load_dotenv()

SUREPASS_BASE_URL = os.getenv("SUREPASS_BASE_URL", "https://sandbox.surepass.io/api/v1")
SUREPASS_TOKEN = os.getenv("SUREPASS_TOKEN", "")

def _headers():
    return {
        "Authorization": SUREPASS_TOKEN,
        "Content-Type": "application/json"
    }

async def test_initialize(payload):
    print(f"\nTesting payload: {payload}")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{SUREPASS_BASE_URL}/aadhaar-v4/initialize",
                headers=_headers(),
                json=payload
            )
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

import asyncio

async def run_tests():
    # Test 1: Minimal Correct (often)
    await test_initialize({"channel": "qr"})
    
    # Test 2: With auth_mode 1 (suggested for QR)
    await test_initialize({"channel": "qr", "auth_mode": 1})
    
    # Test 3: With specific claims
    await test_initialize({
        "channel": "qr",
        "auth_mode": 1,
        "claims": ["full_name", "dob", "gender", "address"]
    })

if __name__ == "__main__":
    asyncio.run(run_tests())
