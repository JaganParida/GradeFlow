import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, ShieldCheck, RefreshCw, AlertCircle, ArrowRight, CheckCircle } from "lucide-react";

export default function WaitingRoomPage({
  position = 1,
  totalInQueue = 1,
  estimatedWaitSecs = 15,
  message = "",
  onLeaveQueue,
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(estimatedWaitSecs);
  const [isAdmitting, setIsAdmitting] = useState(false);

  // Countdown timer simulation for estimated wait
  useEffect(() => {
    setSecondsRemaining(estimatedWaitSecs);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [estimatedWaitSecs]);

  // Format seconds into "M min S sec"
  const formatWaitTime = (secs) => {
    if (secs <= 0) return "Less than a minute";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `~ ${s}s`;
    return `~ ${m}m ${s > 0 ? `${s}s` : ""}`;
  };

  // Calculate queue progress percentage
  const total = Math.max(totalInQueue, position, 1);
  const progressPercent = Math.min(100, Math.max(8, Math.round(((total - position + 1) / total) * 100)));

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: "24px 16px",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#ffffff",
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(15, 23, 42, 0.04)",
          padding: "32px 24px",
          boxSizing: "border-box",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top Gradient Ribbon */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: "linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)",
          }}
        />

        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
          <img
            src="/webisteLogo.png"
            alt="GradeFlow"
            style={{ height: 38, width: "auto", objectFit: "contain" }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: "#eff6ff",
              color: "#2563eb",
              border: "1px solid #dbeafe",
              padding: "4px 10px",
              borderRadius: 99,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#2563eb",
                boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.2)",
              }}
            />
            Virtual Waiting Room
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 8px 0",
            letterSpacing: "-0.4px",
          }}
        >
          High Student Traffic
        </h1>
        <p
          style={{
            fontSize: 13.5,
            color: "#64748b",
            margin: "0 0 24px 0",
            lineHeight: 1.5,
          }}
        >
          {message || "We are temporarily pacing access to guarantee instantaneous performance for everyone."}
        </p>

        {/* Live Position Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
            border: "1.5px solid #dbeafe",
            borderRadius: 20,
            padding: "24px 20px",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Your Place in Line
          </div>
          <motion.div
            key={position}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              fontSize: 54,
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1,
              letterSpacing: "-1.5px",
              margin: "6px 0",
            }}
          >
            #{position}
          </motion.div>
          <div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 600 }}>
            {totalInQueue > 1 ? `${totalInQueue} students currently in line` : "You are at the front of the line!"}
          </div>

          {/* Animated Queue Progress Bar */}
          <div
            style={{
              width: "100%",
              height: 8,
              background: "#e2e8f0",
              borderRadius: 99,
              marginTop: 18,
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                borderRadius: 99,
              }}
            />
          </div>
        </div>

        {/* Metric Badges */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "12px 14px",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
              <Clock size={13} color="#2563eb" /> Est. Wait Time
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
              {formatWaitTime(secondsRemaining)}
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "12px 14px",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
              <Users size={13} color="#059669" /> Queue Status
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#059669" }}>
              Live & Moving
            </div>
          </div>
        </div>

        {/* Friendly Notice Box */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "12px 16px",
            marginBottom: 24,
            textAlign: "left",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <ShieldCheck size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
            <strong>Please keep this tab open.</strong> Your spot is safely reserved. As soon as a slot opens, you will automatically transition directly into GradeFlow.
          </div>
        </div>

        {/* Leave Queue Button */}
        {onLeaveQueue && (
          <button
            onClick={onLeaveQueue}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              padding: "6px 12px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#64748b")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            Leave Waiting Room
          </button>
        )}
      </motion.div>
    </div>
  );
}
