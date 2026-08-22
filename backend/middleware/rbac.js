const SubAdmin = require("../models/SubAdmin");
const AdminAuditLog = require("../models/AdminAuditLog");

/**
 * Enforces that the requesting actor is exclusively the Main Administrator.
 * Sub-Admins receive an immediate 403 Forbidden with audit logging.
 */
const requireMainAdmin = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        code: "AUTH_REQUIRED",
      });
    }

    if (req.admin.adminType !== "main") {
      // Record unauthorized privilege escalation / access attempt
      try {
        await AdminAuditLog.create({
          actorEmail: req.admin.email || "unknown_subadmin",
          actorType: "subadmin",
          action: "UNAUTHORIZED_MAIN_ADMIN_ACCESS_ATTEMPT",
          actionType: "SECURITY_ALERT",
          route: req.originalUrl || req.url,
          result: "FORBIDDEN",
          details: {
            attemptedEndpoint: req.originalUrl || req.url,
            method: req.method,
            subAdminId: req.admin.subAdminId,
          },
          ip: req.ip || req.connection?.remoteAddress || "",
          userAgent: req.headers["user-agent"] || "",
        });
      } catch (logErr) {
        console.error("Audit log error on unauthorized access:", logErr.message);
      }

      return res.status(403).json({
        success: false,
        message: "Access Denied: Only the Institutional Main Administrator is authorized to access Admin Management.",
        code: "MAIN_ADMIN_REQUIRED",
      });
    }

    next();
  } catch (err) {
    console.error("requireMainAdmin error:", err);
    return res.status(500).json({ success: false, message: "Authorization verification failed." });
  }
};

/**
 * Enforces Granular Route, Section, and Action permissions.
 * Main Admin is automatically permitted.
 * Sub-Admin permissions are read authoritatively from the database on every request (Fail-Closed).
 *
 * @param {string} [requiredAction] - e.g. "students.update", "results.upload", "emails.send"
 * @param {string} [requiredRoute] - e.g. "overview", "toppers", "backlogs", "manage"
 * @param {string} [requiredSection] - e.g. "overview.upload-results", "toppers.view"
 */
const requirePermission = (requiredAction, requiredRoute, requiredSection) => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
          code: "AUTH_REQUIRED",
        });
      }

      // 1. Main Admin has unrestricted access to all functional capabilities
      if (req.admin.adminType === "main") {
        return next();
      }

      // 2. Sub-Admin: Query live database state (Default Deny & Fail Closed)
      const subAdmin = await SubAdmin.findById(req.admin.subAdminId);
      if (!subAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: Sub-Admin account not found.",
          code: "SUBADMIN_NOT_FOUND",
        });
      }

      if (subAdmin.status !== "active") {
        return res.status(403).json({
          success: false,
          message: `Access Denied: Sub-Admin account is currently ${subAdmin.status}.`,
          code: `SUBADMIN_${subAdmin.status.toUpperCase()}`,
        });
      }

      const permissions = subAdmin.permissions || { routes: [], sections: [], actions: [] };
      const grantedRoutes = permissions.routes || [];
      const grantedSections = permissions.sections || [];
      const grantedActions = permissions.actions || [];

      // Check Route Permission
      if (requiredRoute && !grantedRoutes.includes(requiredRoute)) {
        await logUnauthorizedAttempt(req, subAdmin, `Missing route permission: ${requiredRoute}`);
        return res.status(403).json({
          success: false,
          message: `Access Denied: You do not have permission to access the '${requiredRoute}' route.`,
          code: "ROUTE_PERMISSION_DENIED",
          requiredRoute,
        });
      }

      // Check Section Permission (if granular sections configured)
      if (requiredSection && grantedSections.length > 0 && !grantedSections.includes(requiredSection)) {
        await logUnauthorizedAttempt(req, subAdmin, `Missing section permission: ${requiredSection}`);
        return res.status(403).json({
          success: false,
          message: `Access Denied: You do not have permission to access the '${requiredSection}' section.`,
          code: "SECTION_PERMISSION_DENIED",
          requiredSection,
        });
      }

      // Check Action Permission
      if (requiredAction && !grantedActions.includes(requiredAction)) {
        await logUnauthorizedAttempt(req, subAdmin, `Missing action permission: ${requiredAction}`);
        return res.status(403).json({
          success: false,
          message: `Access Denied: You do not have permission to perform the action '${requiredAction}'.`,
          code: "ACTION_PERMISSION_DENIED",
          requiredAction,
        });
      }

      // Permission verified! Update req.admin with live permissions
      req.admin.permissions = permissions;
      req.admin.name = subAdmin.name;
      next();
    } catch (err) {
      console.error("requirePermission verification error:", err);
      // Fail-Closed: Never grant access on server/DB error
      return res.status(403).json({
        success: false,
        message: "Authorization verification failed. Access denied (Fail-Closed).",
        code: "AUTH_VERIFICATION_FAILED",
      });
    }
  };
};

async function logUnauthorizedAttempt(req, subAdmin, reason) {
  try {
    await AdminAuditLog.create({
      actorEmail: subAdmin.email,
      actorType: "subadmin",
      action: "UNAUTHORIZED_OPERATION_ATTEMPT",
      actionType: "SECURITY_ALERT",
      route: req.originalUrl || req.url,
      targetId: String(subAdmin._id),
      result: "FORBIDDEN",
      details: {
        reason,
        method: req.method,
        endpoint: req.originalUrl || req.url,
      },
      ip: req.ip || req.connection?.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
    });
  } catch (err) {
    console.error("Failed to log unauthorized attempt:", err.message);
  }
}

module.exports = {
  requireMainAdmin,
  requirePermission,
};
