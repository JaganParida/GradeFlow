import Ably from "ably";

/**
 * Creates an Ably Realtime client for a student using secure token authentication.
 * Never exposes root API keys in the browser bundle.
 * The server issues scoped tokens via /api/auth/realtime-token.
 */
export function createAblyRealtime(regNo, options = {}) {
  const cleanReg = String(regNo || "").trim().toUpperCase();
  const client = new Ably.Realtime({
    authUrl: "/api/auth/realtime-token",
    authParams: cleanReg ? { regNo: cleanReg } : {},
    closeOnUnload: true,
    ...options,
  });
  client.connection.on("error", (err) => {
    if (err?.message?.includes("closed") || err?.code === 80003 || err?.code === 80000) return;
    console.warn("[Ably] Connection notice:", err?.message || err);
  });
  client.connection.on("failed", (err) => {
    console.warn("[Ably] Connection failed notice:", err?.message || err);
  });
  return client;
}

/**
 * Creates an Ably Realtime client for waiting device approval requests.
 */
export function createApprovalAblyRealtime(requestId, options = {}) {
  const client = new Ably.Realtime({
    authUrl: "/api/auth/realtime-token",
    authParams: { requestId },
    closeOnUnload: true,
    ...options,
  });
  client.connection.on("error", (err) => {
    if (err?.message?.includes("closed") || err?.code === 80003 || err?.code === 80000) return;
    console.warn("[AblyApproval] Connection notice:", err?.message || err);
  });
  client.connection.on("failed", (err) => {
    console.warn("[AblyApproval] Connection failed notice:", err?.message || err);
  });
  return client;
}

/**
 * Creates an Ably Realtime client for the Admin portal with token authentication.
 */
export function createAdminAblyRealtime(options = {}) {
  const client = new Ably.Realtime({
    authUrl: "/api/auth/realtime-token",
    closeOnUnload: true,
    ...options,
  });
  client.connection.on("error", (err) => {
    if (err?.message?.includes("closed") || err?.code === 80003 || err?.code === 80000) return;
    console.warn("[AdminAbly] Connection notice:", err?.message || err);
  });
  client.connection.on("failed", (err) => {
    console.warn("[AdminAbly] Connection failed notice:", err?.message || err);
  });
  return client;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Admin Ably Realtime Manager (Single Connection per Admin Auth Context)
// ─────────────────────────────────────────────────────────────────────────────
let sharedAdminAbly = null;
let adminVisibilityHandlerAttached = false;

function ensureAdminVisibilityHandler() {
  if (typeof document === "undefined" || adminVisibilityHandlerAttached) return;
  adminVisibilityHandlerAttached = true;
  document.addEventListener("visibilitychange", () => {
    if (!sharedAdminAbly) return;
    try {
      if (document.visibilityState === "visible") {
        if (sharedAdminAbly.connection && sharedAdminAbly.connection.state !== "connected") {
          sharedAdminAbly.connection.connect();
        }
      }
    } catch (_) {}
  });
}

/**
 * Returns the singleton Ably Realtime instance for the active administrator session.
 */
export function getSharedAdminAbly(options = {}) {
  if (
    !sharedAdminAbly ||
    sharedAdminAbly.connection.state === "closed" ||
    sharedAdminAbly.connection.state === "failed"
  ) {
    sharedAdminAbly = createAdminAblyRealtime(options);
    ensureAdminVisibilityHandler();
  }
  return sharedAdminAbly;
}

/**
 * Subscribes to a channel/event using the shared Admin Ably Realtime client.
 * Returns an unsubscribe cleanup function that only detaches the specific listener
 * without closing or disconnecting the underlying shared connection.
 *
 * @param {string} channelName - e.g. "admin-control" or "broadcasts-all"
 * @param {string|Function} eventOrHandler - event name (string) or callback function
 * @param {Function} [handler] - callback function if event name was provided as 2nd arg
 * @returns {Function} unsubscribe cleanup function
 */
export function subscribeAdminChannel(channelName, eventOrHandler, handler) {
  try {
    const client = getSharedAdminAbly();
    const channel = client.channels.get(channelName);

    if (typeof eventOrHandler === "function") {
      channel.subscribe(eventOrHandler);
      return () => {
        try {
          channel.unsubscribe(eventOrHandler);
        } catch (_) {}
      };
    } else {
      channel.subscribe(eventOrHandler, handler);
      return () => {
        try {
          channel.unsubscribe(eventOrHandler, handler);
        } catch (_) {}
      };
    }
  } catch (err) {
    console.warn(`[AdminAbly] Failed to subscribe to ${channelName}:`, err?.message || err);
    return () => {};
  }
}

/**
 * Closes and resets the shared Admin Ably client upon explicit logout.
 */
export function closeSharedAdminAbly() {
  if (sharedAdminAbly) {
    try {
      const p = sharedAdminAbly.close();
      if (p && typeof p.catch === "function") {
        p.catch(() => {});
      }
    } catch (_) {}
    sharedAdminAbly = null;
  }
}
