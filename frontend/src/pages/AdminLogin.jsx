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
    const cleanPassword = form.password; // Do not trim password to preserve special characters

    if (!cleanEmail || !cleanPassword) {
      setError("Please fill in all required credentials.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await adminLogin(cleanEmail, cleanPassword);
      // Clear sensitive form state from memory on success
      setForm({ email: "", password: "" });
      navigate("/admin/dashboard");
    } catch (err) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts >= 5) {
        setLockCountdown(45); // Lock form for 45 seconds after 5 failed attempts
        setError("Security Alert: Too many failed attempts. Login locked for 45 seconds.");
      } else {
        const remaining = 5 - nextAttempts;
        setError(
          err.response?.data?.message ||
            `Invalid credentials. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining before lockout.`
        );
      }
      // Wipe password field on failure for security
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
      transition={{ duration: 0.5 }}
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#080a0f",
        color: "var(--text-main)",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Dynamic Ambient Background Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: "55vw",
          height: "55vw",
          maxWidth: 700,
          maxHeight: 700,
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: "55vw",
          height: "55vw",
          maxWidth: 700,
          maxHeight: 700,
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* 2-SPLIT CONTAINER */}
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* LEFT SPLIT: BRANDING & SYSTEM CAPABILITIES (VISUAL PANEL) */}
        <div
          style={{
            padding: "48px 56px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "rgba(13, 17, 23, 0.4)",
            backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
            position: "relative",
          }}
        >
          {/* Top Brand Header */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 20,
                background: "rgba(124, 58, 237, 0.12)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                color: "#a855f7",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: 32,
              }}
            >
              <ShieldCheck size={14} /> Institutional Admin Portal
            </div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: 38,
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: "-1px",
                marginBottom: 16,
                background: "linear-gradient(135deg, #ffffff 30%, rgba(255, 255, 255, 0.6) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              GradeFlow Secure Control Center
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                color: "var(--text-secondary)",
                fontSize: 15,
                lineHeight: 1.6,
                maxWidth: 480,
                marginBottom: 40,
              }}
            >
              Enterprise-grade administrative suite for university academic results, dynamic leaderboard rankings, and real-time backlog management.
            </motion.p>
          </div>

          {/* Central Feature Showcase Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, margin: "24px 0" }}>
            {[
              {
                icon: <Lock size={20} color="#a855f7" />,
                title: "Zero-Trust Encrypted Auth",
                desc: "Isolated session sandbox with HMAC JWT authentication and rate-limit shields.",
                bg: "rgba(168, 85, 247, 0.08)",
                border: "rgba(168, 85, 247, 0.2)",
              },
              {
                icon: <BarChart3 size={20} color="#3ea6ff" />,
                title: "Real-Time Ranking Engine",
                desc: "Instant SGPA/CGPA competition rank generation across university & branch levels.",
                bg: "rgba(62, 166, 255, 0.08)",
                border: "rgba(62, 166, 255, 0.2)",
              },
              {
                icon: <Zap size={20} color="#34d399" />,
                title: "Automated Backlog Tracking",
                desc: "Live Excel sync detecting active student backlogs, recheckings, and clearance.",
                bg: "rgba(52, 211, 153, 0.08)",
                border: "rgba(52, 211, 153, 0.2)",
              },
            ].map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                whileHover={{ x: 6, transition: { duration: 0.2 } }}
                style={{
                  padding: "16px 20px",
                  borderRadius: 16,
                  background: feat.bg,
                  border: `1px solid ${feat.border}`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    background: "rgba(0, 0, 0, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {feat.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "#fff" }}>
                    {feat.title}
                  </h4>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Security Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 24,
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={14} color="#34d399" />
              <span>AES-256 SSL Encrypted</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Server size={14} color="#60a5fa" />
              <span>v2.4 Production Gateway</span>
            </div>
          </div>
        </div>

        {/* RIGHT SPLIT: AUTHENTICATION FORM PANEL */}
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
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              width: "100%",
              maxWidth: 440,
              padding: 36,
              background: "rgba(18, 22, 32, 0.75)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 24,
              boxShadow: "0 32px 80px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
            // Disable right click on auth card to deter basic inspect element tampering
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Lock Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <motion.div
                animate={{
                  boxShadow: [
                    "0 8px 32px rgba(124, 58, 237, 0.25)",
                    "0 8px 48px rgba(124, 58, 237, 0.5)",
                    "0 8px 32px rgba(124, 58, 237, 0.25)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 64,
                  height: 64,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.1), #7c3aed)",
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                <KeyRound color="#fff" size={28} />
              </motion.div>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>
                Admin Sign In
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Enter your authorized credentials to access dashboard
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} autoComplete="off">
              {/* Email Input */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Administrator Email
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={18}
                    color="var(--text-muted)"
                    style={{
                      position: "absolute",
                      left: 14,
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
                      background: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      padding: "14px 16px 14px 44px",
                      fontSize: 14,
                      borderRadius: 12,
                      color: "#fff",
                      transition: "all 0.2s",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.12)")}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Secure Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={18}
                    color="var(--text-muted)"
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
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••••••"
                    required
                    disabled={lockCountdown > 0}
                    autoComplete="off"
                    spellCheck="false"
                    style={{
                      width: "100%",
                      background: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      padding: "14px 48px 14px 44px",
                      fontSize: 14,
                      borderRadius: 12,
                      color: "#fff",
                      letterSpacing: showPassword ? "normal" : "2px",
                      transition: "all 0.2s",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.12)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={lockCountdown > 0}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 6,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Security Error / Lockout Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    style={{
                      color: "#f87171",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderLeft: "3px solid #ef4444",
                      padding: "12px 14px",
                      borderRadius: 10,
                      fontSize: 13,
                      marginBottom: 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {lockCountdown > 0 ? (
                      <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                    )}
                    <div>
                      {error}
                      {lockCountdown > 0 && (
                        <div style={{ fontWeight: 800, marginTop: 4, color: "#fca5a5" }}>
                          Unlock in: {lockCountdown}s
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                whileHover={lockCountdown === 0 ? { scale: 1.02, boxShadow: "0 8px 25px rgba(124, 58, 237, 0.45)" } : {}}
                whileTap={lockCountdown === 0 ? { scale: 0.98 } : {}}
                className="btn btn-primary"
                type="submit"
                disabled={loading || lockCountdown > 0}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "16px",
                  fontSize: 15,
                  fontWeight: 700,
                  background:
                    lockCountdown > 0
                      ? "rgba(255,255,255,0.08)"
                      : "linear-gradient(135deg, #6366f1, #7c3aed, #a855f7)",
                  border: "none",
                  borderRadius: 12,
                  color: lockCountdown > 0 ? "var(--text-muted)" : "#fff",
                  cursor: lockCountdown > 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s",
                }}
              >
                {loading ? (
                  "Authenticating Session..."
                ) : lockCountdown > 0 ? (
                  `Access Locked (${lockCountdown}s)`
                ) : (
                  <>
                    <ShieldCheck size={18} /> Authenticate Admin
                  </>
                )}
              </motion.button>
            </form>

            {/* Bottom Security Info Footer */}
            <div
              style={{
                marginTop: 28,
                paddingTop: 18,
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                textAlign: "center",
                fontSize: 11,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#34d399",
                  boxShadow: "0 0 8px #34d399",
                }}
              />
              System Status: All Security Protocols Active &amp; Operational
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
