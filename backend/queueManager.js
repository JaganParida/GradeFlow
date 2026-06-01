const { Server } = require("socket.io");

const MAX_CONCURRENT_SEARCHES = 5;
const COOLDOWN_MS = 15 * 1000; // 15 seconds
const SESSION_LIMIT_MS = 3 * 60 * 1000; // 3 minutes session limit

let io = null;
let activeUsers = 0;
const dashboardUsers = new Map(); // socket.id -> timeout object
const userCooldowns = new Map(); // IP -> expiration timestamp

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    activeUsers++;
    broadcastStats();

    // User attempts to enter the dashboard
    socket.on("enter_dashboard", (callback) => {
      // If they are already in the dashboard, just refresh their timer
      if (dashboardUsers.has(socket.id)) {
        clearTimeout(dashboardUsers.get(socket.id));
        dashboardUsers.set(socket.id, startSessionTimer(socket));
        if (callback) callback({ success: true });
        return;
      }

      // Check capacity
      if (dashboardUsers.size >= MAX_CONCURRENT_SEARCHES) {
        if (callback) callback({ success: false, message: "Dashboard is at full capacity. Please wait for someone to leave." });
        return;
      }

      // Allow entry and start timer
      dashboardUsers.set(socket.id, startSessionTimer(socket));
      broadcastStats();
      if (callback) callback({ success: true });
    });

    // User leaves the dashboard voluntarily
    socket.on("leave_dashboard", () => {
      removeDashboardUser(socket);
    });

    socket.on("disconnect", () => {
      activeUsers--;
      removeDashboardUser(socket);
      broadcastStats();
    });
  });
}

function startSessionTimer(socket) {
  return setTimeout(() => {
    if (dashboardUsers.has(socket.id)) {
      dashboardUsers.delete(socket.id);
      socket.emit("session_expired", { message: "Your 3-minute session has expired." });
      broadcastStats();
    }
  }, SESSION_LIMIT_MS);
}

function removeDashboardUser(socket) {
  if (dashboardUsers.has(socket.id)) {
    clearTimeout(dashboardUsers.get(socket.id));
    dashboardUsers.delete(socket.id);
    broadcastStats();
  }
}

function broadcastStats() {
  if (io) {
    io.emit("stats", {
      activeUsers,
      activeRequests: dashboardUsers.size,
      maxRequests: MAX_CONCURRENT_SEARCHES
    });
  }
}

// Middleware to check queue and cooldown
function checkQueue(req, res, next) {
  const userIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  // Clean up old cooldowns occasionally (optional but good)
  if (Math.random() < 0.05) {
    for (const [ip, expiry] of userCooldowns.entries()) {
      if (now > expiry) userCooldowns.delete(ip);
    }
  }

  // 1. Check Cooldown
  if (userCooldowns.has(userIp)) {
    const expiry = userCooldowns.get(userIp);
    if (now < expiry) {
      return res.status(429).json({ 
        message: "You are on cooldown. Please wait before searching again.",
        cooldownExpiry: expiry
      });
    } else {
      userCooldowns.delete(userIp);
    }
  }

  // 2. Check Dashboard Capacity
  // Since the user is about to navigate to the dashboard, ensure there is space.
  // Note: they haven't claimed the slot via socket yet, but we block the API if it's already full.
  if (dashboardUsers.size >= MAX_CONCURRENT_SEARCHES) {
    return res.status(503).json({ 
      message: "The dashboard is currently full. Please wait for someone to leave before searching." 
    });
  }

  // Add the search cooldown
  userCooldowns.set(userIp, now + COOLDOWN_MS);

  // Allow the API fetch. The user will then navigate to the dashboard and claim the slot via WebSockets.
  next();
}

module.exports = {
  initSocket,
  checkQueue,
  broadcastStats
};
