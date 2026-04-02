import os
from dotenv import load_dotenv

load_dotenv()

def is_configured() -> bool:
    token = os.getenv("SUREPASS_TOKEN", "").strip()
    print(f"DEBUG: Token='{token[:20]}...' Length={len(token)}")
    raw_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
    print(f"DEBUG: Raw Token Length={len(raw_token)}")
    
    cond1 = bool(raw_token)
    cond2 = "PASTE_TOKEN" not in raw_token
    cond3 = "YOUR_TOKEN" not in raw_token
    cond4 = len(raw_token) > 20
    
    print(f"DEBUG: bool(raw_token)={cond1}")
    print(f"DEBUG: PASTE_TOKEN not in={cond2}")
    print(f"DEBUG: YOUR_TOKEN not in={cond3}")
    print(f"DEBUG: len > 20={cond4}")
    
    return cond1 and cond2 and cond3 and cond4

print(f"IS_CONFIGURED: {is_configured()}")
