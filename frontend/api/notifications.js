const connectToDatabase = require("./_lib/db");
const StudentNotification = require("./_lib/models/StudentNotification");
const StudentSession = require("./_lib/models/StudentSession");
const Student = require("./_lib/models/Student");
const jwt = require("jsonwebtoken");
const {
  respondDeviceApproval,
  authEventBus,
} = require("./_lib/sessionManager");

const { applyCors } = require("./_lib/cors");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts[0].trim();
    const val = parts.slice(1).join("=").trim();
    if (name) cookies[name] = decodeURIComponent(val);
  });
  return cookies;
}

async function authenticateStudent(req) {
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies.student_jwt || req.headers["x-student-token"];
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || token === "none") return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.regNo || !decoded.sessionId) return null;

    const session = await StudentSession.findOne({
      regNo: decoded.regNo,
      sessionId: decoded.sessionId,
      isActive: true,
    });

    if (!session) return null;

    return { regNo: decoded.regNo, sessionId: decoded.sessionId };
  } catch {
    return null;
  }
}

async function authenticateAdmin(req) {
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies.jwt || cookies.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || token === "none") return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.role === "student" || decoded.regNo) {
      return null;
    }
    if (decoded.role === "admin" || decoded.adminType === "main" || decoded.adminType === "subadmin") {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (applyCors(req, res, "GET,POST,DELETE,OPTIONS")) return;

  try {
    await connectToDatabase();

    let action = req.query.action;
    if (!action && req.url) {
      const cleanUrl = req.url.split("?")[0];
      if (cleanUrl.includes("/student")) action = "student";
      else if (cleanUrl.includes("/approve")) action = "approve";
      else if (cleanUrl.includes("/deny")) action = "deny";
      else if (cleanUrl.includes("/mark-read")) action = "mark-read";
      else if (cleanUrl.includes("/action")) action = "action";
      else if (cleanUrl.includes("/broadcasts")) action = "admin-broadcast-list";
      else if (cleanUrl.includes("/broadcast")) action = req.method === "DELETE" ? "admin-broadcast-delete" : "admin-broadcast";
      else if (cleanUrl.includes("/stream")) action = "stream";
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN ENDPOINTS (Broadcasts)
    // ─────────────────────────────────────────────────────────────────────────

    // A. Send Broadcast Notification to All Students
    if ((action === "admin-broadcast" || action === "broadcast") && req.method === "POST") {
      const admin = await authenticateAdmin(req);
      if (!admin) {
        return res.status(401).json({ success: false, message: "Unauthorized: Admin authentication required." });
      }

      const {
        title,
        message,
        type = "BROADCAST_ANNOUNCEMENT",
        badge = "Announcement",
        badgeColor = "blue",
        primaryButton = { label: "Check Now", action: "NAVIGATE", targetRoute: "/leaderboard" },
        secondaryButton = { label: "Understood", action: "DISMISS" },
        targetAudience = "ALL",
        expiresInHours = 72,
      } = req.body || {};

      if (!title || !message) {
        return res.status(400).json({ success: false, message: "Title and message are required." });
      }

      const notificationId = `notif_bc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : null;

      const newBroadcast = await StudentNotification.create({
        notificationId,
        regNo: "ALL",
        type,
        title: title.trim(),
        message: message.trim(),
        primaryButton: {
          label: primaryButton?.label?.trim() || "Check Now",
          action: primaryButton?.action || "NAVIGATE",
          targetRoute: primaryButton?.targetRoute?.trim() || "",
        },
        secondaryButton: {
          label: secondaryButton?.label?.trim() || "Understood",
          action: secondaryButton?.action || "DISMISS",
        },
        badge: badge?.trim() || "Announcement",
        badgeColor: badgeColor || "blue",
        sender: {
          name: admin.name || "Administrator",
          role: "ADMIN",
        },
        targetAudience,
        status: "UNREAD",
        expiresAt,
        createdAt: new Date(),
      });

      // Broadcast real-time SSE event to all connected clients
      try {
        authEventBus.emit("notification:ALL", {
          type: "BROADCAST",
          notification: newBroadcast,
        });
      } catch {}

      return res.json({
        success: true,
        message: "Broadcast notification published to all students successfully!",
        notification: newBroadcast,
      });
    }

    // B. List Broadcast Notifications (Admin View)
    if ((action === "admin-broadcast-list" || action === "broadcast-list" || action === "broadcasts") && req.method === "GET") {
      const admin = await authenticateAdmin(req);
      if (!admin) {
        return res.status(401).json({ success: false, message: "Unauthorized: Admin authentication required." });
      }

      const broadcasts = await StudentNotification.find({ regNo: "ALL" })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // Collect all student regNos across all broadcasts to fetch their profiles in 1 single fast query
      const allRegNos = new Set();
      broadcasts.forEach((b) => {
        (b.readBy || []).forEach((r) => {
          if (r.regNo && r.regNo !== "GUEST") allRegNos.add(String(r.regNo).toUpperCase());
        });
        (b.dismissedBy || []).forEach((d) => {
          const reg = typeof d === "string" ? d : d?.regNo;
          if (reg && reg !== "GUEST") allRegNos.add(String(reg).toUpperCase());
        });
      });

      // Query student names/branches in one batch
      const studentMap = new Map();
      if (allRegNos.size > 0) {
        const studentDocs = await Student.find(
          { regNo: { $in: Array.from(allRegNos) } },
          "regNo name branch section"
        ).lean().catch(() => []);
        (studentDocs || []).forEach((s) => {
          studentMap.set(String(s.regNo).toUpperCase(), {
            name: s.name || "",
            branch: s.branch || "",
            section: s.section || "",
          });
        });
      }

      const enriched = broadcasts.map((b) => {
        // Unique read entries
        const readEntries = (b.readBy || []).map((r) => {
          const reg = String(r.regNo || "GUEST").toUpperCase();
          const info = studentMap.get(reg) || {};
          return {
            regNo: reg,
            name: info.name || "",
            branch: info.branch || "",
            section: info.section || "",
            readAt: r.readAt || null,
            actionTaken: r.actionTaken || "CHECK_NOW",
            device: r.device || "Unknown Device",
          };
        });
        const uniqueReaders = new Map();
        readEntries.forEach((r) => uniqueReaders.set(r.regNo, r));

        // Unique dismissed entries
        const dismissEntries = (b.dismissedBy || []).map((d) => {
          const reg = String(typeof d === "string" ? d : (d?.regNo || "GUEST")).toUpperCase();
          const info = studentMap.get(reg) || {};
          return {
            regNo: reg,
            name: info.name || "",
            branch: info.branch || "",
            section: info.section || "",
            dismissedAt: typeof d === "object" ? d.dismissedAt : null,
            device: typeof d === "object" ? (d.device || "Unknown Device") : "Unknown Device",
          };
        });
        const uniqueDismissers = new Map();
        dismissEntries.forEach((d) => uniqueDismissers.set(d.regNo, d));

        return {
          ...b,
          readCount: uniqueReaders.size,
          dismissedCount: uniqueDismissers.size,
          readDetails: Array.from(uniqueReaders.values()),
          dismissedDetails: Array.from(uniqueDismissers.values()),
        };
      });

      return res.json({
        success: true,
        broadcasts: enriched,
      });
    }

    // C. Delete Broadcast Notification (Admin)
    if (action === "admin-broadcast-delete" || action === "broadcast-delete" || (action === "broadcast" && req.method === "DELETE")) {
      const admin = await authenticateAdmin(req);
      if (!admin) {
        return res.status(401).json({ success: false, message: "Unauthorized: Admin authentication required." });
      }

      const { notificationId } = req.body || req.query || {};
      if (!notificationId) {
        return res.status(400).json({ success: false, message: "Notification ID is required." });
      }

      await StudentNotification.deleteOne({ notificationId, regNo: "ALL" });
      return res.json({ success: true, message: "Broadcast notification removed." });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STUDENT ENDPOINTS
    // ─────────────────────────────────────────────────────────────────────────

    const student = await authenticateStudent(req);

    // 1. Fetch Student Notifications (Personal + Active Broadcasts)
    if (action === "student" && req.method === "GET") {
      const regNo = student?.regNo || null;
      const currentSessionId = student?.sessionId || null;

      // Clean up expired notifications
      await StudentNotification.updateMany(
        {
          status: "UNREAD",
          expiresAt: { $lte: new Date() },
        },
        { $set: { status: "EXPIRED" } }
      ).catch(() => {});

      const now = new Date();
      const directFilter = regNo
        ? {
            regNo,
            $or: [{ targetSessionId: null }, { targetSessionId: currentSessionId }],
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          }
        : null;

      const broadcastFilter = {
        regNo: "ALL",
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      };

      const [directList, rawBroadcastList] = await Promise.all([
        directFilter ? StudentNotification.find(directFilter).sort({ createdAt: -1 }).limit(20).lean() : [],
        StudentNotification.find(broadcastFilter).sort({ createdAt: -1 }).limit(30).lean(),
      ]);

      // Filter out broadcasts that this student has dismissed (supports both old string and new object entries)
      const broadcastList = rawBroadcastList.filter((b) => {
        if (!regNo || !b.dismissedBy || b.dismissedBy.length === 0) return true;
        return !b.dismissedBy.some((d) => {
          if (typeof d === "string") return d === regNo;
          if (d && typeof d === "object" && d.regNo) return d.regNo === regNo;
          return false;
        });
      });

      const combined = [...directList, ...broadcastList];
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      let unreadCount = 0;
      const mapped = combined.map((item) => {
        const isBroadcast = item.regNo === "ALL";
        let isRead = false;

        if (isBroadcast) {
          isRead = regNo ? (item.readBy || []).some((r) => r.regNo === regNo) : false;
        } else {
          isRead = item.status === "READ" || item.status === "APPROVED" || item.status === "DENIED" || item.status === "EXPIRED";
        }

        if (!isRead) unreadCount++;

        return {
          ...item,
          isBroadcast,
          isRead,
        };
      });

      return res.json({
        success: true,
        unreadCount,
        notifications: mapped,
      });
    }

    // 2. Notification Action (Click "Check Now" or "Understood")
    if ((action === "action" || action === "button-action") && req.method === "POST") {
      const { notificationId, actionType } = req.body || {};
      if (!notificationId) {
        return res.status(400).json({ success: false, message: "Notification ID is required." });
      }

      const notif = await StudentNotification.findOne({ notificationId });
      if (!notif) {
        return res.status(404).json({ success: false, message: "Notification not found." });
      }

      const regNo = (student?.regNo || req.body?.regNo || "GUEST").trim().toUpperCase();
      const ua = req.headers["user-agent"] || "";
      const rawDevice = req.body?.deviceType || (/Mobile|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop");
      const cleanDevice = req.body?.platform ? `${rawDevice} · ${req.body.platform}` : (/Mobile|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop");

      if (actionType === "CHECK_NOW") {
        if (notif.regNo === "ALL") {
          const existingReads = Array.isArray(notif.readBy) ? notif.readBy : [];
          const updatedReads = existingReads.filter((r) => String(r.regNo || "").toUpperCase() !== regNo);
          updatedReads.push({
            regNo,
            readAt: new Date(),
            actionTaken: "CHECK_NOW",
            device: cleanDevice,
          });
          notif.readBy = updatedReads;
          notif.markModified("readBy");
          await notif.save();
        } else if (student && notif.regNo === student.regNo) {
          notif.status = "READ";
          notif.readAt = new Date();
          await notif.save();
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
          // 1. Filter out existing readBy entry for this regNo, then push new UNDERSTOOD entry
          const existingReads = Array.isArray(notif.readBy) ? notif.readBy : [];
          const updatedReads = existingReads.filter((r) => String(r.regNo || "").toUpperCase() !== regNo);
          updatedReads.push({
            regNo,
            readAt: new Date(),
            actionTaken: "UNDERSTOOD",
            device: cleanDevice,
          });
          notif.readBy = updatedReads;

          // 2. Filter out existing dismissedBy entry for this regNo, then push new dismissed entry
          const existingDismissed = Array.isArray(notif.dismissedBy) ? notif.dismissedBy : [];
          const updatedDismissed = existingDismissed.filter((d) => {
            if (typeof d === "string") return d.toUpperCase() !== regNo;
            if (d && typeof d === "object" && d.regNo) return String(d.regNo).toUpperCase() !== regNo;
            return true;
          });
          updatedDismissed.push({
            regNo,
            dismissedAt: new Date(),
            device: cleanDevice,
          });
          notif.dismissedBy = updatedDismissed;

          notif.markModified("readBy");
          notif.markModified("dismissedBy");
          await notif.save();
        } else if (student && notif.regNo === student.regNo) {
          notif.status = "READ";
          notif.readAt = new Date();
          await notif.save();
        }

        return res.json({
          success: true,
          action: "DISMISSED",
          message: "Notification dismissed.",
        });
      }

      return res.status(400).json({ success: false, message: "Invalid action type." });
    }

    // 3. Approve Device Request (Multi-device login handover)
    if (action === "approve" && req.method === "POST") {
      if (!student) {
        return res.status(401).json({ success: false, message: "Authentication required." });
      }
      const { requestId } = req.body || {};
      if (!requestId) {
        return res.status(400).json({ success: false, message: "Request ID is required." });
      }

      const result = await respondDeviceApproval(
        StudentSession,
        requestId,
        student.sessionId,
        "ALLOW"
      );

      if (result.success) return res.json(result);
      return res.status(400).json(result);
    }

    // 4. Deny Device Request
    if (action === "deny" && req.method === "POST") {
      if (!student) {
        return res.status(401).json({ success: false, message: "Authentication required." });
      }
      const { requestId } = req.body || {};
      if (!requestId) {
        return res.status(400).json({ success: false, message: "Request ID is required." });
      }

      const result = await respondDeviceApproval(
        StudentSession,
        requestId,
        student.sessionId,
        "DENY"
      );

      if (result.success) return res.json(result);
      return res.status(400).json(result);
    }

    // 5. Mark All Notifications as Read
    if (action === "mark-read" && req.method === "POST") {
      const { notificationId } = req.body || {};
      const regNo = student?.regNo || null;

      if (notificationId) {
        const notif = await StudentNotification.findOne({ notificationId });
        if (notif) {
          if (notif.regNo === "ALL" && regNo) {
            await StudentNotification.updateOne(
              { notificationId },
              { $addToSet: { readBy: { regNo, readAt: new Date(), actionTaken: "MARK_READ" } } }
            );
          } else {
            await StudentNotification.updateOne(
              { notificationId },
              { $set: { status: "READ", readAt: new Date() } }
            );
          }
        }
      } else if (regNo) {
        await StudentNotification.updateMany(
          { regNo, status: "UNREAD" },
          { $set: { status: "READ", readAt: new Date() } }
        );
        await StudentNotification.updateMany(
          { regNo: "ALL" },
          { $addToSet: { readBy: { regNo, readAt: new Date(), actionTaken: "MARK_READ" } } }
        );
      }

      return res.json({ success: true, message: "Notifications marked as read." });
    }

    // 6. SSE Real-time Notification Stream
    if (action === "stream" && req.method === "GET") {
      const regNo = student?.regNo || "GUEST";
      const currentSessionId = student?.sessionId || "GUEST";

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      res.flushHeaders?.();
      res.write(`event: connected\ndata: ${JSON.stringify({ connected: true, regNo })}\n\n`);

      const onNotification = (data) => {
        try {
          res.write(`event: notification\ndata: ${JSON.stringify(data)}\n\n`);
        } catch {}
      };

      const onSessionRevoked = (data) => {
        try {
          if (data.revokedSessionId === currentSessionId || !data.revokedSessionId) {
            res.write(`event: session_revoked\ndata: ${JSON.stringify(data)}\n\n`);
          }
        } catch {}
      };

      if (regNo !== "GUEST") {
        authEventBus.on(`notification:${regNo}:${currentSessionId}`, onNotification);
        authEventBus.on(`notification:${regNo}`, onNotification);
        authEventBus.on(`session_revoked:${regNo}`, onSessionRevoked);
      }
      authEventBus.on("notification:ALL", onNotification);

      const heartbeat = setInterval(() => {
        try {
          res.write(`: heartbeat\n\n`);
        } catch {}
      }, 25000);

      req.on("close", () => {
        clearInterval(heartbeat);
        if (regNo !== "GUEST") {
          authEventBus.off(`notification:${regNo}:${currentSessionId}`, onNotification);
          authEventBus.off(`notification:${regNo}`, onNotification);
          authEventBus.off(`session_revoked:${regNo}`, onSessionRevoked);
        }
        authEventBus.off("notification:ALL", onNotification);
        res.end();
      });

      return;
    }

    return res.status(404).json({ success: false, message: `Unknown notification action: ${action}` });
  } catch (err) {
    console.error("Notifications handler error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
