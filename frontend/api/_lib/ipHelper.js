const net = require("net");

/**
 * Normalizes an IP string:
 * - Trims whitespace
 * - Strips ::ffff: IPv4-mapped IPv6 prefix
 * - Validates that the resulting string is a legitimate IPv4 or IPv6 address
 */
function normalizeIp(raw) {
  if (!raw || typeof raw !== "string") return "";
  let clean = raw.trim();
  if (clean.startsWith("::ffff:")) {
    clean = clean.slice(7);
  }
  return net.isIP(clean) ? clean : "";
}

/**
 * Authoritative, spoof-resistant client IP extractor for Vercel Serverless Functions.
 *
 * In Vercel:
 * 1. req.headers["x-real-ip"] is set by Vercel Edge infrastructure and CANNOT be forged by clients.
 * 2. req.headers["x-vercel-forwarded-for"] is set by Vercel Edge infrastructure.
 * 3. req.headers["cf-connecting-ip"] if proxied through Cloudflare.
 * 4. In x-forwarded-for, proxies APPEND the real IP at the END (client_provided, real_ip).
 *    Never use index [0] as that is the attacker-supplied header!
 * 5. Fallback to socket remoteAddress or 127.0.0.1.
 */
function getClientIp(req) {
  if (!req || !req.headers) return "127.0.0.1";

  // 1. Prefer Vercel Edge-verified x-real-ip
  if (req.headers["x-real-ip"]) {
    const verified = normalizeIp(String(req.headers["x-real-ip"]));
    if (verified) return verified;
  }

  // 2. Vercel Edge-verified x-vercel-forwarded-for
  if (req.headers["x-vercel-forwarded-for"]) {
    const raw = String(req.headers["x-vercel-forwarded-for"]).split(",")[0].trim();
    const verified = normalizeIp(raw);
    if (verified) return verified;
  }

  // 3. Cloudflare CF-Connecting-IP
  if (req.headers["cf-connecting-ip"]) {
    const verified = normalizeIp(String(req.headers["cf-connecting-ip"]));
    if (verified) return verified;
  }

  // 4. In x-forwarded-for, reverse proxies append to the right. Walk backwards from the right:
  if (req.headers["x-forwarded-for"]) {
    const parts = String(req.headers["x-forwarded-for"])
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      const candidate = normalizeIp(parts[i]);
      if (candidate) return candidate;
    }
  }

  // 5. Fallback to direct socket remote address
  const socketIp =
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress;
  if (socketIp) {
    const normalized = normalizeIp(socketIp);
    if (normalized) return normalized;
  }

  return "127.0.0.1";
}

module.exports = {
  normalizeIp,
  getClientIp,
};
