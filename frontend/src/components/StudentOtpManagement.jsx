import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Clock,
  Smartphone,
  Laptop,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  User,
  Info,
  RefreshCw,
  Send,
  Sliders,
  Check,
  X,
  Sparkles,
  Layers,
  Globe,
  Activity,
  Calendar,
  Monitor,
  Tablet,
} from "lucide-react";

function formatISTDate(dateVal) {
  if (!dateVal) return "N/A";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "N/A";
  }
}

export default function StudentOtpManagement({ API, authHeaders, isMobile }) {
  const [searchReg, setSearchReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [timeline, setTimeline] = useState([]);

  // Reset Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetReason, setResetReason] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const cleanReg = searchReg.trim().toUpperCase();
    if (!cleanReg) {
      setErrorMsg("Please enter a student registration number.");
      return;
    }
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleanReg)) {
      setErrorMsg("Invalid registration number format (must be 3-30 alphanumeric characters).");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await axios.get(
        `${API}/admin/student-otp-management/history/${cleanReg}`,
        authHeaders
      );
      if (res.data?.success) {
        setStudentData(res.data.studentSummary);
        setTimeline(res.data.historyTimeline || []);
      } else {
        setErrorMsg(res.data?.message || "Failed to fetch student OTP details.");
        setStudentData(null);
        setTimeline([]);
      }
    } catch (err) {
      console.error("Student OTP Search Error:", err);
      const msg = err.response?.data?.message || "Student record not found or server error.";
      setErrorMsg(msg);
      setStudentData(null);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async () => {
    if (!studentData?.regNo) return;
    setResetLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await axios.post(
        `${API}/admin/student-otp-management/reset/${studentData.regNo}`,
        { reason: resetReason.trim() },
        authHeaders
      );

      if (res.data?.success) {
        setSuccessMsg(res.data.message || "OTP attempts reset successfully.");
        setShowResetModal(false);
        setResetReason("");
        // Refresh details
        handleSearch();
      } else {
        setErrorMsg(res.data?.message || "Failed to reset OTP attempts.");
      }
    } catch (err) {
      console.error("OTP Reset Error:", err);
      setErrorMsg(err.response?.data?.message || "An error occurred while resetting OTP attempts.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Top Header Banner ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          borderRadius: 20,
          padding: isMobile ? "20px 16px" : "24px 28px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(49, 46, 129, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <ShieldAlert size={28} color="#a5b4fc" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, letterSpacing: "-0.5px" }}>
                Student OTP Attempt Management
              </h2>
              <span
                style={{
                  background: "#4338ca",
                  color: "#e0e7ff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "1px solid #6366f1",
                  textTransform: "uppercase",
                }}
              >
                Main Admin Only
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#c7d2fe", maxWidth: 650, lineHeight: 1.4 }}>
              Inspect detailed OTP request history, device origins, and provider delivery statuses before making an administrative decision to reset daily limits.
            </p>
          </div>
        </div>
      </div>

      {/* ── Search Bar Card ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          padding: isMobile ? "16px 14px" : "20px 24px",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
        }}
      >
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: isMobile ? "100%" : 280 }}>
            <Search
              size={18}
              color="#94a3b8"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Enter Student Reg No (e.g., 230301120137)..."
              value={searchReg}
              onChange={(e) => setSearchReg(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px 12px 42px",
                borderRadius: 12,
                border: "1.5px solid #cbd5e1",
                fontSize: 14,
                fontWeight: 600,
                color: "#0f172a",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              border: "none",
              background: "#4f46e5",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
              transition: "all 0.2s",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
            Search Activity
          </button>
        </form>

        {errorMsg && (
          <div
            style={{
              marginTop: 14,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#b91c1c",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={16} color="#dc2626" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              marginTop: 14,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#15803d",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} color="#16a34a" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* ── Student Summary & Timeline (If Student Found) ── */}
      {studentData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          {/* Summary Overview Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {/* Student Info Card */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Student Identity
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                {studentData.studentName}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#4f46e5" }}>
                {studentData.regNo}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                <Mail size={12} /> {studentData.maskedEmail}
              </div>
            </div>

            {/* Today's Usage Card */}
            <div
              style={{
                background: studentData.todayUsage >= studentData.maxDailyLimit ? "#fef2f2" : "#f8fafc",
                border: `1px solid ${studentData.todayUsage >= studentData.maxDailyLimit ? "#fecaca" : "#e2e8f0"}`,
                borderRadius: 14,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Today's OTP Quota ({studentData.todayDateKey})
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: studentData.todayUsage >= studentData.maxDailyLimit ? "#b91c1c" : "#0f172a" }}>
                {studentData.todayUsage} / {studentData.maxDailyLimit}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: studentData.todayUsage >= studentData.maxDailyLimit ? "#dc2626" : "#16a34a" }}>
                {studentData.todayUsage >= studentData.maxDailyLimit ? "Daily quota exhausted" : `${studentData.remainingDailyAttempts} attempt(s) remaining`}
              </div>
            </div>

            {/* Cooldown State Card */}
            <div
              style={{
                background: studentData.isCooldownActive ? "#fffbeb" : "#f8fafc",
                border: `1px solid ${studentData.isCooldownActive ? "#fde68a" : "#e2e8f0"}`,
                borderRadius: 14,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                180-Second Cooldown
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: studentData.isCooldownActive ? "#b45309" : "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
                {studentData.isCooldownActive ? (
                  <>
                    <Clock size={18} /> {studentData.cooldownRemainingSeconds}s Active
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Not Active
                  </>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {studentData.isCooldownActive ? "Resend locked temporarily" : "Can send new OTP immediately"}
              </div>
            </div>

            {/* Active Devices Card */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Active Devices ({studentData.activeDevicesCount} / {studentData.maxAllowedDevices})
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: studentData.activeDevicesCount >= studentData.maxAllowedDevices ? "#b91c1c" : "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                <Smartphone size={18} /> {studentData.activeDevicesCount} Active Device(s)
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {studentData.activeDevicesCount >= studentData.maxAllowedDevices ? "Single-device lock active" : "Device slots available"}
              </div>
            </div>
          </div>

          {/* ── Active Authorized Device Sessions Panel ── */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              padding: isMobile ? "16px 14px" : "20px 24px",
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: (studentData.activeSessions?.length || 0) > 0 ? "#ecfdf5" : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Smartphone size={17} color={(studentData.activeSessions?.length || 0) > 0 ? "#059669" : "#64748b"} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "#0f172a" }}>
                    Active Device Sessions ({studentData.activeDevicesCount} / {studentData.maxAllowedDevices})
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                    Live student sessions currently holding valid authentication tokens in MongoDB.
                  </p>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: (studentData.activeSessions?.length || 0) > 0 ? "#065f46" : "#64748b",
                  background: (studentData.activeSessions?.length || 0) > 0 ? "#d1fae5" : "#f1f5f9",
                  padding: "4px 10px",
                  borderRadius: 8,
                  border: `1px solid ${(studentData.activeSessions?.length || 0) > 0 ? "#a7f3d0" : "#e2e8f0"}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {(studentData.activeSessions?.length || 0) > 0 ? (
                  <>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                    {studentData.activeSessions.length} Active Device{studentData.activeSessions.length > 1 ? "s" : ""}
                  </>
                ) : (
                  "0 Active Devices (Signed Out)"
                )}
              </span>
            </div>

            {(!studentData.activeSessions || studentData.activeSessions.length === 0) ? (
              <div
                style={{
                  padding: "20px 16px",
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                No active device sessions found. Student is signed out on all devices.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
                {studentData.activeSessions.map((session, idx) => {
                  const isMob = session.deviceType === "Mobile";
                  const isTab = session.deviceType === "Tablet";
                  return (
                    <div
                      key={session.sessionId || idx}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: "#eff6ff",
                              color: "#2563eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isMob ? <Smartphone size={17} /> : isTab ? <Tablet size={17} /> : <Laptop size={17} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                              {session.platform || "Authorized Device"}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#64748b" }}>
                              Device {session.deviceIndex || idx + 1} of {studentData.maxAllowedDevices}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#059669",
                            background: "#ecfdf5",
                            border: "1px solid #a7f3d0",
                            padding: "3px 8px",
                            borderRadius: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                          ACTIVE
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, paddingTop: 6, borderTop: "1px solid #f1f5f9" }}>
                        <div>
                          <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>IP Address</div>
                          <div style={{ color: "#334155", fontWeight: 600, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                            <Globe size={12} color="#64748b" /> {session.maskedIp || "Hidden"}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>Logged In</div>
                          <div style={{ color: "#334155", fontWeight: 600, marginTop: 2 }}>
                            {formatISTDate(session.loggedInAt)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>Last Active</div>
                          <div style={{ color: "#334155", fontWeight: 600, marginTop: 2 }}>
                            {formatISTDate(session.lastActiveAt)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>Session Expiry</div>
                          <div style={{ color: "#059669", fontWeight: 700, marginTop: 2 }}>
                            Permanent (Until Logout)
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Chronological OTP History Timeline ── */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              padding: isMobile ? "16px 14px" : "20px 24px",
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                  OTP Activity & Delivery History
                </h3>
                <p style={{ margin: "3px 0 0 0", fontSize: 12.5, color: "#64748b" }}>
                  Showing last {timeline.length} request attempt(s) in chronological order (Asia/Kolkata).
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", background: "#eef2ff", padding: "4px 10px", borderRadius: 8 }}>
                Total Events: {timeline.length}
              </span>
            </div>

            {timeline.length === 0 ? (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                No recent OTP request history logged for this student.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {timeline.map((item, idx) => {
                  const isDelivered = item.status === "DELIVERED";
                  const isBlocked = item.status === "BLOCKED";
                  const isFailed = item.status === "FAILED";

                  let badgeBg = "#ecfdf5";
                  let badgeBorder = "#a7f3d0";
                  let badgeColor = "#065f46";
                  if (isBlocked) {
                    badgeBg = "#fffbeb";
                    badgeBorder = "#fde68a";
                    badgeColor = "#92400e";
                  } else if (isFailed) {
                    badgeBg = "#fef2f2";
                    badgeBorder = "#fecaca";
                    badgeColor = "#991b1b";
                  }

                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "12px 16px",
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: isMobile ? "flex-start" : "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      {/* Left: Status & Time */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span
                          style={{
                            background: badgeBg,
                            border: `1px solid ${badgeBorder}`,
                            color: badgeColor,
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "4px 8px",
                            borderRadius: 6,
                            textTransform: "uppercase",
                          }}
                        >
                          {item.status}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                            {item.reason}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                            {item.formattedTime}
                          </div>
                        </div>
                      </div>

                      {/* Right: Provider & Device Pills */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {/* Provider Pill */}
                        <span
                          style={{
                            background: item.provider === "BREVO" ? "#ecfeff" : item.provider === "GMAIL" ? "#faf5ff" : "#f1f5f9",
                            border: `1px solid ${item.provider === "BREVO" ? "#a5f3fc" : item.provider === "GMAIL" ? "#e9d5ff" : "#cbd5e1"}`,
                            color: item.provider === "BREVO" ? "#0e7490" : item.provider === "GMAIL" ? "#7e22ce" : "#475569",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {item.provider === "BREVO" ? "Brevo Primary" : item.provider === "GMAIL" ? "Gmail Fallback" : "No Provider"}
                        </span>

                        {/* Device Info */}
                        <span
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#334155",
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {item.device?.deviceType === "Mobile" ? <Smartphone size={12} /> : <Laptop size={12} />}
                          {item.device?.platform} • {item.device?.maskedIp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Separate Administrative Decision Action Card ── */}
          <div
            style={{
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              border: "1.5px solid #cbd5e1",
              borderRadius: 16,
              padding: isMobile ? "18px 16px" : "22px 26px",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <ShieldCheck size={18} color="#4f46e5" />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                  Administrative Action: Reset Today's OTP Attempts
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "#64748b", maxWidth: 650, lineHeight: 1.4 }}>
                Resets only today's OTP quota ({studentData.todayDateKey}) for student <strong>{studentData.regNo}</strong> to <strong>0 / {studentData.maxDailyLimit}</strong> and clears active cooldown. Historical activity logs above are permanently retained for audit purposes.
              </p>
            </div>

            <button
              onClick={() => setShowResetModal(true)}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: "none",
                background: "#dc2626",
                color: "#ffffff",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              <RotateCcw size={16} />
              Reset Today's OTP Attempts
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Confirmation Modal ── */}
      <AnimatePresence>
        {showResetModal && studentData && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                maxWidth: 480,
                width: "100%",
                padding: 24,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RotateCcw size={20} color="#dc2626" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: "#0f172a" }}>
                      Confirm OTP Quota Reset
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Main Admin Authorization Required</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowResetModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* State Preview Box */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748b" }}>Student Reg No:</span>
                  <strong style={{ color: "#0f172a" }}>{studentData.regNo} ({studentData.studentName})</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748b" }}>Today's Usage Change:</span>
                  <strong style={{ color: "#b91c1c" }}>{studentData.todayUsage} / {studentData.maxDailyLimit} &rarr; <span style={{ color: "#16a34a" }}>0 / {studentData.maxDailyLimit}</span></strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748b" }}>Cooldown Status:</span>
                  <strong style={{ color: "#16a34a" }}>Cleared to 0s</strong>
                </div>
              </div>

              {/* Optional Reason Input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Administrative Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., OTP delivery troubleshooting, support ticket #102..."
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetLoading}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetSubmit}
                  disabled={resetLoading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "#dc2626",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: resetLoading ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {resetLoading ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                  Confirm & Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
