import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Mail,
  KeyRound,
  ShieldAlert,
  Server
} from "lucide-react";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Advanced Security: Client-Side Attempt Counter & Lockout Timer
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockCountdown, setLockCountdown] = useState(0);

  const { adminLogin, adminToken } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (adminToken) {
      navigate("/admin/dashboard");
    }
  }, [adminToken, navigate]);

  // Handle Lockout Countdown Timer
  useEffect(() => {
    let timer;
    if (lockCountdown > 0) {
      timer = setInterval(() => {
        setLockCountdown((prev) => prev - 1);
      }, 1000);
    } else if (lockCountdown === 0 && failedAttempts >= 5) {
      setFailedAttempts(0); // Reset attempts after cooldown
    }
    return () => clearInterval(timer);
  }, [lockCountdown, failedAttempts]);

  // Sanitize Input Fields
  function sanitizeInput(val) {
    return String(val || "").trim().replace(/['"<>]/g, "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (lockCountdown > 0) return;

    const cleanEmail = sanitizeInput(form.email);
    const cleanPassword = form.password;

    if (!cleanEmail || !cleanPassword) {
      setError("Please fill in all required credentials.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await adminLogin(cleanEmail, cleanPassword);
      setForm({ email: "", password: "" });
      navigate("/admin/dashboard");
    } catch (err) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts >= 5) {
        setLockCountdown(45);
        setError("Security Alert: Too many failed attempts. Login locked for 45 seconds.");
      } else {
        const remaining = 5 - nextAttempts;
        setError(
          err.response?.data?.message ||
            `Invalid credentials. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining before lockout.`
        );
      }
      setForm((prev) => ({ ...prev, password: "" }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#0a0c10",
        color: "#f3f4f6",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Subtle Grid Backdrop Lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.6,
        }}
      />

      {/* 2-SPLIT CONTAINER */}
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* LEFT SPLIT: PROFESSIONAL BRANDING & TECHNICAL SUMMARY */}
        <div
          style={{
            padding: "56px 64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "rgba(13, 16, 23, 0.7)",
            backdropFilter: "blur(12px)",
            borderRight: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          {/* Top Header */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 12px",
                borderRadius: 4,
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                color: "#60a5fa",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: 28,
              }}
            >
              <ShieldCheck size={13} /> GradeFlow Security Portal
            </div>

            <h1
              style={{
                fontSize: 34,
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: "-0.5px",
                marginBottom: 14,
                color: "#ffffff",
              }}
            >
              Institutional Administration
            </h1>

            <p
              style={{
                color: "#9ca3af",
                fontSize: 14,
                lineHeight: 1.6,
                maxWidth: 460,
                marginBottom: 36,
              }}
            >
              Enterprise management suite for university result processing, branch ranking leaderboards, and automated backlog tracking.
            </p>
          </div>

          {/* Minimalist Tech Feature List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "20px 0" }}>
            {[
              {
                icon: <Lock size={16} color="#60a5fa" />,
                title: "Zero-Trust Session Isolation",
                desc: "HMAC JWT authentication with isolated token sandbox and attempt rate limiting.",
              },
              {
                icon: <BarChart3 size={16} color="#818cf8" />,
                title: "Real-Time Ranking Engine",
                desc: "Instant SGPA/CGPA competition rank generation across university & branch levels.",
              },
              {
                icon: <Zap size={16} color="#34d399" />,
                title: "Automated Backlog Tracking",
                desc: "Live Excel sync evaluating uncleared backlogs, recheckings, and clearance.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                style={{
                  padding: "14px 18px",
                  borderRadius: 6,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    padding: 8,
                    borderRadius: 4,
                    background: "rgba(0, 0, 0, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  {feat.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: "#f3f4f6" }}>
                    {feat.title}
                  </h4>
                  <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
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
              justifyContent: "space-between",
              paddingTop: 20,
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={13} color="#34d399" />
              <span>AES-256 Encrypted</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Server size={13} color="#60a5fa" />
              <span>v2.4 Production Gateway</span>
            </div>
          </div>
        </div>

        {/* RIGHT SPLIT: CLEAN PROFESSIONAL FORM PANEL */}
        <div
          style={{
            padding: "48px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              width: "100%",
              maxWidth: 400,
              padding: 32,
              background: "rgba(17, 24, 39, 0.65)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 8,
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Form Header */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: "rgba(59, 130, 246, 0.1)",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  color: "#60a5fa",
                }}
              >
                <KeyRound size={22} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px", marginBottom: 4, color: "#ffffff" }}>
                Admin Sign In
              </h2>
              <p style={{ color: "#9ca3af", fontSize: 13 }}>
                Enter authorized credentials to continue
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} autoComplete="off">
              {/* Email Input */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "#9ca3af",
                    marginBottom: 6,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    color="#6b7280"
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="admin@gradeflow.com"
                    required
                    disabled={lockCountdown > 0}
                    autoComplete="off"
                    spellCheck="false"
                    style={{
                      width: "100%",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      padding: "11px 14px 11px 38px",
                      fontSize: 13,
                      borderRadius: 6,
                      color: "#ffffff",
                      transition: "all 0.15s",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.1)")}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: 22 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "#9ca3af",
                    marginBottom: 6,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    color="#6b7280"
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••••••"
                    required
                    disabled={lockCountdown > 0}
                    autoComplete="off"
                    spellCheck="false"
                    style={{
                      width: "100%",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      padding: "11px 40px 11px 38px",
                      fontSize: 13,
                      borderRadius: 6,
                      color: "#ffffff",
                      letterSpacing: showPassword ? "normal" : "2px",
                      transition: "all 0.15s",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.1)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={lockCountdown > 0}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#6b7280",
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

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    style={{
                      color: "#f87171",
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderLeft: "3px solid #ef4444",
                      padding: "10px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      marginBottom: 18,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {lockCountdown > 0 ? (
                      <ShieldAlert size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                    )}
                    <div>
                      {error}
                      {lockCountdown > 0 && (
                        <div style={{ fontWeight: 700, marginTop: 2, color: "#fca5a5" }}>
                          Unlock in: {lockCountdown}s
                        </div>
                      )}
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
                  fontWeight: 600,
                  background:
                    lockCountdown > 0
                      ? "rgba(255, 255, 255, 0.06)"
                      : "linear-gradient(135deg, #2563eb, #3b82f6)",
                  border: "none",
                  borderRadius: 6,
                  color: lockCountdown > 0 ? "#6b7280" : "#ffffff",
                  cursor: lockCountdown > 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s",
                  boxShadow: lockCountdown === 0 ? "0 4px 14px rgba(37, 99, 235, 0.3)" : "none",
                }}
              >
                {loading ? (
                  "Authenticating..."
                ) : lockCountdown > 0 ? (
                  `Access Locked (${lockCountdown}s)`
                ) : (
                  <>
                    <ShieldCheck size={16} /> Authenticate Admin
                  </>
                )}
              </button>
            </form>

            {/* Security Footer */}
            <div
              style={{
                marginTop: 22,
                paddingTop: 14,
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                textAlign: "center",
                fontSize: 11,
                color: "#6b7280",
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
                  background: "#34d399",
                }}
              />
              Security Status: Operational
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
