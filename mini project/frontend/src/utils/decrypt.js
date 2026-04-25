import CryptoJS from "crypto-js";

/**
 * Decrypts AES-256-CBC encrypted data.
 * @param {string} cipherBase64 - The base64 encoded ciphertext.
 * @param {string} password - The user-provided password from which the key is derived.
 * @param {string} ivBase64 - The base64 encoded IV.
 */
export function decryptData(cipherBase64, password, ivBase64) {
  // Derive key using SHA-256 (matching backend)
  const key = CryptoJS.SHA256(password);
  const iv = CryptoJS.enc.Base64.parse(ivBase64);

  const decrypted = CryptoJS.AES.decrypt(cipherBase64, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Convert to WordArray/Bytes and then to a Blob URL
  // We expect the result to be an image file (PNG/JPG/etc)
  const typedArray = wordToUint8Array(decrypted);
  const blob = new Blob([typedArray]);
  return URL.createObjectURL(blob);
}

/**
 * Helper to convert CryptoJS WordArray to Uint8Array.
 */
function wordToUint8Array(wordArray) {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    u8[i] = byte;
  }
  return u8;
}
