import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { encodeStudentId } from "../utils/studentIdEncoder";
import {
  GraduationCap,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  RefreshCw,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Smartphone,
} from "lucide-react";

export default function StudentAuthModal({ isOpen, onClose }) {
  const { sendStudentOtp, verifyStudentOtp, studentData } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Enter RegNo, 2 = Enter OTP
  const [regNo, setRegNo] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [remainingDailyAttempts, setRemainingDailyAttempts] = useState(2);
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [timerActive, setTimerActive] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setErrorCode("");
      setOtp("");
      if (!regNo && studentData?.regNo) {
        setRegNo(studentData.regNo);
      }
    }
  }, [isOpen]);

  // Live 3-Minute Countdown Timer for OTP
  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanReg = regNo.trim().toUpperCase();
    if (!cleanReg) {
      setErrorMsg("Please enter your university registration number.");
      setErrorCode("EMPTY_REG");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setErrorCode("");

    const result = await sendStudentOtp(cleanReg);
    setLoading(false);

    if (result.success) {
      if (result.data?.alreadyLoggedIn) {
        // Already active on this device
        onClose();
        navigate(`/dashboard/${encodeStudentId(cleanReg)}`);
        return;
      }

      setMaskedEmail(result.data?.maskedEmail || `${cleanReg.toLowerCase()}@centurionuniv.edu.in`);
      setStudentName(result.data?.studentName || "Student");
      setRemainingDailyAttempts(result.data?.remainingDailyAttempts ?? 1);
      setTimerSeconds(result.data?.expiresInSeconds || 180);
      setTimerActive(true);
      setStep(2);
    } else {
      setErrorMsg(result.error);
      setErrorCode(result.code);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      setErrorCode("INVALID_LENGTH");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setErrorCode("");

    const cleanReg = regNo.trim().toUpperCase();
    const result = await verifyStudentOtp(cleanReg, cleanOtp);
    setLoading(false);

    if (result.success) {
      onClose();
      navigate(`/dashboard/${encodeStudentId(cleanReg)}`);
    } else {
      setErrorMsg(result.error);
      setErrorCode(result.code);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (timerActive || remainingDailyAttempts <= 0) return;
    setOtp("");
    await handleSendOtp();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            background: "#ffffff",
            borderRadius: 22,
            border: "1.5px solid #e2e8f0",
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3)",
            maxWidth: 480,
            width: "100%",
            overflow: "hidden",
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              padding: "24px 24px 20px 24px",
              color: "#ffffff",
              position: "relative",
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                background: "rgba(255, 255, 255, 0.12)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                }}
              >
                <GraduationCap size={24} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>
                  {step === 1 ? "Student Portal Login" : "Verify University Email"}
                </h3>
                <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "3px 0 0 0" }}>
                  {step === 1
                    ? "Official Authentication via Centurion University Email"
                    : `Enter the 6-digit OTP code sent to your email`}
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div style={{ padding: "24px" }}>
            {step === 1 ? (
              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    University Registration Number
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                      placeholder="e.g. 230101120001"
                      autoFocus
                      required
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        fontSize: 15,
                        fontWeight: 700,
                        fontFamily: "'Space Mono', monospace",
                        color: "#0f172a",
                        background: "#f8fafc",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: 12,
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#2563eb";
                        e.target.style.background = "#ffffff";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#cbd5e1";
                        e.target.style.background = "#f8fafc";
                      }}
                    />
                  </div>

                  {regNo.trim() && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#2563eb",
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontWeight: 600,
                      }}
                    >
                      <Mail size={13} />
                      <span>OTP will be sent to: <strong>{regNo.trim().toLowerCase()}@centurionuniv.edu.in</strong></span>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div
                    style={{
                      background: errorCode === "DEVICE_ALREADY_ACTIVE" ? "#eff6ff" : errorCode === "DAILY_LIMIT_EXCEEDED" ? "#fffbeb" : "#fef2f2",
                      border: `1.5px solid ${errorCode === "DEVICE_ALREADY_ACTIVE" ? "#93c5fd" : errorCode === "DAILY_LIMIT_EXCEEDED" ? "#fde68a" : "#fca5a5"}`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    {errorCode === "DEVICE_ALREADY_ACTIVE" ? (
                      <Smartphone size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                    ) : errorCode === "DAILY_LIMIT_EXCEEDED" ? (
                      <Clock size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    ) : (
                      <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                    )}
                    <div style={{ fontSize: 12.5, color: errorCode === "DEVICE_ALREADY_ACTIVE" ? "#1e40af" : errorCode === "DAILY_LIMIT_EXCEEDED" ? "#92400e" : "#991b1b", lineHeight: 1.4 }}>
                      {errorMsg}
                    </div>
                  </div>
                )}

                {/* Security Feature Highlights */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569" }}>
                    <ShieldCheck size={14} color="#059669" />
                    <span><strong>Single Device Policy:</strong> 1 active login per student.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569" }}>
                    <Clock size={14} color="#2563eb" />
                    <span><strong>Daily OTP Limit:</strong> Maximum 2 attempts/day (resets at 12 AM).</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569" }}>
                    <Lock size={14} color="#64748b" />
                    <span><strong>7-Day Inactivity Timeout:</strong> Auto logout after 7 days of inactivity.</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !regNo.trim()}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: 12,
                    border: "none",
                    background: loading || !regNo.trim() ? "#cbd5e1" : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    fontSize: 14.5,
                    fontWeight: 800,
                    cursor: loading || !regNo.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: loading || !regNo.trim() ? "none" : "0 4px 14px rgba(37, 99, 235, 0.35)",
                    transition: "all 0.2s",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1.5px solid #86efac",
                    borderRadius: 12,
                    padding: "12px 14px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: "#166534", fontWeight: 700 }}>
                    Verification Code Sent to:
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: 14, fontWeight: 900, color: "#047857", fontFamily: "'Space Mono', monospace" }}>
                    {maskedEmail}
                  </p>
                  <div style={{ fontSize: 11.5, color: "#15803d", marginTop: 4 }}>
                    Remaining OTP sends today: <strong>{remainingDailyAttempts}/2</strong>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#334155",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Enter 6-Digit OTP
                    </label>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: timerSeconds < 30 ? "#dc2626" : "#059669",
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      {timerActive ? `⏳ ${formatTimer(timerSeconds)}` : "⚠️ Code Expired"}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    autoFocus
                    required
                    style={{
                      width: "100%",
                      padding: "14px",
                      fontSize: 26,
                      fontWeight: 900,
                      letterSpacing: "12px",
                      textAlign: "center",
                      fontFamily: "'Space Mono', monospace",
                      color: "#0f172a",
                      background: "#f8fafc",
                      border: "2px solid #2563eb",
                      borderRadius: 12,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {errorMsg && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fca5a5",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 12.5,
                      color: "#991b1b",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <AlertTriangle size={15} color="#dc2626" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: 12,
                    border: "none",
                    background: loading || otp.length < 6 ? "#cbd5e1" : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#ffffff",
                    fontSize: 14.5,
                    fontWeight: 800,
                    cursor: loading || otp.length < 6 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: loading || otp.length < 6 ? "none" : "0 4px 14px rgba(5, 150, 105, 0.35)",
                    transition: "all 0.2s",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      <span>Verify & Access Dashboard</span>
                    </>
                  )}
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                      setErrorMsg("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    &larr; Change Reg. No.
                  </button>

                  <button
                    type="button"
                    disabled={timerActive || remainingDailyAttempts <= 0 || loading}
                    onClick={handleResendOtp}
                    style={{
                      background: "none",
                      border: "none",
                      color: timerActive || remainingDailyAttempts <= 0 ? "#94a3b8" : "#2563eb",
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: timerActive || remainingDailyAttempts <= 0 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: 0,
                    }}
                  >
                    <RefreshCw size={12} className={loading ? "spin" : ""} />
                    <span>Resend OTP {timerActive ? `(${formatTimer(timerSeconds)})` : ""}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
