import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, ChevronDown, ChevronRight, Search, LogOut,
  LayoutDashboard, Trophy, BookOpen, MessageSquare,
  TrendingUp, Briefcase, Target, Award, Activity,
  Menu, X, Sparkles, Home as HomeIcon, User, Calculator, ArrowRight,
  ShieldCheck
} from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [analyticsDropdown, setAnalyticsDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAnalyticsOpen, setMobileAnalyticsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchRegNo, setSearchRegNo] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const { studentData, hasActiveSession, leaveSession, fetchStudent, loading, error } = useApp();

  const analyticsRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
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

  // Close on route change
  useEffect(() => {
    setAnalyticsDropdown(false);
    setMobileMenuOpen(false);
    setMobileAnalyticsOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const currentRegNo = studentData?.regNo 
    || sessionStorage.getItem("last_regNo") 
    || "";

  const handleDashboardClick = (e) => {
    if (e) e.preventDefault();
    if (!hasActiveSession && !currentRegNo) {
      setShowAuthModal(true);
    } else {
      navigate(`/dashboard/${currentRegNo}`);
    }
  };

  const handleAnalyticsClick = (e, targetTab = "") => {
    if (e) e.preventDefault();
    const query = targetTab ? `?tab=${encodeURIComponent(targetTab)}` : "";
    if (!hasActiveSession && !currentRegNo) {
      setShowAuthModal(true);
    } else {
      navigate(`/analytics/${currentRegNo}${query}`);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchRegNo.trim() || loading) return;
    const success = await fetchStudent(searchRegNo.trim());
    if (success) {
      setSearchModalOpen(false);
      setMobileMenuOpen(false);
      navigate(`/dashboard/${searchRegNo.trim()}`);
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
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
              gap: 8,
              zIndex: 1001,
            }}
          >
            {/* 3-bar icon matching brand */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 22, paddingBottom: 2 }}>
              <div style={{ width: 4.5, height: 10, background: "#3b82f6", borderRadius: 2 }} />
              <div style={{ width: 4.5, height: 16, background: "#2563eb", borderRadius: 2 }} />
              <div style={{ width: 4.5, height: 22, background: "#1e3a8a", borderRadius: 2 }} />
            </div>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 800,
                fontSize: 21,
                color: "#0f172a",
                letterSpacing: "-0.5px",
              }}
            >
              GradeFlow
            </span>
          </Link>

          {/* Center Nav Links (Desktop) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 26,
            }}
            className="gf-desktop-nav"
          >
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
                fontWeight: location.pathname.startsWith("/dashboard") ? 700 : 500,
                color: location.pathname.startsWith("/dashboard") ? "#0f172a" : "#64748b",
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

            {/* Analytics with Subnav Dropdown */}
            <div ref={analyticsRef} style={{ position: "relative" }}>
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
                  fontWeight: location.pathname.startsWith("/analytics") ? 700 : 500,
                  color: location.pathname.startsWith("/analytics") ? "#0f172a" : "#64748b",
                  cursor: "pointer",
                  padding: "8px 0",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "color 0.2s ease",
                  position: "relative",
                }}
              >
                Analytics <ChevronDown size={13} style={{ transition: "transform 0.2s", transform: analyticsDropdown ? "rotate(180deg)" : "none" }} />
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: -20,
                      width: 240,
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: 12,
                      padding: 8,
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                      zIndex: 100,
                    }}
                  >
                    <button
                      onClick={(e) => {
                        setAnalyticsDropdown(false);
                        handleAnalyticsClick(e, "trajectory");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        color: "#0f172a",
                        background: "transparent",
                        border: "none",
                        width: "100%",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <TrendingUp size={15} color="#2563eb" /> Performance Trajectory
                    </button>

                    <button
                      onClick={(e) => {
                        setAnalyticsDropdown(false);
                        handleAnalyticsClick(e, "grades");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        color: "#0f172a",
                        background: "transparent",
                        border: "none",
                        width: "100%",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <BarChart2 size={15} color="#8b5cf6" /> Grade Distribution
                    </button>

                    <button
                      onClick={(e) => {
                        setAnalyticsDropdown(false);
                        handleAnalyticsClick(e, "placement");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        color: "#0f172a",
                        background: "transparent",
                        border: "none",
                        width: "100%",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Briefcase size={15} color="#10b981" /> Placement & Companies
                    </button>

                    <button
                      onClick={(e) => {
                        setAnalyticsDropdown(false);
                        handleAnalyticsClick(e, "mastery");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        color: "#0f172a",
                        background: "transparent",
                        border: "none",
                        width: "100%",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Target size={15} color="#d97706" /> Subject Mastery & Insights
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rankings */}
            <Link
              to="/leaderboard"
              style={{
                textDecoration: "none",
                fontSize: 14,
                fontWeight: location.pathname === "/leaderboard" ? 700 : 500,
                color: location.pathname === "/leaderboard" ? "#0f172a" : "#64748b",
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
                color: location.pathname === "/resources" ? "#0f172a" : "#64748b",
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
                color: location.pathname === "/testimonials" ? "#0f172a" : "#64748b",
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
                fontWeight: (location.pathname === "/about-dev" || location.pathname === "/about") ? 700 : 500,
                color: (location.pathname === "/about-dev" || location.pathname === "/about") ? "#0f172a" : "#64748b",
                position: "relative",
                padding: "8px 0",
                transition: "color 0.2s ease",
              }}
            >
              About Dev
              {(location.pathname === "/about-dev" || location.pathname === "/about") && (
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Search button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              aria-label="Search Student"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.color = "#64748b";
              }}
              title="Search Registration Number"
            >
              <Search size={15} />
            </button>

            {/* Subtle Admin Button (Not Bright / Clean Ghost Pill) */}
            <Link
              to="/admin"
              title="Admin Portal"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: location.pathname.startsWith("/admin") ? "#f1f5f9" : "transparent",
                color: location.pathname.startsWith("/admin") ? "#0f172a" : "#64748b",
                fontSize: 12.5,
                fontWeight: 600,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.color = "#0f172a";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = location.pathname.startsWith("/admin") ? "#f1f5f9" : "transparent";
                e.currentTarget.style.color = location.pathname.startsWith("/admin") ? "#0f172a" : "#64748b";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <ShieldCheck size={14} color="#64748b" />
              <span>Admin</span>
            </Link>

            {/* Desktop Auth Button */}
            <div className="gf-desktop-auth">
              {hasActiveSession ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Link
                    to={`/dashboard/${currentRegNo}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 15px",
                      borderRadius: 10,
                      background: "#0f172a",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontSize: 13.5,
                      fontWeight: 600,
                      transition: "background 0.2s ease",
                    }}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => leaveSession()}
                    style={{
                      background: "transparent",
                      border: "1px solid #fecaca",
                      color: "#ef4444",
                      borderRadius: 10,
                      padding: "6px 9px",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    title="Logout"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchModalOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 18px",
                    borderRadius: 10,
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "background 0.2s ease",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.1)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1e293b")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#0f172a")}
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              className="gf-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: mobileMenuOpen ? "#eff6ff" : "#f8fafc",
                border: mobileMenuOpen ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                color: mobileMenuOpen ? "#2563eb" : "#0f172a",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Navigation Drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                zIndex: 998,
              }}
            />

            {/* Slide-out Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              style={{
                position: "fixed",
                top: 58,
                left: 0,
                right: 0,
                maxHeight: "calc(100vh - 58px)",
                overflowY: "auto",
                background: "#ffffff",
                borderBottom: "1px solid #e2e8f0",
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.16)",
                zIndex: 999,
                padding: "14px 18px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Search Bar inside Drawer */}
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
                    placeholder="Enter Registration No. (e.g. 230301...)"
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
                    Go
                  </button>
                </div>
              </form>

              {/* Navigation Links Group */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Home */}
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
                    background: location.pathname === "/" ? "#eff6ff" : "transparent",
                    color: location.pathname === "/" ? "#2563eb" : "#1e293b",
                    fontSize: 14.5,
                    fontWeight: location.pathname === "/" ? 700 : 600,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <HomeIcon size={17} color={location.pathname === "/" ? "#2563eb" : "#64748b"} />
                    <span>Home</span>
                  </div>
                  {location.pathname === "/" && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
                  )}
                </Link>

                {/* Dashboard */}
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
                    background: location.pathname.startsWith("/dashboard") ? "#eff6ff" : "transparent",
                    color: location.pathname.startsWith("/dashboard") ? "#2563eb" : "#1e293b",
                    fontSize: 14.5,
                    fontWeight: location.pathname.startsWith("/dashboard") ? 700 : 600,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <LayoutDashboard size={17} color={location.pathname.startsWith("/dashboard") ? "#2563eb" : "#64748b"} />
                    <span>Dashboard</span>
                  </div>
                  {location.pathname.startsWith("/dashboard") ? (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
                  ) : (
                    <ChevronRight size={15} color="#cbd5e1" />
                  )}
                </button>

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
                      background: location.pathname.startsWith("/analytics") ? "#eff6ff" : "transparent",
                      color: location.pathname.startsWith("/analytics") ? "#2563eb" : "#1e293b",
                      fontSize: 14.5,
                      fontWeight: location.pathname.startsWith("/analytics") ? 700 : 600,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <BarChart2 size={17} color={location.pathname.startsWith("/analytics") ? "#2563eb" : "#64748b"} />
                      <span>Analytics</span>
                    </div>
                    <ChevronDown
                      size={15}
                      color="#64748b"
                      style={{
                        transition: "transform 0.2s",
                        transform: mobileAnalyticsOpen ? "rotate(180deg)" : "none",
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
                        <button
                          onClick={(e) => {
                            setMobileMenuOpen(false);
                            handleAnalyticsClick(e, "trajectory");
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "none",
                            background: "transparent",
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <TrendingUp size={14} color="#2563eb" /> Trajectory
                        </button>
                        <button
                          onClick={(e) => {
                            setMobileMenuOpen(false);
                            handleAnalyticsClick(e, "grades");
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "none",
                            background: "transparent",
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <BarChart2 size={14} color="#8b5cf6" /> Grade Distribution
                        </button>
                        <button
                          onClick={(e) => {
                            setMobileMenuOpen(false);
                            handleAnalyticsClick(e, "placement");
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "none",
                            background: "transparent",
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <Briefcase size={14} color="#10b981" /> Placement Insights
                        </button>
                        <button
                          onClick={(e) => {
                            setMobileMenuOpen(false);
                            handleAnalyticsClick(e, "mastery");
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "none",
                            background: "transparent",
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <Target size={14} color="#f59e0b" /> Subject Mastery
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Rankings */}
                <Link
                  to="/leaderboard"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 12px",
                    borderRadius: 10,
                    textDecoration: "none",
                    background: location.pathname === "/leaderboard" ? "#eff6ff" : "transparent",
                    color: location.pathname === "/leaderboard" ? "#2563eb" : "#1e293b",
                    fontSize: 14.5,
                    fontWeight: location.pathname === "/leaderboard" ? 700 : 600,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Trophy size={17} color={location.pathname === "/leaderboard" ? "#2563eb" : "#64748b"} />
                    <span>University Rankings</span>
                  </div>
                  {location.pathname === "/leaderboard" && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
                  )}
                </Link>

                {/* Resources */}
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
                    background: location.pathname === "/resources" ? "#eff6ff" : "transparent",
                    color: location.pathname === "/resources" ? "#2563eb" : "#1e293b",
                    fontSize: 14.5,
                    fontWeight: location.pathname === "/resources" ? 700 : 600,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Calculator size={17} color={location.pathname === "/resources" ? "#2563eb" : "#64748b"} />
                    <span>Calculators & Resources</span>
                  </div>
                  {location.pathname === "/resources" && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
                  )}
                </Link>

                {/* Testimonials */}
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
                    background: location.pathname === "/testimonials" ? "#eff6ff" : "transparent",
                    color: location.pathname === "/testimonials" ? "#2563eb" : "#1e293b",
                    fontSize: 14.5,
                    fontWeight: location.pathname === "/testimonials" ? 700 : 600,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <MessageSquare size={17} color={location.pathname === "/testimonials" ? "#2563eb" : "#64748b"} />
                    <span>Student Reviews</span>
                  </div>
                  {location.pathname === "/testimonials" && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
                  )}
                </Link>

                {/* About Dev */}
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
                    background: (location.pathname === "/about-dev" || location.pathname === "/about") ? "#eff6ff" : "transparent",
                    color: (location.pathname === "/about-dev" || location.pathname === "/about") ? "#2563eb" : "#1e293b",
                    fontSize: 14.5,
                    fontWeight: (location.pathname === "/about-dev" || location.pathname === "/about") ? 700 : 600,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Sparkles size={17} color={(location.pathname === "/about-dev" || location.pathname === "/about") ? "#2563eb" : "#64748b"} />
                    <span>About Developer</span>
                  </div>
                  {(location.pathname === "/about-dev" || location.pathname === "/about") && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
                  )}
                </Link>

                {/* Admin Portal */}
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
                    background: location.pathname.startsWith("/admin") ? "#eff6ff" : "transparent",
                    color: location.pathname.startsWith("/admin") ? "#2563eb" : "#1e293b",
                    fontSize: 14.5,
                    fontWeight: location.pathname.startsWith("/admin") ? 700 : 600,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ShieldCheck size={17} color={location.pathname.startsWith("/admin") ? "#2563eb" : "#64748b"} />
                    <span>Admin Portal</span>
                  </div>
                  {location.pathname.startsWith("/admin") ? (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, background: "#f1f5f9", color: "#64748b", padding: "2px 6px", borderRadius: 4 }}>Gate</span>
                  )}
                </Link>
              </div>

              {/* Mobile Drawer Bottom Action */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, marginTop: 2 }}>
                {hasActiveSession ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 12px", borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>
                        {studentData?.name ? studentData.name.charAt(0).toUpperCase() : "ST"}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                          {studentData?.name || "Active Student"}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {currentRegNo}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        leaveSession();
                        setMobileMenuOpen(false);
                      }}
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#ef4444",
                        borderRadius: 8,
                        padding: "5px 9px",
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <LogOut size={12} /> Exit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSearchModalOpen(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 12,
                      background: "#0f172a",
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
                    }}
                  >
                    <Search size={15} /> Look Up Registration Number
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {searchModalOpen && (
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
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                  Search Academic Record
                </h3>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
                  Enter your University Registration Number to view your dashboard.
                </p>
              </div>

              <form onSubmit={handleSearchSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
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
                    <div style={{ color: "#ef4444", fontSize: 12, textAlign: "center" }}>
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
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#1e293b")}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#0f172a")}
                  >
                    {loading ? "Searching..." : "View Dashboard"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Required Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuthModal(false)}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: "26px 22px",
                maxWidth: 400,
                width: "100%",
                textAlign: "center",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
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
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                Registration Number Required
              </h3>
              <p style={{ fontSize: 12.5, color: "#64748b", marginBottom: 18, lineHeight: 1.5 }}>
                Please enter your registration number to access your student dashboard.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowAuthModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 10,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    setSearchModalOpen(true);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 10,
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Search Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 1024px) {
          .gf-desktop-nav {
            gap: 16px !important;
          }
          .gf-desktop-nav a, .gf-desktop-nav button {
            font-size: 13.5px !important;
          }
        }
        @media (max-width: 768px) {
          .gf-navbar-inner {
            height: 58px !important;
            padding: 0 16px !important;
          }
          .gf-desktop-nav {
            display: none !important;
          }
          .gf-desktop-auth {
            display: none !important;
          }
          .gf-mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
