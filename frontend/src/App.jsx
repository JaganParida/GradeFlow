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
import Timetable from "./pages/Timetable";
import AttendanceTracker from "./pages/AttendanceTracker";
import FeedbackModal from "./components/FeedbackModal";
import UpgradeModal from "./components/UpgradeModal";
import { DashboardSkeleton } from "./components/LoadingSpinner";
import { useApp } from "./context/AppContext";
import { AlertTriangle, X } from "lucide-react";
import ErrorBoundary from "./components/system/ErrorBoundary";
import NetworkStatusListener from "./components/system/NetworkStatusListener";
import MaintenanceGuard from "./components/system/MaintenanceGuard";
import {
  NotFoundState,
  RateLimitState,
  MaintenanceState,
  OfflineState,
  SessionExpiredState,
  ServerErrorState,
  ServiceUnavailableState,
  UnauthorizedState,
} from "./components/system/SystemState";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.replace("#", ""));
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 50);
        return;
      }
    }
    // Instant scroll to top on route change to prevent any layout jumping
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [pathname, hash]);

  return null;
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "100vh",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {children}
    </motion.div>
  );
}

function ProtectedRoute({ children }) {
  const { hasActiveSession, authChecking } = useApp();
  if (authChecking) {
    return <DashboardSkeleton />;
  }
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
    } else if (path.startsWith("/timetable")) {
      document.title = "GradeFlow — Class Timetable & Schedule";
    } else if (path.startsWith("/attendance")) {
      document.title = "GradeFlow — Attendance Intelligence & Simulator";
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
        const url = String(error.config?.url || "");
        const isStudentAuthRoute =
          url.includes("/auth/student") ||
          url.includes("student-send-otp") ||
          url.includes("student-verify-otp") ||
          url.includes("student-me");

        // If device lost connection or request failed due to offline network drop
        if (
          !navigator.onLine ||
          error.code === "ERR_NETWORK" ||
          error.message === "Network Error" ||
          (error.request && !error.response)
        ) {
          window.dispatchEvent(new Event("gradeflow:offline"));
        }

        if (error.response && error.response.status === 429 && !isStudentAuthRoute) {
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
    <ErrorBoundary>
      <ScrollToTop />
      <NetworkStatusListener />
      <Navbar />

      {rateLimitError && (
        <RateLimitState
          message={rateLimitError}
          onRetry={() => setRateLimitError(null)}
        />
      )}

      <MaintenanceGuard>
        <FeedbackModal />
        <UpgradeModal />
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
              path="/timetable/:studentId"
              element={
                <PageTransition>
                  <Timetable />
                </PageTransition>
              }
            />
            <Route
              path="/timetable"
              element={
                <PageTransition>
                  <Timetable />
                </PageTransition>
              }
            />
            <Route
              path="/attendance/:studentId"
              element={
                <PageTransition>
                  <AttendanceTracker />
                </PageTransition>
              }
            />
            <Route
              path="/attendance"
              element={
                <PageTransition>
                  <AttendanceTracker />
                </PageTransition>
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

            {/* ── Direct System State & Preview Routes ── */}
            <Route path="/403" element={<PageTransition><UnauthorizedState /></PageTransition>} />
            <Route path="/access-denied" element={<PageTransition><UnauthorizedState /></PageTransition>} />
            <Route path="/maintenance" element={<PageTransition><MaintenanceState /></PageTransition>} />
            <Route path="/offline" element={<PageTransition><OfflineState /></PageTransition>} />
            <Route path="/session-expired" element={<PageTransition><SessionExpiredState /></PageTransition>} />
            <Route path="/rate-limit" element={<PageTransition><RateLimitState /></PageTransition>} />
            <Route path="/500" element={<PageTransition><ServerErrorState /></PageTransition>} />
            <Route path="/503" element={<PageTransition><ServiceUnavailableState /></PageTransition>} />

            {/* Catch-All 404 Route */}
            <Route
              path="*"
              element={
                <PageTransition>
                  <NotFoundState />
                </PageTransition>
              }
            />
          </Routes>
        </AnimatePresence>
      </MaintenanceGuard>
    </ErrorBoundary>
  );
}
