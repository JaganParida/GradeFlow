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

// ─── POST /api/traffic/page-view ─────────────────────────────────────────────
// Called on route navigation. Checks queue requirements and logs route visit
router.post("/page-view", async (req, res) => {
  try {
    const {
      token,
      route = "/",
      regNo = null,
      studentName = null,
      branch = null,
      batch = null,
      deviceType = "Desktop",
      os = "Unknown",
      browser = "Unknown",
      isAdmin = false,
    } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Client token required" });
    }

    // Admins are exempt
    if (isAdmin) {
      return res.json({
        success: true,
        queued: false,
        admitted: true,
        bypass: true,
      });
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
