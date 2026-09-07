const express = require("express");
const router = express.Router();
const {
  registerOrUpdateActiveUser,
  removeActiveUser,
  addToQueue,
  removeFromQueue,
  isQueueActive,
  isTokenAdmitted,
  recordPageView,
  currentConfig,
} = require("../utils/liveTrafficManager");

const StudentRouteActivity = require("../models/StudentRouteActivity");
const VercelQuotaMetric = require("../models/VercelQuotaMetric");
const PageAnalytics = require("../models/PageAnalytics");

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

// ─── POST /api/traffic/page-view ─────────────────────────────────────────────
// Called on route navigation. Logs student route & device activity and duration
router.post("/page-view", async (req, res) => {
  try {
    const {
      token,
      route = "/",
      previousRoute = null,
      timeSpentSeconds = 0,
      regNo = null,
      studentName = null,
      branch = null,
      batch = null,
      deviceType = "Desktop",
      os = "Unknown",
      browser = "Unknown",
      isAdmin = false,
    } = req.body;

    const clientToken = token || regNo;
    if (!clientToken) {
      return res.status(400).json({ success: false, message: "Client token or RegNo required" });
    }

    // ─── 1. Always record in PageAnalytics for all routes (including admin) ───
    await PageAnalytics.findOneAndUpdate(
      { route: route || "/" },
      {
        $setOnInsert: { pageTitle: route || "/" },
        $inc: { totalViews: 1 },
        $set: { lastVisitedAt: new Date() },
      },
      { upsert: true }
    ).catch(() => {});

    // ─── 2. Always record in VercelQuotaMetric for all requests ───
    try {
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(Date.now() + istOffset);
      const todayStr = istDate.toISOString().split("T")[0];
      const todayMonthStr = todayStr.slice(0, 7);
      const istDay = istDate.getUTCDay();
      const istH = istDate.getUTCHours();

      const incObj = {
        totalRequests: 1,
        estimatedBandwidthBytes: 28672,
      };
      incObj[`hourlyRequests.${istH}`] = 1;

      await VercelQuotaMetric.findOneAndUpdate(
        { dateStr: todayStr },
        {
          $setOnInsert: { monthStr: todayMonthStr, dayOfWeek: istDay },
          $inc: incObj,
          $set: { lastUpdated: new Date() },
        },
        { upsert: true }
      );
    } catch (quotaErr) {}

    // ─── 3. Filter for StudentRouteActivity & Queue (Exclude Admin) ───
    if (isAdmin) {
      return res.json({
        success: true,
        queued: false,
        admitted: true,
        bypass: true,
      });
    }

    // Special student 230301120327 is strictly exempt from student route activity table
    const cleanReg = regNo ? String(regNo).toUpperCase().trim() : null;
    if (cleanReg === "230301120327") {
      return res.json({ success: true, skipped: true });
    }

    // Log to StudentRouteActivity if cleanReg is available
    if (cleanReg) {
      try {
        const validDuration = Math.max(0, parseInt(timeSpentSeconds, 10) || 0);
        let studentActivity = await StudentRouteActivity.findOne({ regNo: cleanReg });
        const istHour = getIstHour();

        if (!studentActivity) {
          const initialHourly = new Array(24).fill(0);
          initialHourly[istHour] = 1;
          const peakSlot = calculatePeakTimeSlot(initialHourly);

          studentActivity = new StudentRouteActivity({
            regNo: cleanReg,
            studentName: studentName || `Student (${cleanReg})`,
            branch: branch || "CSE",
            batch: batch || (cleanReg.startsWith("23") ? "2023" : "2024"),
            deviceType: deviceType || "Desktop",
            os: os || "Unknown",
            browser: browser || "Unknown",
            currentRoute: route,
            currentPageTitle: route,
            lastActiveRoute: route,
            lastActivePageTitle: route,
            timeSpentCurrentRoute: 0,
            totalTimeSpentSeconds: 0,
            totalPageViews: 1,
            mostVisitedRoute: route,
            mostVisitedPageTitle: route,
            mostVisitedCount: 1,
            mostTimeSpentRoute: route,
            mostTimeSpentPageTitle: route,
            mostTimeSpentSeconds: 0,
            hourlyActivity: initialHourly,
            mostActiveTimeSlot: peakSlot,
            visitedRoutes: [{
              route,
              pageTitle: route,
              durationSeconds: 0,
              visitCount: 1,
              lastVisitedAt: new Date(),
            }],
            firstSeenAt: new Date(),
            lastActiveAt: new Date(),
          });
        } else {
          studentActivity.studentName = studentName || studentActivity.studentName;
          studentActivity.branch = branch || studentActivity.branch;
          studentActivity.batch = batch || studentActivity.batch;
          studentActivity.deviceType = deviceType || studentActivity.deviceType;
          studentActivity.os = os || studentActivity.os;
          studentActivity.browser = browser || studentActivity.browser;
          studentActivity.lastActiveAt = new Date();
          studentActivity.lastActiveRoute = route;
          studentActivity.lastActivePageTitle = route;
          studentActivity.currentRoute = route;
          studentActivity.currentPageTitle = route;
          studentActivity.totalPageViews = (studentActivity.totalPageViews || 0) + 1;

          // Update hourly activity & peak slot
          if (!studentActivity.hourlyActivity || studentActivity.hourlyActivity.length !== 24) {
            studentActivity.hourlyActivity = new Array(24).fill(0);
          }
          studentActivity.hourlyActivity[istHour] = (studentActivity.hourlyActivity[istHour] || 0) + 1;
          studentActivity.mostActiveTimeSlot = calculatePeakTimeSlot(studentActivity.hourlyActivity);

          if (previousRoute && validDuration >= 5) {
            studentActivity.totalTimeSpentSeconds = (studentActivity.totalTimeSpentSeconds || 0) + validDuration;
            const existingRoute = studentActivity.visitedRoutes.find((r) => r.route === previousRoute);
            if (existingRoute) {
              existingRoute.durationSeconds = (existingRoute.durationSeconds || 0) + validDuration;
              existingRoute.visitCount = (existingRoute.visitCount || 0) + 1;
              existingRoute.lastVisitedAt = new Date();
            } else {
              studentActivity.visitedRoutes.push({
                route: previousRoute,
                pageTitle: previousRoute,
                durationSeconds: validDuration,
                visitCount: 1,
                lastVisitedAt: new Date(),
              });
            }
          }

          // Calculate most visited route (by count) and most time spent route (by duration)
          if (studentActivity.visitedRoutes && studentActivity.visitedRoutes.length > 0) {
            const byVisits = [...studentActivity.visitedRoutes].sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));
            studentActivity.mostVisitedRoute = byVisits[0].route;
            studentActivity.mostVisitedPageTitle = byVisits[0].pageTitle || byVisits[0].route;
            studentActivity.mostVisitedCount = byVisits[0].visitCount || 1;

            const byDuration = [...studentActivity.visitedRoutes].sort((a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0));
            studentActivity.mostTimeSpentRoute = byDuration[0].route;
            studentActivity.mostTimeSpentPageTitle = byDuration[0].pageTitle || byDuration[0].route;
            studentActivity.mostTimeSpentSeconds = byDuration[0].durationSeconds || 0;
          }
        }
        await studentActivity.save();
      } catch (err) {
        console.warn("StudentRouteActivity backend save warning:", err.message);
      }
    }

    // Check if token already admitted
    if (isTokenAdmitted(token)) {
      await registerOrUpdateActiveUser({
        token,
        regNo,
        studentName,
        branch,
        batch,
        route,
        deviceType,
        os,
        browser,
        ip: req.ip,
      });
      return res.json({
        success: true,
        queued: false,
        admitted: true,
      });
    }

    // Check if queue is active and user is not yet admitted
    if (isQueueActive()) {
      const queueInfo = addToQueue({
        token,
        regNo,
        studentName,
        branch,
        requestedRoute: route,
        deviceType,
        os,
        browser,
        ip: req.ip,
      });

      return res.json({
        success: true,
        queued: true,
        admitted: false,
        queueInfo,
        message: currentConfig.queueMessage,
      });
    }

    await registerOrUpdateActiveUser({
      token,
      regNo,
      studentName,
      branch,
      batch,
      route,
      deviceType,
      os,
      browser,
      ip: req.ip,
    });

    // Record page view in MongoDB analytics
    await recordPageView(route, token).catch(() => {});

    return res.json({
      success: true,
      queued: false,
      admitted: true,
    });
  } catch (err) {
    console.error("Traffic page-view error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/traffic/heartbeat ─────────────────────────────────────────────
router.post("/heartbeat", async (req, res) => {
  try {
    const { token, route } = req.body;
    if (token) {
      await registerOrUpdateActiveUser({
        token,
        route,
        ip: req.ip,
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/traffic/queue-status ───────────────────────────────────────────
router.get("/queue-status", (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ success: false, message: "Token required" });
  }

  if (isTokenAdmitted(token)) {
    return res.json({
      success: true,
      queued: false,
      admitted: true,
    });
  }

  // Check waiting queue position
  const { getLiveStatsSummary } = require("../utils/liveTrafficManager");
  const summary = getLiveStatsSummary();
  const queuedItem = summary.queuedStudents.find((q) => q.token === token);

  if (queuedItem) {
    return res.json({
      success: true,
      queued: true,
      admitted: false,
      position: queuedItem.position,
      totalInQueue: summary.totalQueuedUsers,
      estimatedWaitSecs: queuedItem.estimatedWaitSecs,
      message: currentConfig.queueMessage,
    });
  }

  // Neither active nor queued
  return res.json({
    success: true,
    queued: isQueueActive(),
    admitted: false,
  });
});

// ─── POST /api/traffic/queue-leave ───────────────────────────────────────────
router.post("/queue-leave", (req, res) => {
  const { token } = req.body;
  if (token) {
    removeFromQueue(token);
    removeActiveUser(token);
  }
  res.json({ success: true });
});

// ─── POST /api/traffic/leave ─────────────────────────────────────────────────
router.post("/leave", (req, res) => {
  const { token } = req.body || {};
  if (token) {
    removeFromQueue(token);
    removeActiveUser(token);
  }
  res.json({ success: true, message: "Visitor marked offline." });
});

module.exports = router;
