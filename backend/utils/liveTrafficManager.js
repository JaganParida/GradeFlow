const { Server } = require("socket.io");
const PageAnalytics = require("../models/PageAnalytics");
const TrafficQueueConfig = require("../models/TrafficQueueConfig");
const Ranking = require("../models/Ranking");

// In-Memory Real-Time State Stores
// activeUsers: token -> UserObject
const activeUsers = new Map();
// socketToToken: socketId -> token
const socketToToken = new Map();
// waitingQueue: Array of QueuedUserObject (FIFO)
let waitingQueue = [];
// admittedTokens: token -> { admittedAt, expiresAt, regNo }
const admittedTokens = new Map();

// Configuration Cache
let currentConfig = {
  queueEnabled: false,
  autoTriggerEnabled: true,
  maxActiveCapacity: 200,
  queueMessage: "We are currently experiencing high student traffic. You have been placed in a virtual queue to ensure smooth access.",
  estimatedWaitPerStudentSeconds: 15,
};

let io = null;

// Route friendly names mapping
const ROUTE_LABELS = {
  "/": "Home / Landing",
  "/dashboard": "Student Dashboard",
  "/timetable": "Class Timetable & Schedule",
  "/attendance": "Attendance Tracker & Calculator",
  "/leaderboard": "Rankings & Leaderboard",
  "/analytics": "Academic Analytics & Trends",
  "/resources": "Student Resources",
  "/testimonials": "Student Reviews & Testimonials",
  "/about-dev": "Developer Portfolio & Team",
  "/about": "About GradeFlow",
  "/help": "Help & Support",
  "/contact": "Contact",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
  "/admin": "Admin Portal",
  "/admin/dashboard": "Admin Control Console",
};

function getFriendlyPageTitle(route) {
  if (!route) return "Unknown Page";
  const cleanRoute = route.split("?")[0].replace(/\/$/, "") || "/";
  if (ROUTE_LABELS[cleanRoute]) return ROUTE_LABELS[cleanRoute];

  if (cleanRoute.startsWith("/dashboard/")) return "Student Dashboard (Personal)";
  if (cleanRoute.startsWith("/timetable/")) return "Class Timetable (Student)";
  if (cleanRoute.startsWith("/attendance/")) return "Attendance Tracker (Student)";
  if (cleanRoute.startsWith("/analytics/")) return "Academic Analytics (Student)";
  if (cleanRoute.startsWith("/admin")) return "Admin Portal";

  return cleanRoute;
}

function normalizeRoute(route) {
  if (!route) return "/";
  const clean = route.split("?")[0].replace(/\/$/, "") || "/";
  // Group dynamic student routes to maintain aggregate statistics
  if (clean.startsWith("/dashboard/")) return "/dashboard";
  if (clean.startsWith("/timetable/")) return "/timetable";
  if (clean.startsWith("/attendance/")) return "/attendance";
  if (clean.startsWith("/analytics/")) return "/analytics";
  return clean;
}

// ─── Initialize Config from MongoDB ──────────────────────────────────────────
async function syncTrafficConfig() {
  try {
    let config = await TrafficQueueConfig.findOne({ key: "global_traffic_config" });
    if (!config) {
      config = await TrafficQueueConfig.create({
        key: "global_traffic_config",
        queueEnabled: false,
        autoTriggerEnabled: true,
        maxActiveCapacity: 200,
      });
    }
    currentConfig = {
      queueEnabled: Boolean(config.queueEnabled),
      autoTriggerEnabled: Boolean(config.autoTriggerEnabled),
      maxActiveCapacity: Number(config.maxActiveCapacity) || 200,
      queueMessage: config.queueMessage || currentConfig.queueMessage,
      estimatedWaitPerStudentSeconds: Number(config.estimatedWaitPerStudentSeconds) || 15,
    };
  } catch (err) {
    console.warn("TrafficQueueConfig sync warning:", err.message);
  }
}

// ─── Core Queue Evaluation ───────────────────────────────────────────────────
function isQueueActive() {
  if (currentConfig.queueEnabled) return true;
  if (currentConfig.autoTriggerEnabled && activeUsers.size >= currentConfig.maxActiveCapacity) {
    return true;
  }
  return false;
}

function isTokenAdmitted(token) {
  if (!token) return false;
  const entry = admittedTokens.get(token);
  if (!entry) return false;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    admittedTokens.delete(token);
    return false;
  }
  return true;
}

// ─── Real-Time Broadcasting to Admin Room ────────────────────────────────────
function broadcastLiveStatsToAdmin() {
  if (!io) return;
  const stats = getLiveStatsSummary();
  io.to("admin_traffic_room").emit("traffic:live_stats", stats);
}

function broadcastQueueUpdates() {
  if (!io) return;
  waitingQueue.forEach((item, index) => {
    const position = index + 1;
    const estimatedWaitSecs = position * currentConfig.estimatedWaitPerStudentSeconds;
    const payload = {
      inQueue: true,
      position,
      totalInQueue: waitingQueue.length,
      estimatedWaitSecs,
      message: currentConfig.queueMessage,
    };
    if (item.socketId) {
      io.to(item.socketId).emit("queue:status_update", payload);
    }
  });
}

// ─── Active User Registration & Lifecycle ────────────────────────────────────
async function registerOrUpdateActiveUser(userData) {
  const {
    token,
    socketId,
    regNo = null,
    studentName = null,
    branch = null,
    batch = null,
    route = "/",
    deviceType = "Desktop",
    os = "Unknown",
    browser = "Unknown",
    ip = "",
  } = userData;

  if (!token) return null;

  const now = Date.now();
  let existing = activeUsers.get(token);

  // If student details aren't passed yet but regNo is available, attempt fast DB lookup
  let resolvedName = studentName;
  let resolvedBranch = branch;
  let resolvedBatch = batch;

  if (regNo && (!resolvedName || !resolvedBranch)) {
    try {
      const record = await Ranking.findOne({ regNo: regNo.toUpperCase() })
        .select("studentName branch batch")
        .lean();
      if (record) {
        resolvedName = record.studentName || resolvedName;
        resolvedBranch = record.branch || resolvedBranch;
        resolvedBatch = record.batch || resolvedBatch;
      }
    } catch {}
  }

  const userRecord = {
    token,
    socketId: socketId || existing?.socketId,
    regNo: regNo ? String(regNo).toUpperCase().trim() : existing?.regNo || null,
    studentName: resolvedName || existing?.studentName || (regNo ? `Student (${regNo})` : "Guest Visitor"),
    branch: resolvedBranch || existing?.branch || "General",
    batch: resolvedBatch || existing?.batch || "N/A",
    currentRoute: route || existing?.currentRoute || "/",
    pageTitle: getFriendlyPageTitle(route || existing?.currentRoute || "/"),
    deviceType: deviceType || existing?.deviceType || "Desktop",
    os: os || existing?.os || "Unknown",
    browser: browser || existing?.browser || "Unknown",
    ip: ip || existing?.ip || "",
    connectedAt: existing?.connectedAt || now,
    lastPingAt: now,
    isGuest: !regNo && !existing?.regNo,
    status: "ACTIVE",
  };

  activeUsers.set(token, userRecord);
  if (socketId) {
    socketToToken.set(socketId, token);
  }

  // Record page visit asynchronously
  recordPageView(route, token).catch(() => {});

  broadcastLiveStatsToAdmin();
  return userRecord;
}

function removeActiveUser(identifier) {
  let tokenToRemove = null;

  if (activeUsers.has(identifier)) {
    tokenToRemove = identifier;
  } else if (socketToToken.has(identifier)) {
    tokenToRemove = socketToToken.get(identifier);
    socketToToken.delete(identifier);
  }

  if (tokenToRemove) {
    activeUsers.delete(tokenToRemove);
    broadcastLiveStatsToAdmin();

    // If capacity opened up, auto-admit next student from queue
    checkAndAutoAdmitFromQueue();
  }
}

// ─── Queue Operations ────────────────────────────────────────────────────────
function addToQueue(userData) {
  const {
    token,
    socketId,
    regNo = null,
    studentName = null,
    branch = null,
    requestedRoute = "/",
    deviceType = "Desktop",
    os = "Unknown",
    browser = "Unknown",
    ip = "",
  } = userData;

  if (!token) return null;

  // Check if already in queue
  const existingIdx = waitingQueue.findIndex((q) => q.token === token);
  const now = Date.now();

  if (existingIdx !== -1) {
    waitingQueue[existingIdx].socketId = socketId || waitingQueue[existingIdx].socketId;
    waitingQueue[existingIdx].requestedRoute = requestedRoute || waitingQueue[existingIdx].requestedRoute;
    const position = existingIdx + 1;
    return {
      queueId: waitingQueue[existingIdx].queueId,
      position,
      totalInQueue: waitingQueue.length,
      estimatedWaitSecs: position * currentConfig.estimatedWaitPerStudentSeconds,
    };
  }

  const queueItem = {
    queueId: `queue_${now}_${Math.random().toString(36).slice(2, 7)}`,
    token,
    socketId,
    regNo: regNo ? String(regNo).toUpperCase().trim() : null,
    studentName: studentName || (regNo ? `Student (${regNo})` : "Guest Visitor"),
    branch: branch || "General",
    requestedRoute,
    deviceType,
    os,
    browser,
    ip,
    joinedAt: now,
  };

  waitingQueue.push(queueItem);
  const position = waitingQueue.length;

  broadcastLiveStatsToAdmin();
  broadcastQueueUpdates();

  return {
    queueId: queueItem.queueId,
    position,
    totalInQueue: waitingQueue.length,
    estimatedWaitSecs: position * currentConfig.estimatedWaitPerStudentSeconds,
  };
}

function removeFromQueue(tokenOrQueueId) {
  const initialLen = waitingQueue.length;
  waitingQueue = waitingQueue.filter(
    (q) => q.token !== tokenOrQueueId && q.queueId !== tokenOrQueueId && q.socketId !== tokenOrQueueId
  );

  if (waitingQueue.length !== initialLen) {
    broadcastLiveStatsToAdmin();
    broadcastQueueUpdates();
    return true;
  }
  return false;
}

function admitStudentFromQueue(queueItem) {
  if (!queueItem) return;

  const now = Date.now();
  // 1-hour admission ticket
  const expiresAt = now + 60 * 60 * 1000;
  admittedTokens.set(queueItem.token, {
    admittedAt: now,
    expiresAt,
    regNo: queueItem.regNo,
  });

  // Notify the admitted student via Socket
  if (io && queueItem.socketId) {
    io.to(queueItem.socketId).emit("queue:admitted", {
      admitted: true,
      token: queueItem.token,
      expiresAt,
      destinationRoute: queueItem.requestedRoute || "/",
    });
  }

  // Remove from waiting queue
  waitingQueue = waitingQueue.filter((q) => q.queueId !== queueItem.queueId);
}

function admitNextStudents(count = 1) {
  const numToAdmit = Math.min(count, waitingQueue.length);
  if (numToAdmit <= 0) return 0;

  const studentsToAdmit = waitingQueue.slice(0, numToAdmit);
  studentsToAdmit.forEach((st) => admitStudentFromQueue(st));

  broadcastLiveStatsToAdmin();
  broadcastQueueUpdates();

  return numToAdmit;
}

function admitSpecificStudent(identifier) {
  const target = waitingQueue.find(
    (q) => q.queueId === identifier || q.token === identifier || q.regNo === identifier
  );
  if (!target) return false;

  admitStudentFromQueue(target);
  broadcastLiveStatsToAdmin();
  broadcastQueueUpdates();
  return true;
}

function flushWaitingQueue(admitAll = true) {
  const count = waitingQueue.length;
  if (admitAll) {
    [...waitingQueue].forEach((st) => admitStudentFromQueue(st));
  } else {
    waitingQueue = [];
  }
  broadcastLiveStatsToAdmin();
  broadcastQueueUpdates();
  return count;
}

function checkAndAutoAdmitFromQueue() {
  if (waitingQueue.length === 0) return;
  const currentActive = activeUsers.size;
  const capacity = currentConfig.maxActiveCapacity;

  if (currentActive < capacity) {
    const slotsAvailable = capacity - currentActive;
    admitNextStudents(slotsAvailable);
  }
}

// ─── Route Visit Analytics (Persistent in MongoDB) ───────────────────────────
async function recordPageView(rawRoute, visitorToken) {
  if (!rawRoute) return;
  const route = normalizeRoute(rawRoute);
  const pageTitle = getFriendlyPageTitle(route);

  try {
    const now = new Date();
    const tokenHash = visitorToken ? String(visitorToken).slice(0, 32) : null;

    await PageAnalytics.findOneAndUpdate(
      { route },
      {
        $setOnInsert: { pageTitle },
        $inc: { totalViews: 1 },
        $set: { lastVisitedAt: now },
        ...(tokenHash ? { $addToSet: { visitorTokens: tokenHash } } : {}),
      },
      { upsert: true, new: true }
    );

    // Update unique visitors count based on tokens length
    if (tokenHash) {
      await PageAnalytics.updateOne(
        { route },
        [
          {
            $set: {
              uniqueVisitors: { $size: { $ifNull: ["$visitorTokens", []] } },
            },
          },
        ]
      ).catch(() => {});
    }
  } catch (err) {
    console.warn("recordPageView error:", err.message);
  }
}

async function getCategorizedPageAnalytics() {
  try {
    const pages = await PageAnalytics.find({})
      .sort({ totalViews: -1 })
      .lean();

    // Map active live viewers per route currently online
    const liveViewersMap = {};
    activeUsers.forEach((user) => {
      const normRoute = normalizeRoute(user.currentRoute);
      liveViewersMap[normRoute] = (liveViewersMap[normRoute] || 0) + 1;
    });

    const enrichedPages = pages.map((p) => ({
      route: p.route,
      pageTitle: p.pageTitle || getFriendlyPageTitle(p.route),
      totalViews: p.totalViews || 0,
      uniqueVisitors: p.uniqueVisitors || 0,
      lastVisitedAt: p.lastVisitedAt,
      liveViewers: liveViewersMap[p.route] || 0,
    }));

    // Ensure default core routes exist in response even before DB records exist
    const defaultCoreRoutes = ["/", "/dashboard", "/timetable", "/attendance", "/leaderboard", "/analytics", "/resources"];
    defaultCoreRoutes.forEach((defRoute) => {
      if (!enrichedPages.some((p) => p.route === defRoute)) {
        enrichedPages.push({
          route: defRoute,
          pageTitle: getFriendlyPageTitle(defRoute),
          totalViews: 0,
          uniqueVisitors: 0,
          lastVisitedAt: null,
          liveViewers: liveViewersMap[defRoute] || 0,
        });
      }
    });

    enrichedPages.sort((a, b) => b.totalViews - a.totalViews || b.liveViewers - a.liveViewers);

    // Categorize into Most, Medium, and Least Visited
    const totalPages = enrichedPages.length;
    const tierSize = Math.max(1, Math.ceil(totalPages / 3));

    const mostVisited = enrichedPages.slice(0, tierSize).map((p) => ({ ...p, tier: "MOST_VISITED" }));
    const mediumVisited = enrichedPages.slice(tierSize, tierSize * 2).map((p) => ({ ...p, tier: "MEDIUM_VISITED" }));
    const leastVisited = enrichedPages.slice(tierSize * 2).map((p) => ({ ...p, tier: "LEAST_VISITED" }));

    return {
      allPages: enrichedPages,
      mostVisited,
      mediumVisited,
      leastVisited,
      totalTrackedViews: enrichedPages.reduce((sum, p) => sum + p.totalViews, 0),
    };
  } catch (err) {
    console.error("getCategorizedPageAnalytics error:", err);
    return {
      allPages: [],
      mostVisited: [],
      mediumVisited: [],
      leastVisited: [],
      totalTrackedViews: 0,
    };
  }
}

// ─── Summary Snapshot for Admin Dashboard ────────────────────────────────────
function getLiveStatsSummary() {
  const activeStudentsList = Array.from(activeUsers.values()).map((u) => ({
    token: u.token,
    regNo: u.regNo,
    studentName: u.studentName,
    branch: u.branch,
    batch: u.batch,
    currentRoute: u.currentRoute,
    pageTitle: u.pageTitle,
    deviceType: u.deviceType,
    os: u.os,
    browser: u.browser,
    ip: u.ip ? u.ip.replace(/:\d+$/, "") : "",
    connectedAt: u.connectedAt,
    lastPingAt: u.lastPingAt,
    isGuest: u.isGuest,
  }));

  const queuedStudentsList = waitingQueue.map((q, idx) => ({
    queueId: q.queueId,
    position: idx + 1,
    token: q.token,
    regNo: q.regNo,
    studentName: q.studentName,
    branch: q.branch,
    requestedRoute: q.requestedRoute,
    deviceType: q.deviceType,
    os: q.os,
    browser: q.browser,
    joinedAt: q.joinedAt,
    estimatedWaitSecs: (idx + 1) * currentConfig.estimatedWaitPerStudentSeconds,
  }));

  // Route breakdown of active users
  const routeCounts = {};
  activeUsers.forEach((u) => {
    const r = normalizeRoute(u.currentRoute);
    routeCounts[r] = (routeCounts[r] || 0) + 1;
  });

  return {
    totalActiveUsers: activeUsers.size,
    totalQueuedUsers: waitingQueue.length,
    maxActiveCapacity: currentConfig.maxActiveCapacity,
    queueEnabled: currentConfig.queueEnabled,
    autoTriggerEnabled: currentConfig.autoTriggerEnabled,
    isQueueActive: isQueueActive(),
    activeStudents: activeStudentsList,
    queuedStudents: queuedStudentsList,
    routeDistribution: routeCounts,
    timestamp: Date.now(),
  };
}

// ─── Socket.IO Server Initialization ─────────────────────────────────────────
function initLiveTrafficServer(httpServer, corsOptions) {
  io = new Server(httpServer, {
    cors: corsOptions,
    pingTimeout: 20000,
    pingInterval: 10000,
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    // 1. Admin joins dedicated live monitoring room
    socket.on("admin:join_traffic_monitor", () => {
      socket.join("admin_traffic_room");
      socket.emit("traffic:live_stats", getLiveStatsSummary());
    });

    socket.on("admin:leave_traffic_monitor", () => {
      socket.leave("admin_traffic_room");
    });

    // 2. Client registration & Route transitions
    socket.on("student:register", async (userData = {}) => {
      const { token, regNo, studentName, branch, batch, route, deviceType, os, browser, isAdmin } = userData;

      if (!token) return;

      // Admins are exempt from queue and monitoring as regular students
      if (isAdmin) {
        socket.join("admin_traffic_room");
        return;
      }

      // Check if user is in queue or admitted
      if (isTokenAdmitted(token)) {
        await registerOrUpdateActiveUser({
          token,
          socketId: socket.id,
          regNo,
          studentName,
          branch,
          batch,
          route,
          deviceType,
          os,
          browser,
          ip: socket.handshake.address,
        });
        socket.emit("queue:bypass", { admitted: true });
        return;
      }

      // If queue is triggered and active count exceeds capacity
      if (isQueueActive() && !activeUsers.has(token)) {
        const queueStatus = addToQueue({
          token,
          socketId: socket.id,
          regNo,
          studentName,
          branch,
          requestedRoute: route,
          deviceType,
          os,
          browser,
          ip: socket.handshake.address,
        });
        socket.emit("queue:required", queueStatus);
        return;
      }

      // Normal active student registration
      await registerOrUpdateActiveUser({
        token,
        socketId: socket.id,
        regNo,
        studentName,
        branch,
        batch,
        route,
        deviceType,
        os,
        browser,
        ip: socket.handshake.address,
      });
    });

    // 3. Student navigates to another page
    socket.on("student:route_change", async ({ token, route }) => {
      if (!token || !route) return;
      if (activeUsers.has(token)) {
        const user = activeUsers.get(token);
        user.currentRoute = route;
        user.pageTitle = getFriendlyPageTitle(route);
        user.lastPingAt = Date.now();
        recordPageView(route, token).catch(() => {});
        broadcastLiveStatsToAdmin();
      }
    });

    // 4. Student Heartbeat Ping
    socket.on("student:ping", ({ token, route }) => {
      if (!token) return;
      if (activeUsers.has(token)) {
        const user = activeUsers.get(token);
        user.lastPingAt = Date.now();
        if (route && route !== user.currentRoute) {
          user.currentRoute = route;
          user.pageTitle = getFriendlyPageTitle(route);
        }
      }
    });

    // 5. Disconnection
    socket.on("disconnect", () => {
      const token = socketToToken.get(socket.id);
      if (token) {
        // Allow a 15-second grace period before full removal to handle page refreshes seamlessly
        setTimeout(() => {
          const user = activeUsers.get(token);
          if (user && user.socketId === socket.id) {
            removeActiveUser(token);
          }
        }, 15000);
      }
      removeFromQueue(socket.id);
    });
  });

  // Background Sweep: Cleanup dead stale sessions every 30s
  setInterval(() => {
    const now = Date.now();
    for (const [token, user] of activeUsers.entries()) {
      if (now - user.lastPingAt > 75000) {
        activeUsers.delete(token);
      }
    }
    checkAndAutoAdmitFromQueue();
    broadcastLiveStatsToAdmin();
  }, 30000);

  // Sync initial MongoDB configuration
  syncTrafficConfig().catch(() => {});

  return io;
}

module.exports = {
  initLiveTrafficServer,
  syncTrafficConfig,
  registerOrUpdateActiveUser,
  removeActiveUser,
  addToQueue,
  removeFromQueue,
  admitNextStudents,
  admitSpecificStudent,
  flushWaitingQueue,
  isQueueActive,
  isTokenAdmitted,
  recordPageView,
  getCategorizedPageAnalytics,
  getLiveStatsSummary,
  get currentConfig() {
    return currentConfig;
  },
  set currentConfig(cfg) {
    currentConfig = { ...currentConfig, ...cfg };
    broadcastLiveStatsToAdmin();
    broadcastQueueUpdates();
  },
};
