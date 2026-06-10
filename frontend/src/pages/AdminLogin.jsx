import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { motion } from "framer-motion";
import { Lock, ArrowRight, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { adminLogin, adminToken } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (adminToken) {
      navigate("/admin/dashboard");
    }
  }, [adminToken, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminLogin(form.email, form.password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <motion.div
            animate={{ boxShadow: ["0 8px 32px rgba(124,58,237,0.3)", "0 8px 40px rgba(124,58,237,0.5)", "0 8px 32px rgba(124,58,237,0.3)"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 72,
              height: 72,
              background: "linear-gradient(135deg, #ffffff18, #7c3aed)",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <Lock color="#fff" size={32} />
          </motion.div>
          <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>GradeFlow</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>Admin Portal</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Restricted access — authorized personnel only
          </p>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ 
            padding: 32, 
            background: "rgba(20,20,20,0.75)", 
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
            borderRadius: 24
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@gradeflow.com"
                required
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  padding: "14px 16px",
                  fontSize: 15,
                  borderRadius: 12,
                  transition: "all 0.2s"
                }}
              />
            </div>
            
            <div style={{ marginBottom: 32 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    padding: "14px 16px",
                    paddingRight: 48,
                    fontSize: 15,
                    borderRadius: 12,
                    letterSpacing: showPassword ? "normal" : 2,
                    transition: "all 0.2s"
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
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  color: "var(--danger)",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderLeft: "3px solid var(--danger)",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid rgba(239, 68, 68, 0.2)"
                }}
              >
                <AlertTriangle size={16} /> {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(124, 58, 237, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "16px",
                fontSize: 16,
                fontWeight: 700,
                background: "linear-gradient(135deg, var(--accent), #7c3aed)",
                border: "none",
                borderRadius: 12,
                marginTop: 8
              }}
            >
              {loading ? "Authenticating..." : "Login to Dashboard"}
              {!loading && <ArrowRight size={20} />}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
