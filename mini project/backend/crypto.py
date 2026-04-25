import hashlib
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
import base64

def get_key(password: str):
    """Derive a 32-byte key from a password using SHA-256."""
    return hashlib.sha256(password.encode()).digest()

def encrypt_data(data: bytes, password: str):
    key = get_key(password)
    iv = get_random_bytes(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ciphertext = cipher.encrypt(pad(data, AES.block_size))
    return ciphertext, iv

def decrypt_data(ciphertext: bytes, iv: bytes, password: str):
    key = get_key(password)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    data = unpad(cipher.decrypt(ciphertext), AES.block_size)
    return data
