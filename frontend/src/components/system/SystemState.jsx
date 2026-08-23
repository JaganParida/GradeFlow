import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  WifiOff,
  Clock,
  ServerCrash,
  ShieldAlert,
  Lock,
  Hourglass,
  RefreshCw,
  Home as HomeIcon,
  ArrowLeft,
  LogIn,
  Layers,
  CheckCircle2,
  Wrench,
  Compass,
  Calendar,
  CheckSquare,
  BarChart2,
  Trophy,
  Sparkles,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 1. 404 — PAGE NOT FOUND (Ultra-Clean, Modern Google/Linear Style)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function NotFoundState() {
  const { hasActiveSession, currentRegNo } = useApp();
  const navigate = useNavigate();

  const QUICK_LINKS = [
    { label: "Dashboard", href: hasActiveSession ? `/dashboard/${currentRegNo}` : "/", icon: HomeIcon },
    { label: "Timetable", href: "/timetable", icon: Calendar },
    { label: "Attendance", href: "/attendance", icon: CheckSquare },
    { label: "Analytics", href: "/analytics", icon: BarChart2 },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 20px 60px",
        minHeight: "75vh",
        width: "100%",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: "relative",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Brand Watermark Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#eff6ff",
          border: "1px solid #dbeafe",
          padding: "4px 12px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 750,
          color: "#2563eb",
          marginBottom: 16,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
        HTTP 404 &bull; PAGE NOT FOUND
      </div>

      {/* Large Clean Number */}
      <div
        style={{
          fontSize: "clamp(72px, 12vw, 110px)",
          fontWeight: 900,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          margin: "0 0 10px 0",
          background: "linear-gradient(135deg, #0f172a 40%, #3b82f6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        404
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: "clamp(22px, 3.5vw, 28px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 10px 0",
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
        }}
      >
        We couldn't find that page
      </h1>

      {/* Description */}
      <p
        style={{
          fontSize: 15,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 440,
          margin: "0 0 28px 0",
        }}
      >
        The link you followed may be broken, or the page may have been moved.
        Explore the quick shortcuts below to get back on track.
      </p>

      {/* Quick Interactive Shortcut Chips */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          flexWrap: "wrap",
          maxWidth: 540,
          marginBottom: 32,
        }}
      >
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              to={link.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 999,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                color: "#334155",
                fontSize: 13,
                fontWeight: 650,
                textDecoration: "none",
                transition: "all 0.15s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
              className="gf-state-btn-secondary"
            >
              <Icon size={14} color="#64748b" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Primary Navigation Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="gf-state-btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 20px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 650,
            background: "#ffffff",
            color: "#334155",
            border: "1px solid #cbd5e1",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>

        <Link
          to={hasActiveSession ? `/dashboard/${currentRegNo}` : "/"}
          className="gf-state-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 24px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            background: "#2563eb",
            color: "#ffffff",
            textDecoration: "none",
            boxShadow: "0 2px 10px rgba(37, 99, 235, 0.25)",
          }}
        >
          <HomeIcon size={16} />
          <span>{hasActiveSession ? "Go to Dashboard" : "Return to Home"}</span>
        </Link>
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 2. GLOBAL MAINTENANCE MODE (Full-Viewport Immersive Experience)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function MaintenanceState({ message, onRetry }) {
  const [checking, setChecking] = useState(false);

  const handleStatusCheck = async () => {
    setChecking(true);
    try {
      if (onRetry) await onRetry();
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "#fcfdfe",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 24px",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Brand Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "#ffffff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 16,
            boxShadow: "0 2px 10px rgba(37, 99, 235, 0.3)",
          }}
        >
          G
        </span>
        <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
          GradeFlow
        </span>
      </div>

      {/* Maintenance Pulse Icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: "#eff6ff",
          border: "1px solid #dbeafe",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          boxShadow: "0 4px 16px rgba(37, 99, 235, 0.08)",
        }}
      >
        <Wrench size={30} color="#2563eb" strokeWidth={2.2} />
      </div>

      {/* Live Status Pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#fef3c7",
          border: "1px solid #fde68a",
          padding: "4px 14px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 750,
          color: "#92400e",
          marginBottom: 14,
          letterSpacing: "0.02em",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#d97706",
            boxShadow: "0 0 6px rgba(217, 119, 6, 0.6)",
          }}
        />
        SCHEDULED SYSTEM UPGRADE
      </div>

      {/* Heading */}
      <h1
        style={{
          fontSize: "clamp(24px, 4vw, 32px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 12px 0",
          letterSpacing: "-0.03em",
          lineHeight: 1.25,
        }}
      >
        We're making GradeFlow even better
      </h1>

      {/* Description / Custom Broadcast Announcement */}
      <p
        style={{
          fontSize: 15.5,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 480,
          margin: "0 0 24px 0",
        }}
      >
        {message ||
          "GradeFlow is currently undergoing scheduled platform upgrades to enhance system performance. Student access will resume automatically shortly."}
      </p>

      {/* Verified Security Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          padding: "7px 16px",
          borderRadius: 999,
          fontSize: 12.5,
          fontWeight: 650,
          color: "#065f46",
          marginBottom: 32,
        }}
      >
        <CheckCircle2 size={15} color="#059669" />
        <span>All academic records, marks, and grades are safe and preserved</span>
      </div>

      {/* Refresh Status Action */}
      <button
        type="button"
        onClick={handleStatusCheck}
        disabled={checking}
        className="gf-state-btn-primary"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 26px",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 700,
          background: "#2563eb",
          color: "#ffffff",
          border: "none",
          cursor: checking ? "not-allowed" : "pointer",
          boxShadow: "0 2px 10px rgba(37, 99, 235, 0.25)",
          outline: "none",
        }}
      >
        <RefreshCw size={15} className={checking ? "gf-spin" : ""} />
        <span>{checking ? "Checking System Status..." : "Check Status & Try Again"}</span>
      </button>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 3. SERVER ERROR (500)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function ServerErrorState({ onRetry }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 20px 60px",
        minHeight: "75vh",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      role="alert"
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          background: "#fef2f2",
          border: "1px solid #fee2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <ServerCrash size={28} color="#dc2626" strokeWidth={2.2} />
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#fef2f2",
          border: "1px solid #fecaca",
          padding: "3px 12px",
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 750,
          color: "#dc2626",
          marginBottom: 12,
        }}
      >
        HTTP 500 &bull; SERVER ERROR
      </div>

      <h1
        style={{
          fontSize: "clamp(22px, 3.5vw, 28px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 10px 0",
          letterSpacing: "-0.02em",
        }}
      >
        Something went wrong on our end
      </h1>

      <p
        style={{
          fontSize: 15,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 440,
          margin: "0 0 28px 0",
        }}
      >
        Our servers encountered an unexpected issue while processing your request.
        Please try again in a moment.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={onRetry || (() => window.location.reload())}
          className="gf-state-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 22px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(37, 99, 235, 0.25)",
          }}
        >
          <RefreshCw size={15} />
          <span>Try Again</span>
        </button>

        <Link
          to="/"
          className="gf-state-btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 650,
            background: "#ffffff",
            color: "#334155",
            border: "1px solid #cbd5e1",
            textDecoration: "none",
          }}
        >
          <HomeIcon size={15} />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 4. SERVICE UNAVAILABLE (502 / 503 / 504)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function ServiceUnavailableState({ onRetry }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 20px 60px",
        minHeight: "75vh",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      role="alert"
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          background: "#fff7ed",
          border: "1px solid #ffedd5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Clock size={28} color="#ea580c" strokeWidth={2.2} />
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          padding: "3px 12px",
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 750,
          color: "#c2410c",
          marginBottom: 12,
        }}
      >
        SERVICE NOTICE
      </div>

      <h1
        style={{
          fontSize: "clamp(22px, 3.5vw, 28px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 10px 0",
          letterSpacing: "-0.02em",
        }}
      >
        GradeFlow is temporarily unavailable
      </h1>

      <p
        style={{
          fontSize: 15,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 440,
          margin: "0 0 28px 0",
        }}
      >
        We're reconnecting to university data services. Please refresh or check back in a moment.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={onRetry || (() => window.location.reload())}
          className="gf-state-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 22px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(37, 99, 235, 0.25)",
          }}
        >
          <RefreshCw size={15} />
          <span>Refresh Page</span>
        </button>
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 5. SESSION EXPIRED (401)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function SessionExpiredState({ onSignIn }) {
  const { openStudentAuthModal } = useApp();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 20px 60px",
        minHeight: "75vh",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      role="alert"
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          background: "#eff6ff",
          border: "1px solid #dbeafe",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Lock size={28} color="#2563eb" strokeWidth={2.2} />
      </div>

      <h1
        style={{
          fontSize: "clamp(22px, 3.5vw, 28px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 10px 0",
          letterSpacing: "-0.02em",
        }}
      >
        Your session has expired
      </h1>

      <p
        style={{
          fontSize: 15,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 420,
          margin: "0 0 28px 0",
        }}
      >
        For your security and privacy, your authenticated student session has ended.
        Please sign in again to continue.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={onSignIn || (() => openStudentAuthModal({ type: "dashboard" }))}
          className="gf-state-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 24px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(37, 99, 235, 0.25)",
          }}
        >
          <LogIn size={16} />
          <span>Sign In Again</span>
        </button>

        <Link
          to="/"
          className="gf-state-btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 650,
            background: "#ffffff",
            color: "#334155",
            border: "1px solid #cbd5e1",
            textDecoration: "none",
          }}
        >
          <HomeIcon size={15} />
          <span>Go Home</span>
        </Link>
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 6. UNAUTHORIZED / ACCESS RESTRICTED (403)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function UnauthorizedState() {
  const { hasActiveSession, currentRegNo } = useApp();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 20px 60px",
        minHeight: "75vh",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      role="alert"
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          background: "#fef2f2",
          border: "1px solid #fee2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <ShieldAlert size={28} color="#dc2626" strokeWidth={2.2} />
      </div>

      <h1
        style={{
          fontSize: "clamp(22px, 3.5vw, 28px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 10px 0",
          letterSpacing: "-0.02em",
        }}
      >
        Access restricted
      </h1>

      <p
        style={{
          fontSize: 15,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 420,
          margin: "0 0 28px 0",
        }}
      >
        You do not have permission to view this page or administrative area.
      </p>

      <Link
        to={hasActiveSession ? `/dashboard/${currentRegNo}` : "/"}
        className="gf-state-btn-primary"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 22px",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 700,
          background: "#2563eb",
          color: "#ffffff",
          textDecoration: "none",
          boxShadow: "0 2px 10px rgba(37, 99, 235, 0.25)",
        }}
      >
        <HomeIcon size={16} />
        <span>{hasActiveSession ? "Go to Dashboard" : "Return to Home"}</span>
      </Link>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 7. UNEXPECTED APPLICATION ERROR (React Error Boundary Fallback)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function UnexpectedErrorState({ onReset }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 20px 60px",
        minHeight: "75vh",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      role="alert"
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          background: "#fef2f2",
          border: "1px solid #fee2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <AlertTriangle size={28} color="#dc2626" strokeWidth={2.2} />
      </div>

      <h1
        style={{
          fontSize: "clamp(22px, 3.5vw, 28px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 10px 0",
          letterSpacing: "-0.02em",
        }}
      >
        Something went wrong
      </h1>

      <p
        style={{
          fontSize: 15,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 440,
          margin: "0 0 28px 0",
        }}
      >
        GradeFlow encountered an unexpected client error.
        Reloading the application will restore clean state.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={onReset || (() => window.location.reload())}
          className="gf-state-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 22px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(37, 99, 235, 0.25)",
          }}
        >
          <RefreshCw size={15} />
          <span>Reload Application</span>
        </button>
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 8. EMPTY DATA STATE
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function EmptyState({
  icon: Icon = Layers,
  title = "No data found",
  description = "There are no records matching your current filter or request.",
  action = null,
}) {
  return (
    <div
      style={{
        padding: "48px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        width: "100%",
        boxSizing: "border-box",
      }}
      role="status"
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
          color: "#64748b",
        }}
      >
        <Icon size={22} strokeWidth={2} />
      </div>

      <h3
        style={{
          fontSize: 16,
          fontWeight: 750,
          color: "#0f172a",
          margin: "0 0 6px 0",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 14,
          color: "#64748b",
          lineHeight: 1.5,
          margin: action ? "0 0 18px 0" : 0,
          maxWidth: 360,
        }}
      >
        {description}
      </p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: "#2563eb",
            border: "none",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 9. INLINE FORM FAILURE
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function FormFailureState({ message, onRetry }) {
  if (!message) return null;

  return (
    <div
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 14,
        fontSize: 13,
        color: "#991b1b",
        fontWeight: 500,
        boxSizing: "border-box",
      }}
      role="alert"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            background: "transparent",
            border: "none",
            color: "#dc2626",
            fontWeight: 750,
            fontSize: 12,
            cursor: "pointer",
            textDecoration: "underline",
            padding: 0,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 10. SLOW LOADING BAR
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function SlowLoadingState({ onRetry }) {
  return (
    <div
      style={{
        background: "#fff7ed",
        border: "1px solid #fed7aa",
        borderRadius: 12,
        padding: "12px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        maxWidth: 580,
        margin: "14px auto",
        boxSizing: "border-box",
        flexWrap: "wrap",
      }}
      role="status"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200 }}>
        <Hourglass size={16} color="#ea580c" />
        <span style={{ fontSize: 13, fontWeight: 650, color: "#9a3412" }}>
          Taking longer than expected &bull; Connection is slower than usual
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              background: "#ea580c",
              border: "none",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
