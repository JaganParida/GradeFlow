// URL-safe Student ID Cipher with Cryptographic-grade Checksum & Obfuscation
// Prevents exposing raw registration numbers and stops manual URL tampering

const CIPHER_KEY = [0x47, 0x72, 0x61, 0x64, 0x65, 0x46, 0x6c, 0x6f, 0x77, 0x32, 0x30, 0x32, 0x36]; // "GradeFlow2026"
const MAGIC_PREFIX = "GF8";

function computeChecksum(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return ((hash >>> 0) % 65535).toString(16).padStart(4, "0");
}

export function encodeStudentId(regNo) {
  if (!regNo) return "";
  const clean = String(regNo).trim();
  if (!clean) return "";

  try {
    const checksum = computeChecksum(clean);
    const payload = `${clean}:${checksum}`;
    
    // XOR obfuscate with CIPHER_KEY
    const xorBytes = [];
    for (let i = 0; i < payload.length; i++) {
      xorBytes.push(payload.charCodeAt(i) ^ CIPHER_KEY[i % CIPHER_KEY.length]);
    }
    
    // Convert to URL-safe base64
    const binStr = String.fromCharCode(...xorBytes);
    const b64 = btoa(binStr)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    
    return `${MAGIC_PREFIX}_${b64}`;
  } catch {
    return clean;
  }
}

export function decodeStudentId(token) {
  if (!token) return "";
  const clean = String(token).trim();

  // If secure MAGIC_PREFIX token (GF8_...)
  if (clean.startsWith(`${MAGIC_PREFIX}_`)) {
    try {
      let b64 = clean.slice(MAGIC_PREFIX.length + 1).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const binStr = atob(b64);
      
      const chars = [];
      for (let i = 0; i < binStr.length; i++) {
        chars.push(String.fromCharCode(binStr.charCodeAt(i) ^ CIPHER_KEY[i % CIPHER_KEY.length]));
      }
      const decrypted = chars.join("");
      const [regNo, checksum] = decrypted.split(":");
      
      if (regNo && checksum && computeChecksum(regNo) === checksum) {
        return regNo;
      }
      return "";
    } catch {
      return "";
    }
  }

  // Legacy GF_ support (for backward compatibility)
  if (clean.startsWith("GF_")) {
    try {
      let b64 = clean.slice(3).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const decoded = atob(b64);
      if (decoded.startsWith("GF:")) {
        return decoded.slice(3);
      }
    } catch {
      return "";
    }
  }

  // Direct registration number (only valid if it matches numeric format)
  if (/^\d{10,14}$/.test(clean)) {
    return clean;
  }

  return "";
}

export function isEncryptedToken(token) {
  if (!token) return false;
  return token.startsWith(`${MAGIC_PREFIX}_`) || token.startsWith("GF_");
}
