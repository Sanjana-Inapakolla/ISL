from crypto import encrypt_data, decrypt_data
import base64

password = "secret-password"
payload = b"This is a test secret message for AES!"

ciphertext, iv = encrypt_data(payload, password)
print(f"IV (Base64): {base64.b64encode(iv).decode()}")
print(f"Ciphertext (Base64): {base64.b64encode(ciphertext).decode()}")

decrypted = decrypt_data(ciphertext, iv, password)
print(f"Decrypted: {decrypted.decode()}")

if payload == decrypted:
    print("SUCCESS: Encryption/Decryption match!")
else:
    print("FAILURE: Mismatch!")
