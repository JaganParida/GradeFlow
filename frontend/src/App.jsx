import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import FeedbackModal from "./components/FeedbackModal";
import UpgradeModal from "./components/UpgradeModal";
import { DashboardSkeleton } from "./components/LoadingSpinner";
import { decodeStudentId, isEncryptedToken } from "./utils/studentIdEncoder";

// Helper for resilient lazy loading with auto-recovery on deployment chunk hash changes
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      const isChunkError =
        error?.name === "ChunkLoadError" ||
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("dynamically imported module") ||
        error?.message?.includes("Expected a JavaScript-or-Wasm module script");

      if (isChunkError) {
        const retryKey = "gradeflow_chunk_retry_" + window.location.pathname;
        const hasRetried = sessionStorage.getItem(retryKey);
        if (!hasRetried) {
          sessionStorage.setItem(retryKey, "true");
          window.location.reload();
          return new Promise(() => {}); // Wait for page refresh
        }
      }
      throw error;
    }
  });

// Lazy-loaded route pages with automatic chunk retry protection
const Home = lazyWithRetry(() => import("./pages/Home"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const Analytics = lazyWithRetry(() => import("./pages/Analytics"));
const Leaderboard = lazyWithRetry(() => import("./pages/Leaderboard"));
const Testimonials = lazyWithRetry(() => import("./pages/Testimonials"));
const AboutDev = lazyWithRetry(() => import("./pages/AboutDev"));
const Resources = lazyWithRetry(() => import("./pages/Resources"));
const AdminLogin = lazyWithRetry(() => import("./pages/AdminLogin"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const Timetable = lazyWithRetry(() => import("./pages/Timetable"));
const AttendanceTracker = lazyWithRetry(() => import("./pages/AttendanceTracker"));
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
  const { hasActiveSession, authChecking, studentSession, adminToken } = useApp();
  const params = useParams();
  const rawParam = params.studentId || params.regNo || params.id;

  if (authChecking) {
    return <DashboardSkeleton />;
  }

  // 1. If not authenticated at all -> Show 403 UnauthorizedState
  if (!hasActiveSession && !adminToken) {
    return <UnauthorizedState />;
  }

  // 2. If authenticated as student, but URL param belongs to another student -> Show 403
  if (studentSession?.regNo && rawParam && !adminToken) {
    const targetReg = isEncryptedToken(rawParam) ? decodeStudentId(rawParam) : rawParam;
    if (targetReg && targetReg.toUpperCase() !== studentSession.regNo.toUpperCase()) {
      return <UnauthorizedState />;
    }
  }

  return children;
}

function AdminRouteGuard({ children, allowGate = false }) {
  const { adminToken, authChecking } = useApp();

  if (authChecking) {
    return <DashboardSkeleton />;
  }

  // For /admin/dashboard: strictly requires active admin authorization
  if (!allowGate && !adminToken) {
    return <UnauthorizedState />;
  }

  return children;
}

export default function App() {
  const [rateLimitError, setRateLimitError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { setSessionRevokedNotice, setStudentSession, setStudentData } = useApp();

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

        if (error.response && error.response.status === 429 && !isStudentAuthRoute) {
          setRateLimitError(
            error.response.data?.message ||
              "The server is experiencing high traffic. Please wait a moment and try again.",
          );
        }

        // Gracefully handle 401 Session Revocation / Termination on any student route
        if (error.response && error.response.status === 401 && !isStudentAuthRoute) {
          const code = error.response.data?.code;
          const msg = error.response.data?.message || "";
          if (code === "SESSION_TERMINATED" || msg.includes("logged out") || msg.includes("Session ended")) {
            setStudentSession(null);
            setStudentData(null);
            setSessionRevokedNotice(
              "Your session ended because your account was logged in or transferred to another device."
            );
            navigate("/", { replace: true });
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [setSessionRevokedNotice, setStudentSession, setStudentData, navigate]);

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
        <Suspense fallback={<DashboardSkeleton />}>
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
              path="/dashboard"
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
                <ProtectedRoute>
                  <PageTransition>
                    <Timetable />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/timetable"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Timetable />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/:studentId"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <AttendanceTracker />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <AttendanceTracker />
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
                <AdminRouteGuard allowGate={true}>
                  <PageTransition>
                    <AdminLogin />
                  </PageTransition>
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/login"
              element={
                <AdminRouteGuard allowGate={true}>
                  <PageTransition>
                    <AdminLogin />
                  </PageTransition>
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRouteGuard allowGate={false}>
                  <PageTransition>
                    <AdminDashboard />
                  </PageTransition>
                </AdminRouteGuard>
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
        </Suspense>
      </MaintenanceGuard>
    </ErrorBoundary>
  );
}
