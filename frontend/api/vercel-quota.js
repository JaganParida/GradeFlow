const connectToDatabase = require("./_lib/db");
const TrafficQueueConfig = require("./_lib/models/TrafficQueueConfig");
const { getVercelQuotaData, invalidateQuotaCache } = require("./_lib/quotaEngine");
const { applyCors } = require("./_lib/cors");
const jwt = require("jsonwebtoken");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name] = rest.join("=");
  });
  return cookies;
}

function verifyAdmin(req) {
  const cookies = parseCookies(req.headers.cookie);
  let token = req.headers["x-admin-token"] || cookies.jwt;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token || token === "none") return null;
  token = String(token).replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "").trim();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.role === "student" || decoded.regNo) return null;
    return decoded;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (applyCors(req, res, "GET,POST,OPTIONS")) return;

  // Safe body parsing guard for serverless runtimes
  if (typeof req.body === "string") {
    try {
      req.body = JSON.parse(req.body);
    } catch (_) {}
  } else if (Buffer.isBuffer(req.body)) {
    try {
      req.body = JSON.parse(req.body.toString("utf8"));
    } catch (_) {}
  }

  try {
    await connectToDatabase();

    // Verify Admin Access
    const adminUser = verifyAdmin(req);
    if (!adminUser) {
      return res.status(401).json({ success: false, message: "Unauthorized admin access." });
    }

    // ─── Apply Auto-Defense Policy (POST) ──────────────────────────────────
    if (req.method === "POST") {
      const { policy } = req.body || {};
      let updateFields = {
        updatedBy: adminUser.email || "admin",
        updatedAt: new Date(),
      };

      if (policy === "CRITICAL_SHIELD") {
        updateFields.queueEnabled = true;
        updateFields.autoTriggerEnabled = true;
        updateFields.maxActiveCapacity = 50;
        updateFields.queueMessage = "Vercel Hobby Safety Shield Active: Virtual queue enabled to prevent 429 quota exhaustion. Your turn will arrive shortly.";
      } else if (policy === "SURGE_PROTECTION") {
        updateFields.queueEnabled = true;
        updateFields.autoTriggerEnabled = true;
        updateFields.maxActiveCapacity = 150;
        updateFields.queueMessage = "High student volume detected. Virtual queue is pacing requests to protect platform speed.";
      } else if (policy === "OPTIMAL") {
        updateFields.queueEnabled = false;
        updateFields.autoTriggerEnabled = true;
        updateFields.maxActiveCapacity = 250;
        updateFields.queueMessage = "Server capacity optimization active. You are in queue.";
      } else {
        return res.status(400).json({ success: false, message: "Invalid policy mode specified." });
      }

      const updated = await TrafficQueueConfig.findOneAndUpdate(
        { key: "global_traffic_config" },
        { $set: updateFields },
        { new: true, upsert: true }
      );

      // Invalidate serverless in-memory cache so subsequent GET immediately returns fresh active defense state
      invalidateQuotaCache();

      return res.json({
        success: true,
        message: `Successfully applied ${policy} defense policy.`,
        config: updated,
      });
    }

    // ─── GET: On-Demand Vercel Quota Intelligence ───────────────────────────
    const isForce = req.query.force === "true" || req.query.refresh === "true";
    const quotaData = await getVercelQuotaData(isForce);
    return res.json(quotaData);
  } catch (err) {
    console.error("Vercel quota serverless error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
