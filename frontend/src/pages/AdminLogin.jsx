import { useState, useEffect } from "react";
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
  Mail,
  KeyRound,
  ShieldAlert,
  Server,
  ArrowLeft
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
      const res = await adminLogin(cleanEmail, cleanPassword);
      if (res && res.success) {
        setForm({ email: "", password: "" });
        navigate("/admin/dashboard");
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 5) {
          setLockCountdown(45);
          setError("Security Alert: Too many failed attempts. Login locked for 45 seconds.");
        } else {
          const remaining = 5 - nextAttempts;
          const serverMsg = res?.error || "Invalid email or password.";
          setError(
            `${serverMsg} (${remaining} attempt${remaining > 1 ? "s" : ""} remaining before temporary lockout)`
          );
        }
        setForm((prev) => ({ ...prev, password: "" }));
      }
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
            `Invalid credentials. (${remaining} attempt${remaining > 1 ? "s" : ""} remaining before lockout)`
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
        {/* LEFT SPLIT: PROFESSIONAL BRANDING & TECHNICAL SUMMARY */}
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
              Enterprise portal for university grade management, branch ranking verification, and real-time student intelligence.
            </p>
          </div>

          {/* Minimalist Tech Feature List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            {[
              {
                icon: <Lock size={16} color="#2563eb" />,
                bg: "#eff6ff",
                border: "#dbeafe",
                title: "Zero-Trust Session Isolation",
                desc: "HMAC JWT authentication with isolated token sandbox and attempt rate limiting.",
              },
              {
                icon: <BarChart3 size={16} color="#8b5cf6" />,
                bg: "#f5f3ff",
                border: "#ede9fe",
                title: "Real-Time Ranking Engine",
                desc: "Instant SGPA/CGPA competition rank generation across university & branch levels.",
              },
              {
                icon: <Zap size={16} color="#10b981" />,
                bg: "#ecfdf5",
                border: "#d1fae5",
                title: "Automated Backlog Tracking",
                desc: "Live Excel sync evaluating uncleared backlogs, recheckings, and clearance.",
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
              <span>AES-256 TLS Encrypted</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Server size={14} color="#2563eb" />
              <span>v2.4 Production Gateway</span>
            </div>
          </div>
        </div>

        {/* RIGHT SPLIT: CLEAN LIGHT PROFESSIONAL FORM CARD */}
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
              maxWidth: 420,
              padding: "36px 32px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 20,
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)",
              boxSizing: "border-box",
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
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
                Admin Sign In
              </h2>
              <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
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
                    fontSize: 11.5,
                    color: "#475569",
                    marginBottom: 6,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Admin Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
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
                      background: "#f8fafc",
                      border: "1.5px solid #e2e8f0",
                      padding: "11px 14px 11px 40px",
                      fontSize: 13.5,
                      borderRadius: 10,
                      color: "#0f172a",
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
                </div>
              </div>

              {/* Password Input */}
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
                  Password
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
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••••••"
                    required
                    disabled={lockCountdown > 0}
                    autoComplete="off"
                    spellCheck="false"
                    style={{
                      width: "100%",
                      background: "#f8fafc",
                      border: "1.5px solid #e2e8f0",
                      padding: "11px 40px 11px 40px",
                      fontSize: 13.5,
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
                    disabled={lockCountdown > 0}
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

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    style={{
                      color: "#991b1b",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderLeft: "3.5px solid #ef4444",
                      padding: "10px 12px",
                      borderRadius: 8,
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
                        <div style={{ fontWeight: 700, marginTop: 2, color: "#b91c1c" }}>
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
                  fontWeight: 700,
                  background:
                    lockCountdown > 0
                      ? "#f1f5f9"
                      : "#0f172a",
                  border: "none",
                  borderRadius: 10,
                  color: lockCountdown > 0 ? "#94a3b8" : "#ffffff",
                  cursor: lockCountdown > 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                  boxShadow: lockCountdown === 0 ? "0 4px 12px rgba(15, 23, 42, 0.12)" : "none",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (!loading && lockCountdown === 0) e.currentTarget.style.background = "#1e293b";
                }}
                onMouseLeave={(e) => {
                  if (!loading && lockCountdown === 0) e.currentTarget.style.background = "#0f172a";
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
              Security Gateway: Operational
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
