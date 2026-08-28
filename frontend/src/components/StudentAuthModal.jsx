import React, { useState, useEffect, useRef } from "react";
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
  KeyRound,
  Eye,
  EyeOff,
  Radio,
  Laptop,
  Tablet,
  AlertTriangle,
} from "lucide-react";
import BlockedLoginDeviceModal from "./BlockedLoginDeviceModal";

export default function StudentAuthModal({ isOpen, onClose }) {
  const {
    sendStudentOtp,
    verifyStudentOtp,
    studentLoginPassword,
    studentCreatePassword,
    checkApprovalStatus,
    cancelApprovalRequest,
    studentData,
    studentSession,
    hasActiveSession,
    pendingDestination,
    setPendingDestination,
    sessionRevokedNotice,
    setSessionRevokedNotice,
  } = useApp();
  const navigate = useNavigate();

  // Steps: "REGNO" | "PASSWORD" | "OTP" | "CREATE_PASSWORD" | "PASSWORD_SUCCESS" | "APPROVAL_PENDING"
  const [step, setStep] = useState("REGNO");
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpInputRefs = useRef([]);
  const [setupPasswordToken, setSetupPasswordToken] = useState("");

  // Sync otp string from digits
  useEffect(() => {
    setOtp(otpDigits.join(""));
  }, [otpDigits]);

  // When step becomes OTP, auto-focus first box
  useEffect(() => {
    if (step === "OTP") {
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split("");
      const newDigits = [...otpDigits];
      pasted.forEach((char, i) => {
        if (index + i < 6) {
          newDigits[index + i] = char;
        }
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(index + pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal[0];
    setOtpDigits(newDigits);

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newDigits = ["", "", "", "", "", ""];
      pastedData.split("").forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const focusIdx = Math.min(pastedData.length, 5);
      otpInputRefs.current[focusIdx]?.focus();
    }
  };

  // Approval Request States
  const [approvalRequestId, setApprovalRequestId] = useState("");
  const [approvalActiveDevice, setApprovalActiveDevice] = useState(null);
  const [approvalTimerSeconds, setApprovalTimerSeconds] = useState(180);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [statusNotice, setStatusNotice] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [remainingDailyAttempts, setRemainingDailyAttempts] = useState(2);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [timerActive, setTimerActive] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedDevicesData, setBlockedDevicesData] = useState([]);
  const cleanReg = regNo.trim().toUpperCase();
  const isRegValid = cleanReg.length >= 10 && cleanReg.length <= 16;

  // Protection against closing modal when password creation is mandatory
  const handleModalClose = () => {
    if (step === "CREATE_PASSWORD") {
      setErrorMsg("Password creation is mandatory to secure your account and cannot be skipped.");
      return;
    }
    onClose();
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        if (step === "CREATE_PASSWORD") {
          e.preventDefault();
          setErrorMsg("Password creation is mandatory to secure your account and cannot be skipped.");
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step, onClose]);

  // Live password validation calculations
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const strengthScore = [hasMinLength, (hasUpper && hasLower), hasNumber].filter(Boolean).length;

  const getStrengthMeta = () => {
    if (!password) return { label: "", color: "#cbd5e1", width: "0%" };
    if (password.length < 8) return { label: "Too short (min 8 chars)", color: "#ef4444", width: "25%" };
    if (strengthScore <= 1) return { label: "Weak", color: "#f97316", width: "45%" };
    if (strengthScore === 2) return { label: "Medium", color: "#eab308", width: "75%" };
    return { label: "Strong & Secure", color: "#10b981", width: "100%" };
  };

  const strengthMeta = getStrengthMeta();
  const isPasswordFormValid = hasMinLength && hasUpper && hasLower && hasNumber && isMatch;

  // Helper to route to intended destination after auth
  const navigateToDestination = (targetReg) => {
    onClose();
    const destReg = targetReg || cleanReg;
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
        navigate(`/timetable/${encodeStudentId(destReg)}`);
      } else if (dest.type === "attendance") {
        navigate(`/attendance/${encodeStudentId(destReg)}`);
      } else if (dest.type === "analytics") {
        const query = dest.tab ? `?tab=${encodeURIComponent(dest.tab)}` : "";
        navigate(`/analytics/${encodeStudentId(destReg)}${query}`);
      } else if (dest.type === "predictor") {
        navigate(`/analytics/${encodeStudentId(destReg)}?tab=predictor`);
      } else if (dest.type === "placement") {
        navigate(`/analytics/${encodeStudentId(destReg)}?tab=placement`);
      } else if (dest.type === "domains") {
        navigate(`/analytics/${encodeStudentId(destReg)}?tab=mastery`);
      } else if (dest.type === "gradesheet") {
        navigate(`/analytics/${encodeStudentId(destReg)}?tab=grades`);
      } else if (dest.type === "leaderboard") {
        navigate("/leaderboard");
      } else if (dest.path) {
        navigate(dest.path.replace(":id", encodeStudentId(destReg)));
      } else if (dest.type === "dashboard") {
        const query = dest.tab ? `?tab=${encodeURIComponent(dest.tab)}` : "";
        navigate(`/dashboard/${encodeStudentId(destReg)}${query}`);
      } else {
        navigate(`/dashboard/${encodeStudentId(destReg)}`);
      }
    } else {
      navigate(`/dashboard/${encodeStudentId(destReg)}`);
    }
  };


  // Clean state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setErrorCode("");
      setStatusNotice("");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      setSetupPasswordToken("");
      setApprovalRequestId("");
      setApprovalActiveDevice(null);
      setStep("REGNO");
      setTimerActive(false);
      setResendCooldown(0);
      setAttemptsUsed(0);
      setRemainingDailyAttempts(2);
      setDeviceStatus(null);
      setIsChecking(false);
      if (hasActiveSession && studentSession?.regNo) {
        setRegNo(studentSession.regNo);
      } else {
        setRegNo("");
        setMaskedEmail("");
        setStudentName("");
      }
    } else {
      setStep("REGNO");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      setSetupPasswordToken("");
      setApprovalRequestId("");
      setApprovalActiveDevice(null);
      setErrorMsg("");
      setErrorCode("");
      setStatusNotice("");
      setTimerActive(false);
      setResendCooldown(0);
      setAttemptsUsed(0);
      setRemainingDailyAttempts(2);
      setDeviceStatus(null);
      setIsChecking(false);
    }
  }, [isOpen]);

  // Live Pre-Check for active device limit & student existence
  useEffect(() => {
    const clean = regNo.trim().toUpperCase();
    if (!isOpen || step !== "REGNO") {
      return;
    }

    if (clean.length < 10) {
      setDeviceStatus(null);
      setIsChecking(false);
      setErrorMsg("");
      setErrorCode("");
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/auth/student/check-status?regNo=${encodeURIComponent(clean)}`, {
          withCredentials: true,
        });

        if (res.data?.success) {
          if (!res.data.exists) {
            setDeviceStatus({ exists: false, isBlocked: false });
            setErrorMsg(`Registration number ${clean} not found in university student records.`);
            setErrorCode("STUDENT_NOT_FOUND");
          } else if (res.data.isBlocked) {
            const devices = res.data.sessions || [];
            setDeviceStatus({
              exists: true,
              isBlocked: true,
              message: res.data.blockMessage,
              devices,
              hasPassword: res.data.hasPassword,
            });
            setBlockedDevicesData(devices);
            setErrorMsg(res.data.blockMessage);
            setErrorCode(res.data.blockReason || "DEVICE_LIMIT_REACHED");
          } else if (res.data.isCurrentDevice && res.data.hasPassword) {
            setDeviceStatus({
              exists: true,
              isCurrentDevice: true,
              isBlocked: false,
              hasPassword: res.data.hasPassword,
              studentName: res.data.studentName,
            });
            if (res.data.studentName) {
              setStudentName(res.data.studentName);
            }
            setErrorMsg("");
            setErrorCode("");
          } else {
            setDeviceStatus({
              exists: true,
              isBlocked: false,
              isCurrentDevice: false,
              studentName: res.data.studentName,
              hasPassword: res.data.hasPassword,
              failedPasswordAttempts: res.data.failedPasswordAttempts,
              otpFallbackAllowed: res.data.otpFallbackAllowed,
            });
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
            setErrorMsg("");
            setErrorCode("");
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

    return () => clearTimeout(timer);
  }, [regNo, isOpen, step]);

  // Live OTP Countdown Timer
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

  // Live Cooldown Timer for Resend
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Device Approval Polling & Countdown (Prompt Sections 11-13)
  useEffect(() => {
    let pollInterval = null;
    let timerInterval = null;

    if (step === "APPROVAL_PENDING" && approvalRequestId) {
      // 1. Countdown timer
      timerInterval = setInterval(() => {
        setApprovalTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            setErrorMsg("Approval request timed out. Please try logging in again.");
            setErrorCode("APPROVAL_EXPIRED");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const pollStatus = async () => {
        const res = await checkApprovalStatus(approvalRequestId);
        if (res?.status === "APPROVED" && res?.success) {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          navigateToDestination(cleanReg);
        } else if (res?.status === "DENIED") {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setErrorMsg("Login request was denied from your active device.");
          setErrorCode("APPROVAL_DENIED");
        } else if (res?.status === "EXPIRED") {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setErrorMsg("Approval request timed out. Please try logging in again.");
          setErrorCode("APPROVAL_EXPIRED");
        }
      };

      // 2. High-speed poll every 1.5s
      pollInterval = setInterval(pollStatus, 1500);

      // 3. Immediate poll on tab resume / visibility change
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          pollStatus();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(pollInterval);
        clearInterval(timerInterval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [step, approvalRequestId]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Step 1: Submit Registration Number (Dispatches to Password Login or OTP)
  const handleRegSubmit = async (e) => {
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

    if (deviceStatus?.isCurrentDevice && deviceStatus?.hasPassword) {
      navigateToDestination(cleanReg);
      return;
    }

    setErrorMsg("");
    setErrorCode("");

    // If account has password -> Go to Password Screen
    if (deviceStatus?.hasPassword) {
      setStep("PASSWORD");
      return;
    }

    // If new student (no password) -> Trigger OTP Send
    await triggerSendOtp();
  };

  const triggerSendOtp = async () => {
    setLoading(true);
    setErrorMsg("");
    setErrorCode("");

    const result = await sendStudentOtp(cleanReg);
    setLoading(false);

    if (result.success) {
      if (result.data?.alreadyLoggedIn && deviceStatus?.hasPassword) {
        navigateToDestination(cleanReg);
        return;
      }
      setMaskedEmail(result.data?.maskedEmail || `${cleanReg.toLowerCase()}@centurionuniv.edu.in`);
      setStudentName(result.data?.studentName || "Student");
      setAttemptsUsed(result.data?.attemptsUsedToday ?? 1);
      setRemainingDailyAttempts(result.data?.remainingDailyAttempts ?? 1);
      setTimerSeconds(result.data?.expiresInSeconds || 180);
      setTimerActive(true);
      setResendCooldown(result.data?.cooldownSeconds || 180);
      setStep("OTP");
    } else {
      setErrorMsg(result.error);
      setErrorCode(result.code);
      if (result.code === "OTP_COOLDOWN_ACTIVE") {
        setResendCooldown(result.details?.remainingSeconds || 180);
      }
      if (result.code === "BLOCKED_DEVICE_ACTIVE" || result.code === "DEVICE_LIMIT_REACHED") {
        const devs = result.details?.activeDevices || result.details?.sessions || deviceStatus?.devices || [];
        setBlockedDevicesData(devs);
        setIsBlockedModalOpen(true);
      }
    }
  };

  // Step 2: Submit Password (Handles direct login OR triggers Device Approval)
  const handlePasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setErrorCode("");

    const result = await studentLoginPassword(cleanReg, password);
    setLoading(false);

    if (result.step === "APPROVAL_PENDING") {
      // Normal student on 2nd device: Device Approval Request Triggered! (Section 11-13)
      setApprovalRequestId(result.requestId);
      setApprovalActiveDevice(result.activeDevice);
      setApprovalTimerSeconds(result.expiresInSeconds || 180);
      setStep("APPROVAL_PENDING");
      return;
    }

    if (result.success) {
      navigateToDestination(cleanReg);
    } else {
      setErrorMsg(result.error);
      setErrorCode(result.code);

      if (result.code === "BLOCKED_DEVICE_ACTIVE" || result.code === "DEVICE_LIMIT_REACHED") {
        const devs = result.details?.activeDevices || result.details?.sessions || [];
        setBlockedDevicesData(devs);
        setIsBlockedModalOpen(true);
      }
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setErrorCode("");

    const result = await verifyStudentOtp(cleanReg, cleanOtp);
    setLoading(false);

    if (result.success) {
      if (result.step === "CREATE_PASSWORD") {
        setSetupPasswordToken(result.setupPasswordToken);
        setStep("CREATE_PASSWORD");
        setStatusNotice("OTP verified successfully. Please create a strong password to secure your account.");
      } else {
        navigateToDestination(cleanReg);
      }
    } else {
      setErrorMsg(result.error);
      setErrorCode(result.code);
    }
  };

  // Step 4: Mandatory Create Password -> Transitions to Animated Password Success Screen
  const handleCreatePasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!password || password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setErrorCode("");

    const result = await studentCreatePassword(cleanReg, password, setupPasswordToken);
    setLoading(false);

    if (result.success) {
      setStep("PASSWORD_SUCCESS");
    } else {
      setErrorMsg(result.error);
      setErrorCode(result.code);
    }
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
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleModalClose();
          }
        }}
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
            maxWidth: "min(440px, 100%)",
            width: "100%",
            maxHeight: "min(92vh, 700px)",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            position: "relative",
            boxSizing: "border-box",
            padding: "clamp(18px, 4vw, 26px) clamp(16px, 4vw, 24px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button / Mandatory Tag */}
          {step !== "CREATE_PASSWORD" && step !== "PASSWORD_SUCCESS" ? (
            <button
              onClick={handleModalClose}
              aria-label="Close modal"
              style={{
                position: "absolute",
                top: 14,
                right: 14,
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
            >
              <X size={15} />
            </button>
          ) : step === "CREATE_PASSWORD" ? (
            <div
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: 999,
                padding: "3px 9px",
                fontSize: 10.5,
                fontWeight: 800,
                color: "#92400e",
              }}
            >
              <Lock size={11} />
              <span>Mandatory Step</span>
            </div>
          ) : null}

          {/* Modern Step Progress Indicator */}
          {step !== "PASSWORD_SUCCESS" && step !== "APPROVAL_PENDING" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "clamp(4px, 1.2vw, 6px)", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "clamp(10px, 2.5vw, 11px)", fontWeight: 800, color: step === "REGNO" ? "#2563eb" : "#16a34a" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: step === "REGNO" ? "#2563eb" : "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, flexShrink: 0 }}>
                  {step === "REGNO" ? "1" : "✓"}
                </div>
                <span>Identifier</span>
              </div>

              <div style={{ width: "clamp(10px, 2vw, 16px)", height: 2, background: step === "REGNO" ? "#e2e8f0" : "#16a34a", borderRadius: 1 }} />

              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "clamp(10px, 2.5vw, 11px)", fontWeight: 800, color: (step === "OTP" || step === "PASSWORD") ? "#2563eb" : (step === "CREATE_PASSWORD") ? "#16a34a" : "#94a3b8" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: (step === "OTP" || step === "PASSWORD") ? "#2563eb" : (step === "CREATE_PASSWORD") ? "#16a34a" : "#e2e8f0", color: (step === "OTP" || step === "PASSWORD" || step === "CREATE_PASSWORD") ? "#fff" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, flexShrink: 0 }}>
                  {step === "CREATE_PASSWORD" ? "✓" : "2"}
                </div>
                <span>{step === "PASSWORD" ? "Password" : "OTP Code"}</span>
              </div>

              {(!deviceStatus?.hasPassword || step === "CREATE_PASSWORD") && (
                <>
                  <div style={{ width: "clamp(10px, 2vw, 16px)", height: 2, background: (step === "CREATE_PASSWORD") ? "#2563eb" : "#e2e8f0", borderRadius: 1 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "clamp(10px, 2.5vw, 11px)", fontWeight: 800, color: step === "CREATE_PASSWORD" ? "#2563eb" : "#94a3b8" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: step === "CREATE_PASSWORD" ? "#2563eb" : "#e2e8f0", color: step === "CREATE_PASSWORD" ? "#fff" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, flexShrink: 0 }}>
                      3
                    </div>
                    <span>Password</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Modal Header */}
          {step !== "PASSWORD_SUCCESS" && step !== "APPROVAL_PENDING" && (
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#eff6ff",
                  border: "1px solid #dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px auto",
                }}
              >
                {step === "CREATE_PASSWORD" ? (
                  <KeyRound size={22} color="#2563eb" />
                ) : step === "PASSWORD" ? (
                  <Lock size={22} color="#2563eb" />
                ) : step === "OTP" ? (
                  <Mail size={22} color="#2563eb" />
                ) : (
                  <GraduationCap size={22} color="#2563eb" />
                )}
              </div>

              <h3
                style={{
                  fontSize: "clamp(16px, 4vw, 18px)",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 4px 0",
                  letterSpacing: "-0.3px",
                }}
              >
                {step === "CREATE_PASSWORD"
                  ? "Create Account Password"
                  : step === "PASSWORD"
                  ? "Student Password Login"
                  : step === "OTP"
                  ? "Email Verification"
                  : "Student Portal Login"}
              </h3>
              <p
                style={{
                  fontSize: "clamp(12px, 3vw, 13px)",
                  color: "#64748b",
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                {step === "CREATE_PASSWORD"
                  ? `Set a mandatory password to secure your account (${cleanReg})`
                  : step === "PASSWORD"
                  ? `Enter your account password for ${cleanReg}`
                  : step === "OTP"
                  ? `Enter the 6-digit verification code sent to your email`
                  : "Enter your official university registration number"}
              </p>
            </div>
          )}

          {/* Alert / Notice Display */}
          {statusNotice && step !== "PASSWORD_SUCCESS" && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 14,
                fontSize: 12,
                color: "#166534",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={14} color="#16a34a" />
              <span>{statusNotice}</span>
            </div>
          )}

          {errorMsg && step !== "PASSWORD_SUCCESS" && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 14,
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {errorCode === "BLOCKED_DEVICE_ACTIVE" || errorCode === "DEVICE_LIMIT_REACHED" ? (
                  <Smartphone size={15} color="#dc2626" />
                ) : (
                  <AlertCircle size={15} color="#dc2626" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12.5, color: "#991b1b", fontWeight: 700, display: "block", marginBottom: 2 }}>
                  {errorCode === "BLOCKED_DEVICE_ACTIVE"
                    ? "Device Slot Occupied"
                    : errorCode === "DEVICE_LIMIT_REACHED"
                    ? "Device Limit Reached"
                    : errorCode === "APPROVAL_DENIED"
                    ? "Login Request Denied"
                    : errorCode === "APPROVAL_EXPIRED"
                    ? "Approval Timed Out"
                    : "Authentication Notice"}
                </span>
                <p style={{ fontSize: 12, color: "#7f1d1d", lineHeight: 1.4, margin: 0 }}>
                  {errorMsg}
                </p>

                {(errorCode === "BLOCKED_DEVICE_ACTIVE" || errorCode === "DEVICE_LIMIT_REACHED") && (
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
                    }}
                  >
                    <Smartphone size={13} color="#dc2626" />
                    <span>View Active Device Info</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: Registration Number */}
          {step === "REGNO" && (
            <form onSubmit={handleRegSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                  }}
                />

                {isRegValid && deviceStatus?.exists !== false && (
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
                    <ShieldCheck size={13} color="#2563eb" />
                    <span>
                      {deviceStatus?.hasPassword
                        ? "Account password security active"
                        : "New account — First-time verification will create a password"}
                      {studentName && studentName !== "Student" ? ` (${studentName})` : ""}
                    </span>
                  </div>
                )}
              </div>

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
                    <strong>{cleanReg === "230301120327" ? "Multi-Device Policy:" : "Single-Device Policy:"}</strong>{" "}
                    {cleanReg === "230301120327" ? "Max 2 devices allowed." : "1 active logged-in device allowed."}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#475569" }}>
                  <Lock size={13} color="#2563eb" />
                  <span><strong>Device Approvals:</strong> In-website device transfer approval supported.</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isChecking || !isRegValid || deviceStatus?.isBlocked || deviceStatus?.exists === false}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: loading || !isRegValid || deviceStatus?.isBlocked || deviceStatus?.exists === false ? "#cbd5e1" : "#0f172a",
                  color: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: loading || !isRegValid || deviceStatus?.isBlocked || deviceStatus?.exists === false ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Processing...</span>
                  </>
                ) : isChecking ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Password Input */}
          {step === "PASSWORD" && (
            <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                  Account Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    autoFocus
                    required
                    style={{
                      width: "100%",
                      padding: "11px 42px 11px 14px",
                      fontSize: 14,
                      color: "#0f172a",
                      background: "#f8fafc",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: 10,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* OTP Fallback Button */}
              {deviceStatus?.otpFallbackAllowed && (
                <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 10, padding: "10px 12px" }}>
                  <span style={{ fontSize: 12, color: "#1e40af", fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Forgot password or locked out?
                  </span>
                  <button
                    type="button"
                    onClick={triggerSendOtp}
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Mail size={12} />
                    <span>Send Verification Code to Email</span>
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: loading || !password ? "#cbd5e1" : "#0f172a",
                  color: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: loading || !password ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("REGNO");
                  setPassword("");
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
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <ChevronLeft size={14} />
                <span>Change Registration Number</span>
              </button>
            </form>
          )}

          {/* STEP 2B: APPROVAL PENDING SCREEN */}
          {step === "APPROVAL_PENDING" && (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#eff6ff",
                  border: "2px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                <Radio size={26} color="#2563eb" className="pulse" />
              </div>

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                  Approval Required
                </h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: 0 }}>
                  You are currently logged in on another device. We sent an in-app approval request to your active session.
                </p>
              </div>

              {approvalActiveDevice && (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "14px",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Active Device:</span>
                    <strong style={{ color: "#0f172a" }}>
                      {approvalActiveDevice.deviceType} ({approvalActiveDevice.platform || approvalActiveDevice.os})
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Browser:</span>
                    <span style={{ color: "#334155" }}>{approvalActiveDevice.browser}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Expires In:</span>
                    <strong style={{ color: approvalTimerSeconds < 30 ? "#dc2626" : "#2563eb", fontFamily: "'Space Mono', monospace" }}>
                      {formatTimer(approvalTimerSeconds)}
                    </strong>
                  </div>
                </div>
              )}

              {errorCode === "APPROVAL_DENIED" ? (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 12,
                    padding: "12px",
                    fontSize: 12.5,
                    color: "#991b1b",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textAlign: "left",
                  }}
                >
                  <XCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>Your login request was denied by the active device.</span>
                </div>
              ) : errorCode === "APPROVAL_EXPIRED" ? (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 12,
                    padding: "12px",
                    fontSize: 12.5,
                    color: "#92400e",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textAlign: "left",
                  }}
                >
                  <Clock size={18} color="#d97706" style={{ flexShrink: 0 }} />
                  <span>Approval request timed out. Please try logging in again.</span>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 12,
                      padding: "10px 12px",
                      fontSize: 12,
                      color: "#166534",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                    <span>Open GradeFlow on your active device and tap <strong>Allow This Device</strong> in the notification bell.</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#64748b", fontSize: 12 }}>
                    <Loader2 size={14} className="spin" />
                    <span>Waiting for response from active device...</span>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  if (errorCode !== "APPROVAL_DENIED" && errorCode !== "APPROVAL_EXPIRED") {
                    cancelApprovalRequest(approvalRequestId);
                  }
                  setStep("PASSWORD");
                  setErrorMsg("");
                  setErrorCode("");
                }}
                style={{
                  background: errorCode ? "#2563eb" : "none",
                  border: errorCode ? "none" : "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "9px 16px",
                  color: errorCode ? "#ffffff" : "#475569",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {errorCode ? "Try Again" : "Cancel Request"}
              </button>
            </div>
          )}

          {/* STEP 3: OTP Verification */}
          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Clean verification email notification card */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1.5px solid #bbf7d0",
                  borderRadius: 14,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#dcfce7",
                    border: "1px solid #86efac",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Mail size={18} color="#16a34a" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, color: "#166534", fontWeight: 700 }}>
                    Verification code dispatched to:
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#15803d", fontFamily: "'Space Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {maskedEmail}
                  </div>
                </div>
              </div>

              {/* 6-Digit Individual Split Input Boxes (Fully Responsive Grid) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Enter 6-Digit Code
                  </label>
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: timerSeconds < 30 ? "#dc2626" : "#059669",
                      background: timerSeconds < 30 ? "#fef2f2" : "#f0fdf4",
                      border: `1px solid ${timerSeconds < 30 ? "#fecaca" : "#bbf7d0"}`,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontFamily: "'Space Mono', monospace",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Clock size={11} />
                    <span>{timerActive ? formatTimer(timerSeconds) : "Expired"}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: "clamp(4px, 1.5vw, 8px)",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  onPaste={handleOtpPaste}
                >
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={otpDigits[index]}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(index, e)}
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1.15",
                        maxHeight: 54,
                        fontSize: "clamp(18px, 4.8vw, 22px)",
                        fontWeight: "900",
                        textAlign: "center",
                        fontFamily: "'Space Mono', monospace",
                        color: "#0f172a",
                        background: otpDigits[index] ? "#ffffff" : "#f8fafc",
                        border: "1.5px solid",
                        borderColor: otpDigits[index] ? "#2563eb" : "#cbd5e1",
                        borderRadius: "10px",
                        outline: "none",
                        boxSizing: "border-box",
                        boxShadow: otpDigits[index] ? "0 2px 8px rgba(37, 99, 235, 0.15)" : "none",
                        transition: "all 0.15s ease",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#2563eb";
                        e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.15)";
                        e.target.style.background = "#ffffff";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = otpDigits[index] ? "#2563eb" : "#cbd5e1";
                        e.target.style.boxShadow = otpDigits[index] ? "0 2px 8px rgba(37, 99, 235, 0.15)" : "none";
                        e.target.style.background = otpDigits[index] ? "#ffffff" : "#f8fafc";
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Code CTA Button */}
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: loading || otp.length < 6 ? "#cbd5e1" : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: loading || otp.length < 6 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: otp.length < 6 ? "none" : "0 4px 14px rgba(22, 163, 74, 0.25)",
                  transition: "all 0.2s ease",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    setStep("REGNO");
                    setOtp("");
                    setOtpDigits(["", "", "", "", "", ""]);
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
                  onClick={triggerSendOtp}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendCooldown > 0 || remainingDailyAttempts <= 0 ? "#94a3b8" : "#2563eb",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: resendCooldown > 0 || remainingDailyAttempts <= 0 ? "not-allowed" : "pointer",
                    display: "inline-flex",
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

          {/* STEP 4: MANDATORY CREATE PASSWORD WITH REAL-TIME STRENGTH & CRITERIA CHECKLIST */}
          {step === "CREATE_PASSWORD" && (
            <form onSubmit={handleCreatePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* New Password Input */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Create Account Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new secure password"
                    autoFocus
                    required
                    style={{
                      width: "100%",
                      padding: "11px 42px 11px 14px",
                      fontSize: 14,
                      color: "#0f172a",
                      background: "#f8fafc",
                      border: "1.5px solid",
                      borderColor: password ? (isPasswordFormValid ? "#10b981" : "#cbd5e1") : "#cbd5e1",
                      borderRadius: 10,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    style={{
                      width: "100%",
                      padding: "11px 42px 11px 14px",
                      fontSize: 14,
                      color: "#0f172a",
                      background: "#f8fafc",
                      border: "1.5px solid",
                      borderColor: confirmPassword ? (isMatch ? "#10b981" : "#ef4444") : "#cbd5e1",
                      borderRadius: 10,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Strength & Real-Time Validation Checklist */}
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Security Strength
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: strengthMeta.color }}>
                    {strengthMeta.label}
                  </span>
                </div>

                {/* Segmented Strength Bar */}
                <div style={{ width: "100%", height: 5, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
                  <div
                    style={{
                      width: strengthMeta.width,
                      height: "100%",
                      background: strengthMeta.color,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      borderRadius: 999,
                    }}
                  />
                </div>

                {/* Validation Checklist Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "6px 8px", marginTop: 4, fontSize: "clamp(10.5px, 2.5vw, 11.5px)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: hasMinLength ? "#16a34a" : "#94a3b8", fontWeight: hasMinLength ? 700 : 500 }}>
                    {hasMinLength ? (
                      <CheckCircle2 size={13} color="#16a34a" />
                    ) : (
                      <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid #cbd5e1", flexShrink: 0 }} />
                    )}
                    <span>8+ Characters</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: hasUpper ? "#16a34a" : "#94a3b8", fontWeight: hasUpper ? 700 : 500 }}>
                    {hasUpper ? (
                      <CheckCircle2 size={13} color="#16a34a" />
                    ) : (
                      <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid #cbd5e1", flexShrink: 0 }} />
                    )}
                    <span>Uppercase (A-Z)</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: hasLower ? "#16a34a" : "#94a3b8", fontWeight: hasLower ? 700 : 500 }}>
                    {hasLower ? (
                      <CheckCircle2 size={13} color="#16a34a" />
                    ) : (
                      <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid #cbd5e1", flexShrink: 0 }} />
                    )}
                    <span>Lowercase (a-z)</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: hasNumber ? "#16a34a" : "#94a3b8", fontWeight: hasNumber ? 700 : 500 }}>
                    {hasNumber ? (
                      <CheckCircle2 size={13} color="#16a34a" />
                    ) : (
                      <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid #cbd5e1", flexShrink: 0 }} />
                    )}
                    <span>Number (0-9)</span>
                  </div>

                  <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 6, color: isMatch ? "#16a34a" : "#94a3b8", fontWeight: isMatch ? 700 : 500 }}>
                    {isMatch ? (
                      <CheckCircle2 size={13} color="#16a34a" />
                    ) : (
                      <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid #cbd5e1", flexShrink: 0 }} />
                    )}
                    <span>Passwords Match</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordFormValid}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: loading || !isPasswordFormValid ? "#cbd5e1" : "#0f172a",
                  color: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: loading || !isPasswordFormValid ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: !isPasswordFormValid ? "none" : "0 4px 12px rgba(15, 23, 42, 0.15)",
                  transition: "all 0.2s ease",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Securing Account...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={15} />
                    <span>Create Password & Sign In</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 5: PASSWORD CREATION SUCCESS SCREEN */}
          {step === "PASSWORD_SUCCESS" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#dcfce7",
                  border: "2px solid #86efac",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                <CheckCircle2 size={36} color="#16a34a" />
              </div>

              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: "0 0 6px 0" }}>
                  Password Created Successfully
                </h3>
                <p style={{ fontSize: 13.5, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                  Your password has been created and bound to your university account ({cleanReg}).
                </p>
              </div>

              <div
                style={{
                  background: "#fef3c7",
                  border: "1.5px solid #fde68a",
                  borderRadius: 14,
                  padding: "14px 16px",
                  textAlign: "left",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ fontSize: 13, color: "#92400e", display: "block", marginBottom: 2 }}>
                    SECURITY WARNING
                  </strong>
                  <span style={{ fontSize: 12, color: "#78350f", lineHeight: 1.4 }}>
                    Do not share your password with anyone. Your password is private and protects your academic and attendance records.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateToDestination(cleanReg)}
                style={{
                  width: "100%",
                  padding: "12px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span>Continue to Grade Flow</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Blocked Login Device Modal */}
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
