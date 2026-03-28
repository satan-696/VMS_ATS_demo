import httpx
import time

BASE_URL = "http://localhost:8000/api"

def test_scenarios():
    print("--- Starting API Verification ---")
    
    # Reset Data
    print("Resetting demo data...")
    httpx.post("http://localhost:8000/api/demo/reset")
    
    # Scenario 1: Rajesh (LOW RISK - APPROVED)
    print("\nScenario 1: Rajesh (Approved)")
    # 1. Send OTP
    res = httpx.post(f"{BASE_URL}/aadhaar/send-otp", json={"aadhaar": "999999990001"})
    print(f"Send OTP: {res.json()}")
    # 2. Verify OTP
    res = httpx.post(f"{BASE_URL}/aadhaar/verify-otp", json={"aadhaar": "999999990001", "otp": "123456"})
    visitor = res.json()
    print(f"Verify OTP (Success): {visitor['name']}")
    # 3. Register Visit
    visit_req = {
        "name": visitor["name"],
        "aadhaar_masked": visitor["aadhaarMasked"],
        "dob": visitor["dob"],
        "gender": visitor["gender"],
        "mobile": "9876543210",
        "purpose": "Official Meeting",
        "department": "IT",
        "host_officer": "Mr. Gupta",
        "duration": "1-2 Hours"
    }
    res = httpx.post(f"{BASE_URL}/visitors/register", json=visit_req)
    print(f"Register Visit: {res.json()['status']} (Expected: APPROVED)")

    # Scenario 2: Priya (OTP FAILS)
    print("\nScenario 2: Priya (OTP Fail)")
    res = httpx.post(f"{BASE_URL}/aadhaar/verify-otp", json={"aadhaar": "999999990002", "otp": "000000"})
    print(f"Verify OTP (Fail): {res.status_code} (Expected: 400)")

    # Scenario 3: Mohammed (BLACKLISTED)
    print("\nScenario 3: Mohammed (Blacklisted)")
    res = httpx.post(f"{BASE_URL}/aadhaar/verify-otp", json={"aadhaar": "999999990003", "otp": "123456"})
    visitor = res.json()
    visit_req = {
        "name": visitor["name"],
        "aadhaar_masked": visitor["aadhaarMasked"],
        "dob": visitor["dob"],
        "gender": visitor["gender"],
        "mobile": "9876543210",
        "purpose": "Meeting",
        "department": "Security",
        "host_officer": "Officer X",
        "duration": "Half Day"
    }
    res = httpx.post(f"{BASE_URL}/visitors/register", json=visit_req)
    print(f"Register Visit: {res.json()['status']} (Expected: REJECTED)")

if __name__ == "__main__":
    test_scenarios()
