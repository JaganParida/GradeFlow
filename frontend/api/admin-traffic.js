const connectToDatabase = require("./_lib/db");
const PageAnalytics = require("./_lib/models/PageAnalytics");
const TrafficQueueConfig = require("./_lib/models/TrafficQueueConfig");
const { applyCors } = require("./_lib/cors");
const jwt = require("jsonwebtoken");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = rest.join("=");
  });
  return cookies;
}

function verifyAdmin(req) {
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies.jwt;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token || token === "none") return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (applyCors(req, res, "GET,POST,OPTIONS")) return;

  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Unauthorized administrative access." });
  }

  try {
    await connectToDatabase();
    const action = req.query.action || "";

    if (req.method === "GET" || action === "live-overview") {
      const config = (await TrafficQueueConfig.findOne({ key: "global_traffic_config" })) || {
        queueEnabled: false,
        autoTriggerEnabled: true,
        maxActiveCapacity: 200,
      };

      const pages = await PageAnalytics.find({}).sort({ totalViews: -1 }).lean();
      const totalPages = pages.length;
      const tierSize = Math.max(1, Math.ceil(totalPages / 3));

      const mostVisited = pages.slice(0, tierSize).map((p) => ({ ...p, tier: "MOST_VISITED", liveViewers: 0 }));
      const mediumVisited = pages.slice(tierSize, tierSize * 2).map((p) => ({ ...p, tier: "MEDIUM_VISITED", liveViewers: 0 }));
      const leastVisited = pages.slice(tierSize * 2).map((p) => ({ ...p, tier: "LEAST_VISITED", liveViewers: 0 }));

      return res.json({
        success: true,
        totalActiveUsers: 0,
        totalQueuedUsers: 0,
        maxActiveCapacity: config.maxActiveCapacity || 200,
        queueEnabled: Boolean(config.queueEnabled),
        autoTriggerEnabled: Boolean(config.autoTriggerEnabled),
        isQueueActive: Boolean(config.queueEnabled),
        activeStudents: [],
        queuedStudents: [],
        routeDistribution: {},
        analytics: {
          allPages: pages,
          mostVisited,
          mediumVisited,
          leastVisited,
          totalTrackedViews: pages.reduce((sum, p) => sum + (p.totalViews || 0), 0),
        },
      });
    }

    if (action === "queue-config" || (req.method === "POST" && req.body?.maxActiveCapacity !== undefined)) {
      const { queueEnabled, autoTriggerEnabled, maxActiveCapacity, queueMessage } = req.body || {};
      const updated = await TrafficQueueConfig.findOneAndUpdate(
        { key: "global_traffic_config" },
        {
          $set: {
            ...(queueEnabled !== undefined ? { queueEnabled: Boolean(queueEnabled) } : {}),
            ...(autoTriggerEnabled !== undefined ? { autoTriggerEnabled: Boolean(autoTriggerEnabled) } : {}),
            ...(maxActiveCapacity !== undefined ? { maxActiveCapacity: Number(maxActiveCapacity) } : {}),
            ...(queueMessage !== undefined ? { queueMessage: String(queueMessage) } : {}),
            updatedAt: new Date(),
          },
        },
        { new: true, upsert: true }
      );

      return res.json({
        success: true,
        message: "Queue config updated.",
        config: updated,
      });
    }

    if (action === "analytics-reset") {
      await PageAnalytics.deleteMany({});
      return res.json({ success: true, message: "Page analytics reset." });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Admin traffic serverless error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
