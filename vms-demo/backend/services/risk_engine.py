from enum import Enum
from typing import Dict

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

def calculate_risk(
    face_score: float,
    is_blacklisted: bool,
    visit_frequency: int = 0,       # number of visits in last 30 days
    is_odd_hours: bool = False,      # outside 9am-6pm
    department_sensitivity: str = "NORMAL"  # NORMAL | HIGH | RESTRICTED
) -> dict:
    """
    Multi-signal risk engine as per VMS blueprint.
    
    Risk formula (from blueprint):
      score = faceScore×0.5 + blacklist×0.3 + frequency×0.1 + timeRisk×0.1
    
    Returns risk score, level, and recommended action.
    """
    
    # Blacklist is always HIGH regardless of other signals
    if is_blacklisted:
        return {
            "riskScore": 1.0,
            "riskLevel": RiskLevel.HIGH,
            "action": "REJECT",
            "reason": "Visitor is on blacklist",
            "signals": {
                "faceScore": face_score,
                "blacklisted": True,
                "visitFrequency": visit_frequency,
                "oddHours": is_odd_hours
            }
        }
    
    # Face score component (inverted — low face score = high risk)
    face_risk = 1.0 - face_score  # 0=no risk, 1=max risk
    
    # Blacklist component
    blacklist_risk = 1.0 if is_blacklisted else 0.0
    
    # Frequency risk: >3 visits in 30 days = elevated
    frequency_risk = min(visit_frequency / 5.0, 1.0)
    
    # Time risk: outside business hours
    time_risk = 0.8 if is_odd_hours else 0.0
    
    # Weighted formula
    raw_score = (
        face_risk * 0.5 +
        blacklist_risk * 0.3 +
        frequency_risk * 0.1 +
        time_risk * 0.1
    )
    
    risk_score = round(min(raw_score, 1.0), 3)
    
    # Department sensitivity modifier
    if department_sensitivity == "RESTRICTED":
        risk_score = min(risk_score + 0.15, 1.0)
    elif department_sensitivity == "HIGH":
        risk_score = min(risk_score + 0.08, 1.0)
    
    # Decision bands (from blueprint)
    if risk_score < 0.33:
        level = RiskLevel.LOW
        action = "AUTO_APPROVE"
    elif risk_score < 0.60:
        level = RiskLevel.MEDIUM
        action = "OFFICER_REVIEW"
    else:
        level = RiskLevel.HIGH
        action = "REJECT"
    
    return {
        "riskScore": risk_score,
        "riskLevel": level,
        "action": action,
        "signals": {
            "faceScore": face_score,
            "blacklisted": is_blacklisted,
            "visitFrequency": visit_frequency,
            "oddHours": is_odd_hours,
            "departmentSensitivity": department_sensitivity
        }
    }
