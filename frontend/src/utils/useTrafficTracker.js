import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { parseDeviceDetails } from "./deviceHelper";

function getOrCreateClientToken() {
  try {
    let token = sessionStorage.getItem("gf_traffic_client_token");
    if (!token) {
      token = `gf_cli_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem("gf_traffic_client_token", token);
    }
    return token;
  } catch {
    return `gf_cli_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

function hasValidAdmissionTicket() {
  try {
    const raw = sessionStorage.getItem("gf_traffic_admitted_until");
    if (!raw) return false;
    const expiresAt = parseInt(raw, 10);
    return !isNaN(expiresAt) && Date.now() < expiresAt;
  } catch {
    return false;
  }
}

function setAdmissionTicket(ttlMs = 60 * 60 * 1000) {
  try {
    sessionStorage.setItem("gf_traffic_admitted_until", String(Date.now() + ttlMs));
  } catch {}
}

export function useTrafficTracker({ studentSession, studentData, adminToken }) {
  const location = useLocation();
  const socketRef = useRef(null);
  const clientTokenRef = useRef(getOrCreateClientToken());

  const [queueState, setQueueState] = useState(() => ({
    inQueue: false,
    position: 0,
    totalInQueue: 0,
    estimatedWaitSecs: 0,
    message: "",
    isAdmitted: hasValidAdmissionTicket(),
  }));

  const isAdminRoute = location.pathname === "/admin" || location.pathname.startsWith("/admin/");
  const isAuthorizedAdmin = Boolean(adminToken) || isAdminRoute;

  // 1. Socket.IO Connection and Real-Time Event Handling
  useEffect(() => {
    // Admins are exempt from the traffic waiting room
    if (isAuthorizedAdmin) {
      setQueueState((prev) => ({ ...prev, inQueue: false, isAdmitted: true }));
    }

    const token = clientTokenRef.current;
    const deviceInfo = parseDeviceDetails({
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      platform: typeof navigator !== "undefined" ? navigator.platform : "",
    });

    const regNo = studentSession?.regNo || null;
    const studentName = studentData?.studentName || studentSession?.studentName || null;
    const branch = studentData?.branch || studentSession?.branch || null;
    const batch = studentData?.batch || studentSession?.batch || null;

    const wsTarget =
      import.meta.env.VITE_WS_URL ||
      (import.meta.env.VITE_API_URL?.startsWith("http")
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
        : null);

    const isVercelServerless =
      typeof window !== "undefined" &&
      window.location.hostname.includes("vercel.app") &&
      !wsTarget;

    let socket = null;
    let pingInterval = null;

    if (!isVercelServerless) {
      try {
        socket = io(wsTarget || undefined, {
          transports: ["websocket", "polling"],
          reconnectionAttempts: 2,
          timeout: 4000,
          autoConnect: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("student:register", {
            token,
            regNo,
            studentName,
            branch,
            batch,
            route: location.pathname,
            deviceType: deviceInfo.deviceType,
            os: deviceInfo.os,
            browser: deviceInfo.browser,
            isAdmin: isAuthorizedAdmin,
          });
        });

        socket.on("connect_error", () => {
          if (socket) socket.disconnect();
        });

        // Received when queue is active and student must enter waiting room
        socket.on("queue:required", (data = {}) => {
          if (isAuthorizedAdmin) return;
          if (hasValidAdmissionTicket()) return;

          setQueueState({
            inQueue: true,
            position: data.position || 1,
            totalInQueue: data.totalInQueue || 1,
            estimatedWaitSecs: data.estimatedWaitSecs || 15,
            message: data.message || "High traffic event. You are in line.",
            isAdmitted: false,
          });
        });

        // Received when admin admits student into site
        socket.on("queue:admitted", (data = {}) => {
          if (data.token && data.token !== token) return;
          setAdmissionTicket(data.ttlMs || 60 * 60 * 1000);
          setQueueState({
            inQueue: false,
            position: 0,
            totalInQueue: 0,
            estimatedWaitSecs: 0,
            message: "",
            isAdmitted: true,
          });
        });

        socket.on("queue:bypass", () => {
          setQueueState((prev) => ({ ...prev, inQueue: false, isAdmitted: true }));
        });

        // Periodic Heartbeat Ping (every 25 seconds)
        pingInterval = setInterval(() => {
          if (socket && socket.connected) {
            socket.emit("student:ping", {
              token,
              route: location.pathname,
            });
          }
        }, 25000);
      } catch {}
    }

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (socket) {
        try {
          socket.disconnect();
        } catch {}
      }
    };
  }, [studentSession?.regNo, isAuthorizedAdmin]);

  // 2. Track Route Changes on Navigation
  useEffect(() => {
    const token = clientTokenRef.current;
    const currentPath = location.pathname;

    // Send route change to socket
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("student:route_change", {
        token,
        route: currentPath,
      });
    }

    // Also send HTTP beacon for persistent database logging and queue validation
    const deviceInfo = parseDeviceDetails({
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      platform: typeof navigator !== "undefined" ? navigator.platform : "",
    });

    const regNo = studentSession?.regNo || null;
    const studentName = studentData?.studentName || studentSession?.studentName || null;
    const branch = studentData?.branch || studentSession?.branch || null;
    const batch = studentData?.batch || studentSession?.batch || null;

    axios
      .post(
        "/api/traffic/page-view",
        {
          token,
          route: currentPath,
          regNo,
          studentName,
          branch,
          batch,
          deviceType: deviceInfo.deviceType,
          os: deviceInfo.os,
          browser: deviceInfo.browser,
          isAdmin: isAuthorizedAdmin,
        },
        { timeout: 5000 }
      )
      .then((res) => {
        if (res.data?.queued && !isAuthorizedAdmin && !hasValidAdmissionTicket()) {
          setQueueState({
            inQueue: true,
            position: res.data.queueInfo?.position || 1,
            totalInQueue: res.data.queueInfo?.totalInQueue || 1,
            estimatedWaitSecs: res.data.queueInfo?.estimatedWaitSecs || 15,
            message: res.data.message || "High traffic waiting queue.",
            isAdmitted: false,
          });
        } else if (res.data?.admitted) {
          if (res.data.bypass) {
            setQueueState((prev) => ({ ...prev, inQueue: false, isAdmitted: true }));
          }
        }
      })
      .catch(() => {});

    // Periodic heartbeat every 60 seconds (only when tab is actively visible) to protect Vercel quotas
    const heartbeatInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return; // Zero requests when student tab is in background, minimized, or phone is locked!
      }
      axios
        .post(
          "/api/traffic/page-view",
          {
            token,
            route: currentPath,
            regNo,
            studentName,
            branch,
            batch,
            deviceType: deviceInfo.deviceType,
            os: deviceInfo.os,
            browser: deviceInfo.browser,
            isAdmin: isAuthorizedAdmin,
          },
          { timeout: 5000 }
        )
        .catch(() => {});
    }, 60000);

    return () => clearInterval(heartbeatInterval);
  }, [location.pathname, isAuthorizedAdmin, studentSession?.regNo, studentData?.studentName]);

  // Method for student to voluntarily leave queue
  const leaveQueue = () => {
    const token = clientTokenRef.current;
    axios.post("/api/traffic/queue-leave", { token }).catch(() => {});
    setQueueState({
      inQueue: false,
      position: 0,
      totalInQueue: 0,
      estimatedWaitSecs: 0,
      message: "",
      isAdmitted: false,
    });
  };

  return {
    queueState,
    leaveQueue,
    isAuthorizedAdmin,
  };
}
