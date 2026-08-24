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
import BlockedLoginDeviceModal from "./BlockedLoginDeviceModal";

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
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [timerActive, setTimerActive] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [deviceStatus, setDeviceStatus] = useState(null); // { exists, isBlocked, isCurrentDevice, message, studentName }
  const [isChecking, setIsChecking] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedDevicesData, setBlockedDevicesData] = useState([]);

  const cleanReg = regNo.trim().toUpperCase();
  const isRegValid = cleanReg.length >= 10 && cleanReg.length <= 16;

  // Helper to route to intended destination after auth
  const navigateToDestination = (cleanReg) => {
    onClose();
    if (pendingDestination) {
      const dest = pendingDestination;
      setPendingDestination(null);
      if (dest.type === "feedback") {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("open-feedback-modal", { detail: { source: "auth_success" } })
          );
        }, 120);
        return;
      }
      if (dest.type === "timetable") {
        navigate(`/timetable/${encodeStudentId(cleanReg)}`);
      } else if (dest.type === "attendance") {
        navigate(`/attendance/${encodeStudentId(cleanReg)}`);
      } else if (dest.type === "analytics") {
        const query = dest.tab ? `?tab=${encodeURIComponent(dest.tab)}` : "";
        navigate(`/analytics/${encodeStudentId(cleanReg)}${query}`);
      } else if (dest.type === "predictor") {
        navigate(`/analytics/${encodeStudentId(cleanReg)}?tab=predictor`);
      } else if (dest.type === "placement") {
        navigate(`/analytics/${encodeStudentId(cleanReg)}?tab=placement`);
      } else if (dest.type === "domains") {
        navigate(`/analytics/${encodeStudentId(cleanReg)}?tab=mastery`);
      } else if (dest.type === "gradesheet") {
        navigate(`/analytics/${encodeStudentId(cleanReg)}?tab=grades`);
      } else if (dest.type === "leaderboard") {
        navigate("/leaderboard");
      } else if (dest.path) {
        navigate(dest.path.replace(":id", encodeStudentId(cleanReg)));
      } else if (dest.type === "dashboard") {
        const query = dest.tab ? `?tab=${encodeURIComponent(dest.tab)}` : "";
        navigate(`/dashboard/${encodeStudentId(cleanReg)}${query}`);
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
      setResendCooldown(0);
      setAttemptsUsed(0);
      setRemainingDailyAttempts(2);
      setDeviceStatus(null);
      setIsChecking(false);
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
      setResendCooldown(0);
      setAttemptsUsed(0);
      setRemainingDailyAttempts(2);
      setDeviceStatus(null);
      setIsChecking(false);
    }
  }, [isOpen, hasActiveSession]);

  // Live Pre-Check for active device limit & student existence (Debounced by 280ms)
  useEffect(() => {
    const clean = regNo.trim().toUpperCase();
    if (!isOpen || step !== 1) {
      setDeviceStatus(null);
      setIsChecking(false);
      return;
    }

    if (clean.length < 10) {
      setDeviceStatus(null);
      setIsChecking(false);
      if (
        errorCode === "DEVICE_LIMIT_REACHED" ||
        errorCode === "DEVICE_ALREADY_LOGGED_IN" ||
        errorCode === "MAX_DEVICES_ACTIVE" ||
        errorCode === "STUDENT_NOT_FOUND" ||
        errorCode === "EMPTY_REG"
      ) {
        setErrorMsg("");
        setErrorCode("");
      }
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const studentJwt = localStorage.getItem("gf_student_jwt") || sessionStorage.getItem("gf_student_jwt");
        const headers = studentJwt ? { "x-student-token": studentJwt, Authorization: `Bearer ${studentJwt}` } : {};
        const res = await axios.get(`${API_BASE}/auth/student/check-status?regNo=${encodeURIComponent(clean)}`, {
          headers,
          withCredentials: true,
        });

        if (res.data?.success) {
          if (!res.data.exists) {
            setDeviceStatus({ exists: false, isBlocked: false });
            setErrorMsg(`Registration number ${clean} not found in university student records.`);
            setErrorCode("STUDENT_NOT_FOUND");
          } else if (res.data.isBlocked) {
            const devices = res.data.activeDevices || res.data.sessions || [];
            setDeviceStatus({ exists: true, isBlocked: true, message: res.data.blockMessage, devices });
            setBlockedDevicesData(devices);
            setErrorMsg(res.data.blockMessage);
            setErrorCode("DEVICE_LIMIT_REACHED");
          } else if (res.data.isDailyLimitReached) {
            setDeviceStatus({ exists: true, isBlocked: true, message: res.data.blockMessage, reason: "DAILY_LIMIT_EXCEEDED" });
            setErrorMsg(res.data.blockMessage);
            setErrorCode("DAILY_LIMIT_EXCEEDED");
            setAttemptsUsed(res.data.attemptsUsedToday || 2);
            setRemainingDailyAttempts(0);
          } else if (res.data.isCurrentDevice) {
            setDeviceStatus({ exists: true, isCurrentDevice: true, isBlocked: false });
            setErrorMsg("");
            setErrorCode("");
          } else {
            setDeviceStatus({ exists: true, isBlocked: false, isCurrentDevice: false, studentName: res.data.studentName });
            if (res.data.studentName) {
              setStudentName(res.data.studentName);
            }
            if (res.data.attemptsUsedToday !== undefined) {
              setAttemptsUsed(res.data.attemptsUsedToday);
            }
            if (res.data.remainingDailyAttempts !== undefined) {
              setRemainingDailyAttempts(res.data.remainingDailyAttempts);
            }
            if (res.data.isCooldownActive && res.data.cooldownRemainingSeconds) {
              setResendCooldown(res.data.cooldownRemainingSeconds);
            }
            if (
              errorCode === "DEVICE_LIMIT_REACHED" ||
              errorCode === "DEVICE_ALREADY_LOGGED_IN" ||
              errorCode === "MAX_DEVICES_ACTIVE" ||
              errorCode === "STUDENT_NOT_FOUND" ||
              errorCode === "EMPTY_REG" ||
              errorCode === "DAILY_LIMIT_EXCEEDED"
            ) {
              setErrorMsg("");
              setErrorCode("");
            }
          }
        } else {
          setDeviceStatus(null);
        }
      } catch {
        setDeviceStatus(null);
      } finally {
        setIsChecking(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
    };
  }, [regNo, isOpen, step]);

  // Live 5-Minute Countdown Timer for OTP Expiry
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

  // Live 60-Second Cooldown Timer for Resend Button
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (loading || isChecking) return;

    if (!isRegValid) {
      setErrorMsg("Please enter your complete university registration number.");
      setErrorCode("EMPTY_REG");
      return;
    }

    if (deviceStatus?.exists === false) {
      setErrorMsg(`Registration number ${cleanReg} not found in university student records.`);
      setErrorCode("STUDENT_NOT_FOUND");
      return;
    }

    if (deviceStatus?.isBlocked) {
      if (deviceStatus.devices && deviceStatus.devices.length > 0) {
        setBlockedDevicesData(deviceStatus.devices);
      }
      setIsBlockedModalOpen(true);
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
      setAttemptsUsed(result.data?.attemptsUsedToday ?? 1);
      setRemainingDailyAttempts(result.data?.remainingDailyAttempts ?? 1);
      setTimerSeconds(result.data?.expiresInSeconds || 180);
      setTimerActive(true);
      setResendCooldown(result.data?.cooldownSeconds || 180); // 180s cooldown starts strictly upon confirmed success
      setStep(2);
    } else {
      setErrorMsg(result.error);
      setErrorCode(result.code);
      if (result.code === "OTP_COOLDOWN_ACTIVE") {
        const wait = result.details?.remainingSeconds || 180;
        setResendCooldown(wait);
      }
      if (result.code === "DAILY_LIMIT_EXCEEDED") {
        setAttemptsUsed(2);
        setRemainingDailyAttempts(0);
      }
      if (
        result.code === "DEVICE_LIMIT_REACHED" ||
        result.details?.code === "DEVICE_LIMIT_REACHED" ||
        result.code === "DEVICE_ALREADY_LOGGED_IN"
      ) {
        const devs = result.details?.activeDevices || result.details?.sessions || deviceStatus?.devices || [];
        setBlockedDevicesData(devs);
        setIsBlockedModalOpen(true);
      }
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
      if (
        result.code === "DEVICE_LIMIT_REACHED" ||
        result.details?.code === "DEVICE_LIMIT_REACHED" ||
        result.code === "DEVICE_ALREADY_LOGGED_IN"
      ) {
        const devs = result.details?.activeDevices || result.details?.sessions || [];
        setBlockedDevicesData(devs);
        setIsBlockedModalOpen(true);
      }
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || remainingDailyAttempts <= 0 || loading) return;
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
                    onChange={(e) => setRegNo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16))}
                    maxLength={16}
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

                {isRegValid && deviceStatus?.exists !== false && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
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
                    <span>
                      OTP will be sent to: <strong>{cleanReg.toLowerCase()}@centurionuniv.edu.in</strong>
                      {studentName && studentName !== "Student" ? ` (${studentName})` : ""}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Professional Institutional Security Alert */}
              {errorMsg && (
                <div
                  style={{
                    background:
                      errorCode === "DEVICE_LIMIT_REACHED" || errorCode === "DEVICE_ALREADY_LOGGED_IN" || errorCode === "MAX_DEVICES_ACTIVE" || errorCode === "ALREADY_LOGGED_IN_ANOTHER_DEVICE"
                        ? "#fef2f2"
                        : errorCode === "DAILY_LIMIT_EXCEEDED"
                        ? "#fffbeb"
                        : "#fef2f2",
                    border: `1px solid ${
                      errorCode === "DEVICE_LIMIT_REACHED" || errorCode === "DEVICE_ALREADY_LOGGED_IN" || errorCode === "MAX_DEVICES_ACTIVE" || errorCode === "ALREADY_LOGGED_IN_ANOTHER_DEVICE"
                        ? "#fee2e2"
                        : errorCode === "DAILY_LIMIT_EXCEEDED"
                        ? "#fef3c7"
                        : "#fee2e2"
                    }`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background:
                        errorCode === "DEVICE_LIMIT_REACHED" || errorCode === "DEVICE_ALREADY_LOGGED_IN" || errorCode === "MAX_DEVICES_ACTIVE" || errorCode === "ALREADY_LOGGED_IN_ANOTHER_DEVICE"
                          ? "#fee2e2"
                          : errorCode === "DAILY_LIMIT_EXCEEDED"
                          ? "#fef3c7"
                          : "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {errorCode === "DEVICE_LIMIT_REACHED" || errorCode === "DEVICE_ALREADY_LOGGED_IN" || errorCode === "MAX_DEVICES_ACTIVE" || errorCode === "ALREADY_LOGGED_IN_ANOTHER_DEVICE" ? (
                      <Smartphone size={15} color="#dc2626" />
                    ) : errorCode === "DAILY_LIMIT_EXCEEDED" ? (
                      <Clock size={15} color="#d97706" />
                    ) : (
                      <AlertCircle size={15} color="#dc2626" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color:
                            errorCode === "DEVICE_LIMIT_REACHED" || errorCode === "DEVICE_ALREADY_LOGGED_IN" || errorCode === "MAX_DEVICES_ACTIVE" || errorCode === "ALREADY_LOGGED_IN_ANOTHER_DEVICE"
                              ? "#991b1b"
                              : errorCode === "DAILY_LIMIT_EXCEEDED"
                              ? "#92400e"
                              : "#991b1b",
                          letterSpacing: "-0.2px",
                        }}
                      >
                        {errorCode === "DEVICE_LIMIT_REACHED" || errorCode === "DEVICE_ALREADY_LOGGED_IN"
                          ? "Device Limit Reached"
                          : errorCode === "DAILY_LIMIT_EXCEEDED"
                          ? "Daily Limit Exceeded"
                          : "Verification Notice"}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 99,
                          background:
                            errorCode === "DAILY_LIMIT_EXCEEDED" ? "#fde68a" : "#fecaca",
                          color:
                            errorCode === "DAILY_LIMIT_EXCEEDED" ? "#78350f" : "#7f1d1d",
                        }}
                      >
                        {errorCode === "DEVICE_LIMIT_REACHED" ? "1 Active Device" : errorCode === "DAILY_LIMIT_EXCEEDED" ? "Max 2 Attempts" : "Attention"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color:
                          errorCode === "DAILY_LIMIT_EXCEEDED" ? "#78350f" : "#7f1d1d",
                        lineHeight: 1.45,
                        margin: 0,
                        opacity: 0.92,
                      }}
                    >
                      {errorMsg}
                    </p>

                    {(errorCode === "DEVICE_LIMIT_REACHED" || errorCode === "DEVICE_ALREADY_LOGGED_IN" || errorCode === "MAX_DEVICES_ACTIVE") && (
                      <button
                        type="button"
                        onClick={() => setIsBlockedModalOpen(true)}
                        style={{
                          marginTop: "8px",
                          background: "#fee2e2",
                          border: "1px solid #fca5a5",
                          color: "#991b1b",
                          borderRadius: "8px",
                          padding: "5px 12px",
                          fontSize: "11.5px",
                          fontWeight: "800",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fecaca")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#fee2e2")}
                      >
                        <Smartphone size={13} color="#dc2626" />
                        <span>View Active Device Info</span>
                      </button>
                    )}
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
                    <strong>Daily OTP Limit:</strong>{" "}
                    {cleanReg === "230301120327"
                      ? "Developer bypass active (Unlimited)."
                      : attemptsUsed > 0
                      ? `${attemptsUsed}/2 attempts used today (${remainingDailyAttempts} remaining).`
                      : "Maximum 2 attempts per day (resets at midnight)."}
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
                disabled={loading || isChecking || !isRegValid || deviceStatus?.isBlocked || deviceStatus?.exists === false}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 10,
                  border: deviceStatus?.isBlocked
                    ? "1.5px solid #fca5a5"
                    : deviceStatus?.exists === false
                    ? "1.5px solid #fecaca"
                    : "none",
                  background: isChecking
                    ? "#f1f5f9"
                    : deviceStatus?.isBlocked
                    ? "#fee2e2"
                    : deviceStatus?.exists === false
                    ? "#fef2f2"
                    : deviceStatus?.isCurrentDevice
                    ? "#16a34a"
                    : loading || !isRegValid
                    ? "#cbd5e1"
                    : "#0f172a",
                  color: isChecking
                    ? "#475569"
                    : deviceStatus?.isBlocked || deviceStatus?.exists === false
                    ? "#991b1b"
                    : "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor:
                    loading || isChecking || !isRegValid || deviceStatus?.isBlocked || deviceStatus?.exists === false
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading && !isChecking && isRegValid && !deviceStatus?.isBlocked && deviceStatus?.exists !== false) {
                    e.currentTarget.style.background = deviceStatus?.isCurrentDevice ? "#15803d" : "#1e293b";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && !isChecking && isRegValid && !deviceStatus?.isBlocked && deviceStatus?.exists !== false) {
                    e.currentTarget.style.background = deviceStatus?.isCurrentDevice ? "#16a34a" : "#0f172a";
                  }
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Sending Code...</span>
                  </>
                ) : isChecking ? (
                  <>
                    <Loader2 size={15} className="spin" color="#2563eb" />
                    <span>Verifying Registration Number...</span>
                  </>
                ) : !isRegValid ? (
                  <>
                    <span>Enter Valid Registration No.</span>
                    <ArrowRight size={15} />
                  </>
                ) : deviceStatus?.exists === false ? (
                  <>
                    <AlertCircle size={15} color="#dc2626" />
                    <span>Student Record Not Found</span>
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
                  {cleanReg === "230301120327" || remainingDailyAttempts >= 90 ? (
                    <span>Access: <strong>Developer Access (Unlimited)</strong></span>
                  ) : (
                    <span>OTP Attempts: <strong>{attemptsUsed}/2 used today</strong> ({remainingDailyAttempts} remaining)</span>
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
                    border: "1px solid #fee2e2",
                    borderRadius: 12,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      background: "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <AlertCircle size={14} color="#dc2626" />
                  </div>
                  <span style={{ fontSize: 12, color: "#991b1b", fontWeight: 600, lineHeight: 1.4 }}>
                    {errorMsg}
                  </span>
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
                  disabled={resendCooldown > 0 || remainingDailyAttempts <= 0 || loading}
                  onClick={handleResendOtp}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendCooldown > 0 || remainingDailyAttempts <= 0 ? "#94a3b8" : "#2563eb",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: resendCooldown > 0 || remainingDailyAttempts <= 0 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: 0,
                  }}
                >
                  <RefreshCw size={12} className={loading ? "spin" : ""} />
                  <span>Resend Code {resendCooldown > 0 ? `(${resendCooldown}s)` : ""}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      {/* Blocked Login Device Information Modal */}
      <BlockedLoginDeviceModal
        isOpen={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
        activeDevices={blockedDevicesData}
        accountIdentifier={regNo}
        maxAllowed={regNo.trim().toUpperCase() === "230301120327" ? 2 : 1}
      />
    </AnimatePresence>
  );
}
