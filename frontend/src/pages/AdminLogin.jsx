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
            whileHover={{ scale: 1.05 }}
            style={{
              width: 72,
              height: 72,
              background: "linear-gradient(135deg, var(--accent), #7c3aed)",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 8px 32px rgba(124, 58, 237, 0.4)",
            }}
          >
            <Lock color="#fff" size={36} />
          </motion.div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Admin Portal</h1>
          <p style={{ color: "var(--secondary)", fontSize: 15, marginTop: 6 }}>
            Secure GradeFlow Administration
          </p>
        </div>

        <motion.div 
          className="card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ 
            padding: 32, 
            background: "rgba(20,20,20,0.6)", 
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)",
            borderRadius: 24
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "var(--secondary)",
                  marginBottom: 8,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.5
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
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
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
                  fontSize: 13,
                  color: "var(--secondary)",
                  marginBottom: 8,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.5
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
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
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
                    color: "var(--secondary)",
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
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  color: "#ef4444",
                  background: "rgba(239, 68, 68, 0.1)",
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
              </motion.p>
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
