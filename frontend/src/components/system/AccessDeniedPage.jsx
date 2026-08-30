import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Home as HomeIcon,
  ArrowLeft,
  Lock,
  Terminal,
  AlertOctagon,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { encodeStudentId } from "../../utils/studentIdEncoder";

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentData, studentSession, adminToken, openStudentAuthModal } = useApp();
  const currentRegNo = studentData?.regNo || studentSession?.regNo || "";
  const hasActiveSession = Boolean(currentRegNo);
  const studentName = studentData?.studentName || studentSession?.studentName || "";

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock body scroll while overlay is active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const attemptedPath = location.pathname || "/";
  const isAdminRoute = attemptedPath.startsWith("/admin");
  const isStudentRoute =
    attemptedPath.startsWith("/dashboard") ||
    attemptedPath.startsWith("/attendance") ||
    attemptedPath.startsWith("/timetable") ||
    attemptedPath.startsWith("/analytics") ||
    attemptedPath.startsWith("/leaderboard");

  let badgeText = "HTTP 403 • Access Forbidden";
  let title = "Access Restricted";
  let description = "You do not have the required permissions to access this page.";
  let policy = "Authorized Users Only";

  if (isAdminRoute) {
    badgeText = "HTTP 403 • Admin Clearance Required";
    title = "Administrative Gateway Restricted";
    description = "This portal is strictly reserved for authorized university administrative personnel. Standard student accounts and unauthenticated visitors cannot access this gateway.";
    policy = "Main Admin / Sub-Admin Only";
  } else if (isStudentRoute && !hasActiveSession) {
    badgeText = "HTTP 403 • Authentication Required";
    title = "Student Portal Sign-In Required";
    description = "This academic portal and student records are protected. Please sign in with your university registration number and account password to access this page.";
    policy = "Student Authentication Required";
  } else if (isStudentRoute && hasActiveSession) {
    badgeText = "HTTP 403 • Data Privacy Guard";
    title = "Student Profile Access Restricted";
    description = `You are currently signed in as ${currentRegNo}. You do not have permission to view another student's private academic records.`;
    policy = "Student Account Ownership Only";
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999999,
        backgroundColor: "#ffffff",
        background: "radial-gradient(ellipse at 50% 12%, #fef2f2 0%, #fff7ed 40%, #ffffff 80%)",
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: isMobile ? "24px 16px" : "40px 20px",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowY: "auto",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* ── Top Brand Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          cursor: "pointer",
        }}
        onClick={() => navigate("/")}
      >
        <img
          src="/webisteLogo.png"
          alt="GradeFlow Logo"
          style={{
            height: 38,
            width: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 22,
            fontWeight: 850,
            color: "#0f172a",
            letterSpacing: "-0.5px",
          }}
        >
          GradeFlow
        </span>
      </motion.div>

      {/* ── Status Pill Badge ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          color: "#991b1b",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "5px 14px",
          borderRadius: 99,
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(239, 68, 68, 0.12)",
        }}
      >
        <AlertOctagon size={14} color="#dc2626" />
        <span>{badgeText}</span>
      </motion.div>

      {/* ── Animated Cyber-Security Shield Vector Graphic ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        style={{ width: "100%", maxWidth: 320, height: 160, marginBottom: 20 }}
      >
        <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="shieldGrad403" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="50%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
            <linearGradient id="glowPulse403" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fee2e2" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fecaca" stopOpacity="0.3" />
            </linearGradient>
            <filter id="shieldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Holographic Concentric Security Rings */}
          <circle cx="160" cy="80" r="72" stroke="#fecaca" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6">
            <animateTransform attributeName="transform" type="rotate" from="0 160 80" to="360 160 80" dur="20s" repeatCount="indefinite" />
          </circle>
          <circle cx="160" cy="80" r="54" stroke="#fee2e2" strokeWidth="1.2" strokeDasharray="3 3">
            <animateTransform attributeName="transform" type="rotate" from="360 160 80" to="0 160 80" dur="14s" repeatCount="indefinite" />
          </circle>

          {/* Subtle Outer Glow */}
          <path
            d="M160 16 L210 40 V90 C210 124 160 148 160 148 C160 148 110 124 110 90 V40 Z"
            fill="none"
            stroke="#fca5a5"
            strokeWidth="4"
            opacity="0.3"
            filter="url(#shieldGlow)"
          />

          {/* Main Security Shield */}
          <path
            d="M160 18 L208 41 V88 C208 120 160 144 160 144 C160 144 112 120 112 88 V41 Z"
            fill="url(#shieldGrad403)"
            stroke="#991b1b"
            strokeWidth="2"
          />

          {/* Shield Inner Geometric Highlight */}
          <path
            d="M160 26 L198 46 V84 C198 112 160 134 160 134"
            fill="none"
            stroke="#f87171"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />

          {/* Solid White Security Padlock */}
          <rect x="144" y="74" width="32" height="24" rx="5" fill="#ffffff" stroke="#991b1b" strokeWidth="1.5" />
          <path
            d="M150 74 V64 C150 58.5 154.5 54 160 54 C165.5 54 170 58.5 170 64 V74"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Padlock Keyhole */}
          <circle cx="160" cy="83" r="2.5" fill="#991b1b" />
          <path d="M160 85.5 V89" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" />

          {/* Pulsing Security Orbitals */}
          <circle cx="98" cy="68" r="4" fill="#dc2626">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="222" cy="94" r="4" fill="#ef4444">
            <animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </svg>
      </motion.div>

      {/* ── Headline ── */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        style={{
          fontSize: "clamp(24px, 4.5vw, 34px)",
          fontWeight: 850,
          color: "#0f172a",
          margin: "0 0 10px 0",
          letterSpacing: "-0.035em",
          lineHeight: 1.2,
        }}
      >
        {title}
      </motion.h1>

      {/* ── Description ── */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        style={{
          fontSize: "clamp(14px, 2.8vw, 15.5px)",
          color: "#475569",
          lineHeight: 1.6,
          maxWidth: 520,
          margin: "0 0 24px 0",
        }}
      >
        {description}
      </motion.p>

      {/* ── Security Metadata Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#ffffff",
          border: "1px solid #fed7aa",
          borderRadius: 14,
          padding: "14px 18px",
          marginBottom: 28,
          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
          textAlign: "left",
          fontSize: 12.5,
          color: "#334155",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#64748b", fontWeight: 600 }}>Requested Route:</span>
          <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#b91c1c", fontWeight: 700 }}>
            {attemptedPath}
          </code>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#64748b", fontWeight: 600 }}>Detected Identity:</span>
          <strong style={{ color: hasActiveSession ? "#2563eb" : "#64748b" }}>
            {hasActiveSession ? `${currentRegNo}${studentName ? ` (${studentName})` : ""}` : "Unauthenticated Visitor"}
          </strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#64748b", fontWeight: 600 }}>Authorization Policy:</span>
          <span style={{ color: "#b45309", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Lock size={12} /> {policy}
          </span>
        </div>
      </motion.div>

      {/* ── Action Buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
          maxWidth: 480,
        }}
      >
        {isAdminRoute && !adminToken ? (
          <Link
            to="/admin/login"
            style={{
              flex: isMobile ? "1 1 100%" : "1 1 auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "13px 22px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 750,
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            <Lock size={16} />
            <span>Admin Portal Login</span>
            <ArrowRight size={15} />
          </Link>
        ) : hasActiveSession ? (
          <Link
            to={`/dashboard/${encodeStudentId(currentRegNo)}`}
            style={{
              flex: isMobile ? "1 1 100%" : "1 1 auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "13px 22px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 750,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "#ffffff",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
              transition: "all 0.15s ease",
            }}
          >
            <GraduationCap size={16} />
            <span>Go to Student Dashboard</span>
            <ArrowRight size={15} />
          </Link>
        ) : (
          <button
            onClick={() => openStudentAuthModal()}
            style={{
              flex: isMobile ? "1 1 100%" : "1 1 auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "13px 22px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 750,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
              transition: "all 0.15s ease",
            }}
          >
            <GraduationCap size={16} />
            <span>Student Portal Login</span>
            <ArrowRight size={15} />
          </button>
        )}

        <Link
          to="/"
          style={{
            flex: isMobile ? "1 1 100%" : "1 1 auto",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "13px 20px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            color: "#334155",
            textDecoration: "none",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
        >
          <HomeIcon size={16} />
          <span>Return to Home</span>
        </Link>
      </motion.div>
    </div>
  );
}
