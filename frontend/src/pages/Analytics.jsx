import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import CompanyEligibility from "../components/CompanyEligibility";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { AnalyticsSkeleton } from "../components/LoadingSpinner";
import { encodeStudentId, decodeStudentId, isEncryptedToken } from "../utils/studentIdEncoder";
import { motion, animate, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Star,
  Trophy,
  CheckCircle,
  AlertTriangle,
  Target,
  Medal,
  Award,
  BarChart2,
  PieChart,
  Briefcase,
  GraduationCap,
  Check,
  ArrowLeft,
  ArrowRight,
  X,
  List,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  RotateCcw,
  Sliders,
  Zap,
  Percent,
} from "lucide-react";
import {
  GRADE_POINTS,
  calculateCGPA,
  calculateSGPA as calcSGPA,
  isSem5ProjectException,
  round2,
  trunc2,
} from "../utils/gradeCalculations";

const GRADE_ORDER = ["O", "E", "A", "B", "C", "D", "F"];

const GRADE_META = {
  O: { pts: 10, label: "Outstanding", color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  E: { pts: 9, label: "Excellent", color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" },
  A: { pts: 8, label: "Very Good", color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" },
  B: { pts: 7, label: "Good", color: "#7e22ce", bg: "#f3e8ff", border: "#e9d5ff" },
  C: { pts: 6, label: "Fair", color: "#c2410c", bg: "#ffedd5", border: "#fed7aa" },
  D: { pts: 5, label: "Pass", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
  F: { pts: 2, label: "Fail", color: "#b91c1c", bg: "#fee2e2", border: "#fecaca" },
};

function AnimatedNumber({ value }) {
  const nodeRef = useRef();

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || value == null || Number.isNaN(value)) return;

    const startValue = parseFloat(node.textContent) || value;
    if (Number.isNaN(startValue)) return;

    const controls = animate(startValue, value, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate(v) {
        node.textContent = v.toFixed(2);
      },
    });

    return controls.stop;
  }, [value]);

  if (value == null || Number.isNaN(value)) return null;
  return <span ref={nodeRef}>{value.toFixed(2)}</span>;
}

function calcCGPAUpTo(results, upToIdx) {
  return calculateCGPA(results.slice(0, upToIdx + 1));
}

function generateInsights(data) {
  const insights = [];
  const { results, cgpa, latestSgpa, backlogs, ranking, branch } = data;
  const liveSGPAs = results.map((r) =>
    typeof r.sgpa === "number" ? r.sgpa : calcSGPA(r.subjects, r.semester)
  );

  if (results.length >= 2) {
    const prev = liveSGPAs[liveSGPAs.length - 2];
    const curr = liveSGPAs[liveSGPAs.length - 1];
    const diff = (curr - prev).toFixed(2);
    if (diff > 0)
      insights.push({
        icon: <TrendingUp size={18} color="#15803d" />,
        text: `Your SGPA improved by +${diff} this semester. Excellent upward performance trajectory!`,
        type: "success",
      });
    else if (diff < 0)
      insights.push({
        icon: <TrendingDown size={18} color="#b45309" />,
        text: `Your SGPA decreased by ${Math.abs(diff)}. Review high-credit subjects for the next semester.`,
        type: "warning",
      });
  }

  const bestSemIdx = liveSGPAs.reduce(
    (bestIdx, sgpa, i) => (sgpa > (liveSGPAs[bestIdx] || 0) ? i : bestIdx),
    0
  );
  const bestSem = results[bestSemIdx];
  const bestSGPA = liveSGPAs[bestSemIdx];
  if (bestSem)
    insights.push({
      icon: <Star size={18} color="#2563eb" />,
      text: `Your highest academic performance was Semester ${bestSem.semester} with an SGPA of ${bestSGPA?.toFixed(2)}.`,
      type: "info",
    });

  if (cgpa >= 8.5)
    insights.push({
      icon: <Trophy size={18} color="#15803d" />,
      text: "You hold a high-distinction standing comfortably above the department average.",
      type: "success",
    });

  if (backlogs.length === 0)
    insights.push({
      icon: <CheckCircle size={18} color="#15803d" />,
      text: "Outstanding! All course credits are successfully cleared with zero active backlogs.",
      type: "success",
    });

  if (backlogs.length > 0)
    insights.push({
      icon: <AlertTriangle size={18} color="#dc2626" />,
      text: `You have ${backlogs.length} active backlog(s). Prioritize clearing them in the upcoming remedial cycle.`,
      type: "danger",
    });

  if (ranking) {
    if (ranking.universityRank <= 10)
      insights.push({
        icon: <Target size={18} color="#15803d" />,
        text: `You are ranked #${ranking.universityRank} university-wide!`,
        type: "success",
      });
    if (ranking.deptRank <= 5)
      insights.push({
        icon: <Medal size={18} color="#15803d" />,
        text: `Top 5 in your department — Department Rank #${ranking.deptRank}!`,
        type: "success",
      });
  }

  if (latestSgpa >= 9.0)
    insights.push({
      icon: <Award size={18} color="#15803d" />,
      text: "Qualified for Academic Excellence Honours for this semester!",
      type: "success",
    });

  return insights;
}

function getDynamicBranch(regNo, fallbackBranch) {
  if (!regNo) return fallbackBranch;
  const r = String(regNo).trim();

  if (r === "230301180026") return "CSE";
  if (["230301120110", "230301120186", "230301120371", "230301120481"].includes(r)) return "ECE";
  if (r === "230301231033") return "AERO";

  if (r.startsWith("230301110") || r.startsWith("230301111")) return "CIVIL";
  if (r.startsWith("230301120") || r.startsWith("230301121")) return "CSE";
  if (r.startsWith("230301130") || r.startsWith("230301131") || r.startsWith("230301132")) return "ECE";
  if (r.startsWith("230301150") || r.startsWith("230301151")) return "EEE";
  if (r.startsWith("230301160") || r.startsWith("230301161")) return "ME";
  if (r.startsWith("230301180")) return "BIO";
  if (r.startsWith("230301190") || r.startsWith("230301191")) return "MI";
  if (r.startsWith("230301230")) return "AERO";

  return fallbackBranch || "-";
}

export default function Analytics() {
  const { regNo: paramRegNo } = useParams();
  const decodedRegNo = decodeStudentId(paramRegNo);
  const { studentData, fetchStudent, loading } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const regNo = decodedRegNo || studentData?.regNo || sessionStorage.getItem("last_regNo") || "";

  // Normalize URL to obfuscated token if raw registration number is provided
  useEffect(() => {
    if (decodedRegNo && paramRegNo && !isEncryptedToken(paramRegNo)) {
      const query = location.search || "";
      const hash = location.hash || "";
      navigate(`/analytics/${encodeStudentId(decodedRegNo)}${query}${hash}`, { replace: true });
    }
  }, [paramRegNo, decodedRegNo, navigate, location.search, location.hash]);

  // Helper to normalize any incoming tab/hash request
  const resolveTab = (raw) => {
    if (!raw) return "overview";
    const clean = String(raw).replace("#", "").toLowerCase().trim();
    if (clean === "trajectory" || clean === "overview" || clean === "comparescores" || clean === "compare" || clean === "scores") return "overview";
    if (clean === "grades" || clean === "distribution") return "grades";
    if (clean === "placement" || clean === "companies" || clean === "placementinsights") return "placement";
    if (clean === "mastery" || clean === "subjects" || clean === "subjectmastery" || clean === "insights") return "mastery";
    if (clean === "predictor" || clean === "goal" || clean === "gpapredictor" || clean === "gpa-predictor") return "predictor";
    if (clean === "whatif" || clean === "simulator" || clean === "what-if" || clean === "simulation") return "whatif";
    return "overview";
  };

  const [tab, setTab] = useState(() => {
    const fromQuery = searchParams.get("tab");
    const fromHash = window.location.hash.replace("#", "");
    return resolveTab(fromQuery || fromHash);
  });

  const [targetCGPA, setTargetCGPA] = useState("");
  const [whatIfGrades, setWhatIfGrades] = useState({});
  const [whatIfCGPA, setWhatIfCGPA] = useState(null);
  const [whatIfSGPA, setWhatIfSGPA] = useState(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1024 : false));

  // Mobile Sub-Nav Scroll Reference & Status
  const mobileTabsRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkTabsScroll = () => {
    if (mobileTabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = mobileTabsRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const scrollTabs = (direction) => {
    if (mobileTabsRef.current) {
      const scrollAmount = direction === "left" ? -160 : 160;
      mobileTabsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkTabsScroll, 200);
    }
  };

  const handleTabChange = (newTabId) => {
    if (newTabId === "attendance") {
      navigate(`/attendance/${encodeStudentId(regNo)}`);
      return;
    }
    setTab(newTabId);
    setSearchParams({ tab: newTabId }, { replace: true });
    // Smooth scroll to top on tab change
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sync tab with URL searchParams or hash whenever location changes
  useEffect(() => {
    const fromQuery = searchParams.get("tab");
    const fromHash = location.hash ? location.hash.replace("#", "") : "";
    const active = resolveTab(fromQuery || fromHash);
    if (active && active !== tab) {
      setTab(active);
    }
  }, [searchParams, location.search, location.hash]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      checkTabsScroll();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    checkTabsScroll();
  }, [tab]);

  useEffect(() => {
    if (!studentData || studentData.regNo !== regNo) {
      if (regNo) fetchStudent(regNo);
    }
  }, [regNo]);

  // Grade Distribution Calculation across all semesters
  const gradeDistributionData = useMemo(() => {
    if (!studentData || !studentData.results) return [];
    const counts = { O: 0, E: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
    let totalSubs = 0;

    studentData.results.forEach((r) => {
      r.subjects?.forEach((s) => {
        const grade = s.grade?.toUpperCase();
        if (counts[grade] !== undefined) {
          counts[grade] += 1;
          totalSubs += 1;
        }
      });
    });

    return Object.keys(counts).map((g) => ({
      grade: g,
      count: counts[g],
      label: GRADE_META[g]?.label || g,
      pts: GRADE_META[g]?.pts || 0,
      color: GRADE_META[g]?.color || "#475569",
      bg: GRADE_META[g]?.bg || "#f1f5f9",
      border: GRADE_META[g]?.border || "#cbd5e1",
      pct: totalSubs > 0 ? ((counts[g] / totalSubs) * 100).toFixed(1) : "0.0",
    }));
  }, [studentData]);

  const totalGradedCount = useMemo(() => {
    return gradeDistributionData.reduce((acc, curr) => acc + curr.count, 0);
  }, [gradeDistributionData]);

  const honorsGradeRatio = useMemo(() => {
    if (!totalGradedCount) return "0.0";
    const highCount = gradeDistributionData
      .filter((d) => ["O", "E", "A"].includes(d.grade))
      .reduce((acc, curr) => acc + curr.count, 0);
    return ((highCount / totalGradedCount) * 100).toFixed(1);
  }, [gradeDistributionData, totalGradedCount]);

  const radarData = useMemo(() => {
    if (!studentData || !studentData.results) return [];

    let theoryW = 0, theoryC = 0;
    let practicalW = 0, practicalC = 0;
    let projectW = 0, projectC = 0;

    studentData.results.forEach((r) => {
      r.subjects?.forEach((s) => {
        if (!s.credit || !GRADE_POINTS[s.grade]) return;
        const type = s.type ? s.type.toLowerCase() : s.subName ? s.subName.toLowerCase() : "";
        const points = s.credit * GRADE_POINTS[s.grade];

        if (type.includes("proj")) {
          projectW += points;
          projectC += s.credit;
        } else if (type.includes("p") || type.includes("lab") || type.includes("practical") || type.includes("sess")) {
          practicalW += points;
          practicalC += s.credit;
        } else {
          theoryW += points;
          theoryC += s.credit;
        }
      });
    });

    return [
      { subject: "Theory Courses", score: theoryC ? (theoryW / theoryC) * 10 : 0, fullMark: 100 },
      { subject: "Practicals & Labs", score: practicalC ? (practicalW / practicalC) * 10 : 0, fullMark: 100 },
      { subject: "Project Work", score: projectC ? (projectW / projectC) * 10 : 0, fullMark: 100 },
    ];
  }, [studentData]);

  // What-if simulator calculation
  useEffect(() => {
    if (!studentData || !studentData.results) {
      setWhatIfCGPA(null);
      setWhatIfSGPA(null);
      return;
    }

    const results = studentData.results;
    let cgpaNumerator = 0, cgpaDenominator = 0;
    let sgpa_tw = 0, sgpa_tc = 0;

    results.forEach((r, ri) => {
      const isLatest = ri === results.length - 1;
      let semTW = 0, semTC = 0;

      r.subjects.forEach((s) => {
        const grade = isLatest && whatIfGrades[s.subCode] ? whatIfGrades[s.subCode] : s.grade;

        if (isSem5ProjectException(s, r.semester)) return;

        if (s.credit && GRADE_POINTS[grade] !== undefined) {
          semTW += s.credit * GRADE_POINTS[grade];
          semTC += s.credit;
          if (isLatest) {
            sgpa_tw += s.credit * GRADE_POINTS[grade];
            sgpa_tc += s.credit;
          }
        }
      });

      if (semTC > 0) {
        let semSGPA = trunc2(semTW / semTC);
        cgpaNumerator += semSGPA * semTC;
        cgpaDenominator += semTC;
      }
    });

    setWhatIfCGPA(cgpaDenominator > 0 ? trunc2(cgpaNumerator / cgpaDenominator).toFixed(2) : "0.00");
    setWhatIfSGPA(sgpa_tc > 0 ? trunc2(sgpa_tw / sgpa_tc).toFixed(2) : "0.00");
  }, [whatIfGrades, studentData]);

  if (loading || !studentData) return <AnalyticsSkeleton />;

  const {
    results = [],
    cgpa = 0,
    latestSgpa = 0,
    latestSemester = 1,
    totalCredits = 0,
    creditsCleared = 0,
    backlogs = [],
    studentName,
    branch,
    batch,
  } = studentData;

  const chartData = results.map((r, i) => ({
    sem: `Sem ${r.semester}`,
    SGPA: typeof r.sgpa === "number" ? r.sgpa : parseFloat(calcSGPA(r.subjects, r.semester).toFixed(2)),
    CGPA: calcCGPAUpTo(results, i),
  }));

  const remainingSems = Math.max(0, 8 - latestSemester);
  let requiredSGPA = null;
  if (targetCGPA && remainingSems > 0) {
    const target = parseFloat(targetCGPA);
    const currentCredits = creditsCleared;
    const avgCreditsPerSem = currentCredits / latestSemester;
    const futureCredits = remainingSems * avgCreditsPerSem;
    requiredSGPA = (
      (target * (currentCredits + futureCredits) - cgpa * currentCredits) /
      futureCredits
    ).toFixed(2);
  }

  const latestResult = results[results.length - 1];
  const latestSubjects = latestResult?.subjects || [];
  const dynamicBranch = getDynamicBranch(regNo, branch);
  const insights = generateInsights(studentData);

  const insightColors = {
    success: { border: "#bbf7d0", bg: "#f0fdf4", text: "#15803d" },
    warning: { border: "#fde68a", bg: "#fef3c7", text: "#b45309" },
    danger: { border: "#fecaca", bg: "#fef2f2", text: "#b91c1c" },
    info: { border: "#bfdbfe", bg: "#eff6ff", text: "#1d4ed8" },
  };

  const navTabs = [
    { id: "overview", label: "Performance Trajectory", icon: <TrendingUp size={15} color="#2563eb" /> },
    { id: "grades", label: "Grade Distribution", icon: <BarChart2 size={15} color="#8b5cf6" /> },
    { id: "placement", label: "Placement & Companies", icon: <Briefcase size={15} color="#10b981" /> },
    { id: "mastery", label: "Subject Mastery & Insights", icon: <Target size={15} color="#d97706" /> },
    { id: "predictor", label: "CGPA Goal Predictor", icon: <Sparkles size={15} color="#16a34a" /> },
    { id: "whatif", label: "What-If Simulator", icon: <PieChart size={15} color="#6366f1" /> },
    { id: "attendance", label: "Attendance Tracker", icon: <Percent size={15} color="#059669" /> },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: isMobile ? "12px 10px 40px 10px" : "24px 20px 60px 20px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column", gap: isMobile ? 12 : 22 }}>
        
        {/* Top Header Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            padding: isMobile ? "14px 14px" : "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 14px rgba(15,23,42,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 12 : 16,
          }}
        >
          {/* Breadcrumb row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <button
              onClick={() => navigate(`/dashboard/${encodeStudentId(regNo)}`)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: isMobile ? "5px 10px" : "6px 13px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#334155",
                fontSize: isMobile ? 12 : 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <ArrowLeft size={13} /> Back to Dashboard
            </button>

            <span
              style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 700,
                color: "#2563eb",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                padding: "3px 9px",
                borderRadius: 20,
              }}
            >
              Analytics Suite
            </span>
          </div>

          {/* Student Profile Info & Quick Metrics */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: isMobile ? 10 : 16 }}>
            <div>
              <h1 style={{ fontSize: isMobile ? 18 : 23, fontWeight: 900, color: "#0f172a", margin: "0 0 2px 0", letterSpacing: "-0.4px" }}>
                {studentName}
              </h1>
              <p style={{ color: "#64748b", fontSize: isMobile ? 11.5 : 13, margin: 0, fontWeight: 500 }}>
                Reg No: <strong style={{ color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>{regNo}</strong> &nbsp;·&nbsp;
                Branch: <strong style={{ color: "#0f172a" }}>{dynamicBranch}</strong>
              </p>
            </div>

            {/* Quick Metrics (3-column responsive grid) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: isMobile ? 6 : 10,
              }}
            >
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 10,
                  padding: isMobile ? "6px 8px" : "7px 14px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>CGPA</div>
                <div style={{ fontSize: isMobile ? 14 : 17, fontWeight: 800, color: "#1d4ed8", fontFamily: "'Space Mono', monospace" }}>
                  {cgpa}
                </div>
              </div>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 10,
                  padding: isMobile ? "6px 8px" : "7px 14px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 800, color: "#15803d", textTransform: "uppercase" }}>Latest SGPA</div>
                <div style={{ fontSize: isMobile ? 14 : 17, fontWeight: 800, color: "#16a34a", fontFamily: "'Space Mono', monospace" }}>
                  {latestSgpa?.toFixed(2)}
                </div>
              </div>

              <div
                style={{
                  background: backlogs.length ? "#fef2f2" : "#f0fdf4",
                  border: `1px solid ${backlogs.length ? "#fecaca" : "#bbf7d0"}`,
                  borderRadius: 10,
                  padding: isMobile ? "6px 8px" : "7px 14px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 800, color: backlogs.length ? "#b91c1c" : "#15803d", textTransform: "uppercase" }}>
                  Backlogs
                </div>
                <div style={{ fontSize: isMobile ? 14 : 17, fontWeight: 800, color: backlogs.length ? "#dc2626" : "#16a34a", fontFamily: "'Space Mono', monospace" }}>
                  {backlogs.length ? `${backlogs.length}` : "Clear"}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              SUB-NAV SEGMENTED TAB SWITCHER (With Scroll Arrows on Mobile)
          ══════════════════════════════════════════════════════════ */}
          {isMobile ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "4px 6px",
              }}
            >
              {/* Left Arrow Button */}
              <button
                onClick={() => scrollTabs("left")}
                disabled={!canScrollLeft}
                aria-label="Scroll sub-nav left"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  border: canScrollLeft ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: canScrollLeft ? "#2563eb" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canScrollLeft ? "pointer" : "default",
                  flexShrink: 0,
                  opacity: canScrollLeft ? 1 : 0.4,
                  transition: "all 0.15s ease",
                  padding: 0,
                }}
              >
                <ChevronLeft size={14} />
              </button>

              {/* Scrollable Track */}
              <div
                ref={mobileTabsRef}
                onScroll={checkTabsScroll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  overflowX: "auto",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                  flex: 1,
                }}
              >
                {navTabs.map((t) => {
                  const isActive = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleTabChange(t.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: isActive ? "1px solid #cbd5e1" : "1px solid transparent",
                        background: isActive ? "#ffffff" : "transparent",
                        color: isActive ? "#2563eb" : "#475569",
                        fontSize: 12,
                        fontWeight: isActive ? 800 : 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Arrow Button */}
              <button
                onClick={() => scrollTabs("right")}
                disabled={!canScrollRight}
                aria-label="Scroll sub-nav right"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  border: canScrollRight ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: canScrollRight ? "#2563eb" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canScrollRight ? "pointer" : "default",
                  flexShrink: 0,
                  opacity: canScrollRight ? 1 : 0.4,
                  transition: "all 0.15s ease",
                  padding: 0,
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "4px",
                display: "flex",
                alignItems: "center",
                gap: 4,
                overflowX: "auto",
              }}
            >
              {navTabs.map((t) => {
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTabChange(t.id)}
                    style={{
                      flex: 1,
                      minWidth: 150,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "9px 16px",
                      borderRadius: 9,
                      border: isActive ? "1px solid #cbd5e1" : "1px solid transparent",
                      background: isActive ? "#ffffff" : "transparent",
                      color: isActive ? "#0f172a" : "#64748b",
                      fontSize: 13,
                      fontWeight: isActive ? 800 : 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: isActive ? "0 2px 6px rgba(15, 23, 42, 0.06)" : "none",
                      whiteSpace: "nowrap",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            ANIMATED TAB CONTENT SWITCHER
        ══════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {/* ══════════════════════════════════════════════════════════
              TAB 1: OVERVIEW / TRAJECTORY
          ══════════════════════════════════════════════════════════ */}
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 20 }}
            >
              {/* 4 Metric Cards (2x2 on Mobile) */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(230px, 1fr))", gap: isMobile ? 8 : 16 }}>
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 14, padding: isMobile ? "12px 14px" : "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: isMobile ? 9.5 : 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Cumulative CGPA
                  </div>
                  <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: "#2563eb", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                    {cgpa}
                  </div>
                  <div style={{ fontSize: isMobile ? 10.5 : 12, color: "#64748b", marginTop: 2 }}>
                    Across {results.length} sems
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 14, padding: isMobile ? "12px 14px" : "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: isMobile ? 9.5 : 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Latest SGPA
                  </div>
                  <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: "#0f172a", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                    {latestSgpa?.toFixed(2)}
                  </div>
                  <div style={{ fontSize: isMobile ? 10.5 : 12, color: "#64748b", marginTop: 2 }}>
                    Semester {latestSemester} exam
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 14, padding: isMobile ? "12px 14px" : "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: isMobile ? 9.5 : 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Earned Credits
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginTop: 2 }}>
                    <span style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>
                      {creditsCleared}
                    </span>
                    <span style={{ fontSize: isMobile ? 11 : 14, color: "#64748b", fontWeight: 700 }}>/ {totalCredits} Cr</span>
                  </div>
                  <div style={{ width: "100%", height: 5, background: "#e2e8f0", borderRadius: 4, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min((creditsCleared / 160) * 100, 100)}%`, background: "#2563eb", borderRadius: 4 }} />
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 14, padding: isMobile ? "12px 14px" : "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: isMobile ? 9.5 : 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Academic Standing
                  </div>
                  <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: backlogs.length ? "#dc2626" : "#15803d", marginTop: 2 }}>
                    {backlogs.length ? `${backlogs.length} Backlogs` : "All Clear"}
                  </div>
                  <div style={{ fontSize: isMobile ? 10.5 : 12, color: "#64748b", marginTop: 2 }}>
                    {backlogs.length ? "Remedial exams" : "Zero backlogs"}
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 16, padding: isMobile ? "14px 14px" : "22px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 12 : 18 }}>
                  <div>
                    <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <TrendingUp size={16} color="#2563eb" /> Performance Progression
                    </h3>
                    <p style={{ color: "#64748b", fontSize: isMobile ? 11 : 12.5, margin: 0 }}>
                      Performance trajectory across completed semesters
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: 11, fontWeight: 700 }}>
                    <span style={{ color: "#2563eb", display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb" }} /> SGPA
                    </span>
                    <span style={{ color: "#8b5cf6", display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#8b5cf6" }} /> CGPA
                    </span>
                  </div>
                </div>

                <div style={{ flex: 1, minHeight: isMobile ? 240 : 300 }}>
                  <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="sem" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />
                      <YAxis domain={[0, 10]} tick={{ fill: "#64748b", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: 10,
                          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                          color: "#0f172a",
                          fontSize: 12,
                        }}
                      />
                      <ReferenceLine
                        y={cgpa}
                        stroke="#8b5cf6"
                        strokeDasharray="4 4"
                        label={{ value: `CGPA ${cgpa}`, fill: "#8b5cf6", fontSize: 10, fontWeight: 700 }}
                      />
                      <Line type="monotone" dataKey="SGPA" stroke="#2563eb" strokeWidth={3} dot={{ fill: "#2563eb", r: 3.5 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="CGPA" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 5" dot={{ fill: "#8b5cf6", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: GRADE DISTRIBUTION
          ══════════════════════════════════════════════════════════ */}
          {tab === "grades" && (
            <motion.div
              key="grades"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 20 }}
            >
              {/* 4 Grade KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(230px, 1fr))", gap: isMobile ? 8 : 16 }}>
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 14, padding: isMobile ? "12px 14px" : "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: isMobile ? 9.5 : 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Total Graded Courses
                  </div>
                  <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: "#0f172a", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                    {totalGradedCount} <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Subs</span>
                  </div>
                  <div style={{ fontSize: isMobile ? 10.5 : 12, color: "#64748b", marginTop: 2 }}>
                    Across all completed semesters
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 14, padding: isMobile ? "12px 14px" : "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: isMobile ? 9.5 : 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Honours Grade Ratio (O/E/A)
                  </div>
                  <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: "#15803d", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                    {honorsGradeRatio}%
                  </div>
                  <div style={{ fontSize: isMobile ? 10.5 : 12, color: "#64748b", marginTop: 2 }}>
                    Top tier academic performance
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 14, padding: isMobile ? "12px 14px" : "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: isMobile ? 9.5 : 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Outstanding 'O' Grades (10 Pts)
                  </div>
                  <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: "#b45309", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                    {gradeDistributionData.find((d) => d.grade === "O")?.count || 0}
                  </div>
                  <div style={{ fontSize: isMobile ? 10.5 : 12, color: "#64748b", marginTop: 2 }}>
                    Maximum score courses
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 14, padding: isMobile ? "12px 14px" : "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: isMobile ? 9.5 : 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Remedial / Backlogs
                  </div>
                  <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: backlogs.length ? "#dc2626" : "#15803d", marginTop: 2 }}>
                    {backlogs.length ? `${backlogs.length} Pending` : "100% Passed"}
                  </div>
                  <div style={{ fontSize: isMobile ? 10.5 : 12, color: "#64748b", marginTop: 2 }}>
                    {backlogs.length ? "Active backlogs" : "Zero backlogs"}
                  </div>
                </div>
              </div>

              {/* Grade Distribution BarChart Card */}
              <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 16, padding: isMobile ? "14px 14px" : "24px 26px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: isMobile ? 12 : 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <BarChart2 size={16} color="#8b5cf6" /> Overall Grade Distribution & Frequencies
                    </h3>
                    <p style={{ color: "#64748b", fontSize: isMobile ? 11 : 12.5, margin: 0 }}>
                      Complete breakdown of letter grades across all completed academic semesters
                    </p>
                  </div>
                </div>

                <div style={{ minHeight: isMobile ? 220 : 280 }}>
                  <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
                    <BarChart data={gradeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="grade" tick={{ fill: "#334155", fontSize: 12, fontWeight: 800 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: 10,
                          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                          color: "#0f172a",
                          fontSize: 12,
                        }}
                        formatter={(value, name, item) => [
                          `${value} Subjects (${item.payload.pct}%)`,
                          `Grade ${item.payload.grade} (${item.payload.label})`,
                        ]}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {gradeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Grade Chips Grid */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
                  {gradeDistributionData.map((g) => (
                    <div
                      key={g.grade}
                      style={{
                        background: g.bg,
                        border: `1px solid ${g.border}`,
                        borderRadius: 10,
                        padding: "10px 12px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: g.color, fontFamily: "'Space Mono', monospace" }}>{g.grade}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>({g.pts} pts)</span>
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                        {g.count} <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>({g.pct}%)</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1 }}>{g.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: PLACEMENT & COMPANIES
          ══════════════════════════════════════════════════════════ */}
          {tab === "placement" && (
            <motion.div
              key="placement"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 16,
                padding: isMobile ? "14px 14px" : "24px 26px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <CompanyEligibility branch={dynamicBranch} cgpa={cgpa} regNo={regNo} />
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4: SUBJECT MASTERY & INSIGHTS
          ══════════════════════════════════════════════════════════ */}
          {tab === "mastery" && (
            <motion.div
              key="mastery"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 20 }}
            >
              {/* Radar Chart Card */}
              <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 16, padding: isMobile ? "14px 14px" : "22px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: isMobile ? 12 : 18 }}>
                  <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0", display: "flex", alignItems: "center", gap: 6 }}>
                    <Target size={16} color="#d97706" /> Curriculum Mastery Profile
                  </h3>
                  <p style={{ color: "#64748b", fontSize: isMobile ? 11 : 12.5, margin: 0 }}>
                    Weighted score distribution across Theory, Practical, and Project components
                  </p>
                </div>

                <div style={{ flex: 1, minHeight: isMobile ? 240 : 280 }}>
                  <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
                    <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "65%" : "75%"} data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#334155", fontSize: 11, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Mastery Score" dataKey="score" stroke="#d97706" fill="#f59e0b" fillOpacity={0.25} />
                      <Tooltip
                        contentStyle={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontSize: 11.5 }}
                        formatter={(v) => [`${v.toFixed(1)} / 100`, "Mastery Index"]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Insights Card */}
              <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 16, padding: isMobile ? "14px 14px" : "24px 26px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: isMobile ? 10 : 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <Sparkles size={16} color="#2563eb" /> Performance Observations & Highlights
                    </h3>
                    <p style={{ color: "#64748b", fontSize: isMobile ? 11 : 12.5, margin: 0 }}>
                      Intelligent academic highlights synthesized from transcript records
                    </p>
                  </div>
                  <span style={{ fontSize: isMobile ? 10.5 : 11.5, fontWeight: 700, color: "#15803d", background: "#dcfce7", border: "1px solid #bbf7d0", padding: "2px 7px", borderRadius: 6 }}>
                    {insights.length} Observations
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(360px, 1fr))", gap: isMobile ? 8 : 12 }}>
                  {insights.map((ins, idx) => {
                    const style = insightColors[ins.type] || insightColors.info;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: isMobile ? "10px 12px" : "14px 16px",
                          background: style.bg,
                          border: `1px solid ${style.border}`,
                          borderRadius: 12,
                        }}
                      >
                        <div style={{ marginTop: 2, flexShrink: 0 }}>{ins.icon}</div>
                        <div style={{ fontSize: isMobile ? 12 : 13.5, color: "#0f172a", fontWeight: 600, lineHeight: 1.4 }}>
                          {ins.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 5: CGPA GOAL PREDICTOR
          ══════════════════════════════════════════════════════════ */}
          {tab === "predictor" && (
            <motion.div
              key="predictor"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 20 }}
            >
              {/* Input & Calculator Card */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 16,
                  padding: isMobile ? "14px 14px" : "26px 28px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 14px rgba(15,23,42,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? 14 : 22,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <Target size={18} color="#16a34a" /> Target CGPA Goal Predictor
                    </h3>
                    <p style={{ color: "#64748b", fontSize: isMobile ? 11.5 : 13, margin: 0 }}>
                      Calculate the exact SGPA needed across remaining {remainingSems} semester(s)
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: isMobile ? 11 : 12, color: "#64748b", fontWeight: 700 }}>Quick Targets:</span>
                    {[8.5, 8.75, 9.0, 9.25, 9.5].map((val) => (
                      <button
                        key={val}
                        onClick={() => setTargetCGPA(String(val))}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          border: targetCGPA === String(val) ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
                          background: targetCGPA === String(val) ? "#dcfce7" : "#ffffff",
                          color: targetCGPA === String(val) ? "#15803d" : "#334155",
                          fontSize: isMobile ? 11 : 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          fontFamily: "'Space Mono', monospace",
                          transition: "all 0.1s ease",
                        }}
                      >
                        {val.toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3 Metric Inputs */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: isMobile ? 10 : 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: isMobile ? 10.5 : 11.5, fontWeight: 800, color: "#475569", marginBottom: 4, textTransform: "uppercase" }}>
                      CURRENT CUMULATIVE CGPA
                    </label>
                    <input
                      value={cgpa}
                      disabled
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 12px",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: 10,
                        fontWeight: 800,
                        color: "#0f172a",
                        fontSize: 15,
                        fontFamily: "'Space Mono', monospace",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: isMobile ? 10.5 : 11.5, fontWeight: 800, color: "#475569", marginBottom: 4, textTransform: "uppercase" }}>
                      REMAINING SEMESTERS
                    </label>
                    <input
                      value={`${remainingSems} Semesters`}
                      disabled
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 12px",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: 10,
                        fontWeight: 800,
                        color: "#0f172a",
                        fontSize: 15,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: isMobile ? 10.5 : 11.5, fontWeight: 800, color: "#475569", marginBottom: 4, textTransform: "uppercase" }}>
                      YOUR TARGET GRADUATION CGPA
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={targetCGPA}
                      onChange={(e) => setTargetCGPA(e.target.value)}
                      placeholder="e.g. 9.20"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 12px",
                        background: "#ffffff",
                        border: "1.5px solid #16a34a",
                        borderRadius: 10,
                        fontWeight: 800,
                        color: "#0f172a",
                        fontSize: 15,
                        outline: "none",
                        fontFamily: "'Space Mono', monospace",
                      }}
                    />
                  </div>
                </div>

                {/* Prediction Result Display */}
                {requiredSGPA && (
                  <div
                    style={{
                      background: parseFloat(requiredSGPA) > 10 ? "#fef2f2" : "#f0fdf4",
                      border: `1px solid ${parseFloat(requiredSGPA) > 10 ? "#fecaca" : "#bbf7d0"}`,
                      borderRadius: 14,
                      padding: isMobile ? "14px 16px" : "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                        Required SGPA in Each Remaining Semester
                      </div>
                      <div
                        style={{
                          fontSize: isMobile ? 28 : 38,
                          fontWeight: 900,
                          color: parseFloat(requiredSGPA) > 10 ? "#dc2626" : "#15803d",
                          margin: "4px 0",
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        {requiredSGPA}
                      </div>
                      {parseFloat(requiredSGPA) > 10 ? (
                        <p style={{ color: "#dc2626", fontSize: isMobile ? 11.5 : 13, margin: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertTriangle size={14} /> This target requires SGPA &gt; 10.0 (impossible).
                        </p>
                      ) : parseFloat(requiredSGPA) <= 0 ? (
                        <p style={{ color: "#15803d", fontSize: isMobile ? 11.5 : 13, margin: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle size={14} /> You already have enough credits to clear this target!
                        </p>
                      ) : (
                        <p style={{ color: "#15803d", fontSize: isMobile ? 11.5 : 13, margin: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle size={14} /> Maintain average SGPA of {requiredSGPA} across remaining semesters.
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: 10,
                        padding: isMobile ? "8px 12px" : "12px 18px",
                        textAlign: "right",
                      }}
                    >
                      <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>Trajectory Gap</div>
                      <div style={{ fontSize: isMobile ? 13.5 : 16, fontWeight: 800, color: "#0f172a", fontFamily: "'Space Mono', monospace", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                        <span>{cgpa}</span>
                        <ArrowRight size={14} color="#64748b" />
                        <span>{parseFloat(targetCGPA).toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: "#16a34a", fontWeight: 700, marginTop: 1 }}>
                        +{(parseFloat(targetCGPA) - cgpa).toFixed(2)} Delta
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Degree Classification Tiers */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 16,
                  padding: isMobile ? "14px 14px" : "24px 28px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <h4 style={{ fontSize: isMobile ? 13.5 : 15, fontWeight: 800, color: "#0f172a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <GraduationCap size={16} color="#2563eb" /> Degree Honours & Classification Thresholds
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
                  {[
                    { label: "Distinction", req: 9.0, color: "#b45309", bg: "#fef3c7" },
                    { label: "First Class with Distinction", req: 8.5, color: "#1d4ed8", bg: "#eff6ff" },
                    { label: "First Class", req: 7.5, color: "#15803d", bg: "#f0fdf4" },
                    { label: "Second Class", req: 6.0, color: "#475569", bg: "#f1f5f9" },
                  ].map((c) => {
                    const isAchieved = cgpa >= c.req;
                    return (
                      <div
                        key={c.label}
                        style={{
                          padding: isMobile ? "10px 12px" : "14px 16px",
                          background: isAchieved ? c.bg : "#ffffff",
                          border: `1px solid ${isAchieved ? c.color + "40" : "#cbd5e1"}`,
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: isMobile ? 12.5 : 13.5, fontWeight: 800, color: "#0f172a" }}>{c.label}</div>
                          <div style={{ fontSize: isMobile ? 10.5 : 11.5, color: "#64748b", fontWeight: 600 }}>CGPA ≥ {c.req}</div>
                        </div>
                        {isAchieved ? (
                          <span style={{ fontSize: 10.5, fontWeight: 800, color: c.color, display: "flex", alignItems: "center", gap: 3 }}>
                            <Check size={12} /> Achieved
                          </span>
                        ) : (
                          <span style={{ fontSize: 10.5, fontWeight: 600, color: "#94a3b8" }}>Pending</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 6: WHAT-IF SIMULATION LAB
          ══════════════════════════════════════════════════════════ */}
          {tab === "whatif" && (
            <motion.div
              key="whatif"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 20 }}
            >
              {/* Header & Quick Simulator Controls */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 16,
                  padding: isMobile ? "14px 14px" : "24px 26px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 14px rgba(15,23,42,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? 12 : 18,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <PieChart size={18} color="#8b5cf6" /> What-If Semester Grade Simulation Studio
                    </h3>
                    <p style={{ color: "#64748b", fontSize: isMobile ? 11.5 : 13, margin: 0 }}>
                      Simulate grade variations in Sem {latestSemester} to see instant real-time SGPA and CGPA changes
                    </p>
                  </div>

                  {/* Quick Presets */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        const allO = {};
                        latestSubjects.forEach((s) => (allO[s.subCode] = "O"));
                        setWhatIfGrades(allO);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: isMobile ? "5px 10px" : "6px 12px",
                        borderRadius: 8,
                        border: "1px solid #fde68a",
                        background: "#fef3c7",
                        color: "#b45309",
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      <Zap size={12} /> Max Out (All O)
                    </button>

                    <button
                      onClick={() => {
                        const allE = {};
                        latestSubjects.forEach((s) => (allE[s.subCode] = "E"));
                        setWhatIfGrades(allE);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: isMobile ? "5px 10px" : "6px 12px",
                        borderRadius: 8,
                        border: "1px solid #bbf7d0",
                        background: "#dcfce7",
                        color: "#15803d",
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      All E (9 Pts)
                    </button>

                    <button
                      onClick={() => setWhatIfGrades({})}
                      disabled={Object.keys(whatIfGrades).length === 0}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: isMobile ? "5px 10px" : "6px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        background: Object.keys(whatIfGrades).length === 0 ? "#f1f5f9" : "#ffffff",
                        color: Object.keys(whatIfGrades).length === 0 ? "#94a3b8" : "#334155",
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 700,
                        cursor: Object.keys(whatIfGrades).length === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                  </div>
                </div>

                {/* Side by Side Simulation Metric Cards */}
                {whatIfCGPA !== null && (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: isMobile ? 10 : 16 }}>
                    <div
                      style={{
                        background: "#eff6ff",
                        border: "1.5px solid #bfdbfe",
                        borderRadius: 14,
                        padding: isMobile ? "14px 16px" : "20px 24px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>
                          Simulated CGPA
                        </span>
                        <span
                          style={{
                            fontSize: isMobile ? 10.5 : 11.5,
                            fontWeight: 800,
                            background: parseFloat(whatIfCGPA) >= cgpa ? "#dcfce7" : "#fee2e2",
                            color: parseFloat(whatIfCGPA) >= cgpa ? "#15803d" : "#b91c1c",
                            padding: "2px 7px",
                            borderRadius: 6,
                          }}
                        >
                          {parseFloat(whatIfCGPA) >= cgpa
                            ? `+${(whatIfCGPA - cgpa).toFixed(2)} Gain`
                            : `${(whatIfCGPA - cgpa).toFixed(2)} Drop`}
                        </span>
                      </div>

                      <div style={{ fontSize: isMobile ? 28 : 40, fontWeight: 900, color: "#1d4ed8", fontFamily: "'Space Mono', monospace", margin: "4px 0" }}>
                        <AnimatedNumber value={parseFloat(whatIfCGPA)} />
                      </div>
                      <div style={{ fontSize: isMobile ? 11 : 12.5, color: "#64748b" }}>
                        Baseline CGPA: <strong style={{ color: "#0f172a" }}>{cgpa}</strong>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1.5px solid #bbf7d0",
                        borderRadius: 14,
                        padding: isMobile ? "14px 16px" : "20px 24px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 800, color: "#15803d", textTransform: "uppercase" }}>
                          Simulated Sem {latestSemester} SGPA
                        </span>
                        <span
                          style={{
                            fontSize: isMobile ? 10.5 : 11.5,
                            fontWeight: 800,
                            background: parseFloat(whatIfSGPA) >= latestSgpa ? "#dcfce7" : "#fee2e2",
                            color: parseFloat(whatIfSGPA) >= latestSgpa ? "#15803d" : "#b91c1c",
                            padding: "2px 7px",
                            borderRadius: 6,
                          }}
                        >
                          {parseFloat(whatIfSGPA) >= latestSgpa
                            ? `+${(whatIfSGPA - latestSgpa).toFixed(2)} Gain`
                            : `${(whatIfSGPA - latestSgpa).toFixed(2)} Drop`}
                        </span>
                      </div>

                      <div style={{ fontSize: isMobile ? 28 : 40, fontWeight: 900, color: "#16a34a", fontFamily: "'Space Mono', monospace", margin: "4px 0" }}>
                        <AnimatedNumber value={parseFloat(whatIfSGPA)} />
                      </div>
                      <div style={{ fontSize: isMobile ? 11 : 12.5, color: "#64748b" }}>
                        Baseline SGPA: <strong style={{ color: "#0f172a" }}>{latestSgpa?.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Subject Grade Modification Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(360px, 1fr))", gap: isMobile ? 10 : 14 }}>
                {latestSubjects.map((s) => {
                  const currentSimGrade = whatIfGrades[s.subCode] || s.grade;
                  const isModified = Boolean(whatIfGrades[s.subCode] && whatIfGrades[s.subCode] !== s.grade);
                  const originalMeta = GRADE_META[s.grade] || GRADE_META.F;
                  const simMeta = GRADE_META[currentSimGrade] || GRADE_META.F;

                  return (
                    <div
                      key={s.subCode}
                      style={{
                        background: "#ffffff",
                        border: isModified ? `2px solid #8b5cf6` : "1px solid #cbd5e1",
                        borderRadius: 14,
                        padding: isMobile ? "12px 14px" : "16px 18px",
                        boxShadow: isModified
                          ? "0 4px 14px rgba(139, 92, 246, 0.08)"
                          : "0 1px 3px rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ fontWeight: 800, fontSize: isMobile ? 13 : 14, color: "#0f172a", lineHeight: 1.3 }}>
                            {s.subName}
                          </div>
                          {isModified && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                background: "#f3e8ff",
                                color: "#7e22ce",
                                border: "1px solid #e9d5ff",
                                padding: "1px 5px",
                                borderRadius: 5,
                                flexShrink: 0,
                              }}
                            >
                              Simulated
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: isMobile ? 11 : 12, color: "#64748b", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{s.subCode}</span>
                          <span>•</span>
                          <span>{s.credit} Credits</span>
                          <span>•</span>
                          <span>
                            Original: <strong style={{ color: originalMeta.color }}>{s.grade}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Segmented Grade Pills */}
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>
                          Select Simulated Grade:
                        </div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {GRADE_ORDER.map((g) => {
                            const gMeta = GRADE_META[g];
                            const isSelected = currentSimGrade === g;
                            return (
                              <button
                                key={g}
                                onClick={() => setWhatIfGrades({ ...whatIfGrades, [s.subCode]: g })}
                                style={{
                                  flex: "1 1 30px",
                                  minWidth: 28,
                                  height: isMobile ? 28 : 32,
                                  borderRadius: 7,
                                  border: isSelected ? `2px solid ${gMeta.color}` : "1px solid #cbd5e1",
                                  background: isSelected ? gMeta.bg : "#ffffff",
                                  color: isSelected ? gMeta.color : "#334155",
                                  fontSize: isMobile ? 12 : 13,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  fontFamily: "'Space Mono', monospace",
                                  transition: "all 0.1s ease",
                                  padding: 0,
                                }}
                              >
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}