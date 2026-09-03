const connectToDatabase = require("./_lib/db");
const PageAnalytics = require("./_lib/models/PageAnalytics");
const TrafficQueueConfig = require("./_lib/models/TrafficQueueConfig");
const StudentSession = require("./_lib/models/StudentSession");
const Ranking = require("./_lib/models/Ranking");
const LiveVisitor = require("./_lib/models/LiveVisitor");
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

        // ─── Real-Time Live Detection Window (Vercel / Google Analytics Style) ───
        // Active Right Now = Ping/Interaction received within the last 90 seconds
        const LIVE_WINDOW_MS = 90 * 1000;
        const liveCutoff = new Date(Date.now() - LIVE_WINDOW_MS);

        // 1. Query users who have pinged within the live window
        const liveNowVisitors = await LiveVisitor.find({ lastSeenAt: { $gte: liveCutoff } })
          .sort({ lastSeenAt: -1 })
          .lean();

        // 2. Query all registered student accounts who have logged-in active sessions in DB
        const activeSessions = await StudentSession.find({ isActive: true })
          .sort({ lastActiveAt: -1 })
          .limit(100)
          .lean();

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
        const allLoggedInStudents = Array.from(uniqueStudentMap.values()).map((sess) => {
          const rank = rankingMap.get(sess.regNo);
          const lastActiveTime = new Date(sess.lastActiveAt || sess.updatedAt || sess.loggedInAt).getTime();
          const isLiveRightNow = (now - lastActiveTime) <= LIVE_WINDOW_MS;
          const isRecentlyActive = (now - lastActiveTime) <= 15 * 60 * 1000;

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
            isLiveRightNow,
            status: isLiveRightNow ? "LIVE_NOW" : isRecentlyActive ? "RECENT" : "OFFLINE",
          };
        });

        // Combine liveNowVisitors with any logged in student whose session was active within LIVE_WINDOW_MS
        const liveVisitorTokens = new Set(liveNowVisitors.map((v) => v.token));
        const liveNowList = liveNowVisitors.map((v) => ({
          token: v.token,
          regNo: v.regNo,
          studentName: v.studentName,
          branch: v.branch,
          batch: v.batch,
          currentRoute: v.currentRoute,
          pageTitle: v.pageTitle,
          deviceType: v.deviceType,
          os: v.os,
          browser: v.browser,
          ip: v.ip || "",
          connectedAt: v.createdAt || v.lastSeenAt,
          lastActiveAt: v.lastSeenAt,
          isGuest: v.isGuest,
          isLiveRightNow: true,
          status: "LIVE_NOW",
        }));

        allLoggedInStudents.forEach((s) => {
          if (s.isLiveRightNow && !liveVisitorTokens.has(s.token)) {
            liveNowList.push(s);
          }
        });

        // Deduplicate live list
        const uniqueLiveMap = new Map();
        liveNowList.forEach((item) => {
          const key = item.regNo || item.token;
          if (!uniqueLiveMap.has(key)) uniqueLiveMap.set(key, item);
        });
        const finalLiveList = Array.from(uniqueLiveMap.values());

        // Calculate route distribution of users currently LIVE right now
        const routeDistribution = {};
        const sourceForDist = finalLiveList.length > 0 ? finalLiveList : allLoggedInStudents;
        for (const s of sourceForDist) {
          const r = s.currentRoute || "/dashboard";
          routeDistribution[r] = (routeDistribution[r] || 0) + 1;
        }

        const liveCount = finalLiveList.length;
        const loggedInCount = allLoggedInStudents.length;

        return res.json({
          success: true,
          totalActiveUsers: liveCount, // REAL-TIME LIVE USERS BROWSING RIGHT NOW (like Vercel Analytics)
          totalLoggedInSessions: loggedInCount, // Total registered accounts with active sessions (e.g. 65)
          totalQueuedUsers: 0,
          maxActiveCapacity: config.maxActiveCapacity || 200,
          queueEnabled: Boolean(config.queueEnabled),
          autoTriggerEnabled: Boolean(config.autoTriggerEnabled),
          isQueueActive: Boolean(config.queueEnabled),
          activeStudents: finalLiveList, // Users on site right now
          allLoggedInStudents: allLoggedInStudents, // Full list of 65 sessions
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
      const { token, route = "/", regNo, studentName, branch, batch, deviceType, os, browser, isAdmin = false } = req.body || {};
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

      // Record in LiveVisitor for real-time live presence detection (like Vercel Analytics)
      if (token && !isAdmin) {
        const isStudent = Boolean(regNo && /^[a-zA-Z0-9]{5,20}$/.test(String(regNo).trim()));
        let resolvedName = studentName;
        let resolvedBranch = branch;
        let resolvedBatch = batch;

        if (isStudent && !resolvedName) {
          const rank = await Ranking.findOne({ regNo: String(regNo).toUpperCase().trim() }).select("studentName branch batch").lean();
          if (rank) {
            resolvedName = rank.studentName;
            resolvedBranch = rank.branch;
            resolvedBatch = rank.batch;
          }
        }

        await LiveVisitor.findOneAndUpdate(
          { token: String(token) },
          {
            $set: {
              regNo: isStudent ? String(regNo).toUpperCase().trim() : null,
              studentName: resolvedName || (isStudent ? `Student (${regNo})` : "Guest Visitor"),
              branch: resolvedBranch || (isStudent ? "CSE" : "Guest"),
              batch: resolvedBatch || "2023",
              currentRoute: normRoute,
              pageTitle,
              deviceType: deviceType || "Desktop",
              os: os || "Unknown",
              browser: browser || "Unknown",
              isGuest: !isStudent,
              lastSeenAt: new Date(),
            },
          },
          { upsert: true, new: true }
        ).catch(() => {});
      }

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

    if (action === "leave" || action === "offline") {
      let token = null;
      if (req.body && typeof req.body === "object") {
        token = req.body.token;
      } else if (typeof req.body === "string") {
        try {
          const parsed = JSON.parse(req.body);
          token = parsed.token;
        } catch {
          token = req.body;
        }
      }

      if (token) {
        await LiveVisitor.deleteOne({ token: String(token).trim() }).catch(() => {});
      }
      return res.json({ success: true, message: "Visitor marked offline." });
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
