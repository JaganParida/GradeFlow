import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, LayoutDashboard, BarChart2, Trophy, Menu, X, ShieldAlert } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { studentData, adminToken } = useApp();

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
    { to: "/", label: "Home", icon: <GraduationCap size={16} /> },
    ...(currentRegNo
      ? [
          { to: `/dashboard/${currentRegNo}`, label: "Dashboard", icon: <LayoutDashboard size={16} /> },
          { to: `/analytics/${currentRegNo}`, label: "Analytics", icon: <BarChart2 size={16} /> },
        ]
      : []),
    { to: "/leaderboard", label: "Leaderboard", icon: <Trophy size={16} /> },
  ];

  return (
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
              key={l.to}
              to={l.to}
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
                  key={l.to}
                  to={l.to}
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
  );
}
