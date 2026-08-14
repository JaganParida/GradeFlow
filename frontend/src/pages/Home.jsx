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
  Sparkles,
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
    hash: "",
  },
  {
    label: "Calculate CGPA",
    icon: <BarChart2 size={20} color="#10b981" />,
    bg: "#ecfdf5",
    to: "/resources",
    hash: "",
  },
  {
    label: "What-If Simulator",
    icon: <Sliders size={20} color="#8b5cf6" />,
    bg: "#f5f3ff",
    to: "/analytics",
    hash: "#whatif",
  },
  {
    label: "GPA Predictor",
    icon: <Target size={20} color="#f59e0b" />,
    bg: "#fffbeb",
    to: "/analytics",
    hash: "#predictor",
  },
  {
    label: "Placement Insights",
    icon: <Briefcase size={20} color="#06b6d4" />,
    bg: "#ecfeff",
    to: "/analytics",
    hash: "#placement",
  },
  {
    label: "Compare Scores",
    icon: <GitCompare size={20} color="#ec4899" />,
    bg: "#fdf2f8",
    to: "/analytics",
    hash: "#trajectory",
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
  const { studentData, hasActiveSession, fetchStudent } = useApp();
  const [emailSub, setEmailSub] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAuthPromptModal, setShowAuthPromptModal] = useState(false);
  const [searchRegInput, setSearchRegInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentRegNo =
    studentData?.regNo || sessionStorage.getItem("last_regNo") || localStorage.getItem("last_regNo") || "";

  const handleDashboardAction = () => {
    if (currentRegNo) {
      navigate(`/dashboard/${encodeStudentId(currentRegNo)}`);
    } else {
      setShowAuthPromptModal(true);
    }
  };

  const handleQuickAction = (act) => {
    if (act.to.startsWith("/analytics")) {
      if (currentRegNo) {
        navigate(`/analytics/${encodeStudentId(currentRegNo)}${act.hash || ""}`);
      } else {
        setShowAuthPromptModal(true);
      }
    } else if (act.to.startsWith("/dashboard")) {
      handleDashboardAction();
    } else {
      navigate(act.to);
    }
  };

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
        navigate(`/dashboard/${encodeStudentId(cleanReg)}`);
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
      {/* ── Main Container ─────────────────────────────────────── */}
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
            gridTemplateColumns: "1fr 1.22fr",
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
                fontSize: "clamp(28px, 3.8vw, 48px)",
                fontWeight: 800,
                lineHeight: 1.18,
                color: "#0f172a",
                letterSpacing: "-1.1px",
                margin: 0,
              }}
            >
              <span>Track Every <span style={{ color: "#2563eb" }}>Grade</span></span>
              <br />
              <span>Own Your <span style={{ color: "#2563eb" }}>Academic Future</span></span>
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
                onClick={() => {
                  const el = document.getElementById("quick-actions-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
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
                Explore Features <span style={{ fontSize: 12 }}>▷</span>
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
                  style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}
                >
                  <strong style={{ color: "#0f172a", fontWeight: 800 }}>
                    1000+
                  </strong>{" "}
                  students used
                </span>
              </div>
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
                        <Sparkles size={14} color="#2563eb" />
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
              <Sparkles size={18} color="#93c5fd" />
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
              Enter your registration number to load your official results and
              rank.
            </p>
            <button
              onClick={() => {
                setShowSearchModal(true);
                setSearchError("");
                setSearchRegInput("");
              }}
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
              <Search size={15} /> Search Your Registration Number
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
                onClick={() => navigate("/resources")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
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
          {/* Left: Quick Actions (3x2 Grid) */}
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
            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 16px 0",
              }}
            >
              Quick Actions
            </h3>

            <div
              className="gf-quick-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
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
                    padding: "16px 8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
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
                      width: 40,
                      height: 40,
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
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#334155",
                      textAlign: "center",
                      lineHeight: 1.25,
                    }}
                  >
                    {act.label}
                  </span>
                </div>
              ))}
            </div>
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
                onClick={() => navigate("/resources")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
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
                  background: "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(37, 99, 235, 0.25)",
                  flexShrink: 0,
                }}
              >
                <GraduationCap size={28} />
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 3,
                    height: 20,
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 9,
                      background: "#3b82f6",
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      width: 4,
                      height: 14,
                      background: "#2563eb",
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      width: 4,
                      height: 20,
                      background: "#1e3a8a",
                      borderRadius: 2,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 19,
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
                  onClick={() => navigate("/resources")}
                >
                  Grading Guidelines
                </span>
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/resources")}
                >
                  Credit System
                </span>
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/resources")}
                >
                  Placement Cutoffs
                </span>
                <span
                  className="gf-footer-link"
                  onClick={() => navigate("/resources")}
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

        @media (max-width: 768px) {
          .gf-home-container {
            padding: 16px 14px 44px !important;
            gap: 24px !important;
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
            padding: 12px 12px 36px !important;
            gap: 20px !important;
          }
          .gf-hero-actions {
            flex-direction: column !important;
            width: 100% !important;
          }
          .gf-btn-primary, .gf-btn-secondary, .gf-cta-btn {
            width: 100% !important;
            box-sizing: border-box !important;
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
            gap: 10px !important;
          }
          .gf-stat-card {
            padding: 12px 10px !important;
            gap: 10px !important;
          }
          .gf-stat-card > div:first-child {
            width: 38px !important;
            height: 38px !important;
          }
          .gf-stat-card > div:last-child > div:nth-child(2) {
            font-size: 20px !important;
          }
          .gf-quick-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          .gf-quick-btn {
            padding: 12px 4px !important;
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

      {/* ── Search Required Modal ── */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSearchModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.55)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: "26px 22px",
                maxWidth: 420,
                width: "100%",
                textAlign: "center",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
                border: "1px solid #e2e8f0",
                position: "relative",
                boxSizing: "border-box",
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowSearchModal(false)}
                aria-label="Close search modal"
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
              >
                <X size={16} />
              </button>

              {/* Icon */}
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px auto",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.12)",
                }}
              >
                <GraduationCap size={24} />
              </div>

              <h3
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 6px 0",
                  letterSpacing: "-0.4px",
                }}
              >
                Registration Number Required
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  margin: "0 0 20px 0",
                  lineHeight: 1.5,
                }}
              >
                Please enter your university registration number to access your student dashboard.
              </p>

              {/* Form */}
              <form onSubmit={handleSearchModalSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ position: "relative", width: "100%" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={searchRegInput}
                    onChange={(e) => {
                      setSearchRegInput(e.target.value);
                      if (searchError) setSearchError("");
                    }}
                    placeholder="e.g. 230301120000"
                    style={{
                      width: "100%",
                      padding: "11px 12px 11px 38px",
                      borderRadius: 10,
                      border: searchError ? "1px solid #ef4444" : "1px solid #cbd5e1",
                      background: "#f8fafc",
                      color: "#0f172a",
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "'Space Mono', monospace",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.15s ease",
                    }}
                    onFocus={(e) => (e.currentTarget.style.background = "#ffffff")}
                    onBlur={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  />
                </div>

                {/* Error Notice */}
                {searchError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "#fef2f2",
                      border: "1px solid #fee2e2",
                      color: "#b91c1c",
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: "left",
                    }}
                  >
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{searchError}</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setShowSearchModal(false)}
                    style={{
                      flex: 1,
                      padding: "11px 14px",
                      borderRadius: 10,
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      fontWeight: 700,
                      fontSize: 13.5,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSearching}
                    style={{
                      flex: 1.5,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "11px 14px",
                      borderRadius: 10,
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 700,
                      fontSize: 13.5,
                      cursor: isSearching ? "not-allowed" : "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSearching) e.currentTarget.style.background = "#1d4ed8";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSearching) e.currentTarget.style.background = "#2563eb";
                    }}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <span>View Dashboard</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Prompt Modal (Registration Number Required) */}
      <AnimatePresence>
        {showAuthPromptModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuthPromptModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: "26px 22px",
                maxWidth: 400,
                width: "100%",
                textAlign: "center",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                }}
              >
                <Search size={20} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                Registration Number Required
              </h3>
              <p style={{ fontSize: 12.5, color: "#64748b", marginBottom: 18, lineHeight: 1.5 }}>
                Please enter your registration number to continue.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAuthPromptModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 10,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthPromptModal(false);
                    setShowSearchModal(true);
                    setSearchError("");
                    setSearchRegInput("");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 10,
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1e293b")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#0f172a")}
                >
                  Search Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
