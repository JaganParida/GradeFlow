const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { protect } = require("../middleware/auth");
const { requireMainAdmin } = require("../middleware/rbac");
const SubAdmin = require("../models/SubAdmin");
const SubAdminSession = require("../models/SubAdminSession");
const AdminAuditLog = require("../models/AdminAuditLog");
const { sendSubAdminWelcomeEmail } = require("../utils/emailService");

// Enforce Defense-in-Depth: Both JWT protection and Strict Main Admin authorization
router.use(protect);
router.use(requireMainAdmin);

/**
 * Helper to record audit events
 */
async function recordAuditLog({ actorEmail, action, actionType, targetId, result = "SUCCESS", details = {}, req }) {
  try {
    await AdminAuditLog.create({
      actorEmail: actorEmail || "main_admin",
      actorType: "main_admin",
      action,
      actionType,
      targetId: targetId ? String(targetId) : "",
      result,
      details,
      ip: req?.ip || req?.connection?.remoteAddress || "",
      userAgent: req?.headers ? req.headers["user-agent"] : "",
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
}

// ─── 1. GET ALL SUB-ADMINS ──────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const subAdmins = await SubAdmin.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch active session counts for each Sub-Admin
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

    return res.json({
      success: true,
      subAdmins: enriched,
      count: enriched.length,
    });
  } catch (err) {
    console.error("Error fetching sub-admins:", err);
    return res.status(500).json({ success: false, message: "Failed to retrieve sub-admins." });
  }
});

// ─── 2. CREATE NEW SUB-ADMIN (DEFAULT DENY) ─────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, email, password, permissions, status } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: "Sub-Admin full name is required." });
    }

    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "Valid email address is required." });
    }

    if (!password || String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const existing = await SubAdmin.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A Sub-Admin with this email address already exists.",
        code: "EMAIL_EXISTS",
      });
    }

    // Default Deny: if permissions not specified, initialize as empty arrays
    const sanitizedPermissions = {
      routes: Array.isArray(permissions?.routes) ? permissions.routes : [],
      sections: Array.isArray(permissions?.sections) ? permissions.sections : [],
      actions: Array.isArray(permissions?.actions) ? permissions.actions : [],
    };

    const newSubAdmin = await SubAdmin.create({
      name: String(name).trim(),
      email: cleanEmail,
      password: String(password), // hashed via pre-save hook
      permissions: sanitizedPermissions,
      status: ["active", "disabled", "revoked"].includes(status) ? status : "active",
      createdBy: req.admin.email || "main_admin",
    });

    await recordAuditLog({
      actorEmail: req.admin.email,
      action: "SUBADMIN_CREATED",
      actionType: "CREATION",
      targetId: newSubAdmin._id,
      details: {
        createdEmail: cleanEmail,
        name: newSubAdmin.name,
        grantedRoutes: sanitizedPermissions.routes,
        grantedActions: sanitizedPermissions.actions,
      },
      req,
    });

    // Dispatch welcome email asynchronously
    sendSubAdminWelcomeEmail({
      to: cleanEmail,
      name: newSubAdmin.name,
      email: cleanEmail,
      password: String(password),
      assignedModules: sanitizedPermissions.routes,
      loginUrl: process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/admin` : "https://grade-flow-navy.vercel.app/admin",
    }).catch((emailErr) => {
      console.warn("Sub-Admin welcome email notice:", emailErr.message);
    });

    const responseDoc = newSubAdmin.toObject();
    delete responseDoc.password;

    return res.status(201).json({
      success: true,
      message: `Sub-Admin '${newSubAdmin.name}' created successfully.`,
      subAdmin: responseDoc,
    });
  } catch (err) {
    console.error("Error creating sub-admin:", err);
    return res.status(500).json({ success: false, message: "Failed to create sub-admin." });
  }
});

// ─── GET AUDIT LOGS (MAIN ADMIN ONLY) ───────────────────────────
router.get(["/audit/logs", "/logs"], async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const query = {};

    if (req.query.actorType) {
      query.actorType = req.query.actorType;
    }
    if (req.query.action) {
      query.action = req.query.action;
    }
    if (req.query.result) {
      query.result = req.query.result;
    }

    const logs = await AdminAuditLog.find(query)
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return res.status(500).json({ success: false, message: "Failed to retrieve audit logs." });
  }
});

// ─── 3. GET SINGLE SUB-ADMIN WITH DETAILS & SESSIONS ────────────────
router.get("/:id", async (req, res) => {
  try {
    const subAdmin = await SubAdmin.findById(req.params.id)
      .select("-password")
      .lean();

    if (!subAdmin) {
      return res.status(404).json({ success: false, message: "Sub-Admin not found." });
    }

    const sessions = await SubAdminSession.find({
      subAdminId: subAdmin._id,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastActiveAt: -1 })
      .lean();

    return res.json({
      success: true,
      subAdmin: {
        ...subAdmin,
        sessions,
        activeSessionCount: sessions.length,
      },
    });
  } catch (err) {
    console.error("Error fetching sub-admin details:", err);
    return res.status(500).json({ success: false, message: "Failed to retrieve sub-admin details." });
  }
});

// ─── 4. UPDATE SUB-ADMIN BASIC INFO (NAME / EMAIL / PASSWORD) ────────
router.put("/:id", async (req, res) => {
  try {
    const subAdmin = await SubAdmin.findById(req.params.id);
    if (!subAdmin) {
      return res.status(404).json({ success: false, message: "Sub-Admin not found." });
    }

    const { name, email, password } = req.body;
    let changes = {};

    if (name && String(name).trim()) {
      subAdmin.name = String(name).trim();
      changes.name = subAdmin.name;
    }

    if (email && String(email).trim()) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (cleanEmail !== subAdmin.email) {
        const conflict = await SubAdmin.findOne({ email: cleanEmail, _id: { $ne: subAdmin._id } });
        if (conflict) {
          return res.status(409).json({ success: false, message: "Email is already in use by another sub-admin." });
        }
        subAdmin.email = cleanEmail;
        changes.email = cleanEmail;
      }
    }

    if (password && String(password).length >= 8) {
      subAdmin.password = String(password); // Will be hashed by pre-save hook
      changes.passwordChanged = true;
    }

    await subAdmin.save();

    await recordAuditLog({
      actorEmail: req.admin.email,
      action: "SUBADMIN_UPDATED",
      actionType: "UPDATE",
      targetId: subAdmin._id,
      details: changes,
      req,
    });

    const responseDoc = subAdmin.toObject();
    delete responseDoc.password;

    return res.json({
      success: true,
      message: "Sub-Admin updated successfully.",
      subAdmin: responseDoc,
    });
  } catch (err) {
    console.error("Error updating sub-admin:", err);
    return res.status(500).json({ success: false, message: "Failed to update sub-admin." });
  }
});

// ─── 5. UPDATE SUB-ADMIN GRANULAR PERMISSIONS ───────────────────────
router.put("/:id/permissions", async (req, res) => {
  try {
    const subAdmin = await SubAdmin.findById(req.params.id);
    if (!subAdmin) {
      return res.status(404).json({ success: false, message: "Sub-Admin not found." });
    }

    const { permissions } = req.body;
    const oldPermissions = subAdmin.permissions ? JSON.parse(JSON.stringify(subAdmin.permissions)) : {};

    const updatedPermissions = {
      routes: Array.isArray(permissions?.routes) ? permissions.routes : [],
      sections: Array.isArray(permissions?.sections) ? permissions.sections : [],
      actions: Array.isArray(permissions?.actions) ? permissions.actions : [],
    };

    subAdmin.permissions = updatedPermissions;
    await subAdmin.save();

    await recordAuditLog({
      actorEmail: req.admin.email,
      action: "PERMISSIONS_CHANGED",
      actionType: "PERMISSIONS",
      targetId: subAdmin._id,
      details: {
        oldPermissions,
        newPermissions: updatedPermissions,
      },
      req,
    });

    return res.json({
      success: true,
      message: `Permissions for '${subAdmin.name}' updated successfully. Changes are effective immediately.`,
      permissions: updatedPermissions,
    });
  } catch (err) {
    console.error("Error updating permissions:", err);
    return res.status(500).json({ success: false, message: "Failed to update permissions." });
  }
});

// ─── 6. UPDATE SUB-ADMIN STATUS (ACTIVE / DISABLED / REVOKED) ───────
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "disabled", "revoked", "inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const subAdmin = await SubAdmin.findById(req.params.id);
    if (!subAdmin) {
      return res.status(404).json({ success: false, message: "Sub-Admin not found." });
    }

    const oldStatus = subAdmin.status;
    subAdmin.status = status;
    await subAdmin.save();

    // If disabled or revoked, instantly revoke all active sessions
    let revokedSessionCount = 0;
    if (status === "disabled" || status === "revoked") {
      const result = await SubAdminSession.deleteMany({ subAdminId: subAdmin._id });
      revokedSessionCount = result.deletedCount;
    }

    await recordAuditLog({
      actorEmail: req.admin.email,
      action: status === "active" ? "SUBADMIN_ENABLED" : status === "disabled" ? "SUBADMIN_DISABLED" : "SUBADMIN_REVOKED",
      actionType: "STATUS_CHANGE",
      targetId: subAdmin._id,
      details: {
        oldStatus,
        newStatus: status,
        revokedSessions: revokedSessionCount,
      },
      req,
    });

    return res.json({
      success: true,
      message: `Sub-Admin status updated to '${status}'. ${revokedSessionCount > 0 ? `${revokedSessionCount} active session(s) revoked immediately.` : ""}`,
      status,
      revokedSessions: revokedSessionCount,
    });
  } catch (err) {
    console.error("Error updating sub-admin status:", err);
    return res.status(500).json({ success: false, message: "Failed to update status." });
  }
});

// ─── 7. REVOKE ALL SESSIONS FOR SUB-ADMIN ───────────────────────────
router.post("/:id/revoke", async (req, res) => {
  try {
    const subAdmin = await SubAdmin.findById(req.params.id);
    if (!subAdmin) {
      return res.status(404).json({ success: false, message: "Sub-Admin not found." });
    }

    const result = await SubAdminSession.deleteMany({ subAdminId: subAdmin._id });

    await recordAuditLog({
      actorEmail: req.admin.email,
      action: "ALL_SESSIONS_REVOKED",
      actionType: "SESSION_MANAGEMENT",
      targetId: subAdmin._id,
      details: {
        revokedCount: result.deletedCount,
      },
      req,
    });

    return res.json({
      success: true,
      message: `All active sessions (${result.deletedCount}) for '${subAdmin.name}' have been revoked.`,
      revokedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("Error revoking sessions:", err);
    return res.status(500).json({ success: false, message: "Failed to revoke sessions." });
  }
});

// ─── 8. REVOKE SPECIFIC DEVICE SESSION ──────────────────────────────
router.delete("/:id/sessions/:sessionId", async (req, res) => {
  try {
    const { id, sessionId } = req.params;
    const session = await SubAdminSession.findOne({ subAdminId: id, sessionId });

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    await SubAdminSession.deleteOne({ _id: session._id });

    await recordAuditLog({
      actorEmail: req.admin.email,
      action: "DEVICE_SESSION_REVOKED",
      actionType: "SESSION_MANAGEMENT",
      targetId: id,
      details: {
        sessionId,
        deviceInfo: session.deviceInfo,
      },
      req,
    });

    return res.json({
      success: true,
      message: "Device session revoked successfully.",
    });
  } catch (err) {
    console.error("Error revoking device session:", err);
    return res.status(500).json({ success: false, message: "Failed to revoke device session." });
  }
});

// ─── 9. DELETE SUB-ADMIN ACCOUNT ────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const subAdmin = await SubAdmin.findById(req.params.id);
    if (!subAdmin) {
      return res.status(404).json({ success: false, message: "Sub-Admin not found." });
    }

    const email = subAdmin.email;
    const name = subAdmin.name;

    await SubAdminSession.deleteMany({ subAdminId: subAdmin._id });
    await SubAdmin.deleteOne({ _id: subAdmin._id });

    await recordAuditLog({
      actorEmail: req.admin.email,
      action: "SUBADMIN_DELETED",
      actionType: "DELETION",
      targetId: req.params.id,
      details: {
        deletedEmail: email,
        deletedName: name,
      },
      req,
    });

    return res.json({
      success: true,
      message: `Sub-Admin '${name}' and all associated sessions have been permanently deleted.`,
    });
  } catch (err) {
    console.error("Error deleting sub-admin:", err);
    return res.status(500).json({ success: false, message: "Failed to delete sub-admin." });
  }
});

module.exports = router;
