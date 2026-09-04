import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useApp } from "../context/AppContext";
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
  UploadCloud,
  Calendar,
  FileText,
  UserCheck,
  Trophy,
  ClipboardList,
  MessageSquare,
  Zap,
  Copy,
  Settings,
  Wrench,
  Globe,
  Star,
  Save,
} from "lucide-react";

// Master dictionary of configurable permission capabilities
export const AVAILABLE_PERMISSIONS = {
  routes: [
    { id: "overview", label: "Upload Results", desc: "Access to upload semester results and internal marks" },
    { id: "live-traffic", label: "Live Active Students", desc: "Access to real-time active student monitoring, traffic analytics, and queue control" },
    { id: "timetable", label: "Timetable & Calendar", desc: "Access to view, create, and manage timetables" },
    { id: "report-card", label: "Report Card Editor", desc: "Access to student search and report card editor" },
    { id: "missing-uploader", label: "Missing Ingestion", desc: "Access to missing students ingestion" },
    { id: "toppers", label: "Section Toppers", desc: "Access to section rankers and topper reports" },
    { id: "backlogs", label: "Backlog Tracker", desc: "Access to backlog analysis and records" },
    { id: "manage", label: "Manage Records", desc: "Access to batch purging, ranking recalculation & results deletion" },
    { id: "feedback", label: "Student Feedback", desc: "Access to student suggestions and feedback" },
  ],
  actions: [
    { id: "students.search", label: "Search Student Records", route: "report-card", desc: "Search and inspect any student grades, report cards, and details" },
    { id: "students.view", label: "View Student Records", route: "report-card", desc: "View loaded student semester records and grade sheets" },
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

export const ROUTE_ICONS = {
  overview: UploadCloud,
  "live-traffic": Activity,
  timetable: Calendar,
  "report-card": FileText,
  "missing-uploader": UserCheck,
  toppers: Trophy,
  backlogs: ClipboardList,
  manage: Settings,
  feedback: MessageSquare,
};

export const ROLE_PRESETS = [
  {
    id: "full",
    label: "Full Access",
    desc: "All 9 routes & 12 actions",
    icon: Zap,
    routes: ["overview", "live-traffic", "timetable", "report-card", "missing-uploader", "toppers", "backlogs", "manage", "feedback"],
    actions: [
      "students.search", "students.view", "students.update", "results.upload", "results.delete",
      "toppers.view", "backlogs.view", "emails.send", "rankings.regenerate",
      "manage.purge-batches", "timetable.manage", "feedback.view"
    ],
  },
  {
    id: "results_lead",
    label: "Results & Analytics",
    desc: "Results, Report Card, Toppers, Backlogs",
    icon: Trophy,
    routes: ["overview", "report-card", "missing-uploader", "toppers", "backlogs"],
    actions: ["students.search", "students.view", "students.update", "results.upload", "toppers.view", "backlogs.view", "emails.send"],
  },
  {
    id: "academic_coordinator",
    label: "Academic Coordinator",
    desc: "Timetable, Feedback, Report Cards",
    icon: Calendar,
    routes: ["timetable", "report-card", "feedback"],
    actions: ["students.search", "students.view", "timetable.manage", "feedback.view"],
  },
  {
    id: "auditor",
    label: "Auditor (Read-Only)",
    desc: "View grades, rankers & backlogs",
    icon: Eye,
    routes: ["report-card", "toppers", "backlogs", "feedback"],
    actions: ["students.search", "students.view", "toppers.view", "backlogs.view", "feedback.view"],
  },
  {
    id: "zero_trust",
    label: "Zero-Trust (Default)",
    desc: "0 routes, 0 actions",
    icon: Lock,
    routes: [],
    actions: [],
  },
];

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
  const { setMaintenance, checkMaintenanceStatus, adminButtonConfig, updateAdminButtonConfig } = useApp();
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("accounts"); // 'accounts' | 'audit-logs' | 'maintenance' | 'portal-visibility'
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

  // Global Maintenance Mode state (Main Admin Only)
  const [maintenanceData, setMaintenanceData] = useState({
    enabled: false,
    message: "",
    enabledAt: null,
    updatedAt: null,
    updatedBy: "",
  });
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceUpdating, setMaintenanceUpdating] = useState(false);
  const [maintenanceMessageInput, setMaintenanceMessageInput] = useState("");
  const [showEnableConfirmModal, setShowEnableConfirmModal] = useState(false);
  const [showDisableConfirmModal, setShowDisableConfirmModal] = useState(false);
  const [maintenanceSuccess, setMaintenanceSuccess] = useState("");
  const [maintenanceError, setMaintenanceError] = useState("");
  const [actionFeedback, setActionFeedback] = useState({ type: "", message: "" });

  // Portal Visibility State (Manual Override vs Dynamic System Logic)
  const [visibilityData, setVisibilityData] = useState({
    mode: "AUTO",
    allowedRoles: {
      mainAdmin: true,
      subAdmin: true,
      specialStudent: true,
      allStudents: false,
      guests: false,
    },
    activeAdminCount: 0,
    isAutoVisible: true,
  });
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [visibilitySuccess, setVisibilitySuccess] = useState("");
  const [visibilityError, setVisibilityError] = useState("");

  const showFeedback = (type, message) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback({ type: "", message: "" }), 5000);
  };

  useEffect(() => {
    fetchSubAdmins();
    fetchMaintenanceSettings();
    fetchVisibilitySettings();
  }, []);

  useEffect(() => {
    if (activeTab === "audit-logs") {
      fetchAuditLogs();
    } else if (activeTab === "maintenance") {
      fetchMaintenanceSettings();
    } else if (activeTab === "portal-visibility") {
      fetchVisibilitySettings();
    }
  }, [activeTab, logFilterAction, logFilterResult]);

  async function fetchVisibilitySettings() {
    setVisibilityLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/portal-visibility`, authHeaders);
      if (data && data.success) {
        setVisibilityData({
          mode: data.config?.mode || "AUTO",
          allowedRoles: {
            mainAdmin: data.config?.allowedRoles?.mainAdmin !== false,
            subAdmin: data.config?.allowedRoles?.subAdmin !== false,
            specialStudent: data.config?.allowedRoles?.specialStudent !== false,
            allStudents: Boolean(data.config?.allowedRoles?.allStudents),
            guests: Boolean(data.config?.allowedRoles?.guests),
          },
          activeAdminCount: data.activeAdminCount ?? 0,
          isAutoVisible: data.isAutoVisible ?? true,
        });
      }
    } catch (err) {
      console.warn("Failed to fetch visibility settings:", err);
    } finally {
      setVisibilityLoading(false);
    }
  }

  async function handleSaveVisibilitySettings(overridePayload = null) {
    setVisibilitySaving(true);
    setVisibilityError("");
    setVisibilitySuccess("");
    const payload = overridePayload || {
      mode: visibilityData.mode,
      allowedRoles: visibilityData.allowedRoles,
    };
    try {
      const { data } = await axios.put(`${API}/admin/portal-visibility`, payload, authHeaders);
      if (data && data.success) {
        setVisibilityData((prev) => ({
          ...prev,
          mode: data.config.mode,
          allowedRoles: data.config.allowedRoles,
        }));
        if (updateAdminButtonConfig) {
          await updateAdminButtonConfig(data.config).catch(() => {});
        }
        showFeedback("success", data.message || "Portal visibility configuration updated!");
        setVisibilitySuccess(data.message || "Settings saved successfully!");
        setTimeout(() => setVisibilitySuccess(""), 4000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update portal visibility.";
      setVisibilityError(msg);
      showFeedback("error", msg);
    } finally {
      setVisibilitySaving(false);
    }
  }

  async function fetchMaintenanceSettings() {
    setMaintenanceLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/maintenance`, authHeaders);
      if (data.success && data.maintenance) {
        setMaintenanceData(data.maintenance);
        setMaintenanceMessageInput(data.maintenance.message || "");
        if (setMaintenance) setMaintenance(data.maintenance);
      }
    } catch (err) {
      console.warn("Failed to fetch maintenance settings:", err);
    } finally {
      setMaintenanceLoading(false);
    }
  }

  async function executeEnableMaintenance() {
    setMaintenanceUpdating(true);
    setMaintenanceError("");
    setMaintenanceSuccess("");
    try {
      const { data } = await axios.put(
        `${API}/admin/maintenance`,
        { enabled: true, message: maintenanceMessageInput },
        authHeaders
      );
      if (data.success) {
        setMaintenanceData(data.maintenance);
        if (setMaintenance) setMaintenance(data.maintenance);
        if (checkMaintenanceStatus) await checkMaintenanceStatus(true);
        setShowEnableConfirmModal(false);
        const succMsg = maintenanceData.enabled
          ? "Maintenance broadcast notice updated successfully."
          : (data.message || "Global Maintenance Mode enabled successfully. Student access is now restricted.");
        setMaintenanceSuccess(succMsg);
        setTimeout(() => setMaintenanceSuccess(""), 5000);
      }
    } catch (err) {
      setMaintenanceError(err.response?.data?.message || "Failed to enable maintenance mode.");
    } finally {
      setMaintenanceUpdating(false);
    }
  }

  async function executeDisableMaintenance() {
    setMaintenanceUpdating(true);
    setMaintenanceError("");
    setMaintenanceSuccess("");
    try {
      const { data } = await axios.put(
        `${API}/admin/maintenance`,
        { enabled: false },
        authHeaders
      );
      if (data.success) {
        setMaintenanceData(data.maintenance);
        if (setMaintenance) setMaintenance(data.maintenance);
        if (checkMaintenanceStatus) await checkMaintenanceStatus(true);
        setShowDisableConfirmModal(false);
        setMaintenanceSuccess(data.message || "Global Maintenance Mode disabled successfully. Student access has been restored.");
        setTimeout(() => setMaintenanceSuccess(""), 5000);
      }
    } catch (err) {
      setMaintenanceError(err.response?.data?.message || "Failed to disable maintenance mode.");
    } finally {
      setMaintenanceUpdating(false);
    }
  }

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

  function applyRolePreset(preset) {
    setSelectedRoutes([...preset.routes]);
    setSelectedActions([...preset.actions]);
  }

  function generateStrongPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(pwd);
    setShowPassword(true);
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
        showFeedback("success", `Sub-Admin '${subAdmin.name}' status updated to ${newStatus.toUpperCase()} successfully.`);
        fetchSubAdmins();
      }
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to update status.");
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
        showFeedback("success", data.message || "All active device sessions revoked successfully.");
      }
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to revoke sessions.");
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
        showFeedback("success", "Device session revoked successfully.");
      }
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to revoke device session.");
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
        showFeedback("success", `Sub-Admin '${subAdmin.name}' permanently deleted.`);
        fetchSubAdmins();
      }
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to delete sub-admin.");
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
  const isMobileView = isMobile !== undefined ? isMobile : (typeof window !== "undefined" ? window.innerWidth < 768 : false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {actionFeedback.message && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              background: actionFeedback.type === "error" ? "#fef2f2" : "#ecfdf5",
              border: `1px solid ${actionFeedback.type === "error" ? "#fecaca" : "#a7f3d0"}`,
              color: actionFeedback.type === "error" ? "#991b1b" : "#065f46",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {actionFeedback.type === "error" ? (
              <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
            )}
            <span>{actionFeedback.message}</span>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Top Header & KPI Summary Cards (Mobile Responsive 2x2 Grid with Zero Hyphenation) ── */}
      <div
        className="gf-kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns: isMobileView ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(180px, 1fr))",
          gap: isMobileView ? 10 : 12,
        }}
      >
        {[
          {
            label: isMobileView ? "Sub-Admins" : "Total Sub-Admins",
            sublabel: isMobileView ? "Total Accounts" : "Configured Accounts",
            value: subAdmins.length,
            badge: "Total",
            icon: <Users size={isMobileView ? 15 : 17} />,
            color: "#2563eb",
            valColor: "#0f172a",
            bg: "#eff6ff",
            border: "#dbeafe",
          },
          {
            label: isMobileView ? "Active" : "Active Accounts",
            sublabel: isMobileView ? "Operational" : "Permitted Logins",
            value: subAdmins.filter((s) => s.status === "active").length,
            badge: "Active",
            icon: <CheckCircle2 size={isMobileView ? 15 : 17} />,
            color: "#059669",
            valColor: "#059669",
            bg: "#ecfdf5",
            border: "#a7f3d0",
          },
          {
            label: isMobileView ? "Disabled / Off" : "Disabled / Revoked",
            sublabel: isMobileView ? "Restricted" : "Restricted Access",
            value: subAdmins.filter((s) => s.status !== "active").length,
            badge: "Off",
            icon: <XCircle size={isMobileView ? 15 : 17} />,
            color: "#dc2626",
            valColor: "#dc2626",
            bg: "#fef2f2",
            border: "#fecaca",
          },
          {
            label: isMobileView ? "Active Devices" : "Connected Devices",
            sublabel: isMobileView ? "Live Sessions" : "Active Device Sessions",
            value: totalActiveSessions,
            badge: "Sessions",
            icon: <Smartphone size={isMobileView ? 15 : 17} />,
            color: "#7c3aed",
            valColor: "#7c3aed",
            bg: "#f5f3ff",
            border: "#ede9fe",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: isMobileView ? 14 : 16,
              padding: isMobileView ? "12px 14px" : "16px 18px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: isMobileView ? 8 : 10,
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
              <div
                style={{
                  width: isMobileView ? 30 : 34,
                  height: isMobileView ? 30 : 34,
                  borderRadius: 8,
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: card.color,
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </div>
              <span
                style={{
                  fontSize: isMobileView ? 9.5 : 10.5,
                  fontWeight: 750,
                  color: card.color,
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  padding: isMobileView ? "1.5px 6px" : "2px 7px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                  letterSpacing: "0.2px",
                }}
              >
                {card.badge}
              </span>
            </div>

            <div>
              <div style={{ fontSize: isMobileView ? 22 : 26, fontWeight: 850, color: card.valColor || "#0f172a", lineHeight: 1.1 }}>
                {card.value}
              </div>
              <div
                style={{
                  fontSize: isMobileView ? 11.5 : 12.5,
                  fontWeight: 750,
                  color: "#1e293b",
                  marginTop: 4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: isMobileView ? 10 : 11,
                  color: "#94a3b8",
                  fontWeight: 500,
                  marginTop: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {card.sublabel}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Sub-Navigation & Actions Bar (Horizontal Touch Scroll, Zero Cramming) ── */}
      <div
        className="gf-management-action-bar"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: isMobileView ? "12px 14px" : "14px 18px",
          display: "flex",
          alignItems: isMobileView ? "stretch" : "center",
          justifyContent: "space-between",
          flexDirection: isMobileView ? "column" : "row",
          gap: 12,
        }}
      >
        <div
          className="gf-mgmt-tabs"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            paddingBottom: isMobileView ? 2 : 0,
            width: isMobileView ? "100%" : "auto",
          }}
        >
          <button
            onClick={() => setActiveTab("accounts")}
            className={`gf-mgmt-tab-btn ${activeTab === "accounts" ? "active" : ""}`}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: activeTab === "accounts" ? "1px solid #bfdbfe" : "1px solid transparent",
              background: activeTab === "accounts" ? "#eff6ff" : "transparent",
              color: activeTab === "accounts" ? "#2563eb" : "#64748b",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
          >
            <Users size={15} />
            <span>Sub-Admin Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab("audit-logs")}
            className={`gf-mgmt-tab-btn ${activeTab === "audit-logs" ? "active" : ""}`}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: activeTab === "audit-logs" ? "1px solid #bfdbfe" : "1px solid transparent",
              background: activeTab === "audit-logs" ? "#eff6ff" : "transparent",
              color: activeTab === "audit-logs" ? "#2563eb" : "#64748b",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
          >
            <Activity size={15} />
            <span>Security & Audit Logs</span>
          </button>

          <button
            onClick={() => setActiveTab("maintenance")}
            className={`gf-mgmt-tab-btn ${activeTab === "maintenance" ? "active" : ""}`}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border:
                activeTab === "maintenance"
                  ? maintenanceData.enabled
                    ? "1px solid #fecaca"
                    : "1px solid #bfdbfe"
                  : "1px solid transparent",
              background:
                activeTab === "maintenance"
                  ? maintenanceData.enabled
                    ? "#fef2f2"
                    : "#eff6ff"
                  : "transparent",
              color:
                activeTab === "maintenance"
                  ? maintenanceData.enabled
                    ? "#dc2626"
                    : "#2563eb"
                  : "#64748b",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
          >
            <Wrench size={15} />
            <span>Maintenance Mode</span>
            {maintenanceData.enabled && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#ef4444",
                  boxShadow: "0 0 6px rgba(239, 68, 68, 0.6)",
                }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab("portal-visibility")}
            className={`gf-mgmt-tab-btn ${activeTab === "portal-visibility" ? "active" : ""}`}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: activeTab === "portal-visibility" ? "1px solid #bfdbfe" : "1px solid transparent",
              background: activeTab === "portal-visibility" ? "#eff6ff" : "transparent",
              color: activeTab === "portal-visibility" ? "#2563eb" : "#64748b",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
          >
            <Eye size={15} />
            <span>Admin Button Visibility</span>
            {visibilityData.mode === "MANUAL" && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 6,
                  background: "#fef3c7",
                  color: "#b45309",
                  border: "1px solid #fde68a",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Manual
              </span>
            )}
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
              padding: isMobileView ? "11px 18px" : "9px 18px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
              width: isMobileView ? "100%" : "auto",
              boxSizing: "border-box",
            }}
          >
            <UserPlus size={16} />
            <span>Create Sub-Admin</span>
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
              padding: isMobileView ? "12px 14px" : "14px 18px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: isMobileView ? "stretch" : "center",
              justifyContent: "space-between",
              flexDirection: isMobileView ? "column" : "row",
              gap: 10,
            }}
          >
            <div className="gf-search-input-wrap" style={{ position: "relative", minWidth: isMobileView ? "100%" : 260, flex: 1 }}>
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
                  padding: "9px 12px 9px 36px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#f8fafc",
                }}
              />
            </div>

            <div
              className="gf-filter-select-wrap"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isMobileView ? "space-between" : "flex-start",
                gap: 8,
                width: isMobileView ? "100%" : "auto",
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <Filter size={13} />
                <span>Status:</span>
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 9,
                  border: "1px solid #e2e8f0",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#334155",
                  outline: "none",
                  background: "#ffffff",
                  flex: isMobileView ? 1 : "initial",
                  cursor: "pointer",
                }}
              >
                <option value="all">All Statuses ({subAdmins.length})</option>
                <option value="active">Active Only ({subAdmins.filter((s) => s.status === "active").length})</option>
                <option value="disabled">Disabled Only ({subAdmins.filter((s) => s.status === "disabled").length})</option>
                <option value="revoked">Revoked Only ({subAdmins.filter((s) => s.status === "revoked").length})</option>
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

                    {/* Actions Bar: Ergonomic 2-tier layout for mobile */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        paddingTop: 12,
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      {/* Primary Action: Permissions Matrix */}
                      <button
                        onClick={() => openPermissionsEditor(subAdmin)}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 9,
                          border: "1px solid #c7d2fe",
                          background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
                          color: "#4338ca",
                          fontSize: 12.5,
                          fontWeight: 750,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          boxShadow: "0 1px 2px rgba(79, 70, 229, 0.08)",
                        }}
                      >
                        <Sliders size={14} />
                        <span>Configure Permissions Matrix</span>
                      </button>

                      {/* Secondary Actions Row: Status Select + Edit Info + Delete */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto auto",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <select
                          value={subAdmin.status}
                          onChange={(e) => handleToggleStatus(subAdmin, e.target.value)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 12,
                            fontWeight: 650,
                            background: "#ffffff",
                            color: "#1e293b",
                            cursor: "pointer",
                            outline: "none",
                            width: "100%",
                          }}
                        >
                          <option value="active">Active (Permitted)</option>
                          <option value="disabled">Disable Access</option>
                          <option value="revoked">Revoke Access</option>
                        </select>

                        <button
                          onClick={() => openInfoEditor(subAdmin)}
                          title="Edit Info"
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#334155",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSubAdmin(subAdmin)}
                          title="Delete Sub-Admin"
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1px solid #fee2e2",
                            background: "#fff5f5",
                            color: "#ef4444",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
              padding: isMobileView ? "12px 14px" : "14px 18px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: isMobileView ? "stretch" : "center",
              justifyContent: "space-between",
              flexDirection: isMobileView ? "column" : "row",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={16} color="#2563eb" />
              <span style={{ fontSize: isMobileView ? 13.5 : 14, fontWeight: 750, color: "#0f172a" }}>
                {isMobileView ? "Security & Audit Logs" : "Sub-Admin Security & Authorization Logs"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, width: isMobileView ? "100%" : "auto" }}>
              <select
                value={logFilterResult}
                onChange={(e) => setLogFilterResult(e.target.value)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12.5,
                  fontWeight: 600,
                  outline: "none",
                  background: "#ffffff",
                  color: "#334155",
                  flex: isMobileView ? 1 : "initial",
                  cursor: "pointer",
                }}
              >
                <option value="">All Results</option>
                <option value="SUCCESS">Success Only</option>
                <option value="FORBIDDEN">Blocked / Forbidden Only</option>
              </select>

              <button
                onClick={fetchAuditLogs}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  fontSize: 12.5,
                  fontWeight: 650,
                  color: "#0f172a",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                <RefreshCw size={13} className={logsLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
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
                <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                <span>Loading audit logs...</span>
              </div>
            ) : auditLogs.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                <Activity size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontWeight: 700, color: "#334155" }}>No Audit Events Found</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>Sub-admin actions and access attempts will appear here.</div>
              </div>
            ) : (
              auditLogs.map((log) => {
                const isSuccess = log.result === "SUCCESS";
                return (
                  <div
                    key={log._id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderLeft: `4px solid ${isSuccess ? "#10b981" : "#ef4444"}`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 7,
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                        {new Date(log.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 750,
                          padding: "2px 7px",
                          borderRadius: 5,
                          background: isSuccess ? "#ecfdf5" : "#fef2f2",
                          color: isSuccess ? "#059669" : "#dc2626",
                          border: `1px solid ${isSuccess ? "#a7f3d0" : "#fecaca"}`,
                          letterSpacing: "0.2px",
                        }}
                      >
                        {log.result}
                      </span>
                    </div>

                    <div style={{ fontSize: 13.5, fontWeight: 750, color: "#0f172a", lineHeight: 1.3 }}>
                      {log.action}
                    </div>

                    <div style={{ fontSize: 11.5, color: "#475569" }}>
                      <strong style={{ color: "#334155" }}>Actor:</strong> {log.actorEmail} <span style={{ color: "#94a3b8" }}>({log.actorType})</span>
                    </div>

                    {log.route && (
                      <div style={{ fontSize: 11, color: "#2563eb", fontFamily: "monospace", background: "#eff6ff", border: "1px solid #dbeafe", padding: "2px 7px", borderRadius: 5, alignSelf: "flex-start" }}>
                        Target: {log.route}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: GLOBAL MAINTENANCE MODE (Main Admin Only) ── */}
      {activeTab === "maintenance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Status Feedback Banner */}
          {maintenanceSuccess && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#065f46",
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={18} color="#059669" />
              <span>{maintenanceSuccess}</span>
            </div>
          )}

          {maintenanceError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#991b1b",
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={18} color="#dc2626" />
              <span>{maintenanceError}</span>
            </div>
          )}

          {/* Main Control Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: isMobileView ? "16px 18px" : "24px 26px",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* Header & Status */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexDirection: isMobileView ? "column" : "row",
                gap: 14,
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: maintenanceData.enabled ? "#fef2f2" : "#eff6ff",
                    color: maintenanceData.enabled ? "#dc2626" : "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Wrench size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: isMobileView ? 16.5 : 18, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                    Global System Maintenance Mode
                  </h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0, maxWidth: 540, lineHeight: 1.45 }}>
                    Temporarily pause student portal access and APIs while making database or system upgrades.
                    Your Main Admin access remains active at all times.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: isMobileView ? "flex-start" : "flex-end", gap: 6, width: isMobileView ? "100%" : "auto" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    background: maintenanceData.enabled ? "#fef2f2" : "#ecfdf5",
                    color: maintenanceData.enabled ? "#dc2626" : "#059669",
                    border: `1px solid ${maintenanceData.enabled ? "#fca5a5" : "#a7f3d0"}`,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: maintenanceData.enabled ? "#dc2626" : "#059669",
                      boxShadow: maintenanceData.enabled
                        ? "0 0 8px rgba(220, 38, 38, 0.6)"
                        : "0 0 8px rgba(5, 150, 105, 0.4)",
                    }}
                  />
                  {maintenanceData.enabled ? "MAINTENANCE ACTIVE" : "SYSTEM OPERATIONAL"}
                </span>

                {maintenanceData.enabled && maintenanceData.enabledAt && (
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    Active since: {new Date(maintenanceData.enabledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </div>

            {/* Toggle Action Area */}
            <div
              style={{
                background: maintenanceData.enabled ? "#fff1f2" : "#f8fafc",
                border: `1px solid ${maintenanceData.enabled ? "#fecdd3" : "#e2e8f0"}`,
                borderRadius: 14,
                padding: isMobileView ? "14px 16px" : "18px 20px",
                display: "flex",
                alignItems: isMobileView ? "stretch" : "center",
                justifyContent: "space-between",
                flexDirection: isMobileView ? "column" : "row",
                gap: 16,
              }}
            >
              <div style={{ flex: 1, minWidth: isMobileView ? "100%" : 260 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 750,
                    color: maintenanceData.enabled ? "#9f1239" : "#1e293b",
                    marginBottom: 4,
                  }}
                >
                  {maintenanceData.enabled
                    ? "Maintenance Mode is currently restricting student access"
                    : "Student access is fully active"}
                </div>
                <div style={{ fontSize: 12.5, color: maintenanceData.enabled ? "#be123c" : "#64748b", lineHeight: 1.45 }}>
                  {maintenanceData.enabled
                    ? "Students visiting GradeFlow will see the maintenance state. Click disable when ready to restore access."
                    : "Clicking enable will display the maintenance overlay to all non-admin visitors immediately."}
                </div>
              </div>

              <div style={{ width: isMobileView ? "100%" : "auto" }}>
                {maintenanceData.enabled ? (
                  <button
                    type="button"
                    onClick={() => setShowDisableConfirmModal(true)}
                    disabled={maintenanceUpdating}
                    style={{
                      background: "#059669",
                      color: "#ffffff",
                      border: "none",
                      padding: "11px 20px",
                      borderRadius: 10,
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
                      width: isMobileView ? "100%" : "auto",
                      boxSizing: "border-box",
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Disable Maintenance Mode</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEnableConfirmModal(true)}
                    disabled={maintenanceUpdating}
                    style={{
                      background: "#dc2626",
                      color: "#ffffff",
                      border: "none",
                      padding: "11px 20px",
                      borderRadius: 10,
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
                      width: isMobileView ? "100%" : "auto",
                      boxSizing: "border-box",
                    }}
                  >
                    <AlertTriangle size={16} />
                    <span>Enable Maintenance Mode</span>
                  </button>
                )}
              </div>
            </div>

            {/* Custom Announcement Message Setting */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 13.5, fontWeight: 700, color: "#334155" }}>
                Custom Broadcast Notice (Optional)
              </label>
              <textarea
                value={maintenanceMessageInput}
                onChange={(e) => setMaintenanceMessageInput(e.target.value)}
                placeholder="e.g. We are performing scheduled database improvements. GradeFlow will be back online shortly."
                rows={3}
                maxLength={300}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 13.5,
                  color: "#0f172a",
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
                  {maintenanceMessageInput.length}/300 characters &bull; Leave blank for default notice
                </span>
                {maintenanceData.enabled && (
                  <button
                    type="button"
                    onClick={executeEnableMaintenance}
                    disabled={maintenanceUpdating}
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {maintenanceUpdating ? "Updating..." : "Save Notice Update"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: ADMIN BUTTON PORTAL VISIBILITY MANAGEMENT ── */}
      {activeTab === "portal-visibility" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Status Feedback Banner */}
          {visibilitySuccess && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#065f46",
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={18} color="#059669" />
              <span>{visibilitySuccess}</span>
            </div>
          )}

          {visibilityError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#991b1b",
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={18} color="#dc2626" />
              <span>{visibilityError}</span>
            </div>
          )}

          {/* Master Control Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: isMobile ? "18px" : "24px 26px",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            {/* Header with Live Status Badge */}
            <div
              style={{
                display: "flex",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                flexDirection: isMobile ? "column" : "row",
                gap: 14,
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: 18,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: visibilityData.mode === "MANUAL" ? "#f5f3ff" : "#eff6ff",
                      color: visibilityData.mode === "MANUAL" ? "#7c3aed" : "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Eye size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                      Admin Portal Button Visibility
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                      Control whether the Admin button across GradeFlow navbar & footer is managed dynamically or manually overridden.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 99,
                  background: visibilityData.mode === "MANUAL" ? "#f5f3ff" : "#ecfdf5",
                  border: `1px solid ${visibilityData.mode === "MANUAL" ? "#ddd6fe" : "#a7f3d0"}`,
                  color: visibilityData.mode === "MANUAL" ? "#6d28d9" : "#065f46",
                  fontSize: 12.5,
                  fontWeight: 750,
                  alignSelf: isMobile ? "flex-start" : "center",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: visibilityData.mode === "MANUAL" ? "#7c3aed" : "#10b981",
                    boxShadow: `0 0 6px ${visibilityData.mode === "MANUAL" ? "rgba(124,58,237,0.5)" : "rgba(16,185,129,0.5)"}`,
                  }}
                />
                {visibilityData.mode === "MANUAL" ? "Manual Override Active" : "Automatic System Logic Active"}
              </div>
            </div>

            {/* Mode Selection Cards */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                Choose Visibility Governance Mode
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 14,
                }}
              >
                {/* Option 1: Automatic System Logic */}
                <div
                  onClick={() => setVisibilityData((prev) => ({ ...prev, mode: "AUTO" }))}
                  style={{
                    border: `1.5px solid ${visibilityData.mode === "AUTO" ? "#3b82f6" : "#e2e8f0"}`,
                    background: visibilityData.mode === "AUTO" ? "#f8fafc" : "#ffffff",
                    borderRadius: 14,
                    padding: "16px 18px",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.2s ease",
                    boxShadow: visibilityData.mode === "AUTO" ? "0 2px 10px rgba(59, 130, 246, 0.08)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Sliders size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14.5, color: "#0f172a" }}>
                          Automatic System Logic
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#dbeafe", padding: "1px 6px", borderRadius: 4 }}>
                          Default System Behavior
                        </span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={visibilityData.mode === "AUTO"}
                      onChange={() => setVisibilityData((prev) => ({ ...prev, mode: "AUTO" }))}
                      style={{ cursor: "pointer", accentColor: "#2563eb" }}
                    />
                  </div>

                  <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#64748b", lineHeight: 1.5 }}>
                    The existing logical detection runs uninterrupted. When 0 or 1 admin device is active, the button is visible to all visitors. When both 2 admin device slots are filled, the button automatically hides from public visitors while remaining accessible to Main Admin and Special Student (<code>230301120327</code>).
                  </p>

                  <div
                    style={{
                      background: "#f1f5f9",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "#334155",
                    }}
                  >
                    <span>Active Admin Slots: <strong>{visibilityData.activeAdminCount} / 2</strong></span>
                    <span style={{ fontWeight: 700, color: visibilityData.isAutoVisible ? "#059669" : "#ea580c" }}>
                      {visibilityData.isAutoVisible ? "Currently: Visible to Public" : "Currently: Hidden from Public"}
                    </span>
                  </div>
                </div>

                {/* Option 2: Manual Role Override */}
                <div
                  onClick={() => setVisibilityData((prev) => ({ ...prev, mode: "MANUAL" }))}
                  style={{
                    border: `1.5px solid ${visibilityData.mode === "MANUAL" ? "#7c3aed" : "#e2e8f0"}`,
                    background: visibilityData.mode === "MANUAL" ? "#faf5ff" : "#ffffff",
                    borderRadius: 14,
                    padding: "16px 18px",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.2s ease",
                    boxShadow: visibilityData.mode === "MANUAL" ? "0 2px 10px rgba(124, 58, 237, 0.08)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#f5f3ff",
                          color: "#7c3aed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Lock size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14.5, color: "#0f172a" }}>
                          Manual Role Override
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "1px 6px", borderRadius: 4 }}>
                          Admin Control Mode
                        </span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={visibilityData.mode === "MANUAL"}
                      onChange={() => setVisibilityData((prev) => ({ ...prev, mode: "MANUAL" }))}
                      style={{ cursor: "pointer", accentColor: "#7c3aed" }}
                    />
                  </div>

                  <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#64748b", lineHeight: 1.5 }}>
                    Completely overrides the automatic device limit logic. You explicitly decide who can see the Admin portal button on the site: Main Admin, Sub-Admins, Special Student (<code>230301120327</code>), All Students, or Public Guests.
                  </p>

                  <div
                    style={{
                      background: visibilityData.mode === "MANUAL" ? "#ede9fe" : "#f1f5f9",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: visibilityData.mode === "MANUAL" ? "#5b21b6" : "#334155",
                      fontWeight: 600,
                    }}
                  >
                    <span>Override Status:</span>
                    <span>{visibilityData.mode === "MANUAL" ? "Active (Custom Roles Applied)" : "Inactive (Select to Configure)"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Visibility Matrix (Configurable in both, active when MANUAL) */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "18px 20px",
                background: visibilityData.mode === "MANUAL" ? "#ffffff" : "#f8fafc",
                opacity: visibilityData.mode === "MANUAL" ? 1 : 0.85,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                    Audience Visibility Matrix
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {visibilityData.mode === "MANUAL"
                      ? "Toggle each audience to grant or deny visibility of the Admin button on their devices."
                      : "Preview of custom role preferences. Switch to Manual Override above to enforce these custom rules."}
                  </div>
                </div>

                {/* Quick Presets Toolbar */}
                <div
                  className="gf-visibility-presets-bar"
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: isMobileView ? "nowrap" : "wrap",
                    overflowX: isMobileView ? "auto" : "visible",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                    width: isMobileView ? "100%" : "auto",
                    paddingBottom: isMobileView ? 4 : 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setVisibilityData((prev) => ({
                        ...prev,
                        mode: "MANUAL",
                        allowedRoles: {
                          mainAdmin: true,
                          subAdmin: true,
                          specialStudent: true,
                          allStudents: true,
                          guests: true,
                        },
                      }));
                    }}
                    style={{
                      padding: "6px 11px",
                      borderRadius: 7,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#334155",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    <Eye size={13} color="#2563eb" />
                    <span>Show to Everyone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVisibilityData((prev) => ({
                        ...prev,
                        mode: "MANUAL",
                        allowedRoles: {
                          mainAdmin: true,
                          subAdmin: true,
                          specialStudent: true,
                          allStudents: false,
                          guests: false,
                        },
                      }));
                    }}
                    style={{
                      padding: "6px 11px",
                      borderRadius: 7,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#334155",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={13} color="#059669" />
                    <span>Admins & Special Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVisibilityData((prev) => ({
                        ...prev,
                        mode: "MANUAL",
                        allowedRoles: {
                          mainAdmin: true,
                          subAdmin: false,
                          specialStudent: false,
                          allStudents: false,
                          guests: false,
                        },
                      }));
                    }}
                    style={{
                      padding: "6px 11px",
                      borderRadius: 7,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#334155",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    <Lock size={13} color="#7c3aed" />
                    <span>Strictly Main Admin Only</span>
                  </button>
                </div>
              </div>

              {/* 5 Audience Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* 1. Main Admin */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ShieldCheck size={17} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a" }}>
                        Main Admin
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>
                        Primary administrator authenticated with master credentials
                      </div>
                    </div>
                  </div>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: visibilityData.allowedRoles.mainAdmin ? "#059669" : "#64748b" }}>
                      {visibilityData.allowedRoles.mainAdmin ? "Visible" : "Hidden"}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(visibilityData.allowedRoles.mainAdmin)}
                      onChange={(e) => {
                        setVisibilityData((prev) => ({
                          ...prev,
                          allowedRoles: { ...prev.allowedRoles, mainAdmin: e.target.checked },
                        }));
                      }}
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#059669" }}
                    />
                  </label>
                </div>

                {/* 2. Sub-Admins */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <UserCheck size={17} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a" }}>
                        Sub-Admins
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>
                        Delegated administrators with module and action-level permissions
                      </div>
                    </div>
                  </div>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: visibilityData.allowedRoles.subAdmin ? "#2563eb" : "#64748b" }}>
                      {visibilityData.allowedRoles.subAdmin ? "Visible" : "Hidden"}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(visibilityData.allowedRoles.subAdmin)}
                      onChange={(e) => {
                        setVisibilityData((prev) => ({
                          ...prev,
                          allowedRoles: { ...prev.allowedRoles, subAdmin: e.target.checked },
                        }));
                      }}
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#2563eb" }}
                    />
                  </label>
                </div>

                {/* 3. Special Student (230301120327) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Star size={17} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a" }}>
                        Special Student (<code>230301120327</code>)
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>
                        Designated student account with multi-device login & direct admin visibility
                      </div>
                    </div>
                  </div>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: visibilityData.allowedRoles.specialStudent ? "#d97706" : "#64748b" }}>
                      {visibilityData.allowedRoles.specialStudent ? "Visible" : "Hidden"}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(visibilityData.allowedRoles.specialStudent)}
                      onChange={(e) => {
                        setVisibilityData((prev) => ({
                          ...prev,
                          allowedRoles: { ...prev.allowedRoles, specialStudent: e.target.checked },
                        }));
                      }}
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#d97706" }}
                    />
                  </label>
                </div>

                {/* 4. All Registered Students */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eef2ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Users size={17} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a" }}>
                        All Registered Students
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>
                        Standard enrolled students logged in with college roll numbers
                      </div>
                    </div>
                  </div>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: visibilityData.allowedRoles.allStudents ? "#6366f1" : "#64748b" }}>
                      {visibilityData.allowedRoles.allStudents ? "Visible" : "Hidden"}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(visibilityData.allowedRoles.allStudents)}
                      onChange={(e) => {
                        setVisibilityData((prev) => ({
                          ...prev,
                          allowedRoles: { ...prev.allowedRoles, allStudents: e.target.checked },
                        }));
                      }}
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#6366f1" }}
                    />
                  </label>
                </div>

                {/* 5. Public Guests & Visitors */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Globe size={17} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a" }}>
                        Public Guests & Visitors
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>
                        Unauthenticated visitors browsing the landing page and public timetables
                      </div>
                    </div>
                  </div>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: visibilityData.allowedRoles.guests ? "#0f172a" : "#64748b" }}>
                      {visibilityData.allowedRoles.guests ? "Visible" : "Hidden"}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(visibilityData.allowedRoles.guests)}
                      onChange={(e) => {
                        setVisibilityData((prev) => ({
                          ...prev,
                          allowedRoles: { ...prev.allowedRoles, guests: e.target.checked },
                        }));
                      }}
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#0f172a" }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                alignItems: isMobileView ? "stretch" : "center",
                justifyContent: "space-between",
                flexDirection: isMobileView ? "column" : "row",
                gap: 12,
                borderTop: "1px solid #f1f5f9",
                paddingTop: 16,
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Changes take effect across the Navbar and Landing Footer immediately upon saving.
              </div>

              <div style={{ display: "flex", gap: 10, width: isMobileView ? "100%" : "auto" }}>
                <button
                  type="button"
                  onClick={() => fetchVisibilitySettings()}
                  disabled={visibilityLoading || visibilitySaving}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#475569",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    flex: isMobileView ? 1 : "initial",
                  }}
                >
                  <RefreshCw size={14} className={visibilityLoading ? "spin" : ""} />
                  <span>Reset Form</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveVisibilitySettings()}
                  disabled={visibilitySaving}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 10,
                    border: "none",
                    background:
                      visibilityData.mode === "MANUAL"
                        ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
                        : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow:
                      visibilityData.mode === "MANUAL"
                        ? "0 2px 8px rgba(124, 58, 237, 0.25)"
                        : "0 2px 8px rgba(37, 99, 235, 0.25)",
                    transition: "all 0.15s ease",
                    flex: isMobileView ? 1 : "initial",
                  }}
                >
                  <Save size={15} />
                  <span>{visibilitySaving ? "Saving..." : "Save Visibility"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: CONFIRM ENABLE MAINTENANCE MODE
         ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showEnableConfirmModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(6px)",
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
                borderRadius: 18,
                maxWidth: 440,
                width: "100%",
                padding: "24px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#fef2f2",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Enable Maintenance Mode?
                  </h4>
                  <p style={{ fontSize: 12.5, color: "#64748b", margin: "2px 0 0" }}>
                    Student access will immediately be blocked
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 13,
                  color: "#9f1239",
                  lineHeight: 1.5,
                }}
              >
                Students visiting GradeFlow will see a maintenance notice. Your Main Admin portal access will remain fully functional.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowEnableConfirmModal(false)}
                  disabled={maintenanceUpdating}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeEnableMaintenance}
                  disabled={maintenanceUpdating}
                  style={{
                    background: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {maintenanceUpdating ? "Enabling..." : "Yes, Enable Maintenance"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: CONFIRM DISABLE MAINTENANCE MODE
         ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDisableConfirmModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(6px)",
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
                borderRadius: 18,
                maxWidth: 440,
                width: "100%",
                padding: "24px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Disable Maintenance Mode?
                  </h4>
                  <p style={{ fontSize: 12.5, color: "#64748b", margin: "2px 0 0" }}>
                    Student access will be restored immediately
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 13,
                  color: "#166534",
                  lineHeight: 1.5,
                }}
              >
                All student dashboards, analytics, and portals will become immediately accessible to all users.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowDisableConfirmModal(false)}
                  disabled={maintenanceUpdating}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeDisableMaintenance}
                  disabled={maintenanceUpdating}
                  style={{
                    background: "#059669",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {maintenanceUpdating ? "Disabling..." : "Yes, Restore Access"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          MODAL 1: CREATE SUB-ADMIN MODAL
         ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCreateModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(6px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px",
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="gf-modal-dialog"
              style={{
                background: "#ffffff",
                borderRadius: 20,
                width: "100%",
                maxWidth: 720,
                maxHeight: "92vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 20px 30px -10px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05)",
                border: "1px solid #e2e8f0",
              }}
            >
              {/* 1. Fixed Modal Header */}
              <div
                style={{
                  padding: "16px 22px",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#ffffff",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 5px rgba(37, 99, 235, 0.1)",
                    }}
                  >
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
                      Create New Sub-Admin
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Configure credentials and assign strictly scoped permissions (Default Deny).
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* 2. Scrollable Body inside Form */}
              <form
                onSubmit={handleCreateSubAdmin}
                style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", minHeight: 0 }}
              >
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "18px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {formError && (
                    <div
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fee2e2",
                        borderRadius: 10,
                        padding: "10px 14px",
                        color: "#991b1b",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <AlertTriangle size={16} color="#dc2626" />
                      {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div
                      style={{
                        background: "#ecfdf5",
                        border: "1px solid #d1fae5",
                        borderRadius: 10,
                        padding: "10px 14px",
                        color: "#065f46",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <CheckCircle2 size={16} color="#059669" />
                      {formSuccess}
                    </div>
                  )}

                  {/* Section 1: Basic Identity & Credentials */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      1. Sub-Admin Identity & Credentials
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
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
                            background: "#ffffff",
                            fontSize: 13,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
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
                            background: "#ffffff",
                            fontSize: 13,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                            Account Password (Min 8 Chars) *
                          </label>
                          <button
                            type="button"
                            onClick={generateStrongPassword}
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#2563eb",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <Key size={11} />
                            Generate
                          </button>
                        </div>
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
                              background: "#ffffff",
                              fontSize: 13,
                              fontFamily: showPassword ? "monospace" : "inherit",
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
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
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
                  </div>

                  {/* Section 2: Role Presets & Granular Matrix */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                        2. Granular Permission Matrix (Default Deny)
                      </label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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

                    {/* Quick Presets Bar */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                        <Zap size={13} color="#f59e0b" /> Quick Role Presets:
                      </div>
                      <div className="gf-modal-presets-bar" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {ROLE_PRESETS.map((preset) => {
                          const IconComp = preset.icon;
                          const isPresetActive =
                            preset.routes.length === selectedRoutes.length &&
                            preset.routes.every((r) => selectedRoutes.includes(r));

                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => applyRolePreset(preset)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: 8,
                                border: isPresetActive ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                                background: isPresetActive ? "#eff6ff" : "#ffffff",
                                color: isPresetActive ? "#1d4ed8" : "#475569",
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                transition: "all 0.15s ease",
                              }}
                            >
                              <IconComp size={12} />
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Route Matrix Cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {AVAILABLE_PERMISSIONS.routes.map((route) => {
                        const isRouteChecked = selectedRoutes.includes(route.id);
                        const relatedActions = AVAILABLE_PERMISSIONS.actions.filter((a) => a.route === route.id);
                        const RouteIcon = ROUTE_ICONS[route.id] || Layers;

                        return (
                          <div
                            key={route.id}
                            style={{
                              background: isRouteChecked ? "#f0f7ff" : "#ffffff",
                              border: isRouteChecked ? "1.5px solid #93c5fd" : "1px solid #e2e8f0",
                              borderRadius: 12,
                              padding: "12px 14px",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div
                              onClick={() => handleRouteToggle(route.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                cursor: "pointer",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 9,
                                    background: isRouteChecked ? "#dbeafe" : "#f1f5f9",
                                    color: isRouteChecked ? "#1d4ed8" : "#64748b",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <RouteIcon size={18} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                                      {route.label}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        background: isRouteChecked ? "#bfdbfe" : "#f1f5f9",
                                        color: isRouteChecked ? "#1e40af" : "#64748b",
                                        padding: "1px 6px",
                                        borderRadius: 4,
                                      }}
                                    >
                                      Route: {route.id}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isMobile ? "normal" : "nowrap" }}>
                                    {route.desc}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRouteToggle(route.id);
                                }}
                                style={{
                                  padding: "5px 12px",
                                  borderRadius: 20,
                                  border: "none",
                                  background: isRouteChecked ? "#2563eb" : "#e2e8f0",
                                  color: isRouteChecked ? "#ffffff" : "#475569",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  flexShrink: 0,
                                }}
                              >
                                {isRouteChecked ? (
                                  <>
                                    <Check size={12} />
                                    ENABLED
                                  </>
                                ) : (
                                  "DISABLED"
                                )}
                              </button>
                            </div>

                            {/* Related Granular Actions */}
                            {relatedActions.length > 0 && isRouteChecked && (
                              <div
                                style={{
                                  marginTop: 12,
                                  paddingTop: 12,
                                  borderTop: "1px solid #dbeafe",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                                  <div style={{ fontSize: 11, fontWeight: 800, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Granular Actions for this Module:
                                  </div>
                                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#2563eb", background: "#dbeafe", padding: "1px 7px", borderRadius: 10 }}>
                                    {relatedActions.filter((a) => selectedActions.includes(a.id)).length} of {relatedActions.length} Granted
                                  </span>
                                </div>

                                {relatedActions.map((action) => {
                                  const isActionChecked = selectedActions.includes(action.id);
                                  return (
                                    <div
                                      key={action.id}
                                      onClick={() => handleActionToggle(action.id, route.id)}
                                      style={{
                                        background: isActionChecked ? "#ffffff" : "#f8fafc",
                                        border: isActionChecked ? "1.5px solid #93c5fd" : "1.5px solid #e2e8f0",
                                        borderRadius: 10,
                                        padding: "9px 12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 10,
                                        cursor: "pointer",
                                        boxShadow: isActionChecked ? "0 1px 3px rgba(37, 99, 235, 0.08)" : "none",
                                        transition: "all 0.15s ease",
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                                        <div
                                          style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 6,
                                            border: isActionChecked ? "1.5px solid #2563eb" : "1.5px solid #cbd5e1",
                                            background: isActionChecked ? "#2563eb" : "#ffffff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#ffffff",
                                            flexShrink: 0,
                                            boxShadow: isActionChecked ? "0 1px 3px rgba(37, 99, 235, 0.25)" : "none",
                                            transition: "all 0.15s ease",
                                          }}
                                        >
                                          {isActionChecked && <Check size={14} strokeWidth={3.5} />}
                                        </div>

                                        <div style={{ minWidth: 0, flex: 1 }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                                              {action.label}
                                            </span>
                                            <code
                                              style={{
                                                fontSize: 10.5,
                                                fontWeight: 700,
                                                background: isActionChecked ? "#eff6ff" : "#f1f5f9",
                                                color: isActionChecked ? "#1d4ed8" : "#475569",
                                                border: isActionChecked ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                                                padding: "1px 5px",
                                                borderRadius: 4,
                                              }}
                                            >
                                              {action.id}
                                            </code>
                                          </div>
                                          <div style={{ fontSize: 11.5, color: "#475569", marginTop: 2, lineHeight: 1.4 }}>
                                            {action.desc}
                                          </div>
                                        </div>
                                      </div>

                                      <div
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 4,
                                          fontSize: 10.5,
                                          fontWeight: 800,
                                          padding: "4px 9px",
                                          borderRadius: 6,
                                          background: isActionChecked ? "#ecfdf5" : "#f1f5f9",
                                          color: isActionChecked ? "#059669" : "#64748b",
                                          border: isActionChecked ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                                          flexShrink: 0,
                                        }}
                                      >
                                        {isActionChecked ? (
                                          <>
                                            <CheckCircle2 size={12} color="#059669" />
                                            ALLOW
                                          </>
                                        ) : (
                                          <>
                                            <Lock size={11} color="#94a3b8" />
                                            DENY
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Summary Preview Card */}
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 12,
                      padding: "12px 16px",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#166534", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <ShieldCheck size={14} />
                      Live Permission Access Summary:
                    </div>
                    <div style={{ fontSize: 12, color: "#15803d", lineHeight: 1.5 }}>
                      {selectedRoutes.length === 0 ? (
                        <span style={{ color: "#b91c1c", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <ShieldAlert size={14} color="#dc2626" />
                          Default Deny: Sub-Admin will have 0 route or action access upon login.
                        </span>
                      ) : (
                        <span>
                          Granted access to <strong>{selectedRoutes.length} route(s)</strong> and <strong>{selectedActions.length} granular action(s)</strong>.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Fixed Sticky Footer */}
                <div
                  style={{
                    flexShrink: 0,
                    padding: "14px 22px",
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    {selectedRoutes.length === 0 ? (
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>0 Modules Assigned</span>
                    ) : (
                      <span>
                        <strong style={{ color: "#2563eb" }}>{selectedRoutes.length}</strong> Modules •{" "}
                        <strong style={{ color: "#059669" }}>{selectedActions.length}</strong> Actions
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
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
                        padding: "9px 22px",
                        borderRadius: 9,
                        border: "none",
                        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
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
                      Create Sub-Admin Account
                    </button>
                  </div>
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
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(6px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px",
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="gf-modal-dialog"
              style={{
                background: "#ffffff",
                borderRadius: 20,
                width: "100%",
                maxWidth: 720,
                maxHeight: "92vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 20px 30px -10px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05)",
                border: "1px solid #e2e8f0",
              }}
            >
              {/* 1. Fixed Header */}
              <div
                style={{
                  padding: "16px 22px",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#ffffff",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
                      color: "#4f46e5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 5px rgba(79, 70, 229, 0.1)",
                    }}
                  >
                    <Sliders size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
                      Edit Permissions: {editingPermissionsSubAdmin.name}
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Instant propagation — modifications apply immediately on the next API request.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingPermissionsSubAdmin(null)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* 2. Scrollable Body */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "18px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {formError && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fee2e2",
                      borderRadius: 10,
                      padding: "10px 14px",
                      color: "#991b1b",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <AlertTriangle size={16} color="#dc2626" />
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div
                    style={{
                      background: "#ecfdf5",
                      border: "1px solid #d1fae5",
                      borderRadius: 10,
                      padding: "10px 14px",
                      color: "#065f46",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={16} color="#059669" />
                    {formSuccess}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                    Select Allowed Routes and Granular Actions:
                  </span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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

                {/* Role Presets */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                    <Zap size={13} color="#f59e0b" /> Quick Role Presets:
                  </div>
                  <div className="gf-modal-presets-bar" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ROLE_PRESETS.map((preset) => {
                      const IconComp = preset.icon;
                      const isPresetActive =
                        preset.routes.length === selectedRoutes.length &&
                        preset.routes.every((r) => selectedRoutes.includes(r));

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyRolePreset(preset)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: 8,
                            border: isPresetActive ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                            background: isPresetActive ? "#eef2ff" : "#ffffff",
                            color: isPresetActive ? "#4338ca" : "#475569",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <IconComp size={12} />
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Route Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {AVAILABLE_PERMISSIONS.routes.map((route) => {
                    const isRouteChecked = selectedRoutes.includes(route.id);
                    const relatedActions = AVAILABLE_PERMISSIONS.actions.filter((a) => a.route === route.id);
                    const RouteIcon = ROUTE_ICONS[route.id] || Layers;

                    return (
                      <div
                        key={route.id}
                        style={{
                          background: isRouteChecked ? "#f0f7ff" : "#ffffff",
                          border: isRouteChecked ? "1.5px solid #93c5fd" : "1px solid #e2e8f0",
                          borderRadius: 12,
                          padding: "12px 14px",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div
                          onClick={() => handleRouteToggle(route.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 9,
                                background: isRouteChecked ? "#dbeafe" : "#f1f5f9",
                                color: isRouteChecked ? "#1d4ed8" : "#64748b",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <RouteIcon size={18} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                                  {route.label}
                                </span>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    background: isRouteChecked ? "#bfdbfe" : "#f1f5f9",
                                    color: isRouteChecked ? "#1e40af" : "#64748b",
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                  }}
                                >
                                  Route: {route.id}
                                </span>
                              </div>
                              <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isMobile ? "normal" : "nowrap" }}>
                                {route.desc}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRouteToggle(route.id);
                            }}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 20,
                              border: "none",
                              background: isRouteChecked ? "#2563eb" : "#e2e8f0",
                              color: isRouteChecked ? "#ffffff" : "#475569",
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              flexShrink: 0,
                            }}
                          >
                            {isRouteChecked ? (
                              <>
                                <Check size={12} />
                                ENABLED
                              </>
                            ) : (
                              "DISABLED"
                            )}
                          </button>
                        </div>

                        {relatedActions.length > 0 && isRouteChecked && (
                          <div
                            style={{
                              marginTop: 12,
                              paddingTop: 12,
                              borderTop: "1px solid #dbeafe",
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Granular Actions for this Module:
                              </div>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#2563eb", background: "#dbeafe", padding: "1px 7px", borderRadius: 10 }}>
                                {relatedActions.filter((a) => selectedActions.includes(a.id)).length} of {relatedActions.length} Granted
                              </span>
                            </div>

                            {relatedActions.map((action) => {
                              const isActionChecked = selectedActions.includes(action.id);
                              return (
                                <div
                                  key={action.id}
                                  onClick={() => handleActionToggle(action.id, route.id)}
                                  style={{
                                    background: isActionChecked ? "#ffffff" : "#f8fafc",
                                    border: isActionChecked ? "1.5px solid #93c5fd" : "1.5px solid #e2e8f0",
                                    borderRadius: 10,
                                    padding: "9px 12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 10,
                                    cursor: "pointer",
                                    boxShadow: isActionChecked ? "0 1px 3px rgba(37, 99, 235, 0.08)" : "none",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                                    <div
                                      style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 6,
                                        border: isActionChecked ? "1.5px solid #2563eb" : "1.5px solid #cbd5e1",
                                        background: isActionChecked ? "#2563eb" : "#ffffff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#ffffff",
                                        flexShrink: 0,
                                        boxShadow: isActionChecked ? "0 1px 3px rgba(37, 99, 235, 0.25)" : "none",
                                        transition: "all 0.15s ease",
                                      }}
                                    >
                                      {isActionChecked && <Check size={14} strokeWidth={3.5} />}
                                    </div>

                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                                          {action.label}
                                        </span>
                                        <code
                                          style={{
                                            fontSize: 10.5,
                                            fontWeight: 700,
                                            background: isActionChecked ? "#eff6ff" : "#f1f5f9",
                                            color: isActionChecked ? "#1d4ed8" : "#475569",
                                            border: isActionChecked ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                                            padding: "1px 5px",
                                            borderRadius: 4,
                                          }}
                                        >
                                          {action.id}
                                        </code>
                                      </div>
                                      <div style={{ fontSize: 11.5, color: "#475569", marginTop: 2, lineHeight: 1.4 }}>
                                        {action.desc}
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      fontSize: 10.5,
                                      fontWeight: 800,
                                      padding: "4px 9px",
                                      borderRadius: 6,
                                      background: isActionChecked ? "#ecfdf5" : "#f1f5f9",
                                      color: isActionChecked ? "#059669" : "#64748b",
                                      border: isActionChecked ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {isActionChecked ? (
                                      <>
                                        <CheckCircle2 size={12} color="#059669" />
                                        ALLOW
                                      </>
                                    ) : (
                                      <>
                                        <Lock size={11} color="#94a3b8" />
                                        DENY
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
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
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#166534", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={14} />
                    Live Preview Before Saving:
                  </div>
                  <div style={{ fontSize: 12, color: "#15803d" }}>
                    Granted: <strong>{selectedRoutes.length} route(s)</strong> and <strong>{selectedActions.length} action(s)</strong>.
                  </div>
                </div>
              </div>

              {/* 3. Fixed Sticky Footer */}
              <div
                style={{
                  flexShrink: 0,
                  padding: "14px 22px",
                  borderTop: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                  <strong style={{ color: "#4f46e5" }}>{selectedRoutes.length}</strong> Modules •{" "}
                  <strong style={{ color: "#059669" }}>{selectedActions.length}</strong> Actions
                </div>

                <div style={{ display: "flex", gap: 10 }}>
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
                      padding: "9px 22px",
                      borderRadius: 9,
                      border: "none",
                      background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
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
                border: "1px solid #e2e8f0",
                boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(15, 23, 42, 0.05)",
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
                border: "1px solid #e2e8f0",
                boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(15, 23, 42, 0.05)",
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
          .gf-modal-dialog {
            max-width: 96vw !important;
            max-height: 94vh !important;
            border-radius: 16px !important;
          }
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
            display: flex !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            -webkit-overflow-scrolling: touch !important;
            gap: 6px !important;
            padding-bottom: 2px !important;
          }
          .gf-mgmt-tabs::-webkit-scrollbar,
          .gf-visibility-presets-bar::-webkit-scrollbar {
            display: none !important;
          }
          .gf-mgmt-tab-btn {
            flex: 0 0 auto !important;
            white-space: nowrap !important;
            font-size: 12.5px !important;
            padding: 8px 14px !important;
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
          .gf-modal-presets-bar,
          .gf-visibility-presets-bar {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            scrollbar-width: none !important;
            -webkit-overflow-scrolling: touch !important;
            padding-bottom: 4px !important;
          }
        }
        @media (max-width: 480px) {
          .gf-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .gf-modal-dialog {
            max-width: 98vw !important;
            max-height: 96vh !important;
            border-radius: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
