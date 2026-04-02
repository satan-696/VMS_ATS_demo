import os
import logging

logger = logging.getLogger(__name__)

def validate_services():
    """Called on FastAPI startup. Logs Surepass status clearly."""
    surepass_token = os.getenv("SUREPASS_TOKEN", "")
    surepass_ok = bool(surepass_token and "YOUR_TOKEN" not in surepass_token)
    
    mock_fallback = os.getenv("USE_MOCK_FALLBACK", "true").lower() == "true"

    logger.info("=" * 60)
    logger.info(f"  Surepass (Identity Verification): {'✓ CONFIGURED' if surepass_ok else '⚠ MOCK MODE'}")
    if not surepass_ok:
        logger.info(f"  Mock Fallback:                     {'✓ ENABLED' if mock_fallback else '✖ DISABLED'}")
    logger.info("=" * 60)
