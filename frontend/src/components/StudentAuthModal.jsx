import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp, API_BASE } from "../context/AppContext";
import axios from "axios";
import { encodeStudentId } from "../utils/studentIdEncoder";
import {
  GraduationCap,
  Mail,
  ShieldCheck,
  Clock,
  ArrowRight,
  RefreshCw,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Smartphone,
  ChevronLeft,
} from "lucide-react";

export default function StudentAuthModal({ isOpen, onClose }) {
  const {
    sendStudentOtp,
    verifyStudentOtp,
    studentData,
    studentSession,
    hasActiveSession,
    pendingDestination,
    setPendingDestination,
  } = useApp();
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
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [timerActive, setTimerActive] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState(null); // { isBlocked, isCurrentDevice, message }

  // Helper to route to intended destination after auth
  const navigateToDestination = (cleanReg) => {
    onClose();
    if (pendingDestination) {
      const dest = pendingDestination;
      setPendingDestination(null);
      if (dest.type === "timetable") {
        navigate(`/timetable/${encodeStudentId(cleanReg)}`);
      } else if (dest.type === "attendance") {
        navigate(`/attendance/${encodeStudentId(cleanReg)}`);
      } else if (dest.type === "analytics") {
        const query = dest.tab ? `?tab=${encodeURIComponent(dest.tab)}` : "";
        navigate(`/analytics/${encodeStudentId(cleanReg)}${query}`);
      } else if (dest.type === "leaderboard") {
        navigate("/leaderboard");
      } else {
        navigate(`/dashboard/${encodeStudentId(cleanReg)}`);
      }
    } else {
      navigate(`/dashboard/${encodeStudentId(cleanReg)}`);
    }
  };

  // If already authenticated with active session, auto-close modal and navigate to destination
  useEffect(() => {
    if (isOpen && hasActiveSession) {
      const currentReg = studentSession?.regNo || studentData?.regNo || regNo;
      if (currentReg) {
        navigateToDestination(currentReg);
      } else {
        onClose();
      }
    }
  }, [isOpen, hasActiveSession, studentSession, studentData]);

  // Cleanly reset state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setErrorCode("");
      setOtp("");
      setStep(1);
      setTimerActive(false);
      setDeviceStatus(null);
      if (hasActiveSession && (studentSession?.regNo || studentData?.regNo)) {
        setRegNo(studentSession?.regNo || studentData?.regNo);
      } else {
        setRegNo("");
        setMaskedEmail("");
        setStudentName("");
      }
    } else {
      setStep(1);
      setOtp("");
      setErrorMsg("");
      setErrorCode("");
      setTimerActive(false);
      setDeviceStatus(null);
    }
  }, [isOpen, hasActiveSession]);

  // Live Pre-Check for active device limit (Debounced by 280ms)
  useEffect(() => {
    const clean = regNo.trim().toUpperCase();
    if (!isOpen || step !== 1 || clean.length < 8) {
      setDeviceStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const studentJwt = localStorage.getItem("gf_student_jwt") || sessionStorage.getItem("gf_student_jwt");
        const headers = studentJwt ? { "x-student-token": studentJwt, Authorization: `Bearer ${studentJwt}` } : {};
        const res = await axios.get(`${API_BASE}/auth/student/check-status?regNo=${encodeURIComponent(clean)}`, {
          headers,
          withCredentials: true,
        });
        if (res.data?.success && res.data?.exists) {
          if (res.data.isBlocked) {
            setDeviceStatus({ isBlocked: true, message: res.data.blockMessage });
            setErrorMsg(res.data.blockMessage);
            setErrorCode("DEVICE_ALREADY_LOGGED_IN");
          } else if (res.data.isCurrentDevice) {
            setDeviceStatus({ isCurrentDevice: true });
            setErrorMsg("");
            setErrorCode("");
          } else {
            setDeviceStatus({ isBlocked: false });
            if (errorCode === "DEVICE_ALREADY_LOGGED_IN" || errorCode === "MAX_DEVICES_ACTIVE") {
              setErrorMsg("");
              setErrorCode("");
            }
          }
        } else {
          setDeviceStatus(null);
        }
      } catch {
        setDeviceStatus(null);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [regNo, isOpen, step]);

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
    if (deviceStatus?.isBlocked) return;

    const cleanReg = regNo.trim().toUpperCase();
    if (!cleanReg) {
      setErrorMsg("Please enter your university registration number.");
      setErrorCode("EMPTY_REG");
      return;
    }

    if (deviceStatus?.isCurrentDevice) {
      navigateToDestination(cleanReg);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setErrorCode("");

    const result = await sendStudentOtp(cleanReg);
    setLoading(false);

    if (result.success) {
      if (result.data?.alreadyLoggedIn) {
        navigateToDestination(cleanReg);
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

    if (result.success || hasActiveSession) {
      navigateToDestination(cleanReg);
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
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{
            background: "#ffffff",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.22)",
            maxWidth: 440,
            width: "100%",
            position: "relative",
            boxSizing: "border-box",
            padding: "26px 24px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <X size={15} />
          </button>

          {/* Modal Header */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "#eff6ff",
                border: "1px solid #dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
              }}
            >
              <GraduationCap size={24} color="#2563eb" />
            </div>

            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 4px 0",
                letterSpacing: "-0.4px",
              }}
            >
              {step === 1 ? "Student Portal Login" : "Email Verification"}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              {step === 1
                ? "Official authentication via Centurion University email"
                : `Enter the 6-digit code sent to your email inbox`}
            </p>
          </div>

          {/* Form Content */}
          {step === 1 ? (
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#475569",
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
                      padding: "11px 14px",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                      color: "#0f172a",
                      background: "#f8fafc",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: 10,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.15s ease",
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
                      fontSize: 11.5,
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
                    background:
                      errorCode === "DEVICE_LIMIT_REACHED" || errorCode === "DEVICE_ALREADY_LOGGED_IN" || errorCode === "MAX_DEVICES_ACTIVE" || errorCode === "ALREADY_LOGGED_IN_ANOTHER_DEVICE"
                        ? "#fef2f2"
                        : errorCode === "DAILY_LIMIT_EXCEEDED"
                        ? "#fffbeb"
                        : "#fef2f2",
                    border: `1.5px solid ${
                      errorCode === "DEVICE_LIMIT_REACHED" || errorCode === "DEVICE_ALREADY_LOGGED_IN" || errorCode === "MAX_DEVICES_ACTIVE" || errorCode === "ALREADY_LOGGED_IN_ANOTHER_DEVICE"
                        ? "#fca5a5"
                        : errorCode === "DAILY_LIMIT_EXCEEDED"
                        ? "#fde68a"
                        : "#fca5a5"
                    }`,
                    borderRadius: 10,
                    padding: "11px 13px",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  {errorCode === "DEVICE_LIMIT_REACHED" || errorCode === "DEVICE_ALREADY_LOGGED_IN" || errorCode === "MAX_DEVICES_ACTIVE" || errorCode === "ALREADY_LOGGED_IN_ANOTHER_DEVICE" ? (
                    <Smartphone size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  ) : errorCode === "DAILY_LIMIT_EXCEEDED" ? (
                    <Clock size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                  ) : (
                    <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  )}
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color:
                        errorCode === "DEVICE_LIMIT_REACHED" || errorCode === "DEVICE_ALREADY_LOGGED_IN" || errorCode === "MAX_DEVICES_ACTIVE" || errorCode === "ALREADY_LOGGED_IN_ANOTHER_DEVICE"
                          ? "#991b1b"
                          : errorCode === "DAILY_LIMIT_EXCEEDED"
                          ? "#92400e"
                          : "#991b1b",
                      lineHeight: 1.45,
                    }}
                  >
                    {errorMsg}
                  </div>
                </div>
              )}

              {/* Security Policy Highlights */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #f1f5f9",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#475569" }}>
                  <ShieldCheck size={13} color="#16a34a" />
                  <span>
                    <strong>{regNo.trim().toUpperCase() === "230301120327" ? "Multi-Device Lock:" : "Single Device Lock:"}</strong>{" "}
                    {regNo.trim().toUpperCase() === "230301120327" ? "Maximum 2 active devices allowed." : "Only 1 active device allowed per student."}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#475569" }}>
                  <Clock size={13} color="#2563eb" />
                  <span>
                    <strong>Daily OTP Limit:</strong> {regNo.trim().toUpperCase() === "230301120327" ? "Developer bypass active." : "Maximum 2 attempts per day (resets at midnight)."}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#475569" }}>
                  <Lock size={13} color="#64748b" />
                  <span><strong>Inactivity Policy:</strong> Automatic logout after 7 days of continuous inactivity.</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !regNo.trim() || deviceStatus?.isBlocked}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 10,
                  border: deviceStatus?.isBlocked ? "1.5px solid #fca5a5" : "none",
                  background: deviceStatus?.isBlocked
                    ? "#fee2e2"
                    : deviceStatus?.isCurrentDevice
                    ? "#16a34a"
                    : loading || !regNo.trim()
                    ? "#cbd5e1"
                    : "#0f172a",
                  color: deviceStatus?.isBlocked ? "#991b1b" : "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: loading || !regNo.trim() || deviceStatus?.isBlocked ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading && regNo.trim() && !deviceStatus?.isBlocked) {
                    e.currentTarget.style.background = deviceStatus?.isCurrentDevice ? "#15803d" : "#1e293b";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && regNo.trim() && !deviceStatus?.isBlocked) {
                    e.currentTarget.style.background = deviceStatus?.isCurrentDevice ? "#16a34a" : "#0f172a";
                  }
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Sending Code...</span>
                  </>
                ) : deviceStatus?.isBlocked ? (
                  <>
                    <Lock size={15} color="#991b1b" />
                    <span>Login Blocked (Active on Device)</span>
                  </>
                ) : deviceStatus?.isCurrentDevice ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Already Active — Continue</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 10,
                  padding: "10px 12px",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12, color: "#166534", fontWeight: 700 }}>
                  <Mail size={13} color="#16a34a" />
                  <span>Verification code sent to:</span>
                </div>
                <div style={{ margin: "3px 0 0 0", fontSize: 13.5, fontWeight: 800, color: "#15803d", fontFamily: "'Space Mono', monospace" }}>
                  {maskedEmail}
                </div>
                <div style={{ fontSize: 11, color: "#166534", marginTop: 3 }}>
                  {remainingDailyAttempts >= 90 ? (
                    <span>Access: <strong>Developer Access (Unlimited)</strong></span>
                  ) : (
                    <span>Remaining attempts today: <strong>{remainingDailyAttempts}/2</strong></span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Enter 6-Digit OTP
                  </label>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: timerSeconds < 30 ? "#dc2626" : "#059669",
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {timerActive ? (
                      <>
                        <Clock size={12} />
                        <span>{formatTimer(timerSeconds)}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} color="#dc2626" />
                        <span>Code Expired</span>
                      </>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: "10px",
                    textAlign: "center",
                    fontFamily: "'Space Mono', monospace",
                    color: "#0f172a",
                    background: "#f8fafc",
                    border: "1.5px solid #2563eb",
                    borderRadius: 10,
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
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "#991b1b",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <AlertCircle size={14} color="#dc2626" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: loading || otp.length < 6 ? "#cbd5e1" : "#16a34a",
                  color: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: loading || otp.length < 6 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading && otp.length >= 6) e.currentTarget.style.background = "#15803d";
                }}
                onMouseLeave={(e) => {
                  if (!loading && otp.length >= 6) e.currentTarget.style.background = "#16a34a";
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Verify & Continue</span>
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
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Change Reg. No.</span>
                </button>

                <button
                  type="button"
                  disabled={timerActive || remainingDailyAttempts <= 0 || loading}
                  onClick={handleResendOtp}
                  style={{
                    background: "none",
                    border: "none",
                    color: timerActive || remainingDailyAttempts <= 0 ? "#94a3b8" : "#2563eb",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: timerActive || remainingDailyAttempts <= 0 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: 0,
                  }}
                >
                  <RefreshCw size={12} className={loading ? "spin" : ""} />
                  <span>Resend Code {timerActive ? `(${formatTimer(timerSeconds)})` : ""}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
