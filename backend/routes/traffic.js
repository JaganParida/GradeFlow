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

    // Admins are strictly exempt
    if (isAdmin) {
      return res.json({
        success: true,
        queued: false,
        admitted: true,
        bypass: true,
      });
    }

    // Special student 230301120327 is strictly exempt from tracking
    const cleanReg = regNo ? String(regNo).toUpperCase().trim() : null;
    if (cleanReg === "230301120327") {
      return res.json({ success: true, skipped: true });
    }

    // Log to StudentRouteActivity if cleanReg is available
    if (cleanReg) {
      try {
        const validDuration = Math.max(0, parseInt(timeSpentSeconds, 10) || 0);
        let studentActivity = await StudentRouteActivity.findOne({ regNo: cleanReg });

        if (!studentActivity) {
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
            totalTimeSpentSeconds: 0,
            totalPageViews: 1,
            mostVisitedRoute: route,
            mostVisitedPageTitle: route,
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
          studentActivity.totalPageViews = (studentActivity.totalPageViews || 0) + 1;
          studentActivity.currentRoute = route;

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
