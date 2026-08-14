import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import Testimonials from "./pages/Testimonials";
import AboutDev from "./pages/AboutDev";
import Resources from "./pages/Resources";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import FeedbackModal from "./components/FeedbackModal";
import UpgradeModal from "./components/UpgradeModal";
import { useApp } from "./context/AppContext";
import { AlertTriangle, X } from "lucide-react";

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
      style={{ width: "100%", minHeight: "100%" }}
    >
      {children}
    </motion.div>
  );
}

function ProtectedRoute({ children }) {
  const { hasActiveSession } = useApp();
  if (!hasActiveSession) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const [rateLimitError, setRateLimitError] = useState(null);
  const location = useLocation();

  // Sync document title with current page route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") {
      document.title = "GradeFlow — Academic Analytics & GPA Intelligence";
    } else if (path.startsWith("/dashboard")) {
      document.title = "GradeFlow — Student Dashboard";
    } else if (path.startsWith("/analytics")) {
      document.title = "GradeFlow — Performance Analytics";
    } else if (path === "/leaderboard") {
      document.title = "GradeFlow — University Leaderboard";
    } else if (path === "/resources") {
      document.title = "GradeFlow — Academic Resources & Curriculum";
    } else if (path === "/testimonials") {
      document.title = "GradeFlow — Student Reviews & Feedback";
    } else if (path === "/about-dev" || path === "/about") {
      document.title = "GradeFlow — About Developer";
    } else if (path === "/admin" || path === "/admin/login") {
      document.title = "GradeFlow — Admin Portal";
    } else if (path === "/admin/dashboard") {
      document.title = "GradeFlow — Admin Dashboard & Data Center";
    } else {
      document.title = "GradeFlow — Academic Analytics";
    }
  }, [location.pathname]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 429) {
          setRateLimitError(
            error.response.data?.message ||
              "The server is experiencing high traffic. Please wait a moment and try again.",
          );
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <>
      <Navbar />
      <FeedbackModal />
      <UpgradeModal />

      {rateLimitError && (
        <div
          style={{
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
            animation: "slideDown 0.3s ease-out",
          }}
        >
          <AlertTriangle size={20} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {rateLimitError}
          </span>
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
              opacity: 0.8,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path="/dashboard/:regNo"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/:regNo"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Analytics />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Analytics />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Leaderboard />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/testimonials"
            element={
              <PageTransition>
                <Testimonials />
              </PageTransition>
            }
          />
          <Route
            path="/about-dev"
            element={
              <PageTransition>
                <AboutDev />
              </PageTransition>
            }
          />
          <Route
            path="/about"
            element={
              <PageTransition>
                <AboutDev />
              </PageTransition>
            }
          />
          <Route
            path="/resources"
            element={
              <PageTransition>
                <Resources />
              </PageTransition>
            }
          />
          <Route
            path="/admin"
            element={
              <PageTransition>
                <AdminLogin />
              </PageTransition>
            }
          />
          <Route
            path="/admin/login"
            element={
              <PageTransition>
                <AdminLogin />
              </PageTransition>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <PageTransition>
                <AdminDashboard />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  );
}
