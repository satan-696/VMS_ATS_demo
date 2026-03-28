import random
from typing import Dict

def mock_match_face(live_photo_base64: str, aadhaar_photo_url: str = None) -> Dict:
    """
    Simulates face matching between live capture and Aadhaar photo.
    Returns match_score and decision.
    """
    # For demo, randomize score between 0.7 and 0.98 if photo exists, 
    # but deterministic for our test cases if possible.
    
    # In a real app, you'd process base64 icons.
    score = random.uniform(0.75, 0.98)
    
    return {
        "match_score": round(score, 2),
        "decision": "MATCH" if score > 0.8 else "MISMATCH"
    }
