const connectToDatabase = require("./_lib/db");
const VercelQuotaMetric = require("./_lib/models/VercelQuotaMetric");
const StudentRouteActivity = require("./_lib/models/StudentRouteActivity");
const PageAnalytics = require("./_lib/models/PageAnalytics");
const TrafficQueueConfig = require("./_lib/models/TrafficQueueConfig");
const { applyCors } = require("./_lib/cors");
const jwt = require("jsonwebtoken");

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
  BYTES_PER_INVOCATION_EST: 28672  // ~28 KB avg payload + headers
};

const EXCLUDED_STUDENT_REG = "230301120327";

const DAYS_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name] = rest.join("=");
  });
  return cookies;
}

function verifyAdmin(req) {
  const cookies = parseCookies(req.headers.cookie);
  let token = req.headers["x-admin-token"] || cookies.jwt;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token || token === "none") return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

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

  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return {
    dateStr,
    monthStr,
    dayOfWeek: day,
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

module.exports = async function handler(req, res) {
  if (applyCors(req, res, "GET,POST,OPTIONS")) return;

  try {
    await connectToDatabase();

    // Verify Admin Access
    const adminUser = verifyAdmin(req);
    if (!adminUser) {
      return res.status(401).json({ success: false, message: "Unauthorized admin access." });
    }

    const { dateStr, monthStr, dayOfWeek, hour, dayOfMonth, daysInMonth } = getIstDateDetails();

    // ─── Apply Auto-Defense Policy ───────────────────────────────────────────
    if (req.method === "POST") {
      const { policy } = req.body || {};
      let updateFields = {
        updatedBy: adminUser.email || "admin",
        updatedAt: new Date(),
      };

      if (policy === "CRITICAL_SHIELD") {
        updateFields.queueEnabled = true;
        updateFields.autoTriggerEnabled = true;
        updateFields.maxActiveCapacity = 50;
        updateFields.queueMessage = "Vercel Hobby Safety Shield Active: Virtual queue enabled to prevent 429 quota exhaustion. Your turn will arrive shortly.";
      } else if (policy === "SURGE_PROTECTION") {
        updateFields.queueEnabled = true;
        updateFields.autoTriggerEnabled = true;
        updateFields.maxActiveCapacity = 150;
        updateFields.queueMessage = "High student volume detected. Virtual queue is pacing requests to protect platform speed.";
      } else if (policy === "OPTIMAL") {
        updateFields.queueEnabled = false;
        updateFields.autoTriggerEnabled = true;
        updateFields.maxActiveCapacity = 250;
        updateFields.queueMessage = "Server capacity optimization active. You are in queue.";
      } else {
        return res.status(400).json({ success: false, message: "Invalid policy mode specified." });
      }

      const updated = await TrafficQueueConfig.findOneAndUpdate(
        { key: "global_traffic_config" },
        { $set: updateFields },
        { new: true, upsert: true }
      );

      return res.json({
        success: true,
        message: `Successfully applied ${policy} defense policy.`,
        config: updated,
      });
    }

    // ─── GET: On-Demand Vercel Quota Intelligence ───────────────────────────
    // Parallel fetch all independent data sources for maximum throughput
    const [todayMetric, monthlyMetrics, totalActiveStudents, pages, rawQueueConfig] = await Promise.all([
      VercelQuotaMetric.findOne({ dateStr }).lean(),
      VercelQuotaMetric.find({ monthStr }).lean(),
      StudentRouteActivity.countDocuments({ regNo: { $ne: EXCLUDED_STUDENT_REG } }),
      PageAnalytics.find({}).sort({ totalViews: -1 }).lean(),
      TrafficQueueConfig.findOne({ key: "global_traffic_config" }).lean(),
    ]);

    const queueConfig = rawQueueConfig || {
      queueEnabled: false,
      autoTriggerEnabled: true,
      maxActiveCapacity: 200,
      queueMessage: "Server capacity optimization active. You are in queue.",
      estimatedWaitPerStudentSeconds: 15,
    };

    // 100% genuine tracked metrics directly from VercelQuotaMetric
    const storedTodayRequests = todayMetric ? (todayMetric.totalRequests || 0) : 0;
    const storedMonthRequests = monthlyMetrics.reduce((sum, m) => sum + (m.totalRequests || 0), 0);

    const effectiveMonthRequests = storedMonthRequests;
    const effectiveTodayRequests = storedTodayRequests;

    const totalRouteInvocations = pages.reduce(
      (sum, p) => sum + (p.totalViews || 0),
      0
    );

    // Direct 24-hour histogram from today's actual metric
    const finalHourlyRequests = new Array(24).fill(0);
    if (todayMetric && Array.isArray(todayMetric.hourlyRequests)) {
      for (let h = 0; h < 24; h++) {
        finalHourlyRequests[h] = todayMetric.hourlyRequests[h] || 0;
      }
    }

    // Determine Peak Hour
    let maxHourCount = 0;
    let peakHourIndex = 20; // fallback 8 PM
    finalHourlyRequests.forEach((count, h) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHourIndex = h;
      }
    });
    const peakHourText = formatHourSlot(peakHourIndex);

    // Determine Peak Day across this month's recorded metrics
    const aggregateDays = new Array(7).fill(0);
    monthlyMetrics.forEach((m) => {
      if (typeof m.dayOfWeek === "number" && m.dayOfWeek >= 0 && m.dayOfWeek < 7) {
        aggregateDays[m.dayOfWeek] = (aggregateDays[m.dayOfWeek] || 0) + (m.totalRequests || 0);
      }
    });

    let maxDayCount = 0;
    let peakDayIndex = dayOfWeek; // fallback today's day of week
    aggregateDays.forEach((count, d) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        peakDayIndex = d;
      }
    });
    const peakDayText = DAYS_NAMES[peakDayIndex] || "Today";

    // ─── Calculate Quotas & Percentages ─────────────────────────────
    const todayBudget = HOBBY_LIMITS.DAILY_REQUESTS_BUDGET;
    const todayUsed = effectiveTodayRequests;
    const todayRemaining = Math.max(0, todayBudget - todayUsed);
    const todayPercent = parseFloat(((todayUsed / todayBudget) * 100).toFixed(1));

    const monthLimit = HOBBY_LIMITS.MONTHLY_REQUESTS_LIMIT;
    const monthUsed = effectiveMonthRequests;
    const monthRemaining = Math.max(0, monthLimit - monthUsed);
    const monthPercent = parseFloat(((monthUsed / monthLimit) * 100).toFixed(1));

    // Burn Rate & Month-End Projection
    const dailyBurnRate = Math.round(monthUsed / Math.max(1, dayOfMonth));
    const projectedMonthEndRequests = Math.round(dailyBurnRate * daysInMonth);
    const projectedMonthPercent = parseFloat(((projectedMonthEndRequests / monthLimit) * 100).toFixed(1));

    let projectionStatus = "HEALTHY";
    if (projectedMonthPercent > 100) projectionStatus = "OVER_BUDGET";
    else if (projectedMonthPercent > 80) projectionStatus = "AT_RISK";

    // Bandwidth Estimation
    const totalBandwidthBytes = effectiveMonthRequests * HOBBY_LIMITS.BYTES_PER_INVOCATION_EST;
    const bandwidthGB = parseFloat((totalBandwidthBytes / (1024 * 1024 * 1024)).toFixed(2));
    const bandwidthLimitGB = HOBBY_LIMITS.BANDWIDTH_LIMIT_GB;
    const bandwidthPercent = parseFloat(((bandwidthGB / bandwidthLimitGB) * 100).toFixed(1));

    const getRouteCategory = (r) => {
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
    };

    const routeBreakdown = pages.map((page) => {
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

    // ─── Auto-Defense Traffic Policies ──────────────────────────────
    let recommendedDefensePolicy = "OPTIMAL";
    let defenseBadge = "Optimal Mode";
    let defenseDescription = "Direct serverless execution. Caching active. Normal operation.";

    if (todayPercent >= 90 || projectedMonthPercent >= 100) {
      recommendedDefensePolicy = "CRITICAL_SHIELD";
      defenseBadge = "Critical Emergency Shield";
      defenseDescription = "High quota exhaustion risk. Strict queueing recommended to prevent Vercel 429 Hobby lockout.";
    } else if (todayPercent >= 70 || projectedMonthPercent >= 80) {
      recommendedDefensePolicy = "SURGE_PROTECTION";
      defenseBadge = "Surge Protection Alert";
      defenseDescription = "Elevated traffic detected. Enabling queue for heavy routes preserves free tier allocation.";
    }

    return res.json({
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
        peakDayIndex,
        totalActiveStudents,
        hourlyDistribution: finalHourlyRequests.map((count, h) => ({
          hour: h,
          label: `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? "PM" : "AM"}`,
          requests: count,
          percentage: effectiveTodayRequests > 0 ? parseFloat(((count / effectiveTodayRequests) * 100).toFixed(1)) : 0,
        })),
      },
      routeBreakdown,
      defenseSystem: {
        currentQueueEnabled: Boolean(queueConfig.queueEnabled),
        autoTriggerEnabled: Boolean(queueConfig.autoTriggerEnabled),
        maxActiveCapacity: queueConfig.maxActiveCapacity || 200,
        recommendedDefensePolicy,
        defenseBadge,
        defenseDescription,
      },
    });
  } catch (err) {
    console.error("Vercel quota serverless error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
