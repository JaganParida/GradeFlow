import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import Testimonials from "./pages/Testimonials";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import FeedbackModal from "./components/FeedbackModal";
import { useApp } from "./context/AppContext";
import { AlertTriangle, X } from "lucide-react";

function ProtectedRoute({ children }) {
  const { hasActiveSession } = useApp();
  if (!hasActiveSession) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const [rateLimitError, setRateLimitError] = useState(null);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 429) {
          setRateLimitError(
            error.response.data?.message ||
            "The server is experiencing high traffic. Please wait a moment and try again."
          );
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <>
      <Navbar />
      <FeedbackModal />
      
      {/* Global Rate Limit Alert */}
      {rateLimitError && (
        <div style={{
          position: "fixed",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          background: "rgba(239, 68, 68, 0.95)",
          border: "1px solid #ef4444",
          color: "#fff",
          padding: "12px 24px",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 8px 32px rgba(239, 68, 68, 0.3)",
          backdropFilter: "blur(8px)",
          maxWidth: "90vw",
          animation: "slideDown 0.3s ease-out"
        }}>
          <AlertTriangle size={20} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{rateLimitError}</span>
          <button 
            onClick={() => setRateLimitError(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              padding: 4,
              marginLeft: 8,
              opacity: 0.8
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard/:regNo" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analytics/:regNo" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}
