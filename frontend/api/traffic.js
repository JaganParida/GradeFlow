const connectToDatabase = require("./_lib/db");
const PageAnalytics = require("./_lib/models/PageAnalytics");
const TrafficQueueConfig = require("./_lib/models/TrafficQueueConfig");
const StudentSession = require("./_lib/models/StudentSession");
const Ranking = require("./_lib/models/Ranking");
const StudentRouteActivity = require("./_lib/models/StudentRouteActivity");
const VercelQuotaMetric = require("./_lib/models/VercelQuotaMetric");
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

function getIstHour() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.getUTCHours(); // 0 to 23
}

function calculatePeakTimeSlot(hourlyActivity) {
  if (!Array.isArray(hourlyActivity) || hourlyActivity.length !== 24) return "General";
  let maxCount = 0;
  let peakHour = -1;
  for (let h = 0; h < 24; h++) {
    const count = hourlyActivity[h] || 0;
    if (count > maxCount) {
      maxCount = count;
      peakHour = h;
    }
  }
  if (peakHour === -1 || maxCount === 0) return "General";

  const formatH = (h) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH} ${period}`;
  };

  const start = formatH(peakHour);
  const end = formatH((peakHour + 1) % 24);

  let tag = "Day";
  if (peakHour >= 0 && peakHour < 6) tag = "Late Night";
  else if (peakHour >= 6 && peakHour < 12) tag = "Morning";
  else if (peakHour >= 12 && peakHour < 17) tag = "Afternoon";
  else if (peakHour >= 17 && peakHour < 21) tag = "Evening";
  else tag = "Night";

  return `${start} - ${end} (${tag})`;
}

function getIstDayOfWeek() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

function getIstDateStr() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split("T")[0]; // YYYY-MM-DD
}

function getIstWeekStr() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const d = new Date(now.getTime() + istOffset);
  const dateNum = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = dateNum.getUTCDay() || 7;
  dateNum.setUTCDate(dateNum.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dateNum.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((dateNum - yearStart) / 86400000 + 1) / 7);
  return `${dateNum.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

const DAYS_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function calculatePeakDay(dayCounts) {
  if (!Array.isArray(dayCounts) || dayCounts.length !== 7) return "Weekdays";
  let maxCount = 0;
  let peakIdx = -1;
  dayCounts.forEach((count, idx) => {
    if ((count || 0) > maxCount) {
      maxCount = count;
      peakIdx = idx;
    }
  });
  if (peakIdx === -1 || maxCount === 0) return "Weekdays";
  return DAYS_NAMES[peakIdx] || "Weekdays";
}

module.exports = async function handler(req, res) {
  if (applyCors(req, res, "GET,POST,OPTIONS")) return;

  try {
    await connectToDatabase();

    const urlObj = new URL(req.url, "http://localhost");
    const pathname = urlObj.pathname.toLowerCase();
    const isAdminRequest = pathname.includes("/admin/traffic") || req.query.admin === "true";

    // ─── 1. Admin Live Traffic Overview (On-Demand Fetch, No Interval) ─────────
    if (isAdminRequest) {
      if (!verifyAdmin(req)) {
        return res.status(401).json({ success: false, message: "Unauthorized admin access." });
      }

      const action = (req.query.action || "").toLowerCase();

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
            lastActiveRoute: s.lastActiveRoute || s.currentRoute || "/",
            lastActivePageTitle: s.lastActivePageTitle || s.currentPageTitle || getFriendlyPageTitle(s.currentRoute || "/"),
            timeSpentCurrentRoute: s.timeSpentCurrentRoute || 0,
            totalTimeSpentSeconds: s.totalTimeSpentSeconds || 0,
            mostVisitedRoute: s.mostVisitedRoute || s.currentRoute || "/",
            mostVisitedPageTitle: s.mostVisitedPageTitle || getFriendlyPageTitle(s.mostVisitedRoute || "/"),
            mostVisitedCount: s.mostVisitedCount || 1,
            mostTimeSpentRoute: s.mostTimeSpentRoute || s.mostVisitedRoute || s.currentRoute || "/",
            mostTimeSpentPageTitle: s.mostTimeSpentPageTitle || s.mostVisitedPageTitle || getFriendlyPageTitle(s.mostVisitedRoute || "/"),
            mostTimeSpentSeconds: s.mostTimeSpentSeconds || 0,
            mostActiveTimeSlot: s.mostActiveTimeSlot || "General",
            peakTimeSpentSeconds: s.peakTimeSpentSeconds || s.mostTimeSpentSeconds || s.totalTimeSpentSeconds || 0,
            mostActiveDay: s.mostActiveDay || "Weekdays",
            visitsToday: s.visitsToday || 1,
            visitsThisWeek: s.visitsThisWeek || s.totalPageViews || 1,
            visitedRoutes: (s.visitedRoutes || []).map((vr) => ({
              route: vr.route,
              pageTitle: vr.pageTitle || getFriendlyPageTitle(vr.route),
              durationSeconds: vr.durationSeconds || 0,
              visitCount: vr.visitCount || 1,
              weeklyVisitCount: vr.weeklyVisitCount || Math.min(vr.visitCount || 1, s.visitsThisWeek || 1),
              mostActiveTimeSlot: vr.mostActiveTimeSlot || s.mostActiveTimeSlot || "General",
              peakTimeSpentSeconds: vr.peakTimeSpentSeconds || vr.durationSeconds || 0,
              lastVisitedAt: vr.lastVisitedAt || s.lastActiveAt,
            })),
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

    // Safely parse bodyData (handles pre-parsed objects or raw JSON strings from sendBeacon)
    let bodyData = req.body || {};
    if (typeof bodyData === "string") {
      try {
        bodyData = JSON.parse(bodyData);
      } catch {}
    }

    if (
      action === "log-activity" ||
      action === "page-view" ||
      action === "batch" ||
      (req.method === "POST" && (bodyData.route || bodyData.routes || bodyData.isBatch))
    ) {
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
        isBatch = false,
        routes = [],
        currentRoute: explicitCurrentRoute = null,
      } = bodyData;

      const normRoute = normalizeRoute(explicitCurrentRoute || route);
      const pageTitle = getFriendlyPageTitle(normRoute);
      const todayStr = getIstDateStr();
      const todayMonthStr = todayStr.slice(0, 7);
      const istDay = getIstDayOfWeek();
      const istHour = getIstHour();

      // ─── 1. Always update PageAnalytics for ALL routes (Admin, Student, Guest) ───
      if (!isBatch) {
        await PageAnalytics.findOneAndUpdate(
          { route: normRoute },
          {
            $setOnInsert: { pageTitle },
            $inc: { totalViews: 1 },
            $set: { lastVisitedAt: new Date() },
          },
          { upsert: true }
        ).catch(() => {});
      }

      // ─── 2. Always update VercelQuotaMetric for ALL requests (Vercel counts all serverless hits) ───
      try {
        const incObj = {
          totalRequests: 1,
          estimatedBandwidthBytes: 28672,
        };
        incObj[`hourlyRequests.${istHour}`] = 1;
        await VercelQuotaMetric.findOneAndUpdate(
          { dateStr: todayStr },
          {
            $setOnInsert: { monthStr: todayMonthStr, dayOfWeek: istDay },
            $inc: incObj,
            $set: { lastUpdated: new Date() },
          },
          { upsert: true }
        );
      } catch (quotaIncErr) {}

      // ─── 3. FILTER FOR STUDENT ROUTE INTELLIGENCE TABLE (Exclude Admin) ───
      if (isAdmin || verifyAdmin(req)) {
        return res.json({ success: true, loggedQuota: true, skippedStudentActivity: "admin" });
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

      // ─── FILTER FOR STUDENT ROUTE INTELLIGENCE TABLE (Exclude Special Student 230301120327) ───
      if (!cleanReg || cleanReg === EXCLUDED_STUDENT_REG) {
        return res.json({
          success: true,
          loggedQuota: true,
          skippedStudentActivity: cleanReg === EXCLUDED_STUDENT_REG ? "special_student" : "no_reg",
        });
      }

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
      const istHour = getIstHour();
      const istDay = getIstDayOfWeek();
      const todayStr = getIstDateStr();
      const weekStr = getIstWeekStr();

      if (!studentActivity) {
        const initialHourly = new Array(24).fill(0);
        initialHourly[istHour] = 1;
        const peakSlot = calculatePeakTimeSlot(initialHourly);

        const initialDays = new Array(7).fill(0);
        initialDays[istDay] = 1;

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
          lastActiveRoute: normRoute,
          lastActivePageTitle: pageTitle,
          timeSpentCurrentRoute: 0,
          totalTimeSpentSeconds: 0,
          totalPageViews: 1,
          mostVisitedRoute: normRoute,
          mostVisitedPageTitle: pageTitle,
          mostVisitedCount: 1,
          mostTimeSpentRoute: normRoute,
          mostTimeSpentPageTitle: pageTitle,
          mostTimeSpentSeconds: 0,
          hourlyActivity: initialHourly,
          mostActiveTimeSlot: peakSlot,
          dayOfWeekActivity: initialDays,
          mostActiveDay: DAYS_NAMES[istDay] || "Weekdays",
          visitsToday: 1,
          visitsThisWeek: 1,
          lastVisitDateStr: todayStr,
          lastVisitWeekStr: weekStr,
          visitedRoutes: [{
            route: normRoute,
            pageTitle,
            durationSeconds: 0,
            visitCount: 1,
            weeklyVisitCount: 1,
            hourlyActivity: initialHourly,
            mostActiveTimeSlot: peakSlot,
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
        studentActivity.lastActiveRoute = normRoute;
        studentActivity.lastActivePageTitle = pageTitle;
        studentActivity.currentRoute = normRoute;
        studentActivity.currentPageTitle = pageTitle;
        studentActivity.totalPageViews = (studentActivity.totalPageViews || 0) + 1;

        // Update hourly activity & peak slot
        if (!studentActivity.hourlyActivity || studentActivity.hourlyActivity.length !== 24) {
          studentActivity.hourlyActivity = new Array(24).fill(0);
        }
        studentActivity.hourlyActivity[istHour] = (studentActivity.hourlyActivity[istHour] || 0) + 1;
        studentActivity.mostActiveTimeSlot = calculatePeakTimeSlot(studentActivity.hourlyActivity);

        // Update day of week activity & peak day
        if (!studentActivity.dayOfWeekActivity || studentActivity.dayOfWeekActivity.length !== 7) {
          studentActivity.dayOfWeekActivity = new Array(7).fill(0);
        }
        studentActivity.dayOfWeekActivity[istDay] = (studentActivity.dayOfWeekActivity[istDay] || 0) + 1;
        studentActivity.mostActiveDay = calculatePeakDay(studentActivity.dayOfWeekActivity);

        // Daily & weekly visit tracking
        if (studentActivity.lastVisitDateStr !== todayStr) {
          studentActivity.lastVisitDateStr = todayStr;
          studentActivity.visitsToday = 1;
        } else {
          studentActivity.visitsToday = (studentActivity.visitsToday || 0) + 1;
        }

        if (studentActivity.lastVisitWeekStr !== weekStr) {
          studentActivity.lastVisitWeekStr = weekStr;
          studentActivity.visitsThisWeek = 1;
        } else {
          studentActivity.visitsThisWeek = (studentActivity.visitsThisWeek || 0) + 1;
        }

        // ─── Batch vs Single Route Activity Processing ───
        if (isBatch && Array.isArray(routes) && routes.length > 0) {
          for (const item of routes) {
            const itemRoute = normalizeRoute(item.route || "/");
            const itemTitle = item.pageTitle || getFriendlyPageTitle(itemRoute);
            const itemDur = Math.max(0, parseInt(item.durationSeconds, 10) || 0);

            // Update PageAnalytics for each route in batch
            await PageAnalytics.findOneAndUpdate(
              { route: itemRoute },
              {
                $setOnInsert: { pageTitle: itemTitle },
                $inc: { totalViews: 1 },
                $set: { lastVisitedAt: new Date() },
              },
              { upsert: true }
            ).catch(() => {});

            studentActivity.totalTimeSpentSeconds = (studentActivity.totalTimeSpentSeconds || 0) + itemDur;
            studentActivity.totalPageViews = (studentActivity.totalPageViews || 0) + 1;

            const existingItem = studentActivity.visitedRoutes.find((r) => r.route === itemRoute);
            if (existingItem) {
              existingItem.durationSeconds = (existingItem.durationSeconds || 0) + itemDur;
              existingItem.visitCount = (existingItem.visitCount || 0) + 1;
              existingItem.weeklyVisitCount = (existingItem.weeklyVisitCount || 0) + 1;
              if (!existingItem.hourlyActivity || existingItem.hourlyActivity.length !== 24) {
                existingItem.hourlyActivity = new Array(24).fill(0);
              }
              existingItem.hourlyActivity[istHour] = (existingItem.hourlyActivity[istHour] || 0) + 1;
              existingItem.mostActiveTimeSlot = calculatePeakTimeSlot(existingItem.hourlyActivity);
              existingItem.lastVisitedAt = new Date();
            } else {
              const rHourly = new Array(24).fill(0);
              rHourly[istHour] = 1;
              studentActivity.visitedRoutes.push({
                route: itemRoute,
                pageTitle: itemTitle,
                durationSeconds: itemDur,
                visitCount: 1,
                weeklyVisitCount: 1,
                hourlyActivity: rHourly,
                mostActiveTimeSlot: calculatePeakTimeSlot(rHourly),
                lastVisitedAt: new Date(),
              });
            }
          }
        } else if (previousRoute && validTimeSpent >= 5) {
          const normPrev = normalizeRoute(previousRoute);
          const prevTitle = getFriendlyPageTitle(normPrev);

          studentActivity.totalTimeSpentSeconds = (studentActivity.totalTimeSpentSeconds || 0) + validTimeSpent;

          const existingRouteItem = studentActivity.visitedRoutes.find((r) => r.route === normPrev);
          if (existingRouteItem) {
            existingRouteItem.durationSeconds = (existingRouteItem.durationSeconds || 0) + validTimeSpent;
            existingRouteItem.visitCount = (existingRouteItem.visitCount || 0) + 1;
            existingRouteItem.weeklyVisitCount = (existingRouteItem.weeklyVisitCount || 0) + 1;
            if (!existingRouteItem.hourlyActivity || existingRouteItem.hourlyActivity.length !== 24) {
              existingRouteItem.hourlyActivity = new Array(24).fill(0);
            }
            existingRouteItem.hourlyActivity[istHour] = (existingRouteItem.hourlyActivity[istHour] || 0) + 1;
            existingRouteItem.mostActiveTimeSlot = calculatePeakTimeSlot(existingRouteItem.hourlyActivity);
            existingRouteItem.lastVisitedAt = new Date();
          } else {
            const rHourly = new Array(24).fill(0);
            rHourly[istHour] = 1;
            studentActivity.visitedRoutes.push({
              route: normPrev,
              pageTitle: prevTitle,
              durationSeconds: validTimeSpent,
              visitCount: 1,
              weeklyVisitCount: 1,
              hourlyActivity: rHourly,
              mostActiveTimeSlot: calculatePeakTimeSlot(rHourly),
              lastVisitedAt: new Date(),
            });
          }
        }

        // Calculate most visited route (by count) and most time spent route (by duration)
        if (studentActivity.visitedRoutes && studentActivity.visitedRoutes.length > 0) {
          const byVisits = [...studentActivity.visitedRoutes].sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));
          studentActivity.mostVisitedRoute = byVisits[0].route;
          studentActivity.mostVisitedPageTitle = byVisits[0].pageTitle || getFriendlyPageTitle(byVisits[0].route);
          studentActivity.mostVisitedCount = byVisits[0].visitCount || 1;

          const byDuration = [...studentActivity.visitedRoutes].sort((a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0));
          studentActivity.mostTimeSpentRoute = byDuration[0].route;
          studentActivity.mostTimeSpentPageTitle = byDuration[0].pageTitle || getFriendlyPageTitle(byDuration[0].route);
          studentActivity.mostTimeSpentSeconds = byDuration[0].durationSeconds || 0;
        }
      }

      await studentActivity.save().catch((err) => console.warn("Save activity warning:", err.message));

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
          studentActivity.lastActiveRoute = normRoute;
          studentActivity.lastActivePageTitle = pageTitle;

          const istH = getIstHour();
          if (!studentActivity.hourlyActivity || studentActivity.hourlyActivity.length !== 24) {
            studentActivity.hourlyActivity = new Array(24).fill(0);
          }
          studentActivity.hourlyActivity[istH] = (studentActivity.hourlyActivity[istH] || 0) + 1;
          studentActivity.mostActiveTimeSlot = calculatePeakTimeSlot(studentActivity.hourlyActivity);

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

          if (studentActivity.visitedRoutes && studentActivity.visitedRoutes.length > 0) {
            const byDuration = [...studentActivity.visitedRoutes].sort((a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0));
            studentActivity.mostTimeSpentRoute = byDuration[0].route;
            studentActivity.mostTimeSpentPageTitle = byDuration[0].pageTitle || getFriendlyPageTitle(byDuration[0].route);
            studentActivity.mostTimeSpentSeconds = byDuration[0].durationSeconds || 0;

            const byVisits = [...studentActivity.visitedRoutes].sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));
            studentActivity.mostVisitedRoute = byVisits[0].route;
            studentActivity.mostVisitedPageTitle = byVisits[0].pageTitle || getFriendlyPageTitle(byVisits[0].route);
            studentActivity.mostVisitedCount = byVisits[0].visitCount || 1;
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
