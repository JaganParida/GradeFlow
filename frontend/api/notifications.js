const connectToDatabase = require("./_lib/db");
const StudentNotification = require("./_lib/models/StudentNotification");
const StudentSession = require("./_lib/models/StudentSession");
const jwt = require("jsonwebtoken");
const {
  respondDeviceApproval,
  authEventBus,
} = require("./_lib/sessionManager");

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, x-student-token",
};

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

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectToDatabase();

    const student = await authenticateStudent(req);
    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Active student authentication required.",
      });
    }

    let action = req.query.action;
    if (!action && req.url) {
      const cleanUrl = req.url.split("?")[0];
      if (cleanUrl.includes("/student")) action = "student";
      else if (cleanUrl.includes("/approve")) action = "approve";
      else if (cleanUrl.includes("/deny")) action = "deny";
      else if (cleanUrl.includes("/mark-read")) action = "mark-read";
      else if (cleanUrl.includes("/stream")) action = "stream";
    }

    // 1. Fetch notifications
    if (action === "student" && req.method === "GET") {
      const regNo = student.regNo;
      const currentSessionId = student.sessionId;

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
        $or: [{ targetSessionId: null }, { targetSessionId: currentSessionId }],
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      })
        .sort({ createdAt: -1 })
        .limit(20);

      const unreadCount = await StudentNotification.countDocuments({
        regNo,
        $or: [{ targetSessionId: null }, { targetSessionId: currentSessionId }],
        status: "UNREAD",
        $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }],
      });

      return res.json({
        success: true,
        unreadCount,
        notifications,
      });
    }

    // 2. Approve device request
    if (action === "approve" && req.method === "POST") {
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

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    }

    // 3. Deny device request
    if (action === "deny" && req.method === "POST") {
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

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    }

    // 4. Mark notifications read
    if (action === "mark-read" && req.method === "POST") {
      const { notificationId } = req.body || {};
      const regNo = student.regNo;

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
    }

    // 5. SSE Stream
    if (action === "stream" && req.method === "GET") {
      const regNo = student.regNo;
      const currentSessionId = student.sessionId;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      res.flushHeaders?.();

      res.write(`event: connected\ndata: ${JSON.stringify({ connected: true, regNo })}\n\n`);

      const onNotification = (data) => {
        try {
          const targetId = data.notification?.targetSessionId || data.approvalRequest?.targetSessionId;
          if (!targetId || targetId === currentSessionId) {
            res.write(`event: notification\ndata: ${JSON.stringify(data)}\n\n`);
          }
        } catch {}
      };

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
