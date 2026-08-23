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

/**
 * Express middleware to enforce maintenance mode on student-facing routes
 */
function maintenanceMiddleware(req, res, next) {
  // If maintenance is OFF, allow all traffic immediately
  if (!cachedMaintenance.enabled) {
    return next();
  }

  const path = req.originalUrl || req.url || "";

  // ─── ADMIN & SYSTEM BYPASS ────────────────────────────────────────────────
  // Main Admin, Sub-Admin, and system diagnostic endpoints MUST ALWAYS remain accessible
  // so admins can log in, inspect health, and disable maintenance mode.
  if (
    path.startsWith("/api/admin") ||
    path.startsWith("/api/auth/admin") ||
    path.startsWith("/api/auth/subadmin") ||
    path.startsWith("/api/system/maintenance") ||
    path.startsWith("/api/health")
  ) {
    return next();
  }

  // ─── BLOCK STUDENT / PUBLIC ACCESS WITH 503 SERVICE UNAVAILABLE ───────────
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
