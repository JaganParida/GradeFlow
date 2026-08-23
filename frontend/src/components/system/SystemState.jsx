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
  Compass,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE MINIMALIST SYSTEM STATE (Google-Style Clean, Frameless, Open Layout)
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
  primaryAction = null,
  secondaryAction = null,
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
      padding: isPrimary ? "11px 22px" : "10px 18px",
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
    padding: isFullScreen ? "80px 24px" : "40px 20px",
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
      {/* Icon */}
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
        }}
      >
        <Icon size={28} color={iconColor} strokeWidth={2.2} />
      </div>

      {/* Optional Badge */}
      {badgeText && (
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 750,
            color: badgeColor,
            background: badgeBg,
            padding: "3px 11px",
            borderRadius: 99,
            marginBottom: 14,
            letterSpacing: "0.02em",
          }}
        >
          {badgeText}
        </span>
      )}

      {/* Heading */}
      <h1
        style={{
          fontSize: "clamp(22px, 4vw, 28px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 10px 0",
          letterSpacing: "-0.03em",
          lineHeight: 1.25,
          maxWidth: 520,
        }}
      >
        {title}
      </h1>

      {/* Description */}
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: "#64748b",
          margin: "0 0 28px 0",
          maxWidth: 440,
        }}
      >
        {description}
      </p>

      {/* Extra Content */}
      {extraContent && (
        <div style={{ width: "100%", maxWidth: 440, marginBottom: 24 }}>
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
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 1. 404 — PAGE NOT FOUND (Google-Style Sleek Minimalist Canvas)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function NotFoundState() {
  const { hasActiveSession, currentRegNo } = useApp();
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "100px 24px 80px",
        minHeight: "75vh",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: "clamp(64px, 12vw, 96px)",
          fontWeight: 900,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          color: "#0f172a",
          marginBottom: 8,
          background: "linear-gradient(135deg, #0f172a 30%, #3b82f6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        404
      </div>

      <h1
        style={{
          fontSize: "clamp(22px, 3.5vw, 26px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 10px 0",
          letterSpacing: "-0.02em",
        }}
      >
        Page not found
      </h1>

      <p
        style={{
          fontSize: 15,
          color: "#64748b",
          lineHeight: 1.55,
          maxWidth: 420,
          margin: "0 0 28px 0",
        }}
      >
        The link you followed may be broken, or the page may have been removed.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="gf-state-btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            background: "#ffffff",
            color: "#334155",
            border: "1px solid #cbd5e1",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} />
          <span>Go Back</span>
        </button>

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
            boxShadow: "0 2px 10px rgba(37, 99, 235, 0.22)",
          }}
        >
          <HomeIcon size={15} />
          <span>{hasActiveSession ? "Go to Dashboard" : "Go Home"}</span>
        </Link>
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 2. OFFLINE STATE (Keeps Page Interactive with Top Toast)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function OfflineState({ onRetry }) {
  return (
    <SystemState
      icon={WifiOff}
      iconColor="#b45309"
      iconBg="#fef3c7"
      badgeText="Working Offline"
      badgeColor="#b45309"
      badgeBg="#fef3c7"
      title="You're currently offline"
      description="Your connection is unavailable. Cached records remain readable. Reconnect to load live updates."
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
      badgeText="Connection Notice"
      badgeColor="#dc2626"
      badgeBg="#fef2f2"
      title="Unable to load data"
      description={message || "We couldn't connect to the server right now. Check your internet connection and try again."}
      primaryAction={{
        label: "Retry",
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
      title="Request timed out"
      description="The server took too long to respond. Please verify your connection and try again."
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
      description="We're having trouble processing this request right now. Please try again shortly."
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
      description="We're updating or reconnecting our services. Please check back in a moment."
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
 * 8. GLOBAL MAINTENANCE MODE (Clean, Immersive, Non-Boxed Screen)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function MaintenanceState({ message, onRetry }) {
  return (
    <SystemState
      fullViewportBlock={true}
      icon={Wrench}
      iconColor="#2563eb"
      iconBg="#eff6ff"
      badgeText="System Maintenance"
      badgeColor="#2563eb"
      badgeBg="#eff6ff"
      title="We're making things better"
      description={
        message ||
        "GradeFlow is currently undergoing scheduled platform improvements. All student records and grades remain safe and protected."
      }
      primaryAction={{
        label: "Check Status & Try Again",
        onClick: onRetry || (() => window.location.reload()),
        icon: RefreshCw,
      }}
      extraContent={
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            color: "#059669",
            fontWeight: 650,
            background: "#ecfdf5",
            padding: "6px 14px",
            borderRadius: 99,
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
      title="Session expired"
      description="For your privacy and security, your authenticated session has ended. Sign in to resume."
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
      description="You don't have permission to access this page."
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
      description={message || "Please wait a moment before trying again."}
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
      description="GradeFlow couldn't display this section. Click below to reload cleanly."
      isFullScreen={true}
      primaryAction={{
        label: "Reload Page",
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
