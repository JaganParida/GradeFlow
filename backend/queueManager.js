const { Server } = require("socket.io");

const MAX_CONCURRENT_SEARCHES = 5;
const COOLDOWN_MS = 15 * 1000; // 15 seconds
const SESSION_LIMIT_MS = 3 * 60 * 1000; // 3 minutes session limit

let io = null;
let activeUsers = 0;
const dashboardUsers = new Map(); // socket.id -> timeout object
let waitingQueue = []; // array of { socketId, socket, regNo }
const userCooldowns = new Map(); // IP -> expiration timestamp

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    activeUsers++;
    broadcastStats();

    // User attempts to join the queue for a search
    socket.on("join_queue", (data, callback) => {
      const regNo = data?.regNo;
      
      // If they are already in the queue, just return their position
      const existingIndex = waitingQueue.findIndex(u => u.socketId === socket.id);
      if (existingIndex !== -1) {
        if (callback) callback({ status: "queued", position: existingIndex + 1 });
        return;
      }

      // If there are free slots, admit them instantly!
      if (dashboardUsers.size < MAX_CONCURRENT_SEARCHES && waitingQueue.length === 0) {
        dashboardUsers.set(socket.id, startSessionTimer(socket));
        if (callback) callback({ status: "admitted" });
        broadcastStats();
        return;
      }

      // No free slots or people already waiting -> Join Queue
      waitingQueue.push({ socketId: socket.id, socket, regNo });
      if (callback) callback({ status: "queued", position: waitingQueue.length });
      broadcastStats();
    });

    // User attempts to leave the queue
    socket.on("leave_queue", () => {
      removeUserFromQueue(socket.id);
    });

    // Normal dashboard entry (if they somehow bypassed the queue, we still verify)
    socket.on("enter_dashboard", (callback) => {
      if (dashboardUsers.has(socket.id)) {
        clearTimeout(dashboardUsers.get(socket.id));
        dashboardUsers.set(socket.id, startSessionTimer(socket));
        if (callback) callback({ success: true });
        return;
      }
      if (dashboardUsers.size >= MAX_CONCURRENT_SEARCHES) {
        if (callback) callback({ success: false, message: "Dashboard is at full capacity. Please wait for someone to leave." });
        return;
      }
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
      removeUserFromQueue(socket.id);
      removeDashboardUser(socket);
      broadcastStats();
    });
  });
}

function removeUserFromQueue(socketId) {
  const initialLength = waitingQueue.length;
  waitingQueue = waitingQueue.filter(u => u.socketId !== socketId);
  if (waitingQueue.length !== initialLength) {
    updateWaitingQueuePositions();
    broadcastStats();
  }
}

function updateWaitingQueuePositions() {
  waitingQueue.forEach((user, index) => {
    user.socket.emit("queue_update", { position: index + 1 });
  });
}

function processQueue() {
  // If there's a free slot and someone is waiting
  if (dashboardUsers.size < MAX_CONCURRENT_SEARCHES && waitingQueue.length > 0) {
    const nextUser = waitingQueue.shift();
    // Pre-admit them
    dashboardUsers.set(nextUser.socketId, startSessionTimer(nextUser.socket));
    // Tell them they're admitted
    nextUser.socket.emit("queue_admitted");
    updateWaitingQueuePositions();
    broadcastStats();
  }
}

function startSessionTimer(socket) {
  return setTimeout(() => {
    if (dashboardUsers.has(socket.id)) {
      dashboardUsers.delete(socket.id);
      socket.emit("session_expired", { message: "Your 3-minute session has expired." });
      processQueue(); // Automatically admit the next person!
      broadcastStats();
    }
  }, SESSION_LIMIT_MS);
}

function removeDashboardUser(socket) {
  if (dashboardUsers.has(socket.id)) {
    clearTimeout(dashboardUsers.get(socket.id));
    dashboardUsers.delete(socket.id);
    processQueue(); // Automatically admit the next person!
    broadcastStats();
  }
}

function broadcastStats() {
  if (io) {
    io.emit("stats", {
      activeUsers,
      activeRequests: dashboardUsers.size,
      maxRequests: MAX_CONCURRENT_SEARCHES,
      queueLength: waitingQueue.length
    });
  }
}

// Middleware to check API spam cooldown
function checkQueue(req, res, next) {
  const userIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (Math.random() < 0.05) {
    for (const [ip, expiry] of userCooldowns.entries()) {
      if (now > expiry) userCooldowns.delete(ip);
    }
  }

  // 1. Check Spam Cooldown (15 seconds)
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

  // Add the search cooldown
  userCooldowns.set(userIp, now + COOLDOWN_MS);

  // We no longer block API requests if the dashboard is full, because 
  // users ALREADY inside the dashboard need to be able to fetch data!
  // The queue waitroom logic is handled entirely by the Sockets above.
  next();
}

module.exports = {
  initSocket,
  checkQueue,
  broadcastStats
};
