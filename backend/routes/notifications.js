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
    const currentSessionId = req.student.sessionId;

    // Clean up expired notifications
    await StudentNotification.updateMany(
      {
        regNo,
        status: "UNREAD",
        expiresAt: { $lte: new Date() },
      },
      { $set: { status: "EXPIRED" } }
    );

    const now = new Date();
    const directFilter = {
      regNo,
      $or: [{ targetSessionId: null }, { targetSessionId: currentSessionId }],
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    };

    const broadcastFilter = {
      regNo: "ALL",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    };

    const [directList, rawBroadcastList] = await Promise.all([
      StudentNotification.find(directFilter).sort({ createdAt: -1 }).limit(20).lean(),
      StudentNotification.find(broadcastFilter).sort({ createdAt: -1 }).limit(30).lean(),
    ]);

    // Filter out broadcasts that this student has dismissed
    const broadcastList = rawBroadcastList.filter((b) => {
      if (!b.dismissedBy || b.dismissedBy.length === 0) return true;
      return !b.dismissedBy.some((d) => {
        if (typeof d === "string") return d === regNo;
        if (d && typeof d === "object" && d.regNo) return d.regNo === regNo;
        return false;
      });
    });

    // Map read status for broadcast notifications per student
    const mappedBroadcasts = broadcastList.map((b) => {
      const readEntry = (b.readBy || []).find((r) => {
        if (typeof r === "string") return r === regNo;
        if (r && typeof r === "object" && r.regNo) return r.regNo === regNo;
        return false;
      });
      const isRead = Boolean(readEntry);
      return {
        ...b,
        isRead,
        status: isRead ? "READ" : "UNREAD",
        readAt: (readEntry && typeof readEntry === "object") ? readEntry.readAt : (isRead ? b.createdAt : null),
      };
    });

    // Combine direct notifications + active broadcast announcements
    const combined = [...directList, ...mappedBroadcasts];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Strictly limit to the 10 most recent notifications
    const recentTen = combined.slice(0, 10);

    // Count unread strictly among the recent 10 items
    const unreadCount = recentTen.filter((n) => {
      if (n.regNo === "ALL") {
        return !n.isRead;
      }
      return n.status === "UNREAD";
    }).length;

    return res.json({
      success: true,
      unreadCount,
      notifications: recentTen,
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

// 4b. Handle 2-Button Action (Check Now / Understood)
router.post("/action", protectStudent, async (req, res) => {
  try {
    const { notificationId, actionType } = req.body || {};
    if (!notificationId) {
      return res.status(400).json({ success: false, message: "Notification ID is required." });
    }

    const notif = await StudentNotification.findOne({ notificationId });
    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    const regNo = req.student.regNo;

    if (actionType === "CHECK_NOW") {
      if (notif.regNo === "ALL") {
        await StudentNotification.updateOne(
          { notificationId },
          { $addToSet: { readBy: { regNo, readAt: new Date(), actionTaken: "CHECK_NOW" } } }
        );
      } else {
        await StudentNotification.updateOne(
          { notificationId },
          { $set: { status: "READ", readAt: new Date() } }
        );
      }

      return res.json({
        success: true,
        action: "NAVIGATE",
        targetRoute: notif.primaryButton?.targetRoute || "",
        message: "Marked as read.",
      });
    }

    if (actionType === "UNDERSTOOD" || actionType === "DISMISS") {
      if (notif.regNo === "ALL") {
        await StudentNotification.updateOne(
          { notificationId },
          {
            $addToSet: {
              dismissedBy: regNo,
              readBy: { regNo, readAt: new Date(), actionTaken: "UNDERSTOOD" },
            },
          }
        );
      } else {
        await StudentNotification.updateOne(
          { notificationId },
          { $set: { status: "READ", readAt: new Date() } }
        );
      }

      return res.json({
        success: true,
        action: "DISMISSED",
        message: "Notification dismissed.",
      });
    }

    return res.status(400).json({ success: false, message: "Invalid action type." });
  } catch (err) {
    console.error("Notification action error:", err);
    return res.status(500).json({ success: false, message: "Server error processing notification action." });
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

  // Notification listener (strictly filtering target session if specified)
  const onNotification = (data) => {
    try {
      const targetId = data.notification?.targetSessionId || data.approvalRequest?.targetSessionId;
      if (!targetId || targetId === currentSessionId) {
        res.write(`event: notification\ndata: ${JSON.stringify(data)}\n\n`);
      }
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

  authEventBus.on(`notification:${regNo}:${currentSessionId}`, onNotification);
  authEventBus.on(`notification:${regNo}`, onNotification);
  authEventBus.on(`session_revoked:${regNo}`, onSessionRevoked);
  authEventBus.on("notification:ALL", onNotification);

  // Keep-alive heartbeat every 25s
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch {}
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    authEventBus.off(`notification:${regNo}:${currentSessionId}`, onNotification);
    authEventBus.off(`notification:${regNo}`, onNotification);
    authEventBus.off(`session_revoked:${regNo}`, onSessionRevoked);
    authEventBus.off("notification:ALL", onNotification);
    res.end();
  });
});

module.exports = router;
