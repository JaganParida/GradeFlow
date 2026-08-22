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

  const otpInputsRef = useRef([]);
  const { adminLoginPassword, adminVerifyOtp, adminToken } = useApp();
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

  // ─── Step 1: Submit Password ─────────────────────────────────────
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
      setErrorInfo({
        title: "Device Authorization Limit",
        message: "Admin portal is active on 2 authorized devices (maximum limit: 2). Please log out from another device to continue.",
        badge: "Max 2 Devices",
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
      const res = await adminVerifyOtp(fullOtp);
      if (res && res.success) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        setErrorInfo({
          title: "Verification Failed",
          message: res?.error || "The verification code is incorrect. Please try again.",
          badge: null,
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
      const res = await adminLoginPassword(password);
      if (res && res.step === "OTP_REQUIRED") {
        setOtp(["", "", "", "", "", ""]);
        setOtpTimeLeft(300);
        setStatusNotice("A fresh 6-digit verification code has been dispatched.");
        if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
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
                desc: "Strict policy limit of maximum 2 active authorized admin devices with sliding 7-day session validity.",
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
            {/* ─── STEP 1: PASSWORD ONLY ─────────────────────────── */}
            {step === "PASSWORD" ? (
              <div>
                {/* Form Header */}
                <div style={{ textAlign: "center", marginBottom: 24 }}>
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
                    Admin Access Gateway
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
                                }}
                              >
                                {errorInfo.badge}
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: 12,
                              color:
                                errorInfo.type === "warning"
                                  ? "#78350f"
                                  : errorInfo.type === "lockout"
                                  ? "#881337"
                                  : "#7f1d1d",
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

                  {/* Submit Button */}
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
                    onMouseEnter={(e) => {
                      if (!loading && lockCountdown === 0) e.currentTarget.style.filter = "brightness(1.08)";
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && lockCountdown === 0) e.currentTarget.style.filter = "none";
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
                    Enter the 6-digit code dispatched to the authorized institutional administrator email.
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
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 8 }}>
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
                          style={{
                            width: 48,
                            height: 52,
                            textAlign: "center",
                            fontSize: 22,
                            fontWeight: 800,
                            fontFamily: "'Space Mono', monospace",
                            borderRadius: 10,
                            border: "1.5px solid #cbd5e1",
                            background: "#f8fafc",
                            color: "#0f172a",
                            outline: "none",
                            transition: "all 0.15s ease",
                            boxSizing: "border-box",
                          }}
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
                        <ShieldCheck size={16} /> Authorize Admin Session
                      </>
                    )}
                  </button>

                  {/* Change Password / Back Button */}
                  <div style={{ textAlign: "center", marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("PASSWORD");
                        setError("");
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
                      <ArrowLeft size={13} /> Re-enter Password
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
              Security Gateway: Operational &bull; 7-Day Session Sliding Lock
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .gf-admin-container {
            padding: 16px 14px 40px !important;
            gap: 24px !important;
          }
          .gf-admin-left {
            padding: 10px 4px !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
