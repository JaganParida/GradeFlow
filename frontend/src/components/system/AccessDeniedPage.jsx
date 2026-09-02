import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home as HomeIcon,
  Lock,
  AlertOctagon,
  ArrowRight,
  GraduationCap,
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

  // Lock root/body scroll so the page strictly fits without any scrollbars
  useEffect(() => {
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.scrollTo(0, 0);

    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
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
      className="gf-403-viewport"
      role="alert"
      aria-live="polite"
    >
      <style>{`
        .gf-403-viewport {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #ffffff;
          background: radial-gradient(ellipse at 50% 10%, #fef2f2 0%, #fff7ed 38%, #ffffff 75%);
          height: 100vh;
          height: 100dvh;
          width: 100vw;
          width: 100dvw;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(10px, 2.2vh, 32px) clamp(14px, 3vw, 24px);
          box-sizing: border-box;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          user-select: none;
        }

        .gf-403-modal {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 520px;
          text-align: center;
          margin: auto 0;
          box-sizing: border-box;
        }

        .gf-403-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: clamp(6px, 1.4vh, 14px);
          cursor: pointer;
          flex-shrink: 0;
        }

        .gf-403-brand img {
          height: clamp(24px, 4vh, 36px);
          width: auto;
          object-fit: contain;
          display: block;
        }

        .gf-403-brand span {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(17px, 2.6vh, 22px);
          font-weight: 850;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .gf-403-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #991b1b;
          font-size: clamp(10px, 1.3vh, 11.5px);
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: clamp(3px, 0.6vh, 5px) clamp(10px, 1.6vw, 14px);
          border-radius: 99px;
          margin-bottom: clamp(6px, 1.5vh, 16px);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.12);
          flex-shrink: 0;
        }

        .gf-403-shield-container {
          width: 100%;
          max-width: clamp(160px, 28vh, 280px);
          height: clamp(60px, 13.5vh, 130px);
          margin-bottom: clamp(6px, 1.5vh, 16px);
          flex-shrink: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gf-403-title {
          font-size: clamp(18px, 3.2vh, 28px);
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 clamp(4px, 0.8vh, 8px) 0;
          letter-spacing: -0.03em;
          line-height: 1.16;
          flex-shrink: 0;
        }

        .gf-403-desc {
          font-size: clamp(11.5px, 1.65vh, 14.5px);
          color: #475569;
          line-height: 1.45;
          max-width: 480px;
          margin: 0 0 clamp(8px, 1.8vh, 18px) 0;
          flex-shrink: 1;
        }

        .gf-403-meta {
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border: 1px solid #fed7aa;
          border-radius: 12px;
          padding: clamp(7px, 1.3vh, 12px) clamp(12px, 2vw, 16px);
          margin-bottom: clamp(10px, 2vh, 20px);
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
          text-align: left;
          font-size: clamp(11px, 1.4vh, 12.5px);
          color: #334155;
          display: flex;
          flex-direction: column;
          gap: clamp(4px, 0.7vh, 6px);
          box-sizing: border-box;
          flex-shrink: 0;
        }

        .gf-403-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .gf-403-label {
          color: #64748b;
          font-weight: 600;
          flex-shrink: 0;
        }

        .gf-403-code {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          color: #b91c1c;
          font-weight: 700;
          font-family: monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: min(250px, 48vw);
        }

        .gf-403-actions {
          display: flex;
          gap: clamp(8px, 1.5vw, 12px);
          width: 100%;
          max-width: 480px;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
        }

        .gf-403-btn {
          flex: 1 1 0;
          min-width: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: clamp(5px, 1vw, 8px);
          padding: clamp(9px, 1.4vh, 12px) clamp(10px, 1.6vw, 18px);
          border-radius: 11px;
          font-size: clamp(12px, 1.5vh, 13.5px);
          font-weight: 750;
          text-decoration: none;
          white-space: nowrap;
          box-sizing: border-box;
          transition: all 0.15s ease;
          border: none;
          cursor: pointer;
        }

        .gf-403-btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
        }

        .gf-403-btn-primary:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
        }

        .gf-403-btn-admin {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);
        }

        .gf-403-btn-secondary {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }

        .gf-403-btn-secondary:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
        }

        /* ── Ultra-Low Height Display Adaptations (< 540px) ── */
        @media (max-height: 540px) {
          .gf-403-shield-container {
            display: none !important;
          }
          .gf-403-desc {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-bottom: 8px;
          }
          .gf-403-meta {
            padding: 6px 12px;
            margin-bottom: 10px;
          }
        }

        /* ── Tiny Height Display Adaptations (< 420px) ── */
        @media (max-height: 420px) {
          .gf-403-badge {
            display: none !important;
          }
          .gf-403-desc {
            display: none !important;
          }
        }
      `}</style>

      <div className="gf-403-modal">
        {/* ── Top Brand Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="gf-403-brand"
          onClick={() => navigate("/")}
        >
          <img
            src="/webisteLogo.png"
            alt="GradeFlow Logo"
          />
          <span>GradeFlow</span>
        </motion.div>

        {/* ── Status Pill Badge ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="gf-403-badge"
        >
          <AlertOctagon size={13} color="#dc2626" />
          <span>{badgeText}</span>
        </motion.div>

        {/* ── Animated Cyber-Security Shield Vector Graphic ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="gf-403-shield-container"
        >
          <svg
            viewBox="0 0 320 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          >
            <defs>
              <linearGradient id="shieldGrad403" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="50%" stopColor="#b91c1c" />
                <stop offset="100%" stopColor="#7f1d1d" />
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="gf-403-title"
        >
          {title}
        </motion.h1>

        {/* ── Description ── */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="gf-403-desc"
        >
          {description}
        </motion.p>

        {/* ── Security Metadata Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="gf-403-meta"
        >
          <div className="gf-403-row">
            <span className="gf-403-label">Requested Route:</span>
            <code className="gf-403-code" title={attemptedPath}>
              {attemptedPath}
            </code>
          </div>
          <div className="gf-403-row">
            <span className="gf-403-label">Detected Identity:</span>
            <strong style={{ color: hasActiveSession ? "#2563eb" : "#64748b" }}>
              {hasActiveSession ? `${currentRegNo}${studentName ? ` (${studentName})` : ""}` : "Unauthenticated Visitor"}
            </strong>
          </div>
          <div className="gf-403-row">
            <span className="gf-403-label">Authorization Policy:</span>
            <span style={{ color: "#b45309", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Lock size={12} /> {policy}
            </span>
          </div>
        </motion.div>

        {/* ── Action Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="gf-403-actions"
        >
          {isAdminRoute && !adminToken ? (
            <Link
              to="/admin/login"
              className="gf-403-btn gf-403-btn-primary gf-403-btn-admin"
            >
              <Lock size={15} />
              <span>Admin Portal Login</span>
              <ArrowRight size={14} />
            </Link>
          ) : hasActiveSession ? (
            <Link
              to={`/dashboard/${encodeStudentId(currentRegNo)}`}
              className="gf-403-btn gf-403-btn-primary"
            >
              <GraduationCap size={15} />
              <span>Go to Student Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <button
              onClick={() => openStudentAuthModal()}
              className="gf-403-btn gf-403-btn-primary"
            >
              <GraduationCap size={15} />
              <span>Student Portal Login</span>
              <ArrowRight size={14} />
            </button>
          )}

          <Link
            to="/"
            className="gf-403-btn gf-403-btn-secondary"
          >
            <HomeIcon size={15} />
            <span>Return to Home</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
