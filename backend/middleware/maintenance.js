const SystemConfig = require("../models/SystemConfig");

// In-memory cache for ultra-fast O(1) response times
let cachedMaintenance = {
  enabled: false,
  message: "",
  enabledAt: null,
  updatedAt: new Date(),
  updatedBy: "",
};

let lastSyncTime = 0;
const SYNC_INTERVAL_MS = 30000; // 30 seconds periodic sync fallback

/**
 * Fetch and synchronize maintenance state from database
 */
async function syncMaintenanceState() {
  try {
    const config = await SystemConfig.findOne({ key: "maintenance" }).lean();
    if (config && config.maintenance) {
      cachedMaintenance = {
        enabled: Boolean(config.maintenance.enabled),
        message: config.maintenance.message || "",
        enabledAt: config.maintenance.enabledAt || null,
        updatedAt: config.maintenance.updatedAt || new Date(),
        updatedBy: config.maintenance.updatedBy || "",
      };
    } else {
      // Create initial configuration document if it doesn't exist
      await SystemConfig.findOneAndUpdate(
        { key: "maintenance" },
        {
          $setOnInsert: {
            key: "maintenance",
            maintenance: {
              enabled: false,
              message: "",
              enabledAt: null,
              updatedAt: new Date(),
              updatedBy: "system",
            },
          },
        },
        { upsert: true, new: true }
      );
    }
    lastSyncTime = Date.now();
  } catch (err) {
    console.warn("⚠️ Failed to sync maintenance state from DB:", err.message);
  }
}

/**
 * Read current maintenance state (instant cached read with periodic refresh)
 */
async function getMaintenanceState(forceDb = false) {
  if (forceDb || Date.now() - lastSyncTime > SYNC_INTERVAL_MS) {
    await syncMaintenanceState();
  }
  return cachedMaintenance;
}

/**
 * Update maintenance state authoritatively in DB and cache
 */
async function setMaintenanceState({ enabled, message = "", adminEmail = "" }) {
  const isEnabled = Boolean(enabled);
  const cleanMessage = String(message || "").trim().slice(0, 300);
  const now = new Date();

  const updateData = {
    "maintenance.enabled": isEnabled,
    "maintenance.message": cleanMessage,
    "maintenance.updatedAt": now,
    "maintenance.updatedBy": adminEmail,
  };

  if (isEnabled && !cachedMaintenance.enabled) {
    updateData["maintenance.enabledAt"] = now;
  } else if (!isEnabled) {
    updateData["maintenance.enabledAt"] = null;
  }

  const updated = await SystemConfig.findOneAndUpdate(
    { key: "maintenance" },
    { $set: updateData },
    { upsert: true, new: true }
  ).lean();

  cachedMaintenance = {
    enabled: isEnabled,
    message: cleanMessage,
    enabledAt: isEnabled ? updateData["maintenance.enabledAt"] || cachedMaintenance.enabledAt || now : null,
    updatedAt: now,
    updatedBy: adminEmail,
  };
  lastSyncTime = Date.now();

  return cachedMaintenance;
}

const jwt = require("jsonwebtoken");

/**
 * Express middleware to enforce maintenance mode on student-facing routes
 */
function maintenanceMiddleware(req, res, next) {
  // If maintenance is OFF, allow all traffic immediately
  if (!cachedMaintenance.enabled) {
    return next();
  }

  const path = req.originalUrl || req.url || "";

  // ─── 1. SYSTEM & ADMIN ROUTES ALWAYS ACCESSIBLE ─────────────────────────
  if (
    path.startsWith("/api/admin") ||
    path.startsWith("/api/auth/admin") ||
    path.startsWith("/api/auth/subadmin") ||
    path.startsWith("/api/system/maintenance") ||
    path.startsWith("/api/health")
  ) {
    return next();
  }

  // ─── 2. AUTHENTICATED ADMIN / SUB-ADMIN BYPASS ──────────────────────────
  // Authenticated administrators have full access to test/inspect all routes during maintenance
  let token = null;
  if (req.cookies && req.cookies.jwt && req.cookies.jwt !== "none" && req.cookies.jwt !== "") {
    token = req.cookies.jwt;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.headers["x-admin-token"]) {
    token = req.headers["x-admin-token"];
  }

  if (token && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      if (decoded && (decoded.role === "admin" || decoded.adminType === "subadmin" || decoded.email)) {
        return next();
      }
    } catch {
      // Invalid/expired admin token, proceed to block
    }
  }

  // ─── 3. BLOCK STUDENT / PUBLIC ACCESS WITH 503 SERVICE UNAVAILABLE ───────
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");

  return res.status(503).json({
    success: false,
    code: "MAINTENANCE_MODE",
    message: cachedMaintenance.message || "GradeFlow is temporarily unavailable while we make improvements.",
    maintenance: {
      enabled: true,
      message: cachedMaintenance.message || "",
      enabledAt: cachedMaintenance.enabledAt,
    },
  });
}

module.exports = {
  syncMaintenanceState,
  getMaintenanceState,
  setMaintenanceState,
  maintenanceMiddleware,
};
