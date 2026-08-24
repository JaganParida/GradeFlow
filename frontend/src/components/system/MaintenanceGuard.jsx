import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { MaintenanceState } from "./SystemState";

export default function MaintenanceGuard({ children }) {
  const {
    maintenance,
    checkMaintenanceStatus,
    adminToken,
    maintenanceChecked,
    authChecking,
  } = useApp();
  const location = useLocation();

  // Authorized Admin Access: Only if admin is authenticated with active adminToken
  const isAuthorizedAdminAccess =
    Boolean(adminToken) && location.pathname.startsWith("/admin");
  const isAdminLoginPage = location.pathname === "/admin/login";

  // Allow navigation only for authenticated admins or the secure admin login route
  const allowAccess = isAuthorizedAdminAccess || isAdminLoginPage;

  // Lock body scroll if maintenance is active on blocked routes
  useEffect(() => {
    if (maintenance?.enabled && !allowAccess) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [maintenance?.enabled, allowAccess]);

  // Initial startup barrier: Prevent 404 or student dashboard flash on hard refresh
  if (!maintenanceChecked && authChecking && !isAdminLoginPage) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fcfdfe",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 18,
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
            }}
          >
            G
          </span>
          <div
            className="gf-spin"
            style={{
              width: 22,
              height: 22,
              border: "2.5px solid #e2e8f0",
              borderTopColor: "#2563eb",
              borderRadius: "50%",
            }}
          />
        </div>
      </div>
    );
  }

  // If maintenance is ON and user is NOT an authorized logged-in admin, block fully
  if (maintenance?.enabled && !allowAccess) {
    return (
      <MaintenanceState
        message={maintenance.message}
        onRetry={async () => {
          await checkMaintenanceStatus(true);
        }}
      />
    );
  }

  return children;
}
