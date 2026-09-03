import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import FeedbackModal from "./components/FeedbackModal";
import UpgradeModal from "./components/UpgradeModal";
import {
  AdminDashboardSkeleton,
  AdminLoginSkeleton,
  AnalyticsSkeleton,
  AttendanceSkeleton,
  DashboardSkeleton,
  LandingSkeleton,
  LeaderboardSkeleton,
  PublicPageSkeleton,
  ResourcesSkeleton,
  TestimonialsSkeleton,
  TimetableSkeleton,
} from "./components/LoadingSpinner";
import { decodeStudentId, isEncryptedToken } from "./utils/studentIdEncoder";
import { applyRouteMetadata } from "./utils/seo";

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
const PublicPages = lazyWithRetry(() => import("./pages/PublicPages"));
const AdminLogin = lazyWithRetry(() => import("./pages/AdminLogin"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const Timetable = lazyWithRetry(() => import("./pages/Timetable"));
const AttendanceTracker = lazyWithRetry(() => import("./pages/AttendanceTracker"));
import { useApp } from "./context/AppContext";
import { AlertTriangle, X } from "lucide-react";
import ErrorBoundary from "./components/system/ErrorBoundary";
import NetworkStatusListener from "./components/system/NetworkStatusListener";
import SmoothScroll from "./components/system/SmoothScroll";
import MaintenanceGuard from "./components/system/MaintenanceGuard";
import WaitingRoomGuard from "./components/system/WaitingRoomGuard";
import { useTrafficTracker } from "./utils/useTrafficTracker";
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
    // Lenis owns scroll interpolation globally. Route resets must stay instant so
    // a new page never visibly scrolls through the previous page's content.
    window.dispatchEvent(new Event("gradeflow:scroll-top"));
    window.scrollTo(0, 0); // Native fallback before Lenis is ready.
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [pathname, hash]);

  return null;
}

function RouteLoadingFallback() {
  const { pathname } = useLocation();

  let skeleton = <LandingSkeleton />;
  if (pathname.startsWith("/dashboard")) skeleton = <DashboardSkeleton />;
  else if (pathname.startsWith("/analytics")) skeleton = <AnalyticsSkeleton />;
  else if (pathname.startsWith("/attendance")) skeleton = <AttendanceSkeleton />;
  else if (pathname.startsWith("/timetable")) skeleton = <TimetableSkeleton />;
  else if (pathname.startsWith("/leaderboard")) skeleton = <LeaderboardSkeleton isFullPage={true} />;
  else if (pathname.startsWith("/testimonials")) skeleton = <TestimonialsSkeleton isFullPage={true} />;
  else if (pathname === "/admin" || pathname === "/admin/login") skeleton = <AdminLoginSkeleton />;
  else if (pathname.startsWith("/admin")) skeleton = <AdminDashboardSkeleton />;
  else if (pathname.startsWith("/resources")) skeleton = <ResourcesSkeleton />;
  else if (["/about", "/help", "/contact", "/privacy", "/terms", "/cookies", "/about-dev"].includes(pathname)) {
    skeleton = <PublicPageSkeleton />;
  }

  return (
    <div
      className="gf-skeleton-fade"
      style={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "100vh",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {skeleton}
    </div>
  );
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
  const { hasActiveSession, authChecking, authStatus, studentSession, adminToken } = useApp();
  const params = useParams();
  const rawParam = params.studentId || params.regNo || params.id;

  if (authChecking) {
    return <DashboardSkeleton />;
  }

  // An encrypted URL is deliberately opaque. If its checksum cannot be
  // verified, do not mount the page with an empty registration number: that
  // used to leave Dashboard in its permanent loading state after URL edits.
  if (rawParam && isEncryptedToken(rawParam) && !decodeStudentId(rawParam)) {
    return <NotFoundState />;
  }

  // A network failure is not proof that the browser has no session cookie.
  // Keep the session unresolved instead of briefly showing the student as
  // logged out; the next interaction safely retries the bootstrap request.
  if (authStatus === "AUTH_ERROR") {
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
  const { adminToken, authChecking, adminAuthStatus } = useApp();

  if (authChecking || adminAuthStatus === "AUTH_ERROR") {
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
  const {
    setSessionRevokedNotice,
    setStudentSession,
    setStudentData,
    studentSession,
    studentData,
    adminToken,
  } = useApp();

  const { queueState, leaveQueue, isAuthorizedAdmin } = useTrafficTracker({
    studentSession,
    studentData,
    adminToken,
  });

  // Keep public pages crawlable and prevent protected/error routes from being indexed.
  useEffect(() => {
    applyRouteMetadata(location.pathname);
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
      <SmoothScroll />
      <NetworkStatusListener />
      <Navbar />

      {rateLimitError && (
        <RateLimitState
          message={rateLimitError}
          onRetry={() => setRateLimitError(null)}
        />
      )}

      <MaintenanceGuard>
        <WaitingRoomGuard
          queueState={queueState}
          leaveQueue={leaveQueue}
          isAuthorizedAdmin={isAuthorizedAdmin}
        >
          <FeedbackModal />
          <UpgradeModal />
        <Suspense fallback={<RouteLoadingFallback />}>
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
                  <PublicPages page="about" />
                </PageTransition>
              }
            />
            <Route
              path="/help"
              element={
                <PageTransition>
                  <PublicPages page="help" />
                </PageTransition>
              }
            />
            <Route
              path="/contact"
              element={
                <PageTransition>
                  <PublicPages page="contact" />
                </PageTransition>
              }
            />
            <Route
              path="/privacy"
              element={
                <PageTransition>
                  <PublicPages page="privacy" />
                </PageTransition>
              }
            />
            <Route
              path="/terms"
              element={
                <PageTransition>
                  <PublicPages page="terms" />
                </PageTransition>
              }
            />
            <Route
              path="/cookies"
              element={
                <PageTransition>
                  <PublicPages page="cookies" />
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
        </WaitingRoomGuard>
      </MaintenanceGuard>
    </ErrorBoundary>
  );
}
