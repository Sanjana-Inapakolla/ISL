export default function DecryptedImage({ imageUrl, useAes }) {
  if (!imageUrl) return null;

  return (
    <div className="decrypted-section" style={{ marginTop: "40px", padding: "20px", border: `2px solid ${useAes ? "#4CAF50" : "#2196F3"}`, borderRadius: "8px" }}>
      <h3 style={{ color: useAes ? "#4CAF50" : "#2196F3" }}>
        {useAes ? "🔓 Successfully Decrypted" : "🖼️ Successfully Reconstructed"}
      </h3>
      <div style={{ background: "#f0f0f0", padding: "10px", borderRadius: "4px" }}>
        <img 
          src={imageUrl} 
          style={{ maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }} 
          alt="Result" 
        />
      </div>
      <p style={{ marginTop: "10px", fontSize: "0.9rem" }}>
        {useAes 
          ? "This image was recovered by digitally reconstructing the VC shares and decrypting the resulting AES-256 bitstream."
          : "This image was recovered by digitally overlapping the visual shares, revealing the original monochrome content."}
      </p>
    </div>
  );
}
