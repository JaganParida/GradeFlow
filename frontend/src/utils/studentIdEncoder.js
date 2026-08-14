// Reversible URL-safe student ID encoder/decoder
// Prevents exposing raw registration numbers in browser address bar

export function encodeStudentId(regNo) {
  if (!regNo) return "";
  const str = String(regNo).trim();
  try {
    const encoded = btoa(`GF:${str}`)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return `GF_${encoded}`;
  } catch {
    return str;
  }
}

export function decodeStudentId(token) {
  if (!token) return "";
  const clean = String(token).trim();

  // If already an obfuscated GF_ token
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

  // Fallback for direct numeric registration numbers
  return clean;
}
