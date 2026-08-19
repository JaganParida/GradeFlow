import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { encodeStudentId } from "../utils/studentIdEncoder";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  GraduationCap,
  ArrowRight,
  BarChart2,
  Trophy,
  TrendingUp,
  Target,
  FileText,
  Calculator,
  Home as HomeIcon,
  Layers,
  Network,
  Settings,
  Eye,
  GitCompare,
  ClipboardList,
  CheckCircle2,
  ChevronDown,
  Activity,
  Mail,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Heart,
  Briefcase,
  Sliders,
  Star,
  Search,
  X,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";

/* ─── Social SVG Icons ─────────────────────────────────────────── */
const TwitterIcon = ({ size = 15 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedinIcon = ({ size = 15 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ size = 15 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const GithubIcon = ({ size = 15 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

/* ─── Mock Data ────────────────────────────────────────────────── */
const PREVIEW_TREND_DATA = [
  { sem: "Sem 1", sgpa: 4.8 },
  { sem: "Sem 2", sgpa: 6.5 },
  { sem: "Sem 3", sgpa: 5.2 },
  { sem: "Sem 4", sgpa: 7.5 },
  { sem: "Sem 5", sgpa: 7.8 },
  { sem: "Sem 6", sgpa: 9.1 },
];

const MAIN_AREA_DATA = [
  { sem: "Sem 1", sgpa: 6.2 },
  { sem: "Sem 2", sgpa: 7.1 },
  { sem: "Sem 3", sgpa: 7.8 },
  { sem: "Sem 4", sgpa: 7.7 },
  { sem: "Sem 5", sgpa: 8.4 },
  { sem: "Sem 6", sgpa: 9.1 },
];

const DONUT_DATA = [
  { label: "Excellent", value: 60, color: "#2563eb" },
  { label: "Good", value: 25, color: "#10b981" },
  { label: "Average", value: 10, color: "#f59e0b" },
  { label: "Improvement", value: 5, color: "#ef4444" },
];

const TOP_SUBJECTS_LIST = [
  {
    name: "Data Structures",
    score: 9.2,
    color: "#2563eb",
    bg: "#eff6ff",
    icon: <Layers size={15} />,
  },
  {
    name: "Database Systems",
    score: 8.8,
    color: "#10b981",
    bg: "#ecfdf5",
    icon: <FileText size={15} />,
  },
  {
    name: "Operating Systems",
    score: 8.5,
    color: "#f59e0b",
    bg: "#fffbeb",
    icon: <Layers size={15} />,
  },
  {
    name: "Computer Networks",
    score: 9.0,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    icon: <Network size={15} />,
  },
  {
    name: "Software Engineering",
    score: 8.3,
    color: "#f97316",
    bg: "#fff7ed",
    icon: <FileText size={15} />,
  },
];

const QUICK_ACTIONS_ITEMS = [
  {
    label: "Calculate SGPA",
    icon: <Calculator size={20} color="#2563eb" />,
    bg: "#eff6ff",
    to: "/resources",
    tab: "sgpa-calc",
    hash: "#sgpa-calc",
  },
  {
    label: "Calculate CGPA",
    icon: <BarChart2 size={20} color="#10b981" />,
    bg: "#ecfdf5",
    to: "/resources",
    tab: "cgpa-calc",
    hash: "#cgpa-calc",
  },
  {
    label: "What-If Simulator",
    icon: <Sliders size={20} color="#8b5cf6" />,
    bg: "#f5f3ff",
    to: "/analytics",
    tab: "whatif",
    hash: "#whatif",
  },
  {
    label: "GPA Predictor",
    icon: <Target size={20} color="#f59e0b" />,
    bg: "#fffbeb",
    to: "/resources",
    tab: "target-predictor",
    hash: "#target-predictor",
  },
  {
    label: "Placement Insights",
    icon: <Briefcase size={20} color="#06b6d4" />,
    bg: "#ecfeff",
    to: "/analytics",
    tab: "placement",
    hash: "#placement",
  },
  {
    label: "Compare Scores",
    icon: <GitCompare size={20} color="#ec4899" />,
    bg: "#fdf2f8",
    to: "/analytics",
    tab: "overview",
    hash: "#overview",
  },
];

const RECENT_ACTIVITIES = [
  {
    title: "Semester 6 results published",
    desc: "Published on 10 May 2025",
    color: "#2563eb",
    bg: "#eff6ff",
    tag: "Results",
    tagBg: "#eff6ff",
    tagColor: "#2563eb",
    icon: <FileText size={15} />,
  },
  {
    title: "SGPA updated",
    desc: "Your SGPA for Semester 6 is 9.10",
    color: "#10b981",
    bg: "#ecfdf5",
    tag: "SGPA",
    tagBg: "#ecfdf5",
    tagColor: "#10b981",
    icon: <TrendingUp size={15} />,
  },
  {
    title: "Academic Health updated",
    desc: "Your score reached 96/100",
    color: "#f59e0b",
    bg: "#fffbeb",
    tag: "Health",
    tagBg: "#fffbeb",
    tagColor: "#d97706",
    icon: <Activity size={15} />,
  },
  {
    title: "New academic report available",
    desc: "Check detailed performance report",
    color: "#ef4444",
    bg: "#fef2f2",
    tag: "Report",
    tagBg: "#fef2f2",
    tagColor: "#dc2626",
    icon: <FileText size={15} />,
  },
];

/* ─── SVG Donut Chart Component ────────────────────────────────── */
function DonutChartComponent() {
  const r = 36,
    cx = 48,
    cy = 48,
    stroke = 10;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div
      className="gf-donut-wrap"
      style={{ display: "flex", alignItems: "center", gap: 14 }}
    >
      <div
        style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}
      >
        <svg
          viewBox="0 0 96 96"
          style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={stroke}
          />
          {DONUT_DATA.map((seg, i) => {
            const pct = seg.value / 100;
            const dash = pct * circumference;
            const gap = circumference - dash;
            const currentOffset = offset;
            offset += dash;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1,
            }}
          >
            85%
          </span>
          <span
            style={{
              fontSize: 8.5,
              fontWeight: 600,
              color: "#94a3b8",
              marginTop: 2,
            }}
          >
            Avg Score
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 5,
          flex: 1,
          minWidth: 0,
        }}
      >
        {DONUT_DATA.map((d, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 11,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: d.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: "#64748b",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {d.label}
              </span>
            </div>
            <span
              style={{
                fontWeight: 700,
                color: "#0f172a",
                marginLeft: 4,
                flexShrink: 0,
              }}
            >
              {d.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HOME PAGE COMPONENT
   ════════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const { studentData, hasActiveSession, fetchStudent, openStudentAuthModal } = useApp();
  const [emailSub, setEmailSub] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAuthPromptModal, setShowAuthPromptModal] = useState(false);
  const [pendingQuickAction, setPendingQuickAction] = useState(null);
  const [searchRegInput, setSearchRegInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mobileShowcaseTab, setMobileShowcaseTab] = useState("tracker");
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentRegNo = studentData?.regNo || studentSession?.regNo || "";

  const handleDashboardAction = () => {
    if (hasActiveSession && currentRegNo) {
      navigate(`/dashboard/${encodeStudentId(currentRegNo)}`);
    } else {
      openStudentAuthModal();
    }
  };

  const handleLeaderboardAction = () => {
    if (hasActiveSession && currentRegNo) {
      navigate("/leaderboard");
    } else {
      openStudentAuthModal();
    }
  };

  const handleQuickAction = (act) => {
    if (act.to.startsWith("/analytics")) {
      if (hasActiveSession && currentRegNo) {
        const query = act.tab ? `?tab=${act.tab}` : "";
        navigate(`/analytics/${encodeStudentId(currentRegNo)}${query}${act.hash || ""}`);
      } else {
        openStudentAuthModal();
      }
    } else if (act.to.startsWith("/resources")) {
      const query = act.tab ? `?tab=${act.tab}` : "";
      navigate(`/resources${query}${act.hash || ""}`);
    } else if (act.to.startsWith("/dashboard")) {
      handleDashboardAction();
    } else {
      navigate(act.to);
    }
  };

  const renderQuickActionsCard = (isHeroMobile = false) => (
    <div
      className={isHeroMobile ? "gf-mobile-quick-card gf-content-card" : "gf-desktop-quick-card gf-content-card"}
      style={{
        background: "#ffffff",
        border: "1px solid #f1f5f9",
        borderRadius: isHeroMobile ? 16 : 18,
        padding: isHeroMobile ? "14px 12px" : "22px 24px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
        marginTop: isHeroMobile ? 6 : 0,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isHeroMobile ? 12 : 16 }}>
        <h3
          style={{
            fontSize: isHeroMobile ? 14.5 : 16,
            fontWeight: 800,
            color: "#0f172a",
            margin: 0,
          }}
        >
          Quick Actions
        </h3>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 7px", borderRadius: 5 }}>
          6 Tools
        </span>
      </div>

      <div
        className="gf-quick-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: isHeroMobile ? 8 : 10,
        }}
      >
        {QUICK_ACTIONS_ITEMS.map((act, idx) => (
          <div
            key={idx}
            onClick={() => handleQuickAction(act)}
            className="gf-quick-btn"
            style={{
              background: "#fcfdfe",
              border: "1px solid #f1f5f9",
              borderRadius: 12,
              padding: isHeroMobile ? "12px 4px" : "16px 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 16px rgba(0,0,0,0.04)";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "#f1f5f9";
            }}
          >
            <div
              style={{
                width: isHeroMobile ? 36 : 40,
                height: isHeroMobile ? 36 : 40,
                borderRadius: 10,
                background: act.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {act.icon}
            </div>
            <span
              style={{
                fontSize: isHeroMobile ? 11 : 11.5,
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {act.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const handleSearchModalSubmit = async (e) => {
    e.preventDefault();
    const cleanReg = searchRegInput.trim();
    if (!cleanReg) {
      setSearchError("Please enter your university registration number.");
      return;
    }
    setIsSearching(true);
    setSearchError("");
    try {
      const success = await fetchStudent(cleanReg);
      if (success) {
        setShowSearchModal(false);
        if (pendingQuickAction && pendingQuickAction.to.startsWith("/analytics")) {
          const query = pendingQuickAction.tab ? `?tab=${pendingQuickAction.tab}` : "";
          const target = `/analytics/${encodeStudentId(cleanReg)}${query}${pendingQuickAction.hash || ""}`;
          setPendingQuickAction(null);
          navigate(target);
        } else {
          navigate(`/dashboard/${encodeStudentId(cleanReg)}`);
        }
      } else {
        setSearchError("Student record not found. Please verify your registration number.");
      }
    } catch (err) {
      setSearchError("Unable to fetch student records. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailSub.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmailSub("");
    }
  };

  const renderMobileHome = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%",
        maxWidth: 540,
        margin: "0 auto",
        padding: "16px 12px 36px 12px",
        boxSizing: "border-box",
      }}
    >
      {/* ── 1. Hero Header & 1-Tap Search ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Pill Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 99,
              background: "#eff6ff",
              border: "1px solid #dbeafe",
              color: "#2563eb",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.2px",
            }}
          >
            <GraduationCap size={13} color="#2563eb" /> Centurion University Academic Portal
          </span>
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 800,
            lineHeight: 1.22,
            color: "#0f172a",
            letterSpacing: "-0.6px",
            margin: 0,
          }}
        >
          Track Every <span style={{ color: "#0284c7" }}>Grade</span> <br />
          Own Your <span style={{ color: "#2563eb" }}>Academic Future</span>
        </h1>

        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.5,
            color: "#64748b",
            margin: 0,
          }}
        >
          Real-time GPA tracking, university rankings, placement insights, and simulation tools.
        </p>

        {/* Student Session Card or Login CTA */}
        {hasActiveSession && currentRegNo ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f0fdf4",
              border: "1.5px solid #bbf7d0",
              borderRadius: 14,
              padding: "12px 14px",
              marginTop: 4,
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck size={22} color="#16a34a" />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#166534" }}>
                  Active Student Session
                </div>
                <div style={{ fontSize: 12, color: "#15803d", fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
                  {currentRegNo}
                </div>
              </div>
            </div>
            <button
              onClick={handleDashboardAction}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                color: "#ffffff",
                border: "none",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)",
              }}
            >
              <span>Dashboard</span>
              <ArrowRight size={13} />
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 4 }}>
            <button
              type="button"
              onClick={openStudentAuthModal}
              style={{
                width: "100%",
                padding: "12px 18px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                border: "none",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              <GraduationCap size={17} />
              <span>Student Portal Login</span>
              <ArrowRight size={15} />
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                fontSize: 11.5,
                color: "#64748b",
                marginTop: 6,
                fontWeight: 500,
              }}
            >
              <Lock size={11} color="#64748b" />
              <span>Secured via Centurion University Email OTP &middot; Single Active Device</span>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <button
            onClick={handleDashboardAction}
            style={{
              flex: 1.2,
              padding: "10px 14px",
              borderRadius: 10,
              background: "#0f172a",
              color: "#ffffff",
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: "0 2px 6px rgba(15, 23, 42, 0.15)",
            }}
          >
            <span>{currentRegNo ? "My Dashboard" : "Go to Dashboard"}</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={handleLeaderboardAction}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#ffffff",
              color: "#1e293b",
              border: "1px solid #cbd5e1",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Trophy size={14} color="#f59e0b" />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* Social Trust Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "#ffffff",
            border: "1px solid #f1f5f9",
            borderRadius: 10,
            fontSize: 11.5,
            color: "#475569",
            fontWeight: 600,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={11} fill="#f59e0b" color="#f59e0b" />
            ))}
            <span style={{ fontWeight: 800, color: "#0f172a", marginLeft: 4 }}>5.0 Rating</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <GraduationCap size={13} color="#2563eb" />
            <span><strong style={{ color: "#0f172a" }}>1000+</strong> students</span>
          </div>
        </div>
      </motion.div>

      {/* ── 2. Quick Tools Grid ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Quick Tools</h2>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 7px", borderRadius: 6 }}>
            6 Academic Tools
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {QUICK_ACTIONS_ITEMS.map((act, idx) => (
            <div
              key={idx}
              onClick={() => handleQuickAction(act)}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "12px 6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 6,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                transition: "transform 0.15s ease",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: act.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {act.icon}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#1e293b",
                  lineHeight: 1.25,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {act.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Interactive Showcase (Clean, Native Mobile Tab Card) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={15} color="#2563eb" />
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Feature Highlights
            </h3>
          </div>
          <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600 }}>Interactive</span>
        </div>

        {/* Tab Pills */}
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 4,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {[
            { id: "tracker", label: "📈 Performance" },
            { id: "rankings", label: "🏆 Rankings" },
            { id: "career", label: "💼 Placement" },
            { id: "simulator", label: "🎛️ Simulator" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setMobileShowcaseTab(t.id)}
              style={{
                padding: "6px 11px",
                borderRadius: 99,
                border: mobileShowcaseTab === t.id ? "1px solid #2563eb" : "1px solid #e2e8f0",
                background: mobileShowcaseTab === t.id ? "#2563eb" : "#f8fafc",
                color: mobileShowcaseTab === t.id ? "#ffffff" : "#475569",
                fontSize: 11.5,
                fontWeight: mobileShowcaseTab === t.id ? 800 : 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Active Content Showcase */}
        {mobileShowcaseTab === "tracker" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ padding: "10px", background: "#eff6ff", borderRadius: 10, border: "1px solid #dbeafe" }}>
                <span style={{ fontSize: 10.5, color: "#1e40af", fontWeight: 700 }}>CUMULATIVE CGPA</span>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#1e3a8a", marginTop: 2 }}>9.10</div>
                <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 700 }}>+0.25 vs Last Sem</span>
              </div>
              <div style={{ padding: "10px", background: "#ecfdf5", borderRadius: 10, border: "1px solid #a7f3d0" }}>
                <span style={{ fontSize: 10.5, color: "#065f46", fontWeight: 700 }}>LATEST SGPA</span>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#064e3b", marginTop: 2 }}>9.40</div>
                <span style={{ fontSize: 10, color: "#059669", fontWeight: 700 }}>Top 5% Tier</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.45 }}>
              Track semester-by-semester SGPA progression, total credits earned, and historical GPA growth trajectory.
            </p>
            <button
              onClick={() => handleQuickAction({ to: "/analytics", tab: "overview", hash: "#overview" })}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: "#f1f5f9",
                border: "none",
                color: "#2563eb",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <span>View Performance Studio</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {mobileShowcaseTab === "rankings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ padding: "10px", background: "#f5f3ff", borderRadius: 10, border: "1px solid #ddd6fe" }}>
                <span style={{ fontSize: 10.5, color: "#5b21b6", fontWeight: 700 }}>UNIVERSITY RANK</span>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#4c1d95", marginTop: 2 }}>#12</div>
                <span style={{ fontSize: 10, color: "#6d28d9", fontWeight: 700 }}>Top 2% Overall</span>
              </div>
              <div style={{ padding: "10px", background: "#fef3c7", borderRadius: 10, border: "1px solid #fde68a" }}>
                <span style={{ fontSize: 10.5, color: "#92400e", fontWeight: 700 }}>BRANCH RANK</span>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#78350f", marginTop: 2 }}>#4</div>
                <span style={{ fontSize: 10, color: "#b45309", fontWeight: 700 }}>CSE Department</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.45 }}>
              Compare your academic standing against classmates across semesters, branches (CSE, ME, ECE, CIVIL), and sections.
            </p>
            <button
              onClick={handleLeaderboardAction}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: "#f1f5f9",
                border: "none",
                color: "#2563eb",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <span>Explore Leaderboard</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {mobileShowcaseTab === "career" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              <div style={{ padding: "8px 6px", background: "#f8fafc", borderRadius: 8, textAlign: "center", border: "1px solid #edf2f7" }}>
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>TIER 1 (8.5+)</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a", marginTop: 2 }}>Eligible</div>
              </div>
              <div style={{ padding: "8px 6px", background: "#f8fafc", borderRadius: 8, textAlign: "center", border: "1px solid #edf2f7" }}>
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>TIER 2 (7.5+)</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a", marginTop: 2 }}>Eligible</div>
              </div>
              <div style={{ padding: "8px 6px", background: "#f8fafc", borderRadius: 8, textAlign: "center", border: "1px solid #edf2f7" }}>
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>COMPANIES</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#2563eb", marginTop: 2 }}>45+ Matches</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.45 }}>
              Check placement cutoffs for top recruiters (TCS, Infosys, Wipro, Amazon, Deloitte) based on your live CGPA.
            </p>
            <button
              onClick={() => handleQuickAction({ to: "/analytics", tab: "placement", hash: "#placement" })}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: "#f1f5f9",
                border: "none",
                color: "#2563eb",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <span>View Placement Insights</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {mobileShowcaseTab === "simulator" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ padding: "10px 12px", background: "#faf5ff", borderRadius: 10, border: "1px solid #e9d5ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#7e22ce", fontWeight: 700 }}>SIMULATED TARGET</span>
                <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 800 }}>Achievable</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#581c87", marginTop: 2 }}>Need 8.8 SGPA next semester</div>
              <span style={{ fontSize: 10.5, color: "#9333ea" }}>To reach 9.00 Cumulative CGPA</span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.45 }}>
              Simulate upcoming course grades or compute required SGPA to hit your dream graduation honors.
            </p>
            <button
              onClick={() => handleQuickAction({ to: "/analytics", tab: "whatif", hash: "#whatif" })}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: "#f1f5f9",
                border: "none",
                color: "#2563eb",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <span>Open Simulation Studio</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── 4. Why GradeFlow (Minimal, High-Value Cards) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Built for Centurion Students</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            {
              icon: <CheckCircle2 size={16} color="#16a34a" />,
              bg: "#f0fdf4",
              title: "100% University Verified Formula",
              desc: "Accurate grade points and credit weightings calculated according to official Centurion guidelines.",
            },
            {
              icon: <Trophy size={16} color="#d97706" />,
              bg: "#fffbeb",
              title: "Branch & Batch Leaderboards",
              desc: "Instant live ranks across CSE, ME, ECE, EEE, CIVIL, and all sections.",
            },
            {
              icon: <ShieldCheck size={16} color="#2563eb" />,
              bg: "#eff6ff",
              title: "Fast & Privacy Protected",
              desc: "Encrypted student identifiers ensure your academic profile is secure.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 12px",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: item.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {item.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", margin: "0 0 2px 0" }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Bottom CTA Banner (Compact Gradient) ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: 16,
          padding: "18px 16px",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.15)",
        }}
      >
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Ready to track?
          </span>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", margin: "4px 0 0 0" }}>
            Check Your Results &amp; Rankings
          </h3>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleDashboardAction}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span>Go to Dashboard</span>
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => navigate("/resources")}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Resources
          </button>
        </div>
      </div>

      {/* ── 6. Minimalist Mobile Footer ── */}
      <div
        style={{
          borderTop: "1px solid #e2e8f0",
          paddingTop: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <GraduationCap size={16} color="#2563eb" />
          <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>GradeFlow</span>
          <span style={{ fontSize: 11, color: "#64748b" }}>• Centurion University</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px", fontSize: 12, color: "#475569", fontWeight: 600 }}>
          <span onClick={() => navigate("/resources?tab=grading-scale")} style={{ cursor: "pointer" }}>Grading Scale</span>
          <span>•</span>
          <span onClick={() => navigate("/resources?tab=academic-health")} style={{ cursor: "pointer" }}>Academic Health</span>
          <span>•</span>
          <span onClick={() => navigate("/leaderboard")} style={{ cursor: "pointer" }}>Leaderboard</span>
          <span>•</span>
          <span onClick={() => navigate("/resources?tab=help-faq")} style={{ cursor: "pointer" }}>Help & FAQ</span>
          <span>•</span>
          <span onClick={() => navigate("/about-dev")} style={{ cursor: "pointer" }}>Developer</span>
          <span>•</span>
          <span onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>Admin</span>
        </div>

        <div style={{ fontSize: 11, color: "#94a3b8" }}>
          © 2026 GradeFlow. Designed &amp; engineered for Centurion University students.
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: "#fcfdfe",
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ── Main Container (Mobile vs Desktop) ── */}
      {isMobile ? (
        renderMobileHome()
      ) : (
        <div
          className="gf-home-container"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "36px 28px 60px",
            display: "flex",
            flexDirection: "column",
            gap: 36,
            boxSizing: "border-box",
            width: "100%",
          }}
        >
        {/* ══════════════════════════════════════════════════════════
            SECTION 1: HERO SECTION
        ══════════════════════════════════════════════════════════ */}
        <section
          className="gf-hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.08fr 1.15fr",
            gap: 36,
            alignItems: "center",
          }}
        >
          {/* Left Column: Headline & Action */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            {/* Main Headline */}
            <h1
              className="gf-hero-title"
              style={{
                fontSize: "clamp(22px, 3.2vw, 42px)",
                fontWeight: 800,
                lineHeight: 1.2,
                color: "#0f172a",
                letterSpacing: "-0.8px",
                margin: 0,
              }}
            >
              <span style={{ display: "block", whiteSpace: "nowrap", marginBottom: 3 }}>
                Track Every <span style={{ color: "#0284c7" }}>Grade</span>
              </span>
              <span style={{ display: "block", whiteSpace: "nowrap" }}>
                Own Your <span style={{ color: "#2563eb" }}>Academic Future</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="gf-hero-subtitle"
              style={{
                fontSize: "clamp(14px, 3.6vw, 15.5px)",
                lineHeight: 1.6,
                color: "#64748b",
                maxWidth: 480,
                margin: 0,
              }}
            >
              GradeFlow delivers real-time GPA tracking, predictive career intelligence,
              and in-depth performance analytics built for academic excellence.
            </p>

            {/* Action Buttons */}
            <div
              className="gf-hero-actions"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 4,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleDashboardAction}
                className="gf-btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 10,
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                  transition: "all 0.2s ease",
                  minHeight: 46,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1d4ed8")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#2563eb")
                }
              >
                Go to Dashboard <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/resources")}
                className="gf-btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "12px 20px",
                  borderRadius: 10,
                  background: "#ffffff",
                  color: "#1e293b",
                  border: "1.5px solid #e2e8f0",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s ease",
                  minHeight: 46,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <span>Explore Features</span>
                <ArrowRight size={13} style={{ color: "#64748b" }} />
              </button>
            </div>

            {/* Social Trust Card Badge */}
            <div
              className="gf-trust-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                marginTop: 6,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                padding: "6px 14px 6px 8px",
                borderRadius: 999,
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                width: "fit-content",
                maxWidth: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Overlapping Avatars */}
              <div
                style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
              >
                {[
                  {
                    bg: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                    text: "J",
                    name: "Jagan",
                  },
                  {
                    bg: "linear-gradient(135deg, #10b981, #059669)",
                    text: "A",
                    name: "Ankit",
                  },
                  {
                    bg: "linear-gradient(135deg, #f59e0b, #d97706)",
                    text: "R",
                    name: "Rohan",
                  },
                  {
                    bg: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    text: "S",
                    name: "Sneha",
                  },
                ].map((u, idx) => (
                  <div
                    key={idx}
                    title={u.name}
                    className="gf-trust-avatar"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: u.bg,
                      border: "2px solid #ffffff",
                      marginLeft: idx === 0 ? 0 : -8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: 10.5,
                      fontWeight: 800,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    {u.text}
                  </div>
                ))}
              </div>

              {/* Text & Rating Details */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 2.5 }}
                >
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <span
                  className="gf-trust-text"
                  style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}
                >
                  <strong style={{ color: "#0f172a", fontWeight: 800 }}>
                    1000+
                  </strong>{" "}
                  students used
                </span>
              </div>
            </div>

            {/* Mobile Only: Quick Actions positioned right under Hero */}
            <div className="gf-mobile-quick-wrapper">
              {renderQuickActionsCard(true)}
            </div>
          </motion.div>

          {/* Right Column: Dashboard Mockup Card */}
          <div
            className="gf-mockup-wrapper"
            style={{ position: "relative", width: "100%", minWidth: 0 }}
          >
            {/* Subtle glow behind card */}
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                bottom: -20,
                left: -20,
                background:
                  "radial-gradient(ellipse at center, rgba(37, 99, 235, 0.08) 0%, rgba(240, 244, 255, 0) 70%)",
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="gf-mockup-card"
              style={{
                background: "#ffffff",
                borderRadius: 20,
                border: "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow:
                  "0 20px 40px -10px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8)",
                display: "grid",
                gridTemplateColumns: "52px 1fr",
                overflow: "hidden",
                position: "relative",
                zIndex: 1,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Mockup Left Sidebar */}
              <div
                className="gf-mockup-sidebar"
                style={{
                  background: "#fafbfc",
                  borderRight: "1px solid #f1f5f9",
                  padding: "18px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#2563eb",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 3px 8px rgba(37, 99, 235, 0.3)",
                    }}
                  >
                    <HomeIcon size={16} />
                  </div>
                  <div style={{ color: "#94a3b8" }}>
                    <BarChart2 size={16} />
                  </div>
                  <div style={{ color: "#94a3b8" }}>
                    <Layers size={16} />
                  </div>
                  <div style={{ color: "#94a3b8" }}>
                    <Trophy size={16} />
                  </div>
                  <div style={{ color: "#94a3b8" }}>
                    <FileText size={16} />
                  </div>
                  <div style={{ color: "#94a3b8" }}>
                    <Settings size={16} />
                  </div>
                </div>

                {/* Avatar with Online Dot */}
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#dbeafe",
                      color: "#2563eb",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    S
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      bottom: -1,
                      right: -1,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#22c55e",
                      border: "1.5px solid #ffffff",
                    }}
                  />
                </div>
              </div>

              {/* Mockup Content Panel */}
              <div
                className="gf-mockup-content"
                style={{
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  minWidth: 0,
                  boxSizing: "border-box",
                }}
              >
                {/* Header inside Mockup */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        flexWrap: "wrap",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: "#0f172a",
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span>Alex Kumar (Sample Student)</span>
                        <CheckCircle2 size={13} color="#2563eb" />
                      </h3>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #dbeafe",
                          padding: "2px 6px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                        }}
                      >
                        Sample Preview
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 11.5,
                        color: "#94a3b8",
                        margin: "2px 0 0 0",
                      }}
                    >
                      Sample academic overview • Centurion University
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 10px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "#334155",
                    }}
                  >
                    Semester 6 <ChevronDown size={13} color="#94a3b8" />
                  </div>
                </div>

                {/* 4 Mini Stat Cards in Mockup */}
                <div
                  className="gf-mockup-stats-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 10,
                  }}
                >
                  {/* CGPA */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: 12,
                      padding: "10px 10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#94a3b8",
                        }}
                      >
                        CGPA
                      </span>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <GraduationCap size={12} />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      8.72{" "}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#94a3b8",
                        }}
                      >
                        /10
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 9.5,
                        color: "#16a34a",
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                    >
                      ↑ 0.42
                    </div>
                  </div>

                  {/* SGPA */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: 12,
                      padding: "10px 10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#94a3b8",
                        }}
                      >
                        SGPA
                      </span>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: "#ecfdf5",
                          color: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <TrendingUp size={12} />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      9.10{" "}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#94a3b8",
                        }}
                      >
                        /10
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 9.5,
                        color: "#16a34a",
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                    >
                      ↑ 0.35
                    </div>
                  </div>

                  {/* Academic Health */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: 12,
                      padding: "10px 10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#94a3b8",
                        }}
                      >
                        Health
                      </span>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: "#fffbeb",
                          color: "#f59e0b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Activity size={12} />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      96
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#94a3b8",
                        }}
                      >
                        /100
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 9.5,
                        color: "#16a34a",
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                    >
                      ↑ 4 pts
                    </div>
                  </div>

                  {/* University Rank */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: 12,
                      padding: "10px 10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#94a3b8",
                        }}
                      >
                        Rank
                      </span>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: "#f5f3ff",
                          color: "#8b5cf6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trophy size={12} />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      #24
                    </div>
                    <div
                      style={{
                        fontSize: 9.5,
                        color: "#16a34a",
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                    >
                      ↑ 12 pos
                    </div>
                  </div>
                </div>

                {/* 2 Mini Charts Row inside Mockup */}
                <div
                  className="gf-mockup-charts-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.15fr 1fr",
                    gap: 12,
                    minWidth: 0,
                  }}
                >
                  {/* SGPA Trend */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: 12,
                      padding: "12px 12px",
                      position: "relative",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#0f172a",
                        marginBottom: 6,
                      }}
                    >
                      SGPA Trend
                    </div>
                    <div
                      style={{
                        height: 115,
                        position: "relative",
                        width: "100%",
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={PREVIEW_TREND_DATA}
                          margin={{ top: 8, right: 8, left: -28, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="previewAreaGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#2563eb"
                                stopOpacity={0.25}
                              />
                              <stop
                                offset="95%"
                                stopColor="#2563eb"
                                stopOpacity={0.0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="2 2"
                            stroke="#f1f5f9"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="sem"
                            tick={{ fontSize: 9, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 10]}
                            ticks={[0, 5, 10]}
                            tick={{ fontSize: 9, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="sgpa"
                            stroke="#2563eb"
                            strokeWidth={2.2}
                            fillOpacity={1}
                            fill="url(#previewAreaGrad)"
                            dot={{
                              r: 3,
                              fill: "#2563eb",
                              stroke: "#ffffff",
                              strokeWidth: 1.5,
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>

                      {/* Tooltip badge */}
                      <div
                        style={{
                          position: "absolute",
                          right: 4,
                          top: 0,
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 6,
                          padding: "3px 6px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                          textAlign: "center",
                          pointerEvents: "none",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          9.10
                        </div>
                        <div style={{ fontSize: 8, color: "#64748b" }}>
                          Sem 6
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Donut Chart */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: 12,
                      padding: "12px 12px",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#0f172a",
                        marginBottom: 6,
                      }}
                    >
                      Subject Performance
                    </div>
                    <DonutChartComponent />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Mobile Notice Banner for Unauthenticated Students ── */}
        {!currentRegNo && isMobile && (
          <div
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
              borderRadius: 16,
              padding: "16px 18px",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              boxShadow: "0 8px 20px rgba(37, 99, 235, 0.15)",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Target size={18} color="#93c5fd" />
              <span style={{ fontSize: 13.5, fontWeight: 800 }}>
                Want to see your actual grades?
              </span>
            </div>
            <p
              style={{
                fontSize: 11.5,
                color: "#dbeafe",
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              The statistics above show a <strong>sample demo preview</strong>.
              Log in with your official university email OTP to load your personal results and ranking.
            </p>
            <button
              onClick={openStudentAuthModal}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 10,
                background: "#ffffff",
                color: "#1e3a8a",
                border: "none",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <GraduationCap size={16} /> Student Portal Login (Email OTP)
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            SECTION 2: 4 STANDALONE STAT CARDS
        ══════════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <div
            style={{
              display: "flex",
              alignItems: isMobile ? "flex-start" : "center",
              justifyContent: "space-between",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 8 : 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: "#2563eb",
                  background: "#eff6ff",
                  border: "1px solid #dbeafe",
                  padding: "3px 8px",
                  borderRadius: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                  whiteSpace: "nowrap",
                }}
              >
                <Activity size={12} color="#2563eb" />
                <span>Dashboard Preview</span>
              </span>
              <h2
                style={{
                  fontSize: isMobile ? 17 : 20,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                How Your Academic Dashboard Looks
              </h2>
            </div>
            <button
              type="button"
              onClick={handleDashboardAction}
              style={{
                background: "transparent",
                border: "none",
                color: "#2563eb",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: 0,
              }}
            >
              <span>{currentRegNo ? "View your real grades" : "Search your registration number"}</span>
              <ArrowRight size={13} />
            </button>
          </div>
          <p style={{ fontSize: isMobile ? 12 : 13, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
            Sample student metrics — Here is how GradeFlow calculates and visualizes your CGPA, SGPA, academic health, and university standing once searched.
          </p>
        </div>

        <section
          className="gf-stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {/* Card 1: CGPA */}
          <div
            className="gf-stat-card"
            style={{
              background: "#ffffff",
              border: "1px solid #f1f5f9",
              borderRadius: 16,
              padding: "18px 18px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                CGPA
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.15,
                  marginTop: 1,
                }}
              >
                8.72{" "}
                <span
                  style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}
                >
                  /10
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#16a34a",
                  marginTop: 2,
                }}
              >
                ↑ 0.42{" "}
                <span style={{ color: "#64748b", fontWeight: 400 }}>
                  this semester
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: SGPA */}
          <div
            className="gf-stat-card"
            style={{
              background: "#ffffff",
              border: "1px solid #f1f5f9",
              borderRadius: 16,
              padding: "18px 18px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "#ecfdf5",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                SGPA
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.15,
                  marginTop: 1,
                }}
              >
                9.10{" "}
                <span
                  style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}
                >
                  /10
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#16a34a",
                  marginTop: 2,
                }}
              >
                ↑ 0.35{" "}
                <span style={{ color: "#64748b", fontWeight: 400 }}>
                  this semester
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Academic Health */}
          <div
            className="gf-stat-card"
            style={{
              background: "#ffffff",
              border: "1px solid #f1f5f9",
              borderRadius: 16,
              padding: "18px 18px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "#fffbeb",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Activity size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                Academic Health
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.15,
                  marginTop: 1,
                }}
              >
                96{" "}
                <span
                  style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}
                >
                  /100
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#16a34a",
                  marginTop: 2,
                }}
              >
                ↑ 4 pts{" "}
                <span style={{ color: "#64748b", fontWeight: 400 }}>
                  Excellent
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: University Rank */}
          <div
            className="gf-stat-card"
            style={{
              background: "#ffffff",
              border: "1px solid #f1f5f9",
              borderRadius: 16,
              padding: "18px 18px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "#f5f3ff",
                color: "#8b5cf6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Trophy size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                University Rank
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.15,
                  marginTop: 1,
                }}
              >
                #24
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#16a34a",
                  marginTop: 2,
                }}
              >
                ↑ 12{" "}
                <span style={{ color: "#64748b", fontWeight: 400 }}>
                  positions
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3: SGPA ACROSS SEMESTERS & TOP SUBJECTS
        ══════════════════════════════════════════════════════════ */}
        <section
          className="gf-row-split"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          {/* Left: SGPA Across Semesters Area Chart */}
          <div
            className="gf-content-card"
            style={{
              background: "#ffffff",
              border: "1px solid #f1f5f9",
              borderRadius: 18,
              padding: "22px 24px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  SGPA Across Semesters
                </h3>
                {!currentRegNo && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#64748b",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    Sample
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  background: "#ffffff",
                }}
              >
                All Semesters <ChevronDown size={12} color="#94a3b8" />
              </div>
            </div>

            <div
              className="gf-main-chart-wrap"
              style={{ width: "100%", height: 230 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={MAIN_AREA_DATA}
                  margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="areaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="sem"
                    tick={{ fontSize: 10.5, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2.5, 5, 7.5, 10]}
                    tick={{ fontSize: 10.5, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sgpa"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                    dot={{
                      r: 4,
                      fill: "#2563eb",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Top Subjects */}
          <div
            className="gf-content-card"
            style={{
              background: "#ffffff",
              border: "1px solid #f1f5f9",
              borderRadius: 18,
              padding: "22px 24px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  Top Subjects{" "}
                  <span
                    style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}
                  >
                    (Sem 6)
                  </span>
                </h3>
                {!currentRegNo && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#64748b",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    Sample
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleDashboardAction}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                }}
              >
                View All
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {TOP_SUBJECTS_LIST.map((sub, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: sub.bg,
                      color: sub.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {sub.icon}
                  </div>
                  <span
                    className="gf-subject-name"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1e293b",
                      width: "36%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {sub.name}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      background: "#f1f5f9",
                      borderRadius: 99,
                      overflow: "hidden",
                      minWidth: 40,
                    }}
                  >
                    <div
                      style={{
                        width: `${(sub.score / 10) * 100}%`,
                        height: "100%",
                        background: sub.color,
                        borderRadius: 99,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: "#0f172a",
                      width: 44,
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {sub.score}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: "#94a3b8",
                      }}
                    >
                      /10
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 4: QUICK ACTIONS & RECENT ACADEMIC ACTIVITY
        ══════════════════════════════════════════════════════════ */}
        <section
          id="quick-actions-section"
          className="gf-row-split"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          {/* Left: Quick Actions (Desktop only) */}
          <div className="gf-desktop-quick-wrapper">
            {renderQuickActionsCard(false)}
          </div>

          {/* Right: Recent Academic Activity */}
          <div
            className="gf-content-card"
            style={{
              background: "#ffffff",
              border: "1px solid #f1f5f9",
              borderRadius: 18,
              padding: "22px 24px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  Recent Academic Activity
                </h3>
                {!currentRegNo && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#64748b",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    Sample Feed
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleDashboardAction}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                }}
              >
                View All
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {RECENT_ACTIVITIES.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom:
                      idx === RECENT_ACTIVITIES.length - 1
                        ? "none"
                        : "1px solid #f8fafc",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: item.bg,
                        color: item.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#94a3b8",
                          marginTop: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: item.tagColor,
                      background: item.tagBg,
                      padding: "3px 10px",
                      borderRadius: 99,
                      flexShrink: 0,
                    }}
                  >
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 5: CTA BANNER
        ══════════════════════════════════════════════════════════ */}
        <section
          className="gf-cta-grid"
          style={{
            background:
              "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 45%, #dbeafe 100%)",
            borderRadius: 20,
            padding: "36px 40px",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            alignItems: "center",
            gap: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Left CTA Text */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2
              className="gf-cta-title"
              style={{
                fontSize: "clamp(22px, 2.5vw, 30px)",
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.5px",
                lineHeight: 1.25,
              }}
            >
              Your academic success, our mission.
            </h2>
            <p
              style={{
                fontSize: 14.5,
                color: "#475569",
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              Make smarter decisions, track progress, and achieve excellence
              with GradeFlow.
            </p>
            <div style={{ marginTop: 6 }}>
              <button
                onClick={handleDashboardAction}
                className="gf-cta-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 10,
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.16)",
                  transition: "background 0.2s",
                  minHeight: 46,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1e293b")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#0f172a")
                }
              >
                Get Started Now <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right Graphic Badge */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "rgba(255, 255, 255, 0.85)",
                padding: "20px 24px",
                borderRadius: 18,
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 24px rgba(37, 99, 235, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.7)",
                width: "100%",
                maxWidth: 380,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "#ffffff",
                  border: "1px solid #dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(37, 99, 235, 0.12)",
                  flexShrink: 0,
                  padding: 6,
                  boxSizing: "border-box",
                }}
              >
                <img src="/webisteLogo.png" alt="GradeFlow" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    color: "#16a34a",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={14} /> Analytics Verified
                </div>
                <div
                  style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}
                >
                  Centurion University
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b" }}>
                  Official Grading Algorithms
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 6: ULTRA-CLEAN MODERN FOOTER
        ══════════════════════════════════════════════════════════ */}
        <footer
          className="gf-modern-footer"
          style={{
            borderTop: "1px solid #f1f5f9",
            paddingTop: 36,
            display: "flex",
            flexDirection: "column",
            gap: 28,
            width: "100%",
          }}
        >
          {/* Top Brand Strip with Trust Badges */}
          <div
            className="gf-footer-brand-strip"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
              paddingBottom: 22,
              borderBottom: "1px solid #f1f5f9",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Logo + Tagline */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxWidth: 460,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src="/webisteLogo.png"
                  alt="GradeFlow Logo"
                  style={{
                    height: 32,
                    width: "auto",
                    maxHeight: 36,
                    objectFit: "contain",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 21,
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.5px",
                  }}
                >
                  GradeFlow
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Institutional-grade academic analytics & GPA intelligence
                designed for university students.
              </p>
            </div>

            {/* Quick Live Status Pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 99,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: "#334155",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 0 3px rgba(34, 197, 94, 0.2)",
                  display: "inline-block",
                }}
              />
              <span>Live Academic Portal</span>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <span style={{ color: "#64748b" }}>10k+ Records</span>
            </div>
          </div>

          {/* Main Footer Links & Newsletter Grid */}
          <div
            className="gf-footer-content-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1.1fr 1.1fr 1.5fr",
              gap: 28,
              alignItems: "start",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Column 1: Product & Tools */}
            <div
              className="gf-footer-col"
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 4,
                    height: 12,
                    background: "#2563eb",
                    borderRadius: 2,
                  }}
                />
                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Product
                </h4>
              </div>
              <div
                className="gf-footer-link-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                <span
                  className="gf-footer-link"
                  onClick={handleDashboardAction}
                >
                  Student Dashboard
                </span>
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/resources")}
                >
                  SGPA / CGPA Calculators
                </span>
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/leaderboard")}
                >
                  University Rankings
                </span>
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/analytics")}
                >
                  Performance Analytics
                </span>
              </div>
            </div>

            {/* Column 2: Resources */}
            <div
              className="gf-footer-col"
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 4,
                    height: 12,
                    background: "#10b981",
                    borderRadius: 2,
                  }}
                />
                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Resources
                </h4>
              </div>
              <div
                className="gf-footer-link-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/resources?tab=grading-scale")}
                >
                  Grading Guidelines
                </span>
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/resources?tab=all-overview")}
                >
                  Credit System
                </span>
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/resources?tab=academic-health")}
                >
                  Academic Health
                </span>
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/resources?tab=help-faq")}
                >
                  Help & FAQ
                </span>
              </div>
            </div>

            {/* Column 3: Developer */}
            <div
              className="gf-footer-col"
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 4,
                    height: 12,
                    background: "#8b5cf6",
                    borderRadius: 2,
                  }}
                />
                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Developer
                </h4>
              </div>
              <div
                className="gf-footer-link-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/about-dev")}
                >
                  About the Creator
                </span>
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/testimonials")}
                >
                  Student Reviews
                </span>
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/testimonials")}
                >
                  Submit Feedback
                </span>
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/admin")}
                >
                  Admin Console
                </span>
              </div>
            </div>

            {/* Column 4: Newsletter & Stay Connected Card */}
            <div
              className="gf-footer-newsletter-card"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "18px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Mail size={14} />
                </div>
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  Stay Connected
                </h4>
              </div>

              <p
                style={{
                  fontSize: 12.5,
                  color: "#64748b",
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                Get exam alerts, result updates & GPA calculation tips.
              </p>

              <form
                onSubmit={handleSubscribe}
                style={{ position: "relative", width: "100%" }}
              >
                <input
                  type="email"
                  value={emailSub}
                  onChange={(e) => setEmailSub(e.target.value)}
                  placeholder="registration_no@centurionuniv.edu.in"
                  style={{
                    width: "100%",
                    padding: "9px 38px 9px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 12.5,
                    color: "#0f172a",
                    outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    boxSizing: "border-box",
                    background: "#fcfdfe",
                  }}
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  style={{
                    position: "absolute",
                    right: 4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 7,
                    width: 28,
                    height: 28,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowRight size={14} />
                </button>
              </form>
              {subscribed && (
                <span
                  style={{
                    fontSize: 11.5,
                    color: "#16a34a",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <CheckCircle2 size={13} color="#16a34a" />
                  <span>Subscribed successfully!</span>
                </span>
              )}

              {/* Social links row */}
              <div
                className="gf-footer-social-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 2,
                }}
              >
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="gf-social-icon"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "#f1f5f9",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                >
                  <TwitterIcon size={15} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="gf-social-icon"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "#f1f5f9",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                >
                  <LinkedinIcon size={15} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="gf-social-icon"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "#f1f5f9",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                >
                  <InstagramIcon size={15} />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="gf-social-icon"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "#f1f5f9",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                >
                  <GithubIcon size={15} />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright and Legal Bar */}
          <div
            className="gf-footer-bottom-bar"
            style={{
              borderTop: "1px solid #f1f5f9",
              paddingTop: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 12,
              color: "#94a3b8",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div>
              © 2026 GradeFlow. Built for Centurion University students.
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
              <span
                className="gf-legal-link"
                onClick={() => navigate("/resources")}
              >
                Privacy
              </span>
              <span>•</span>
              <span
                className="gf-legal-link"
                onClick={() => navigate("/resources")}
              >
                Terms
              </span>
              <span>•</span>
              <span
                className="gf-legal-link"
                onClick={() => navigate("/about-dev")}
              >
                Developer
              </span>
              <span>•</span>
              <span
                className="gf-legal-link"
                onClick={() => navigate("/admin")}
              >
                Admin
              </span>
            </div>
          </div>
        </footer>
      </div>
      )}

      {/* ── Mobile & Tablet Responsive Media Queries ── */}
      <style>{`
        .gf-footer-link {
          cursor: pointer;
          transition: color 0.15s ease, transform 0.15s ease;
          display: inline-block;
          padding: 2px 0;
        }
        .gf-footer-link:hover {
          color: #2563eb !important;
          transform: translateX(2px);
        }
        .gf-legal-link {
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .gf-legal-link:hover {
          color: #2563eb !important;
        }
        .gf-social-icon:hover {
          background: #eff6ff !important;
          color: #2563eb !important;
          transform: translateY(-2px);
        }

        @media (max-width: 1080px) {
          .gf-home-container {
            padding: 28px 20px 50px !important;
            gap: 30px !important;
          }
          .gf-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .gf-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 14px !important;
          }
          .gf-row-split {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
          .gf-cta-grid {
            grid-template-columns: 1fr !important;
            padding: 28px 24px !important;
            gap: 20px !important;
            text-align: center;
          }
          .gf-cta-grid > div:first-child {
            align-items: center;
          }
          .gf-footer-content-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 24px !important;
          }
        }

        .gf-mobile-quick-wrapper {
          display: none;
        }
        .gf-desktop-quick-wrapper {
          display: block;
        }

        @media (max-width: 768px) {
          .gf-mobile-quick-wrapper {
            display: block !important;
            width: 100% !important;
          }
          .gf-desktop-quick-wrapper {
            display: none !important;
          }
          .gf-home-container {
            padding: 18px 14px 44px !important;
            gap: 24px !important;
          }
          .gf-hero-title {
            font-size: clamp(25px, 4.4vw, 34px) !important;
            line-height: 1.22 !important;
            letter-spacing: -0.8px !important;
          }
          .gf-mockup-card {
            transform: none !important;
            border-radius: 16px !important;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
          }
          .gf-mockup-content {
            padding: 14px 12px !important;
            gap: 12px !important;
          }
          .gf-mockup-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .gf-mockup-charts-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .gf-content-card {
            padding: 18px 16px !important;
            border-radius: 16px !important;
          }
          .gf-stat-card {
            padding: 14px 14px !important;
            border-radius: 14px !important;
          }
          .gf-main-chart-wrap {
            height: 200px !important;
          }
          /* 2-column clean link matrix on tablet */
          .gf-footer-content-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 20px 16px !important;
          }
          .gf-footer-newsletter-card {
            grid-column: 1 / -1 !important;
            margin-top: 4px !important;
          }
        }

        @media (max-width: 540px) {
          .gf-home-container {
            padding: 14px 12px 36px !important;
            gap: 20px !important;
          }
          .gf-hero-title {
            font-size: clamp(23.5px, 6.2vw, 27.5px) !important;
            line-height: 1.24 !important;
            letter-spacing: -0.6px !important;
          }
          .gf-hero-subtitle {
            font-size: 13.5px !important;
            line-height: 1.55 !important;
            color: #64748b !important;
            margin: 0 !important;
          }
          .gf-hero-actions {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 8px !important;
            width: 100% !important;
            flex-wrap: wrap !important;
            margin-top: 4px !important;
          }
          .gf-btn-primary {
            width: auto !important;
            flex: 1 1 auto !important;
            max-width: fit-content !important;
            min-height: 38px !important;
            height: 38px !important;
            padding: 0 16px !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            border-radius: 9px !important;
            box-sizing: border-box !important;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.22) !important;
          }
          .gf-btn-secondary {
            width: auto !important;
            flex: 1 1 auto !important;
            max-width: fit-content !important;
            min-height: 38px !important;
            height: 38px !important;
            padding: 0 14px !important;
            font-size: 12.5px !important;
            font-weight: 600 !important;
            border-radius: 9px !important;
            box-sizing: border-box !important;
          }
          .gf-trust-badge {
            padding: 4px 10px 4px 6px !important;
            margin-top: 2px !important;
            gap: 8px !important;
          }
          .gf-trust-avatar {
            width: 22px !important;
            height: 22px !important;
            font-size: 9px !important;
            margin-left: -6px !important;
          }
          .gf-trust-avatar:first-child {
            margin-left: 0 !important;
          }
          .gf-trust-text {
            font-size: 11px !important;
          }
          .gf-mockup-card {
            grid-template-columns: 1fr !important;
          }
          .gf-mockup-sidebar {
            display: none !important;
          }
          .gf-subject-name {
            width: 32% !important;
            font-size: 12px !important;
          }
          .gf-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .gf-stat-card {
            padding: 11px 10px !important;
            gap: 8px !important;
            border-radius: 12px !important;
          }
          .gf-stat-card > div:first-child {
            width: 36px !important;
            height: 36px !important;
            border-radius: 10px !important;
          }
          .gf-stat-card > div:last-child > div:nth-child(2) {
            font-size: 18px !important;
            font-weight: 800 !important;
          }
          .gf-content-card {
            padding: 14px 12px !important;
            border-radius: 14px !important;
          }
          .gf-quick-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          .gf-quick-btn {
            padding: 10px 4px !important;
            font-size: 11px !important;
            border-radius: 10px !important;
          }
          .gf-cta-btn {
            min-height: 42px !important;
            height: 42px !important;
            padding: 0 18px !important;
            font-size: 13.5px !important;
            border-radius: 10px !important;
            width: 100% !important;
          }
          .gf-footer-brand-strip {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .gf-footer-content-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 18px 12px !important;
          }
          .gf-footer-col:nth-child(3) {
            grid-column: 1 / -1 !important;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 14px;
          }
          .gf-footer-col:nth-child(3) .gf-footer-link-list {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px 10px !important;
          }
          .gf-footer-social-row {
            justify-content: center !important;
          }
          .gf-footer-bottom-bar {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
