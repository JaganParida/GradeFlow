import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, LayoutDashboard, BarChart2, Trophy, MoreHorizontal, X, ShieldAlert, LogOut, Search, MessageSquare } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeHint, setActiveHint] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const hintTimerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { studentData, adminToken, hasActiveSession, leaveSession } = useApp();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => setOpen(false), [location]);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    };
  }, []);

  const pathParts = location.pathname.split("/");
  const currentRegNo = studentData?.regNo 
    || ((pathParts[1] === "dashboard" || pathParts[1] === "analytics") ? pathParts[2] : null)
    || localStorage.getItem("last_regNo");

  const links = [
    { to: "/", label: "Home", icon: <GraduationCap size={16} />, reqAuth: false },
    { to: currentRegNo ? `/dashboard/${currentRegNo}` : "#", label: "Dashboard", icon: <LayoutDashboard size={16} />, reqAuth: true },
    { to: currentRegNo ? `/analytics/${currentRegNo}` : "#", label: "Analytics", icon: <BarChart2 size={16} />, reqAuth: true },
    { to: "/leaderboard", label: "Leaderboard", icon: <Trophy size={16} />, reqAuth: true },
    { to: "/testimonials", label: "Testimonials", icon: <MessageSquare size={16} />, reqAuth: false },
  ];

  const moreLinks = [
    { to: adminToken ? "/admin/dashboard" : "/admin", label: "Admin", icon: <ShieldAlert size={18} />, reqAuth: false },
  ];

  const isActiveLink = (l) => {
    if (l.to === "/") return location.pathname === "/";
    if (l.label === "Dashboard") return location.pathname.startsWith("/dashboard");
    if (l.label === "Analytics") return location.pathname.startsWith("/analytics");
    if (l.label === "Leaderboard") return location.pathname === "/leaderboard";
    if (l.label === "Testimonials") return location.pathname === "/testimonials";
    if (l.label === "Admin") return location.pathname.startsWith("/admin");
    return location.pathname === l.to;
  };

  const showHint = (label, timed = false) => {
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    setActiveHint(label);
    if (timed) {
      hintTimerRef.current = window.setTimeout(() => setActiveHint(""), 1200);
    }
  };

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
        className="site-navbar"
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
                background: "linear-gradient(135deg, #3ea6ff, #7c3aed)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 12px rgba(62,166,255,0.28), 0 2px 6px rgba(0,0,0,0.4)",
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
          <div className="mobile-top-spacer" aria-hidden="true" />
        </div>

        <style>{`
          .mobile-bottom-nav,
          .mobile-bottom-sheet-backdrop,
          .mobile-bottom-sheet {
            display: none;
          }

          @media (max-width: 768px) {
            .desktop-nav { display: none !important; }
            .mobile-top-spacer { display: block; width: 32px; }
            .site-navbar {
              background: rgba(15,15,15,0.72) !important;
              border-bottom-color: rgba(255,255,255,0.04) !important;
            }
            .site-navbar > div {
              height: 56px !important;
              padding: 0 16px !important;
            }
            .mobile-bottom-nav {
              position: fixed;
              left: 50%;
              transform: translateX(-50%);
              width: calc(100% - 32px);
              max-width: 400px;
              bottom: calc(16px + env(safe-area-inset-bottom));
              z-index: 1200;
              display: grid;
              grid-template-columns: repeat(6, minmax(0, 1fr));
              gap: 4px;
              padding: 8px 12px;
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: 30px;
              background: rgba(15,15,15,0.75);
              backdrop-filter: blur(24px);
              -webkit-backdrop-filter: blur(24px);
              box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.15);
            }
            .mobile-bottom-nav-item {
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-width: 0;
              min-height: 48px;
              border: 0;
              border-radius: 18px;
              background: transparent;
              color: rgba(255,255,255,0.4);
              text-decoration: none;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
              -webkit-tap-highlight-color: transparent;
            }
            .mobile-bottom-nav-item svg {
              width: 22px;
              height: 22px;
              transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
            }
            .mobile-bottom-nav-item:hover,
            .mobile-bottom-nav-item:focus-visible {
              color: rgba(255,255,255,0.8);
              outline: none;
            }
            .mobile-bottom-nav-item.is-active {
              color: var(--accent);
            }
            .mobile-bottom-nav-item:active {
              transform: scale(0.92);
            }
            .mobile-bottom-nav-item.is-active svg {
              transform: translateY(-2px);
              filter: drop-shadow(0 4px 6px rgba(62,166,255,0.4));
            }
            /* Glowing dot for active state */
            .mobile-bottom-nav-item::after {
              content: '';
              position: absolute;
              bottom: 4px;
              width: 4px;
              height: 4px;
              border-radius: 50%;
              background: var(--accent);
              opacity: 0;
              transform: scale(0);
              transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
              box-shadow: 0 0 8px var(--accent);
            }
            .mobile-bottom-nav-item.is-active::after {
              opacity: 1;
              transform: scale(1);
            }
            .mobile-nav-hint {
              position: absolute;
              left: 50%;
              bottom: calc(100% + 10px);
              transform: translateX(-50%);
              max-width: 112px;
              padding: 5px 9px;
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 999px;
              background: rgba(32,32,32,0.96);
              color: var(--text);
              box-shadow: 0 10px 30px rgba(0,0,0,0.38);
              font-size: 11px;
              font-weight: 800;
              line-height: 1;
              white-space: nowrap;
              pointer-events: none;
            }
            .mobile-bottom-sheet-backdrop {
              position: fixed;
              inset: 0;
              z-index: 1190;
              display: block;
              background: rgba(0,0,0,0.42);
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
            }
            .mobile-bottom-sheet {
              position: fixed;
              display: block;
              left: 0;
              right: 0;
              bottom: 0;
              z-index: 1300;
              border: 1px solid rgba(255,255,255,0.08);
              border-bottom: 0;
              border-radius: 24px 24px 0 0;
              background: linear-gradient(180deg, rgba(31,31,31,0.98), rgba(17,17,17,0.98));
              box-shadow: 0 -24px 70px rgba(0,0,0,0.65);
              padding: 10px 16px calc(104px + env(safe-area-inset-bottom));
            }
            .mobile-bottom-sheet-grabber {
              width: 42px;
              height: 4px;
              border-radius: 999px;
              background: rgba(255,255,255,0.18);
              margin: 0 auto 14px;
            }
            .mobile-bottom-sheet-head {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 10px;
            }
            .mobile-bottom-sheet-head h3 {
              font-size: 17px;
              font-weight: 800;
            }
            .mobile-bottom-sheet-close {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 36px;
              height: 36px;
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 12px;
              background: rgba(255,255,255,0.04);
              color: var(--text);
              cursor: pointer;
            }
            .mobile-sheet-link,
            .mobile-sheet-action {
              width: 100%;
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 13px 12px;
              border: 1px solid rgba(255,255,255,0.06);
              border-radius: 14px;
              background: rgba(255,255,255,0.03);
              color: var(--text);
              text-decoration: none;
              font-family: "DM Sans", sans-serif;
              font-size: 15px;
              font-weight: 700;
              cursor: pointer;
            }
            .mobile-sheet-link + .mobile-sheet-link,
            .mobile-sheet-link + .mobile-sheet-action,
            .mobile-sheet-action + .mobile-sheet-action {
              margin-top: 10px;
            }
            .mobile-sheet-action.danger {
              color: var(--danger);
              background: rgba(239,68,68,0.09);
              border-color: rgba(239,68,68,0.18);
            }
            .page {
              padding-bottom: calc(112px + env(safe-area-inset-bottom)) !important;
            }
          }
        `}</style>
      </nav>

      <div className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
        {links.map((l) => (
          <Link
            key={l.label}
            to={l.to}
            aria-label={l.label}
            onClick={(e) => handleLinkClick(e, l)}
            onMouseEnter={() => showHint(l.label)}
            onMouseLeave={() => setActiveHint("")}
            onFocus={() => showHint(l.label)}
            onBlur={() => setActiveHint("")}
            onPointerDown={() => showHint(l.label, true)}
            className={`mobile-bottom-nav-item ${isActiveLink(l) ? "is-active" : ""}`}
          >
            {l.icon}
            <AnimatePresence>
              {activeHint === l.label && (
                <motion.span
                  className="mobile-nav-hint"
                  initial={{ opacity: 0, y: 6, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.94 }}
                  transition={{ duration: 0.16 }}
                >
                  {l.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ))}

        <button
          type="button"
          aria-label="More navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          onMouseEnter={() => showHint("More")}
          onMouseLeave={() => setActiveHint("")}
          onFocus={() => showHint("More")}
          onBlur={() => setActiveHint("")}
          onPointerDown={() => showHint("More", true)}
          className={`mobile-bottom-nav-item ${open || location.pathname.startsWith("/admin") ? "is-active" : ""}`}
        >
          <MoreHorizontal size={21} />
          <AnimatePresence>
            {activeHint === "More" && (
              <motion.span
                className="mobile-nav-hint"
                initial={{ opacity: 0, y: 6, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.94 }}
                transition={{ duration: 0.16 }}
              >
                More
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="mobile-bottom-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="mobile-bottom-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="More navigation"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-bottom-sheet-grabber" aria-hidden="true" />
              <div className="mobile-bottom-sheet-head">
                <div>
                  <h3>More</h3>
                  <p style={{ color: "var(--secondary)", fontSize: 12, marginTop: 2 }}>Extra actions and admin access</p>
                </div>
                <button type="button" className="mobile-bottom-sheet-close" aria-label="Close menu" onClick={() => setOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              {moreLinks.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={(e) => {
                    handleLinkClick(e, l);
                    setOpen(false);
                  }}
                  className="mobile-sheet-link"
                >
                  {l.icon}
                  {l.label}
                </Link>
              ))}

              {hasActiveSession && (
                <button
                  type="button"
                  onClick={() => { leaveSession(); setOpen(false); }}
                  className="mobile-sheet-action danger"
                >
                  <LogOut size={18} /> Leave Session
                </button>
              )}
            </motion.div>
          </>
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
