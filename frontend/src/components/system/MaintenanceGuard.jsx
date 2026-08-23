import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { MaintenanceState } from "./SystemState";

export default function MaintenanceGuard({ children }) {
  const { maintenance, checkMaintenanceStatus, adminToken } = useApp();
  const location = useLocation();

  // Allow Main Admin and Sub-Admin route access to manage the platform
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Lock body scroll if maintenance is active on student/public routes
  useEffect(() => {
    if (maintenance?.enabled && !isAdminRoute) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [maintenance?.enabled, isAdminRoute]);

  // If maintenance is ON and user is NOT accessing the admin portal, block full viewport
  if (maintenance?.enabled && !isAdminRoute) {
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
