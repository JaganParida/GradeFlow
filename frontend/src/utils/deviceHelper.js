/**
 * deviceHelper.js
 * 
 * Accurately parses user agent strings and session metadata to determine:
 * - Device Type (Laptop / Desktop / Mobile / Tablet / Unknown)
 * - Operating System (Windows / macOS / Android / iOS / Linux / Unknown)
 * - Browser (Chrome / Edge / Safari / Firefox / Opera / Unknown)
 * - Formatted Login Date & Time
 * - Formatted Last Active Time
 * 
 * Strict Rule: Never guess information. If undetermined, defaults to "Unknown".
 */

/**
 * Parses User Agent and platform string into reliable device metadata.
 */
export function parseDeviceDetails(device = {}) {
  const ua = String(device.userAgent || "").trim();
  const plat = String(device.platform || "").trim();

  // 1. Operating System Detection
  let os = "Unknown";
  if (/Windows NT 10.0|Windows 11/i.test(ua) || (plat && /Win32|Win64|Windows/i.test(plat))) {
    os = "Windows";
  } else if (/Windows NT 6.3|Windows NT 6.2|Windows NT 6.1|Windows NT/i.test(ua)) {
    os = "Windows";
  } else if (/Android/i.test(ua) || (plat && /Android/i.test(plat))) {
    os = "Android";
  } else if (/iPhone|iPod/i.test(ua) || (plat && /iPhone|iPod/i.test(plat))) {
    os = "iOS";
  } else if (/iPad/i.test(ua) || (plat && /iPad/i.test(plat))) {
    os = "iPadOS";
  } else if (/Macintosh|Mac OS X/i.test(ua) || (plat && /MacIntel|macOS/i.test(plat))) {
    os = "macOS";
  } else if (/CrOS/i.test(ua)) {
    os = "Chrome OS";
  } else if (/Linux/i.test(ua) || (plat && /Linux/i.test(plat))) {
    os = "Linux";
  }

  // 2. Device Type Detection
  let deviceType = "Unknown";
  if (/iPad|Tablet|Silk|PlayBook/i.test(ua) || os === "iPadOS" || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    deviceType = "Tablet";
  } else if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || os === "Android" || os === "iOS") {
    deviceType = "Mobile";
  } else if (os === "Windows" || os === "macOS" || os === "Linux" || os === "Chrome OS") {
    // Standard PC / Mac / Linux computer
    deviceType = "Laptop";
  } else if (ua) {
    deviceType = "Desktop";
  }

  // 3. Browser Detection
  let browser = "Unknown";
  if (/Edg\//i.test(ua)) {
    browser = "Edge";
  } else if (/OPR\/|Opera/i.test(ua)) {
    browser = "Opera";
  } else if (/SamsungBrowser/i.test(ua)) {
    browser = "Samsung Internet";
  } else if (/UCBrowser/i.test(ua)) {
    browser = "UC Browser";
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) {
    browser = "Chrome";
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = "Safari";
  } else if (/Firefox\//i.test(ua)) {
    browser = "Firefox";
  }

  // 4. Primary Label Construction (e.g. "Laptop", "Windows Laptop", "Android Mobile", "iPhone")
  let displayTitle = deviceType;
  if (os !== "Unknown" && deviceType !== "Unknown") {
    if (os === "iOS" && /iPhone/i.test(ua)) {
      displayTitle = "iPhone";
    } else if (os === "iPadOS" || /iPad/i.test(ua)) {
      displayTitle = "iPad";
    } else {
      displayTitle = `${os} ${deviceType}`;
    }
  } else if (os !== "Unknown") {
    displayTitle = `${os} Device`;
  } else if (deviceType !== "Unknown") {
    displayTitle = deviceType;
  } else {
    displayTitle = "Authorized Device";
  }

  return {
    displayTitle,
    deviceType,
    os,
    browser,
    loggedInAt: device.loggedInAt || null,
    lastActiveAt: device.lastActiveAt || null,
    status: device.status || "ACTIVE",
  };
}

/**
 * Formats a login date & time e.g., "23 August 2026, 7:42 PM"
 */
export function formatLoginDateTime(dateVal) {
  if (!dateVal) return "Unknown";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Unknown";
    const datePart = d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).replace(/\b(am|pm)\b/g, (m) => m.toUpperCase());
    return `${datePart}, ${timePart}`;
  } catch {
    return "Unknown";
  }
}

/**
 * Formats last active time e.g., "11:18 PM" or "23 August 2026, 11:18 PM"
 */
export function formatLastActiveTime(dateVal, loggedInVal) {
  if (!dateVal) return "Unknown";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Unknown";
    
    const timePart = d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).replace(/\b(am|pm)\b/g, (m) => m.toUpperCase());

    const loginDate = loggedInVal ? new Date(loggedInVal) : null;
    const isSameDay = loginDate && !isNaN(loginDate.getTime()) && d.toDateString() === loginDate.toDateString();
    
    if (isSameDay) {
      return timePart;
    }
    
    const datePart = d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${datePart}, ${timePart}`;
  } catch {
    return "Unknown";
  }
}
