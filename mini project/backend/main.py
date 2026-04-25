from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from vc import generate_shares
from crypto import encrypt_data
from PIL import Image
import io
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate-shares/")
async def generate(
    file: UploadFile = File(...), 
    password: str = Form(None), 
    use_aes: bool = Form(True)
):
    print(f"Received request. File: {file.filename}, Use AES: {use_aes}")
    img_content = await file.read()
    
    if use_aes:
        if not password:
            return {"error": "Password required for AES encryption"}
        # Encrypt the bytes
        ciphertext, iv = encrypt_data(img_content, password)
        s1, s2 = generate_shares(ciphertext)
        iv_str = base64.b64encode(iv).decode()
    else:
        # Standard VC: Convert bytes to Image object first
        image = Image.open(io.BytesIO(img_content))
        s1, s2 = generate_shares(image)
        iv_str = None

    buf1 = io.BytesIO()
    buf2 = io.BytesIO()
    s1.save(buf1, format="PNG")
    s2.save(buf2, format="PNG")

    return {
        "share1": base64.b64encode(buf1.getvalue()).decode(),
        "share2": base64.b64encode(buf2.getvalue()).decode(),
        "iv": iv_str,
        "use_aes": use_aes,
        "note": "AES+VC" if use_aes else "Standard VC"
    }