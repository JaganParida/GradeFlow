const connectToDatabase = require("./_lib/db");
const PageAnalytics = require("./_lib/models/PageAnalytics");
const TrafficQueueConfig = require("./_lib/models/TrafficQueueConfig");
const StudentSession = require("./_lib/models/StudentSession");
const Ranking = require("./_lib/models/Ranking");
const StudentRouteActivity = require("./_lib/models/StudentRouteActivity");
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

function getFriendlyPageTitle(route) {
  const norm = normalizeRoute(route);
  return ROUTE_LABELS[norm] || norm;
}

// Special student regNo to NEVER track
const EXCLUDED_STUDENT_REG = "230301120327";

module.exports = async function handler(req, res) {
  if (applyCors(req, res, "GET,POST,OPTIONS")) return;

  try {
    await connectToDatabase();

    const urlObj = new URL(req.url, "http://localhost");
    const pathname = urlObj.pathname.toLowerCase();
    const isAdminRequest = pathname.includes("/admin/traffic") || req.query.admin === "true";

    // ─── 1. Administrative Traffic Overview (On-Demand Fetch, Zero Socket/Polling) ───
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

        const mostVisited = pages.slice(0, tierSize).map((p) => ({ ...p, tier: "MOST_VISITED" }));
        const mediumVisited = pages.slice(tierSize, tierSize * 2).map((p) => ({ ...p, tier: "MEDIUM_VISITED" }));
        const leastVisited = pages.slice(tierSize * 2).map((p) => ({ ...p, tier: "LEAST_VISITED" }));

        // Fetch Student Activity Logs (Strictly EXCLUDING 230301120327)
        const studentActivities = await StudentRouteActivity.find({
          regNo: { $ne: EXCLUDED_STUDENT_REG },
        })
          .sort({ lastActiveAt: -1 })
          .limit(200)
          .lean();

        // Calculate Overall Route Distribution from student activities
        const routeDistribution = {};
        let totalTimeSpentAllStudents = 0;
        let totalViewsAllStudents = 0;

        studentActivities.forEach((st) => {
          totalTimeSpentAllStudents += st.totalTimeSpentSeconds || 0;
          totalViewsAllStudents += st.totalPageViews || 1;
          const curr = normalizeRoute(st.currentRoute || "/");
          routeDistribution[curr] = (routeDistribution[curr] || 0) + 1;
        });

        return res.json({
          success: true,
          totalTrackedUsers: studentActivities.length,
          totalActiveUsers: studentActivities.length,
          totalLoggedInSessions: studentActivities.length,
          totalQueuedUsers: 0,
          maxActiveCapacity: config.maxActiveCapacity || 200,
          queueEnabled: Boolean(config.queueEnabled),
          autoTriggerEnabled: Boolean(config.autoTriggerEnabled),
          isQueueActive: false,
          activeStudents: studentActivities.map((s) => ({
            token: s.regNo,
            regNo: s.regNo,
            studentName: s.studentName,
            branch: s.branch,
            batch: s.batch,
            deviceType: s.deviceType || "Desktop",
            os: s.os || "Unknown",
            browser: s.browser || "Unknown",
            currentRoute: s.currentRoute || "/",
            pageTitle: s.currentPageTitle || getFriendlyPageTitle(s.currentRoute || "/"),
            timeSpentCurrentRoute: s.timeSpentCurrentRoute || 0,
            totalTimeSpentSeconds: s.totalTimeSpentSeconds || 0,
            mostVisitedRoute: s.mostVisitedRoute || s.currentRoute || "/",
            mostVisitedPageTitle: s.mostVisitedPageTitle || getFriendlyPageTitle(s.mostVisitedRoute || "/"),
            visitedRoutes: s.visitedRoutes || [],
            totalPageViews: s.totalPageViews || 1,
            lastActiveAt: s.lastActiveAt,
            connectedAt: s.firstSeenAt,
            isGuest: false,
            status: "ACTIVE",
          })),
          routeDistribution,
          analytics: {
            allPages: pages,
            mostVisited,
            mediumVisited,
            leastVisited,
            totalTrackedViews: pages.reduce((sum, p) => sum + (p.totalViews || 0), 0),
            totalTimeSpentAllStudents,
            totalViewsAllStudents,
          },
        });
      }
    }

    // ─── 2. Student Route & Device Activity Logging (Zero Live Heartbeat, 100% Vercel Safe) ───
    const action = (req.query.action || "").toLowerCase();

    if (action === "log-activity" || action === "page-view" || (req.method === "POST" && req.body?.route)) {
      const {
        regNo,
        studentName,
        branch,
        batch,
        route = "/",
        previousRoute = null,
        timeSpentSeconds = 0,
        deviceType = "Desktop",
        os = "Unknown",
        browser = "Unknown",
        isAdmin = false,
      } = req.body || {};

      // ─── FILTER 1: Skip if Admin ───
      if (isAdmin || verifyAdmin(req)) {
        return res.json({ success: true, skipped: "admin" });
      }

      // ─── Resolve student registration number ───
      let cleanReg = regNo ? String(regNo).toUpperCase().trim() : null;
      if (!cleanReg) {
        const cookies = parseCookies(req.headers.cookie);
        if (cookies.student_jwt && cookies.student_jwt !== "none") {
          try {
            const decoded = jwt.verify(cookies.student_jwt, process.env.JWT_SECRET);
            if (decoded && decoded.regNo) cleanReg = String(decoded.regNo).toUpperCase().trim();
          } catch {}
        }
      }

      // ─── FILTER 2: Skip Special Student 230301120327 (NEVER track) ───
      if (!cleanReg || cleanReg === EXCLUDED_STUDENT_REG) {
        return res.json({ success: true, skipped: cleanReg === EXCLUDED_STUDENT_REG ? "special_student" : "no_reg" });
      }

      const normRoute = normalizeRoute(route);
      const pageTitle = getFriendlyPageTitle(normRoute);
      const validTimeSpent = Math.max(0, parseInt(timeSpentSeconds, 10) || 0);

      // Resolve student details from Ranking if missing
      let resolvedName = studentName;
      let resolvedBranch = branch;
      let resolvedBatch = batch;

      if (!resolvedName || !resolvedBranch) {
        try {
          const rank = await Ranking.findOne({ regNo: cleanReg }).select("studentName branch batch").lean();
          if (rank) {
            resolvedName = resolvedName || rank.studentName;
            resolvedBranch = resolvedBranch || rank.branch;
            resolvedBatch = resolvedBatch || rank.batch;
          }
        } catch {}
      }

      // Find existing activity record for this student
      let studentActivity = await StudentRouteActivity.findOne({ regNo: cleanReg });

      if (!studentActivity) {
        studentActivity = new StudentRouteActivity({
          regNo: cleanReg,
          studentName: resolvedName || `Student (${cleanReg})`,
          branch: resolvedBranch || "CSE",
          batch: resolvedBatch || (cleanReg.startsWith("23") ? "2023" : "2024"),
          deviceType: deviceType || "Desktop",
          os: os || "Unknown",
          browser: browser || "Unknown",
          currentRoute: normRoute,
          currentPageTitle: pageTitle,
          timeSpentCurrentRoute: 0,
          totalTimeSpentSeconds: 0,
          totalPageViews: 1,
          mostVisitedRoute: normRoute,
          mostVisitedPageTitle: pageTitle,
          visitedRoutes: [{
            route: normRoute,
            pageTitle,
            durationSeconds: 0,
            visitCount: 1,
            lastVisitedAt: new Date(),
          }],
          firstSeenAt: new Date(),
          lastActiveAt: new Date(),
        });
      } else {
        studentActivity.studentName = resolvedName || studentActivity.studentName;
        studentActivity.branch = resolvedBranch || studentActivity.branch;
        studentActivity.batch = resolvedBatch || studentActivity.batch;
        studentActivity.deviceType = deviceType || studentActivity.deviceType;
        studentActivity.os = os || studentActivity.os;
        studentActivity.browser = browser || studentActivity.browser;
        studentActivity.lastActiveAt = new Date();
        studentActivity.totalPageViews = (studentActivity.totalPageViews || 0) + 1;

        // If user stayed on previousRoute for >= 5 seconds, log duration
        if (previousRoute && validTimeSpent >= 5) {
          const normPrev = normalizeRoute(previousRoute);
          const prevTitle = getFriendlyPageTitle(normPrev);

          studentActivity.totalTimeSpentSeconds = (studentActivity.totalTimeSpentSeconds || 0) + validTimeSpent;

          const existingRouteItem = studentActivity.visitedRoutes.find((r) => r.route === normPrev);
          if (existingRouteItem) {
            existingRouteItem.durationSeconds = (existingRouteItem.durationSeconds || 0) + validTimeSpent;
            existingRouteItem.visitCount = (existingRouteItem.visitCount || 0) + 1;
            existingRouteItem.lastVisitedAt = new Date();
          } else {
            studentActivity.visitedRoutes.push({
              route: normPrev,
              pageTitle: prevTitle,
              durationSeconds: validTimeSpent,
              visitCount: 1,
              lastVisitedAt: new Date(),
            });
          }
        }

        // Update current route
        studentActivity.currentRoute = normRoute;
        studentActivity.currentPageTitle = pageTitle;

        // Calculate most visited route for this student
        if (studentActivity.visitedRoutes && studentActivity.visitedRoutes.length > 0) {
          const sortedRoutes = [...studentActivity.visitedRoutes].sort((a, b) => {
            return (b.visitCount || 0) - (a.visitCount || 0) || (b.durationSeconds || 0) - (a.durationSeconds || 0);
          });
          studentActivity.mostVisitedRoute = sortedRoutes[0].route;
          studentActivity.mostVisitedPageTitle = sortedRoutes[0].pageTitle || getFriendlyPageTitle(sortedRoutes[0].route);
        }
      }

      await studentActivity.save().catch((err) => console.warn("Save activity warning:", err.message));

      // Increment PageAnalytics
      await PageAnalytics.findOneAndUpdate(
        { route: normRoute },
        {
          $setOnInsert: { pageTitle },
          $inc: { totalViews: 1 },
          $set: { lastVisitedAt: new Date() },
        },
        { upsert: true }
      ).catch(() => {});

      return res.json({
        success: true,
        logged: true,
        regNo: cleanReg,
        route: normRoute,
      });
    }

    // ─── 3. Final Session Duration on Tab Close / Leave (navigator.sendBeacon) ───
    if (action === "leave" || action === "offline") {
      let regNo = null;
      let currentRoute = "/";
      let durationSeconds = 0;

      if (req.body && typeof req.body === "object") {
        regNo = req.body.regNo;
        currentRoute = req.body.currentRoute || req.body.route || "/";
        durationSeconds = req.body.durationSeconds || req.body.timeSpentSeconds || 0;
      } else if (typeof req.body === "string") {
        try {
          const parsed = JSON.parse(req.body);
          regNo = parsed.regNo;
          currentRoute = parsed.currentRoute || parsed.route || "/";
          durationSeconds = parsed.durationSeconds || parsed.timeSpentSeconds || 0;
        } catch {}
      }

      const cleanReg = regNo ? String(regNo).toUpperCase().trim() : null;
      const validDuration = Math.max(0, parseInt(durationSeconds, 10) || 0);

      // Skip admin and 230301120327
      if (!cleanReg || cleanReg === EXCLUDED_STUDENT_REG || validDuration < 5) {
        return res.json({ success: true, skipped: true });
      }

      const normRoute = normalizeRoute(currentRoute);
      const pageTitle = getFriendlyPageTitle(normRoute);

      try {
        const studentActivity = await StudentRouteActivity.findOne({ regNo: cleanReg });
        if (studentActivity) {
          studentActivity.totalTimeSpentSeconds = (studentActivity.totalTimeSpentSeconds || 0) + validDuration;
          studentActivity.lastActiveAt = new Date();

          const existingRouteItem = studentActivity.visitedRoutes.find((r) => r.route === normRoute);
          if (existingRouteItem) {
            existingRouteItem.durationSeconds = (existingRouteItem.durationSeconds || 0) + validDuration;
            existingRouteItem.lastVisitedAt = new Date();
          } else {
            studentActivity.visitedRoutes.push({
              route: normRoute,
              pageTitle,
              durationSeconds: validDuration,
              visitCount: 1,
              lastVisitedAt: new Date(),
            });
          }
          await studentActivity.save();
        }
      } catch {}

      return res.json({ success: true, saved: true });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Serverless traffic handler error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
