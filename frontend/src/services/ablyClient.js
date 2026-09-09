import Ably from "ably";

export const ABLY_KEY_1 =
  import.meta.env.VITE_ABLY_KEY_1 ||
  "XdMPMQ.WWJEAg:9Tr7OObHNcaJSbx57A5RZJp28upRYB8DE8qzreo-Lbs";

export const ABLY_KEY_2 =
  import.meta.env.VITE_ABLY_KEY_2 ||
  "uZxt1w.X9ASuQ:kuz-ByyHUkRkkehQ2ZvJNbuM7oo_TQuFARl2RgVPptA";

/**
 * Returns Key 1 for even last digit of regNo, Key 2 for odd last digit.
 * Exactly 50% split across both accounts (400 slots total).
 */
export function getAblyKeyForRegNo(regNo) {
  const clean = String(regNo || "").trim();
  const lastChar = clean.slice(-1);
  const digit = parseInt(lastChar, 10);
  const isEven = isNaN(digit)
    ? clean.charCodeAt(clean.length - 1) % 2 === 0
    : digit % 2 === 0;

  return isEven ? ABLY_KEY_1 : ABLY_KEY_2;
}

/**
 * Creates an Ably Realtime client for a student, automatically routing to Key 1 or Key 2.
 */
export function createAblyRealtime(regNo, options = {}) {
  const key = getAblyKeyForRegNo(regNo);
  return new Ably.Realtime({
    key,
    closeOnUnload: true,
    ...options,
  });
}
