const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const PageAnalytics = require("../models/PageAnalytics");
const TrafficQueueConfig = require("../models/TrafficQueueConfig");
const {
  getLiveStatsSummary,
  getCategorizedPageAnalytics,
  admitNextStudents,
  admitSpecificStudent,
  flushWaitingQueue,
  currentConfig,
} = require("../utils/liveTrafficManager");
const liveTrafficManager = require("../utils/liveTrafficManager");

// All admin traffic routes require administrative authentication
router.use(protect);

const StudentRouteActivity = require("../models/StudentRouteActivity");

// ─── GET /api/admin/traffic/live-overview ─────────────────────────────────────
// Returns student activity and route analytics (strictly excluding 230301120327)
router.get("/live-overview", async (req, res) => {
  try {
    const studentActivities = await StudentRouteActivity.find({
      regNo: { $ne: "230301120327" },
    })
      .sort({ lastActiveAt: -1 })
      .limit(200)
      .lean();

    const analytics = await getCategorizedPageAnalytics();
    const config = currentConfig;

    const routeDistribution = {};
    let totalTimeSpentAllStudents = 0;
    let totalViewsAllStudents = 0;

    studentActivities.forEach((st) => {
      totalTimeSpentAllStudents += st.totalTimeSpentSeconds || 0;
      totalViewsAllStudents += st.totalPageViews || 1;
      const curr = st.currentRoute || "/";
      routeDistribution[curr] = (routeDistribution[curr] || 0) + 1;
    });

    res.json({
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
        pageTitle: s.currentPageTitle || s.currentRoute || "/",
        lastActiveRoute: s.lastActiveRoute || s.currentRoute || "/",
        lastActivePageTitle: s.lastActivePageTitle || s.currentPageTitle || s.currentRoute || "/",
        timeSpentCurrentRoute: s.timeSpentCurrentRoute || 0,
        totalTimeSpentSeconds: s.totalTimeSpentSeconds || 0,
        mostVisitedRoute: s.mostVisitedRoute || s.currentRoute || "/",
        mostVisitedPageTitle: s.mostVisitedPageTitle || s.mostVisitedRoute || "/",
        mostVisitedCount: s.mostVisitedCount || 1,
        mostTimeSpentRoute: s.mostTimeSpentRoute || s.mostVisitedRoute || s.currentRoute || "/",
        mostTimeSpentPageTitle: s.mostTimeSpentPageTitle || s.mostVisitedPageTitle || s.mostVisitedRoute || "/",
        mostTimeSpentSeconds: s.mostTimeSpentSeconds || 0,
        mostActiveTimeSlot: s.mostActiveTimeSlot || "General",
        peakTimeSpentSeconds: s.peakTimeSpentSeconds || s.mostTimeSpentSeconds || s.totalTimeSpentSeconds || 0,
        mostActiveDay: s.mostActiveDay || "Weekdays",
        visitsToday: s.visitsToday || 1,
        visitsThisWeek: s.visitsThisWeek || s.totalPageViews || 1,
        visitedRoutes: (s.visitedRoutes || []).map((vr) => ({
          route: vr.route,
          pageTitle: vr.pageTitle || vr.route,
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
        ...analytics,
        totalTimeSpentAllStudents,
        totalViewsAllStudents,
      },
    });
  } catch (err) {
    console.error("Error fetching live traffic overview:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/admin/traffic/queue/config ─────────────────────────────────────
// Admin updates queue settings (Master toggle, 200+ capacity threshold, auto-trigger, messages)
router.post("/queue/config", async (req, res) => {
  try {
    const {
      queueEnabled,
      autoTriggerEnabled,
      maxActiveCapacity,
      queueMessage,
      estimatedWaitPerStudentSeconds,
    } = req.body;

    const updateFields = {
      updatedBy: req.admin?.email || "admin",
      updatedAt: new Date(),
    };

    if (queueEnabled !== undefined) updateFields.queueEnabled = Boolean(queueEnabled);
    if (autoTriggerEnabled !== undefined) updateFields.autoTriggerEnabled = Boolean(autoTriggerEnabled);
    if (maxActiveCapacity !== undefined) updateFields.maxActiveCapacity = Math.max(1, parseInt(maxActiveCapacity, 10) || 200);
    if (queueMessage !== undefined) updateFields.queueMessage = String(queueMessage).slice(0, 500);
    if (estimatedWaitPerStudentSeconds !== undefined) {
      updateFields.estimatedWaitPerStudentSeconds = Math.max(1, parseInt(estimatedWaitPerStudentSeconds, 10) || 15);
    }

    const updatedConfig = await TrafficQueueConfig.findOneAndUpdate(
      { key: "global_traffic_config" },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    // Update in-memory engine config
    liveTrafficManager.currentConfig = {
      queueEnabled: Boolean(updatedConfig.queueEnabled),
      autoTriggerEnabled: Boolean(updatedConfig.autoTriggerEnabled),
      maxActiveCapacity: Number(updatedConfig.maxActiveCapacity),
      queueMessage: updatedConfig.queueMessage,
      estimatedWaitPerStudentSeconds: Number(updatedConfig.estimatedWaitPerStudentSeconds),
    };

    res.json({
      success: true,
      message: "Traffic & queue settings updated successfully.",
      config: liveTrafficManager.currentConfig,
    });
  } catch (err) {
    console.error("Error updating queue config:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/admin/traffic/queue/admit-next ─────────────────────────────────
// Batch admit next N students from waiting queue
router.post("/queue/admit-next", (req, res) => {
  try {
    const count = Math.max(1, parseInt(req.body.count, 10) || 10);
    const admittedCount = admitNextStudents(count);

    res.json({
      success: true,
      admittedCount,
      message: `Successfully admitted ${admittedCount} student(s) from the virtual queue.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/admin/traffic/queue/admit-student ──────────────────────────────
// Admit specific student by queueId or registration number
router.post("/queue/admit-student", (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Student identifier required" });
    }

    const success = admitSpecificStudent(identifier);
    if (!success) {
      return res.status(404).json({ success: false, message: "Student not found in active queue." });
    }

    res.json({
      success: true,
      message: "Student admitted successfully.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/admin/traffic/queue/flush ──────────────────────────────────────
// Clear or admit all students currently waiting in queue
router.post("/queue/flush", (req, res) => {
  try {
    const admitAll = req.body.admitAll !== false;
    const flushedCount = flushWaitingQueue(admitAll);

    res.json({
      success: true,
      flushedCount,
      message: admitAll
        ? `Successfully admitted all ${flushedCount} student(s) from the queue.`
        : `Successfully cleared ${flushedCount} student(s) from the queue.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/admin/traffic/analytics/reset ──────────────────────────────────
// Optional administrative action to reset page view counts
router.post("/analytics/reset", async (req, res) => {
  try {
    await PageAnalytics.deleteMany({});
    res.json({
      success: true,
      message: "Page visit analytics reset successfully.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
