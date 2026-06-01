const { Server } = require("socket.io");

const MAX_CONCURRENT_SEARCHES = 5;
const COOLDOWN_MS = 15 * 1000; // 15 seconds

let io = null;
let activeUsers = 0;
let activeRequests = 0;
const userCooldowns = new Map(); // IP -> expiration timestamp

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    activeUsers++;
    broadcastStats();

    socket.on("disconnect", () => {
      activeUsers--;
      broadcastStats();
    });
  });
}

function broadcastStats() {
  if (io) {
    io.emit("stats", {
      activeUsers,
      activeRequests,
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

  // 2. Check Queue Capacity
  if (activeRequests >= MAX_CONCURRENT_SEARCHES) {
    return res.status(503).json({ 
      message: "Server is currently at maximum capacity. Please wait a moment and try again." 
    });
  }

  // Allowed to proceed!
  activeRequests++;
  broadcastStats();

  // Add the cooldown for NEXT time (even if request fails, to prevent spamming errors)
  userCooldowns.set(userIp, now + COOLDOWN_MS);

  // Hook into response finish to decrement active requests
  res.on('finish', () => {
    activeRequests--;
    broadcastStats();
  });
  
  res.on('close', () => {
    if (!res.writableEnded) { // If closed before finish
      activeRequests--;
      broadcastStats();
    }
  });

  next();
}

module.exports = {
  initSocket,
  checkQueue,
  broadcastStats
};
