import { useState } from "react";
import axios from "axios";

export default function Upload({ setShares }) {
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);
  const [useAes, setUseAes] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("use_aes", useAes);
    if (useAes) {
      formData.append("password", password);
    }

    try {
      const res = await axios.post(
        "http://localhost:8000/generate-shares/",
        formData,
      );

      if (res.data.error) {
        alert(res.data.error);
        return;
      }

      console.log("Response received:", res.data);

      const share1 = "data:image/png;base64," + res.data.share1;
      const share2 = "data:image/png;base64," + res.data.share2;

      setShares({
        share1,
        share2,
        iv: res.data.iv,
        password: password,
        useAes: res.data.use_aes
      });
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to generate shares. Check the console and ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-section" style={{ border: "1px dashed var(--border)", padding: "20px", borderRadius: "8px", background: "var(--accent-bg)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "center" }}>

        <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="radio"
              name="mode"
              checked={useAes}
              onChange={() => setUseAes(true)}
            />
            <span>AES + Visual Crypto</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="radio"
              name="mode"
              checked={!useAes}
              onChange={() => setUseAes(false)}
            />
            <span>Plain Visual Crypto</span>
          </label>
        </div>

        {useAes && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
            <input
              type="password"
              placeholder="Enter secret password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: "10px", width: "250px", borderRadius: "6px", border: "1px solid var(--border)" }}
              disabled={loading}
            />
            {!password && (
              <span style={{ color: "#ff4d4d", fontSize: "0.85rem", fontWeight: "bold" }}>
                enter password
              </span>
            )}
          </div>
        )}

        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          disabled={loading}
          style={{ marginBottom: "10px" }}
        />

        <button
          onClick={handleUpload}
          disabled={loading || !file || (useAes && !password)}
          style={{
            padding: "12px 40px",
            backgroundColor: (loading || !file || (useAes && !password)) ? "#ccc" : "#aa3bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: (loading || !file || (useAes && !password)) ? "default" : "pointer",
            fontWeight: "bold",
            transition: "all 0.3s",
            boxShadow: (loading || !file || (useAes && !password)) ? "none" : "0 4px 12px rgba(170, 59, 255, 0.3)"
          }}
        >
          {loading ? "Processing..." : (useAes ? "Encrypt & Split" : "Split Image")}
        </button>
      </div>

      {loading && (
        <p style={{ marginTop: "15px", fontSize: "0.9rem", color: "#666", animation: "pulse 1.5s infinite" }}>
          {useAes ? "Applying AES encryption and generating secure shares..." : "Generating monochrome visual shares..."}
        </p>
      )}
    </div>
  );
}
