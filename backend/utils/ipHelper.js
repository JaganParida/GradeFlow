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
 * Checks if an IP belongs to private/loopback/internal ranges.
 */
function isPrivateOrLoopback(ip) {
  const clean = normalizeIp(ip);
  if (!clean) return false;
  if (clean === "127.0.0.1" || clean === "::1") return true;
  if (clean.startsWith("10.") || clean.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)) return true;
  if (clean.startsWith("169.254.")) return true;
  if (clean.startsWith("fc00:") || clean.startsWith("fd00:")) return true;
  return false;
}

/**
 * Authoritative, spoof-resistant client IP extractor for Express.
 *
 * In Express:
 * - req.ip is computed securely by Express's trusted proxy engine (using the 'trust proxy' setting).
 * - If req.ip is valid, it is authoritative.
 * - NEVER falls back to unvalidated raw req.headers["x-forwarded-for"], which would allow
 *   direct attackers to bypass Express's trusted proxy evaluation.
 * - If behind a trusted reverse proxy that forwards Cloudflare's CF-Connecting-IP,
 *   that header is validated and honored only when the immediate connection is from a trusted proxy.
 */
function getClientIp(req) {
  if (!req) return "127.0.0.1";

  // 1. Direct Express req.ip (evaluated via 'trust proxy' configuration)
  if (req.ip) {
    const normalized = normalizeIp(req.ip);
    if (normalized) {
      // If the immediate proxy is trusted and CF-Connecting-IP is provided
      if (isPrivateOrLoopback(normalized) && req.headers && req.headers["cf-connecting-ip"]) {
        const cfIp = normalizeIp(String(req.headers["cf-connecting-ip"]));
        if (cfIp) return cfIp;
      }
      return normalized;
    }
  }

  // 2. Fallback to direct TCP socket / connection remote address
  const socketIp =
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    req.connection?.socket?.remoteAddress;
  if (socketIp) {
    const normalized = normalizeIp(socketIp);
    if (normalized) return normalized;
  }

  return "127.0.0.1";
}

module.exports = {
  normalizeIp,
  isPrivateOrLoopback,
  getClientIp,
};
