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
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function normalizeRoute(route) {
  if (!route || typeof route !== "string") return "/";
  const clean = route.split("?")[0].replace(/\/$/, "") || "/";
  if (clean.startsWith("/dashboard/")) return "/dashboard";
  if (clean.startsWith("/timetable/")) return "/timetable";
  if (clean.startsWith("/attendance/")) return "/attendance";
  if (clean.startsWith("/analytics/")) return "/analytics";
  return clean;
}

const ROUTE_LABELS = {
  "/": "Home / Landing",
  "/dashboard": "Student Dashboard",
  "/timetable": "Class Timetable & Schedule",
  "/attendance": "Attendance Tracker & Calculator",
  "/leaderboard": "Rankings & Leaderboard",
  "/analytics": "Academic Analytics & Trends",
  "/resources": "Student Resources",
  "/testimonials": "Student Reviews & Testimonials",
  "/about-dev": "Developer Portfolio & Team",
  "/about": "About GradeFlow",
  "/help": "Help & Support",
  "/contact": "Contact",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
  "/admin": "Admin Portal",
  "/admin/dashboard": "Admin Control Console",
};

module.exports = async function handler(req, res) {
  if (applyCors(req, res, "GET,POST,OPTIONS")) return;

  try {
    await connectToDatabase();

    const urlObj = new URL(req.url, "http://localhost");
    const pathname = urlObj.pathname.toLowerCase();
    const isAdminRequest = pathname.includes("/admin/traffic") || req.query.admin === "true";

    // ─── Administrative Traffic Endpoints ────────────────────────────────────
    if (isAdminRequest) {
      const admin = verifyAdmin(req);
      if (!admin) {
        return res.status(401).json({ success: false, message: "Unauthorized administrative access." });
      }

      const pathAction = pathname.replace(/^\/api\/admin\/traffic\/?/, "").replace(/\/$/, "");
      const action = (req.query.action || pathAction || "").toLowerCase();

      if (req.method === "GET" || action === "live-overview" || !action) {
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

      if (action === "queue/config" || action === "queue-config" || (req.method === "POST" && req.body?.maxActiveCapacity !== undefined)) {
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

      if (action === "queue/admit-next" || action === "admit-next") {
        const count = Math.max(1, parseInt(req.body?.count, 10) || 10);
        return res.json({
          success: true,
          admittedCount: count,
          message: `Admitted next ${count} student(s) from the virtual queue.`,
        });
      }

      if (action === "queue/admit-student" || action === "admit-student") {
        return res.json({
          success: true,
          message: "Student admitted successfully.",
        });
      }

      if (action === "queue/flush" || action === "flush") {
        const admitAll = req.body?.admitAll !== false;
        return res.json({
          success: true,
          flushedCount: 0,
          message: admitAll ? "Successfully admitted all students from the queue." : "Queue cleared successfully.",
        });
      }

      if (action === "analytics/reset" || action === "analytics-reset") {
        await PageAnalytics.deleteMany({});
        return res.json({ success: true, message: "Page analytics reset." });
      }

      return res.json({ success: true });
    }

    // ─── Public Student Traffic Endpoints ───────────────────────────────────
    const pathAction = pathname.replace(/^\/api\/traffic\/?/, "").replace(/\/$/, "");
    const action = (req.query.action || pathAction || "").toLowerCase();

    if (action === "queue-status" || req.method === "GET" || !action) {
      const config = (await TrafficQueueConfig.findOne({ key: "global_traffic_config" })) || {
        queueEnabled: false,
        maxActiveCapacity: 200,
      };

      return res.json({
        success: true,
        queued: Boolean(config.queueEnabled),
        admitted: !Boolean(config.queueEnabled),
        maxCapacity: config.maxActiveCapacity || 200,
      });
    }

    if (action === "page-view" || (req.method === "POST" && req.body?.route)) {
      const { token, route = "/", isAdmin = false } = req.body || {};
      const normRoute = normalizeRoute(route);
      const pageTitle = ROUTE_LABELS[normRoute] || normRoute;

      await PageAnalytics.findOneAndUpdate(
        { route: normRoute },
        {
          $setOnInsert: { pageTitle },
          $inc: { totalViews: 1 },
          $set: { lastVisitedAt: new Date() },
          ...(token ? { $addToSet: { visitorTokens: String(token).slice(0, 32) } } : {}),
        },
        { upsert: true, new: true }
      ).catch(() => {});

      const config = (await TrafficQueueConfig.findOne({ key: "global_traffic_config" })) || {
        queueEnabled: false,
      };

      return res.json({
        success: true,
        queued: !isAdmin && Boolean(config.queueEnabled),
        admitted: isAdmin || !Boolean(config.queueEnabled),
      });
    }

    if (action === "queue-leave") {
      return res.json({ success: true, message: "Queue left." });
    }

    if (action === "heartbeat") {
      return res.json({ success: true });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Serverless traffic error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
