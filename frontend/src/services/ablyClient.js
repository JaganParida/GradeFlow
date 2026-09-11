import Ably from "ably";

/**
 * Creates an Ably Realtime client for a student using secure token authentication.
 * Never exposes root API keys in the browser bundle.
 * The server issues scoped tokens via /api/auth/realtime-token.
 */
export function createAblyRealtime(regNo, options = {}) {
  const cleanReg = String(regNo || "").trim().toUpperCase();
  return new Ably.Realtime({
    authUrl: "/api/auth/realtime-token",
    authParams: cleanReg ? { regNo: cleanReg } : {},
    closeOnUnload: true,
    ...options,
  });
}

/**
 * Creates an Ably Realtime client for waiting device approval requests.
 */
export function createApprovalAblyRealtime(requestId, options = {}) {
  return new Ably.Realtime({
    authUrl: "/api/auth/realtime-token",
    authParams: { requestId },
    closeOnUnload: true,
    ...options,
  });
}

/**
 * Creates an Ably Realtime client for the Admin portal with token authentication.
 */
export function createAdminAblyRealtime(options = {}) {
  return new Ably.Realtime({
    authUrl: "/api/auth/realtime-token",
    closeOnUnload: true,
    ...options,
  });
}
