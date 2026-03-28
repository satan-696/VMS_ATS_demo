import os
import logging

logger = logging.getLogger(__name__)

def validate_all_services():
    """Called on FastAPI startup. Logs all service statuses clearly."""
    surepass_token = os.getenv("SUREPASS_TOKEN", "")
    surepass_ok = bool(surepass_token and "YOUR_TOKEN" not in surepass_token)
    
    signzy_token = os.getenv("SIGNZY_API_TOKEN", "")
    signzy_ok = bool(signzy_token and "your_token" not in signzy_token.lower())
    
    sandbox_key = os.getenv("SANDBOX_API_KEY", "")
    sandbox_ok = bool(sandbox_key and "your_sandbox_key" not in sandbox_key)

    logger.info("=" * 60)
    logger.info(f"  Surepass (Aadhaar OKYC + Face): {'✓ CONFIGURED' if surepass_ok else '⚠ MOCK MODE'}")
    logger.info(f"  Signzy (Face Match Backup):     {'✓ CONFIGURED' if signzy_ok else '⚠ MOCK MODE'}")
    logger.info(f"  Sandbox (OTP Fallback):         {'✓ CONFIGURED' if sandbox_ok else '⚠ MOCK MODE'}")
    logger.info("=" * 60)
