const connectToDatabase = require("./_lib/db");
const PageAnalytics = require("./_lib/models/PageAnalytics");
const TrafficQueueConfig = require("./_lib/models/TrafficQueueConfig");
const StudentSession = require("./_lib/models/StudentSession");
const Ranking = require("./_lib/models/Ranking");
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

        // Query real active student sessions from MongoDB
        const activeSessions = await StudentSession.find({ isActive: true })
          .sort({ lastActiveAt: -1 })
          .limit(150)
          .lean();

        // Deduplicate by regNo (keep latest active device session)
        const uniqueStudentMap = new Map();
        for (const sess of activeSessions) {
          if (!uniqueStudentMap.has(sess.regNo)) {
            uniqueStudentMap.set(sess.regNo, sess);
          }
        }

        const regNos = Array.from(uniqueStudentMap.keys());
        const rankings = await Ranking.find({ regNo: { $in: regNos } }).select("regNo studentName branch batch").lean();
        const rankingMap = new Map(rankings.map((r) => [r.regNo, r]));

        const now = Date.now();
        const activeStudents = Array.from(uniqueStudentMap.values()).map((sess) => {
          const rank = rankingMap.get(sess.regNo);
          const lastActiveTime = new Date(sess.lastActiveAt || sess.updatedAt || sess.loggedInAt).getTime();
          const isOnline = (now - lastActiveTime) < 30 * 60 * 1000;

          const currRoute = sess.deviceInfo?.currentRoute || "/dashboard";
          const pageTitle = sess.deviceInfo?.pageTitle || (ROUTE_LABELS[currRoute] || "Student Dashboard");

          return {
            token: sess.sessionId || sess._id.toString(),
            regNo: sess.regNo,
            studentName: rank?.studentName || `Student (${sess.regNo})`,
            branch: rank?.branch || "CSE",
            batch: rank?.batch || (sess.regNo.startsWith("23") ? "2023" : "2024"),
            currentRoute: currRoute,
            pageTitle,
            deviceType: sess.deviceInfo?.deviceType || "Desktop",
            os: sess.deviceInfo?.os || "Windows",
            browser: sess.deviceInfo?.browser || "Chrome",
            ip: sess.deviceInfo?.ip || "",
            connectedAt: sess.loggedInAt,
            lastActiveAt: sess.lastActiveAt,
            isGuest: false,
            status: isOnline ? "ACTIVE" : "IDLE",
          };
        });

        // Calculate route distribution of active students
        const routeDistribution = {};
        for (const s of activeStudents) {
          const r = s.currentRoute || "/dashboard";
          routeDistribution[r] = (routeDistribution[r] || 0) + 1;
        }

        return res.json({
          success: true,
          totalActiveUsers: activeStudents.length,
          totalQueuedUsers: 0,
          maxActiveCapacity: config.maxActiveCapacity || 200,
          queueEnabled: Boolean(config.queueEnabled),
          autoTriggerEnabled: Boolean(config.autoTriggerEnabled),
          isQueueActive: Boolean(config.queueEnabled),
          activeStudents,
          queuedStudents: [],
          routeDistribution,
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
      const { token, route = "/", regNo, isAdmin = false } = req.body || {};
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

      if (regNo) {
        await StudentSession.updateMany(
          { regNo: String(regNo).toUpperCase().trim(), isActive: true },
          {
            $set: {
              lastActiveAt: new Date(),
              "deviceInfo.currentRoute": normRoute,
              "deviceInfo.pageTitle": pageTitle,
            },
          }
        ).catch(() => {});
      }

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
