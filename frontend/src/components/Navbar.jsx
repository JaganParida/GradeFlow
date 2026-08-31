import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { encodeStudentId } from "../utils/studentIdEncoder";
import { motion, AnimatePresence } from "framer-motion";
import StudentAuthModal from "./StudentAuthModal";
import NotificationBell from "./NotificationBell";
import {
  BarChart2,
  ChevronDown,
  ChevronRight,
  Search,
  LogOut,
  LayoutDashboard,
  Trophy,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Briefcase,
  Target,
  Award,
  Activity,
  Menu,
  X,
  Home as HomeIcon,
  User,
  Calculator,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Percent,
  GraduationCap,
  Loader2,
  PieChart,
  Code2,
} from "lucide-react";
import { is2023CSEBatch } from "../utils/timetableHelper";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;



export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [analyticsDropdown, setAnalyticsDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAnalyticsOpen, setMobileAnalyticsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchRegNo, setSearchRegNo] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const {
    studentData,
    studentSession,
    hasActiveSession,
    authChecking,
    leaveSession,
    isLoggingOut,
    fetchStudent,
    loading,
    error,
    adminToken,
    isAuthModalOpen,
    openStudentAuthModal,
    closeStudentAuthModal,
    pendingDestination,
    setPendingDestination,
    isAdminButtonVisible,
    sessionRevokedNotice,
    setSessionRevokedNotice,
  } = useApp();

  const analyticsRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (analyticsRef.current && !analyticsRef.current.contains(e.target)) {
        setAnalyticsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Responsive Breakpoint Tracker
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loggedInRegNo = studentSession?.regNo || "";
  const currentRegNo = studentData?.regNo || loggedInRegNo || "";

  // When both admin device slots are active, keep the portal entry private while
  // preserving access for the authenticated admin and the designated student account.
  const isSpecialAdminPortalViewer = loggedInRegNo === "230301120327";
  const canSeeAdmin = Boolean(adminToken || isSpecialAdminPortalViewer || isAdminButtonVisible);

  // Extract currently viewed student token from URL if present (e.g. /dashboard/:id, /analytics/:id)
  const getActiveViewedRegNo = () => {
    try {
      const pathParts = location.pathname.split("/");
      const section = pathParts[1];
      const rawToken = pathParts[2];
      if (["dashboard", "analytics", "attendance", "timetable"].includes(section) && rawToken) {
        const decoded = decodeStudentId(rawToken);
        if (decoded) return decoded;
      }
    } catch {}
    return studentData?.regNo || loggedInRegNo || "";
  };

  // Close mobile menu on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setAnalyticsDropdown(false);
    setMobileAnalyticsOpen(false);
  }, [location.pathname]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Auto-close mobile drawer when resizing beyond mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isEligibleForTimetable = is2023CSEBatch(studentData, getActiveViewedRegNo());

  const requireAuthFor = (destination) => {
    setPendingDestination(destination);
    openStudentAuthModal();
  };

  const handleDashboardClick = (e) => {
    if (e) e.preventDefault();
    const target = getActiveViewedRegNo();
    if (!target) {
      requireAuthFor({ type: "dashboard" });
    } else {
      navigate(`/dashboard/${encodeStudentId(target)}`);
    }
  };

  const handleTimetableClick = (e) => {
    if (e) e.preventDefault();
    const target = getActiveViewedRegNo();
    if (!target) {
      requireAuthFor({ type: "timetable" });
    } else {
      navigate(`/timetable/${encodeStudentId(target)}`);
    }
  };

  const handleAttendanceClick = (e) => {
    if (e) e.preventDefault();
    const target = getActiveViewedRegNo();
    if (!target) {
      requireAuthFor({ type: "attendance" });
    } else {
      navigate(`/attendance/${encodeStudentId(target)}`);
    }
  };

  const handleAnalyticsClick = (e, targetTab = "") => {
    if (e) e.preventDefault();
    const target = getActiveViewedRegNo();
    if (!target) {
      requireAuthFor({ type: "analytics", tab: targetTab });
    } else {
      const query = targetTab ? `?tab=${encodeURIComponent(targetTab)}` : "";
      navigate(`/analytics/${encodeStudentId(target)}${query}`);
    }
  };

  const handleRankingsClick = (e) => {
    if (e) e.preventDefault();
    if (!currentRegNo && !hasActiveSession && !adminToken) {
      requireAuthFor({ type: "leaderboard" });
    } else {
      navigate("/leaderboard");
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const cleanReg = searchRegNo.trim();
    if (!cleanReg) return;

    setShowAuthModal(false);
    setSearchModalOpen(false);
    setMobileMenuOpen(false);
    setSearchRegNo("");

    const encodedId = encodeStudentId(cleanReg);
    const dest = pendingDestination;
    setPendingDestination(null);

    if (dest?.type === "timetable") {
      navigate(`/timetable/${encodedId}`);
    } else if (dest?.type === "attendance") {
      navigate(`/attendance/${encodedId}`);
    } else if (dest?.type === "analytics") {
      const query = dest.tab ? `?tab=${encodeURIComponent(dest.tab)}` : "";
      navigate(`/analytics/${encodedId}${query}`);
    } else if (dest?.type === "leaderboard") {
      navigate("/leaderboard");
    } else {
      // When searching on a specific tab/route, stay on the same route with the new searched student
      if (location.pathname.startsWith("/analytics")) {
        const query = location.search || "";
        navigate(`/analytics/${encodedId}${query}`);
      } else if (location.pathname.startsWith("/attendance")) {
        const query = location.search || "";
        navigate(`/attendance/${encodedId}${query}`);
      } else if (location.pathname.startsWith("/timetable")) {
        const query = location.search || "";
        navigate(`/timetable/${encodedId}${query}`);
      } else {
        const isAlreadyOnStudentPage = location.pathname.startsWith("/dashboard");
        navigate(`/dashboard/${encodedId}`, {
          replace: isAlreadyOnStudentPage,
        });
      }
    }
  };

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrolled ? "rgba(255, 255, 255, 0.94)" : "#ffffff",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
          transition: "all 0.25s ease",
          boxShadow: scrolled ? "0 4px 20px rgba(15, 23, 42, 0.04)" : "none",
        }}
      >
        <div
          className="gf-navbar-inner"
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            height: 66,
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 0,
              flexShrink: 0,
              marginRight: 6,
              zIndex: 1001,
            }}
          >
            <img
              src="/webisteLogo.png"
              alt="GradeFlow Logo"
              className="gf-logo-img"
              style={{
                height: 52,
                width: "auto",
                objectFit: "contain",
                flexShrink: 0,
                display: "block",
                marginRight: -10,
              }}
            />
            <span
              className="gf-logo-text"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 800,
                fontSize: 23.5,
                color: "#0f172a",
                letterSpacing: "-0.5px",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              GradeFlow
            </span>
          </Link>

          {/* Center Nav Links (Desktop) */}
          <div className="gf-desktop-nav">
            {/* Home */}
            <Link
              to="/"
              style={{
                textDecoration: "none",
                fontSize: 14,
                fontWeight: location.pathname === "/" ? 700 : 500,
                color: location.pathname === "/" ? "#0f172a" : "#64748b",
                position: "relative",
                padding: "8px 0",
                transition: "color 0.2s ease",
              }}
            >
              Home
              {location.pathname === "/" && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    background: "#2563eb",
                    borderRadius: 99,
                  }}
                />
              )}
            </Link>

            {/* Dashboard */}
            <button
              onClick={handleDashboardClick}
              style={{
                background: "transparent",
                border: "none",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: location.pathname.startsWith("/dashboard")
                  ? 700
                  : 500,
                color: location.pathname.startsWith("/dashboard")
                  ? "#0f172a"
                  : "#64748b",
                cursor: "pointer",
                padding: "8px 0",
                position: "relative",
                fontFamily: "'DM Sans', sans-serif",
                transition: "color 0.2s ease",
              }}
            >
              Dashboard
              {location.pathname.startsWith("/dashboard") && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    background: "#2563eb",
                    borderRadius: 99,
                  }}
                />
              )}
            </button>

            {/* Timetable - Only for 2023 CSE Batch or Guest Mode */}
            {isEligibleForTimetable && (
              <button
                onClick={handleTimetableClick}
                style={{
                  background: "transparent",
                  border: "none",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: location.pathname.startsWith("/timetable")
                    ? 700
                    : 500,
                  color: location.pathname.startsWith("/timetable")
                    ? "#0f172a"
                    : "#64748b",
                  cursor: "pointer",
                  padding: "8px 0",
                  position: "relative",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "color 0.2s ease",
                }}
              >
                Timetable
                {location.pathname.startsWith("/timetable") && (
                  <motion.div
                    layoutId="nav-indicator"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2.5,
                      background: "#2563eb",
                      borderRadius: 99,
                    }}
                  />
                )}
              </button>
            )}

            {/* Attendance */}
            <button
              onClick={handleAttendanceClick}
              style={{
                background: "transparent",
                border: "none",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: location.pathname.startsWith("/attendance")
                  ? 700
                  : 500,
                color: location.pathname.startsWith("/attendance")
                  ? "#0f172a"
                  : "#64748b",
                cursor: "pointer",
                padding: "8px 0",
                position: "relative",
                fontFamily: "'DM Sans', sans-serif",
                transition: "color 0.2s ease",
              }}
            >
              Attendance
              {location.pathname.startsWith("/attendance") && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    background: "#059669",
                    borderRadius: 99,
                  }}
                />
              )}
            </button>

            {/* Analytics with Subnav Dropdown */}
            <div
              ref={analyticsRef}
              style={{ position: "relative" }}
              onMouseEnter={() => setAnalyticsDropdown(true)}
              onMouseLeave={() => setAnalyticsDropdown(false)}
            >
              <button
                onClick={(e) => {
                  if (hasActiveSession || currentRegNo) {
                    setAnalyticsDropdown(!analyticsDropdown);
                  } else {
                    handleAnalyticsClick(e);
                  }
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 14,
                  fontWeight: location.pathname.startsWith("/analytics")
                    ? 700
                    : 500,
                  color: location.pathname.startsWith("/analytics")
                    ? "#0f172a"
                    : "#64748b",
                  cursor: "pointer",
                  padding: "8px 0",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "color 0.2s ease",
                  position: "relative",
                }}
              >
                Analytics{" "}
                <ChevronDown
                  size={13}
                  style={{
                    transition: "transform 0.2s",
                    transform: analyticsDropdown ? "rotate(180deg)" : "none",
                  }}
                />
                {location.pathname.startsWith("/analytics") && (
                  <motion.div
                    layoutId="nav-indicator"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2.5,
                      background: "#2563eb",
                      borderRadius: 99,
                    }}
                  />
                )}
              </button>

              <AnimatePresence>
                {analyticsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      left: -24,
                      width: 272,
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "6px",
                      boxShadow: "0 12px 40px -8px rgba(15, 23, 42, 0.14), 0 4px 12px -2px rgba(15, 23, 42, 0.06)",
                      zIndex: 100,
                    }}
                  >
                    {/* Dropdown Header */}
                    <div style={{ padding: "8px 12px 6px 12px", fontSize: 10.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Analytics Suite
                    </div>

                    {[
                      { key: "trajectory", icon: <TrendingUp size={15} />, iconColor: "#2563eb", label: "Performance Trajectory", desc: "SGPA & CGPA trends" },
                      { key: "grades", icon: <BarChart2 size={15} />, iconColor: "#8b5cf6", label: "Grade Distribution", desc: "Grade breakdown analysis" },
                      { key: "placement", icon: <Briefcase size={15} />, iconColor: "#10b981", label: "Placement & Companies", desc: "Eligibility & company matches" },
                      { key: "mastery", icon: <Target size={15} />, iconColor: "#d97706", label: "Subject Mastery & Insights", desc: "Strengths & weak areas" },
                      { key: "predictor", icon: <Award size={15} />, iconColor: "#16a34a", label: "CGPA Goal Predictor", desc: "Target CGPA roadmap" },
                      { key: "whatif", icon: <PieChart size={15} />, iconColor: "#6366f1", label: "What-If Simulator", desc: "Grade impact scenarios" },
                    ].map((item, idx) => (
                      <button
                        key={item.key}
                        onClick={(e) => {
                          setAnalyticsDropdown(false);
                          handleAnalyticsClick(e, item.key);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          borderRadius: 10,
                          color: "#0f172a",
                          background: "transparent",
                          border: "none",
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "background 0.15s ease, transform 0.1s ease",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div style={{
                          width: 32, height: 32,
                          borderRadius: 8,
                          background: `${item.iconColor}10`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                          color: item.iconColor,
                        }}>
                          {item.icon}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.2, color: "#0f172a" }}>{item.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", lineHeight: 1.2 }}>{item.desc}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rankings */}
            <Link
              to="/leaderboard"
              onClick={handleRankingsClick}
              style={{
                textDecoration: "none",
                fontSize: 14,
                fontWeight: location.pathname === "/leaderboard" ? 700 : 500,
                color:
                  location.pathname === "/leaderboard" ? "#0f172a" : "#64748b",
                position: "relative",
                padding: "8px 0",
                transition: "color 0.2s ease",
              }}
            >
              Rankings
              {location.pathname === "/leaderboard" && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    background: "#2563eb",
                    borderRadius: 99,
                  }}
                />
              )}
            </Link>

            {/* Resources */}
            <Link
              to="/resources"
              style={{
                textDecoration: "none",
                fontSize: 14,
                fontWeight: location.pathname === "/resources" ? 700 : 500,
                color:
                  location.pathname === "/resources" ? "#0f172a" : "#64748b",
                position: "relative",
                padding: "8px 0",
                transition: "color 0.2s ease",
              }}
            >
              Resources
              {location.pathname === "/resources" && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    background: "#2563eb",
                    borderRadius: 99,
                  }}
                />
              )}
            </Link>

            {/* Testimonials */}
            <Link
              to="/testimonials"
              style={{
                textDecoration: "none",
                fontSize: 14,
                fontWeight: location.pathname === "/testimonials" ? 700 : 500,
                color:
                  location.pathname === "/testimonials" ? "#0f172a" : "#64748b",
                position: "relative",
                padding: "8px 0",
                transition: "color 0.2s ease",
              }}
            >
              Testimonials
              {location.pathname === "/testimonials" && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    background: "#2563eb",
                    borderRadius: 99,
                  }}
                />
              )}
            </Link>

            {/* About Dev */}
            <Link
              to="/about-dev"
              style={{
                textDecoration: "none",
                fontSize: 14,
                fontWeight:
                  location.pathname === "/about-dev" ||
                  location.pathname === "/about"
                    ? 700
                    : 500,
                color:
                  location.pathname === "/about-dev" ||
                  location.pathname === "/about"
                    ? "#0f172a"
                    : "#64748b",
                position: "relative",
                padding: "8px 0",
                transition: "color 0.2s ease",
              }}
            >
              About Dev
              {(location.pathname === "/about-dev" ||
                location.pathname === "/about") && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    background: "#2563eb",
                    borderRadius: 99,
                  }}
                />
              )}
            </Link>
          </div>

          {/* Right Controls */}
          <div className="gf-navbar-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* In-App Notification Bell & Device Approvals (Desktop) */}
            <div className="gf-desktop-bell-wrapper">
              {hasActiveSession && <NotificationBell isMobile={false} />}
            </div>

            {/* Search button (Accessible ONLY for Admin) */}
            {adminToken && (
              <button
                onClick={() => setSearchModalOpen(true)}
                aria-label="Search Student (Admin)"
                className="gf-search-btn"
                title="Search Registration Number (Admin)"
              >
                <Search size={15} />
              </button>
            )}

            {/* Admin Portal Button (Accessible ONLY for Admin / Superuser) */}
            {canSeeAdmin && (
              <Link
                to="/admin"
                className={`gf-admin-link ${adminToken ? "gf-admin-logged-in" : ""}`}
                title={adminToken ? "Admin Portal (Logged In & Authenticated)" : "Admin Portal"}
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 13px",
                  borderRadius: 9,
                  border: adminToken
                    ? "1.5px solid #10b981"
                    : location.pathname.startsWith("/admin")
                      ? "1.5px solid #cbd5e1"
                      : "1px solid #cbd5e1",
                  background: adminToken
                    ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
                    : location.pathname.startsWith("/admin")
                      ? "#f1f5f9"
                      : "#ffffff",
                  color: adminToken
                    ? "#065f46"
                    : location.pathname.startsWith("/admin")
                      ? "#0f172a"
                      : "#475569",
                  fontSize: 12.5,
                  fontWeight: 750,
                  letterSpacing: "0.2px",
                  transition: "all 0.18s ease",
                  boxShadow: adminToken
                    ? "0 2px 6px rgba(16, 185, 129, 0.18)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (!adminToken) {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.color = "#0f172a";
                    e.currentTarget.style.borderColor = "#94a3b8";
                  } else {
                    e.currentTarget.style.background = "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)";
                    e.currentTarget.style.borderColor = "#059669";
                    e.currentTarget.style.color = "#064e3b";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!adminToken) {
                    e.currentTarget.style.background = location.pathname.startsWith("/admin")
                      ? "#f1f5f9"
                      : "#ffffff";
                    e.currentTarget.style.color = location.pathname.startsWith("/admin")
                      ? "#0f172a"
                      : "#475569";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  } else {
                    e.currentTarget.style.background = "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)";
                    e.currentTarget.style.borderColor = "#10b981";
                    e.currentTarget.style.color = "#065f46";
                  }
                }}
              >
                <ShieldCheck
                  size={15}
                  color={adminToken ? "#059669" : "#64748b"}
                  strokeWidth={adminToken ? 2.4 : 2}
                />
                <span className="gf-admin-text">Admin</span>
              </Link>
            )}

            {/* Desktop Auth Button */}
            <div className="gf-desktop-auth">
              {authChecking ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "7px 16px",
                    borderRadius: 10,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#64748b",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "default",
                    userSelect: "none",
                  }}
                >
                  <Loader2 size={14} className="spin" color="#2563eb" />
                  <span>Verifying...</span>
                </div>
              ) : hasActiveSession ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Link
                    to={`/dashboard/${encodeStudentId(getActiveViewedRegNo())}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px 18px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontSize: 13.5,
                      fontWeight: 700,
                      boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                      transition: "all 0.18s ease",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                  >
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    disabled={isLoggingOut}
                    style={{
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                      color: "#e11d48",
                      borderRadius: 10,
                      padding: "7px 10px",
                      cursor: isLoggingOut ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoggingOut) {
                        e.currentTarget.style.background = "#ffe4e6";
                        e.currentTarget.style.borderColor = "#fda4af";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoggingOut) {
                        e.currentTarget.style.background = "#fff1f2";
                        e.currentTarget.style.borderColor = "#fecdd3";
                      }
                    }}
                    title="Logout"
                  >
                    {isLoggingOut ? (
                      <Loader2 size={13} className="spin" />
                    ) : (
                      <LogOut size={13} />
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openStudentAuthModal()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    border: "none",
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.filter = "brightness(1.08)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                >
                  <GraduationCap size={15} style={{ flexShrink: 0 }} />
                  <span className="gf-portal-full-text">Student Portal Login</span>
                  <span className="gf-portal-short-text">Portal Login</span>
                </button>
              )}
            </div>

            {/* Mobile Notification Bell */}
            <div className="gf-mobile-bell-wrapper" style={{ display: "none" }}>
              {hasActiveSession && <NotificationBell isMobile={true} />}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              className="gf-mobile-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: mobileMenuOpen ? "#eff6ff" : "#f8fafc",
                border: mobileMenuOpen
                  ? "1.5px solid #bfdbfe"
                  : "1px solid #e2e8f0",
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                color: mobileMenuOpen ? "#2563eb" : "#0f172a",
                cursor: "pointer",
                transition: "background 0.2s ease, border-color 0.2s ease, color 0.2s ease",
                flexShrink: 0,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen ? (
                  <motion.span
                    key="mobile-close-icon"
                    initial={{ opacity: 0, rotate: -90, scale: 0.85 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.85 }}
                    transition={{ duration: prefersReducedMotion ? 0.01 : 0.18, ease: "easeOut" }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <X size={20} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="mobile-menu-icon"
                    initial={{ opacity: 0, rotate: 90, scale: 0.85 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -90, scale: 0.85 }}
                    transition={{ duration: prefersReducedMotion ? 0.01 : 0.18, ease: "easeOut" }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Menu size={20} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Navigation Drawer (Hardware-Accelerated 60/120fps Native Slide) ── */}
      <div
        id="gf-mobile-drawer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100dvh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          background: "#ffffff",
          zIndex: 9999,
          padding: "16px 18px 36px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxSizing: "border-box",
          overscrollBehavior: "contain",
          willChange: "transform, opacity",
          transform: mobileMenuOpen ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)",
          opacity: mobileMenuOpen ? 1 : 0,
          visibility: mobileMenuOpen ? "visible" : "hidden",
          pointerEvents: mobileMenuOpen ? "auto" : "none",
          transition: prefersReducedMotion
            ? "none"
            : "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease, visibility 0.32s",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        {/* Drawer Header with Close Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 12,
            borderBottom: "1px solid #f1f5f9",
            marginBottom: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <img
              src="/webisteLogo.png"
              alt="GradeFlow"
              style={{ height: 36, width: "auto", objectFit: "contain" }}
            />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 800,
                fontSize: 20,
                color: "#0f172a",
                letterSpacing: "-0.4px",
              }}
            >
              GradeFlow
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#334155",
              cursor: "pointer",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
          >
            <X size={19} />
          </button>
        </div>

        {/* Admin Search Bar inside Drawer (Admin Only) */}
        {adminToken && (
          <div style={{ width: "100%" }}>
            <form onSubmit={handleSearchSubmit} style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "0 10px",
                }}
              >
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  value={searchRegNo}
                  onChange={(e) => setSearchRegNo(e.target.value)}
                  placeholder="Admin: Lookup Reg. No."
                  style={{
                    width: "100%",
                    padding: "9px 8px",
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    color: "#0f172a",
                    outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    padding: "5px 11px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Find
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Navigation Links Group */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Home */}
          <div>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 12px",
                borderRadius: 10,
                textDecoration: "none",
                background:
                  location.pathname === "/" ? "#eff6ff" : "transparent",
                color: location.pathname === "/" ? "#2563eb" : "#1e293b",
                fontSize: 14.5,
                fontWeight: location.pathname === "/" ? 700 : 600,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <HomeIcon
                  size={17}
                  color={location.pathname === "/" ? "#2563eb" : "#64748b"}
                />
                <span>Home</span>
              </div>
              {location.pathname === "/" && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#2563eb",
                  }}
                />
              )}
            </Link>
          </div>

          {/* Dashboard */}
          <div>
            <button
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleDashboardClick(e);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 12px",
                borderRadius: 10,
                border: "none",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                background: location.pathname.startsWith("/dashboard")
                  ? "#eff6ff"
                  : "transparent",
                color: location.pathname.startsWith("/dashboard")
                  ? "#2563eb"
                  : "#1e293b",
                fontSize: 14.5,
                fontWeight: location.pathname.startsWith("/dashboard")
                  ? 700
                  : 600,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <LayoutDashboard
                  size={17}
                  color={
                    location.pathname.startsWith("/dashboard")
                      ? "#2563eb"
                      : "#64748b"
                  }
                />
                <span>Dashboard</span>
              </div>
              {location.pathname.startsWith("/dashboard") ? (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#2563eb",
                  }}
                />
              ) : (
                <ChevronRight size={15} color="#cbd5e1" />
              )}
            </button>
          </div>

          {/* Class Timetable - Only for 2023 CSE Batch or Guest Mode */}
          {isEligibleForTimetable && (
            <div>
              <button
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleTimetableClick(e);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: location.pathname.startsWith("/timetable")
                    ? "#eff6ff"
                    : "transparent",
                  color: location.pathname.startsWith("/timetable")
                    ? "#2563eb"
                    : "#1e293b",
                  fontSize: 14.5,
                  fontWeight: location.pathname.startsWith("/timetable")
                    ? 700
                    : 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <Clock
                    size={17}
                    color={
                      location.pathname.startsWith("/timetable")
                        ? "#2563eb"
                        : "#64748b"
                    }
                  />
                  <span>Class Timetable</span>
                </div>
                {location.pathname.startsWith("/timetable") ? (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#2563eb",
                    }}
                  />
                ) : (
                  <ChevronRight size={15} color="#cbd5e1" />
                )}
              </button>
            </div>
          )}

          {/* Attendance Tracker */}
          <div>
            <button
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleAttendanceClick(e);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "11px 12px",
                borderRadius: 10,
                border: "none",
                background: location.pathname.startsWith("/attendance")
                  ? "#ecfdf5"
                  : "transparent",
                color: location.pathname.startsWith("/attendance")
                  ? "#059669"
                  : "#1e293b",
                fontSize: 14.5,
                fontWeight: location.pathname.startsWith("/attendance")
                  ? 700
                  : 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <Percent
                  size={17}
                  color={
                    location.pathname.startsWith("/attendance")
                      ? "#059669"
                      : "#64748b"
                  }
                />
                <span>Attendance Tracker</span>
              </div>
              {location.pathname.startsWith("/attendance") ? (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#059669",
                  }}
                />
              ) : (
                <ChevronRight size={15} color="#cbd5e1" />
              )}
            </button>
          </div>

          {/* Analytics Accordion */}
          <div>
            <button
              onClick={() => setMobileAnalyticsOpen(!mobileAnalyticsOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 12px",
                borderRadius: 10,
                border: "none",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                background: location.pathname.startsWith("/analytics")
                  ? "#eff6ff"
                  : "transparent",
                color: location.pathname.startsWith("/analytics")
                  ? "#2563eb"
                  : "#1e293b",
                fontSize: 14.5,
                fontWeight: location.pathname.startsWith("/analytics")
                  ? 700
                  : 600,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <BarChart2
                  size={17}
                  color={
                    location.pathname.startsWith("/analytics")
                      ? "#2563eb"
                      : "#64748b"
                  }
                />
                <span>Analytics</span>
              </div>
              <ChevronDown
                size={15}
                color="#64748b"
                style={{
                  transition: "transform 0.2s",
                  transform: mobileAnalyticsOpen
                    ? "rotate(180deg)"
                    : "none",
                }}
              />
            </button>

            <AnimatePresence>
              {mobileAnalyticsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    paddingLeft: 22,
                    marginTop: 3,
                  }}
                >
                  {[
                    { key: "trajectory", icon: <TrendingUp size={14} />, iconColor: "#2563eb", label: "Performance Trajectory" },
                    { key: "grades", icon: <BarChart2 size={14} />, iconColor: "#8b5cf6", label: "Grade Distribution" },
                    { key: "placement", icon: <Briefcase size={14} />, iconColor: "#10b981", label: "Placement & Companies" },
                    { key: "mastery", icon: <Target size={14} />, iconColor: "#f59e0b", label: "Subject Mastery" },
                    { key: "predictor", icon: <Award size={14} />, iconColor: "#16a34a", label: "CGPA Goal Predictor" },
                    { key: "whatif", icon: <PieChart size={14} />, iconColor: "#6366f1", label: "What-If Simulator" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={(e) => {
                        setMobileMenuOpen(false);
                        handleAnalyticsClick(e, item.key);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "9px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: "transparent",
                        color: "#475569",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "'DM Sans', sans-serif",
                        width: "100%",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <span style={{ color: item.iconColor, display: "flex", flexShrink: 0 }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Rankings */}
          <div>
            <Link
              to="/leaderboard"
              onClick={(e) => {
                if (!hasActiveSession && !currentRegNo && !adminToken) {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  setShowAuthModal(true);
                } else {
                  setMobileMenuOpen(false);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 12px",
                borderRadius: 10,
                textDecoration: "none",
                background:
                  location.pathname === "/leaderboard"
                    ? "#eff6ff"
                    : "transparent",
                color:
                  location.pathname === "/leaderboard"
                    ? "#2563eb"
                    : "#1e293b",
                fontSize: 14.5,
                fontWeight:
                  location.pathname === "/leaderboard" ? 700 : 600,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <Trophy
                  size={17}
                  color={
                    location.pathname === "/leaderboard"
                      ? "#2563eb"
                      : "#64748b"
                  }
                />
                <span>University Rankings</span>
              </div>
              {location.pathname === "/leaderboard" && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#2563eb",
                  }}
                />
              )}
            </Link>
          </div>

          {/* Resources */}
          <div>
            <Link
              to="/resources"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 12px",
                borderRadius: 10,
                textDecoration: "none",
                background:
                  location.pathname === "/resources"
                    ? "#eff6ff"
                    : "transparent",
                color:
                  location.pathname === "/resources"
                    ? "#2563eb"
                    : "#1e293b",
                fontSize: 14.5,
                fontWeight: location.pathname === "/resources" ? 700 : 600,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <Calculator
                  size={17}
                  color={
                    location.pathname === "/resources"
                      ? "#2563eb"
                      : "#64748b"
                  }
                />
                <span>Calculators & Resources</span>
              </div>
              {location.pathname === "/resources" && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#2563eb",
                  }}
                />
              )}
            </Link>
          </div>

          {/* Testimonials */}
          <div>
            <Link
              to="/testimonials"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 12px",
                borderRadius: 10,
                textDecoration: "none",
                background:
                  location.pathname === "/testimonials"
                    ? "#eff6ff"
                    : "transparent",
                color:
                  location.pathname === "/testimonials"
                    ? "#2563eb"
                    : "#1e293b",
                fontSize: 14.5,
                fontWeight:
                  location.pathname === "/testimonials" ? 700 : 600,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <MessageSquare
                  size={17}
                  color={
                    location.pathname === "/testimonials"
                      ? "#2563eb"
                      : "#64748b"
                  }
                />
                <span>Student Reviews</span>
              </div>
              {location.pathname === "/testimonials" && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#2563eb",
                  }}
                />
              )}
            </Link>
          </div>

          {/* About Dev */}
          <div>
            <Link
              to="/about-dev"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 12px",
                borderRadius: 10,
                textDecoration: "none",
                background:
                  location.pathname === "/about-dev" ||
                  location.pathname === "/about"
                    ? "#eff6ff"
                    : "transparent",
                color:
                  location.pathname === "/about-dev" ||
                  location.pathname === "/about"
                    ? "#2563eb"
                    : "#1e293b",
                fontSize: 14.5,
                fontWeight:
                  location.pathname === "/about-dev" ||
                  location.pathname === "/about"
                    ? 700
                    : 600,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <Code2
                  size={17}
                  color={
                    location.pathname === "/about-dev" ||
                    location.pathname === "/about"
                      ? "#2563eb"
                      : "#64748b"
                  }
                />
                <span>About Developer</span>
              </div>
              {(location.pathname === "/about-dev" ||
                location.pathname === "/about") && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#2563eb",
                  }}
                />
              )}
            </Link>
          </div>

          {/* Admin Portal (Only visible if authenticated on this browser) */}
          {canSeeAdmin && (
            <div>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#065f46",
                  fontSize: 14.5,
                  fontWeight: 700,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <ShieldCheck
                    size={17}
                    color="#059669"
                    strokeWidth={2.4}
                  />
                  <span>Admin Portal</span>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    background: "#dcfce7",
                    color: "#065f46",
                    padding: "2px 8px",
                    borderRadius: 6,
                    border: "1px solid #86efac",
                  }}
                >
                  Logged In
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Drawer Bottom Action */}
        <div
          style={{
            borderTop: "1px solid #f1f5f9",
            paddingTop: 12,
            marginTop: 2,
          }}
        >
          {hasActiveSession ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
                padding: "10px 12px",
                borderRadius: 12,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 9 }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {studentData?.name
                    ? studentData.name.charAt(0).toUpperCase()
                    : "ST"}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {studentSession?.name || studentData?.studentName || studentData?.name || "Active Student"}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {getActiveViewedRegNo()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLogoutConfirm(true);
                  setMobileMenuOpen(false);
                }}
                disabled={isLoggingOut}
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#ef4444",
                  borderRadius: 8,
                  padding: "5px 9px",
                  cursor: isLoggingOut ? "not-allowed" : "pointer",
                  fontSize: 11.5,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {isLoggingOut ? (
                  <Loader2 size={12} className="spin" />
                ) : (
                  <LogOut size={12} />
                )}
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          ) : authChecking ? (
            <div
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                fontSize: 13.5,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Loader2 size={16} className="spin" color="#2563eb" />
              <span>Verifying session...</span>
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openStudentAuthModal();
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              }}
            >
              <GraduationCap size={16} /> Student Portal Login
            </button>
          )}
        </div>
      </div>

      {/* ── Logout Confirmation Modal ── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              boxSizing: "border-box",
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowLogoutConfirm(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.55)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            />
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "relative",
                zIndex: 1,
                width: "100%",
                maxWidth: 380,
                background: "#ffffff",
                borderRadius: 20,
                padding: "28px 24px 22px",
                boxShadow: "0 25px 60px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.06)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                fontFamily: "'DM Sans', sans-serif",
                boxSizing: "border-box",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LogOut size={24} color="#ef4444" />
              </div>

              {/* Title & Description */}
              <div style={{ textAlign: "center" }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
                  Confirm Logout
                </h3>
                <p style={{ margin: "6px 0 0 0", fontSize: 13.5, color: "#64748b", lineHeight: 1.5 }}>
                  Are you sure you want to logout? You'll need to sign in again to access your dashboard.
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 4 }}>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{
                    flex: 1,
                    padding: "11px 16px",
                    borderRadius: 12,
                    border: "1.5px solid #e2e8f0",
                    background: "#ffffff",
                    color: "#334155",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    leaveSession();
                  }}
                  disabled={isLoggingOut}
                  style={{
                    flex: 1,
                    padding: "11px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isLoggingOut ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                >
                  <LogOut size={15} />
                  {isLoggingOut ? "Logging out..." : "Yes, Logout"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Official Student OTP Authentication Modal */}
      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onClose={closeStudentAuthModal}
      />

      {/* Search Modal (Admin Only) */}
      <AnimatePresence>
        {adminToken && searchModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: "26px 22px",
                maxWidth: 430,
                width: "100%",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                position: "relative",
              }}
            >
              <button
                onClick={() => setSearchModalOpen(false)}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
              >
                <X size={18} />
              </button>

              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px auto",
                  }}
                >
                  <Search size={20} />
                </div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#0f172a",
                    marginBottom: 4,
                  }}
                >
                  Search Academic Record
                </h3>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
                  Enter your University Registration Number to view your
                  dashboard.
                </p>
              </div>

              <form onSubmit={handleSearchSubmit}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 11 }}
                >
                  <input
                    type="text"
                    value={searchRegNo}
                    onChange={(e) => setSearchRegNo(e.target.value)}
                    placeholder="e.g. 230301120327"
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 14,
                      color: "#0f172a",
                      outline: "none",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                    onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                  />

                  {error && (
                    <div
                      style={{
                        color: "#ef4444",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 12,
                      background: "#0f172a",
                      color: "#ffffff",
                      border: "none",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      !loading && (e.currentTarget.style.background = "#1e293b")
                    }
                    onMouseLeave={(e) =>
                      !loading && (e.currentTarget.style.background = "#0f172a")
                    }
                  >
                    {loading ? "Searching..." : "View Dashboard"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .gf-navbar-inner {
          max-width: 1440px !important;
          margin: 0 auto !important;
          padding: 0 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 16px !important;
          height: 66px !important;
          box-sizing: border-box !important;
          width: 100% !important;
        }
        .gf-desktop-nav {
          display: flex;
          align-items: center;
          gap: 20px !important;
          flex-shrink: 1;
          min-width: 0;
          margin: 0 auto;
        }
        .gf-desktop-nav a, .gf-desktop-nav button {
          white-space: nowrap !important;
          font-size: 13.5px !important;
          padding: 6px 3px !important;
          flex-shrink: 0;
          text-decoration: none;
        }
        .gf-navbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0 !important;
          white-space: nowrap !important;
          margin-left: auto;
        }
        .gf-search-btn {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0 !important;
        }
        .gf-search-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .gf-desktop-auth {
          display: flex;
          align-items: center;
          flex-shrink: 0 !important;
          white-space: nowrap !important;
        }
        .gf-desktop-auth button, .gf-desktop-auth a {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
        }
        .gf-portal-full-text {
          display: inline;
          white-space: nowrap;
        }
        .gf-portal-short-text {
          display: none;
          white-space: nowrap;
        }

        /* Large screens fluid scaling */
        @media (max-width: 1440px) {
          .gf-desktop-nav {
            gap: 15px !important;
          }
        }
        @media (max-width: 1360px) {
          .gf-desktop-nav {
            gap: 11px !important;
          }
          .gf-desktop-nav a, .gf-desktop-nav button {
            font-size: 13px !important;
            padding: 5px 2px !important;
          }
          .gf-portal-full-text {
            display: none !important;
          }
          .gf-portal-short-text {
            display: inline !important;
          }
          .gf-navbar-right {
            gap: 8px !important;
          }
        }
        @media (max-width: 1240px) {
          .gf-desktop-nav {
            gap: 8px !important;
          }
          .gf-desktop-nav a, .gf-desktop-nav button {
            font-size: 12.5px !important;
            padding: 4px 1px !important;
          }
        }

        .gf-desktop-bell-wrapper {
          display: flex;
          align-items: center;
        }

        /* Seamless switch to mobile navigation drawer */
        @media (max-width: 1180px) {
          .gf-desktop-nav {
            display: none !important;
          }
          .gf-desktop-auth {
            display: none !important;
          }
          .gf-desktop-bell-wrapper {
            display: none !important;
          }
          .gf-mobile-bell-wrapper {
            display: flex !important;
            align-items: center;
          }
          .gf-mobile-toggle {
            display: flex !important;
          }
        }

        /* Tablet & Mobile responsive styling */
        @media (max-width: 768px) {
          .gf-desktop-bell-wrapper {
            display: none !important;
          }
          .gf-mobile-bell-wrapper {
            display: flex !important;
            align-items: center;
          }
          .gf-navbar-inner {
            height: 60px !important;
            padding: 0 14px !important;
            gap: 8px !important;
          }
          .gf-navbar-right {
            gap: 6px !important;
          }
          .gf-search-btn {
            width: 36px !important;
            height: 36px !important;
            border-radius: 9px !important;
          }
          .gf-admin-text {
            display: inline-block !important;
            font-size: 12px !important;
            font-weight: 750 !important;
          }
          .gf-admin-link {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            padding: 0 10px !important;
            border-radius: 9px !important;
            height: 36px !important;
            background: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            color: #475569 !important;
            box-sizing: border-box !important;
            white-space: nowrap !important;
          }
          .gf-admin-link.gf-admin-logged-in {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
            border: 1.5px solid #10b981 !important;
            color: #065f46 !important;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.18) !important;
          }
          .gf-mobile-toggle {
            width: 36px !important;
            height: 36px !important;
            border-radius: 9px !important;
          }
          .gf-logo-text {
            font-size: 20px !important;
          }
          .gf-logo-img {
            height: 40px !important;
            margin-right: -7px !important;
          }
        }

        @media (max-width: 480px) {
          .gf-navbar-inner {
            height: 58px !important;
            padding: 0 12px !important;
            gap: 6px !important;
          }
          .gf-navbar-right {
            gap: 5px !important;
          }
          .gf-search-btn {
            width: 35px !important;
            height: 35px !important;
            border-radius: 9px !important;
          }
          .gf-admin-text {
            display: inline-block !important;
            font-size: 11.5px !important;
            font-weight: 750 !important;
          }
          .gf-admin-link {
            display: inline-flex !important;
            align-items: center !important;
            gap: 3.5px !important;
            padding: 0 8px !important;
            border-radius: 9px !important;
            height: 35px !important;
            background: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            color: #475569 !important;
            box-sizing: border-box !important;
            white-space: nowrap !important;
          }
          .gf-admin-link.gf-admin-logged-in {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
            border: 1.5px solid #10b981 !important;
            color: #065f46 !important;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.18) !important;
          }
          .gf-mobile-bell-wrapper {
            display: flex !important;
            align-items: center;
          }
          .gf-mobile-toggle {
            width: 35px !important;
            height: 35px !important;
            border-radius: 9px !important;
          }
          .gf-logo-text {
            font-size: 18.5px !important;
          }
          .gf-logo-img {
            height: 37px !important;
            margin-right: -6px !important;
          }
        }

        @media (max-width: 360px) {
          .gf-navbar-inner {
            height: 56px !important;
            padding: 0 8px !important;
            gap: 4px !important;
          }
          .gf-navbar-right {
            gap: 4px !important;
          }
          .gf-search-btn {
            width: 33px !important;
            height: 33px !important;
            border-radius: 8px !important;
          }
          .gf-admin-text {
            display: none !important;
          }
          .gf-admin-link {
            padding: 0 7px !important;
            height: 33px !important;
            width: 33px !important;
            justify-content: center !important;
            border-radius: 8px !important;
          }
          .gf-admin-link.gf-admin-logged-in {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
            border: 1.5px solid #10b981 !important;
            color: #065f46 !important;
          }
          .gf-mobile-toggle {
            width: 33px !important;
            height: 33px !important;
            border-radius: 8px !important;
          }
          .gf-logo-text {
            font-size: 17px !important;
          }
          .gf-logo-img {
            height: 33px !important;
            margin-right: -5px !important;
          }
        }
      `}</style>

      {/* Session Revoked Graceful Alert Modal (Section 35) */}
      {sessionRevokedNotice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000001,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              maxWidth: 420,
              width: "100%",
              padding: "28px 24px",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.3)",
              border: "1px solid #fee2e2",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <ShieldAlert size={26} color="#dc2626" />
            </div>
            <h4
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 8px",
                letterSpacing: "-0.3px",
              }}
            >
              Session Transferred
            </h4>
            <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 20px", lineHeight: 1.5 }}>
              {sessionRevokedNotice}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setSessionRevokedNotice(null);
                  navigate("/");
                }}
                style={{
                  flex: 1,
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "11px 16px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Go to Home
              </button>
              <button
                type="button"
                onClick={() => {
                  setSessionRevokedNotice(null);
                  openStudentAuthModal();
                }}
                style={{
                  flex: 1,
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 16px",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
