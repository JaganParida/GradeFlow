import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  WifiOff,
  Clock,
  ServerCrash,
  ShieldAlert,
  Lock,
  Hourglass,
  FileQuestion,
  RefreshCw,
  Home as HomeIcon,
  ArrowLeft,
  LogIn,
  Layers,
  CheckCircle2,
  Wrench,
  Search,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE SYSTEM STATE CONTAINER (GradeFlow Unified SaaS Design Language)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function SystemState({
  icon: Icon = AlertTriangle,
  iconColor = "#2563eb",
  iconBg = "#eff6ff",
  badgeText = "",
  badgeColor = "#2563eb",
  badgeBg = "#eff6ff",
  title = "Something went wrong",
  description = "We encountered an issue. Please try again.",
  primaryAction = null, // { label, onClick, icon, href }
  secondaryAction = null, // { label, onClick, icon, href }
  isFullScreen = false,
  extraContent = null,
  fullViewportBlock = false,
}) {
  const navigate = useNavigate();

  const renderButton = (action, isPrimary = true) => {
    if (!action) return null;
    const { label, onClick, icon: ActionIcon, href, loading, disabled } = action;

    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: isPrimary ? "12px 22px" : "11px 18px",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: isPrimary ? 700 : 600,
      cursor: disabled || loading ? "not-allowed" : "pointer",
      opacity: disabled || loading ? 0.7 : 1,
      transition: "all 0.15s ease",
      textDecoration: "none",
      outline: "none",
      boxSizing: "border-box",
      whiteSpace: "nowrap",
    };

    const primaryStyle = {
      ...baseStyle,
      background: "#2563eb",
      color: "#ffffff",
      border: "none",
      boxShadow: "0 2px 10px rgba(37, 99, 235, 0.22)",
    };

    const secondaryStyle = {
      ...baseStyle,
      background: "#ffffff",
      color: "#334155",
      border: "1px solid #cbd5e1",
    };

    const style = isPrimary ? primaryStyle : secondaryStyle;

    const content = (
      <>
        {loading ? (
          <RefreshCw size={15} className="gf-spin" />
        ) : (
          ActionIcon && <ActionIcon size={15} />
        )}
        <span>{label}</span>
      </>
    );

    if (href) {
      return (
        <Link
          to={href}
          style={style}
          className={isPrimary ? "gf-state-btn-primary" : "gf-state-btn-secondary"}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        style={style}
        className={isPrimary ? "gf-state-btn-primary" : "gf-state-btn-secondary"}
      >
        {content}
      </button>
    );
  };

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: isFullScreen ? "60px 24px" : "40px 20px",
    width: "100%",
    minHeight: isFullScreen ? "75vh" : "auto",
    boxSizing: "border-box",
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  if (fullViewportBlock) {
    containerStyle.position = "fixed";
    containerStyle.inset = 0;
    containerStyle.zIndex = 999999;
    containerStyle.background = "#fcfdfe";
    containerStyle.minHeight = "100vh";
    containerStyle.overflowY = "auto";
  }

  return (
    <div style={containerStyle} role="alert" aria-live="polite">
      {/* Brand Header Mark */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "#ffffff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 14,
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
          }}
        >
          G
        </span>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
          GradeFlow
        </span>
      </div>

      {/* Main Card Container */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          padding: "36px 32px",
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        {/* Icon Pill */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <Icon size={26} color={iconColor} strokeWidth={2.2} />
        </div>

        {/* Optional Badge */}
        {badgeText && (
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 750,
              color: badgeColor,
              background: badgeBg,
              padding: "3px 10px",
              borderRadius: 99,
              marginBottom: 12,
              letterSpacing: "0.02em",
            }}
          >
            {badgeText}
          </span>
        )}

        {/* Heading */}
        <h2
          style={{
            fontSize: "clamp(20px, 3.5vw, 24px)",
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 10px 0",
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
          }}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.55,
            color: "#64748b",
            margin: "0 0 24px 0",
            maxWidth: 380,
          }}
        >
          {description}
        </p>

        {/* Extra Context / Details */}
        {extraContent && (
          <div style={{ width: "100%", marginBottom: 20 }}>
            {extraContent}
          </div>
        )}

        {/* Action Buttons */}
        {(primaryAction || secondaryAction) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            {secondaryAction && renderButton(secondaryAction, false)}
            {primaryAction && renderButton(primaryAction, true)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 1. 404 — PAGE NOT FOUND
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function NotFoundState() {
  const { hasActiveSession, currentRegNo } = useApp();
  const navigate = useNavigate();

  return (
    <SystemState
      icon={FileQuestion}
      iconColor="#2563eb"
      iconBg="#eff6ff"
      badgeText="404 Error"
      badgeColor="#2563eb"
      badgeBg="#eff6ff"
      title="Page not found"
      description="The page you're looking for doesn't exist or may have been moved to a new address."
      isFullScreen={true}
      primaryAction={{
        label: hasActiveSession ? "Go to Dashboard" : "Go Home",
        href: hasActiveSession ? `/dashboard/${currentRegNo}` : "/",
        icon: HomeIcon,
      }}
      secondaryAction={{
        label: "Go Back",
        onClick: () => navigate(-1),
        icon: ArrowLeft,
      }}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 2. OFFLINE STATE (No Internet Connection)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function OfflineState({ onRetry }) {
  return (
    <SystemState
      icon={WifiOff}
      iconColor="#b45309"
      iconBg="#fef3c7"
      badgeText="No Internet Connection"
      badgeColor="#b45309"
      badgeBg="#fef3c7"
      title="You're offline"
      description="Your internet connection appears to be unavailable. Check your connection and try again."
      isFullScreen={true}
      primaryAction={{
        label: "Try Again",
        onClick: onRetry || (() => window.location.reload()),
        icon: RefreshCw,
      }}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 3. NETWORK REQUEST FAILED
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function NetworkErrorState({ onRetry, message }) {
  return (
    <SystemState
      icon={AlertTriangle}
      iconColor="#dc2626"
      iconBg="#fef2f2"
      badgeText="Network Error"
      badgeColor="#dc2626"
      badgeBg="#fef2f2"
      title="Something went wrong"
      description={message || "We couldn't complete that request right now. Please check your connection and try again."}
      primaryAction={{
        label: "Try Again",
        onClick: onRetry,
        icon: RefreshCw,
      }}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 4. SLOW LOADING / TAKING LONGER THAN EXPECTED
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function SlowLoadingState({ onRetry, onKeepWaiting }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #fed7aa",
        borderRadius: 14,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        maxWidth: 580,
        margin: "16px auto",
        boxShadow: "0 2px 8px rgba(234, 88, 12, 0.06)",
        boxSizing: "border-box",
        flexWrap: "wrap",
      }}
      role="status"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200, flex: 1 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#fff7ed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Hourglass size={18} color="#ea580c" />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 750, color: "#9a3412" }}>
            Taking longer than expected
          </div>
          <div style={{ fontSize: 12, color: "#7c2d12", opacity: 0.85 }}>
            Your connection seems slower than usual. We're still loading your data.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onKeepWaiting && (
          <button
            type="button"
            onClick={onKeepWaiting}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background: "#ffffff",
              border: "1px solid #fdba74",
              color: "#9a3412",
              fontSize: 12,
              fontWeight: 650,
              cursor: "pointer",
            }}
          >
            Keep Waiting
          </button>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background: "#ea580c",
              border: "none",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 5. REQUEST TIMEOUT
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function TimeoutState({ onRetry }) {
  return (
    <SystemState
      icon={Clock}
      iconColor="#ea580c"
      iconBg="#fff7ed"
      badgeText="Request Timeout"
      badgeColor="#ea580c"
      badgeBg="#fff7ed"
      title="That took too long"
      description="We couldn't complete the request in time. Please verify your connection and try again."
      primaryAction={{
        label: "Try Again",
        onClick: onRetry,
        icon: RefreshCw,
      }}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 6. SERVER ERROR (HTTP 500)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function ServerErrorState({ onRetry }) {
  return (
    <SystemState
      icon={ServerCrash}
      iconColor="#dc2626"
      iconBg="#fef2f2"
      badgeText="Server Issue"
      badgeColor="#dc2626"
      badgeBg="#fef2f2"
      title="Something went wrong"
      description="We're having trouble processing this request right now. Our systems are working to restore it."
      isFullScreen={true}
      primaryAction={{
        label: "Try Again",
        onClick: onRetry || (() => window.location.reload()),
        icon: RefreshCw,
      }}
      secondaryAction={{
        label: "Go Home",
        href: "/",
        icon: HomeIcon,
      }}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 7. SERVICE TEMPORARILY UNAVAILABLE (HTTP 502 / 503 / 504)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function ServiceUnavailableState({ onRetry }) {
  return (
    <SystemState
      icon={ServerCrash}
      iconColor="#b45309"
      iconBg="#fef3c7"
      badgeText="Service Notice"
      badgeColor="#b45309"
      badgeBg="#fef3c7"
      title="GradeFlow is temporarily unavailable"
      description="We're having trouble connecting to the university data service right now. Please try again shortly."
      isFullScreen={true}
      primaryAction={{
        label: "Try Again",
        onClick: onRetry || (() => window.location.reload()),
        icon: RefreshCw,
      }}
      secondaryAction={{
        label: "Go Home",
        href: "/",
        icon: HomeIcon,
      }}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 8. GLOBAL MAINTENANCE MODE (Full Viewport Blocking Experience)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function MaintenanceState({ message, onRetry }) {
  return (
    <SystemState
      fullViewportBlock={true}
      icon={Wrench}
      iconColor="#2563eb"
      iconBg="#eff6ff"
      badgeText="Scheduled Maintenance"
      badgeColor="#2563eb"
      badgeBg="#eff6ff"
      title="We're making things better"
      description={
        message ||
        "GradeFlow is temporarily unavailable while we make improvements behind the scenes. Your academic data remains completely safe and protected."
      }
      primaryAction={{
        label: "Check Status & Try Again",
        onClick: onRetry || (() => window.location.reload()),
        icon: RefreshCw,
      }}
      extraContent={
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #f1f5f9",
            borderRadius: 10,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 12,
            color: "#64748b",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={14} color="#059669" />
          <span>All Student Records &amp; Grades Safe</span>
        </div>
      }
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 9. SESSION EXPIRED (HTTP 401)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function SessionExpiredState({ onSignIn }) {
  const { openStudentAuthModal } = useApp();

  return (
    <SystemState
      icon={Lock}
      iconColor="#2563eb"
      iconBg="#eff6ff"
      badgeText="Session Notice"
      badgeColor="#2563eb"
      badgeBg="#eff6ff"
      title="Your session has expired"
      description="For your security and privacy, your authenticated student session has ended. Please sign in again to continue."
      isFullScreen={true}
      primaryAction={{
        label: "Sign In",
        onClick: onSignIn || (() => openStudentAuthModal({ type: "dashboard" })),
        icon: LogIn,
      }}
      secondaryAction={{
        label: "Go Home",
        href: "/",
        icon: HomeIcon,
      }}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 10. UNAUTHORIZED / ACCESS RESTRICTED (HTTP 403)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function UnauthorizedState() {
  const { hasActiveSession, currentRegNo } = useApp();

  return (
    <SystemState
      icon={ShieldAlert}
      iconColor="#dc2626"
      iconBg="#fef2f2"
      badgeText="Access Restricted"
      badgeColor="#dc2626"
      badgeBg="#fef2f2"
      title="Access restricted"
      description="You don't have permission to access this page or administrative area."
      isFullScreen={true}
      primaryAction={{
        label: hasActiveSession ? "Go to Dashboard" : "Go Home",
        href: hasActiveSession ? `/dashboard/${currentRegNo}` : "/",
        icon: HomeIcon,
      }}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 11. RATE LIMITED (HTTP 429)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function RateLimitState({ message, onRetry }) {
  return (
    <SystemState
      icon={Hourglass}
      iconColor="#ea580c"
      iconBg="#fff7ed"
      badgeText="High Activity"
      badgeColor="#ea580c"
      badgeBg="#fff7ed"
      title="Too many attempts"
      description={message || "Please wait a moment before trying again to protect service performance."}
      primaryAction={{
        label: "Try Again",
        onClick: onRetry || (() => window.location.reload()),
        icon: RefreshCw,
      }}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 12. EMPTY DATA STATE
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function EmptyState({
  icon: Icon = Layers,
  title = "No academic data yet",
  description = "Once your academic information is available, you'll see your insights and records here.",
  action = null, // { label, onClick, href }
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px dashed #cbd5e1",
        borderRadius: 16,
        padding: "36px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        width: "100%",
        boxSizing: "border-box",
        margin: "12px 0",
      }}
      role="status"
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
          color: "#94a3b8",
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
          fontSize: 13.5,
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
 * 13. UNEXPECTED APPLICATION ERROR (React Error Boundary Fallback)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function UnexpectedErrorState({ onReset }) {
  return (
    <SystemState
      icon={AlertTriangle}
      iconColor="#dc2626"
      iconBg="#fef2f2"
      badgeText="Application Error"
      badgeColor="#dc2626"
      badgeBg="#fef2f2"
      title="Something went wrong"
      description="GradeFlow couldn't display this page correctly. We've recorded the error and are working on it."
      isFullScreen={true}
      primaryAction={{
        label: "Try Again",
        onClick: onReset || (() => window.location.reload()),
        icon: RefreshCw,
      }}
      secondaryAction={{
        label: "Go Home",
        href: "/",
        icon: HomeIcon,
      }}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 14. FORM FAILURE STATE (Inline Form Feedback)
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
