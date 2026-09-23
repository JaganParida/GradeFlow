const VercelQuotaMetric = require("./models/VercelQuotaMetric");
const StudentRouteActivity = require("./models/StudentRouteActivity");
const PageAnalytics = require("./models/PageAnalytics");
const TrafficQueueConfig = require("./models/TrafficQueueConfig");

// Vercel Free Hobby Tier Quota Limits (Official Vercel Documentation)
const HOBBY_LIMITS = {
  MONTHLY_REQUESTS_LIMIT: 1000000, // 1,000,000 (1M) Serverless Invocations
  DAILY_REQUESTS_BUDGET: 33333,    // ~1,000,000 / 30 days
  ACTIVE_CPU_LIMIT_HOURS: 4.0,     // 4.0 CPU-Hours (14,400s) Active CPU Time
  DAILY_CPU_BUDGET_SECONDS: 480,   // ~14,400s / 30 days
  BANDWIDTH_LIMIT_GB: 100,         // 100 GB Fast Data Transfer
  EDGE_REQUESTS_LIMIT: 1000000,    // 1,000,000 Edge Requests
  TIMEOUT_SECONDS: 60,             // 60s Serverless Execution Timeout
  CONCURRENCY_LIMIT: 100,          // 100 Concurrent Executions
  BYTES_PER_INVOCATION_EST: 28672, // ~28 KB avg payload + headers
};

const EXCLUDED_STUDENT_REG = "230301120327";

const DAYS_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

let cachedQuotaData = null;
let cachedQuotaTimestamp = 0;
const QUOTA_CACHE_TTL_MS = 30 * 1000; // 30s in-memory cache to eliminate redundant aggregations

function getIstDateDetails() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);

  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth(); // 0-indexed
  const date = istDate.getUTCDate();
  const hour = istDate.getUTCHours();
  const day = istDate.getUTCDay();

  const dateStr = istDate.toISOString().split("T")[0]; // YYYY-MM-DD
  const monthStr = dateStr.slice(0, 7); // YYYY-MM

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayDateText = istDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return {
    istDate,
    todayDateText,
    dateStr,
    monthStr,
    dayOfWeek: day,
    istDay: day,
    hour,
    dayOfMonth: date,
    daysInMonth,
  };
}

function formatHourSlot(hour) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayH = hour % 12 === 0 ? 12 : hour % 12;
  const nextH = (hour + 1) % 24;
  const nextPeriod = nextH >= 12 ? "PM" : "AM";
  const nextDisplayH = nextH % 12 === 0 ? 12 : nextH % 12;

  let tag = "Day";
  if (hour >= 0 && hour < 6) tag = "Late Night";
  else if (hour >= 6 && hour < 12) tag = "Morning";
  else if (hour >= 12 && hour < 17) tag = "Afternoon";
  else if (hour >= 17 && hour < 21) tag = "Evening";
  else tag = "Night";

  return `${displayH}:00 ${period} – ${nextDisplayH}:00 ${nextPeriod} (${tag})`;
}

function getRouteCategory(r) {
  if (!r) return "PUBLIC";
  if (r.startsWith("/admin")) return "ADMIN";
  if (
    r.startsWith("/dashboard") ||
    r.startsWith("/attendance") ||
    r.startsWith("/timetable") ||
    r.startsWith("/analytics") ||
    r.startsWith("/leaderboard") ||
    r.startsWith("/resources") ||
    r.startsWith("/testimonials")
  ) {
    return "STUDENT";
  }
  return "PUBLIC";
}

function extractHourlyRequests(hourlyData) {
  const arr = new Array(24).fill(0);
  if (!hourlyData) return arr;
  if (Array.isArray(hourlyData)) {
    for (let h = 0; h < 24; h++) {
      arr[h] = Number(hourlyData[h]) || 0;
    }
  } else if (typeof hourlyData === "object") {
    for (let h = 0; h < 24; h++) {
      arr[h] = Number(hourlyData[h] ?? hourlyData[String(h)]) || 0;
    }
  }
  return arr;
}

async function getVercelQuotaData(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedQuotaData && (now - cachedQuotaTimestamp < QUOTA_CACHE_TTL_MS)) {
    return cachedQuotaData;
  }

  const {
    istDate,
    todayDateText,
    dateStr,
    monthStr,
    dayOfWeek,
    istDay,
    hour,
    dayOfMonth,
    daysInMonth,
  } = getIstDateDetails();

  const [todayMetric, monthlyMetrics, studentActivities, pages, rawQueueConfig] = await Promise.all([
    VercelQuotaMetric.findOne({ dateStr }).lean().catch(() => null),
    VercelQuotaMetric.find({ monthStr }).lean().catch(() => []),
    StudentRouteActivity.find({ regNo: { $ne: EXCLUDED_STUDENT_REG } }).lean().catch(() => []),
    PageAnalytics.find({}).sort({ totalViews: -1 }).lean().catch(() => []),
    TrafficQueueConfig.findOne({ key: "global_traffic_config" }).lean().catch(() => null),
  ]);

  const safeMonthlyMetrics = Array.isArray(monthlyMetrics) ? monthlyMetrics : [];
  const safePages = Array.isArray(pages) ? pages : [];
  const safeStudents = Array.isArray(studentActivities) ? studentActivities : [];
  const totalActiveStudents = safeStudents.length;

  const queueConfig = rawQueueConfig || {
    queueEnabled: false,
    autoTriggerEnabled: true,
    maxActiveCapacity: 200,
    queueMessage: "Server capacity optimization active. You are in queue.",
    estimatedWaitPerStudentSeconds: 15,
  };

  const storedTodayRequests = todayMetric ? (todayMetric.totalRequests || 0) : 0;
  const storedMonthRequests = safeMonthlyMetrics.reduce((sum, m) => sum + (m.totalRequests || 0), 0);

  const effectiveMonthRequests = storedMonthRequests;
  const effectiveTodayRequests = storedTodayRequests;

  const totalRouteInvocations = safePages.reduce(
    (sum, p) => sum + (p.totalViews || 0),
    0
  );

  // Extract strictly today's hourly requests (purely what occurred inside today)
  const finalHourlyRequests = extractHourlyRequests(todayMetric?.hourlyRequests);
  const todayUsed = storedTodayRequests;

  // Determine Today's Peak Hour strictly from today's real telemetry
  let maxHourCount = 0;
  let peakHourIndex = -1;
  finalHourlyRequests.forEach((count, h) => {
    if (count > maxHourCount) {
      maxHourCount = count;
      peakHourIndex = h;
    }
  });

  const peakHourText = peakHourIndex >= 0 ? formatHourSlot(peakHourIndex) : "Awaiting Today's Traffic";

  const peakDayText = todayDateText;

  const todayBudget = HOBBY_LIMITS.DAILY_REQUESTS_BUDGET;
  const todayRemaining = Math.max(0, todayBudget - todayUsed);
  const todayPercent = parseFloat(((todayUsed / todayBudget) * 100).toFixed(1));

  const monthLimit = HOBBY_LIMITS.MONTHLY_REQUESTS_LIMIT;
  const monthUsed = effectiveMonthRequests;
  const monthRemaining = Math.max(0, monthLimit - monthUsed);
  const monthPercent = parseFloat(((monthUsed / monthLimit) * 100).toFixed(1));

  // Zero-drain accurate projection:
  // Current month-end projection = already consumed requests + remaining days projected at average daily burn rate
  const safeDayOfMonth = Math.max(1, dayOfMonth);
  const dailyBurnRateExact = monthUsed / safeDayOfMonth;
  const remainingDays = Math.max(0, daysInMonth - safeDayOfMonth);
  const projectedMonthEndRequests = Math.max(
    monthUsed,
    Math.round(monthUsed + (dailyBurnRateExact * remainingDays))
  );
  const dailyBurnRate = parseFloat(dailyBurnRateExact.toFixed(1));
  const projectedMonthPercent = parseFloat(((projectedMonthEndRequests / monthLimit) * 100).toFixed(1));

  let projectionStatus = "HEALTHY";
  if (projectedMonthPercent > 100) projectionStatus = "OVER_BUDGET";
  else if (projectedMonthPercent > 80) projectionStatus = "AT_RISK";

  const totalBandwidthBytes = effectiveMonthRequests * HOBBY_LIMITS.BYTES_PER_INVOCATION_EST;
  const bandwidthGB = parseFloat((totalBandwidthBytes / (1024 * 1024 * 1024)).toFixed(2));
  const bandwidthLimitGB = HOBBY_LIMITS.BANDWIDTH_LIMIT_GB;
  const bandwidthPercent = parseFloat(((bandwidthGB / bandwidthLimitGB) * 100).toFixed(1));

  const routeBreakdown = safePages.map((page) => {
    const estimatedInvocations = page.totalViews || 0;
    const percentOfTotal = totalRouteInvocations > 0
      ? parseFloat(((estimatedInvocations / totalRouteInvocations) * 100).toFixed(1))
      : 0;
    const routeBytes = estimatedInvocations * HOBBY_LIMITS.BYTES_PER_INVOCATION_EST;
    const bandwidthMB = parseFloat((routeBytes / (1024 * 1024)).toFixed(1));
    const category = getRouteCategory(page.route);

    let priorityTier = "LIGHTWEIGHT";
    let cacheRecommendation = "Edge SWR (300s)";
    if (percentOfTotal >= 20) {
      priorityTier = "HIGH_CONSUMPTION";
      cacheRecommendation = "Aggressive Stale-While-Revalidate + Cache-Control: max-age=120";
    } else if (percentOfTotal >= 8) {
      priorityTier = "MEDIUM_CONSUMPTION";
      cacheRecommendation = "Browser Memory Cache + 60s Revalidation";
    }

    return {
      route: page.route,
      pageTitle: page.pageTitle || page.route,
      category,
      totalViews: page.totalViews || 0,
      estimatedInvocations,
      percentOfTotal,
      bandwidthMB,
      priorityTier,
      cacheRecommendation,
      lastVisitedAt: page.lastVisitedAt,
    };
  });

  routeBreakdown.sort((a, b) => b.estimatedInvocations - a.estimatedInvocations);

  // 1. Recommended Defense Policy based on quota usage
  let recommendedDefensePolicy = "OPTIMAL";
  let recommendedBadge = "Optimal Speed Mode";
  let recommendedDescription = "Direct serverless execution. Caching active. Normal operation.";

  if (todayPercent >= 90 || projectedMonthPercent >= 100) {
    recommendedDefensePolicy = "CRITICAL_SHIELD";
    recommendedBadge = "Critical Emergency Shield";
    recommendedDescription = "High quota exhaustion risk. Strict queueing recommended to prevent Vercel 429 Hobby lockout.";
  } else if (todayPercent >= 70 || projectedMonthPercent >= 80) {
    recommendedDefensePolicy = "SURGE_PROTECTION";
    recommendedBadge = "Surge Protection";
    recommendedDescription = "Elevated traffic detected. Enabling queue for heavy routes preserves free tier allocation.";
  }

  // 2. Currently Active Policy based on stored database configuration
  let activePolicy = "OPTIMAL";
  let activeBadge = "Optimal Speed Mode";
  let activeColor = "#10b981";

  if (queueConfig.queueEnabled) {
    const activeCap = Number(queueConfig.maxActiveCapacity) || 0;
    if (activeCap <= 75) {
      activePolicy = "CRITICAL_SHIELD";
      activeBadge = "Critical Emergency Shield";
      activeColor = "#ef4444";
    } else if (activeCap <= 175) {
      activePolicy = "SURGE_PROTECTION";
      activeBadge = "Surge Protection";
      activeColor = "#f59e0b";
    } else {
      activePolicy = "CUSTOM";
      activeBadge = "Custom Queue Shield";
      activeColor = "#6366f1";
    }
  }

  // 3. Status alignment between current configuration and recommendation
  let statusAlignment = "ALIGNED";
  if (activePolicy === recommendedDefensePolicy) {
    statusAlignment = "ALIGNED";
  } else if (
    (recommendedDefensePolicy === "CRITICAL_SHIELD" && activePolicy !== "CRITICAL_SHIELD") ||
    (recommendedDefensePolicy === "SURGE_PROTECTION" && activePolicy === "OPTIMAL")
  ) {
    statusAlignment = "UNDER_PROTECTED";
  } else {
    statusAlignment = "OVER_PROTECTED";
  }

  const result = {
    success: true,
    timestamp: new Date().toISOString(),
    dateStr,
    monthStr,
    quotaLimits: HOBBY_LIMITS,
    today: {
      used: todayUsed,
      budget: todayBudget,
      remaining: todayRemaining,
      percent: todayPercent,
      status: todayPercent >= 90 ? "CRITICAL" : todayPercent >= 70 ? "WARNING" : "NORMAL",
    },
    month: {
      used: monthUsed,
      limit: monthLimit,
      remaining: monthRemaining,
      percent: monthPercent,
      dayOfMonth,
      daysInMonth,
      dailyBurnRate,
      projectedMonthEndRequests,
      projectedMonthPercent,
      projectionStatus,
    },
    cpu: {
      limitHours: HOBBY_LIMITS.ACTIVE_CPU_LIMIT_HOURS,
      limitSeconds: 14400,
      estimatedUsedSeconds: Math.round(effectiveMonthRequests * 0.08),
      estimatedUsedHours: parseFloat(((effectiveMonthRequests * 0.08) / 3600).toFixed(3)),
      percent: parseFloat((((effectiveMonthRequests * 0.08) / 14400) * 100).toFixed(1)),
    },
    bandwidth: {
      usedGB: bandwidthGB,
      limitGB: bandwidthLimitGB,
      remainingGB: parseFloat(Math.max(0, bandwidthLimitGB - bandwidthGB).toFixed(2)),
      percent: bandwidthPercent,
    },
    peakTiming: {
      peakHourIndex,
      peakHourText,
      peakHourCount: maxHourCount,
      peakDayText,
      todayDateText,
      peakDayIndex: istDay,
      totalActiveStudents,
      totalTodayRequests: todayUsed,
      hourlyDistribution: finalHourlyRequests.map((count, h) => ({
        hour: h,
        label: `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? "PM" : "AM"}`,
        requests: count,
        percentage: todayUsed > 0 ? parseFloat(((count / todayUsed) * 100).toFixed(1)) : 0,
      })),
    },
    routeBreakdown,
    defenseSystem: {
      currentQueueEnabled: Boolean(queueConfig.queueEnabled),
      autoTriggerEnabled: Boolean(queueConfig.autoTriggerEnabled),
      maxActiveCapacity: queueConfig.maxActiveCapacity || 200,
      activePolicy,
      activeBadge,
      activeColor,
      recommendedDefensePolicy,
      recommendedBadge,
      recommendedDescription,
      statusAlignment,
      // Backward-compatibility aliases
      defenseBadge: activeBadge,
      defenseDescription: recommendedDescription,
    },
  };

  cachedQuotaData = result;
  cachedQuotaTimestamp = now;

  return result;
}

function invalidateQuotaCache() {
  cachedQuotaData = null;
  cachedQuotaTimestamp = 0;
}

module.exports = {
  HOBBY_LIMITS,
  DAYS_NAMES,
  EXCLUDED_STUDENT_REG,
  getIstDateDetails,
  formatHourSlot,
  getRouteCategory,
  getVercelQuotaData,
  invalidateQuotaCache,
};
