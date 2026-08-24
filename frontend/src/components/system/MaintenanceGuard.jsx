import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { MaintenanceState } from "./SystemState";

export default function MaintenanceGuard({ children }) {
  const { maintenance, checkMaintenanceStatus, adminToken } = useApp();
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

  // If maintenance is ON and user is NOT an authorized logged-in admin or logging in, block fully
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
