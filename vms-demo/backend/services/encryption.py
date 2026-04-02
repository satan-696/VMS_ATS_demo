from cryptography.fernet import Fernet
import os
import base64
from dotenv import load_dotenv

load_dotenv()

def get_fernet() -> Fernet:
    key = os.getenv("ENCRYPTION_KEY", "")
    if not key:
        # Fallback for dev only — should be set in .env
        key = Fernet.generate_key().decode()
    
    # Ensure key is correctly padded or handled as bytes
    try:
        return Fernet(key.encode())
    except Exception:
        # If the key provided isn't valid, we generate one to prevent crash
        # but this is a serious config issue in production.
        return Fernet(Fernet.generate_key())

def encrypt(value: str) -> str:
    if not value: return ""
    f = get_fernet()
    return f.encrypt(value.encode()).decode()

def decrypt(value: str) -> str:
    if not value: return ""
    try:
        f = get_fernet()
        return f.decrypt(value.encode()).decode()
    except Exception:
        return "DECRYPTION_ERROR"

if __name__ == "__main__":
    # Test
    test_val = "123456789012"
    enc = encrypt(test_val)
    dec = decrypt(enc)
    print(f"Original: {test_val}")
    print(f"Encrypted: {enc}")
    print(f"Decrypted: {dec}")
    assert test_val == dec
    print("Encryption test passed!")
