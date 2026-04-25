import { useState } from "react";
import { decryptData } from "../utils/decrypt";
import DecryptedImage from "./DecryptedImage";

export default function Overlay({ share1, share2, iv, password, useAes }) {
  const [offset, setOffset] = useState(100);
  const [decryptedUrl, setDecryptedUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.error("Image load error:", e);
        reject(e);
      };
      img.src = src;
    });
  };

  const handleReconstruct = async () => {
    setIsProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      const img1 = await loadImage(share1);
      const img2 = await loadImage(share2);
      
      canvas.width = img1.width;
      canvas.height = img1.height;

      // Draw Share 1
      ctx.drawImage(img1, 0, 0);
      
      // Draw Share 2 with Multiply/Darken mode to simulate physical overlay
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(img2, 0, 0);

      const overlaidBase64 = canvas.toDataURL("image/png");
      
      if (useAes) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const bits = [];
        
        const originalW = canvas.width / 2;
        const originalH = canvas.height / 2;
        
        for (let y = 0; y < originalH; y++) {
          for (let x = 0; x < originalW; x++) {
            let isWhite = false;
            for(let dy=0; dy<2; dy++){
              for(let dx=0; dx<2; dx++){
                const idx = ((y*2 + dy) * canvas.width + (x*2 + dx)) * 4;
                // In a multiply result, white is 255. 
                // Any pixel > 128 (grayish-white) counts as white bit.
                if (imageData[idx] > 128) {
                  isWhite = true;
                  break;
                }
              }
              if(isWhite) break;
            }
            bits.push(isWhite ? 1 : 0);
          }
        }

        const bytes = new Uint8Array(Math.floor(bits.length / 8));
        for (let i = 0; i < bytes.length; i++) {
            let byte = 0;
            for (let j = 0; j < 8; j++) {
                if (bits[i * 8 + j]) byte |= (1 << (7 - j));
            }
            bytes[i] = byte;
        }
        
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Cipher = window.btoa(binary);
        
        const resultUrl = decryptData(base64Cipher, password, iv);
        setDecryptedUrl(resultUrl);
      } else {
        setDecryptedUrl(overlaidBase64);
      }
    } catch (err) {
      console.error("Reconstruction failed:", err);
      alert("Failed to reconstruct image. Check console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="overlay-container" style={{ marginTop: "40px", textAlign: "center", padding: "20px" }}>
      <hr style={{ border: "0", borderTop: "1px solid var(--border)", margin: "40px 0" }} />
      <h2 style={{ marginBottom: "20px" }}>Step 2: Reconstruct Original</h2>
      
      {/* 
          Container for the visual stack. 
          We use a fixed height and relative positioning. 
      */}
      <div style={{ 
        position: "relative", 
        width: "100%", 
        maxWidth: "600px", 
        height: "400px", 
        margin: "0 auto", 
        background: "#e0e0e0", 
        borderRadius: "12px", 
        overflow: "hidden",
        border: "2px solid var(--border)",
        boxShadow: "inset 0 2px 10px rgba(0,0,0,0.1)"
      }}>
        {/* Static background layer (Share 1) */}
        <img 
          src={share1} 
          style={{ 
            position: "absolute", 
            left: "50%", 
            top: "50%", 
            transform: "translate(-50%, -50%)", 
            width: "300px", 
            imageRendering: "pixelated",
            backgroundColor: "white", /* Ensure white pixels are opaque */
            border: "1px solid #ccc"
          }} 
          alt="Share 1"
        />
        
        {/* Moving layer (Share 2) */}
        <img 
          src={share2} 
          style={{ 
            position: "absolute", 
            left: `${offset}%`, 
            top: "50%", 
            transform: "translate(-50%, -50%)", 
            width: "300px", 
            imageRendering: "pixelated",
            mixBlendMode: "multiply", /* This allows live preview of the overlay! */
            backgroundColor: "white",
            border: "1px solid #ccc",
            transition: "left 0.1s ease-out",
            zIndex: 10
          }} 
          alt="Share 2"
        />
      </div>

      <div style={{ maxWidth: "400px", margin: "30px auto" }}>
        <input 
          type="range" 
          min="0" max="100" 
          value={offset} 
          onChange={(e) => setOffset(e.target.value)}
          style={{ width: "100%", height: "10px", borderRadius: "5px", appearance: "none", background: "#ddd", cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "0.9rem", color: "#666" }}>
          <span>Perfect Match (50%)</span>
          <span>Separate (100%)</span>
        </div>
      </div>
      
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "30px", padding: "0 20px" }}>
        <strong>Live Preview:</strong> The top share uses "Multiply" blend mode. 
        Slide to 50% to see the secret revealed visually!
      </p>

      <button 
        onClick={handleReconstruct}
        disabled={isProcessing}
        style={{ 
          padding: "16px 48px", 
          fontSize: "1.2rem",
          backgroundColor: "#4CAF50", 
          color: "white", 
          border: "none", 
          borderRadius: "8px", 
          cursor: "pointer",
          fontWeight: "bold",
          boxShadow: "0 4px 20px rgba(76, 175, 80, 0.4)",
          transition: "all 0.2s"
        }}
      >
        {isProcessing ? "⚙️ Processing..." : (useAes ? "🔓 Digital Decryption" : "👁️ Final Reconstruction")}
      </button>

      <DecryptedImage imageUrl={decryptedUrl} useAes={useAes} />
    </div>
  );
}
