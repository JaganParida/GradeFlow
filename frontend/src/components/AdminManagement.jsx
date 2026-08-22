import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Users,
  Key,
  Lock,
  Check,
  X,
  Edit3,
  Trash2,
  Smartphone,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Layers,
  Sliders,
  Activity,
  Clock,
  Server,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  Info,
  Sparkles,
  Search,
  Filter,
  LogOut,
} from "lucide-react";

// Master dictionary of configurable permission capabilities
export const AVAILABLE_PERMISSIONS = {
  routes: [
    { id: "overview", label: "Upload Results", desc: "Access to upload semester results and internal marks" },
    { id: "timetable", label: "Timetable & Calendar", desc: "Access to view, create, and manage timetables" },
    { id: "report-card", label: "Report Card Editor", desc: "Access to student search and report card editor" },
    { id: "missing-uploader", label: "Missing Ingestion", desc: "Access to missing students ingestion" },
    { id: "toppers", label: "Section Toppers", desc: "Access to section rankers and topper reports" },
    { id: "backlogs", label: "Backlog Tracker", desc: "Access to backlog analysis and records" },
    { id: "manage", label: "Manage Records", desc: "Access to batch purging, ranking recalculation & results deletion" },
    { id: "feedback", label: "Student Feedback", desc: "Access to student suggestions and feedback" },
  ],
  actions: [
    { id: "students.view", label: "View Student Records", route: "report-card", desc: "Search and inspect student grades and report cards" },
    { id: "students.update", label: "Update Grades & Records", route: "report-card", desc: "Manually modify grades, subjects, and report cards" },
    { id: "results.upload", label: "Upload Result Spreadsheets", route: "overview", desc: "Upload and parse Excel sheets for semester and internal marks" },
    { id: "results.delete", label: "Delete Semester Results", route: "manage", desc: "Delete individual student semester result records" },
    { id: "toppers.view", label: "View Section Toppers", route: "toppers", desc: "View top 10 rankers per section and department" },
    { id: "backlogs.view", label: "View Backlog Tracker", route: "backlogs", desc: "Inspect student backlogs and academic standings" },
    { id: "emails.send", label: "Send Automated Notification Emails", route: "backlogs", desc: "Dispatch official backlog and topper congratulatory emails" },
    { id: "rankings.regenerate", label: "Regenerate Rankings & SGPA", route: "manage", desc: "Trigger recalculation of competition rankings" },
    { id: "manage.purge-batches", label: "Purge Expired Batches", route: "manage", desc: "Execute 5-year data retention purges" },
    { id: "timetable.manage", label: "Manage Timetables & Calendars", route: "timetable", desc: "Create, publish, and delete academic timetables and calendars" },
    { id: "feedback.view", label: "Moderate Student Feedback", route: "feedback", desc: "Review, like, and moderate student feedback entries" },
  ],
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return "Never";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Never";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "Never";
  }
}

export default function AdminManagement({ API, authHeaders, isMobile }) {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("accounts"); // 'accounts' | 'audit-logs'
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals & Drawers state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPermissionsSubAdmin, setEditingPermissionsSubAdmin] = useState(null);
  const [editingInfoSubAdmin, setEditingInfoSubAdmin] = useState(null);
  const [viewingSessionsSubAdmin, setViewingSessionsSubAdmin] = useState(null);
  const [activeSessionsList, setActiveSessionsList] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formStatus, setFormStatus] = useState("active");
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [selectedActions, setSelectedActions] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilterAction, setLogFilterAction] = useState("");
  const [logFilterResult, setLogFilterResult] = useState("");

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  useEffect(() => {
    if (activeTab === "audit-logs") {
      fetchAuditLogs();
    }
  }, [activeTab, logFilterAction, logFilterResult]);

  async function fetchSubAdmins() {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/subadmins`, authHeaders);
      if (data.success) {
        setSubAdmins(data.subAdmins || []);
      }
    } catch (err) {
      console.error("Failed to fetch sub-admins:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAuditLogs() {
    setLogsLoading(true);
    try {
      const params = {};
      if (logFilterAction) params.action = logFilterAction;
      if (logFilterResult) params.result = logFilterResult;

      const { data } = await axios.get(`${API}/admin/subadmins/audit/logs`, {
        ...authHeaders,
        params,
      });
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }

  function openCreateModal() {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormStatus("active");
    // Default Deny: 0 initial permissions
    setSelectedRoutes([]);
    setSelectedActions([]);
    setFormError("");
    setFormSuccess("");
    setShowCreateModal(true);
  }

  function openPermissionsEditor(subAdmin) {
    setEditingPermissionsSubAdmin(subAdmin);
    setSelectedRoutes(subAdmin.permissions?.routes || []);
    setSelectedActions(subAdmin.permissions?.actions || []);
    setFormError("");
    setFormSuccess("");
  }

  function openInfoEditor(subAdmin) {
    setEditingInfoSubAdmin(subAdmin);
    setFormName(subAdmin.name);
    setFormEmail(subAdmin.email);
    setFormPassword("");
    setFormError("");
    setFormSuccess("");
  }

  async function openSessionsDrawer(subAdmin) {
    setViewingSessionsSubAdmin(subAdmin);
    setSessionsLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/subadmins/${subAdmin._id}`, authHeaders);
      if (data.success) {
        setActiveSessionsList(data.subAdmin?.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  }

  function handleRouteToggle(routeId) {
    if (selectedRoutes.includes(routeId)) {
      setSelectedRoutes(selectedRoutes.filter((r) => r !== routeId));
      // Auto uncheck actions tied to this route
      const actionsInRoute = AVAILABLE_PERMISSIONS.actions
        .filter((a) => a.route === routeId)
        .map((a) => a.id);
      setSelectedActions(selectedActions.filter((a) => !actionsInRoute.includes(a)));
    } else {
      setSelectedRoutes([...selectedRoutes, routeId]);
    }
  }

  function handleActionToggle(actionId, routeId) {
    if (selectedActions.includes(actionId)) {
      setSelectedActions(selectedActions.filter((a) => a !== actionId));
    } else {
      setSelectedActions([...selectedActions, actionId]);
      // Auto enable parent route if not enabled
      if (routeId && !selectedRoutes.includes(routeId)) {
        setSelectedRoutes([...selectedRoutes, routeId]);
      }
    }
  }

  function handleSelectAllPermissions() {
    setSelectedRoutes(AVAILABLE_PERMISSIONS.routes.map((r) => r.id));
    setSelectedActions(AVAILABLE_PERMISSIONS.actions.map((a) => a.id));
  }

  function handleClearAllPermissions() {
    setSelectedRoutes([]);
    setSelectedActions([]);
  }

  // ─── API HANDLERS ──────────────────────────────────────────────────
  async function handleCreateSubAdmin(e) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormLoading(true);

    try {
      const payload = {
        name: formName,
        email: formEmail,
        password: formPassword,
        status: formStatus,
        permissions: {
          routes: selectedRoutes,
          sections: [],
          actions: selectedActions,
        },
      };

      const { data } = await axios.post(`${API}/admin/subadmins`, payload, authHeaders);
      if (data.success) {
        setFormSuccess(`Sub-Admin '${formName}' created successfully.`);
        setTimeout(() => {
          setShowCreateModal(false);
          fetchSubAdmins();
        }, 1200);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create sub-admin.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSavePermissions() {
    if (!editingPermissionsSubAdmin) return;
    setFormError("");
    setFormSuccess("");
    setFormLoading(true);

    try {
      const payload = {
        permissions: {
          routes: selectedRoutes,
          sections: [],
          actions: selectedActions,
        },
      };

      const { data } = await axios.put(
        `${API}/admin/subadmins/${editingPermissionsSubAdmin._id}/permissions`,
        payload,
        authHeaders
      );

      if (data.success) {
        setFormSuccess("Permissions updated successfully. Changes are live immediately.");
        setTimeout(() => {
          setEditingPermissionsSubAdmin(null);
          fetchSubAdmins();
        }, 1200);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save permissions.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSaveInfo(e) {
    e.preventDefault();
    if (!editingInfoSubAdmin) return;
    setFormError("");
    setFormSuccess("");
    setFormLoading(true);

    try {
      const payload = {
        name: formName,
        email: formEmail,
      };
      if (formPassword && formPassword.length >= 8) {
        payload.password = formPassword;
      }

      const { data } = await axios.put(
        `${API}/admin/subadmins/${editingInfoSubAdmin._id}`,
        payload,
        authHeaders
      );

      if (data.success) {
        setFormSuccess("Account details updated.");
        setTimeout(() => {
          setEditingInfoSubAdmin(null);
          fetchSubAdmins();
        }, 1000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update sub-admin.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggleStatus(subAdmin, newStatus) {
    if (!window.confirm(`Are you sure you want to change ${subAdmin.name}'s status to '${newStatus.toUpperCase()}'?`)) {
      return;
    }

    try {
      const { data } = await axios.put(
        `${API}/admin/subadmins/${subAdmin._id}/status`,
        { status: newStatus },
        authHeaders
      );
      if (data.success) {
        fetchSubAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    }
  }

  async function handleRevokeAllSessions(subAdminId) {
    if (!window.confirm("Revoke all active device sessions for this Sub-Admin immediately?")) {
      return;
    }

    try {
      const { data } = await axios.post(
        `${API}/admin/subadmins/${subAdminId}/revoke`,
        {},
        authHeaders
      );
      if (data.success) {
        setActiveSessionsList([]);
        fetchSubAdmins();
        alert(data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to revoke sessions.");
    }
  }

  async function handleRevokeDeviceSession(subAdminId, sessionId) {
    try {
      const { data } = await axios.delete(
        `${API}/admin/subadmins/${subAdminId}/sessions/${sessionId}`,
        authHeaders
      );
      if (data.success) {
        setActiveSessionsList((prev) => prev.filter((s) => s.sessionId !== sessionId));
        fetchSubAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to revoke device session.");
    }
  }

  async function handleDeleteSubAdmin(subAdmin) {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete Sub-Admin '${subAdmin.name}' (${subAdmin.email})? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { data } = await axios.delete(`${API}/admin/subadmins/${subAdmin._id}`, authHeaders);
      if (data.success) {
        fetchSubAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete sub-admin.");
    }
  }

  // Filtered sub-admins
  const filteredSubAdmins = subAdmins.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalActiveSessions = subAdmins.reduce((acc, curr) => acc + (curr.activeSessionCount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Top Header & KPI Summary Cards ── */}
      <div
        className="gf-kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Total Sub-Admins
            </span>
            <Users size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {subAdmins.length}
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Active Accounts
            </span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981", marginTop: 4 }}>
            {subAdmins.filter((s) => s.status === "active").length}
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Disabled / Revoked
            </span>
            <XCircle size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444", marginTop: 4 }}>
            {subAdmins.filter((s) => s.status !== "active").length}
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Active Devices
            </span>
            <Smartphone size={16} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#8b5cf6", marginTop: 4 }}>
            {totalActiveSessions}
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation & Actions Bar ── */}
      <div
        className="gf-management-action-bar"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div className="gf-mgmt-tabs" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`gf-mgmt-tab-btn ${activeTab === "accounts" ? "active" : ""}`}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "none",
              background: activeTab === "accounts" ? "#eff6ff" : "transparent",
              color: activeTab === "accounts" ? "#2563eb" : "#64748b",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <Users size={15} />
            Sub-Admin Accounts
          </button>

          <button
            onClick={() => setActiveTab("audit-logs")}
            className={`gf-mgmt-tab-btn ${activeTab === "audit-logs" ? "active" : ""}`}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "none",
              background: activeTab === "audit-logs" ? "#eff6ff" : "transparent",
              color: activeTab === "audit-logs" ? "#2563eb" : "#64748b",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <Activity size={15} />
            Security & Audit Logs
          </button>
        </div>

        {activeTab === "accounts" && (
          <button
            onClick={openCreateModal}
            className="gf-create-subadmin-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "9px 18px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
            }}
          >
            <UserPlus size={16} />
            Create Sub-Admin
          </button>
        )}
      </div>

      {/* ── TAB 1: SUB-ADMIN ACCOUNTS ── */}
      {activeTab === "accounts" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}
        >
          {/* Table Search & Filter Toolbar */}
          <div
            className="gf-search-filter-toolbar"
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div className="gf-search-input-wrap" style={{ position: "relative", minWidth: 260, flex: 1 }}>
              <Search
                size={15}
                color="#94a3b8"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Search sub-admin by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: 9,
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div className="gf-filter-select-wrap" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#64748b" }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#334155",
                  outline: "none",
                  background: "#ffffff",
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>

          {/* 1A. DESKTOP VIEW: Table */}
          <div className="gf-subadmin-desktop-table" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "12px 18px" }}>Sub-Admin User</th>
                  <th style={{ padding: "12px 14px" }}>Status</th>
                  <th style={{ padding: "12px 14px" }}>Active Devices</th>
                  <th style={{ padding: "12px 14px" }}>Assigned Routes</th>
                  <th style={{ padding: "12px 14px" }}>Last Active</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                      <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                      Loading Sub-Admins...
                    </td>
                  </tr>
                ) : filteredSubAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                      <Users size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
                      <div style={{ fontWeight: 700, color: "#334155" }}>No Sub-Admins Found</div>
                      <div style={{ fontSize: 12, marginTop: 2 }}>Click "Create Sub-Admin" above to configure your first delegated administrator.</div>
                    </td>
                  </tr>
                ) : (
                  filteredSubAdmins.map((subAdmin) => {
                    const routes = subAdmin.permissions?.routes || [];

                    return (
                      <tr
                        key={subAdmin._id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* Sub-Admin Info */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                background: "#eff6ff",
                                color: "#2563eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: 13,
                                flexShrink: 0,
                              }}
                            >
                              {subAdmin.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: "#0f172a" }}>{subAdmin.name}</div>
                              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{subAdmin.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: "14px 14px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "3px 8px",
                              borderRadius: 99,
                              background:
                                subAdmin.status === "active"
                                  ? "#ecfdf5"
                                  : subAdmin.status === "disabled"
                                  ? "#fffbeb"
                                  : "#fef2f2",
                              color:
                                subAdmin.status === "active"
                                  ? "#059669"
                                  : subAdmin.status === "disabled"
                                  ? "#d97706"
                                  : "#dc2626",
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background:
                                  subAdmin.status === "active"
                                    ? "#10b981"
                                    : subAdmin.status === "disabled"
                                    ? "#f59e0b"
                                    : "#ef4444",
                              }}
                            />
                            {subAdmin.status}
                          </span>
                        </td>

                        {/* Active Sessions */}
                        <td style={{ padding: "14px 14px" }}>
                          <button
                            onClick={() => openSessionsDrawer(subAdmin)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "4px 9px",
                              borderRadius: 7,
                              border: "1px solid #e2e8f0",
                              background: subAdmin.activeSessionCount > 0 ? "#f8fafc" : "#fafafa",
                              color: subAdmin.activeSessionCount > 0 ? "#0f172a" : "#94a3b8",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <Smartphone size={13} color={subAdmin.activeSessionCount > 0 ? "#3b82f6" : "#94a3b8"} />
                            <span>{subAdmin.activeSessionCount || 0} Device{subAdmin.activeSessionCount === 1 ? "" : "s"}</span>
                          </button>
                        </td>

                        {/* Granted Routes / Permissions summary */}
                        <td style={{ padding: "14px 14px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 280 }}>
                            {routes.length === 0 ? (
                              <span style={{ fontSize: 11.5, color: "#94a3b8", fontStyle: "italic" }}>
                                Default Deny (0 Permissions)
                              </span>
                            ) : (
                              routes.map((rId) => {
                                const matched = AVAILABLE_PERMISSIONS.routes.find((r) => r.id === rId);
                                return (
                                  <span
                                    key={rId}
                                    style={{
                                      fontSize: 10.5,
                                      fontWeight: 600,
                                      background: "#f1f5f9",
                                      color: "#334155",
                                      padding: "2px 6px",
                                      borderRadius: 5,
                                    }}
                                  >
                                    {matched?.label || rId}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>

                        {/* Last Active Date */}
                        <td style={{ padding: "14px 14px", color: "#64748b", fontSize: 12 }}>
                          {formatTimeAgo(subAdmin.lastActiveAt || subAdmin.lastLoginAt)}
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {/* Edit Permissions Matrix */}
                            <button
                              onClick={() => openPermissionsEditor(subAdmin)}
                              title="Edit Granular Permissions"
                              style={{
                                padding: "6px 10px",
                                borderRadius: 7,
                                border: "1px solid #e0e7ff",
                                background: "#eef2ff",
                                color: "#4f46e5",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Sliders size={13} />
                              Permissions
                            </button>

                            {/* Edit Account */}
                            <button
                              onClick={() => openInfoEditor(subAdmin)}
                              title="Edit Sub-Admin Info"
                              style={{
                                padding: "6px 8px",
                                borderRadius: 7,
                                border: "1px solid #e2e8f0",
                                background: "#ffffff",
                                color: "#475569",
                                cursor: "pointer",
                              }}
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Status Toggle Dropdown / Menu */}
                            <select
                              value={subAdmin.status}
                              onChange={(e) => handleToggleStatus(subAdmin, e.target.value)}
                              style={{
                                padding: "5px 8px",
                                borderRadius: 7,
                                border: "1px solid #e2e8f0",
                                fontSize: 11.5,
                                fontWeight: 600,
                                background: "#ffffff",
                                color: "#334155",
                                cursor: "pointer",
                              }}
                            >
                              <option value="active">Active</option>
                              <option value="disabled">Disable</option>
                              <option value="revoked">Revoke</option>
                            </select>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteSubAdmin(subAdmin)}
                              title="Delete Sub-Admin"
                              style={{
                                padding: "6px 8px",
                                borderRadius: 7,
                                border: "1px solid #fee2e2",
                                background: "#fff5f5",
                                color: "#ef4444",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 1B. MOBILE VIEW: Responsive Cards */}
          <div className="gf-subadmin-mobile-cards" style={{ display: "none", flexDirection: "column", padding: "12px", gap: 12 }}>
            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                Loading Sub-Admins...
              </div>
            ) : filteredSubAdmins.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                <Users size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontWeight: 700, color: "#334155" }}>No Sub-Admins Found</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>Click "Create Sub-Admin" above to configure your first delegated administrator.</div>
              </div>
            ) : (
              filteredSubAdmins.map((subAdmin) => {
                const routes = subAdmin.permissions?.routes || [];
                return (
                  <div
                    key={subAdmin._id}
                    className="gf-mobile-card"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "14px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {/* Header: Avatar, Name/Email, Status */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#eff6ff",
                            color: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {subAdmin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{subAdmin.name}</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{subAdmin.email}</div>
                        </div>
                      </div>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          borderRadius: 99,
                          background:
                            subAdmin.status === "active"
                              ? "#ecfdf5"
                              : subAdmin.status === "disabled"
                              ? "#fffbeb"
                              : "#fef2f2",
                          color:
                            subAdmin.status === "active"
                              ? "#059669"
                              : subAdmin.status === "disabled"
                              ? "#d97706"
                              : "#dc2626",
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background:
                              subAdmin.status === "active"
                                ? "#10b981"
                                : subAdmin.status === "disabled"
                                ? "#f59e0b"
                                : "#ef4444",
                          }}
                        />
                        {subAdmin.status}
                      </span>
                    </div>

                    {/* Quick Stats: Active Devices & Last Active */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        background: "#f8fafc",
                        borderRadius: 8,
                        fontSize: 11.5,
                      }}
                    >
                      <button
                        onClick={() => openSessionsDrawer(subAdmin)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 700,
                          color: subAdmin.activeSessionCount > 0 ? "#2563eb" : "#64748b",
                          cursor: "pointer",
                        }}
                      >
                        <Smartphone size={13} color={subAdmin.activeSessionCount > 0 ? "#2563eb" : "#94a3b8"} />
                        <span>{subAdmin.activeSessionCount || 0} Device(s)</span>
                      </button>

                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#64748b" }}>
                        <Clock size={12} />
                        <span>{formatTimeAgo(subAdmin.lastActiveAt || subAdmin.lastLoginAt)}</span>
                      </div>
                    </div>

                    {/* Permissions Chips */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5, textTransform: "uppercase" }}>
                        Assigned Modules:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {routes.length === 0 ? (
                          <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                            Default Deny (0 Permissions)
                          </span>
                        ) : (
                          routes.map((rId) => {
                            const matched = AVAILABLE_PERMISSIONS.routes.find((r) => r.id === rId);
                            return (
                              <span
                                key={rId}
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  padding: "2px 6px",
                                  borderRadius: 5,
                                }}
                              >
                                {matched?.label || rId}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto auto auto",
                        gap: 6,
                        paddingTop: 10,
                        borderTop: "1px solid #f1f5f9",
                        alignItems: "center",
                      }}
                    >
                      <button
                        onClick={() => openPermissionsEditor(subAdmin)}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: "1px solid #e0e7ff",
                          background: "#eef2ff",
                          color: "#4f46e5",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <Sliders size={13} />
                        Permissions
                      </button>

                      <button
                        onClick={() => openInfoEditor(subAdmin)}
                        title="Edit Info"
                        style={{
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          background: "#ffffff",
                          color: "#475569",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Edit3 size={13} />
                      </button>

                      <select
                        value={subAdmin.status}
                        onChange={(e) => handleToggleStatus(subAdmin, e.target.value)}
                        style={{
                          padding: "6px 8px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          fontSize: 11.5,
                          fontWeight: 600,
                          background: "#ffffff",
                          color: "#334155",
                          cursor: "pointer",
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="disabled">Disable</option>
                        <option value="revoked">Revoke</option>
                      </select>

                      <button
                        onClick={() => handleDeleteSubAdmin(subAdmin)}
                        title="Delete Sub-Admin"
                        style={{
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: "1px solid #fee2e2",
                          background: "#fff5f5",
                          color: "#ef4444",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: AUDIT & SECURITY LOGS ── */}
      {activeTab === "audit-logs" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}
        >
          <div
            className="gf-audit-toolbar"
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={16} color="#2563eb" />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                Sub-Admin Security & Authorization Logs
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <select
                value={logFilterResult}
                onChange={(e) => setLogFilterResult(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12.5,
                  fontWeight: 600,
                  outline: "none",
                }}
              >
                <option value="">All Results</option>
                <option value="SUCCESS">Success Only</option>
                <option value="FORBIDDEN">Blocked / Forbidden Only</option>
              </select>

              <button
                onClick={fetchAuditLogs}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <RefreshCw size={13} className={logsLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* 2A. DESKTOP AUDIT TABLE */}
          <div className="gf-audit-desktop-table" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 18px" }}>Timestamp</th>
                  <th style={{ padding: "12px 14px" }}>Actor</th>
                  <th style={{ padding: "12px 14px" }}>Action</th>
                  <th style={{ padding: "12px 14px" }}>Target / Route</th>
                  <th style={{ padding: "12px 14px" }}>Result</th>
                  <th style={{ padding: "12px 18px" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                      Loading audit logs...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                      No audit events found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 18px", color: "#64748b", whiteSpace: "nowrap" }}>
                        {new Date(log.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0f172a" }}>
                        {log.actorEmail}
                        <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{log.actorType}</div>
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#334155" }}>
                        {log.action}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#64748b", fontFamily: "monospace" }}>
                        {log.route || log.targetId || "-"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 4,
                            background: log.result === "SUCCESS" ? "#ecfdf5" : "#fef2f2",
                            color: log.result === "SUCCESS" ? "#059669" : "#dc2626",
                          }}
                        >
                          {log.result}
                        </span>
                      </td>
                      <td style={{ padding: "12px 18px", color: "#64748b", maxWidth: 260, fontSize: 11.5 }}>
                        {JSON.stringify(log.details || {})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 2B. MOBILE AUDIT CARDS */}
          <div className="gf-audit-mobile-cards" style={{ display: "none", flexDirection: "column", padding: "12px", gap: 10 }}>
            {logsLoading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                Loading audit logs...
              </div>
            ) : auditLogs.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                No audit events found.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log._id}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                      {new Date(log.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: log.result === "SUCCESS" ? "#ecfdf5" : "#fef2f2",
                        color: log.result === "SUCCESS" ? "#059669" : "#dc2626",
                      }}
                    >
                      {log.result}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    {log.action}
                  </div>

                  <div style={{ fontSize: 11.5, color: "#475569" }}>
                    <strong>Actor:</strong> {log.actorEmail} ({log.actorType})
                  </div>

                  {log.route && (
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
                      Target: {log.route}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL 1: CREATE SUB-ADMIN MODAL
         ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCreateModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                width: "100%",
                maxWidth: 680,
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "18px 22px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#eff6ff",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                      Create New Sub-Admin
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Configure credentials and assign strictly scoped permissions (Default Deny).
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <form onSubmit={handleCreateSubAdmin} style={{ display: "flex", flexDirection: "column", overflowY: "auto", padding: 22, gap: 16 }}>
                {formError && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 10, padding: "10px 14px", color: "#991b1b", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={16} />
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div style={{ background: "#ecfdf5", border: "1px solid #d1fae5", borderRadius: 10, padding: "10px 14px", color: "#065f46", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={16} />
                    {formSuccess}
                  </div>
                )}

                {/* Name & Email Fields */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Ramesh Gupta"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 9,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Email Address (Login Identity) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="subadmin@cutm.ac.in"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 9,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Password & Status */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Account Password (Min 8 Chars) *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        placeholder="••••••••••••"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "9px 38px 9px 12px",
                          borderRadius: 9,
                          border: "1px solid #cbd5e1",
                          fontSize: 13,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#64748b",
                          cursor: "pointer",
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Initial Account Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 9,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        outline: "none",
                        background: "#ffffff",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="active">Active (Permitted to log in)</option>
                      <option value="disabled">Disabled (Login blocked)</option>
                    </select>
                  </div>
                </div>

                {/* ── Granular Permission Matrix Picker ── */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                      Granular Permission Matrix (Default Deny)
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        style={{ fontSize: 11.5, color: "#2563eb", background: "none", border: "none", fontWeight: 700, cursor: "pointer" }}
                      >
                        Grant All
                      </button>
                      <span style={{ color: "#cbd5e1" }}>•</span>
                      <button
                        type="button"
                        onClick={handleClearAllPermissions}
                        style={{ fontSize: 11.5, color: "#ef4444", background: "none", border: "none", fontWeight: 700, cursor: "pointer" }}
                      >
                        Revoke All
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "#f8fafc", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    {AVAILABLE_PERMISSIONS.routes.map((route) => {
                      const isRouteChecked = selectedRoutes.includes(route.id);
                      const relatedActions = AVAILABLE_PERMISSIONS.actions.filter((a) => a.route === route.id);

                      return (
                        <div
                          key={route.id}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: 12,
                          }}
                        >
                          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={isRouteChecked}
                              onChange={() => handleRouteToggle(route.id)}
                              style={{ marginTop: 2, accentColor: "#2563eb", width: 16, height: 16 }}
                            />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                {route.label} (Route: <code style={{ fontSize: 11, background: "#f1f5f9", padding: "1px 4px", borderRadius: 4 }}>{route.id}</code>)
                              </div>
                              <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{route.desc}</div>
                            </div>
                          </label>

                          {/* Related Granular Actions */}
                          {relatedActions.length > 0 && isRouteChecked && (
                            <div style={{ marginTop: 10, marginLeft: 26, paddingLeft: 12, borderLeft: "2px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 8 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                                Allowed Actions:
                              </div>
                              {relatedActions.map((action) => (
                                <label key={action.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedActions.includes(action.id)}
                                    onChange={() => handleActionToggle(action.id, route.id)}
                                    style={{ accentColor: "#2563eb" }}
                                  />
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                                    {action.label} (<code style={{ fontSize: 10.5, color: "#64748b" }}>{action.id}</code>)
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Live Access Preview Card ── */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 12,
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#166534", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={14} />
                    Live Access Summary Preview:
                  </div>
                  <div style={{ fontSize: 12, color: "#15803d", lineHeight: 1.6 }}>
                    {selectedRoutes.length === 0 ? (
                      <span style={{ color: "#b91c1c", fontWeight: 700 }}>
                        ⛔ Default Deny: Sub-Admin will have 0 route or action access upon login.
                      </span>
                    ) : (
                      <span>
                        Granted access to <strong>{selectedRoutes.length} route(s)</strong> and <strong>{selectedActions.length} granular action(s)</strong>.
                      </span>
                    )}
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 9,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    style={{
                      padding: "9px 20px",
                      borderRadius: 9,
                      border: "none",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {formLoading && <RefreshCw size={14} className="animate-spin" />}
                    Create Sub-Admin
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          MODAL 2: EDIT PERMISSION MATRIX MODAL
         ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editingPermissionsSubAdmin && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                width: "100%",
                maxWidth: 680,
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "18px 22px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#eef2ff",
                      color: "#4f46e5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                      Edit Permissions: {editingPermissionsSubAdmin.name}
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Instant propagation — modifications apply immediately on the next API request.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setEditingPermissionsSubAdmin(null)}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", padding: 22, gap: 16 }}>
                {formError && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 10, padding: "10px 14px", color: "#991b1b", fontSize: 13 }}>
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div style={{ background: "#ecfdf5", border: "1px solid #d1fae5", borderRadius: 10, padding: "10px 14px", color: "#065f46", fontSize: 13 }}>
                    {formSuccess}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>
                    Select Allowed Routes and Actions:
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      style={{ fontSize: 11.5, color: "#2563eb", background: "none", border: "none", fontWeight: 700, cursor: "pointer" }}
                    >
                      Grant All
                    </button>
                    <span style={{ color: "#cbd5e1" }}>•</span>
                    <button
                      type="button"
                      onClick={handleClearAllPermissions}
                      style={{ fontSize: 11.5, color: "#ef4444", background: "none", border: "none", fontWeight: 700, cursor: "pointer" }}
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "#f8fafc", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  {AVAILABLE_PERMISSIONS.routes.map((route) => {
                    const isRouteChecked = selectedRoutes.includes(route.id);
                    const relatedActions = AVAILABLE_PERMISSIONS.actions.filter((a) => a.route === route.id);

                    return (
                      <div
                        key={route.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                          padding: 12,
                        }}
                      >
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={isRouteChecked}
                            onChange={() => handleRouteToggle(route.id)}
                            style={{ marginTop: 2, accentColor: "#2563eb", width: 16, height: 16 }}
                          />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                              {route.label}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{route.desc}</div>
                          </div>
                        </label>

                        {relatedActions.length > 0 && isRouteChecked && (
                          <div style={{ marginTop: 10, marginLeft: 26, paddingLeft: 12, borderLeft: "2px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                              Granular Actions:
                            </div>
                            {relatedActions.map((action) => (
                              <label key={action.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={selectedActions.includes(action.id)}
                                  onChange={() => handleActionToggle(action.id, route.id)}
                                  style={{ accentColor: "#2563eb" }}
                                />
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                                  {action.label} (<code style={{ fontSize: 10.5, color: "#64748b" }}>{action.id}</code>)
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Live Preview */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 12,
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#166534", marginBottom: 4 }}>
                    Live Preview Before Saving:
                  </div>
                  <div style={{ fontSize: 12, color: "#15803d" }}>
                    Granted: <strong>{selectedRoutes.length} route(s)</strong> and <strong>{selectedActions.length} action(s)</strong>.
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setEditingPermissionsSubAdmin(null)}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 9,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    disabled={formLoading}
                    style={{
                      padding: "9px 20px",
                      borderRadius: 9,
                      border: "none",
                      background: "#4f46e5",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {formLoading && <RefreshCw size={14} className="animate-spin" />}
                    Save Permissions
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          MODAL 3: ACTIVE DEVICE SESSIONS DRAWER
         ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {viewingSessionsSubAdmin && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                width: "100%",
                maxWidth: 580,
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div
                style={{
                  padding: "18px 22px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#f3e8ff",
                      color: "#8b5cf6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                      Active Devices: {viewingSessionsSubAdmin.name}
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      View connected sessions and revoke devices in real-time.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setViewingSessionsSubAdmin(null)}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: 22, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                {sessionsLoading ? (
                  <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                    Loading active sessions...
                  </div>
                ) : activeSessionsList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>
                    <Smartphone size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontWeight: 700, color: "#334155" }}>No Active Devices</div>
                    <div style={{ fontSize: 12, marginTop: 2 }}>This Sub-Admin is currently not logged in on any device.</div>
                  </div>
                ) : (
                  activeSessionsList.map((session) => (
                    <div
                      key={session.sessionId}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#f8fafc",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Smartphone size={20} color="#3b82f6" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                            {session.deviceInfo?.platform || "Device"} • {session.deviceInfo?.userAgent ? session.deviceInfo.userAgent.slice(0, 45) + "..." : "Browser Session"}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                            IP: {session.deviceInfo?.ip || "Unknown"} • Active: {formatTimeAgo(session.lastActiveAt)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeDeviceSession(viewingSessionsSubAdmin._id, session.sessionId)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 7,
                          border: "1px solid #fee2e2",
                          background: "#fff5f5",
                          color: "#ef4444",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <LogOut size={13} />
                        Revoke
                      </button>
                    </div>
                  ))
                )}

                {activeSessionsList.length > 1 && (
                  <button
                    onClick={() => handleRevokeAllSessions(viewingSessionsSubAdmin._id)}
                    style={{
                      marginTop: 8,
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "none",
                      background: "#ef4444",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <LogOut size={15} />
                    Revoke All Active Sessions
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          MODAL 4: EDIT SUB-ADMIN BASIC INFO MODAL
         ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editingInfoSubAdmin && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                width: "100%",
                maxWidth: 480,
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div
                style={{
                  padding: "18px 22px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Edit Sub-Admin Details
                </h3>
                <button
                  onClick={() => setEditingInfoSubAdmin(null)}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveInfo} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                {formError && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, padding: "8px 12px", color: "#991b1b", fontSize: 12.5 }}>
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div style={{ background: "#ecfdf5", border: "1px solid #d1fae5", borderRadius: 8, padding: "8px 12px", color: "#065f46", fontSize: 12.5 }}>
                    {formSuccess}
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    New Password (Leave blank to keep existing)
                  </label>
                  <input
                    type="password"
                    minLength={8}
                    placeholder="Leave blank to keep unchanged"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setEditingInfoSubAdmin(null)}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    {formLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .gf-subadmin-desktop-table,
          .gf-audit-desktop-table {
            display: none !important;
          }
          .gf-subadmin-mobile-cards,
          .gf-audit-mobile-cards {
            display: flex !important;
          }
          .gf-management-action-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
            padding: 12px 14px !important;
          }
          .gf-mgmt-tabs {
            width: 100% !important;
          }
          .gf-mgmt-tab-btn {
            flex: 1 !important;
            text-align: center !important;
            font-size: 12px !important;
            padding: 8px 6px !important;
          }
          .gf-create-subadmin-btn {
            width: 100% !important;
          }
          .gf-search-filter-toolbar,
          .gf-audit-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 12px 14px !important;
            gap: 10px !important;
          }
          .gf-search-input-wrap {
            min-width: 100% !important;
          }
          .gf-filter-select-wrap {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .gf-filter-select-wrap select {
            flex: 1 !important;
          }
          .gf-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
        }
        @media (max-width: 480px) {
          .gf-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
