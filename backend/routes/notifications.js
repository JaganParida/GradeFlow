const express = require("express");
const StudentNotification = require("../models/StudentNotification");
const DeviceApprovalRequest = require("../models/DeviceApprovalRequest");
const StudentSession = require("../models/StudentSession");
const { protectStudent } = require("../middleware/auth");
const {
  respondDeviceApproval,
  authEventBus,
} = require("../utils/sessionManager");

const router = express.Router();

// 1. Fetch all active and recent notifications for the authenticated student
router.get("/student", protectStudent, async (req, res) => {
  try {
    const regNo = req.student.regNo;

    // Clean up expired notifications
    await StudentNotification.updateMany(
      {
        regNo,
        status: "UNREAD",
        expiresAt: { $lte: new Date() },
      },
      { $set: { status: "EXPIRED" } }
    );

    const notifications = await StudentNotification.find({
      regNo,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    }).sort({ createdAt: -1 }).limit(20);

    const unreadCount = await StudentNotification.countDocuments({
      regNo,
      status: "UNREAD",
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    return res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (err) {
    console.error("Fetch notifications error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching notifications." });
  }
});

// 2. Approve a pending device login request
router.post("/approve", protectStudent, async (req, res) => {
  try {
    const { requestId } = req.body || {};
    if (!requestId) {
      return res.status(400).json({ success: false, message: "Request ID is required." });
    }

    const result = await respondDeviceApproval(
      StudentSession,
      requestId,
      req.student.sessionId,
      "ALLOW"
    );

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (err) {
    console.error("Approve notification error:", err);
    return res.status(500).json({ success: false, message: "Server error approving login request." });
  }
});

// 3. Deny a pending device login request
router.post("/deny", protectStudent, async (req, res) => {
  try {
    const { requestId } = req.body || {};
    if (!requestId) {
      return res.status(400).json({ success: false, message: "Request ID is required." });
    }

    const result = await respondDeviceApproval(
      StudentSession,
      requestId,
      req.student.sessionId,
      "DENY"
    );

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (err) {
    console.error("Deny notification error:", err);
    return res.status(500).json({ success: false, message: "Server error denying login request." });
  }
});

// 4. Mark notifications as read
router.post("/mark-read", protectStudent, async (req, res) => {
  try {
    const { notificationId } = req.body || {};
    const regNo = req.student.regNo;

    if (notificationId) {
      await StudentNotification.updateOne(
        { notificationId, regNo },
        { $set: { status: "READ", readAt: new Date() } }
      );
    } else {
      await StudentNotification.updateMany(
        { regNo, status: "UNREAD" },
        { $set: { status: "READ", readAt: new Date() } }
      );
    }

    return res.json({ success: true, message: "Notifications marked as read." });
  } catch (err) {
    console.error("Mark read notification error:", err);
    return res.status(500).json({ success: false, message: "Server error updating notifications." });
  }
});

// 5. Server-Sent Events (SSE) real-time notification & revocation stream
router.get("/stream", protectStudent, (req, res) => {
  const regNo = req.student.regNo;
  const currentSessionId = req.student.sessionId;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders?.();

  // Send initial connection ACK
  res.write(`event: connected\ndata: ${JSON.stringify({ connected: true, regNo })}\n\n`);

  // Notification listener
  const onNotification = (data) => {
    try {
      res.write(`event: notification\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {}
  };

  // Session Revocation listener
  const onSessionRevoked = (data) => {
    try {
      if (data.revokedSessionId === currentSessionId || !data.revokedSessionId) {
        res.write(`event: session_revoked\ndata: ${JSON.stringify(data)}\n\n`);
      }
    } catch {}
  };

  authEventBus.on(`notification:${regNo}`, onNotification);
  authEventBus.on(`session_revoked:${regNo}`, onSessionRevoked);

  // Keep-alive heartbeat every 25s
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch {}
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    authEventBus.off(`notification:${regNo}`, onNotification);
    authEventBus.off(`session_revoked:${regNo}`, onSessionRevoked);
    res.end();
  });
});

module.exports = router;
