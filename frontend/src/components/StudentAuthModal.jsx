import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp, API_BASE } from "../context/AppContext";
import axios from "axios";
import { encodeStudentId } from "../utils/studentIdEncoder";
import { createAblyRealtime, createApprovalAblyRealtime } from "../services/ablyClient";
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
  XCircle,
  Check,
  ShieldAlert,
  Shield,
  ArrowRightLeft,
} from "lucide-react";
import BlockedLoginDeviceModal from "./BlockedLoginDeviceModal";

export default function StudentAuthModal({ isOpen, onClose }) {
  const {
    sendStudentOtp,
    sendHandoverOtp,
    studentSendRecoveryOtp,
    verifyStudentOtp,
    studentLoginPassword,
    studentCreatePassword,
    studentTransferSession,
    studentCompleteApproval,
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

  // Steps: "REGNO" | "PASSWORD" | "RECOVERY_PROMPT" | "OTP" | "CREATE_PASSWORD" | "PASSWORD_SUCCESS" | "APPROVAL_PENDING"
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
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [isOneTimeRecoveryOtp, setIsOneTimeRecoveryOtp] = useState(false);
  const [failedPasswordAttemptsCount, setFailedPasswordAttemptsCount] = useState(0);

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
  const [approvalExchangeSecret, setApprovalExchangeSecret] = useState("");
  const [approvalActiveDevice, setApprovalActiveDevice] = useState(null);
  const [approvalTimerSeconds, setApprovalTimerSeconds] = useState(180);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [statusNotice, setStatusNotice] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [unlockTime, setUnlockTime] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [remainingDailyAttempts, setRemainingDailyAttempts] = useState(3);
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
      setAccountEmail("");
      setUnlockTime(null);
      setDeviceStatus(null);
      setIsChecking(false);
      if (hasActiveSession && studentSession?.regNo) {
        setRegNo(studentSession.regNo);
      } else {
        setRegNo("");
        setMaskedEmail("");
        setAccountEmail("");
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
      setAccountEmail("");
      setUnlockTime(null);
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
        const studentHeaders = {};
        try {
          const hint = localStorage.getItem("gf_student_session_hint");
          if (hint) studentHeaders["x-student-last-session"] = hint;
        } catch (_) {}
        const res = await axios.get(`${API_BASE}/auth/student/check-status?regNo=${encodeURIComponent(clean)}`, {
          withCredentials: true,
          headers: studentHeaders,
        });

        if (res.data?.success) {
          if (!res.data.exists) {
            setDeviceStatus({ exists: false, isBlocked: false });
            setErrorMsg(`Registration number ${clean} not found in university student records.`);
            setErrorCode("STUDENT_NOT_FOUND");
          } else if (res.data.step === "OTP" || res.data.pendingRecoveryOtpActive) {
            setDeviceStatus({
              ...res.data,
              exists: true,
              isBlocked: false,
              step: "OTP",
              pendingRecoveryOtpActive: true,
            });
            if (res.data.studentName) {
              setStudentName(res.data.studentName);
            }
            setErrorMsg("");
            setErrorCode("");
          } else if (res.data.step === "RECOVERY_PROMPT" || res.data.pendingRecoveryPrompt) {
            setDeviceStatus({
              ...res.data,
              exists: true,
              isBlocked: false,
              step: "RECOVERY_PROMPT",
              pendingRecoveryPrompt: true,
            });
            if (res.data.studentName) {
              setStudentName(res.data.studentName);
            }
            setErrorMsg("");
            setErrorCode("");
          } else if (res.data.isBlocked) {
            const isLockout = res.data.code === "ACCOUNT_TEMPORARILY_LOCKED" || res.data.blockReason === "ACCOUNT_TEMPORARILY_LOCKED";
            const devices = res.data.sessions || [];
            setDeviceStatus({
              exists: true,
              isBlocked: true,
              message: res.data.blockMessage,
              devices,
              hasPassword: res.data.hasPassword,
              code: res.data.code,
              blockReason: res.data.blockReason,
              unlockAt: res.data.unlockAt,
            });
            if (!isLockout) {
              setBlockedDevicesData(devices);
            }
            if (res.data.unlockAt) {
              setUnlockTime(res.data.unlockAt);
            }
            setErrorMsg(res.data.blockMessage);
            setErrorCode(res.data.blockReason || res.data.code || "DEVICE_LIMIT_REACHED");
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
            if (res.data.unlockAt) {
              setUnlockTime(res.data.unlockAt);
            }
            if (res.data.isCooldownActive && res.data.cooldownRemainingSeconds) {
              setResendCooldown(res.data.cooldownRemainingSeconds + 2);
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
      if (isOneTimeRecoveryOtp && step === "OTP") {
        setErrorMsg("The 5-minute recovery verification code has expired. Your account is temporarily locked for 24 hours.");
        setErrorCode("ACCOUNT_TEMPORARILY_LOCKED");
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds, isOneTimeRecoveryOtp, step]);

  // Live Cooldown Timer for Resend & Request Throttling
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setErrorMsg((curr) => (curr && curr.includes("before requesting another") ? "" : curr));
            setErrorCode((curr) => (curr === "OTP_COOLDOWN_ACTIVE" ? "" : curr));
            return 0;
          }
          const nextVal = prev - 1;
          setErrorMsg((curr) => {
            if (curr && curr.includes("before requesting another")) {
              return `Please wait ${nextVal} seconds before requesting another verification code.`;
            }
            return curr;
          });
          return nextVal;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Device Approval Realtime Listener & Countdown (0 Polling, Instant <0.1s Handover via Ably)
  useEffect(() => {
    let timerInterval = null;
    let ably = null;
    let approvalChannel = null;

    if (step === "APPROVAL_PENDING" && approvalRequestId) {
      // 1. Countdown timer (purely in-memory, 0 network calls)
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

      const handleApprovalComplete = async () => {
        clearInterval(timerInterval);
        setStatusNotice("Approval granted! Setting up your session...");
        let res = null;
        if (approvalExchangeSecret) {
          res = await studentCompleteApproval(approvalRequestId, approvalExchangeSecret);
        } else {
          res = await checkApprovalStatus(approvalRequestId);
        }
        if (res?.success) {
          setTimeout(() => {
            navigateToDestination(cleanReg);
          }, 350);
        } else {
          setErrorMsg(res?.error || res?.message || "Failed to finalize session.");
        }
      };

      // 2. Connect to Ably Realtime using scoped approval token request (Zero Polling)
      try {
        ably = createApprovalAblyRealtime(approvalRequestId);
        approvalChannel = ably.channels.get(`approval-${approvalRequestId}`);

        approvalChannel.subscribe("approval-status", (msg) => {
          const data = msg?.data;
          if (!data) return;

          if (data.status === "APPROVED") {
            handleApprovalComplete();
          } else if (data.status === "DENIED") {
            clearInterval(timerInterval);
            setErrorMsg("Login request was denied from your active device.");
            setErrorCode("APPROVAL_DENIED");
          } else if (data.status === "EXPIRED") {
            clearInterval(timerInterval);
            setErrorMsg("Approval request timed out. Please try logging in again.");
            setErrorCode("APPROVAL_EXPIRED");
          }
        });
      } catch (err) {
        console.warn("[Ably] Approval channel subscription warning:", err?.message || err);
      }

      // Ensure Ably socket stays connected on visibility change without HTTP polling
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          try {
            if (ably && ably.connection.state !== "connected") {
              ably.connection.connect();
            }
          } catch {}
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(timerInterval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        try {
          if (approvalChannel) approvalChannel.unsubscribe();
          if (ably) {
            const p = ably.close();
            if (p && typeof p.catch === "function") p.catch(() => {});
          }
        } catch {}
      };
    }

    return () => {
      clearInterval(timerInterval);
      try {
        if (approvalChannel) approvalChannel.unsubscribe();
        if (ably) {
          const p = ably.close();
          if (p && typeof p.catch === "function") p.catch(() => {});
        }
      } catch {}
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
    if (loading) return;

    if (!isRegValid) {
      setErrorMsg("Please enter your complete university registration number.");
      setErrorCode("EMPTY_REG");
      return;
    }

    let status = deviceStatus;

    // If debounced status check is still in-flight or not ready, fetch immediately
    if (!status || status.regNo !== cleanReg) {
      setLoading(true);
      try {
        const studentHeaders = {};
        try {
          const hint = localStorage.getItem("gf_student_session_hint");
          if (hint) studentHeaders["x-student-last-session"] = hint;
        } catch (_) {}
        const res = await axios.get(`${API_BASE}/auth/student/check-status?regNo=${encodeURIComponent(cleanReg)}`, {
          withCredentials: true,
          headers: studentHeaders,
        });
        if (res.data?.success) {
          status = {
            ...res.data,
            regNo: cleanReg,
            devices: res.data.sessions || [],
          };
          setDeviceStatus(status);
          if (res.data.studentName) setStudentName(res.data.studentName);
          if (res.data.attemptsUsedToday !== undefined) setAttemptsUsed(res.data.attemptsUsedToday);
          if (res.data.remainingDailyAttempts !== undefined) setRemainingDailyAttempts(res.data.remainingDailyAttempts);
          if (res.data.unlockAt) setUnlockTime(res.data.unlockAt);
          if (res.data.isCooldownActive && res.data.cooldownRemainingSeconds) setResendCooldown(res.data.cooldownRemainingSeconds + 2);
        } else {
          setErrorMsg(res.data?.message || "Unable to verify registration number.");
          setLoading(false);
          return;
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || "Server connection error. Please try again.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (status?.exists === false) {
      setErrorMsg(`Registration number ${cleanReg} not found in university student records.`);
      setErrorCode("STUDENT_NOT_FOUND");
      return;
    }

    // ── ANTI-BYPASS: If Recovery OTP is currently active (within 5-min window) ──
    if (status?.step === "OTP" || status?.pendingRecoveryOtpActive) {
      const authoritativeEmail = status.email || (cleanReg ? `${cleanReg.toLowerCase()}@centurionuniv.edu.in` : "");
      setAccountEmail(authoritativeEmail);
      setMaskedEmail(status.maskedEmail || authoritativeEmail);
      if (status.studentName) setStudentName(status.studentName);
      setTimerSeconds(status.expiresInSeconds || 300);
      setTimerActive(true);
      setResendCooldown(status.expiresInSeconds || 300);
      setIsForgotPasswordMode(true);
      setIsOneTimeRecoveryOtp(true);
      setStatusNotice("A one-time verification code is active for password reset (5-minute validity). Resend is disabled.");
      setErrorMsg("");
      setErrorCode("");
      setStep("OTP");
      return;
    }

    // ── ANTI-BYPASS: If 3 failed attempts reached (OTP not yet dispatched) ──
    if (status?.step === "RECOVERY_PROMPT" || status?.pendingRecoveryPrompt) {
      const authoritativeEmail = status.email || (cleanReg ? `${cleanReg.toLowerCase()}@centurionuniv.edu.in` : "");
      setAccountEmail(authoritativeEmail);
      setMaskedEmail(status.maskedEmail || authoritativeEmail);
      if (status.studentName) setStudentName(status.studentName);
      setStatusNotice("");
      setErrorMsg("");
      setErrorCode("");
      setStep("RECOVERY_PROMPT");
      return;
    }

    if (status?.isBlocked) {
      const isLockout = status.code === "ACCOUNT_TEMPORARILY_LOCKED" || status.blockReason === "ACCOUNT_TEMPORARILY_LOCKED";
      if (isLockout) {
        setErrorMsg(status.blockMessage || status.message || "Account is temporarily locked. Try again after 24 hours.");
        setErrorCode("ACCOUNT_TEMPORARILY_LOCKED");
        if (status.unlockAt) setUnlockTime(status.unlockAt);
        return;
      }
      if (status.devices && status.devices.length > 0) {
        setBlockedDevicesData(status.devices);
      }
      setIsBlockedModalOpen(true);
      return;
    }

    setErrorMsg("");
    setErrorCode("");

    // If account has password -> Go to Password Screen
    if (status?.hasPassword) {
      setStep("PASSWORD");
      return;
    }

    // If new student (no password) -> Trigger OTP Send
    await triggerSendOtp();
  };

  const triggerSendOtp = async (isForgot = false) => {
    if (loading) return;
    if (resendCooldown > 0) {
      setErrorMsg(`Please wait ${resendCooldown} seconds before requesting another verification code.`);
      setErrorCode("OTP_COOLDOWN_ACTIVE");
      return;
    }

    const isForgotMode = typeof isForgot === "boolean" ? isForgot : isForgotPasswordMode;
    setLoading(true);
    setErrorMsg("");
    setErrorCode("");
    setIsForgotPasswordMode(isForgotMode);

    const result = await sendStudentOtp(cleanReg, { isForgotPassword: isForgotMode });
    setLoading(false);

    if (result.success) {
      const authoritativeEmail = result.data?.email || (cleanReg ? `${cleanReg.toLowerCase()}@centurionuniv.edu.in` : "");
      setAccountEmail(authoritativeEmail);
      setMaskedEmail(result.data?.maskedEmail || authoritativeEmail);
      setStudentName(result.data?.studentName || "Student");
      setAttemptsUsed(result.data?.attemptsUsedToday ?? 1);
      setRemainingDailyAttempts(result.data?.remainingDailyAttempts ?? 1);
      setTimerSeconds(result.data?.expiresInSeconds || 180);
      setTimerActive(true);
      setResendCooldown(result.data?.cooldownSeconds || 180);
      if (result.data?.unlockAt) setUnlockTime(result.data.unlockAt);
      setStep("OTP");
    } else {
      setErrorMsg(result.error);
      setErrorCode(result.code);
      if (result.details?.unlockAt || result.data?.unlockAt) {
        setUnlockTime(result.details?.unlockAt || result.data?.unlockAt);
      }
      if (result.code === "DAILY_LIMIT_EXCEEDED") {
        setRemainingDailyAttempts(0);
      }
      if (result.code === "OTP_COOLDOWN_ACTIVE") {
        const cd = result.details?.cooldownRemainingSeconds || result.details?.remainingSeconds || 180;
        setResendCooldown(cd + 2);
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
    if (loading) return;
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    // Client-Side Throttling: If OTP cooldown is active, prevent unnecessary server calls
    if (resendCooldown > 0) {
      setErrorMsg(`Please wait ${resendCooldown} seconds before requesting another verification code.`);
      setErrorCode("OTP_COOLDOWN_ACTIVE");
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
      setApprovalExchangeSecret(result.exchangeSecret || "");
      setApprovalActiveDevice(result.activeDevice);
      setApprovalTimerSeconds(result.expiresInSeconds || 180);
      setStep("APPROVAL_PENDING");
      return;
    }

    if (result.step === "RECOVERY_PROMPT") {
      const authoritativeEmail = result.email || (cleanReg ? `${cleanReg.toLowerCase()}@centurionuniv.edu.in` : "");
      setAccountEmail(authoritativeEmail);
      setMaskedEmail(result.maskedEmail || authoritativeEmail);
      if (result.student?.studentName) setStudentName(result.student.studentName);
      setStep("RECOVERY_PROMPT");
      setStatusNotice("");
      setErrorMsg("");
      setErrorCode("");
      return;
    }

    if (result.step === "OTP") {
      const authoritativeEmail = result.email || (cleanReg ? `${cleanReg.toLowerCase()}@centurionuniv.edu.in` : "");
      setAccountEmail(authoritativeEmail);
      setMaskedEmail(result.maskedEmail || authoritativeEmail);
      setTimerSeconds(result.expiresInSeconds || 300);
      setTimerActive(true);
      setResendCooldown(result.cooldownSeconds || result.expiresInSeconds || 300);
      setRemainingDailyAttempts(result.remainingDailyAttempts ?? (result.isFailedPasswordTransfer ? 0 : 4));
      if (result.isFailedPasswordTransfer) {
        setIsForgotPasswordMode(true);
        setIsOneTimeRecoveryOtp(true);
        setStatusNotice("Maximum password attempts reached (3/3). A one-time verification code has been dispatched to your email (5 min validity).");
      }
      if (result.unlockAt) setUnlockTime(result.unlockAt);
      setStep("OTP");
      return;
    }

    if (result.success) {
      navigateToDestination(cleanReg);
    } else {
      setErrorMsg(result.error);
      setErrorCode(result.code);

      // If server returns OTP cooldown, sync frontend cooldown timer with a 2-second safety buffer
      if (result.code === "OTP_COOLDOWN_ACTIVE") {
        const cd = result.details?.cooldownRemainingSeconds || result.details?.remainingSeconds || 60;
        setResendCooldown(cd + 2);
      }

      // ONLY count attempts on real password verification failure (never for OTP cooldown or rate limits)
      if (result.code === "INVALID_PASSWORD" || result.code === "PASSWORD_ATTEMPTS_EXCEEDED" || result.details?.failedAttempts !== undefined) {
        const attempts = (result.details?.failedAttempts ?? result.failedAttempts ?? (failedPasswordAttemptsCount + 1));
        setFailedPasswordAttemptsCount(attempts);

        const lockThreshold = 3;
        if (attempts >= lockThreshold || result.code === "OTP_FALLBACK_ALLOWED" || result.code === "PASSWORD_ATTEMPTS_EXCEEDED") {
          setDeviceStatus((prev) => ({ ...(prev || {}), otpFallbackAllowed: true, isLocked: true }));
        }
      }

      if (result.code === "ACCOUNT_TEMPORARILY_LOCKED") {
        if (result.details?.unlockAt || result.details?.recoveryRestrictedUntil) {
          setUnlockTime(result.details?.unlockAt || result.details?.recoveryRestrictedUntil);
        }
      }

      if (result.code === "BLOCKED_DEVICE_ACTIVE" || result.code === "DEVICE_LIMIT_REACHED") {
        const devs = result.details?.activeDevices || result.details?.sessions || [];
        setBlockedDevicesData(devs);
        setIsBlockedModalOpen(true);
      }
    }
  };

  const handleSessionTakeover = async () => {
    if (loading) return;
    if (!password) {
      setStep("PASSWORD");
      setErrorMsg("Please enter your password to take over the session.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setErrorCode("");
    try {
      const result = await studentTransferSession(cleanReg, password);
      setLoading(false);
      if (result.success) {
        navigateToDestination(cleanReg);
      } else {
        setErrorMsg(result.error || "Failed to transfer session to this device.");
        setErrorCode(result.code || "TRANSFER_FAILED");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg("An error occurred during session takeover.");
    }
  };

  const handleRequestEmailOtpHandover = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg("");
    setErrorCode("");
    try {
      const res = await sendHandoverOtp(cleanReg, password, approvalRequestId);
      if (res.success) {
        setStep("OTP");
        setMaskedEmail(res.data?.maskedEmail || "");
        setTimerSeconds(res.data?.expiresInSeconds || 180);
        setTimerActive(true);
        setStatusNotice(`A 6-digit verification code has been dispatched to your university email.`);
      } else {
        setErrorMsg(res.error || "Failed to send email verification code.");
      }
    } catch {
      setErrorMsg("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerRecoveryOtp = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg("");
    setErrorCode("");
    try {
      const res = await studentSendRecoveryOtp(cleanReg);
      if (res.success) {
        const authoritativeEmail = res.data?.email || (cleanReg ? `${cleanReg.toLowerCase()}@centurionuniv.edu.in` : "");
        setAccountEmail(authoritativeEmail);
        setMaskedEmail(res.data?.maskedEmail || authoritativeEmail);
        if (res.data?.student?.studentName) setStudentName(res.data.student.studentName);
        setTimerSeconds(res.data?.expiresInSeconds || 300);
        setTimerActive(true);
        setResendCooldown(res.data?.cooldownSeconds || 300);
        setIsForgotPasswordMode(true);
        setIsOneTimeRecoveryOtp(true);
        if (res.data?.unlockAt) setUnlockTime(res.data.unlockAt);
        setStatusNotice("A one-time verification code has been dispatched to your email (valid for 5 minutes).");
        setStep("OTP");
      } else {
        setErrorMsg(res.error || "Failed to dispatch recovery code. Please try again.");
        setErrorCode(res.code || "RECOVERY_ERROR");
        if (res.details?.unlockAt) setUnlockTime(res.details.unlockAt);
      }
    } catch (err) {
      setErrorMsg("An error occurred while dispatching the verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setErrorCode("");

    const result = await verifyStudentOtp(cleanReg, cleanOtp, { isForgotPassword: isForgotPasswordMode });
    setLoading(false);

    if (result.success) {
      if (result.step === "CREATE_PASSWORD") {
        setSetupPasswordToken(result.setupPasswordToken);
        setStep("CREATE_PASSWORD");
        setStatusNotice("OTP verified successfully. Please create a new password to secure your account.");
      } else {
        navigateToDestination(cleanReg);
      }
    } else {
      setErrorMsg(result.error);
      setErrorCode(result.code);
      if (result.code === "ACCOUNT_TEMPORARILY_LOCKED" || result.details?.unlockAt) {
        if (result.details?.unlockAt) {
          setUnlockTime(result.details.unlockAt);
        }
      }
    }
  };

  // Step 4: Mandatory Create Password -> Transitions to Animated Password Success Screen
  const handleCreatePasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
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
      setIsOneTimeRecoveryOtp(false);
      setFailedPasswordAttemptsCount(0);
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
          zIndex: 10000000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(8px, 2.5vw, 16px)",
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          boxSizing: "border-box",
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
            borderRadius: "clamp(14px, 3.5vw, 18px)",
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.22)",
            maxWidth: "min(410px, 100%)",
            width: "100%",
            maxHeight: "min(94dvh, 92vh, 660px)",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            position: "relative",
            boxSizing: "border-box",
            padding: "clamp(12px, 3.2vw, 18px) clamp(12px, 3.5vw, 18px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar: Progress Stepper + Action/Mandatory Badge */}
          {step !== "PASSWORD_SUCCESS" && step !== "APPROVAL_PENDING" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 6,
                marginBottom: "clamp(8px, 2vw, 12px)",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Stepper */}
              <div style={{ display: "flex", alignItems: "center", gap: "clamp(3px, 1vw, 5px)", flexShrink: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "clamp(9.5px, 2.2vw, 10.5px)", fontWeight: 800, color: step === "REGNO" ? "#2563eb" : "#16a34a", whiteSpace: "nowrap" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: step === "REGNO" ? "#2563eb" : "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, flexShrink: 0 }}>
                    {step === "REGNO" ? "1" : <Check size={10} strokeWidth={3} />}
                  </div>
                  <span>Identifier</span>
                </div>

                <div style={{ width: "clamp(6px, 1.5vw, 12px)", height: 2, background: step === "REGNO" ? "#e2e8f0" : (step === "RECOVERY_PROMPT" ? "#fca5a5" : "#16a34a"), borderRadius: 1, flexShrink: 0 }} />

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: "clamp(9.5px, 2.2vw, 10.5px)",
                  fontWeight: 800,
                  color: step === "RECOVERY_PROMPT" ? "#dc2626" : (step === "OTP" || step === "PASSWORD") ? "#2563eb" : (step === "CREATE_PASSWORD") ? "#16a34a" : "#94a3b8",
                  whiteSpace: "nowrap"
                }}>
                  <div style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: step === "RECOVERY_PROMPT" ? "#dc2626" : (step === "OTP" || step === "PASSWORD") ? "#2563eb" : (step === "CREATE_PASSWORD") ? "#16a34a" : "#e2e8f0",
                    color: (step === "OTP" || step === "PASSWORD" || step === "CREATE_PASSWORD" || step === "RECOVERY_PROMPT") ? "#fff" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 900,
                    flexShrink: 0
                  }}>
                    {step === "CREATE_PASSWORD" ? <Check size={10} strokeWidth={3} /> : "2"}
                  </div>
                  <span>{step === "RECOVERY_PROMPT" ? "Recovery" : step === "PASSWORD" ? "Password" : "OTP"}</span>
                </div>

                {(!deviceStatus?.hasPassword || step === "CREATE_PASSWORD" || step === "RECOVERY_PROMPT") && (
                  <>
                    <div style={{ width: "clamp(6px, 1.5vw, 12px)", height: 2, background: (step === "CREATE_PASSWORD") ? "#2563eb" : "#e2e8f0", borderRadius: 1, flexShrink: 0 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "clamp(9.5px, 2.2vw, 10.5px)", fontWeight: 800, color: step === "CREATE_PASSWORD" ? "#2563eb" : "#94a3b8", whiteSpace: "nowrap" }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: step === "CREATE_PASSWORD" ? "#2563eb" : "#e2e8f0", color: step === "CREATE_PASSWORD" ? "#fff" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, flexShrink: 0 }}>
                        3
                      </div>
                      <span>Password</span>
                    </div>
                  </>
                )}
              </div>

              {/* Right Side: Mandatory Badge or Close Button */}
              {step === "CREATE_PASSWORD" ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3.5,
                    background: "#fef3c7",
                    border: "1px solid #fde68a",
                    borderRadius: 999,
                    padding: "2px 7px",
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: "#92400e",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Lock size={10} />
                  <span>Mandatory</span>
                </div>
              ) : (
                <button
                  onClick={handleModalClose}
                  aria-label="Close modal"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "50%",
                    width: 26,
                    height: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* Modal Header */}
          {step !== "PASSWORD_SUCCESS" && step !== "APPROVAL_PENDING" && (
            <div style={{ textAlign: "center", marginBottom: "clamp(8px, 2vw, 12px)" }}>
              <div
                style={{
                  width: "clamp(34px, 8vw, 38px)",
                  height: "clamp(34px, 8vw, 38px)",
                  borderRadius: 10,
                  background: step === "RECOVERY_PROMPT" ? "#fef2f2" : "#eff6ff",
                  border: step === "RECOVERY_PROMPT" ? "1px solid #fecaca" : "1px solid #dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto clamp(4px, 1vw, 6px) auto",
                }}
              >
                {step === "CREATE_PASSWORD" ? (
                  <KeyRound size={19} color="#2563eb" />
                ) : step === "PASSWORD" ? (
                  <Lock size={19} color="#2563eb" />
                ) : step === "OTP" ? (
                  <Mail size={19} color="#2563eb" />
                ) : step === "RECOVERY_PROMPT" ? (
                  <ShieldAlert size={19} color="#dc2626" />
                ) : (
                  <GraduationCap size={19} color="#2563eb" />
                )}
              </div>

              <h3
                style={{
                  fontSize: "clamp(15px, 3.8vw, 17px)",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 2px 0",
                  letterSpacing: "-0.3px",
                }}
              >
                {step === "CREATE_PASSWORD"
                  ? "Create Account Password"
                  : step === "PASSWORD"
                  ? "Student Password Login"
                  : step === "OTP"
                  ? "Email Verification"
                  : step === "RECOVERY_PROMPT"
                  ? "Account Recovery"
                  : "Student Portal Login"}
              </h3>
              <p
                style={{
                  fontSize: "clamp(11px, 2.7vw, 12px)",
                  color: "#64748b",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {step === "CREATE_PASSWORD"
                  ? `Set a mandatory password to secure your account (${cleanReg})`
                  : step === "PASSWORD"
                  ? `Enter your account password for ${cleanReg}`
                  : step === "OTP"
                  ? `Enter the 6-digit verification code sent to your email`
                  : step === "RECOVERY_PROMPT"
                  ? `Password login suspended for ${cleanReg}`
                  : "Enter your official university registration number"}
              </p>
            </div>
          )}

          {/* Alert / Notice Display */}
          {errorMsg && step !== "PASSWORD_SUCCESS" ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                borderRadius: 10,
                padding: "8px 10px",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                marginBottom: 10,
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {errorCode === "ACCOUNT_TEMPORARILY_LOCKED" ? (
                  <Lock size={13} color="#dc2626" />
                ) : errorCode === "BLOCKED_DEVICE_ACTIVE" || errorCode === "DEVICE_LIMIT_REACHED" ? (
                  <Smartphone size={13} color="#dc2626" />
                ) : (
                  <AlertCircle size={13} color="#dc2626" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11.5, color: "#991b1b", fontWeight: 700, display: "block", marginBottom: 1 }}>
                  {errorCode === "ACCOUNT_TEMPORARILY_LOCKED"
                    ? "Account Temporarily Locked (24 Hours)"
                    : errorCode === "BLOCKED_DEVICE_ACTIVE"
                    ? "Device Slot Occupied"
                    : errorCode === "DEVICE_LIMIT_REACHED"
                    ? "Device Limit Reached"
                    : errorCode === "APPROVAL_DENIED"
                    ? "Login Request Denied"
                    : errorCode === "APPROVAL_EXPIRED"
                    ? "Approval Timed Out"
                    : "Authentication Notice"}
                </span>
                <p style={{ fontSize: 11, color: "#7f1d1d", lineHeight: 1.35, margin: 0 }}>
                  {errorMsg}
                </p>

                {(errorCode === "BLOCKED_DEVICE_ACTIVE" || errorCode === "DEVICE_LIMIT_REACHED") && (
                  <button
                    type="button"
                    onClick={() => setIsBlockedModalOpen(true)}
                    style={{
                      marginTop: "6px",
                      background: "#fee2e2",
                      border: "1px solid #fca5a5",
                      color: "#991b1b",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Smartphone size={12} color="#dc2626" />
                    <span>View Active Device Info</span>
                  </button>
                )}
              </div>
            </div>
          ) : statusNotice && step !== "PASSWORD_SUCCESS" && step !== "OTP" && step !== "RECOVERY_PROMPT" ? (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                padding: "6px 10px",
                marginBottom: 10,
                fontSize: 11.5,
                color: "#166534",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <CheckCircle2 size={13} color="#16a34a" />
              <span>{statusNotice}</span>
            </div>
          ) : null}

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
          {step === "PASSWORD" && (() => {
            const maxAttempts = 3;
            const isPasswordBlocked = failedPasswordAttemptsCount >= maxAttempts || (deviceStatus?.failedPasswordAttempts >= maxAttempts) || deviceStatus?.isLocked;

            return (
              <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isPasswordBlocked ? "#dc2626" : "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Account Password
                    </label>
                    {isPasswordBlocked ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#dc2626",
                          background: "#fef2f2",
                          padding: "2.5px 8px",
                          borderRadius: 999,
                          border: "1px solid #fecaca",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Lock size={11} strokeWidth={2.5} />
                        <span>Locked ({maxAttempts}/{maxAttempts} Failed)</span>
                      </span>
                    ) : failedPasswordAttemptsCount > 0 ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#d97706",
                          background: "#fffbeb",
                          padding: "2.5px 8px",
                          borderRadius: 999,
                          border: "1px solid #fde68a",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <ShieldAlert size={11} strokeWidth={2.5} />
                        <span>{Math.max(0, maxAttempts - failedPasswordAttemptsCount)} attempt(s) remaining</span>
                      </span>
                    ) : null}
                  </div>

                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      disabled={isPasswordBlocked}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isPasswordBlocked ? `Input locked due to ${maxAttempts} failed attempts` : "Enter your account password"}
                      autoFocus={!isPasswordBlocked}
                      required={!isPasswordBlocked}
                      style={{
                        width: "100%",
                        padding: "11px 42px 11px 14px",
                        fontSize: 14,
                        color: isPasswordBlocked ? "#94a3b8" : "#0f172a",
                        background: isPasswordBlocked ? "#f1f5f9" : "#f8fafc",
                        border: isPasswordBlocked ? "1.5px solid #fecaca" : "1.5px solid #cbd5e1",
                        borderRadius: 10,
                        outline: "none",
                        boxSizing: "border-box",
                        cursor: isPasswordBlocked ? "not-allowed" : "text",
                      }}
                    />
                    {!isPasswordBlocked && (
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
                    )}
                  </div>
                </div>

                {/* 1-Time Recovery OTP Card — ONLY visible when 3 password attempts have failed */}
                {isPasswordBlocked && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)",
                      border: "1.5px solid #bfdbfe",
                      borderRadius: 14,
                      padding: "14px 15px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      boxShadow: "0 2px 10px rgba(37, 99, 235, 0.06)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#dbeafe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <ShieldAlert size={18} color="#2563eb" strokeWidth={2.2} />
                      </div>
                      <div>
                        <span style={{ fontSize: 13, color: "#1e40af", fontWeight: 800, display: "block" }}>
                          Password Locked — 1-Time Email Verification
                        </span>
                        <p style={{ fontSize: 11.5, color: "#3b82f6", margin: "3px 0 0 0", lineHeight: 1.45 }}>
                          A single-use OTP will be sent to your university email. It is valid for <strong>5 minutes</strong>. Resend is disabled.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTriggerRecoveryOtp}
                      disabled={loading}
                      style={{
                        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 10,
                        padding: "11px 16px",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                        boxShadow: "0 3px 10px rgba(37, 99, 235, 0.28)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {loading ? <Loader2 size={15} className="spin" /> : <Mail size={15} strokeWidth={2.2} />}
                      <span>Send 1-Time Recovery Code (5 Min Expiry)</span>
                    </button>
                  </div>
                )}

                {!isPasswordBlocked && (
                  <button
                    type="submit"
                    disabled={loading || !password || resendCooldown > 0}
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      borderRadius: 10,
                      border: "none",
                      background: loading || !password || resendCooldown > 0 ? "#cbd5e1" : "#0f172a",
                      color: "#ffffff",
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: loading || !password || resendCooldown > 0 ? "not-allowed" : "pointer",
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
                    ) : resendCooldown > 0 ? (
                      <>
                        <Clock size={15} />
                        <span>Please wait {resendCooldown}s</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStep("REGNO");
                    setPassword("");
                    setFailedPasswordAttemptsCount(0);
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
            );
          })()}

          {/* STEP 2C: DEDICATED RECOVERY INSTRUCTION SCREEN (3 FAILED PASSWORD ATTEMPTS) */}
          {step === "RECOVERY_PROMPT" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 2.5vw, 13px)" }}>
              {/* Top Navigation Row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 22 }}>
                <button
                  type="button"
                  onClick={() => {
                    setStep("REGNO");
                    setPassword("");
                    setErrorMsg("");
                    setErrorCode("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: "clamp(11.5px, 2.7vw, 12.5px)",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "2px 0",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#0f172a")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                >
                  <ChevronLeft size={15} />
                  <span>Change Registration No</span>
                </button>
                <span
                  style={{
                    fontSize: "clamp(10px, 2.4vw, 11px)",
                    fontWeight: 800,
                    color: "#dc2626",
                    background: "#fef2f2",
                    padding: "2px 8px",
                    borderRadius: 999,
                    border: "1px solid #fecaca",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <ShieldAlert size={11.5} strokeWidth={2.5} />
                  <span>3/3 Attempts Failed</span>
                </span>
              </div>

              {/* Main Security Card */}
              <div
                style={{
                  background: "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)",
                  border: "1.5px solid #fecaca",
                  borderRadius: 14,
                  padding: "clamp(11px, 2.8vw, 14px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "clamp(8px, 2vw, 10px)",
                  boxShadow: "0 2px 10px rgba(220, 38, 38, 0.04)",
                }}
              >
                {/* Card Header: Lock Icon + Title & Description */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div
                    style={{
                      width: "clamp(32px, 8vw, 36px)",
                      height: "clamp(32px, 8vw, 36px)",
                      borderRadius: 9,
                      background: "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: "1px solid #fca5a5",
                    }}
                  >
                    <Lock size={18} color="#dc2626" strokeWidth={2.2} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "clamp(13px, 3.2vw, 14.5px)",
                        fontWeight: 800,
                        color: "#991b1b",
                        letterSpacing: "-0.2px",
                      }}
                    >
                      Password Login Suspended
                    </h4>
                    <p
                      style={{
                        margin: "2px 0 0 0",
                        fontSize: "clamp(11px, 2.6vw, 11.8px)",
                        color: "#b91c1c",
                        lineHeight: 1.35,
                      }}
                    >
                      You have entered an incorrect password <strong>3 times</strong>. For account protection, password entry has been temporarily disabled.
                    </p>
                  </div>
                </div>

                {/* Email Destination Box */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #fee2e2",
                    borderRadius: 8,
                    padding: "clamp(6px, 1.8vw, 8px) clamp(8px, 2.2vw, 10px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    minWidth: 0,
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                  }}
                >
                  <Mail size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: "clamp(10.5px, 2.4vw, 11.5px)",
                      color: "#64748b",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    Registered Email:
                  </span>
                  <span
                    title={maskedEmail || accountEmail || (cleanReg ? `${cleanReg.toLowerCase()}@centurionuniv.edu.in` : "")}
                    style={{
                      fontSize: "clamp(10.5px, 2.6vw, 12px)",
                      fontWeight: 700,
                      color: "#0f172a",
                      fontFamily: "'Space Mono', monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {maskedEmail || accountEmail || (cleanReg ? `${cleanReg.toLowerCase()}@centurionuniv.edu.in` : "")}
                  </span>
                </div>

                {/* Instruction Bullet Points */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "clamp(4px, 1.2vw, 5.5px)",
                    fontSize: "clamp(10.5px, 2.5vw, 11.5px)",
                    color: "#7f1d1d",
                    lineHeight: 1.35,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <Clock size={12.5} color="#dc2626" style={{ flexShrink: 0, marginTop: 1.5 }} />
                    <span>The verification OTP is valid for <strong>5 minutes</strong> only.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <AlertTriangle size={12.5} color="#d97706" style={{ flexShrink: 0, marginTop: 1.5 }} />
                    <span>If not verified within 5 minutes, your account will be locked for <strong>24 hours</strong>.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <ShieldCheck size={12.5} color="#16a34a" style={{ flexShrink: 0, marginTop: 1.5 }} />
                    <span>After verifying, you will create a new password to restore full access.</span>
                  </div>
                </div>
              </div>

              {/* Action Button: Send One-Time OTP */}
              <button
                type="button"
                onClick={handleTriggerRecoveryOtp}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "clamp(10px, 2.6vw, 12px) 16px",
                  borderRadius: 11,
                  border: "none",
                  background: loading
                    ? "#cbd5e1"
                    : "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "#ffffff",
                  fontSize: "clamp(12.5px, 3vw, 13.5px)",
                  fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  boxShadow: loading ? "none" : "0 4px 14px rgba(220, 38, 38, 0.28)",
                  transition: "all 0.15s ease",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Dispatching One-Time OTP...</span>
                  </>
                ) : (
                  <>
                    <Mail size={15} strokeWidth={2.2} />
                    <span>Send One-Time OTP to Email</span>
                  </>
                )}
              </button>
            </div>
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
                onClick={handleSessionTakeover}
                disabled={loading}
                style={{
                  background: "#2563eb",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 16px",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                }}
              >
                {loading ? <Loader2 size={15} className="spin" /> : <ArrowRightLeft size={15} />}
                <span>Take Over Session & Log In on this Device</span>
              </button>

              <button
                type="button"
                onClick={handleRequestEmailOtpHandover}
                disabled={loading}
                style={{
                  background: "#f0fdf4",
                  border: "1.5px solid #86efac",
                  borderRadius: 10,
                  padding: "10px 16px",
                  color: "#15803d",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Mail size={15} />
                <span>Lost access to old device? Transfer via Email OTP</span>
              </button>

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
                  border: errorCode ? "none" : "1.5px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "10px 16px",
                  color: errorCode ? "#ffffff" : "#334155",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                {errorCode ? "Try Again" : "Cancel Request"}
              </button>
            </div>
          )}

          {/* STEP 3: OTP Verification */}
          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* 1-Time Security Recovery Code Banner */}
              {isOneTimeRecoveryOtp && (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1.5px solid #fde68a",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <ShieldAlert size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <span style={{ fontSize: 12.5, color: "#92400e", fontWeight: 800, display: "block" }}>
                      1-Time Password Recovery Code
                    </span>
                    <p style={{ fontSize: 11.5, color: "#b45309", margin: "3px 0 0 0", lineHeight: 1.45 }}>
                      This single-use code is valid for <strong>5 minutes</strong> only. Resend is disabled. Once verified, you will set a new password. If not verified within 5 minutes, your account will be locked for 24 hours.
                    </p>
                  </div>
                </div>
              )}

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
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#15803d",
                      fontFamily: "'Space Mono', monospace",
                      wordBreak: "break-all",
                      overflowWrap: "anywhere",
                      whiteSpace: "normal",
                      lineHeight: 1.35,
                      marginTop: 2,
                    }}
                  >
                    {accountEmail || maskedEmail || "your registered email"}
                  </div>
                  {!isForgotPasswordMode && !isOneTimeRecoveryOtp && typeof remainingDailyAttempts === "number" && (
                    <div
                      style={{
                        fontSize: 11,
                        color: remainingDailyAttempts <= 0 ? "#dc2626" : "#166534",
                        fontWeight: 600,
                        marginTop: 4,
                      }}
                    >
                      {remainingDailyAttempts > 0 ? (
                        <span>OTP attempts remaining today: <strong>{remainingDailyAttempts}</strong></span>
                      ) : (
                        <span>Daily OTP limit reached.{unlockTime ? ` Unlocks at ${unlockTime}.` : ""}</span>
                      )}
                    </div>
                  )}
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

                {!isOneTimeRecoveryOtp ? (
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || (remainingDailyAttempts <= 0 && !isForgotPasswordMode) || loading}
                    onClick={() => {
                      if (cleanReg === "230301120327" && password && !isForgotPasswordMode) {
                        handlePasswordSubmit();
                      } else {
                        triggerSendOtp(isForgotPasswordMode);
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: resendCooldown > 0 || (remainingDailyAttempts <= 0 && !isForgotPasswordMode) ? "#94a3b8" : "#2563eb",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: resendCooldown > 0 || (remainingDailyAttempts <= 0 && !isForgotPasswordMode) ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: 0,
                    }}
                  >
                    <RefreshCw size={12} className={loading ? "spin" : ""} />
                    <span>
                      {remainingDailyAttempts <= 0 && !isForgotPasswordMode
                        ? "Daily Limit Reached"
                        : resendCooldown > 0
                        ? `Resend Code (${resendCooldown}s)`
                        : "Resend Code"}
                    </span>
                  </button>
                ) : (
                  <span style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <ShieldAlert size={12} color="#94a3b8" />
                    <span>Single-use code (No resend)</span>
                  </span>
                )}
              </div>
            </form>
          )}

          {/* STEP 4: MANDATORY CREATE PASSWORD WITH REAL-TIME STRENGTH & CRITERIA CHECKLIST */}
          {step === "CREATE_PASSWORD" && (
            <form onSubmit={handleCreatePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* New Password Input */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 3 }}>
                  Create Account Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
                    autoFocus
                    required
                    style={{
                      width: "100%",
                      padding: "9px 38px 9px 12px",
                      fontSize: 13.5,
                      color: "#0f172a",
                      background: "#f8fafc",
                      border: "1.5px solid",
                      borderColor: password ? (isPasswordFormValid ? "#10b981" : "#cbd5e1") : "#cbd5e1",
                      borderRadius: 9,
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
                      right: 10,
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
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 3 }}>
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
                      padding: "9px 38px 9px 12px",
                      fontSize: 13.5,
                      color: "#0f172a",
                      background: "#f8fafc",
                      border: "1.5px solid",
                      borderColor: confirmPassword ? (isMatch ? "#10b981" : "#ef4444") : "#cbd5e1",
                      borderRadius: 9,
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
                      right: 10,
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
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Password Strength & Real-Time Validation Checklist */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "8px 11px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Security Strength
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: strengthMeta.color }}>
                    {strengthMeta.label}
                  </span>
                </div>

                {/* Segmented Strength Bar */}
                <div style={{ width: "100%", height: 4, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 6px", marginTop: 2, fontSize: "clamp(10px, 2.4vw, 11px)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: hasMinLength ? "#16a34a" : "#94a3b8", fontWeight: hasMinLength ? 700 : 500 }}>
                    {hasMinLength ? (
                      <CheckCircle2 size={12} color="#16a34a" />
                    ) : (
                      <div style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid #cbd5e1", flexShrink: 0 }} />
                    )}
                    <span>8+ Chars</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: hasUpper ? "#16a34a" : "#94a3b8", fontWeight: hasUpper ? 700 : 500 }}>
                    {hasUpper ? (
                      <CheckCircle2 size={12} color="#16a34a" />
                    ) : (
                      <div style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid #cbd5e1", flexShrink: 0 }} />
                    )}
                    <span>Uppercase</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: hasLower ? "#16a34a" : "#94a3b8", fontWeight: hasLower ? 700 : 500 }}>
                    {hasLower ? (
                      <CheckCircle2 size={12} color="#16a34a" />
                    ) : (
                      <div style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid #cbd5e1", flexShrink: 0 }} />
                    )}
                    <span>Lowercase</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: hasNumber ? "#16a34a" : "#94a3b8", fontWeight: hasNumber ? 700 : 500 }}>
                    {hasNumber ? (
                      <CheckCircle2 size={12} color="#16a34a" />
                    ) : (
                      <div style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid #cbd5e1", flexShrink: 0 }} />
                    )}
                    <span>Number (0-9)</span>
                  </div>

                  <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 5, color: isMatch ? "#16a34a" : "#94a3b8", fontWeight: isMatch ? 700 : 500 }}>
                    {isMatch ? (
                      <CheckCircle2 size={12} color="#16a34a" />
                    ) : (
                      <div style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid #cbd5e1", flexShrink: 0 }} />
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
                  padding: "10px 14px",
                  borderRadius: 9,
                  border: "none",
                  background: loading || !isPasswordFormValid ? "#cbd5e1" : "#0f172a",
                  color: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: loading || !isPasswordFormValid ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: !isPasswordFormValid ? "none" : "0 4px 12px rgba(15, 23, 42, 0.15)",
                  transition: "all 0.2s ease",
                  marginTop: 2,
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
        onTransferSession={
          regNo.trim().toUpperCase() === "230301120327" || errorCode === "DEVICE_LIMIT_REACHED"
            ? undefined
            : () => {
                setIsBlockedModalOpen(false);
                triggerSendOtp();
              }
        }
      />
    </AnimatePresence>
  );
}
