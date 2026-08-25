import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  ArrowRight,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  BarChart3,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Server,
  ArrowLeft,
  RotateCw,
  Loader2,
  Smartphone,
} from "lucide-react";
import BlockedLoginDeviceModal from "../components/BlockedLoginDeviceModal";

export default function AdminLogin() {
  const [step, setStep] = useState("PASSWORD"); // "PASSWORD" | "OTP"
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null); // { title, message, badge, type }
  const [statusNotice, setStatusNotice] = useState("");

  // Advanced Security: Client-Side Attempt Counter & Lockout Timer
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockCountdown, setLockCountdown] = useState(0);

  // OTP Expiration Timer
  const [otpTimeLeft, setOtpTimeLeft] = useState(300); // 5 minutes (300s)

  const [authMode, setAuthMode] = useState("MAIN"); // "MAIN" | "SUBADMIN"
  const [subAdminEmail, setSubAdminEmail] = useState("");
  const [subAdminPassword, setSubAdminPassword] = useState("");
  const [showSubPassword, setShowSubPassword] = useState(false);
  const [subAdminVerifiedEmail, setSubAdminVerifiedEmail] = useState("");
  const [subAdminMaskedEmail, setSubAdminMaskedEmail] = useState("");

  // Blocked Device Popup State
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedDevicesData, setBlockedDevicesData] = useState([]);
  const [maxAllowedDevices, setMaxAllowedDevices] = useState(2);

  const otpInputsRef = useRef([]);
  const { adminLoginPassword, adminVerifyOtp, subAdminLogin, subAdminVerifyOtp, adminToken } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [adminToken, navigate]);

  // Handle Lockout Countdown Timer
  useEffect(() => {
    let timer;
    if (lockCountdown > 0) {
      setErrorInfo({
        title: "Access Temporarily Locked",
        message: "Multiple failed attempts detected. Administrative access is paused for security.",
        badge: `Cooldown ${lockCountdown}s`,
        type: "lockout",
      });
      timer = setInterval(() => {
        setLockCountdown((prev) => prev - 1);
      }, 1000);
    } else if (lockCountdown === 0 && failedAttempts >= 5) {
      setFailedAttempts(0);
      setErrorInfo(null);
    }
    return () => clearInterval(timer);
  }, [lockCountdown, failedAttempts]);

  // Handle OTP Expiration Countdown Timer
  useEffect(() => {
    let timer;
    if (step === "OTP" && otpTimeLeft > 0) {
      timer = setInterval(() => {
        setOtpTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpTimeLeft]);

  // Format seconds to MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ─── Step 1: Submit Password (Main Admin) ─────────────────────────
  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (lockCountdown > 0) return;

    const cleanPassword = String(password || "").trim();
    if (!cleanPassword) {
      setErrorInfo({
        title: "Password Required",
        message: "Please enter your administrative master password.",
        badge: null,
        type: "error",
      });
      return;
    }

    setLoading(true);
    setErrorInfo(null);
    setStatusNotice("");

    try {
      const res = await adminLoginPassword(cleanPassword);
      if (res && res.alreadyLoggedIn) {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      if (res && res.step === "OTP_REQUIRED") {
        setStep("OTP");
        setOtp(["", "", "", "", "", ""]);
        setOtpTimeLeft(res.expiresInSeconds || 300);
        setStatusNotice("A 6-digit security code has been dispatched to your administrator email.");
        setTimeout(() => {
          if (otpInputsRef.current[0]) {
            otpInputsRef.current[0].focus();
          }
        }, 150);
      } else if (!res?.success) {
        handleAuthFailure(res);
      }
    } catch (err) {
      handleAuthFailure(err.response?.data || { error: "Authentication failed" });
    } finally {
      setLoading(false);
    }
  }

  function handleAuthFailure(errData) {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    const code = errData?.code;
    if (code === "ADMIN_DEVICE_LIMIT_REACHED") {
      const devs = errData?.details?.activeDevices || errData?.activeDevices || [];
      setBlockedDevicesData(devs);
      setMaxAllowedDevices(2);
      setIsBlockedModalOpen(true);
      setErrorInfo({
        title: "Device Authorization Limit",
        message: "Admin portal is active on 2 authorized devices (maximum limit: 2). Please log out from another device to continue.",
        badge: "Max 2 Devices",
        type: "warning",
      });
      return;
    }

    if (code === "SUBADMIN_DEVICE_LIMIT_REACHED") {
      const devs = errData?.details?.activeDevices || errData?.activeDevices || [];
      setBlockedDevicesData(devs);
      setMaxAllowedDevices(1);
      setIsBlockedModalOpen(true);
      setErrorInfo({
        title: "Device Authorization Limit",
        message: "Sub-Admin portal is currently active on another device (maximum limit: 1 device). Please log out from that device to continue.",
        badge: "Max 1 Device",
        type: "warning",
      });
      return;
    }

    if (nextAttempts >= 5) {
      setLockCountdown(60);
      setErrorInfo({
        title: "Access Temporarily Locked",
        message: "Multiple failed attempts detected. Administrative access is paused for security.",
        badge: "Cooldown 60s",
        type: "lockout",
      });
    } else {
      const remaining = 5 - nextAttempts;
      setErrorInfo({
        title: "Authentication Failed",
        message: "The master password entered does not match administrative records.",
        badge: remaining > 0 ? `${remaining} attempt${remaining > 1 ? "s" : ""} left` : null,
        type: "error",
      });
    }
    setPassword("");
  }

  // ─── Step 1B: Submit Sub-Admin Login ─────────────────────────────
  async function handleSubAdminSubmit(e) {
    e.preventDefault();
    if (lockCountdown > 0) return;

    const cleanPassword = String(subAdminPassword || "").trim();

    if (!cleanPassword) {
      setErrorInfo({
        title: "Password Required",
        message: "Please enter your assigned Sub-Admin password.",
        badge: null,
        type: "error",
      });
      return;
    }

    setLoading(true);
    setErrorInfo(null);
    setStatusNotice("");

    try {
      const res = await subAdminLogin(cleanPassword, subAdminEmail);
      if (res && res.alreadyLoggedIn) {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      if (res && res.step === "OTP_REQUIRED") {
        setSubAdminVerifiedEmail(res.email || "");
        setSubAdminMaskedEmail(res.maskedEmail || res.email || "");
        setStep("OTP");
        setOtp(["", "", "", "", "", ""]);
        setOtpTimeLeft(res.expiresInSeconds || 300);
        setStatusNotice(`A 6-digit verification code has been dispatched to ${res.maskedEmail || res.email}.`);
        setTimeout(() => {
          if (otpInputsRef.current[0]) {
            otpInputsRef.current[0].focus();
          }
        }, 150);
        return;
      }

      if (res && res.success) {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);

      if (res?.code === "SUBADMIN_DEVICE_LIMIT_REACHED" || res?.details?.code === "SUBADMIN_DEVICE_LIMIT_REACHED") {
        const devs = res?.details?.activeDevices || res?.activeDevices || [];
        setBlockedDevicesData(devs);
        setMaxAllowedDevices(1);
        setIsBlockedModalOpen(true);
        setErrorInfo({
          title: "Device Authorization Limit",
          message: "Sub-Admin portal is currently active on another authorized device (maximum limit: 1 device). Please log out from that device to continue.",
          badge: "Max 1 Device",
          type: "warning",
        });
        return;
      }

      if (res?.code?.includes("DISABLED") || res?.code?.includes("REVOKED") || res?.code?.includes("INACTIVE")) {
        setErrorInfo({
          title: "Account Inactive",
          message: res.error || "Your Sub-Admin account is currently inactive or revoked.",
          badge: "Access Denied",
          type: "lockout",
        });
        return;
      }

      if (nextFailed >= 5) {
        setLockCountdown(60);
        setErrorInfo({
          title: "Access Temporarily Locked",
          message: "Multiple failed attempts detected. Access is paused for security.",
          badge: "Cooldown 60s",
          type: "lockout",
        });
      } else {
        const remaining = 5 - nextFailed;
        setErrorInfo({
          title: "Authentication Failed",
          message: res?.error || "The Sub-Admin password provided is incorrect.",
          badge: remaining > 0 ? `${remaining} attempt${remaining > 1 ? "s" : ""} left` : null,
          type: "error",
        });
      }
    } catch (err) {
      setErrorInfo({
        title: "Authentication Error",
        message: err?.response?.data?.message || "An unexpected error occurred during sub-admin authentication.",
        badge: null,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 2: Handle OTP Input ────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    if (value.length > 1) {
      // Handle paste
      const pasted = value.slice(0, 6).split("");
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(pasted.length, 5);
      if (otpInputsRef.current[nextFocus]) {
        otpInputsRef.current[nextFocus].focus();
      }
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      if (otpInputsRef.current[index - 1]) {
        otpInputsRef.current[index - 1].focus();
      }
    }
  };

  async function handleOtpSubmit(e) {
    e.preventDefault();
    const fullOtp = otp.join("").trim();

    if (fullOtp.length !== 6) {
      setErrorInfo({
        title: "Incomplete Code",
        message: "Please enter the complete 6-digit verification code.",
        badge: null,
        type: "error",
      });
      return;
    }

    if (otpTimeLeft === 0) {
      setErrorInfo({
        title: "Code Expired",
        message: "Verification code has expired. Please enter your password to request a new code.",
        badge: "Expired",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setErrorInfo(null);

    try {
      const res =
        authMode === "SUBADMIN"
          ? await subAdminVerifyOtp(String(subAdminVerifiedEmail || subAdminEmail).trim().toLowerCase(), fullOtp)
          : await adminVerifyOtp(fullOtp);

      if (res && res.success) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        const remaining = res?.remainingAttempts;
        setErrorInfo({
          title: "Verification Failed",
          message: res?.error || res?.message || "The verification code is incorrect. Please try again.",
          badge: remaining ? `${remaining} attempts left` : null,
          type: "error",
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid or expired verification code.";
      const isExpired = err.response?.data?.code === "OTP_EXPIRED";
      setErrorInfo({
        title: isExpired ? "Code Expired" : "Verification Failed",
        message: msg,
        badge: isExpired ? "Expired" : null,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleResendOtp = async () => {
    if (loading || lockCountdown > 0) return;
    setLoading(true);
    setErrorInfo(null);
    try {
      const res =
        authMode === "SUBADMIN"
          ? await subAdminLogin(String(subAdminPassword).trim(), String(subAdminVerifiedEmail || subAdminEmail).trim().toLowerCase())
          : await adminLoginPassword(password);

      if (res && res.step === "OTP_REQUIRED") {
        setOtp(["", "", "", "", "", ""]);
        setOtpTimeLeft(300);
        setStatusNotice(`A fresh 6-digit verification code has been dispatched to ${res.maskedEmail || res.email}.`);
        if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
      } else if (res && (res.code === "SUBADMIN_DEVICE_LIMIT_REACHED" || res.details?.code === "SUBADMIN_DEVICE_LIMIT_REACHED")) {
        setErrorInfo({
          title: "Device Limit Reached",
          message: "Sub-Admin portal is currently active on another device (maximum limit: 1 device).",
          badge: "Max 1 Device",
          type: "warning",
        });
      }
    } catch {
      setErrorInfo({
        title: "Resend Failed",
        message: "Unable to dispatch a new verification code. Please sign in again.",
        badge: null,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fcfdfe",
        color: "#0f172a",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* 2-SPLIT CONTAINER */}
      <div
        style={{
          width: "100%",
          maxWidth: 1380,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          minHeight: "calc(100vh - 65px)",
          alignItems: "center",
          padding: "32px 24px",
          gap: 40,
          boxSizing: "border-box",
        }}
        className="gf-admin-container"
      >
        {/* LEFT SPLIT: BRANDING & TECHNICAL SUMMARY */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "20px 10px",
          }}
          className="gf-admin-left"
        >
          {/* Top Header Badge */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 14px",
                borderRadius: 99,
                background: "#eff6ff",
                border: "1px solid #dbeafe",
                color: "#2563eb",
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: "0.2px",
                marginBottom: 20,
              }}
            >
              <img src="/webisteLogo.png" alt="GradeFlow" style={{ height: 18, width: "auto", objectFit: "contain" }} /> GradeFlow Security Gateway
            </div>

            <h1
              style={{
                fontSize: "clamp(26px, 3.2vw, 38px)",
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: "-0.8px",
                marginBottom: 12,
                color: "#0f172a",
              }}
            >
              Institutional Administration
            </h1>

            <p
              style={{
                color: "#64748b",
                fontSize: 14.5,
                lineHeight: 1.6,
                maxWidth: 480,
                marginBottom: 28,
              }}
            >
              Secure management portal with server-side credentials, two-factor OTP verification, and multi-device session governance.
            </p>
          </div>

          {/* Minimalist Tech Feature List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            {[
              {
                icon: <Lock size={16} color="#2563eb" />,
                bg: "#eff6ff",
                border: "#dbeafe",
                title: "Server-Side Credential Guard",
                desc: "Admin credentials are exclusively managed server-side with no client exposure.",
              },
              {
                icon: <Smartphone size={16} color="#10b981" />,
                bg: "#ecfdf5",
                border: "#d1fae5",
                title: "Multi-Device Governance",
                desc: "Strict policy limit of maximum 2 active authorized admin devices with permanent session until manual logout.",
              },
              {
                icon: <BarChart3 size={16} color="#8b5cf6" />,
                bg: "#f5f3ff",
                border: "#ede9fe",
                title: "Real-Time Academic Engine",
                desc: "Instant SGPA/CGPA competition rank verification and backlog tracking.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                style={{
                  padding: "14px 18px",
                  borderRadius: 14,
                  background: "#ffffff",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    background: feat.bg,
                    border: `1px solid ${feat.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {feat.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 3px 0", color: "#0f172a" }}>
                    {feat.title}
                  </h4>
                  <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, margin: 0 }}>
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Security Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              paddingTop: 16,
              borderTop: "1px solid #f1f5f9",
              fontSize: 12,
              color: "#64748b",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>TLS Encrypted Admin Channel</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Server size={14} color="#2563eb" />
              <span>Max 2 Active Admin Devices</span>
            </div>
          </div>
        </div>

        {/* RIGHT SPLIT: AUTHENTICATION FORM CARD */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="gf-auth-card"
            style={{
              width: "100%",
              maxWidth: 430,
              padding: "36px 32px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 20,
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)",
              boxSizing: "border-box",
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* ─── STEP 1: AUTHENTICATION SELECTION ─────────────────────────── */}
            {step === "PASSWORD" ? (
              <div>
                {/* Mode Selector Toggle */}
                <div
                  className="gf-mode-toggle"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    background: "#f1f5f9",
                    padding: 4,
                    borderRadius: 12,
                    marginBottom: 20,
                    gap: 4,
                  }}
                >
                  <button
                    type="button"
                    className="gf-mode-btn"
                    onClick={() => {
                      setAuthMode("MAIN");
                      setErrorInfo(null);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: authMode === "MAIN" ? "#ffffff" : "transparent",
                      color: authMode === "MAIN" ? "#2563eb" : "#64748b",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      boxShadow: authMode === "MAIN" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Master Admin
                  </button>
                  <button
                    type="button"
                    className="gf-mode-btn"
                    onClick={() => {
                      setAuthMode("SUBADMIN");
                      setErrorInfo(null);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: authMode === "SUBADMIN" ? "#ffffff" : "transparent",
                      color: authMode === "SUBADMIN" ? "#4f46e5" : "#64748b",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      boxShadow: authMode === "SUBADMIN" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Sub-Admin Portal
                  </button>
                </div>

                {authMode === "MAIN" ? (
                  <>
                    {/* Form Header */}
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          background: "#eff6ff",
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 14px",
                          border: "1px solid #dbeafe",
                          color: "#2563eb",
                        }}
                      >
                        <KeyRound size={22} />
                      </div>
                      <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.4px", margin: "0 0 6px 0", color: "#0f172a" }}>
                        Master Admin Gateway
                      </h2>
                      <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                        Enter administrative master password to receive institutional OTP
                      </p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} autoComplete="off">
                      {/* Password Input (ONLY FIELD - NO EMAIL INPUT) */}
                      <div style={{ marginBottom: 20 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 11.5,
                            color: "#475569",
                            marginBottom: 6,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Master Password
                        </label>
                        <div style={{ position: "relative" }}>
                          <Lock
                            size={16}
                            color="#94a3b8"
                            style={{
                              position: "absolute",
                              left: 14,
                              top: "50%",
                              transform: "translateY(-50%)",
                              pointerEvents: "none",
                            }}
                          />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            required
                            disabled={loading || lockCountdown > 0}
                            autoComplete="current-password"
                            spellCheck="false"
                            autoFocus
                            style={{
                              width: "100%",
                              background: "#f8fafc",
                              border: "1.5px solid #e2e8f0",
                              padding: "11px 40px 11px 40px",
                              fontSize: 14,
                              borderRadius: 10,
                              color: "#0f172a",
                              letterSpacing: showPassword ? "normal" : "2px",
                              transition: "all 0.15s ease",
                              outline: "none",
                              boxSizing: "border-box",
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#2563eb";
                              e.target.style.background = "#ffffff";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e2e8f0";
                              e.target.style.background = "#f8fafc";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading || lockCountdown > 0}
                            style={{
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              color: "#94a3b8",
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

                      {/* Device Limit Security Highlight */}
                      <div
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          padding: "8px 12px",
                          fontSize: 11.5,
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 18,
                        }}
                      >
                        <Smartphone size={15} color="#2563eb" style={{ flexShrink: 0 }} />
                        <span>Device Limit: Maximum 2 active admin devices allowed simultaneously.</span>
                      </div>

                      {/* Professional Institutional Security Alert */}
                      <AnimatePresence>
                        {errorInfo && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              background:
                                errorInfo.type === "warning"
                                  ? "#fffbeb"
                                  : errorInfo.type === "lockout"
                                  ? "#fff1f2"
                                  : "#fef2f2",
                              border: `1px solid ${
                                errorInfo.type === "warning"
                                  ? "#fef3c7"
                                  : errorInfo.type === "lockout"
                                  ? "#ffe4e6"
                                  : "#fee2e2"
                              }`,
                              borderRadius: 12,
                              padding: "12px 14px",
                              marginBottom: 18,
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 12,
                              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                            }}
                          >
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background:
                                  errorInfo.type === "warning"
                                    ? "#fef3c7"
                                    : errorInfo.type === "lockout"
                                    ? "#ffe4e6"
                                    : "#fee2e2",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            >
                              {errorInfo.type === "warning" ? (
                                <Smartphone size={15} color="#d97706" />
                              ) : errorInfo.type === "lockout" ? (
                                <ShieldAlert size={15} color="#e11d48" />
                              ) : (
                                <AlertTriangle size={15} color="#dc2626" />
                              )}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 8,
                                  marginBottom: 2,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color:
                                      errorInfo.type === "warning"
                                        ? "#92400e"
                                        : errorInfo.type === "lockout"
                                        ? "#9f1239"
                                        : "#991b1b",
                                  }}
                                >
                                  {errorInfo.title}
                                </span>
                                {errorInfo.badge && (
                                  <span
                                    style={{
                                      fontSize: 10.5,
                                      fontWeight: 700,
                                      background:
                                        errorInfo.type === "warning"
                                          ? "#fde68a"
                                          : errorInfo.type === "lockout"
                                          ? "#fecdd3"
                                          : "#fecaca",
                                      color:
                                        errorInfo.type === "warning"
                                          ? "#78350f"
                                          : errorInfo.type === "lockout"
                                          ? "#881337"
                                          : "#7f1d1d",
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                      letterSpacing: "0.2px",
                                    }}
                                  >
                                    {errorInfo.badge}
                                  </span>
                                )}
                              </div>
                              <p
                                style={{
                                  fontSize: 12,
                                  lineHeight: 1.5,
                                  color:
                                    errorInfo.type === "warning"
                                      ? "#b45309"
                                      : errorInfo.type === "lockout"
                                      ? "#be123c"
                                      : "#b91c1c",
                                  margin: 0,
                                }}
                              >
                                {errorInfo.message}
                              </p>

                              {errorInfo.title === "Device Authorization Limit" && (
                                <button
                                  type="button"
                                  onClick={() => setIsBlockedModalOpen(true)}
                                  style={{
                                    marginTop: "8px",
                                    background: "#fef3c7",
                                    border: "1px solid #fcd34d",
                                    color: "#92400e",
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
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fde68a")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fef3c7")}
                                >
                                  <Smartphone size={13} color="#d97706" />
                                  <span>View Active Device Info</span>
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit Password Button */}
                      <button
                        type="submit"
                        disabled={loading || lockCountdown > 0}
                        style={{
                          width: "100%",
                          padding: "12px",
                          fontSize: 14,
                          fontWeight: 700,
                          background:
                            lockCountdown > 0
                              ? "#f1f5f9"
                              : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                          border: "none",
                          borderRadius: 10,
                          color: lockCountdown > 0 ? "#94a3b8" : "#ffffff",
                          cursor: lockCountdown > 0 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          transition: "all 0.2s ease",
                          boxShadow: lockCountdown === 0 ? "0 4px 12px rgba(37, 99, 235, 0.25)" : "none",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {loading ? (
                          <>
                            <Loader2 size={16} className="spin" /> Verifying Password...
                          </>
                        ) : lockCountdown > 0 ? (
                          `Access Locked (${lockCountdown}s)`
                        ) : (
                          <>
                            <ShieldCheck size={16} /> Authenticate &amp; Request OTP
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  /* ─── SUB-ADMIN PORTAL LOGIN FORM ─── */
                  <>
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          background: "#eef2ff",
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 14px",
                          border: "1px solid #c7d2fe",
                          color: "#4f46e5",
                        }}
                      >
                        <ShieldCheck size={22} />
                      </div>
                      <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.4px", margin: "0 0 6px 0", color: "#0f172a" }}>
                        Sub-Admin Security Portal
                      </h2>
                      <p style={{ color: "#64748b", fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
                        Enter your assigned Sub-Admin password to receive your 2FA verification code.
                      </p>
                    </div>

                    <form onSubmit={handleSubAdminSubmit} autoComplete="off">
                      {/* Password Input */}
                      <div style={{ marginBottom: 18 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 11.5,
                            color: "#475569",
                            marginBottom: 6,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Sub-Admin Password
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showSubPassword ? "text" : "password"}
                            required
                            value={subAdminPassword}
                            onChange={(e) => setSubAdminPassword(e.target.value)}
                            placeholder="••••••••••••"
                            disabled={loading || lockCountdown > 0}
                            style={{
                              width: "100%",
                              background: "#f8fafc",
                              border: "1.5px solid #e2e8f0",
                              padding: "11px 40px 11px 14px",
                              fontSize: 13.5,
                              borderRadius: 10,
                              color: "#0f172a",
                              outline: "none",
                              boxSizing: "border-box",
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSubPassword(!showSubPassword)}
                            disabled={loading || lockCountdown > 0}
                            style={{
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              color: "#94a3b8",
                              cursor: "pointer",
                              padding: 4,
                            }}
                          >
                            {showSubPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Professional Security Alert */}
                      <AnimatePresence>
                        {errorInfo && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            style={{
                              background: "#fef2f2",
                              border: "1px solid #fee2e2",
                              borderRadius: 10,
                              padding: "10px 14px",
                              marginBottom: 16,
                              fontSize: 12.5,
                              color: "#991b1b",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <AlertTriangle size={15} color="#dc2626" />
                            <span>{errorInfo.message}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        type="submit"
                        disabled={loading || lockCountdown > 0}
                        style={{
                          width: "100%",
                          padding: "12px",
                          fontSize: 14,
                          fontWeight: 700,
                          background:
                            lockCountdown > 0
                              ? "#f1f5f9"
                              : "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                          border: "none",
                          borderRadius: 10,
                          color: lockCountdown > 0 ? "#94a3b8" : "#ffffff",
                          cursor: lockCountdown > 0 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                        }}
                      >
                        {loading ? (
                          <>
                            <Loader2 size={16} className="spin" /> Authenticating...
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={16} /> Sign In as Sub-Admin
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              /* ─── STEP 2: 6-DIGIT OTP VERIFICATION ───────────────── */
              <div>
                {/* Form Header */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      background: "#ecfdf5",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 14px",
                      border: "1px solid #a7f3d0",
                      color: "#059669",
                    }}
                  >
                    <ShieldCheck size={24} />
                  </div>
                  <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.4px", margin: "0 0 6px 0", color: "#0f172a" }}>
                    Security Code Verification
                  </h2>
                  <p style={{ color: "#64748b", fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
                    {authMode === "SUBADMIN"
                      ? `Enter the 6-digit code dispatched to ${subAdminMaskedEmail || subAdminVerifiedEmail || "your assigned email"}`
                      : "Enter the 6-digit code dispatched to the authorized institutional administrator email."}
                  </p>
                </div>

                {/* Status Notice */}
                {statusNotice && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      color: "#166534",
                      marginBottom: 16,
                      textAlign: "center",
                    }}
                  >
                    {statusNotice}
                  </div>
                )}

                <form onSubmit={handleOtpSubmit} autoComplete="off">
                  {/* 6-Digit OTP Boxes */}
                  <div style={{ marginBottom: 18 }}>
                    <div className="gf-otp-row">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputsRef.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          disabled={loading || otpTimeLeft === 0}
                          className="gf-otp-box"
                          onFocus={(e) => {
                            e.target.style.borderColor = "#2563eb";
                            e.target.style.background = "#ffffff";
                            e.target.select();
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#cbd5e1";
                            e.target.style.background = "#f8fafc";
                          }}
                        />
                      ))}
                    </div>

                    {/* Timer & Resend Controls */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "#64748b",
                        marginTop: 10,
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span
                          style={{
                            display: "inline-block",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: otpTimeLeft > 60 ? "#10b981" : "#ef4444",
                          }}
                        />
                        <span>Expires in: <strong>{formatTimer(otpTimeLeft)}</strong></span>
                      </div>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading || otpTimeLeft > 240}
                        style={{
                          background: "none",
                          border: "none",
                          color: otpTimeLeft > 240 ? "#94a3b8" : "#2563eb",
                          cursor: otpTimeLeft > 240 ? "not-allowed" : "pointer",
                          fontSize: 12,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: 0,
                        }}
                      >
                        <RotateCw size={12} className={loading ? "spin" : ""} />
                        <span>Resend Code</span>
                      </button>
                    </div>
                  </div>

                  {/* Professional Institutional Security Alert */}
                  <AnimatePresence>
                    {errorInfo && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          background:
                            errorInfo.type === "warning"
                              ? "#fffbeb"
                              : errorInfo.type === "lockout"
                              ? "#fff1f2"
                              : "#fef2f2",
                          border: `1px solid ${
                            errorInfo.type === "warning"
                              ? "#fef3c7"
                              : errorInfo.type === "lockout"
                              ? "#ffe4e6"
                              : "#fee2e2"
                          }`,
                          borderRadius: 12,
                          padding: "12px 14px",
                          marginBottom: 16,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background:
                              errorInfo.type === "warning"
                                ? "#fef3c7"
                                : errorInfo.type === "lockout"
                                ? "#ffe4e6"
                                : "#fee2e2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          <AlertTriangle size={15} color="#dc2626" />
                        </div>

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                              marginBottom: 2,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#991b1b",
                                letterSpacing: "-0.2px",
                              }}
                            >
                              {errorInfo.title}
                            </span>
                            {errorInfo.badge && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: "2px 7px",
                                  borderRadius: 99,
                                  background: "#fecaca",
                                  color: "#7f1d1d",
                                }}
                              >
                                {errorInfo.badge}
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#7f1d1d",
                              lineHeight: 1.45,
                              margin: 0,
                              opacity: 0.92,
                            }}
                          >
                            {errorInfo.message}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit OTP Button */}
                  <button
                    type="submit"
                    disabled={loading || otp.join("").length !== 6 || otpTimeLeft === 0}
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: 14,
                      fontWeight: 700,
                      background:
                        otp.join("").length !== 6 || otpTimeLeft === 0
                          ? "#f1f5f9"
                          : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                      border: "none",
                      borderRadius: 10,
                      color: otp.join("").length !== 6 || otpTimeLeft === 0 ? "#94a3b8" : "#ffffff",
                      cursor: otp.join("").length !== 6 || otpTimeLeft === 0 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.2s ease",
                      boxShadow:
                        otp.join("").length === 6 && otpTimeLeft > 0
                          ? "0 4px 12px rgba(22, 163, 74, 0.25)"
                          : "none",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="spin" /> Verifying Code...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} /> {authMode === "SUBADMIN" ? "Authorize Sub-Admin Session" : "Authorize Admin Session"}
                      </>
                    )}
                  </button>

                  {/* Change Password / Back Button */}
                  <div style={{ textAlign: "center", marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("PASSWORD");
                        setErrorInfo(null);
                        setStatusNotice("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <ArrowLeft size={13} /> {authMode === "SUBADMIN" ? "Re-enter Credentials" : "Re-enter Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Back to Student Portal Link */}
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Link
                to="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#64748b",
                  textDecoration: "none",
                  fontSize: 12.5,
                  fontWeight: 600,
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0f172a")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
              >
                <ArrowLeft size={13} /> Back to Student Portal
              </Link>
            </div>

            {/* Security Footer */}
            <div
              style={{
                marginTop: 20,
                paddingTop: 14,
                borderTop: "1px solid #f1f5f9",
                textAlign: "center",
                fontSize: 11.5,
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                }}
              />
              Security Gateway: Operational &bull; Permanent Session Lock
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        .gf-otp-row {
          display: flex;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 8px;
          width: 100%;
        }
        .gf-otp-box {
          flex: 1;
          min-width: 0;
          max-width: 48px;
          height: 52px;
          text-align: center;
          font-size: 22px;
          font-weight: 800;
          font-family: 'Space Mono', monospace;
          border-radius: 10px;
          border: 1.5px solid #cbd5e1;
          background: #f8fafc;
          color: #0f172a;
          outline: none;
          transition: all 0.15s ease;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .gf-admin-container {
            padding: 16px 14px 40px !important;
            gap: 24px !important;
          }
          .gf-admin-left {
            padding: 10px 4px !important;
          }
          .gf-auth-card {
            padding: 26px 20px !important;
            border-radius: 16px !important;
          }
          .gf-mode-btn {
            font-size: 12px !important;
            padding: 7px 8px !important;
          }
        }

        @media (max-width: 480px) {
          .gf-admin-container {
            padding: 12px 10px 30px !important;
            gap: 18px !important;
          }
          .gf-auth-card {
            padding: 22px 14px !important;
            border-radius: 14px !important;
          }
          .gf-otp-row {
            gap: 4px !important;
          }
          .gf-otp-box {
            height: 46px !important;
            font-size: 18px !important;
            border-radius: 8px !important;
          }
          .gf-mode-btn {
            font-size: 11.5px !important;
            padding: 6px 4px !important;
          }
        }

        @media (max-width: 360px) {
          .gf-auth-card {
            padding: 18px 10px !important;
          }
          .gf-otp-row {
            gap: 3px !important;
          }
          .gf-otp-box {
            height: 42px !important;
            font-size: 16px !important;
            border-radius: 7px !important;
          }
        }
      `}</style>

      {/* Blocked Login Device Information Modal */}
      <BlockedLoginDeviceModal
        isOpen={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
        activeDevices={blockedDevicesData}
        accountIdentifier={authMode === "SUBADMIN" ? (subAdminVerifiedEmail || subAdminEmail || "Sub-Admin") : "Main Administrator"}
        maxAllowed={maxAllowedDevices}
      />
    </motion.div>
  );
}
