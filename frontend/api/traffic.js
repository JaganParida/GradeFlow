const connectToDatabase = require("./_lib/db");
const PageAnalytics = require("./_lib/models/PageAnalytics");
const TrafficQueueConfig = require("./_lib/models/TrafficQueueConfig");
const { applyCors } = require("./_lib/cors");

function normalizeRoute(route) {
  if (!route) return "/";
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
    const action = req.query.action || "";

    if (action === "queue-status" || req.method === "GET") {
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

      // Increment page view count in MongoDB
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

    if (action === "heartbeat") {
      return res.json({ success: true });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Serverless traffic error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
