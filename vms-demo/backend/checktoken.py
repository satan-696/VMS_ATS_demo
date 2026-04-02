from dotenv import load_dotenv
import os
load_dotenv()
token = os.getenv('SUREPASS_TOKEN', '')
print('Token length:', len(token))
print('Has Bearer:', 'Bearer' in token)
print('Has PASTE_TOKEN:', 'PASTE_TOKEN' in token)
print('Has YOUR_TOKEN:', 'YOUR_TOKEN' in token)
print('is_configured:', bool(token) and 'PASTE_TOKEN' not in token and 'YOUR_TOKEN' not in token and len(token) > 20)