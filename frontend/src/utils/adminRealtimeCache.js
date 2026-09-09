/**
 * GradeFlow Admin Realtime Reactive Cache Engine
 * Replaces arbitrary time-based TTLs (5m/10m) with true event-driven Ably WebSocket invalidation.
 *
 * Cache is PERMANENT across the session until a real data-mutation event arrives from the backend.
 * Zero HTTP requests when idle; instant (~15ms) reactive updates when data changes.
 */

const CACHE_EVENT_NAME = "gf-admin-cache-dirty";

export const AdminCacheScopes = {
  STATS: "stats",
  TOPPERS: "toppers",
  BACKLOGS: "backlogs",
  ATTENDANCE: "attendance",
  TIMETABLE: "timetable",
  FEEDBACK: "feedback",
  OTP: "otp",
  TRAFFIC: "traffic",
  RANKINGS: "rankings",
  ADMIN: "admin",
  BROADCAST: "broadcast",
  ALL: "all",
};

/**
 * Retrieves data from permanent session cache.
 * Returns null if no cache exists or if it was invalidated by an Ably event.
 */
export function getAdminCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data !== undefined ? parsed.data : parsed;
  } catch {
    return null;
  }
}

/**
 * Stores data permanently in session cache until invalidated by an event.
 */
export function setAdminCache(key, data, scope = null) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        data,
        scope,
        cachedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn("[AdminCache] Storage write warning:", err?.message || err);
  }
}

/**
 * Invalidates specific cache keys by prefix/scope, and notifies all listening components.
 */
export function invalidateAdminCache(scope) {
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (!k) continue;

      if (scope === AdminCacheScopes.ALL) {
        if (k.startsWith("gf_admin_")) keysToRemove.push(k);
      } else if (scope === AdminCacheScopes.ATTENDANCE && k.startsWith("gf_admin_att_mon")) {
        keysToRemove.push(k);
      } else if (
        (scope === AdminCacheScopes.STATS || scope === AdminCacheScopes.RANKINGS) &&
        (k.startsWith("gf_admin_stats") || k.startsWith("gf_admin_toppers") || k.startsWith("gf_admin_backlog"))
      ) {
        keysToRemove.push(k);
      } else if (scope === AdminCacheScopes.TOPPERS && k.startsWith("gf_admin_toppers")) {
        keysToRemove.push(k);
      } else if (scope === AdminCacheScopes.BACKLOGS && k.startsWith("gf_admin_backlog")) {
        keysToRemove.push(k);
      } else if (scope === AdminCacheScopes.TIMETABLE && (k.startsWith("gf_admin_schedules") || k.startsWith("gf_admin_tt_"))) {
        keysToRemove.push(k);
      } else if (scope === AdminCacheScopes.FEEDBACK && k.startsWith("gf_admin_feedback")) {
        keysToRemove.push(k);
      } else if (scope === AdminCacheScopes.OTP && k.startsWith("gf_admin_otp")) {
        keysToRemove.push(k);
      } else if (scope === AdminCacheScopes.TRAFFIC && (k.startsWith("gf_admin_traffic") || k.startsWith("gf_admin_vercel"))) {
        keysToRemove.push(k);
      } else if (
        scope === AdminCacheScopes.ADMIN &&
        (k.startsWith("gf_admin_visibility") ||
          k.startsWith("gf_admin_maintenance") ||
          k.startsWith("gf_admin_subadmins") ||
          k.startsWith("gf_admin_audit_logs"))
      ) {
        keysToRemove.push(k);
      } else if (scope === AdminCacheScopes.BROADCAST && k.startsWith("gf_admin_broadcasts")) {
        keysToRemove.push(k);
      }
    }

    keysToRemove.forEach((k) => sessionStorage.removeItem(k));

    // Broadcast dirty event to currently active React components
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(CACHE_EVENT_NAME, {
          detail: { scope, timestamp: Date.now() },
        })
      );
    }
  } catch (err) {
    console.warn("[AdminCache] Invalidation warning:", err?.message || err);
  }
}

/**
 * Subscribes a React component to real-time cache invalidation events.
 */
export function onAdminCacheDirty(scope, callback) {
  if (typeof window === "undefined") return () => {};

  const handler = (e) => {
    const eventScope = e.detail?.scope;
    if (
      eventScope === AdminCacheScopes.ALL ||
      eventScope === scope ||
      ((scope === AdminCacheScopes.TOPPERS ||
        scope === AdminCacheScopes.BACKLOGS ||
        scope === AdminCacheScopes.STATS) &&
        eventScope === AdminCacheScopes.RANKINGS)
    ) {
      callback(e.detail);
    }
  };

  window.addEventListener(CACHE_EVENT_NAME, handler);
  return () => window.removeEventListener(CACHE_EVENT_NAME, handler);
}
