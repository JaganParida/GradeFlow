const Ably = require("ably");

const ABLY_KEY_1 =
  process.env.ABLY_API_KEY_1 ||
  "XdMPMQ.WWJEAg:9Tr7OObHNcaJSbx57A5RZJp28upRYB8DE8qzreo-Lbs";

const ABLY_KEY_2 =
  process.env.ABLY_API_KEY_2 ||
  "uZxt1w.X9ASuQ:kuz-ByyHUkRkkehQ2ZvJNbuM7oo_TQuFARl2RgVPptA";

let client1 = null;
let client2 = null;

function getClient1() {
  if (!client1 && ABLY_KEY_1) {
    client1 = new Ably.Rest({ key: ABLY_KEY_1 });
  }
  return client1;
}

function getClient2() {
  if (!client2 && ABLY_KEY_2) {
    client2 = new Ably.Rest({ key: ABLY_KEY_2 });
  }
  return client2;
}

/**
 * Deterministically routes a student to Account 1 (Even) or Account 2 (Odd)
 * based on the last digit of their registration number.
 */
function getClientForRegNo(regNo) {
  const clean = String(regNo || "").trim();
  const lastChar = clean.slice(-1);
  const digit = parseInt(lastChar, 10);
  const isEven = isNaN(digit)
    ? clean.charCodeAt(clean.length - 1) % 2 === 0
    : digit % 2 === 0;

  return isEven ? getClient1() : getClient2();
}

/**
 * Publishes a real-time event to a specific student's channel (e.g., login approval requests, session revocation).
 */
async function publishStudentRealtimeEvent(regNo, eventName, payload) {
  const clean = String(regNo || "").trim().toUpperCase();
  if (!clean) return;

  const client = getClientForRegNo(clean);
  if (!client) return;

  try {
    const channel = client.channels.get(`student-${clean}`);
    await channel.publish(eventName, payload);
  } catch (err) {
    console.error(`[Ably] Failed to publish "${eventName}" to student-${clean}:`, err?.message || err);
  }
}

/**
 * Publishes a real-time event to an approval request channel for waiting devices.
 */
async function publishApprovalRealtimeEvent(requestId, regNo, eventName, payload) {
  if (!requestId) return;

  const clean = String(regNo || "").trim().toUpperCase();
  const client = clean ? getClientForRegNo(clean) : getClient1();
  if (!client) return;

  try {
    const channel = client.channels.get(`approval-${requestId}`);
    await channel.publish(eventName, payload);
  } catch (err) {
    console.error(`[Ably] Failed to publish "${eventName}" to approval-${requestId}:`, err?.message || err);
  }
}

/**
 * Broadcasts an announcement to all students across BOTH Ably accounts.
 */
async function broadcastRealtimeEvent(eventName, payload) {
  const p1 = (async () => {
    const c1 = getClient1();
    if (c1) {
      const ch1 = c1.channels.get("broadcasts-all");
      await ch1.publish(eventName, payload);
    }
  })();

  const p2 = (async () => {
    const c2 = getClient2();
    if (c2) {
      const ch2 = c2.channels.get("broadcasts-all");
      await ch2.publish(eventName, payload);
    }
  })();

  await Promise.allSettled([p1, p2]);
}

/**
 * Publishes an administrative event to the admin channel across both accounts.
 */
async function publishAdminRealtimeEvent(eventName, payload) {
  const p1 = (async () => {
    const c1 = getClient1();
    if (c1) {
      const ch1 = c1.channels.get("admin-control");
      await ch1.publish(eventName, payload);
    }
  })();

  const p2 = (async () => {
    const c2 = getClient2();
    if (c2) {
      const ch2 = c2.channels.get("admin-control");
      await ch2.publish(eventName, payload);
    }
  })();

  await Promise.allSettled([p1, p2]);
}

module.exports = {
  getClientForRegNo,
  publishStudentRealtimeEvent,
  publishApprovalRealtimeEvent,
  broadcastRealtimeEvent,
  publishAdminRealtimeEvent,
  ABLY_KEY_1,
  ABLY_KEY_2,
};
