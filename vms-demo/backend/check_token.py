import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def check_token_status():
    token = os.getenv("SUREPASS_TOKEN", "").strip()
    base_url = os.getenv("SUREPASS_BASE_URL", "https://sandbox.surepass.app/api/v1")
    
    # Ensure Bearer prefix
    final_token = token if token.startswith("Bearer ") else f"Bearer {token}"
    
    headers = {
        "Authorization": final_token,
        "Content-Type": "application/json"
    }
    
    endpoints = [
        {"name": "Aadhaar OVSE v4", "path": "/api/v1/aadhaar-v4/initialize", "body": {"channel": "qr", "claims": ["full_name","dob","gender","mobile","profile_image","address"]}},
        {"name": "Aadhaar OVSE v4 (.io)", "path": "/api/v1/aadhaar-v4/initialize", "base": "https://sandbox.surepass.io", "body": {"channel": "qr", "claims": ["full_name","dob","gender","mobile","profile_image","address"]}},
        {"name": "Aadhaar OVSE v4 (No-v1)", "path": "/aadhaar-v4/initialize", "base": "https://sandbox.surepass.app", "body": {"channel": "qr", "claims": ["full_name","dob","gender","mobile","profile_image","address"]}},
        {"name": "OVSE (otp-request)", "path": "/identity/aadhaar-ovse/otp-request", "body": {"id_number": "000000000000"}},
        {"name": "Aadhaar eKYC v2", "path": "/aadhaar-v2/generate-otp", "body": {"id_number": "000000000000"}},
    ]
    
    print(f"📡 Testing Surepass Token against: {base_url}")
    print("-" * 50)
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for ep in endpoints:
            try:
                method = ep.get("method", "POST")
                current_base = ep.get("base", base_url)
                url = f"{current_base}{ep['path']}"
                
                if method == "POST":
                    r = await client.post(url, headers=headers, json=ep["body"])
                else:
                    r = await client.get(url, headers=headers)
                
                status = "✅ ACTIVE" if r.status_code in [200, 400, 422] else f"❌ {r.status_code}"
                print(f"{ep['name']:<20}: {status}")
                if r.status_code == 401:
                    print(f"   └─ Response: {r.text[:120]}...")
                
            except Exception as e:
                print(f"{ep['name']:<20}: 💥 EXCEPTION ({str(e)})")

if __name__ == "__main__":
    asyncio.run(check_token_status())
