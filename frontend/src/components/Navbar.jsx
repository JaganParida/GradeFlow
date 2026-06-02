import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, LayoutDashboard, BarChart2, Trophy, Menu, X, ShieldAlert, LogOut, Search } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { studentData, adminToken, hasActiveSession, leaveSession } = useApp();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => setOpen(false), [location]);

  const pathParts = location.pathname.split("/");
  const currentRegNo = studentData?.regNo 
    || ((pathParts[1] === "dashboard" || pathParts[1] === "analytics") ? pathParts[2] : null)
    || localStorage.getItem("last_regNo");

  const links = [
    { to: "/", label: "Home", icon: <GraduationCap size={16} />, reqAuth: false },
    { to: currentRegNo ? `/dashboard/${currentRegNo}` : "#", label: "Dashboard", icon: <LayoutDashboard size={16} />, reqAuth: true },
    { to: currentRegNo ? `/analytics/${currentRegNo}` : "#", label: "Analytics", icon: <BarChart2 size={16} />, reqAuth: true },
    { to: "/leaderboard", label: "Leaderboard", icon: <Trophy size={16} />, reqAuth: true },
  ];

  const handleLinkClick = (e, l) => {
    if (l.reqAuth && !hasActiveSession) {
      e.preventDefault();
      setShowAuthModal(true);
      setOpen(false);
    }
  };

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrolled ? "rgba(15,15,15,0.95)" : "rgba(15,15,15,0.7)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${scrolled ? "var(--border)" : "transparent"}`,
          transition: "all 0.3s",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 60,
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: "linear-gradient(135deg, var(--accent), #7c3aed)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GraduationCap color="#fff" size={20} />
            </div>
            <span
              style={{
                fontFamily: "Space Mono, monospace",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--text)",
                letterSpacing: "-0.5px"
              }}
            >
              GradeFlow
            </span>
          </Link>

          {/* Desktop links */}
          <div
            style={{ display: "flex", gap: 4, alignItems: "center" }}
            className="desktop-nav"
          >
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={(e) => handleLinkClick(e, l)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 6,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  color:
                    location.pathname === l.to
                      ? "var(--text)"
                      : "var(--secondary)",
                  background:
                    location.pathname === l.to ? "var(--card)" : "transparent",
                  transition: "all 0.2s",
                }}
              >
                {l.icon}
                {l.label}
              </Link>
            ))}
            <Link
              to={adminToken ? "/admin/dashboard" : "/admin"}
              className="btn btn-ghost"
              style={{ marginLeft: 8, padding: "6px 14px", fontSize: 13, gap: 6 }}
            >
              <ShieldAlert size={16} /> Admin
            </Link>
            {hasActiveSession && (
              <button
                onClick={() => leaveSession()}
                className="btn btn-ghost"
                style={{ padding: "6px 12px", fontSize: 13, gap: 6, color: "var(--danger)", marginLeft: 4 }}
                title="Clear session and go home"
              >
                <LogOut size={14} /> Leave
              </button>
            )}
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setOpen(!open)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "var(--text)",
              cursor: "pointer",
            }}
            className="hamburger"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                background: "var(--surface)",
                borderTop: "1px solid var(--border)",
                overflow: "hidden"
              }}
            >
              <div style={{ padding: "12px 24px 20px" }}>
                {links.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    onClick={(e) => handleLinkClick(e, l)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 0",
                      color: "var(--text)",
                      textDecoration: "none",
                      fontSize: 15,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {l.icon}
                    {l.label}
                  </Link>
                ))}
                <Link
                  to={adminToken ? "/admin/dashboard" : "/admin"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 0",
                    color: "var(--secondary)",
                    textDecoration: "none",
                    fontSize: 15,
                  }}
                >
                  <ShieldAlert size={16} /> Admin
                </Link>
                {hasActiveSession && (
                  <div style={{ padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 8 }}>
                    <button
                      onClick={() => { leaveSession(); setOpen(false); }}
                      className="btn"
                      style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", padding: "10px 16px", fontSize: 14, gap: 8, width: "100%", justifyContent: "center" }}
                    >
                      <LogOut size={14} /> Leave Session
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          @media (max-width: 600px) {
            .desktop-nav { display: none !important; }
            .hamburger { display: block !important; }
          }
        `}</style>
      </nav>

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
              background: "rgba(10,10,10,0.6)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(180deg, rgba(30,30,30,0.98) 0%, rgba(20,20,20,0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24,
                padding: 36,
                maxWidth: 440,
                width: "100%",
                textAlign: "center",
                boxShadow: "0 28px 80px rgba(0,0,0,0.8)",
              }}
            >
              <div style={{ background: "rgba(62,166,255,0.12)", width: 64, height: 64, borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto", border: "1px solid rgba(62,166,255,0.2)" }}>
                <Search color="var(--accent)" size={28} />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>Search Required</h3>
              <p style={{ color: "var(--secondary)", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
                Please search for your Registration No. on the Home page first to access your Dashboard, Analytics, and Leaderboard.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => setShowAuthModal(false)} className="btn btn-ghost" style={{ flex: "1 1 130px", padding: "12px 0", justifyContent: "center" }}>Cancel</button>
                <button onClick={() => { setShowAuthModal(false); navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="btn btn-primary" style={{ flex: "1 1 130px", padding: "12px 0", justifyContent: "center" }}>Go to Home</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
