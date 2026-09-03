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
        const LIVE_WINDOW_MS = 60 * 1000;
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
          const isMultiDevice = sess.regNo === "230301120327";
          const devType = String(sess.deviceInfo?.deviceType || "Desktop").toLowerCase().includes("mobile") ? "Mobile" : "Desktop";
          const sessKey = isMultiDevice ? `${sess.regNo}_${devType}` : sess.regNo;
          if (!uniqueStudentMap.has(sessKey)) {
            uniqueStudentMap.set(sessKey, sess);
          }
        }

        const regNos = Array.from(new Set(Array.from(uniqueStudentMap.values()).map((s) => s.regNo)));
        const rankings = await Ranking.find({ regNo: { $in: regNos } }).select("regNo studentName branch batch").lean();
        const rankingMap = new Map(rankings.map((r) => [r.regNo, r]));

        const now = Date.now();
        const allLoggedInStudents = Array.from(uniqueStudentMap.values()).map((sess) => {
          const rank = rankingMap.get(sess.regNo);
          const lastActiveTime = new Date(sess.lastActiveAt || sess.updatedAt || sess.loggedInAt).getTime();
          const isLiveRightNow = (now - lastActiveTime) <= LIVE_WINDOW_MS;
          const isRecentlyActive = (now - lastActiveTime) <= 15 * 60 * 1000;

          const currRoute = sess.currentRoute || sess.deviceInfo?.currentRoute || "/dashboard";
          const pageTitle = sess.pageTitle || sess.deviceInfo?.pageTitle || (ROUTE_LABELS[currRoute] || "Student Dashboard");

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
        const liveNowList = liveNowVisitors.map((v) => ({
          token: v.token,
          regNo: v.regNo,
          studentName: v.studentName,
          branch: v.branch,
          batch: v.batch,
          currentRoute: v.currentRoute || "/",
          pageTitle: v.pageTitle || (ROUTE_LABELS[v.currentRoute] || "GradeFlow"),
          deviceType: v.deviceType || "Desktop",
          os: v.os || "Unknown",
          browser: v.browser || "Unknown",
          ip: v.ip || "",
          connectedAt: v.createdAt || v.lastSeenAt,
          lastActiveAt: v.lastSeenAt,
          isGuest: v.isGuest,
          isLiveRightNow: true,
          status: "LIVE_NOW",
        }));

        allLoggedInStudents.forEach((s) => {
          if (s.isLiveRightNow) {
            liveNowList.push(s);
          }
        });

        // Sort live items strictly by lastActiveAt descending so the latest real-time route is always selected first!
        liveNowList.sort((a, b) => {
          const timeA = new Date(a.lastActiveAt || a.connectedAt || 0).getTime();
          const timeB = new Date(b.lastActiveAt || b.connectedAt || 0).getTime();
          return timeB - timeA;
        });

        // Deduplicate live list:
        // 1. Guest visitor (regNo is null): keyed by unique token
        // 2. 230301120327: keyed strictly by regNo + clean deviceType (Desktop vs Mobile) -> AT MOST 2 ROWS (1 Laptop + 1 Mobile)
        // 3. Regular student: keyed strictly by regNo -> STRICTLY 1 ROW
        const uniqueLiveMap = new Map();
        liveNowList.forEach((item) => {
          let key;
          if (!item.regNo) {
            key = item.token;
          } else if (item.regNo === "230301120327") {
            const dev = String(item.deviceType || "Desktop").toLowerCase().includes("mobile") ? "Mobile" : "Desktop";
            key = `${item.regNo}_${dev}`;
          } else {
            key = item.regNo;
          }

          if (!uniqueLiveMap.has(key)) {
            uniqueLiveMap.set(key, item);
          } else {
            const existing = uniqueLiveMap.get(key);
            if (existing.isGuest && !item.isGuest) {
              existing.isGuest = false;
              existing.regNo = item.regNo;
              existing.studentName = item.studentName;
              existing.branch = item.branch;
              existing.batch = item.batch;
            }
            const timeExisting = new Date(existing.lastActiveAt || existing.connectedAt || 0).getTime();
            const timeItem = new Date(item.lastActiveAt || item.connectedAt || 0).getTime();
            if (timeItem >= timeExisting && item.currentRoute && item.currentRoute !== "/") {
              existing.currentRoute = item.currentRoute;
              existing.pageTitle = item.pageTitle;
              existing.lastActiveAt = item.lastActiveAt;
            }
          }
        });
        const finalLiveList = Array.from(uniqueLiveMap.values());

        // Sync real-time currentRoute into allLoggedInStudents as well
        allLoggedInStudents.forEach((s) => {
          const isMultiDevice = s.regNo === "230301120327";
          const dev = String(s.deviceType || "Desktop").toLowerCase().includes("mobile") ? "Mobile" : "Desktop";
          const liveKey = isMultiDevice ? `${s.regNo}_${dev}` : s.regNo;
          const liveMatch = uniqueLiveMap.get(liveKey);
          if (liveMatch) {
            s.currentRoute = liveMatch.currentRoute;
            s.pageTitle = liveMatch.pageTitle;
            s.lastActiveAt = liveMatch.lastActiveAt;
            s.isLiveRightNow = true;
            s.status = "LIVE_NOW";
          }
        });

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
      const { token, sessionId, route = "/", regNo, studentName, branch, batch, deviceType, os, browser, isAdmin = false } = req.body || {};
      const normRoute = normalizeRoute(route);
      const pageTitle = ROUTE_LABELS[normRoute] || normRoute;

      // Extract student registration number and session ID from cookies if not provided in payload (essential for mobile browser hydration)
      const cookies = parseCookies(req.headers.cookie);
      let resolvedRegNo = regNo;
      let resolvedSessionId = sessionId;
      if (cookies.student_jwt && cookies.student_jwt !== "none") {
        try {
          const decoded = jwt.verify(cookies.student_jwt, process.env.JWT_SECRET);
          if (decoded && decoded.regNo && !resolvedRegNo) {
            resolvedRegNo = decoded.regNo;
          }
          if (decoded && decoded.sessionId && !resolvedSessionId) {
            resolvedSessionId = decoded.sessionId;
          }
        } catch {}
      }

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
        const isStudent = Boolean(resolvedRegNo && /^[a-zA-Z0-9]{5,20}$/.test(String(resolvedRegNo).trim()));
        let resolvedName = studentName;
        let resolvedBranch = branch;
        let resolvedBatch = batch;

        if (isStudent) {
          const rank = await Ranking.findOne({ regNo: String(resolvedRegNo).toUpperCase().trim() }).select("studentName branch batch").lean();
          if (rank) {
            if (!resolvedName || resolvedName === "Guest Visitor") resolvedName = rank.studentName;
            if (!resolvedBranch || resolvedBranch === "Guest") resolvedBranch = rank.branch;
            if (!resolvedBatch) resolvedBatch = rank.batch;
          }
        }

        await LiveVisitor.findOneAndUpdate(
          { token: String(token) },
          {
            $set: {
              regNo: isStudent ? String(resolvedRegNo).toUpperCase().trim() : null,
              studentName: resolvedName || (isStudent ? `Student (${resolvedRegNo})` : "Guest Visitor"),
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

      // Update StudentSession for registered student
      if (resolvedSessionId) {
        await StudentSession.updateOne(
          { sessionId: resolvedSessionId, isActive: true },
          {
            $set: {
              lastActiveAt: new Date(),
              currentRoute: normRoute,
              pageTitle,
              "deviceInfo.currentRoute": normRoute,
              "deviceInfo.pageTitle": pageTitle,
            },
          }
        ).catch(() => {});
      } else if (resolvedRegNo) {
        const cleanDev = String(deviceType || "Desktop").toLowerCase().includes("mobile") ? "Mobile" : "Desktop";
        await StudentSession.updateMany(
          {
            regNo: String(resolvedRegNo).toUpperCase().trim(),
            isActive: true,
            ...(resolvedRegNo === "230301120327" ? { "deviceInfo.deviceType": cleanDev } : {}),
          },
          {
            $set: {
              lastActiveAt: new Date(),
              currentRoute: normRoute,
              pageTitle,
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
      let regNo = null;
      let deviceType = null;
      if (req.body && typeof req.body === "object") {
        token = req.body.token;
        regNo = req.body.regNo;
        deviceType = req.body.deviceType;
      } else if (typeof req.body === "string") {
        try {
          const parsed = JSON.parse(req.body);
          token = parsed.token;
          regNo = parsed.regNo;
          deviceType = parsed.deviceType;
        } catch {
          token = req.body;
        }
      }

      if (token) {
        await LiveVisitor.deleteMany({ token: String(token).trim() }).catch(() => {});
      }
      if (regNo && regNo === "230301120327") {
        const cleanDev = String(deviceType || "Mobile").toLowerCase().includes("mobile") ? "Mobile" : "Desktop";
        await LiveVisitor.deleteMany({ regNo, deviceType: cleanDev }).catch(() => {});
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
