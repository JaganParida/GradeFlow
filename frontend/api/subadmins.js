const connectToDatabase = require("./_lib/db");
const SubAdmin = require("./_lib/models/SubAdmin");
const SubAdminSession = require("./_lib/models/SubAdminSession");
const AdminSession = require("./_lib/models/AdminSession");
const AdminAuditLog = require("./_lib/models/AdminAuditLog");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token, x-student-token",
  "Access-Control-Allow-Credentials": "true",
};

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    let [name, ...rest] = cookie.split("=");
    name = name?.trim();
    if (!name) return;
    const value = rest.join("=").trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectToDatabase();

    // ── Authentication Check ──
    const cookies = parseCookies(req.headers.cookie);
    let token = req.headers["x-admin-token"];
    if (!token && cookies.jwt && cookies.jwt !== "none") {
      token = cookies.jwt;
    }
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token || token === "none") {
      const studentToken = cookies.student_jwt || req.headers["x-student-token"];
      if (studentToken && studentToken !== "none") {
        try {
          const decodedStudent = jwt.verify(studentToken, process.env.JWT_SECRET);
          if (decodedStudent && (decodedStudent.role === "student" || decodedStudent.regNo)) {
            if (decodedStudent.regNo !== "230301120327") {
              return res.status(403).json({
                success: false,
                message: "Forbidden: Administrative access restricted. Student accounts cannot access administrative endpoints.",
                code: "STUDENT_ADMIN_ACCESS_FORBIDDEN",
              });
            }
          }
        } catch {}
      }
      return res.status(401).json({ success: false, message: "Authentication required.", code: "AUTH_REQUIRED" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === "student" || decoded.regNo) {
        if (decoded.regNo !== "230301120327") {
          return res.status(403).json({
            success: false,
            message: "Forbidden: Administrative access restricted. Student accounts cannot access administrative endpoints.",
            code: "STUDENT_ADMIN_ACCESS_FORBIDDEN",
          });
        }
      }
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired token.", code: "INVALID_TOKEN" });
    }

    // ── Strictly Main Admin Authorization ──
    if (decoded.role !== "admin" || decoded.adminType === "subadmin") {
      try {
        await AdminAuditLog.create({
          actorEmail: decoded.email || "unauthorized_subadmin",
          actorType: "subadmin",
          action: "UNAUTHORIZED_ADMIN_MANAGEMENT_ATTEMPT",
          actionType: "SECURITY_ALERT",
          route: req.url,
          result: "FORBIDDEN",
          ip: req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "",
          userAgent: req.headers["user-agent"] || "",
        });
      } catch {}

      return res.status(403).json({
        success: false,
        message: "Access Denied: Only the Main Administrator is authorized to access Admin Management.",
        code: "MAIN_ADMIN_REQUIRED",
      });
    }

    // Verify Main Admin Session
    if (decoded.sessionId) {
      const activeSession = await AdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
      if (!activeSession) {
        return res.status(401).json({
          success: false,
          message: "Admin session ended because this device was logged out.",
          code: "ADMIN_SESSION_TERMINATED",
        });
      }
    }

    const { id, action, sessionId } = req.query;

    // ── 1. GET AUDIT LOGS ──
    if (action === "logs" || (req.url && req.url.includes("/logs") && req.method === "GET")) {
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const query = {};
      if (req.query.actorType) query.actorType = req.query.actorType;
      if (req.query.action) query.action = req.query.action;
      if (req.query.result) query.result = req.query.result;

      const logs = await AdminAuditLog.find(query).sort({ timestamp: -1, createdAt: -1 }).limit(limit).lean();
      return res.json({ success: true, logs, count: logs.length });
    }

    // ── 2. GET ALL SUB-ADMINS ──
    if (!id && req.method === "GET") {
      const subAdmins = await SubAdmin.find().select("-password").sort({ createdAt: -1 }).lean();
      const subAdminIds = subAdmins.map((s) => s._id);
      const activeSessions = await SubAdminSession.find({
        subAdminId: { $in: subAdminIds },
        isActive: true,
        expiresAt: { $gt: new Date() },
      }).lean();

      const sessionCountMap = {};
      activeSessions.forEach((s) => {
        const sid = String(s.subAdminId);
        sessionCountMap[sid] = (sessionCountMap[sid] || 0) + 1;
      });

      const enriched = subAdmins.map((s) => ({
        ...s,
        activeSessionCount: sessionCountMap[String(s._id)] || 0,
      }));

      return res.json({ success: true, subAdmins: enriched, count: enriched.length });
    }

    // ── 3. CREATE SUB-ADMIN (DEFAULT DENY) ──
    if (!id && req.method === "POST") {
      const { name, email, password, permissions, status } = req.body || {};

      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, message: "Sub-Admin full name is required." });
      }

      const cleanEmail = String(email || "").trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: "Valid email address is required." });
      }

      if (!password || String(password).length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
      }

      const existing = await SubAdmin.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ success: false, message: "A Sub-Admin with this email already exists.", code: "EMAIL_EXISTS" });
      }

      const sanitizedPermissions = {
        routes: Array.isArray(permissions?.routes) ? permissions.routes : [],
        sections: Array.isArray(permissions?.sections) ? permissions.sections : [],
        actions: Array.isArray(permissions?.actions) ? permissions.actions : [],
      };

      const newSubAdmin = await SubAdmin.create({
        name: String(name).trim(),
        email: cleanEmail,
        password: String(password),
        permissions: sanitizedPermissions,
        status: ["active", "disabled", "revoked"].includes(status) ? status : "active",
        createdBy: decoded.email || "main_admin",
      });

      try {
        await AdminAuditLog.create({
          actorEmail: decoded.email || "main_admin",
          actorType: "main_admin",
          action: "SUBADMIN_CREATED",
          actionType: "CREATION",
          targetId: String(newSubAdmin._id),
          details: { createdEmail: cleanEmail, name: newSubAdmin.name, grantedRoutes: sanitizedPermissions.routes },
          ip: req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "",
          userAgent: req.headers["user-agent"] || "",
        });
      } catch {}

      const responseDoc = newSubAdmin.toObject();
      delete responseDoc.password;
      return res.status(201).json({ success: true, message: `Sub-Admin '${newSubAdmin.name}' created successfully.`, subAdmin: responseDoc });
    }

    // ── 4. GET SINGLE SUB-ADMIN WITH DETAILS & SESSIONS ──
    if (id && !action && req.method === "GET") {
      const subAdmin = await SubAdmin.findById(id).select("-password").lean();
      if (!subAdmin) return res.status(404).json({ success: false, message: "Sub-Admin not found." });

      const sessions = await SubAdminSession.find({
        subAdminId: subAdmin._id,
        isActive: true,
        expiresAt: { $gt: new Date() },
      }).sort({ lastActiveAt: -1 }).lean();

      return res.json({
        success: true,
        subAdmin: { ...subAdmin, sessions, activeSessionCount: sessions.length },
      });
    }

    // ── 5. UPDATE SUB-ADMIN BASIC INFO ──
    if (id && !action && req.method === "PUT") {
      const subAdmin = await SubAdmin.findById(id);
      if (!subAdmin) return res.status(404).json({ success: false, message: "Sub-Admin not found." });

      const { name, email, password } = req.body || {};
      if (name && String(name).trim()) subAdmin.name = String(name).trim();

      if (email && String(email).trim()) {
        const cleanEmail = String(email).trim().toLowerCase();
        if (cleanEmail !== subAdmin.email) {
          const conflict = await SubAdmin.findOne({ email: cleanEmail, _id: { $ne: subAdmin._id } });
          if (conflict) return res.status(409).json({ success: false, message: "Email is already in use by another sub-admin." });
          subAdmin.email = cleanEmail;
        }
      }

      if (password && String(password).length >= 8) {
        subAdmin.password = String(password);
      }

      await subAdmin.save();

      try {
        await AdminAuditLog.create({
          actorEmail: decoded.email || "main_admin",
          actorType: "main_admin",
          action: "SUBADMIN_UPDATED",
          actionType: "UPDATE",
          targetId: String(subAdmin._id),
          ip: req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "",
          userAgent: req.headers["user-agent"] || "",
        });
      } catch {}

      const responseDoc = subAdmin.toObject();
      delete responseDoc.password;
      return res.json({ success: true, message: "Sub-Admin updated successfully.", subAdmin: responseDoc });
    }

    // ── 6. UPDATE GRANULAR PERMISSIONS ──
    if (id && action === "permissions" && req.method === "PUT") {
      const subAdmin = await SubAdmin.findById(id);
      if (!subAdmin) return res.status(404).json({ success: false, message: "Sub-Admin not found." });

      const { permissions } = req.body || {};
      const updatedPermissions = {
        routes: Array.isArray(permissions?.routes) ? permissions.routes : [],
        sections: Array.isArray(permissions?.sections) ? permissions.sections : [],
        actions: Array.isArray(permissions?.actions) ? permissions.actions : [],
      };

      subAdmin.permissions = updatedPermissions;
      await subAdmin.save();

      try {
        await AdminAuditLog.create({
          actorEmail: decoded.email || "main_admin",
          actorType: "main_admin",
          action: "PERMISSIONS_CHANGED",
          actionType: "PERMISSIONS",
          targetId: String(subAdmin._id),
          details: { newPermissions: updatedPermissions },
          ip: req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "",
          userAgent: req.headers["user-agent"] || "",
        });
      } catch {}

      return res.json({
        success: true,
        message: `Permissions for '${subAdmin.name}' updated successfully. Changes are effective immediately.`,
        permissions: updatedPermissions,
      });
    }

    // ── 7. UPDATE STATUS (ACTIVE / DISABLED / REVOKED) ──
    if (id && action === "status" && req.method === "PUT") {
      const { status } = req.body || {};
      if (!["active", "disabled", "revoked"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value." });
      }

      const subAdmin = await SubAdmin.findById(id);
      if (!subAdmin) return res.status(404).json({ success: false, message: "Sub-Admin not found." });

      subAdmin.status = status;
      await subAdmin.save();

      let revokedSessionCount = 0;
      if (status === "disabled" || status === "revoked") {
        const result = await SubAdminSession.deleteMany({ subAdminId: subAdmin._id });
        revokedSessionCount = result.deletedCount;
      }

      try {
        await AdminAuditLog.create({
          actorEmail: decoded.email || "main_admin",
          actorType: "main_admin",
          action: status === "active" ? "SUBADMIN_ENABLED" : status === "disabled" ? "SUBADMIN_DISABLED" : "SUBADMIN_REVOKED",
          actionType: "STATUS_CHANGE",
          targetId: String(subAdmin._id),
          details: { status, revokedSessions: revokedSessionCount },
          ip: req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "",
          userAgent: req.headers["user-agent"] || "",
        });
      } catch {}

      return res.json({
        success: true,
        message: `Sub-Admin status updated to '${status}'. ${revokedSessionCount > 0 ? `${revokedSessionCount} active session(s) revoked immediately.` : ""}`,
        status,
        revokedSessions: revokedSessionCount,
      });
    }

    // ── 8. REVOKE ALL SESSIONS ──
    if (id && action === "revoke" && req.method === "POST") {
      const subAdmin = await SubAdmin.findById(id);
      if (!subAdmin) return res.status(404).json({ success: false, message: "Sub-Admin not found." });

      const result = await SubAdminSession.deleteMany({ subAdminId: subAdmin._id });
      return res.json({
        success: true,
        message: `All active sessions (${result.deletedCount}) for '${subAdmin.name}' have been revoked.`,
        revokedCount: result.deletedCount,
      });
    }

    // ── 9. REVOKE SPECIFIC DEVICE SESSION ──
    if (id && action === "revoke-session" && req.method === "DELETE") {
      const targetSessionId = sessionId || req.query.targetSessionId;
      const session = await SubAdminSession.findOne({ subAdminId: id, sessionId: targetSessionId });
      if (!session) return res.status(404).json({ success: false, message: "Session not found." });

      await SubAdminSession.deleteOne({ _id: session._id });
      return res.json({ success: true, message: "Device session revoked successfully." });
    }

    // ── 10. DELETE SUB-ADMIN ──
    if (id && !action && req.method === "DELETE") {
      const subAdmin = await SubAdmin.findById(id);
      if (!subAdmin) return res.status(404).json({ success: false, message: "Sub-Admin not found." });

      const email = subAdmin.email;
      const name = subAdmin.name;

      await SubAdminSession.deleteMany({ subAdminId: subAdmin._id });
      await SubAdmin.deleteOne({ _id: subAdmin._id });

      try {
        await AdminAuditLog.create({
          actorEmail: decoded.email || "main_admin",
          actorType: "main_admin",
          action: "SUBADMIN_DELETED",
          actionType: "DELETION",
          targetId: id,
          details: { deletedEmail: email, deletedName: name },
          ip: req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "",
          userAgent: req.headers["user-agent"] || "",
        });
      } catch {}

      return res.json({ success: true, message: `Sub-Admin '${name}' deleted successfully.` });
    }

    return res.status(404).json({ success: false, message: "Sub-Admin API route not found." });
  } catch (err) {
    console.error("Sub-Admin serverless handler error:", err);
    return res.status(500).json({ success: false, message: "Server error handling sub-admin request." });
  }
};
