const StudentRouteActivity = require("../models/StudentRouteActivity");
const Ranking = require("../models/Ranking");
const PageAnalytics = require("../models/PageAnalytics");
const { publishAdminRealtimeEvent } = require("./ablyService");

const EXCLUDED_STUDENT_REG = "230301120327";

const DAYS_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getIstHour() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.getUTCHours();
}

function getIstDayOfWeek() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.getUTCDay();
}

function getIstDateStr() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split("T")[0];
}

function getIstWeekStr() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const d = new Date(now.getTime() + istOffset);
  const dateNum = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = dateNum.getUTCDay() || 7;
  dateNum.setUTCDate(dateNum.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dateNum.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((dateNum - yearStart) / 86400000 + 1) / 7);
  return `${dateNum.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function calculatePeakTimeSlot(hourlyActivity) {
  if (!Array.isArray(hourlyActivity) || hourlyActivity.length !== 24) return "General";
  let maxCount = 0;
  let peakHour = -1;
  for (let h = 0; h < 24; h++) {
    const count = hourlyActivity[h] || 0;
    if (count > maxCount) {
      maxCount = count;
      peakHour = h;
    }
  }
  if (peakHour === -1 || maxCount === 0) return "General";

  const formatH = (h) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH} ${period}`;
  };

  const start = formatH(peakHour);
  const end = formatH((peakHour + 1) % 24);

  let tag = "Day";
  if (peakHour >= 0 && peakHour < 6) tag = "Late Night";
  else if (peakHour >= 6 && peakHour < 12) tag = "Morning";
  else if (peakHour >= 12 && peakHour < 17) tag = "Afternoon";
  else if (peakHour >= 17 && peakHour < 21) tag = "Evening";
  else tag = "Night";

  return `${start} - ${end} (${tag})`;
}

function calculatePeakDay(dayCounts) {
  if (!Array.isArray(dayCounts) || dayCounts.length !== 7) return "Weekdays";
  let maxCount = 0;
  let peakIdx = -1;
  dayCounts.forEach((count, idx) => {
    if ((count || 0) > maxCount) {
      maxCount = count;
      peakIdx = idx;
    }
  });
  if (peakIdx === -1 || maxCount === 0) return "Weekdays";
  return DAYS_NAMES[peakIdx] || "Weekdays";
}

function parseDeviceFromUa(userAgent = "") {
  const ua = String(userAgent || "");
  let os = "Unknown";
  if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPod/i.test(ua)) os = "iOS";
  else if (/iPad/i.test(ua)) os = "iPadOS";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/CrOS/i.test(ua)) os = "Chrome OS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let deviceType = "Desktop";
  if (/iPad|Tablet/i.test(ua) || os === "iPadOS") deviceType = "Tablet";
  else if (/Mobile|Android|iPhone/i.test(ua) || os === "Android" || os === "iOS") deviceType = "Mobile";
  else if (os === "Windows" || os === "macOS" || os === "Linux") deviceType = "Desktop / Laptop";

  let browser = "Unknown";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Opera|OPR\//i.test(ua)) browser = "Opera";

  return { deviceType, os, browser };
}

/**
 * Accurately touches and records student route activity.
 * Ensures zero-polling real-time Ably dispatch to admin dashboard.
 */
async function recordStudentRouteActivity({
  regNo,
  route = "/attendance",
  pageTitle = "Attendance Tracker & Calculator",
  userAgent = "",
  ip = "",
  durationSeconds = 0,
}) {
  if (!regNo) return null;
  const cleanReg = String(regNo).toUpperCase().trim();
  if (cleanReg === EXCLUDED_STUDENT_REG) return null;

  try {
    const todayStr = getIstDateStr();
    const weekStr = getIstWeekStr();
    const istHour = getIstHour();
    const istDay = getIstDayOfWeek();
    const deviceInfo = parseDeviceFromUa(userAgent);

    let studentActivity = await StudentRouteActivity.findOne({ regNo: cleanReg });

    if (!studentActivity) {
      let resolvedName = `Student (${cleanReg})`;
      let resolvedBranch = "CSE";
      let resolvedBatch = cleanReg.startsWith("23") ? "2023" : "2024";

      try {
        const rank = await Ranking.findOne({ regNo: cleanReg }).select("studentName branch batch").lean();
        if (rank) {
          if (rank.studentName) resolvedName = rank.studentName;
          if (rank.branch) resolvedBranch = rank.branch;
          if (rank.batch) resolvedBatch = rank.batch;
        }
      } catch (_) {}

      const initialHourly = new Array(24).fill(0);
      initialHourly[istHour] = 1;
      const peakSlot = calculatePeakTimeSlot(initialHourly);

      const initialDays = new Array(7).fill(0);
      initialDays[istDay] = 1;

      studentActivity = new StudentRouteActivity({
        regNo: cleanReg,
        studentName: resolvedName,
        branch: resolvedBranch,
        batch: resolvedBatch,
        deviceType: deviceInfo.deviceType,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        ip: ip || "",
        currentRoute: route,
        currentPageTitle: pageTitle,
        lastActiveRoute: route,
        lastActivePageTitle: pageTitle,
        timeSpentCurrentRoute: durationSeconds,
        totalTimeSpentSeconds: durationSeconds,
        totalPageViews: 1,
        mostVisitedRoute: route,
        mostVisitedPageTitle: pageTitle,
        mostVisitedCount: 1,
        mostTimeSpentRoute: route,
        mostTimeSpentPageTitle: pageTitle,
        mostTimeSpentSeconds: durationSeconds,
        hourlyActivity: initialHourly,
        mostActiveTimeSlot: peakSlot,
        dayOfWeekActivity: initialDays,
        mostActiveDay: DAYS_NAMES[istDay] || "Weekdays",
        visitsToday: 1,
        visitsThisWeek: 1,
        lastVisitDateStr: todayStr,
        lastVisitWeekStr: weekStr,
        visitedRoutes: [
          {
            route,
            pageTitle,
            durationSeconds,
            visitCount: 1,
            weeklyVisitCount: 1,
            hourlyActivity: initialHourly,
            mostActiveTimeSlot: peakSlot,
            lastVisitedAt: new Date(),
          },
        ],
        firstSeenAt: new Date(),
        lastActiveAt: new Date(),
      });
    } else {
      studentActivity.lastActiveAt = new Date();
      studentActivity.currentRoute = route;
      studentActivity.currentPageTitle = pageTitle;
      studentActivity.lastActiveRoute = route;
      studentActivity.lastActivePageTitle = pageTitle;
      if (deviceInfo.deviceType !== "Desktop" || !studentActivity.deviceType) {
        studentActivity.deviceType = deviceInfo.deviceType;
        studentActivity.os = deviceInfo.os;
        studentActivity.browser = deviceInfo.browser;
      }
      if (ip) studentActivity.ip = ip;
      studentActivity.totalPageViews = (studentActivity.totalPageViews || 0) + 1;
      if (durationSeconds > 0) {
        studentActivity.totalTimeSpentSeconds = (studentActivity.totalTimeSpentSeconds || 0) + durationSeconds;
      }

      // Update hourly activity & peak slot
      if (!studentActivity.hourlyActivity || studentActivity.hourlyActivity.length !== 24) {
        studentActivity.hourlyActivity = new Array(24).fill(0);
      }
      studentActivity.hourlyActivity[istHour] = (studentActivity.hourlyActivity[istHour] || 0) + 1;
      studentActivity.mostActiveTimeSlot = calculatePeakTimeSlot(studentActivity.hourlyActivity);

      // Update day of week activity
      if (!studentActivity.dayOfWeekActivity || studentActivity.dayOfWeekActivity.length !== 7) {
        studentActivity.dayOfWeekActivity = new Array(7).fill(0);
      }
      studentActivity.dayOfWeekActivity[istDay] = (studentActivity.dayOfWeekActivity[istDay] || 0) + 1;
      studentActivity.mostActiveDay = calculatePeakDay(studentActivity.dayOfWeekActivity);

      // Visits tracking
      if (studentActivity.lastVisitDateStr !== todayStr) {
        studentActivity.lastVisitDateStr = todayStr;
        studentActivity.visitsToday = 1;
      } else {
        studentActivity.visitsToday = (studentActivity.visitsToday || 0) + 1;
      }

      if (studentActivity.lastVisitWeekStr !== weekStr) {
        studentActivity.lastVisitWeekStr = weekStr;
        studentActivity.visitsThisWeek = 1;
      } else {
        studentActivity.visitsThisWeek = (studentActivity.visitsThisWeek || 0) + 1;
      }

      // Visited routes
      studentActivity.visitedRoutes = studentActivity.visitedRoutes || [];
      const existingRoute = studentActivity.visitedRoutes.find((r) => r.route === route);
      if (existingRoute) {
        existingRoute.visitCount = (existingRoute.visitCount || 0) + 1;
        existingRoute.weeklyVisitCount = (existingRoute.weeklyVisitCount || 0) + 1;
        if (durationSeconds > 0) {
          existingRoute.durationSeconds = (existingRoute.durationSeconds || 0) + durationSeconds;
        }
        existingRoute.lastVisitedAt = new Date();
      } else {
        studentActivity.visitedRoutes.push({
          route,
          pageTitle,
          durationSeconds,
          visitCount: 1,
          weeklyVisitCount: 1,
          hourlyActivity: new Array(24).fill(0),
          mostActiveTimeSlot: "General",
          lastVisitedAt: new Date(),
        });
      }

      // Calculate most visited route
      if (studentActivity.visitedRoutes.length > 0) {
        const byVisits = [...studentActivity.visitedRoutes].sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));
        studentActivity.mostVisitedRoute = byVisits[0].route;
        studentActivity.mostVisitedPageTitle = byVisits[0].pageTitle || byVisits[0].route;
        studentActivity.mostVisitedCount = byVisits[0].visitCount || 1;
      }
    }

    await studentActivity.save();

    // Increment PageAnalytics
    await PageAnalytics.findOneAndUpdate(
      { route },
      {
        $setOnInsert: { pageTitle },
        $inc: { totalViews: 1 },
        $set: { lastVisitedAt: new Date() },
      },
      { upsert: true }
    ).catch(() => {});

    // Broadcast realtime reactive invalidation event to Admin via Ably (Zero Polling)
    publishAdminRealtimeEvent("traffic-updated", {
      regNo: cleanReg,
      route,
      timestamp: Date.now(),
    }).catch(() => {});

    publishAdminRealtimeEvent("admin-cache-invalidate", {
      scope: "traffic",
      timestamp: Date.now(),
    }).catch(() => {});

    return studentActivity;
  } catch (err) {
    console.warn("[routeActivityHelper] Failed to record student route activity:", err.message);
    return null;
  }
}

module.exports = {
  recordStudentRouteActivity,
};
