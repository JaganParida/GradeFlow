import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { motion } from "framer-motion";
import { Lock, ArrowRight, AlertTriangle } from "lucide-react";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "linear-gradient(135deg, var(--accent), #7c3aed)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 0 40px rgba(62,166,255,0.3)",
            }}
          >
            <Lock color="#fff" size={32} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Admin Portal</h1>
          <p style={{ color: "var(--secondary)", fontSize: 14, marginTop: 4 }}>
            GradeFlow Administration
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "var(--secondary)",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@gradeflow.com"
                required
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "var(--secondary)",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p
                style={{
                  color: "var(--danger)",
                  fontSize: 13,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <AlertTriangle size={16} /> {error}
              </p>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px",
              }}
            >
              {loading ? "Logging in..." : "Login"}
              {!loading && <ArrowRight size={18} />}
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
