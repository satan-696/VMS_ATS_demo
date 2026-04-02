import socket
import ssl
import httpx

def debug_dns(host):
    print(f"\n--- Debugging DNS for {host} ---")
    try:
        addr = socket.getaddrinfo(host, 443)
        print(f"Address: {addr}")
    except Exception as e:
        print(f"socket.getaddrinfo failed: {e}")

    try:
        import urllib.request
        resp = urllib.request.urlopen(f"https://{host}", timeout=5)
        print(f"urllib.request status: {resp.status}")
    except Exception as e:
        print(f"urllib.request failed: {e}")

if __name__ == "__main__":
    debug_dns("pypi.org")
    debug_dns("files.pythonhosted.org")
    debug_dns("google.com")
