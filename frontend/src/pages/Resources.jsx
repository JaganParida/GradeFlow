import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ResourcesSkeleton } from "../components/LoadingSpinner";
import ModernMobileSubNav from "../components/ModernMobileSubNav";
import {
  Calculator,
  BarChart2,
  FileText,
  HelpCircle,
  TrendingUp,
  Award,
  Layers,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Scale,
  Calendar,
  BookOpen,
  ArrowRight,
  Info,
  Network,
  Star,
  Activity,
  Crown,
  Medal,
  Trophy,
  Target,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Zap,
  AlertTriangle,
  GitCompare,
  Search,
  Sliders,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ─── Fraction component ─────────────────────────────────────── */
function Fraction({ num, den }) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        lineHeight: 1.15,
        verticalAlign: "middle",
        margin: "0 6px",
      }}
    >
      <span style={{ borderBottom: "1.5px solid currentColor", paddingBottom: 2, whiteSpace: "nowrap", fontSize: "0.95em", fontWeight: 700 }}>
        {num}
      </span>
      <span style={{ paddingTop: 2, whiteSpace: "nowrap", fontSize: "0.95em", fontWeight: 700 }}>
        {den}
      </span>
    </span>
  );
}

/* ─── Data Constants ─────────────────────────────────────────── */
const GRADE_SCALE = [
  { grade: "O", qual: "Outstanding", range: "90 & above", pts: 10, bg: "#fed7aa", color: "#c2410c", counted: true, desc: "Exceptional mastery of course content." },
  { grade: "E", qual: "Excellent", range: "80 – 89", pts: 9, bg: "#bbf7d0", color: "#15803d", counted: true, desc: "High standard of course knowledge." },
  { grade: "A", qual: "Very Good", range: "70 – 79", pts: 8, bg: "#bfdbfe", color: "#1d4ed8", counted: true, desc: "Consistent and strong academic performance." },
  { grade: "B", qual: "Good", range: "60 – 69", pts: 7, bg: "#e9d5ff", color: "#7e22ce", counted: true, desc: "Above average understanding and clarity." },
  { grade: "C", qual: "Fair (Average)", range: "50 – 59", pts: 6, bg: "#fed7aa", color: "#c2410c", counted: true, desc: "Meets standard course clearance requirements." },
  { grade: "D", qual: "Pass (Theory)", range: "40 – 49", pts: 5, bg: "#e2e8f0", color: "#475569", counted: true, desc: "Minimum passing grade for theory courses." },
  { grade: "F", qual: "Failed", range: "Below 40", pts: 2, bg: "#fecaca", color: "#b91c1c", counted: true, desc: "Course not cleared; contributes 2 pts in GPA denominator." },
  { grade: "R", qual: "Repeat / Retake", range: "Non-Clearance", pts: 0, bg: "#fed7aa", color: "#c2410c", counted: true, desc: "Mandatory repeat course required." },
  { grade: "M", qual: "Malpractice", range: "—", pts: 0, bg: "#e2e8f0", color: "#475569", counted: true, desc: "Disciplinary hold; carries 0 pts in GPA." },
  { grade: "S", qual: "Absent", range: "—", pts: 0, bg: "#e2e8f0", color: "#475569", counted: true, desc: "Recorded absent in examination." },
];

const ACADEMIC_HEALTH_SCALE = [
  { factor: "CGPA", desc: "Cumulative Grade Point Average", formula: "CGPA × 5", maxPts: 50, color: "#8b5cf6", icon: <GraduationCap size={16} /> },
  { factor: "Latest SGPA", desc: "Semester Grade Point Average", formula: "SGPA × 2", maxPts: 20, color: "#2563eb", icon: <TrendingUp size={16} /> },
  { factor: "Backlogs", desc: "Active Uncleared Subjects", formula: "20 - (Count × 5)", maxPts: 20, color: "#ef4444", icon: <AlertTriangle size={16} /> },
  { factor: "Participation", desc: "Attempted at least 1 subject", formula: "Flat 10 pts", maxPts: 10, color: "#10b981", icon: <CheckCircle2 size={16} /> },
];

const BADGES_SCALE = [
  { name: "9+ CGPA Elite", desc: "Outstanding Academic Record", criteria: "CGPA ≥ 9.0", icon: <Crown size={18} color="#ef4444" />, bg: "#fee2e2", label: "Crown", color: "#dc2626", tier: "Legendary" },
  { name: "Academic Excellence", desc: "Stellar Semester Performance", criteria: "Latest SGPA ≥ 9.0", icon: <Star size={18} color="#f59e0b" />, bg: "#fef3c7", label: "Star", color: "#d97706", tier: "Gold" },
  { name: "Consistent Performer", desc: "Maintained High CGPA", criteria: "CGPA ≥ 8.5", icon: <Target size={18} color="#2563eb" />, bg: "#dbeafe", label: "Target", color: "#1d4ed8", tier: "Silver" },
  { name: "No Backlog Champion", desc: "Cleared All Subjects", criteria: "Active Backlogs = 0", icon: <CheckCircle2 size={18} color="#10b981" />, bg: "#dcfce7", label: "Check", color: "#15803d", tier: "Gold" },
  { name: "Top Ranker", desc: "University Top 10", criteria: "Rank ≤ 10", icon: <Trophy size={18} color="#8b5cf6" />, bg: "#f3e8ff", label: "Trophy", color: "#7e22ce", tier: "Diamond" },
  { name: "Perfect SGPA", desc: "Flawless Semester", criteria: "Latest SGPA = 10", icon: <Award size={18} color="#f97316" />, bg: "#ffedd5", label: "Award", color: "#c2410c", tier: "Mythic" },
];

const EXAMPLE_CALC_ROWS = [
  { course: "Data Structures", credit: 4, grade: "A", gp: 8, total: 32 },
  { course: "Database Mgmt. Systems", credit: 4, grade: "A+", gp: 9, total: 36 },
  { course: "Operating Systems", credit: 3, grade: "B+", gp: 7, total: 21 },
  { course: "Computer Networks", credit: 3, grade: "A", gp: 8, total: 24 },
  { course: "Software Engineering", credit: 4, grade: "A+", gp: 9, total: 36 },
];

const ALL_RESOURCE_TABS = [
  { id: "all-overview", label: "Overview & Formulas", shortLabel: "Overview", icon: <Calculator size={16} />, desc: "How SGPA & CGPA are officially calculated" },
  { id: "grading-scale", label: "Grading Scale", shortLabel: "Grading Scale", icon: <Star size={16} />, desc: "Grade point scale & cutoff guidelines" },
  { id: "academic-health", label: "Academic Health", shortLabel: "Academic Health", icon: <Activity size={16} />, desc: "Performance index & risk assessment" },
  { id: "badges-tab", label: "Badges & Achievements", shortLabel: "Badges", icon: <Medal size={16} />, desc: "Milestones, badges & scholar awards" },
  { id: "sgpa-calc", label: "SGPA Calculator", shortLabel: "SGPA Calc", icon: <Calculator size={16} />, desc: "Interactive semester GPA simulator" },
  { id: "cgpa-calc", label: "CGPA Calculator", shortLabel: "CGPA Calc", icon: <BarChart2 size={16} />, desc: "Multi-semester cumulative GPA calculator" },
  { id: "target-predictor", label: "Target GPA Predictor", shortLabel: "Goal Predictor", icon: <Target size={16} />, desc: "Forecast future semester target requirements" },
  { id: "academic-report", label: "Academic Report", shortLabel: "Report Card", icon: <FileText size={16} />, desc: "Summary sheet & official ledger overview" },
  { id: "help-faq", label: "Help & FAQ", shortLabel: "Help & FAQ", icon: <HelpCircle size={16} />, desc: "Frequently asked questions & student guide" },
];

const resolveResourceTab = (raw) => {
  if (!raw) return "all-overview";
  const clean = String(raw).replace("#", "").toLowerCase().trim();
  if (clean === "sgpa" || clean === "sgpa-calc" || clean === "calculatesgpa" || clean === "calculate-sgpa") return "sgpa-calc";
  if (clean === "cgpa" || clean === "cgpa-calc" || clean === "calculatecgpa" || clean === "calculate-cgpa") return "cgpa-calc";
  if (clean === "target-predictor" || clean === "predictor" || clean === "gpapredictor" || clean === "gpa-predictor" || clean === "goal") return "target-predictor";
  if (clean === "grading-scale" || clean === "grades" || clean === "scale") return "grading-scale";
  if (clean === "academic-health" || clean === "health") return "academic-health";
  if (clean === "badges-tab" || clean === "badges" || clean === "achievements") return "badges-tab";
  if (clean === "academic-report" || clean === "report") return "academic-report";
  if (clean === "help-faq" || clean === "faq" || clean === "help") return "help-faq";
  if (clean === "all-overview" || clean === "overview") return "all-overview";
  return "all-overview";
};

export default function Resources() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("tab");
    const fromHash = window.location.hash.replace("#", "");
    return resolveResourceTab(fromQuery || fromHash);
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sync tab with URL searchParams or hash whenever location changes
  useEffect(() => {
    const fromQuery = searchParams.get("tab");
    const fromHash = location.hash ? location.hash.replace("#", "") : "";
    const resolved = resolveResourceTab(fromQuery || fromHash);
    if (resolved && resolved !== activeTab) {
      setActiveTab(resolved);
    }
  }, [searchParams, location.search, location.hash]);

  const [openFaq, setOpenFaq] = useState(null);
  const [gradeSearch, setGradeSearch] = useState("");
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1100 : false));
  const mobileTabsRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1100);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const checkScroll = () => {
    if (!mobileTabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = mobileTabsRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  const scrollTabs = (direction) => {
    if (!mobileTabsRef.current) return;
    const offset = direction === "left" ? -180 : 180;
    mobileTabsRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  // Interactive SGPA Calculator State
  const [sgpaSubjects, setSgpaSubjects] = useState([
    { name: "Data Structures", credit: 4, grade: "A" },
    { name: "Operating Systems", credit: 3, grade: "E" },
    { name: "Database Systems", credit: 4, grade: "O" },
    { name: "Computer Networks", credit: 3, grade: "B" },
    { name: "Software Engineering", credit: 4, grade: "E" },
  ]);

  // Interactive CGPA Calculator State
  const [cgpaSemesters, setCgpaSemesters] = useState([
    { sem: "Semester 1", credits: 22, sgpa: 8.4 },
    { sem: "Semester 2", credits: 24, sgpa: 8.8 },
    { sem: "Semester 3", credits: 22, sgpa: 9.1 },
    { sem: "Semester 4", credits: 20, sgpa: 9.0 },
  ]);

  // Interactive Health Scorer State
  const [healthCgpa, setHealthCgpa] = useState(8.72);
  const [healthSgpa, setHealthSgpa] = useState(9.1);
  const [healthBacklogs, setHealthBacklogs] = useState(0);

  // Target GPA Predictor State
  const [targetCgpaGoal, setTargetCgpaGoal] = useState(9.0);
  const [completedCredits, setCompletedCredits] = useState(88);
  const [currentCgpaInput, setCurrentCgpaInput] = useState(8.65);
  const [nextSemCredits, setNextSemCredits] = useState(22);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const gradeToPointsMap = { O: 10, E: 9, "A+": 9, A: 8, "B+": 7, B: 7, C: 6, D: 5, F: 2, R: 0, M: 0, S: 0 };

  // Calculate live SGPA
  const calculatedSgpa = () => {
    let totalCredits = 0;
    let creditsCleared = 0;
    let totalPoints = 0;
    sgpaSubjects.forEach((sub) => {
      const cr = Number(sub.credit) || 0;
      const gp = gradeToPointsMap[sub.grade] ?? 0;
      totalCredits += cr;
      totalPoints += cr * gp;
      if (!["F", "R", "S", "M"].includes(String(sub.grade || "").trim().toUpperCase())) {
        creditsCleared += cr;
      }
    });
    const divisor = creditsCleared > 0 ? creditsCleared : totalCredits;
    return divisor > 0 ? (totalPoints / divisor).toFixed(2) : "0.00";
  };

  // Calculate live CGPA
  const calculatedCgpa = () => {
    let totalCredits = 0;
    let totalWeightedPoints = 0;
    cgpaSemesters.forEach((sem) => {
      const cr = Number(sem.credits) || 0;
      const sg = Number(sem.sgpa) || 0;
      totalCredits += cr;
      totalWeightedPoints += cr * sg;
    });
    return totalCredits > 0 ? (totalWeightedPoints / totalCredits).toFixed(2) : "0.00";
  };

  // Calculate live Health Score
  const calculateHealthScore = () => {
    const cgpaPt = Math.min(50, Math.max(0, healthCgpa * 5));
    const sgpaPt = Math.min(20, Math.max(0, healthSgpa * 2));
    const backlogPt = Math.max(0, 20 - healthBacklogs * 5);
    const partPt = 10;
    return Math.min(100, Math.round(cgpaPt + sgpaPt + backlogPt + partPt));
  };

  // Calculate Required Next SGPA
  const calculateRequiredSgpa = () => {
    const totalCurrentPoints = completedCredits * currentCgpaInput;
    const targetTotalCredits = completedCredits + nextSemCredits;
    const targetTotalPoints = targetTotalCredits * targetCgpaGoal;
    const neededPoints = targetTotalPoints - totalCurrentPoints;
    const req = neededPoints / nextSemCredits;
    return req.toFixed(2);
  };

  const faqs = [
    {
      q: "Is CGPA the same as percentage?",
      a: "No, CGPA is a weighted grade average on a 10-point scale. For Centurion University, percentage is standardly evaluated as Percentage = (CGPA - 0.5) × 10 or as defined in official grade transcripts.",
    },
    {
      q: "Are backlogs included in CGPA?",
      a: "Yes. Grade F carries 2 points, while R, S, and M carry 0 points. Because the registered subject credits are included in the denominator, backlogs pull down your overall CGPA until cleared in repeat/supplementary exams.",
    },
    {
      q: "What is a good CGPA?",
      a: "A CGPA above 8.0 is considered Very Good and satisfies eligibility for almost all top placement drives. A CGPA of 9.0+ places you in the university elite top rankers tier.",
    },
    {
      q: "Can CGPA decrease?",
      a: "Yes. If your current semester SGPA is lower than your previous cumulative CGPA, your cumulative CGPA will drop proportionally based on credit weight.",
    },
  ];

  const [gradeFilterCategory, setGradeFilterCategory] = useState("all");

  const filteredGrades = GRADE_SCALE.filter((g) => {
    const matchesSearch =
      g.grade.toLowerCase().includes(gradeSearch.toLowerCase()) ||
      g.qual.toLowerCase().includes(gradeSearch.toLowerCase()) ||
      g.desc.toLowerCase().includes(gradeSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (gradeFilterCategory === "pass") return g.pts >= 4;
    if (gradeFilterCategory === "backlog") return g.pts < 4;
    return true;
  });

  return (
    <div
      style={{
        background: "#fcfdfe",
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: isMobile ? 40 : 70,
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Modern Interactive Mobile Sub-Navigation */}
      {isMobile && (
        <div style={{ padding: "6px 12px 0 12px" }}>
          <ModernMobileSubNav
            items={ALL_RESOURCE_TABS}
            activeTab={activeTab}
            onChange={(newTab) => handleTabChange(newTab)}
            title="Resource Library"
            themeColor="#2563eb"
            themeBg="#eff6ff"
          />
        </div>
      )}

      {/* ── Main Page Layout ── */}
      <div
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          padding: isMobile ? "12px 10px 36px" : "24px 24px 70px",
          display: "grid",
          gridTemplateColumns: isMobile ? "100%" : "270px minmax(0, 1fr)",
          gap: isMobile ? 12 : 28,
          alignItems: "start",
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
        className="gf-resources-layout"
      >
        {/* ══════════════════════════════════════════════════════════
            LEFT SIDEBAR (Desktop Only)
        ══════════════════════════════════════════════════════════ */}
        {!isMobile && (
          <aside
            style={{
              position: isMobile ? "relative" : "sticky",
              top: isMobile ? "auto" : 20,
              alignSelf: "start",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              width: "100%",
              boxSizing: "border-box",
              margin: 0,
              padding: 0,
            }}
          >
            {/* Unified Left Sidebar Card Container */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                borderRadius: 20,
                padding: isMobile ? "20px 14px" : "28px 16px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: 18,
                boxSizing: "border-box",
                width: "100%",
                margin: 0,
              }}
            >
              {/* Group 1: ACADEMIC TOOLS */}
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: "#94a3b8",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    marginBottom: 8,
                    paddingLeft: 8,
                  }}
                >
                  Academic Tools
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[
                    { id: "all-overview", label: "How SGPA & CGPA\nAre Calculated", icon: <Calculator size={16} /> },
                    { id: "grading-scale", label: "Grading Scale", icon: <Star size={16} /> },
                    { id: "academic-health", label: "Academic Health", icon: <Activity size={16} /> },
                    { id: "badges-tab", label: "Badges & Achievements", icon: <Medal size={16} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: "none",
                        background: activeTab === tab.id ? "#eff6ff" : "transparent",
                        color: activeTab === tab.id ? "#2563eb" : "#475569",
                        fontSize: 13,
                        fontWeight: activeTab === tab.id ? 700 : 500,
                        cursor: "pointer",
                        textAlign: "left",
                        whiteSpace: "pre-line",
                        lineHeight: 1.35,
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== tab.id) {
                          e.currentTarget.style.background = "#f8fafc";
                          e.currentTarget.style.color = "#0f172a";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== tab.id) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#475569";
                        }
                      }}
                    >
                      <span style={{ color: activeTab === tab.id ? "#2563eb" : "#94a3b8" }}>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Group 2: QUICK ACTIONS */}
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: "#94a3b8",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    marginBottom: 8,
                    paddingLeft: 8,
                  }}
                >
                  Quick Actions
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[
                    { id: "sgpa-calc", label: "SGPA Calculator", icon: <Calculator size={16} /> },
                    { id: "cgpa-calc", label: "CGPA Calculator", icon: <BarChart2 size={16} /> },
                    { id: "target-predictor", label: "Target GPA Predictor", icon: <Target size={16} /> },
                    { id: "academic-report", label: "Academic Report", icon: <FileText size={16} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "none",
                        background: activeTab === tab.id ? "#eff6ff" : "transparent",
                        color: activeTab === tab.id ? "#2563eb" : "#475569",
                        fontSize: 13,
                        fontWeight: activeTab === tab.id ? 700 : 500,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== tab.id) {
                          e.currentTarget.style.background = "#f8fafc";
                          e.currentTarget.style.color = "#0f172a";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== tab.id) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#475569";
                        }
                      }}
                    >
                      <span style={{ color: activeTab === tab.id ? "#2563eb" : "#94a3b8" }}>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Group 3: OTHER */}
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: "#94a3b8",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    marginBottom: 8,
                    paddingLeft: 8,
                  }}
                >
                  Other
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button
                    onClick={() => handleTabChange("help-faq")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "none",
                      background: activeTab === "help-faq" ? "#eff6ff" : "transparent",
                      color: activeTab === "help-faq" ? "#2563eb" : "#475569",
                      fontSize: 13,
                      fontWeight: activeTab === "help-faq" ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== "help-faq") {
                        e.currentTarget.style.background = "#f8fafc";
                        e.currentTarget.style.color = "#0f172a";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== "help-faq") {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#475569";
                      }
                    }}
                  >
                    <HelpCircle size={16} color={activeTab === "help-faq" ? "#2563eb" : "#94a3b8"} />
                    <span>Help &amp; FAQ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Promo Card: Track. Analyze. Achieve. */}
            <div
              style={{
                background: "#f0f4ff",
                border: "1px solid #dbeafe",
                borderRadius: 18,
                padding: "18px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1e3a8a" }}>Track. Analyze. Achieve.</span>
              <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Make smarter academic decisions with GradeFlow.
              </p>

              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                <GraduationCap size={22} />
              </div>

              <button
                onClick={() => navigate("/")}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </aside>
        )}

        {/* ══════════════════════════════════════════════════════════
            MAIN CONTENT AREA (Smooth Animated Transitions)
        ══════════════════════════════════════════════════════════ */}
        <main style={{ alignSelf: "start", margin: 0, padding: 0, minHeight: "80vh", width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box", overflowX: "hidden" }}>
          <AnimatePresence mode="wait">
            {/* ────────────────────────────────────────────────────────
                VIEW: MASTER OVERVIEW (Spacious & Responsive Layout)
            ──────────────────────────────────────────────────────── */}
            {activeTab === "all-overview" && (
              <motion.div
                key="all-overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #f1f5f9",
                  borderRadius: isMobile ? 16 : 20,
                  padding: isMobile ? "20px 14px" : "28px 28px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? 18 : 24,
                  width: "100%",
                  boxSizing: "border-box",
                  margin: 0,
                }}
              >
                {/* Header Title with Verified Blue Badge */}
                <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: isMobile ? 2 : 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <h1 style={{ fontSize: isMobile ? 19 : "clamp(22px, 2.4vw, 28px)", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
                      How SGPA &amp; CGPA Are Calculated
                    </h1>
                    <CheckCircle2 size={18} color="#2563eb" fill="#dbeafe" />
                  </div>
                  <p style={{ fontSize: isMobile ? 12 : 13.5, color: "#64748b", margin: 0 }}>
                    Official formula used by Centurion University
                  </p>
                </div>

                {/* ── ROW 1: TWO FORMULA CARDS SIDE BY SIDE ─────────── */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: isMobile ? 10 : 20,
                  }}
                  className="gf-formula-row"
                >
                  {/* Left Card: SGPA */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: 16,
                      padding: isMobile ? "14px 14px" : "24px 26px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                      display: "flex",
                      flexDirection: "column",
                      gap: isMobile ? 10 : 14,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <BarChart2 size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#2563eb" }}>SGPA</div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>Semester Grade Point Average</div>
                      </div>
                    </div>

                    {/* Visual Formula Box */}
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 10,
                        padding: isMobile ? "10px 8px" : "16px 14px",
                        textAlign: "center",
                        fontFamily: "'Space Mono', monospace",
                        border: "1px solid #f1f5f9",
                        overflowX: "auto",
                      }}
                    >
                      <span style={{ fontSize: isMobile ? 11 : "clamp(11px, 1.4vw, 14px)", fontWeight: 700, color: "#0f172a" }}>
                        SGPA = <Fraction num="Σ (Credit × Grade Points)" den="Σ Total Credits" />
                      </span>
                    </div>

                    {/* Steps */}
                    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 6 : 8 }}>
                      {[
                        { num: "1", text: "Multiply each subject's credit by its grade point" },
                        { num: "2", text: "Sum all weighted values together" },
                        { num: "3", text: "Divide by total credits registered that semester" },
                        { num: "star", text: "All grades (incl. F=2, R=0, S=0, M=0) are counted", accent: true },
                      ].map((step, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: step.accent ? "#eff6ff" : "#dbeafe",
                              color: step.accent ? "#2563eb" : "#1d4ed8",
                              fontSize: 10,
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {step.num === "star" ? <CheckCircle2 size={10} /> : step.num}
                          </span>
                          <span style={{ fontSize: isMobile ? 11.5 : 13, color: step.accent ? "#2563eb" : "#475569", fontWeight: step.accent ? 700 : 500, lineHeight: 1.3 }}>
                            {step.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Card: CGPA */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: 16,
                      padding: isMobile ? "14px 14px" : "24px 26px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                      display: "flex",
                      flexDirection: "column",
                      gap: isMobile ? 10 : 14,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: "#f5f3ff",
                          color: "#8b5cf6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#8b5cf6" }}>CGPA</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>Cumulative Grade Point Average</div>
                      </div>
                    </div>

                    {/* Visual Formula Box */}
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 12,
                        padding: isMobile ? "14px 10px" : "18px 16px",
                        textAlign: "center",
                        fontFamily: "'Space Mono', monospace",
                        border: "1px solid #f1f5f9",
                        overflowX: "auto",
                      }}
                    >
                      <span style={{ fontSize: isMobile ? 11.5 : "clamp(11px, 1.4vw, 14px)", fontWeight: 700, color: "#0f172a" }}>
                        CGPA = <Fraction num="Σ (Sem SGPA × Sem Credits)" den="Σ Total Credits" />
                      </span>
                    </div>

                    {/* Steps */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { num: "1", text: "Calculate SGPA for each completed semester" },
                        { num: "2", text: "Multiply each SGPA by that semester's total credits" },
                        { num: "3", text: "Sum all products, then divide by cumulative credits" },
                        { num: "star", text: "Weighted average — more credits = more influence", accent: true },
                      ].map((step, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: step.accent ? "#f5f3ff" : "#ede9fe",
                              color: step.accent ? "#7c3aed" : "#6d28d9",
                              fontSize: 10.5,
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {step.num === "star" ? <CheckCircle2 size={11} /> : step.num}
                          </span>
                          <span style={{ fontSize: isMobile ? 12 : 13, color: step.accent ? "#7c3aed" : "#475569", fontWeight: step.accent ? 700 : 500, lineHeight: 1.35 }}>
                            {step.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── ROW 2: NOTE ON SIMPLE AVERAGING BANNER ─────────── */}
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 14,
                    padding: isMobile ? "12px 14px" : "14px 22px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    fontSize: isMobile ? 12 : 13,
                    color: "#92400e",
                    lineHeight: 1.45,
                  }}
                >
                  <Info size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong style={{ color: "#78350f" }}>Note on Simple Averaging:</strong> You can use <em>CGPA = Σ All SGPAs / Total Semesters</em> only when every semester has the exact same number of total credits. Otherwise the credit-weighted formula must be used.
                  </div>
                </div>

                {/* ── ROW 3: SYMMETRICAL 2-COLUMN GRID (Grading Scale & Academic Health) ── */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: isMobile ? 14 : 20,
                  }}
                  className="gf-row-split"
                >
                  {/* Card 1: Grading Scale Preview */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: isMobile ? 14 : 16,
                      padding: isMobile ? "16px 14px" : "22px 24px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 28, height: 28, borderRadius: 8, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Star size={16} />
                          </span>
                          <h3 style={{ fontSize: isMobile ? 15 : 16.5, fontWeight: 800, color: "#0f172a", margin: 0 }}>Grading Scale</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTabChange("grading-scale")}
                          style={{ background: "none", border: "none", color: "#2563eb", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          Full Scale <ArrowRight size={13} />
                        </button>
                      </div>
                      <p style={{ fontSize: isMobile ? 11.5 : 12.5, color: "#64748b", margin: "0 0 12px 0" }}>Standard university grade point mapping</p>

                      {isMobile ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))", gap: 6, width: "100%", boxSizing: "border-box" }}>
                          {GRADE_SCALE.slice(0, 6).map((g, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "6px 8px",
                                borderRadius: 8,
                                background: "#f8fafc",
                                border: "1px solid #edf2f7",
                                gap: 4,
                                minWidth: 0,
                                boxSizing: "border-box",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, overflow: "hidden" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 20,
                                    height: 20,
                                    lineHeight: "20px",
                                    textAlign: "center",
                                    borderRadius: 5,
                                    background: g.bg,
                                    color: g.color,
                                    fontWeight: 900,
                                    fontSize: 10.5,
                                    flexShrink: 0,
                                  }}
                                >
                                  {g.grade}
                                </span>
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {g.qual}
                                </span>
                              </div>
                              <span style={{ fontSize: 10.5, fontWeight: 800, color: g.color, fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>
                                {g.pts}p
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                            <thead>
                              <tr style={{ color: "#94a3b8", fontWeight: 700, borderBottom: "1px solid #f1f5f9" }}>
                                <th style={{ textAlign: "left", paddingBottom: 8 }}>GRADE</th>
                                <th style={{ textAlign: "left", paddingBottom: 8 }}>QUALIFICATION</th>
                                <th style={{ textAlign: "center", paddingBottom: 8 }}>POINTS</th>
                                <th style={{ textAlign: "center", paddingBottom: 8 }}>STATUS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {GRADE_SCALE.slice(0, 6).map((g, idx) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #fafafa" }}>
                                  <td style={{ padding: "7px 0" }}>
                                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 5, background: g.bg, color: g.color, fontWeight: 800, fontSize: 11.5 }}>
                                      {g.grade}
                                    </span>
                                  </td>
                                  <td style={{ padding: "7px 0", color: "#334155", fontWeight: 500 }}>{g.qual}</td>
                                  <td style={{ textAlign: "center", padding: "7px 0", fontWeight: 800, color: "#0f172a" }}>{g.pts}</td>
                                  <td style={{ textAlign: "center", padding: "7px 0", color: "#16a34a" }}>
                                    <Check size={13} color="#16a34a" style={{ display: "inline-block", verticalAlign: "middle" }} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 12, padding: "9px 12px", background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 8, fontSize: isMobile ? 11 : 12, color: "#1e40af", lineHeight: 1.4 }}>
                      <strong>Counted?</strong> — All grades contribute to total credits denominator.
                    </div>
                  </div>

                  {/* Card 2: Academic Health Preview */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: isMobile ? 14 : 16,
                      padding: isMobile ? "16px 14px" : "22px 24px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 28, height: 28, borderRadius: 8, background: "#f5f3ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Activity size={16} />
                          </span>
                          <h3 style={{ fontSize: isMobile ? 15 : 16.5, fontWeight: 800, color: "#0f172a", margin: 0 }}>Academic Health</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTabChange("academic-health")}
                          style={{ background: "none", border: "none", color: "#8b5cf6", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          Live Health Meter <ArrowRight size={13} />
                        </button>
                      </div>
                      <p style={{ fontSize: isMobile ? 11.5 : 12.5, color: "#64748b", margin: "0 0 12px 0" }}>Score calculation out of 100</p>

                      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 7 : 9 }}>
                        {ACADEMIC_HEALTH_SCALE.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: isMobile ? "8px 10px" : "10px 12px",
                              background: "#f8fafc",
                              borderRadius: 10,
                              border: "1px solid #edf2f7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                              <span
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 7,
                                  background: `${item.color}15`,
                                  color: item.color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {item.icon}
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: isMobile ? 12 : 12.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                                  {item.factor}
                                </div>
                                <div style={{ fontSize: isMobile ? 10 : 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {item.desc}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div
                                style={{
                                  fontSize: isMobile ? 11 : 12,
                                  fontWeight: 800,
                                  color: item.color,
                                  background: `${item.color}12`,
                                  padding: "2px 6px",
                                  borderRadius: 5,
                                  display: "inline-block",
                                }}
                              >
                                {item.maxPts} pts
                              </div>
                              <div style={{ fontSize: isMobile ? 9.5 : 10, fontFamily: "'Space Mono', monospace", color: "#64748b", marginTop: 2 }}>
                                {item.formula}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: 12, padding: "9px 12px", background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 8, fontSize: isMobile ? 11 : 12, color: "#6d28d9", lineHeight: 1.4 }}>
                      <strong>Total Score</strong> — Max 100 points, calculated and rounded to nearest whole number.
                    </div>
                  </div>
                </div>

                {/* ── ROW 4: BADGES & ACHIEVEMENTS SHOWCASE ─────────────── */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: isMobile ? 14 : 16,
                    padding: isMobile ? "16px 14px" : "22px 24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 28, height: 28, borderRadius: 8, background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Medal size={16} />
                      </span>
                      <div>
                        <h3 style={{ fontSize: isMobile ? 15 : 16.5, fontWeight: 800, color: "#0f172a", margin: 0 }}>Badges &amp; Achievements</h3>
                        <p style={{ fontSize: isMobile ? 11 : 12, color: "#64748b", margin: 0 }}>Criteria for unlocking profile badges</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabChange("badges-tab")}
                      style={{ background: "none", border: "none", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      All Badges <ArrowRight size={13} />
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: isMobile ? 8 : 12 }}>
                    {BADGES_SCALE.slice(0, 4).map((b, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: 8,
                          padding: isMobile ? "10px 10px" : "12px 14px",
                          borderRadius: 10,
                          background: "#f8fafc",
                          border: "1px solid #edf2f7",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                          <span style={{ width: 28, height: 28, borderRadius: 7, background: b.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {b.icon}
                          </span>
                          <span style={{ fontSize: 9.5, fontWeight: 800, color: b.color, background: `${b.color}15`, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>
                            {b.tier}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: isMobile ? 11.5 : 12.5, fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {b.name}
                          </div>
                          <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: b.color, fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                            {b.criteria}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: "9px 12px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, fontSize: isMobile ? 11 : 12, color: "#991b1b", lineHeight: 1.4 }}>
                    <strong>Profile Badges</strong> — Badges appear automatically on your dashboard when unlocked!
                  </div>
                </div>

                {/* ── ROW 5: EXAMPLE CALCULATION WALKTHROUGH ────────────── */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: isMobile ? 14 : 16,
                    padding: isMobile ? "16px 14px" : "22px 24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: "#ffedd5", color: "#f97316", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BarChart2 size={16} />
                    </span>
                    <div>
                      <h3 style={{ fontSize: isMobile ? 15 : 16.5, fontWeight: 800, color: "#0f172a", margin: 0 }}>Example Calculation Walkthrough</h3>
                      <p style={{ fontSize: isMobile ? 11 : 12, color: "#64748b", margin: 0 }}>Understanding SGPA calculation with a sample 5-course semester</p>
                    </div>
                  </div>

                  {isMobile ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, width: "100%", boxSizing: "border-box" }}>
                      {EXAMPLE_CALC_ROWS.slice(0, 5).map((row, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            background: "#f8fafc",
                            borderRadius: 8,
                            border: "1px solid #f1f5f9",
                            gap: 8,
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {row.course}
                            </div>
                            <div style={{ fontSize: 10.5, color: "#64748b", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                              <span>{row.credit} Credits</span>
                              <span>•</span>
                              <span>GP: {row.gp}</span>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: "#2563eb",
                                background: "#eff6ff",
                                border: "1px solid #dbeafe",
                                padding: "2px 6px",
                                borderRadius: 5,
                              }}
                            >
                              {row.grade}
                            </span>
                            <div style={{ textAlign: "right", minWidth: 44 }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>
                                {row.total} pts
                              </div>
                              <div style={{ fontSize: 9.5, color: "#94a3b8" }}>{row.credit} × {row.gp}</div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Total Summary Row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: 8,
                          marginTop: 2,
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: "#1e40af" }}>Total (5 Courses)</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 800, color: "#1e40af" }}>
                          <span>18 Credits</span>
                          <span>•</span>
                          <span style={{ fontFamily: "'Space Mono', monospace" }}>149 Points</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto", width: "100%" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, tableLayout: "fixed" }}>
                        <thead>
                          <tr style={{ color: "#94a3b8", fontWeight: 700, borderBottom: "1px solid #f1f5f9" }}>
                            <th style={{ textAlign: "left", paddingBottom: 8, width: "45%" }}>SUBJECT</th>
                            <th style={{ textAlign: "center", paddingBottom: 8, width: "18%" }}>CREDIT</th>
                            <th style={{ textAlign: "center", paddingBottom: 8, width: "18%" }}>GRADE</th>
                            <th style={{ textAlign: "right", paddingBottom: 8, width: "19%" }}>C × GP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {EXAMPLE_CALC_ROWS.slice(0, 5).map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                              <td style={{ padding: "7px 0", color: "#334155", fontWeight: 500 }}>{row.course}</td>
                              <td style={{ textAlign: "center", padding: "7px 0", color: "#64748b" }}>{row.credit}</td>
                              <td style={{ textAlign: "center", padding: "7px 0", fontWeight: 700, color: "#2563eb" }}>{row.grade}</td>
                              <td style={{ textAlign: "right", padding: "7px 0", fontWeight: 700, color: "#0f172a" }}>{row.total}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: "2px solid #e2e8f0", fontWeight: 800 }}>
                            <td style={{ padding: "8px 0", color: "#0f172a" }}>Total</td>
                            <td style={{ textAlign: "center", padding: "8px 0", color: "#0f172a" }}>18</td>
                            <td style={{ textAlign: "center", padding: "8px 0", color: "#94a3b8" }}>—</td>
                            <td style={{ textAlign: "right", padding: "8px 0", color: "#0f172a" }}>149</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 8,
                      padding: "8px 12px",
                      textAlign: "center",
                      color: "#15803d",
                      fontSize: isMobile ? 11.5 : 13,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <Check size={14} color="#15803d" style={{ flexShrink: 0 }} />
                    <span>SGPA = Total Points (149) / Total Credits (18) = 8.28</span>
                  </div>
                </div>

                {/* ── ROW 4: KEY TAKEAWAYS BANNER ────────────────────── */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4 0%, #eff6ff 50%, #f5f3ff 100%)",
                    border: "1px solid #dbeafe",
                    borderRadius: 20,
                    padding: isMobile ? "18px 16px" : "24px 32px",
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr) auto",
                    gap: isMobile ? 14 : 24,
                    alignItems: "center",
                  }}
                  className="gf-takeaways-grid"
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Calculator size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0" }}>Use credit-weighted formulas</h4>
                      <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.4 }}>More credits have more impact on CGPA.</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0" }}>Clear backlogs early</h4>
                      <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.4 }}>Backlogs reduce your Academic Health score.</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0" }}>Aim for higher SGPA</h4>
                      <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.4 }}>Unlock achievements and rise on rank boards.</p>
                    </div>
                  </div>

                  {!isMobile && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          background: "#2563eb",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 6px 16px rgba(37, 99, 235, 0.3)",
                        }}
                      >
                        <GraduationCap size={28} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ────────────────────────────────────────────────────────
                VIEW: DEDICATED GRADING SCALE ANALYZER
            ──────────────────────────────────────────────────────── */}
            {activeTab === "grading-scale" && (
              <motion.div
                key="grading-scale"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #f1f5f9",
                  borderRadius: isMobile ? 16 : 20,
                  padding: isMobile ? "20px 14px" : "28px 28px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? 14 : 20,
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  overflowX: "hidden",
                  margin: 0,
                }}
              >
                {/* Section Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", flexDirection: isMobile ? "column" : "row", gap: 12, width: "100%", boxSizing: "border-box" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h2 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "-0.3px", wordBreak: "break-word", lineHeight: 1.3 }}>
                      University Grading Scale &amp; Point Mapping
                    </h2>
                    <p style={{ fontSize: isMobile ? 12 : 13.5, color: "#64748b", margin: 0, lineHeight: 1.45, wordBreak: "break-word" }}>
                      Official grading thresholds, clearance conditions, and GPA points for Centurion University.
                    </p>
                  </div>

                  {/* Search Input */}
                  <div style={{ position: "relative", width: isMobile ? "100%" : 240, flexShrink: 0, boxSizing: "border-box" }}>
                    <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      value={gradeSearch}
                      onChange={(e) => setGradeSearch(e.target.value)}
                      placeholder="Search grade or name..."
                      style={{
                        width: "100%",
                        padding: "9px 12px 9px 34px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        fontSize: 12.5,
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#f8fafc",
                      }}
                    />
                  </div>
                </div>

                {/* ── Category Filter Pills & Stats Row ── */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 5, overflowX: "auto", maxWidth: "100%", width: isMobile ? "100%" : "auto", scrollbarWidth: "none", boxSizing: "border-box", paddingBottom: 2 }}>
                    {[
                      { id: "all", label: "All", count: 10 },
                      { id: "pass", label: "Passing", count: 6 },
                      { id: "backlog", label: "Backlog / Hold", count: 4 },
                    ].map((tab) => {
                      const isSel = gradeFilterCategory === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setGradeFilterCategory(tab.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: isMobile ? "5px 10px" : "6px 12px",
                            borderRadius: 20,
                            border: isSel ? "1px solid #2563eb" : "1px solid #e2e8f0",
                            background: isSel ? "#eff6ff" : "#ffffff",
                            color: isSel ? "#2563eb" : "#475569",
                            fontSize: isMobile ? 11.5 : 12,
                            fontWeight: isSel ? 800 : 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span>{tab.label}</span>
                          <span
                            style={{
                              background: isSel ? "#2563eb" : "#f1f5f9",
                              color: isSel ? "#ffffff" : "#64748b",
                              padding: "1px 5px",
                              borderRadius: 10,
                              fontSize: 10,
                              fontWeight: 800,
                            }}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <span style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 600 }}>
                    Showing {filteredGrades.length} of 10
                  </span>
                </div>

                {/* ── MOBILE: BEAUTIFUL CARD LIST (100% Fluid & Responsive) ── */}
                {isMobile ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", boxSizing: "border-box" }}>
                    {filteredGrades.map((g, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "#fcfdfe",
                          border: `1px solid ${g.pts >= 4 ? "#e2e8f0" : "#fee2e2"}`,
                          borderRadius: 12,
                          padding: "12px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                          width: "100%",
                          boxSizing: "border-box",
                          overflow: "hidden",
                        }}
                      >
                        {/* Row 1: Grade Badge, Qualification, Marks & Points */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%", boxSizing: "border-box" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: g.bg,
                                color: g.color,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 900,
                                fontSize: 15,
                                flexShrink: 0,
                                boxShadow: `0 2px 5px ${g.color}20`,
                              }}
                            >
                              {g.grade}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.25, wordBreak: "break-word" }}>
                                {g.qual}
                              </div>
                              <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                                Marks: <span style={{ fontWeight: 700, color: "#1e293b" }}>{g.range}</span>
                              </div>
                            </div>
                          </div>

                          {/* Points Display */}
                          <div
                            style={{
                              background: g.bg,
                              color: g.color,
                              padding: "4px 8px",
                              borderRadius: 8,
                              textAlign: "center",
                              border: `1px solid ${g.color}30`,
                              flexShrink: 0,
                              minWidth: 42,
                            }}
                          >
                            <div style={{ fontSize: 13.5, fontWeight: 900, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>
                              {g.pts}
                            </div>
                            <div style={{ fontSize: 8.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px", marginTop: 1 }}>
                              {g.pts === 1 ? "Pt" : "Pts"}
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Description & Status Tag */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: 6,
                            borderTop: "1px solid #f1f5f9",
                            gap: 8,
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          <p style={{ fontSize: 11, color: "#64748b", margin: 0, flex: 1, minWidth: 0, lineHeight: 1.35, wordBreak: "break-word" }}>
                            {g.desc}
                          </p>

                          {g.pts >= 4 ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                padding: "2px 8px",
                                borderRadius: 20,
                                background: "#dcfce7",
                                color: "#15803d",
                                fontSize: 10.5,
                                fontWeight: 700,
                                border: "1px solid #bbf7d0",
                                flexShrink: 0,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Check size={11} /> Cleared
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                padding: "2px 8px",
                                borderRadius: 20,
                                background: "#fee2e2",
                                color: "#b91c1c",
                                fontSize: 10.5,
                                fontWeight: 700,
                                border: "1px solid #fecaca",
                                flexShrink: 0,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <AlertTriangle size={11} /> Backlog
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* ── DESKTOP: SPACIOUS 6-COLUMN DATA TABLE ── */
                  <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", color: "#64748b", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "12px 16px", textAlign: "left" }}>Grade</th>
                          <th style={{ padding: "12px 16px", textAlign: "left" }}>Qualification</th>
                          <th style={{ padding: "12px 16px", textAlign: "center" }}>Marks Range</th>
                          <th style={{ padding: "12px 16px", textAlign: "center" }}>Grade Points</th>
                          <th style={{ padding: "12px 16px", textAlign: "center" }}>Status</th>
                          <th style={{ padding: "12px 16px", textAlign: "left" }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGrades.map((g, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 6, background: g.bg, color: g.color, fontWeight: 800, fontSize: 13 }}>
                                {g.grade}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>{g.qual}</td>
                            <td style={{ padding: "12px 16px", textAlign: "center", fontFamily: "'Space Mono', monospace", color: "#475569" }}>{g.range}</td>
                            <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 800, color: g.color, fontSize: 15, fontFamily: "'Space Mono', monospace" }}>{g.pts}</td>
                            <td style={{ padding: "12px 16px", textAlign: "center" }}>
                              {g.pts >= 4 ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#16a34a", fontSize: 12, fontWeight: 700 }}>
                                  <Check size={14} /> Cleared
                                </span>
                              ) : (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#dc2626", fontSize: 12, fontWeight: 700 }}>
                                  <AlertTriangle size={14} /> Backlog
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{g.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* ────────────────────────────────────────────────────────
                VIEW: DEDICATED ACADEMIC HEALTH DASHBOARD
            ──────────────────────────────────────────────────────── */}
            {activeTab === "academic-health" && (
              <motion.div
                key="academic-health"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #f1f5f9",
                  borderRadius: isMobile ? 16 : 20,
                  padding: isMobile ? "20px 14px" : "28px 28px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? 16 : 20,
                  width: "100%",
                  boxSizing: "border-box",
                  margin: 0,
                }}
              >
                <div>
                  <h2 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "-0.3px" }}>
                    Live Academic Health Meter
                  </h2>
                  <p style={{ fontSize: isMobile ? 12 : 13.5, color: "#64748b", margin: "0 0 20px 0", lineHeight: 1.4 }}>
                    Adjust your metrics below to see your real-time computed health index (0 to 100 points).
                  </p>
                </div>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: isMobile ? 18 : 32, alignItems: "center" }}>
                    {/* Sliders Input */}
                    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 14 : 18 }}>
                      {/* Slider 1: CGPA */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                            <span style={{ fontSize: isMobile ? 12.5 : 13.5, fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap" }}>
                              Cumulative CGPA
                            </span>
                            <span
                              style={{
                                fontSize: isMobile ? 12 : 13,
                                fontWeight: 800,
                                color: "#8b5cf6",
                                background: "#8b5cf615",
                                border: "1px solid #8b5cf625",
                                padding: "1px 7px",
                                borderRadius: 6,
                                fontFamily: "'Space Mono', monospace",
                                minWidth: 32,
                                textAlign: "center",
                              }}
                            >
                              {Number(healthCgpa).toFixed(1)}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: isMobile ? 10.5 : 11.5,
                              fontWeight: 700,
                              color: "#8b5cf6",
                              background: "#f5f3ff",
                              border: "1px solid #ede9fe",
                              padding: "2px 7px",
                              borderRadius: 6,
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            Max 50 pts (CGPA × 5)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.1"
                          value={healthCgpa}
                          onChange={(e) => setHealthCgpa(Number(e.target.value))}
                          style={{
                            width: "100%",
                            accentColor: "#8b5cf6",
                            height: 6,
                            cursor: "pointer",
                            touchAction: "pan-x",
                          }}
                        />
                      </div>

                      {/* Slider 2: SGPA */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                            <span style={{ fontSize: isMobile ? 12.5 : 13.5, fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap" }}>
                              Latest SGPA
                            </span>
                            <span
                              style={{
                                fontSize: isMobile ? 12 : 13,
                                fontWeight: 800,
                                color: "#2563eb",
                                background: "#2563eb15",
                                border: "1px solid #2563eb25",
                                padding: "1px 7px",
                                borderRadius: 6,
                                fontFamily: "'Space Mono', monospace",
                                minWidth: 32,
                                textAlign: "center",
                              }}
                            >
                              {Number(healthSgpa).toFixed(1)}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: isMobile ? 10.5 : 11.5,
                              fontWeight: 700,
                              color: "#2563eb",
                              background: "#eff6ff",
                              border: "1px solid #dbeafe",
                              padding: "2px 7px",
                              borderRadius: 6,
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            Max 20 pts (SGPA × 2)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.1"
                          value={healthSgpa}
                          onChange={(e) => setHealthSgpa(Number(e.target.value))}
                          style={{
                            width: "100%",
                            accentColor: "#2563eb",
                            height: 6,
                            cursor: "pointer",
                            touchAction: "pan-x",
                          }}
                        />
                      </div>

                      {/* Slider 3: Backlogs */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                            <span style={{ fontSize: isMobile ? 12.5 : 13.5, fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap" }}>
                              Active Backlogs
                            </span>
                            <span
                              style={{
                                fontSize: isMobile ? 12 : 13,
                                fontWeight: 800,
                                color: "#ef4444",
                                background: "#ef444415",
                                border: "1px solid #ef444425",
                                padding: "1px 7px",
                                borderRadius: 6,
                                fontFamily: "'Space Mono', monospace",
                                minWidth: 26,
                                textAlign: "center",
                              }}
                            >
                              {healthBacklogs}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: isMobile ? 10.5 : 11.5,
                              fontWeight: 700,
                              color: "#ef4444",
                              background: "#fef2f2",
                              border: "1px solid #fee2e2",
                              padding: "2px 7px",
                              borderRadius: 6,
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            20 - (Count × 5)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="4"
                          step="1"
                          value={healthBacklogs}
                          onChange={(e) => setHealthBacklogs(Number(e.target.value))}
                          style={{
                            width: "100%",
                            accentColor: "#ef4444",
                            height: 6,
                            cursor: "pointer",
                            touchAction: "pan-x",
                          }}
                        />
                      </div>
                    </div>

                    {/* Circular Score Gauge */}
                    <div
                      style={{
                        background: "linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)",
                        borderRadius: 16,
                        padding: isMobile ? "20px 16px" : "32px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        border: "1px solid #ddd6fe",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#6d28d9", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Health Score
                      </div>
                      <div style={{ fontSize: isMobile ? 42 : 54, fontWeight: 800, color: "#0f172a", lineHeight: 1.1, margin: "6px 0" }}>
                        {calculateHealthScore()} <span style={{ fontSize: 16, color: "#94a3b8" }}>/100</span>
                      </div>
                      <div
                        style={{
                          padding: "4px 14px",
                          borderRadius: 99,
                          background: calculateHealthScore() >= 80 ? "#dcfce7" : calculateHealthScore() >= 60 ? "#fef3c7" : "#fee2e2",
                          color: calculateHealthScore() >= 80 ? "#15803d" : calculateHealthScore() >= 60 ? "#d97706" : "#b91c1c",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {calculateHealthScore() >= 80 ? "Excellent Standing" : calculateHealthScore() >= 60 ? "Good Progress" : "Needs Attention"}
                      </div>
                    </div>
                  </div>
              </motion.div>
            )}

            {/* ────────────────────────────────────────────────────────
                VIEW: DEDICATED BADGES & ACHIEVEMENTS SHOWCASE
            ──────────────────────────────────────────────────────── */}
            {activeTab === "badges-tab" && (
              <motion.div
                key="badges-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 20, padding: isMobile ? "20px 14px" : "28px 28px", boxShadow: "0 4px 16px rgba(0,0,0,0.02)", margin: 0 }}
              >
                <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                  Unlockable Academic Badges
                </h2>
                <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 20px 0" }}>
                  Earn prestigious milestone badges on your student dashboard by meeting academic criteria.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 12 : 18 }}>
                  {BADGES_SCALE.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: "1px solid #f1f5f9",
                        borderRadius: 16,
                        padding: isMobile ? "16px 14px" : "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        background: "#fcfdfe",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: b.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {b.icon}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: b.color, background: b.bg, padding: "3px 7px", borderRadius: 6, textTransform: "uppercase" }}>
                          {b.tier}
                        </span>
                      </div>
                      <div>
                        <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", margin: "0 0 3px 0" }}>{b.name}</h4>
                        <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.4 }}>{b.desc}</p>
                      </div>
                      <div style={{ paddingTop: 8, borderTop: "1px solid #f1f5f9", fontSize: 11.5, fontWeight: 700, color: b.color, fontFamily: "'Space Mono', monospace" }}>
                        Criteria: {b.criteria}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ────────────────────────────────────────────────────────
                VIEW: TARGET GPA PREDICTOR
            ──────────────────────────────────────────────────────── */}
            {activeTab === "target-predictor" && (
              <motion.div
                key="target-predictor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 20, padding: isMobile ? "20px 14px" : "28px 28px", boxShadow: "0 4px 16px rgba(0,0,0,0.02)", margin: 0 }}
              >
                <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                  Target GPA Goal Predictor
                </h2>
                <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 20px 0" }}>
                  Calculate exactly what SGPA you need to score in your next semester to achieve your target graduation CGPA.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: isMobile ? 20 : 28, alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", display: "block", marginBottom: 5 }}>Current Cumulative CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        value={currentCgpaInput}
                        onChange={(e) => setCurrentCgpaInput(Number(e.target.value))}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", display: "block", marginBottom: 5 }}>Total Completed Credits so far</label>
                      <input
                        type="number"
                        value={completedCredits}
                        onChange={(e) => setCompletedCredits(Number(e.target.value))}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", display: "block", marginBottom: 5 }}>Next Semester Credits</label>
                      <input
                        type="number"
                        value={nextSemCredits}
                        onChange={(e) => setNextSemCredits(Number(e.target.value))}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", display: "block", marginBottom: 5 }}>Desired Target CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        value={targetCgpaGoal}
                        onChange={(e) => setTargetCgpaGoal(Number(e.target.value))}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, padding: isMobile ? "24px 16px" : "32px", textAlign: "center" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: "#1e40af", textTransform: "uppercase" }}>Required Next Semester SGPA</div>
                    <div style={{ fontSize: isMobile ? 42 : 52, fontWeight: 800, color: "#1d4ed8", margin: "8px 0" }}>{calculateRequiredSgpa()}</div>
                    <p style={{ fontSize: 12.5, color: "#475569", margin: 0, lineHeight: 1.45 }}>
                      {Number(calculateRequiredSgpa()) > 10 ? "Target is mathematically unreachable in 1 semester. Strive for consistent 9+ SGPAs across remaining semesters." : `Scoring a ${calculateRequiredSgpa()} SGPA next semester will elevate your CGPA to ${targetCgpaGoal}!`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ────────────────────────────────────────────────────────
                VIEW: SGPA CALCULATOR
            ──────────────────────────────────────────────────────── */}
            {activeTab === "sgpa-calc" && (
              <motion.div
                key="sgpa-calc"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 20, padding: isMobile ? "20px 14px" : "28px 28px", boxShadow: "0 4px 16px rgba(0,0,0,0.02)", margin: 0 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 20, flexDirection: isMobile ? "column" : "row", gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                      Interactive SGPA Calculator
                    </h2>
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Add your subjects, credits, and expected grades to compute real-time SGPA.</p>
                  </div>
                  <div style={{ textAlign: isMobile ? "left" : "right", background: "#eff6ff", padding: "8px 16px", borderRadius: 12, border: "1px solid #bfdbfe", width: isMobile ? "100%" : "auto", boxSizing: "border-box" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#1e40af", textTransform: "uppercase" }}>Calculated SGPA</span>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#1d4ed8" }}>{calculatedSgpa()} <span style={{ fontSize: 13, color: "#60a5fa" }}>/10</span></div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sgpaSubjects.map((sub, i) => (
                    <div
                      key={i}
                      style={{
                        display: isMobile ? "flex" : "grid",
                        flexDirection: isMobile ? "column" : "row",
                        gridTemplateColumns: isMobile ? "none" : "2fr 1fr 1fr auto",
                        gap: isMobile ? 8 : 12,
                        alignItems: isMobile ? "stretch" : "center",
                        background: "#f8fafc",
                        padding: isMobile ? "12px" : "12px 16px",
                        borderRadius: 12,
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      <input
                        value={sub.name}
                        onChange={(e) => {
                          const copy = [...sgpaSubjects];
                          copy[i].name = e.target.value;
                          setSgpaSubjects(copy);
                        }}
                        placeholder="Subject Name"
                        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                        <select
                          value={sub.credit}
                          onChange={(e) => {
                            const copy = [...sgpaSubjects];
                            copy[i].credit = Number(e.target.value);
                            setSgpaSubjects(copy);
                          }}
                          style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}
                        >
                          {[1, 2, 3, 4, 5, 6].map((c) => (
                            <option key={c} value={c}>{c} Credits</option>
                          ))}
                        </select>
                        <select
                          value={sub.grade}
                          onChange={(e) => {
                            const copy = [...sgpaSubjects];
                            copy[i].grade = e.target.value;
                            setSgpaSubjects(copy);
                          }}
                          style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff", fontWeight: 700, color: "#2563eb" }}
                        >
                          {GRADE_SCALE.map((g) => (
                            <option key={g.grade} value={g.grade}>{g.grade} ({g.pts} pts)</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setSgpaSubjects(sgpaSubjects.filter((_, idx) => idx !== i))}
                          style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "6px 8px", flexShrink: 0 }}
                          title="Remove subject"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setSgpaSubjects([...sgpaSubjects, { name: `Subject ${sgpaSubjects.length + 1}`, credit: 3, grade: "A" }])}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    <Plus size={15} /> Add Subject
                  </button>
                </div>
              </motion.div>
            )}

            {/* ────────────────────────────────────────────────────────
                VIEW: CGPA CALCULATOR
            ──────────────────────────────────────────────────────── */}
            {activeTab === "cgpa-calc" && (
              <motion.div
                key="cgpa-calc"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 20, padding: isMobile ? "20px 14px" : "28px 28px", boxShadow: "0 4px 16px rgba(0,0,0,0.02)", margin: 0 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 20, flexDirection: isMobile ? "column" : "row", gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                      Multi-Semester CGPA Calculator
                    </h2>
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Input semester credits &amp; SGPA to compute cumulative CGPA.</p>
                  </div>
                  <div style={{ textAlign: isMobile ? "left" : "right", background: "#f5f3ff", padding: "8px 16px", borderRadius: 12, border: "1px solid #ddd6fe", width: isMobile ? "100%" : "auto", boxSizing: "border-box" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#6d28d9", textTransform: "uppercase" }}>Calculated CGPA</span>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#7c3aed" }}>{calculatedCgpa()} <span style={{ fontSize: 13, color: "#c4b5fd" }}>/10</span></div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {cgpaSemesters.map((sem, i) => (
                    <div
                      key={i}
                      style={{
                        display: isMobile ? "flex" : "grid",
                        flexDirection: isMobile ? "column" : "row",
                        gridTemplateColumns: isMobile ? "none" : "1.5fr 1fr 1fr auto",
                        gap: isMobile ? 8 : 12,
                        alignItems: isMobile ? "stretch" : "center",
                        background: "#f8fafc",
                        padding: isMobile ? "12px" : "12px 16px",
                        borderRadius: 12,
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>{sem.sem}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 10.5, color: "#64748b", display: "block", marginBottom: 3 }}>Credits:</span>
                          <input
                            type="number"
                            value={sem.credits}
                            onChange={(e) => {
                              const copy = [...cgpaSemesters];
                              copy[i].credits = Number(e.target.value);
                              setCgpaSemesters(copy);
                            }}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff", boxSizing: "border-box" }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 10.5, color: "#64748b", display: "block", marginBottom: 3 }}>SGPA:</span>
                          <input
                            type="number"
                            step="0.01"
                            max="10"
                            value={sem.sgpa}
                            onChange={(e) => {
                              const copy = [...cgpaSemesters];
                              copy[i].sgpa = Number(e.target.value);
                              setCgpaSemesters(copy);
                            }}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff", fontWeight: 700, color: "#7c3aed", boxSizing: "border-box" }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setCgpaSemesters(cgpaSemesters.filter((_, idx) => idx !== i))}
                          style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "6px 8px", marginTop: 16, flexShrink: 0 }}
                          title="Remove semester"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setCgpaSemesters([...cgpaSemesters, { sem: `Semester ${cgpaSemesters.length + 1}`, credits: 22, sgpa: 8.5 }])}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, background: "#7c3aed", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    <Plus size={15} /> Add Semester
                  </button>
                </div>
              </motion.div>
            )}

            {/* ────────────────────────────────────────────────────────
                VIEW: ACADEMIC REPORT
            ──────────────────────────────────────────────────────── */}
            {activeTab === "academic-report" && (
              <motion.div
                key="academic-report"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 20, padding: isMobile ? "20px 14px" : "28px 28px", boxShadow: "0 4px 16px rgba(0,0,0,0.02)", margin: 0 }}
              >
                <h2 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                  Academic Report Card Overview
                </h2>
                <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 20px 0" }}>
                  Detailed breakdown of semester progress, cumulative performance, and course credits.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 12 : 16, marginBottom: 20 }}>
                  <div style={{ background: "#f8fafc", padding: "16px 18px", borderRadius: 14, border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>CURRENT CGPA</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>8.72 <span style={{ fontSize: 13, color: "#94a3b8" }}>/10</span></div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "16px 18px", borderRadius: 14, border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>TOTAL CREDITS EARNED</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#2563eb", marginTop: 4 }}>138</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "16px 18px", borderRadius: 14, border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>ACTIVE BACKLOGS</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>0</div>
                  </div>
                </div>

                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    style={{ padding: "12px 22px", borderRadius: 10, background: "#0f172a", color: "#fff", border: "none", fontWeight: 700, fontSize: 13.5, cursor: "pointer", width: isMobile ? "100%" : "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    View Your Official Dashboard <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ────────────────────────────────────────────────────────
                VIEW: HELP & FAQ
            ──────────────────────────────────────────────────────── */}
            {activeTab === "help-faq" && (
              <motion.div
                key="help-faq"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 20, padding: isMobile ? "20px 14px" : "28px 28px", boxShadow: "0 4px 16px rgba(0,0,0,0.02)", margin: 0 }}
              >
                <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>Frequently Asked Questions</h2>
                <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 20px 0" }}>Everything you need to know about Centurion University grading &amp; calculations.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {faqs.map((f, idx) => (
                    <div key={idx} style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        style={{ width: "100%", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: openFaq === idx ? "#f8fafc" : "#fff", border: "none", fontSize: isMobile ? 13.5 : 14.5, fontWeight: 700, color: "#0f172a", cursor: "pointer", textAlign: "left" }}
                      >
                        <span style={{ paddingRight: 10 }}>{f.q}</span>
                        <ChevronDown size={18} color="#64748b" style={{ transform: openFaq === idx ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                      </button>
                      {openFaq === idx && (
                        <div style={{ padding: "0 18px 16px 18px", fontSize: 13.5, color: "#475569", lineHeight: 1.6, background: "#f8fafc" }}>
                          {f.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ── Responsive CSS ── */}
      <style>{`
        @media (max-width: 1100px) {
          .gf-resources-layout {
            grid-template-columns: minmax(0, 1fr) !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
          .gf-resources-layout > main {
            min-width: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
          .gf-resources-layout aside {
            display: none !important;
          }
          .gf-formula-row {
            grid-template-columns: 1fr !important;
          }
          .gf-takeaways-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .gf-row-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
