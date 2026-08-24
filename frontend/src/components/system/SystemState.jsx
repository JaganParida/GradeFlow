import React from "react";
import NotFoundPage from "./NotFoundPage";
import MaintenancePage from "./MaintenancePage";
import OfflinePage from "./OfflinePage";
import SessionExpiredPage from "./SessionExpiredPage";
import RateLimitPage from "./RateLimitPage";
import ServerErrorPage from "./ServerErrorPage";
import ServiceUnavailablePage from "./ServiceUnavailablePage";
import AccessDeniedPage from "./AccessDeniedPage";
import { AlertTriangle, Layers, Hourglass } from "lucide-react";

// ─── Exported Full-Page Animated State Components ───────────────────────────
export { default as NotFoundPage } from "./NotFoundPage";
export { default as MaintenancePage } from "./MaintenancePage";
export { default as OfflinePage } from "./OfflinePage";
export { default as SessionExpiredPage } from "./SessionExpiredPage";
export { default as RateLimitPage } from "./RateLimitPage";
export { default as ServerErrorPage } from "./ServerErrorPage";
export { default as ServiceUnavailablePage } from "./ServiceUnavailablePage";
export { default as AccessDeniedPage } from "./AccessDeniedPage";

// Alias bindings matching standard named imports across the app
export const NotFoundState = NotFoundPage;
export const MaintenanceState = MaintenancePage;
export const OfflineState = OfflinePage;
export const SessionExpiredState = SessionExpiredPage;
export const RateLimitState = RateLimitPage;
export const ServerErrorState = ServerErrorPage;
export const ServiceUnavailableState = ServiceUnavailablePage;
export const UnauthorizedState = AccessDeniedPage;
export const UnexpectedErrorState = ServerErrorPage;

/**
 * ─── Empty Data State (Inline Container Component) ───────────────────────────
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
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
          color: "#64748b",
        }}
      >
        <Icon size={24} strokeWidth={2} />
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
          lineHeight: 1.55,
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
            padding: "8px 18px",
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
 * ─── Inline Form Failure Alert Banner ───────────────────────────────────────
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
 * ─── Slow Loading Floating / Inline Bar ─────────────────────────────────────
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
