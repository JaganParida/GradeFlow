import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  Spinner,
  DashboardSkeleton,
  ReportCardSkeleton,
  InternalMarksSkeleton,
} from "../components/LoadingSpinner";
import { encodeStudentId, decodeStudentId, isEncryptedToken } from "../utils/studentIdEncoder";
import GradeSheet from "../components/GradeSheet";
import BasketDashboard from "../components/BasketDashboard";
import TargetPredictor from "../components/TargetPredictor";
import StudentSectionNavigation from "../components/StudentSectionNavigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  TrendingUp,
  Star,
  Target,
  CheckCircle,
  Trophy,
  Award,
  AlertTriangle,
  FileText,
  FileEdit,
  Calendar,
  Printer,
  Share2,
  DownloadCloud,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Layout,
  Calculator,
  Info,
  X,
  List,
  Crown,
  Activity,
  ArrowRight,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Layers,
  Medal,
  Check,
} from "lucide-react";
import { calculateSGPA as calcSGPAFromSubjects, calculateSemesterMetrics, calculateCGPA, FAIL_GRADES } from "../utils/gradeCalculations";

/* ─── Custom WhatsApp SVG Icon ───────────────────────────────────── */
const WhatsAppIcon = ({ size = 16, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const GRADE_COLORS = {
  O: "#f59e0b",
  E: "#22c55e",
  A: "#3b82f6",
  B: "#8b5cf6",
  C: "#f97316",
  D: "#64748b",
  F: "#ef4444",
};

const MARK_PLACEHOLDER = "-";

function isMarkAvailable(value) {
  return value !== undefined && value !== null && value !== "" && !Number.isNaN(Number(value));
}

function hasPositiveMarkValue(value) {
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  if (text === "" || text === MARK_PLACEHOLDER) return false;
  const num = Number(text);
  return Number.isFinite(num) && num > 0;
}

function formatMark(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return MARK_PLACEHOLDER;
  return Number.isInteger(num) ? String(num) : String(Number(num.toFixed(2)));
}

function firstAvailableMark(...values) {
  return values.find((value) => isMarkAvailable(value));
}

function MarkValue({ value, max, color = "#2563eb", showMax = true }) {
  if (!isMarkAvailable(value)) {
    return <span style={{ color: "#94a3b8" }}>{MARK_PLACEHOLDER}</span>;
  }

  return (
    <span
      style={{
        display: "inline-block",
        color,
        fontWeight: 700,
        background: `${color}12`,
        border: `1px solid ${color}25`,
        padding: "3px 8px",
        borderRadius: 6,
        whiteSpace: "nowrap",
        fontSize: 12.5,
      }}
    >
      {formatMark(value)}
      {showMax && isMarkAvailable(max) && (
        <span style={{ color: `${color}99`, fontSize: 10, fontWeight: 500 }}>/{formatMark(max)}</span>
      )}
    </span>
  );
}

function getInternalAssessments(subject, semester) {
  const isSem1 = Number(semester) === 1;
  const sem1Assessment = (label, obtained, max) => ({
    label,
    obtained,
    max,
    secondary: isMarkAvailable(obtained) ? max : null,
    secondaryLabel: "MAX",
  });
  const regularAssessment = (label, obtained, max, roundOff) => ({
    label,
    obtained,
    max,
    secondary: firstAvailableMark(
      isMarkAvailable(roundOff) ? Math.round(Number(roundOff)) : null,
      isMarkAvailable(obtained) ? Math.round(Number(obtained)) : null
    ),
    secondaryLabel: "RND",
  });

  if (isSem1) {
    return [
      sem1Assessment("Class Test I", subject.classTest1Obtained, subject.classTest1Max),
      sem1Assessment("Class Test II", subject.classTest2Obtained, subject.classTest2Max),
      sem1Assessment("Class Test III", subject.classTest3Obtained, subject.classTest3Max),
      sem1Assessment("Class Test IV", subject.classTest4Obtained, subject.classTest4Max),
      sem1Assessment("Assignment", subject.assignmentObtained, subject.assignmentMax),
    ];
  }

  return [
    regularAssessment("Mid Sem", subject.midSemObtained, subject.midSemMax, subject.midSemRoundOff),
    regularAssessment("Presentation", subject.presentationObtained, subject.presentationMax, subject.presentationRoundOff),
    regularAssessment("Assignment", subject.assignmentObtained, subject.assignmentMax, subject.assignmentRoundOff),
    regularAssessment("Learning Record", subject.learningRecordObtained, subject.learningRecordMax, subject.learningRecordRoundOff),
    regularAssessment("Internal Prac", subject.internalPracticalObtained, subject.internalPracticalMax, subject.internalPracticalRoundOff),
    regularAssessment("Project Internal", subject.projectInternalObtained, subject.projectInternalMax, subject.projectInternalRoundOff),
  ];
}

function getSubjectTotal(subject, semester, assessments = getInternalAssessments(subject, semester)) {
  const isSem1 = Number(semester) === 1;
  const scoreValues = assessments
    .map((assessment) => (isSem1 ? assessment.obtained : assessment.secondary))
    .filter(isMarkAvailable);
  const maxValues = assessments.map((assessment) => assessment.max).filter(isMarkAvailable);
  const hasComponentScore = scoreValues.length > 0;
  const computedScore = scoreValues.reduce((sum, value) => sum + Number(value), 0);
  const computedMax = maxValues.reduce((sum, value) => sum + Number(value), 0);
  const explicitTotalScore =
    isMarkAvailable(subject.totalScore) && (Number(subject.totalScore) !== 0 || hasComponentScore)
      ? subject.totalScore
      : null;
  const score = firstAvailableMark(explicitTotalScore, hasComponentScore ? computedScore : null);
  const explicitTotalMax = isMarkAvailable(subject.totalMax) ? subject.totalMax : null;
  const explicitMaxLooksValid =
    explicitTotalMax === null ||
    !isSem1 ||
    !isMarkAvailable(score) ||
    Number(explicitTotalMax) >= Number(score);
  const computedMaxLooksValid = !isMarkAvailable(score) || computedMax >= Number(score);
  const sem1DefaultMax =
    isSem1 && isMarkAvailable(score) && Number(score) <= 50 ? 50 : null;
  const max = firstAvailableMark(
    explicitMaxLooksValid ? explicitTotalMax : null,
    computedMax > 0 && computedMaxLooksValid ? computedMax : null,
    sem1DefaultMax,
  );

  return {
    hasAny: isMarkAvailable(score),
    score,
    max,
  };
}

function hasSubjectInternalScore(subject, semester) {
  const isSem1 = Number(semester) === 1;
  const marksKeys = isSem1 ? [
    'classTest1Obtained', 'classTest2Obtained', 'classTest3Obtained', 'classTest4Obtained', 'assignmentObtained', 'totalScore'
  ] : [
    'midSemObtained', 'presentationObtained', 'assignmentObtained', 'learningRecordObtained', 'internalPracticalObtained', 'projectInternalObtained', 'totalScore'
  ];
  
  return marksKeys.some((key) => hasPositiveMarkValue(subject[key]));
}

function getSortedInternalSubjects(internalMarks) {
  const subjects = internalMarks?.subjects || [];
  const semester = internalMarks?.semester;

  return [...subjects].sort((a, b) => {
    const hasA = hasSubjectInternalScore(a, semester);
    const hasB = hasSubjectInternalScore(b, semester);
    if (hasA !== hasB) return hasB ? 1 : -1;
    
    // Sort by total score descending if both have scores
    const totalA = Number(a.totalScore || 0);
    const totalB = Number(b.totalScore || 0);
    if (totalA !== totalB) return totalB - totalA;

    return (a.subName || "").localeCompare(b.subName || "");
  });
}

function GradeBadge({ grade }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: GRADE_COLORS[grade] + "18",
        color: GRADE_COLORS[grade] || "#64748b",
        border: `1px solid ${GRADE_COLORS[grade] || "#cbd5e1"}33`,
        padding: "2px 9px",
        borderRadius: 6,
        fontWeight: 700,
        fontSize: 12.5,
      }}
    >
      {grade}
    </span>
  );
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
  
  return fallbackBranch || "—";
}

function getSectionFromRegNo(regNo) {
  if (!regNo) return "J";
  const r = String(regNo).trim();
  if (r === "230301180026") return "I";
  
  if (r.startsWith("230301120")) {
     const num = parseInt(r.slice(-3), 10);
     if (num >= 1 && num <= 60) return "A";
     if (num >= 61 && num <= 120) return "B";
     if (num >= 121 && num <= 180) return "C";
     if (num >= 181 && num <= 240) return "D";
     if (num >= 241 && num <= 300) return "E";
     if (num >= 301 && num <= 360) return "F";
     if (num >= 361 && num <= 420) return "G";
     if (num >= 421 && num <= 480) return "H";
     if (num >= 481 && num <= 549) return "I";
  }
  return "J";
}

export default function Dashboard() {
  const { regNo: urlParam } = useParams();
  const regNo = decodeStudentId(urlParam);
  const { studentData, fetchStudent, loading, error, API } = useApp();
  const navigate = useNavigate();

  // Normalize URL to obfuscated token if raw registration number is provided
  useEffect(() => {
    if (regNo && urlParam && !isEncryptedToken(urlParam)) {
      navigate(`/dashboard/${encodeStudentId(regNo)}`, { replace: true });
    }
  }, [urlParam, regNo, navigate]);

  const normalizeTabParam = (raw) => {
    if (!raw) return "result";
    const p = String(raw).toLowerCase();
    if (["baskets", "basket", "degree-progress", "degree", "credits"].includes(p)) return "baskets";
    if (["result", "timetable", "internal", "history", "predictor"].includes(p)) return p;
    return "result";
  };

  const [tab, setTab] = useState(() => {
    try {
      const qTab = new URLSearchParams(window.location.search).get("tab");
      return normalizeTabParam(qTab);
    } catch (_) {}
    return "result";
  });

  useEffect(() => {
    try {
      const qTab = new URLSearchParams(window.location.search).get("tab");
      if (qTab) {
        setTab(normalizeTabParam(qTab));
      }
    } catch (_) {}
  }, [window.location.search]);
  const [selectedSem, setSelectedSem] = useState(null);
  const [semResult, setSemResult] = useState(null);
  const [isDownloadingBatch, setIsDownloadingBatch] = useState(false);
  const [expandedBacklog, setExpandedBacklog] = useState(null);
  const [highlightedSubject, setHighlightedSubject] = useState(null);
  const [isBacklogsListExpanded, setIsBacklogsListExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [internalMarks, setInternalMarks] = useState(null);
  const [isInternalLoading, setIsInternalLoading] = useState(false);
  const [internalPage, setInternalPage] = useState(1);
  const [semesterRanking, setSemesterRanking] = useState(null);
  const semCacheRef = useRef({});
  const mobileTabsRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkTabsScroll = () => {
    if (mobileTabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = mobileTabsRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  const centerActiveTab = (behavior = "smooth") => {
    if (mobileTabsRef.current) {
      const container = mobileTabsRef.current;
      const activeEl = container.querySelector(`[data-tab-id="${tab}"]`);
      if (activeEl) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const currentScroll = container.scrollLeft;
        const targetScroll = currentScroll + (activeRect.left - containerRect.left) - (containerRect.width / 2) + (activeRect.width / 2);
        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior,
        });
        setTimeout(checkTabsScroll, 250);
      }
    }
  };

  const scrollTabs = (direction) => {
    if (mobileTabsRef.current) {
      const scrollAmount = direction === "left" ? -150 : 150;
      mobileTabsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkTabsScroll, 200);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      checkTabsScroll();
      centerActiveTab("auto");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    centerActiveTab("smooth");
    checkTabsScroll();
  }, [tab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      centerActiveTab("auto");
      checkTabsScroll();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const downloadFullTranscript = async () => {
    setIsDownloadingBatch(true);
    
    setTimeout(async () => {
      try {
        const { default: jsPDF } = await import("jspdf");
        const { default: html2canvas } = await import("html2canvas");
        const pdf = new jsPDF("p", "mm", "a4");
        
        for (let i = 0; i < studentData.results.length; i++) {
          const r = studentData.results[i];
          const element = document.getElementById(`gradesheet-capture-${r.semester}`);
          if (!element) continue;
          
          await new Promise(resolve => setTimeout(resolve, 150));
          
          const canvas = await html2canvas(element, { scale: 4, useCORS: true });
          const imgData = canvas.toDataURL("image/png");
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        }
        
        pdf.save(`${studentData.studentName}_Full_Transcript.pdf`);
      } catch (err) {
        console.error(err);
        alert("Failed to export full transcript.");
      } finally {
        setIsDownloadingBatch(false);
      }
    }, 1500);
  };

  const shareSemResult = () => {
    if (!studentData) return;

    const currentResult =
      semResult && semResult.semester === selectedSem
        ? semResult
        : studentData.results?.find((r) => r.semester === selectedSem) || semResult;

    const subjects = currentResult?.subjects || [];
    const studentBranch = getDynamicBranch(regNo, studentData.branch);
    const studentSec = getSectionFromRegNo(regNo);

    const { totalCredits, creditsCleared, sgpa: calculatedSgpa } = calculateSemesterMetrics(
      subjects,
      selectedSem
    );
    const semSgpa =
      subjects && subjects.length > 0
        ? calculatedSgpa
        : typeof currentResult?.sgpa === "number"
        ? currentResult.sgpa
        : null;

    const hasFailed = subjects.some((s) => (FAIL_GRADES || ["F", "R", "S", "M"]).includes(s.grade));
    const cgpaUpToNow = calculateCGPA(studentData.results || [], selectedSem);

    let subjectText = "";
    if (subjects.length > 0) {
      subjectText = subjects
        .map((s, idx) => {
          const code = s.subCode ? ` (${s.subCode})` : "";
          const name = (s.subName || s.subjectName || "Subject").toUpperCase();
          const cr = s.credit !== undefined ? s.credit : (s.credits !== undefined ? s.credits : "-");
          const gr = s.grade || "-";
          return `${idx + 1}. *${name}*${code}\n   Grade: *${gr}* | Credits: ${cr}`;
        })
        .join("\n\n");
    } else {
      subjectText = "No subject records available.";
    }

    const currentRanking =
      semCacheRef.current[selectedSem]?.ranking ||
      semesterRanking ||
      (selectedSem === studentData.latestSemester ? studentData.ranking : null);

    let rankLines = [];
    if (currentRanking) {
      if (currentRanking.deptRank) rankLines.push(`Dept Rank: #${currentRanking.deptRank}`);
      if (currentRanking.sgpaRank) rankLines.push(`SGPA Rank: #${currentRanking.sgpaRank}`);
      if (currentRanking.universityRank) rankLines.push(`Univ Rank: #${currentRanking.universityRank}`);
    }

    // Keep the shared credit figures aligned with the dashboard's semester metrics.
    const semesterCreditSummary = (studentData.results || [])
      .slice()
      .sort((a, b) => Number(a.semester) - Number(b.semester))
      .map((result) => {
        const metrics = calculateSemesterMetrics(result.subjects || [], result.semester);
        return {
          semester: result.semester,
          totalCredits: metrics.totalCredits,
          creditsCleared: metrics.creditsCleared,
        };
      })
      .filter((summary) => summary.totalCredits > 0);

    const cumulativeCredits = semesterCreditSummary.reduce(
      (totals, summary) => ({
        totalCredits: totals.totalCredits + summary.totalCredits,
        creditsCleared: totals.creditsCleared + summary.creditsCleared,
      }),
      { totalCredits: 0, creditsCleared: 0 }
    );

    const semesterCreditText = semesterCreditSummary.length
      ? semesterCreditSummary
          .map(
            ({ semester, creditsCleared: cleared, totalCredits: total }) =>
              `• Semester ${semester}: ${cleared} / ${total} credits cleared`
          )
          .join("\n")
      : "• Credit information is not available.";

    const activeBacklogText = backlogs.length
      ? [
          `• ${backlogs.length} active backlog${backlogs.length > 1 ? "s" : ""}`,
          ...backlogs
            .slice()
            .sort((a, b) => Number(a.semester) - Number(b.semester))
            .map((backlog) => {
              const name = backlog.subName || backlog.subjectName || "Subject";
              const code = backlog.subCode ? ` (${backlog.subCode})` : "";
              const credit = Number(backlog.credit);
              const creditText = Number.isFinite(credit) && credit > 0 ? ` | ${credit} Credits` : "";
              return `• Semester ${backlog.semester}: ${name}${code} | Grade ${backlog.grade || "F"}${creditText}`;
            }),
        ].join("\n")
      : "• No active backlogs.";

    const message = [
      `*GRADEFLOW — SEMESTER ${selectedSem} RESULT REPORT*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `*STUDENT INFORMATION*`,
      `• *Name:* ${studentData.studentName}`,
      `• *Regd No:* ${regNo}`,
      `• *Branch:* ${studentBranch}${studentSec ? ` (Sec: ${studentSec})` : ""}`,
      studentData.batch ? `• *Batch:* ${studentData.batch}` : null,
      ``,
      `*ACADEMIC PERFORMANCE (SEM ${selectedSem})*`,
      `• *SGPA:* ${semSgpa !== null && semSgpa !== undefined ? Number(semSgpa).toFixed(2) : "—"}`,
      cgpaUpToNow ? `• *CGPA:* ${Number(cgpaUpToNow).toFixed(2)} (Cumulative)` : null,
      totalCredits > 0 ? `• *Credits Cleared:* ${creditsCleared} / ${totalCredits}` : null,
      `• *Status:* ${hasFailed ? "Active Backlog" : "Passed (All Cleared)"}`,
      rankLines.length > 0 ? `• *Ranking:* ${rankLines.join(" | ")}` : null,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*CUMULATIVE CREDIT PROGRESS*`,
      cumulativeCredits.totalCredits > 0
        ? `• *Total Credits Cleared to Date:* ${cumulativeCredits.creditsCleared} / ${cumulativeCredits.totalCredits}`
        : null,
      ``,
      `*SEMESTER-WISE CREDIT SUMMARY*`,
      semesterCreditText,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*ACTIVE BACKLOGS*`,
      activeBacklogText,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*COURSE-WISE GRADE BREAKDOWN*`,
      ``,
      subjectText,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*For detailed result and analytics, visit:*`,
      `https://grade-flow-navy.vercel.app`,
    ]
      .filter((line) => line !== null && line !== undefined)
      .join("\n");

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (regNo && (!studentData || studentData.regNo !== regNo)) {
      fetchStudent(regNo);
    }
  }, [regNo, studentData?.regNo]);

  useEffect(() => {
    if (studentData) {
      const sem = studentData.latestSemester || (studentData.results && studentData.results.length > 0 ? studentData.results[studentData.results.length - 1].semester : 1);
      setSelectedSem(sem);
      if (studentData.ranking) {
        setSemesterRanking(studentData.ranking);
      }
      loadSemester(sem);
    }
  }, [studentData]);

  const loadSemester = async (sem) => {
    if (!sem) return;

    // 1. Immediately update with local semester result so there is zero UI delay, zero hanging, zero lag
    const local = studentData?.results?.find((r) => r.semester === sem);
    if (local) {
      setSemResult(local);
    }

    // 2. Check memory cache for already fetched data
    if (semCacheRef.current[sem]) {
      const { internal, ranking } = semCacheRef.current[sem];
      setInternalMarks(internal);
      setSemesterRanking(ranking);
      setIsInternalLoading(false);
      return;
    }

    if (sem === studentData?.latestSemester && studentData?.ranking) {
      setSemesterRanking(studentData.ranking);
    }

    setIsInternalLoading(true);

    try {
      const [semRes, imRes, rankRes] = await Promise.allSettled([
        axios.get(`${API}/student/${regNo}/semester/${sem}`),
        axios.get(`${API}/student/${regNo}/internal/${sem}`),
        axios.get(`${API}/student/${regNo}/ranking/${sem}`),
      ]);

      if (semRes.status === "fulfilled" && (semRes.value.data?.data || semRes.value.data)) {
        setSemResult(semRes.value.data?.data || semRes.value.data);
      } else if (!local) {
        const fallback = studentData?.results?.find((r) => r.semester === sem);
        setSemResult(fallback || null);
      }

      let finalInternal = null;
      if (imRes.status === "fulfilled" && (imRes.value.data?.data || imRes.value.data)) {
        finalInternal = imRes.value.data?.data || imRes.value.data;
        setInternalMarks(finalInternal);
      } else {
        setInternalMarks(null);
      }

      let finalRanking = null;
      if (rankRes.status === "fulfilled") {
        const rankData = rankRes.value.data?.data || rankRes.value.data;
        if (rankData && (rankData.universityRank || rankData.deptRank || rankData.cgpaRank || rankData.sgpaRank)) {
          finalRanking = rankData;
          setSemesterRanking(rankData);
        } else if (sem === studentData?.latestSemester && studentData?.ranking) {
          finalRanking = studentData.ranking;
          setSemesterRanking(studentData.ranking);
        } else {
          setSemesterRanking(null);
        }
      } else {
        if (sem === studentData?.latestSemester && studentData?.ranking) {
          finalRanking = studentData.ranking;
          setSemesterRanking(studentData.ranking);
        } else {
          setSemesterRanking(null);
        }
      }

      // Cache the result for instant retrieval
      semCacheRef.current[sem] = {
        internal: finalInternal,
        ranking: finalRanking,
      };
    } catch {
      // Fallbacks already in place
    } finally {
      setIsInternalLoading(false);
    }
  };

  // Re-fetch or ensure internal marks are loaded if user switches to internal view
  useEffect(() => {
    if (tab === "internal" && selectedSem) {
      if (!internalMarks && !semCacheRef.current[selectedSem]?.internal) {
        loadSemester(selectedSem);
      }
    }
  }, [tab, selectedSem]);

  if (loading || (!studentData && !error)) {
    return (
      <div
        style={{
          background: "#f1f5f9",
          minHeight: "100vh",
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          paddingBottom: 80,
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "80px auto",
          padding: "36px 32px",
          background: "#ffffff",
          borderRadius: 20,
          border: "1px solid #fee2e2",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            background: "#fef2f2",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
          }}
        >
          <AlertTriangle size={26} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
          Student Not Found
        </h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          {error || "Could not retrieve student records for this registration number."}
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Return Home
        </button>
      </div>
    );
  }

  const { studentName, branch, batch, results = [], backlogs = [], academicHealth = {} } = studentData;
  const dynamicBranch = getDynamicBranch(regNo, branch);
  const section = getSectionFromRegNo(regNo);

  const latestResult = results.find((r) => r.semester === selectedSem) || results[0];
  const latestMetrics = latestResult?.subjects?.length > 0
    ? calculateSemesterMetrics(latestResult.subjects, latestResult.semester)
    : null;
  const latestSgpa = latestMetrics
    ? latestMetrics.sgpa
    : (typeof latestResult?.sgpa === "number" ? latestResult.sgpa : null);

  const cgpa = results.length > 0 ? calculateCGPA(results) : studentData.cgpa;
  const academicHealthScore = academicHealth?.score ?? 85;
  const healthColor =
    academicHealthScore >= 90 ? "#16a34a" : academicHealthScore >= 75 ? "#2563eb" : academicHealthScore >= 60 ? "#d97706" : "#dc2626";
  const healthLabel =
    academicHealthScore >= 90
      ? "Excellent Standing"
      : academicHealthScore >= 75
      ? "Good Standing"
      : academicHealthScore >= 60
      ? "Average Standing"
      : "Needs Attention";

  const internalSubjects = getSortedInternalSubjects(internalMarks);

  // SVG Achievement Badges (100% synchronized with Unlockable Academic Badges Scale)
  const currentRanking = semesterRanking || studentData?.ranking;
  const isTopRanker = Boolean(
    currentRanking &&
      ((currentRanking.universityRank && currentRanking.universityRank <= 10) ||
        (currentRanking.sgpaRank && currentRanking.sgpaRank <= 10) ||
        (currentRanking.cgpaRank && currentRanking.cgpaRank <= 10))
  );

  const badges = [
    // 1. 9+ CGPA Elite (Legendary) - Criteria: CGPA >= 9.0
    cgpa >= 9.0 && {
      label: "9+ CGPA Elite",
      color: "#dc2626",
      icon: <Crown size={13} />,
      tier: "Legendary",
    },
    // 2. Academic Excellence (Gold) - Criteria: Latest SGPA >= 9.0
    latestSgpa >= 9.0 && {
      label: "Academic Excellence",
      color: "#d97706",
      icon: <Star size={13} />,
      tier: "Gold",
    },
    // 3. Consistent Performer (Silver) - Criteria: CGPA >= 8.5
    cgpa >= 8.5 && {
      label: "Consistent Performer",
      color: "#2563eb",
      icon: <Target size={13} />,
      tier: "Silver",
    },
    // 4. No Backlog Champion (Gold) - Criteria: Active Backlogs = 0
    backlogs.length === 0 && {
      label: "No Backlog Champion",
      color: "#16a34a",
      icon: <CheckCircle size={13} />,
      tier: "Gold",
    },
    // 5. Top Ranker (Diamond) - Criteria: Rank <= 10
    isTopRanker && {
      label: "Top Ranker",
      color: "#7e22ce",
      icon: <Trophy size={13} />,
      tier: "Diamond",
    },
    // 6. Perfect SGPA (Mythic) - Criteria: Latest SGPA = 10
    latestSgpa >= 10 && {
      label: "Perfect SGPA",
      color: "#ea580c",
      icon: <Award size={13} />,
      tier: "Mythic",
    },
  ].filter(Boolean);

  const navMenuItems = [
    { id: "result", label: "Semester Result", icon: <FileText size={17} /> },
    { id: "internal", label: "Internal Marks", icon: <FileEdit size={17} /> },
    { id: "history", label: "Semester History", icon: <Calendar size={17} /> },
    { id: "baskets", label: "Degree Progress", icon: <Layout size={17} /> },
    { id: "predictor", label: "Target Predictor", icon: <Calculator size={17} /> },
  ];

  return (
    <div
      style={{
        background: "#f1f5f9",
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: 80,
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: isMobile ? "12px 10px" : "24px 32px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "280px minmax(0, 1fr)",
          gap: isMobile ? 14 : 24,
          alignItems: "start",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* ══════════════════════════════════════════════════════════
            LEFT SIDEBAR NAVIGATION / MOBILE PROFILE CARD
        ══════════════════════════════════════════════════════════ */}
        <aside
          style={{
            position: isMobile ? "relative" : "sticky",
            top: isMobile ? "auto" : 24,
            display: "flex",
            flexDirection: "column",
            margin: 0,
            padding: 0,
            width: "100%",
            boxSizing: "border-box",
            alignSelf: "start",
          }}
        >
          {/* Main Unified Sidebar Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 16,
              padding: isMobile ? "14px 14px" : "16px 14px",
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? 10 : 14,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* 1. Student Profile Header */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isMobile ? 8 : 10 }}>
                <div
                  style={{
                    width: isMobile ? 38 : 42,
                    height: isMobile ? 38 : 42,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isMobile ? 15 : 17,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {studentName ? studentName.charAt(0).toUpperCase() : "S"}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3
                    style={{
                      fontSize: isMobile ? 14 : 14.5,
                      fontWeight: 800,
                      color: "#0f172a",
                      margin: "0 0 2px 0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={studentName}
                  >
                    {studentName}
                  </h3>
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10.5,
                      color: "#64748b",
                      fontWeight: 700,
                      background: "#f1f5f9",
                      padding: "2px 6px",
                      borderRadius: 5,
                      border: "1px solid #e2e8f0",
                      display: "inline-block",
                    }}
                  >
                    {regNo}
                  </span>
                </div>
              </div>

              {/* Student Meta Details */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: dynamicBranch === "CSE" ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
                  gap: 4,
                  padding: "6px 8px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px solid #f1f5f9",
                  fontSize: 11,
                  textAlign: "center",
                }}
              >
                <div>
                  <div style={{ color: "#94a3b8", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" }}>Branch</div>
                  <strong style={{ color: "#0f172a" }}>{dynamicBranch}</strong>
                </div>
                {dynamicBranch === "CSE" && (
                  <div>
                    <div style={{ color: "#94a3b8", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" }}>Sec</div>
                    <strong style={{ color: "#0f172a" }}>{section}</strong>
                  </div>
                )}
                <div>
                  <div style={{ color: "#94a3b8", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" }}>Batch</div>
                  <strong style={{ color: "#0f172a" }}>{batch}</strong>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: "#f1f5f9" }} />

            {/* 2. Semester Switcher */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Semester
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
                {results.map((r) => {
                  const isActive = selectedSem === r.semester;
                  return (
                    <button
                      key={r.semester}
                      onClick={() => {
                        if (selectedSem === r.semester && semResult) return;
                        setSelectedSem(r.semester);
                        loadSemester(r.semester);
                      }}
                      style={{
                        padding: "6px 0",
                        borderRadius: 7,
                        border: isActive ? "1px solid #2563eb" : "1px solid #e2e8f0",
                        background: isActive ? "#2563eb" : "#f8fafc",
                        color: isActive ? "#ffffff" : "#475569",
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 600,
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Sem {r.semester}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ height: 1, background: "#f1f5f9" }} />

            {/* 3. Dashboard Navigation Views Menu (Desktop Only) */}
            {!isMobile && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", paddingLeft: 4, marginBottom: 4 }}>
                    Views
                  </div>

                  {navMenuItems.map((item) => {
                    const isActive = tab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: isActive ? "#eff6ff" : "transparent",
                          color: isActive ? "#2563eb" : "#475569",
                          fontSize: 12.5,
                          fontWeight: isActive ? 700 : 500,
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "all 0.15s ease",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.background = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span style={{ color: isActive ? "#2563eb" : "#64748b" }}>{item.icon}</span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {isActive && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#2563eb" }} />}
                      </button>
                    );
                  })}
                </div>

                <div style={{ height: 1, background: "#f1f5f9" }} />
              </>
            )}

            {/* 4. Quick Actions / Tools */}
            <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 6 : 5 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", paddingLeft: 4, marginBottom: 2 }}>
                Tools
              </div>

              {isMobile ? (
                /* Mobile 3-Button Compact Row */
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  <button
                    onClick={() => navigate(`/analytics/${encodeStudentId(regNo)}`)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: "8px 4px",
                      borderRadius: 8,
                      border: "1px solid #f1f5f9",
                      background: "#f8fafc",
                      color: "#334155",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <TrendingUp size={14} color="#2563eb" />
                    <span>Analytics</span>
                  </button>

                  <button
                    onClick={downloadFullTranscript}
                    disabled={isDownloadingBatch}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: "8px 4px",
                      borderRadius: 8,
                      border: "1px solid #f1f5f9",
                      background: isDownloadingBatch ? "#f1f5f9" : "#f8fafc",
                      color: "#334155",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: isDownloadingBatch ? "not-allowed" : "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {isDownloadingBatch ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Loader2 size={14} color="#2563eb" />
                      </motion.div>
                    ) : (
                      <DownloadCloud size={14} color="#059669" />
                    )}
                    <span>{isDownloadingBatch ? "Exporting..." : "Transcript"}</span>
                  </button>

                  <button
                    onClick={shareSemResult}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: "8px 4px",
                      borderRadius: 8,
                      border: "1px solid #f1f5f9",
                      background: "#f8fafc",
                      color: "#334155",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <WhatsAppIcon size={15} color="#16a34a" />
                    <span>Share Result</span>
                  </button>
                </div>
              ) : (
                /* Desktop Vertical Action List */
                <>
                  <button
                    onClick={() => navigate(`/analytics/${encodeStudentId(regNo)}`)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 9px",
                      borderRadius: 7,
                      border: "1px solid #f1f5f9",
                      background: "#f8fafc",
                      color: "#334155",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  >
                    <TrendingUp size={13} color="#2563eb" />
                    <span style={{ flex: 1, textAlign: "left" }}>Analytics</span>
                    <ArrowRight size={11} color="#94a3b8" />
                  </button>

                  <button
                    onClick={downloadFullTranscript}
                    disabled={isDownloadingBatch}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 9px",
                      borderRadius: 7,
                      border: "1px solid #f1f5f9",
                      background: isDownloadingBatch ? "#f1f5f9" : "#f8fafc",
                      color: "#334155",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: isDownloadingBatch ? "not-allowed" : "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isDownloadingBatch) e.currentTarget.style.background = "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isDownloadingBatch) e.currentTarget.style.background = "#f8fafc";
                    }}
                  >
                    {isDownloadingBatch ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Loader2 size={13} color="#2563eb" />
                      </motion.div>
                    ) : (
                      <DownloadCloud size={13} color="#059669" />
                    )}
                    <span style={{ flex: 1, textAlign: "left" }}>
                      {isDownloadingBatch ? "Exporting..." : "Export Transcript"}
                    </span>
                  </button>

                  <button
                    onClick={shareSemResult}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 9px",
                      borderRadius: 7,
                      border: "1px solid #f1f5f9",
                      background: "#f8fafc",
                      color: "#334155",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  >
                    <WhatsAppIcon size={14} color="#16a34a" />
                    <span style={{ flex: 1, textAlign: "left" }}>Share Sem Result</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════════
            RIGHT MAIN WORKSPACE PANEL
        ══════════════════════════════════════════════════════════ */}
        <main style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 20, minWidth: 0, width: "100%", boxSizing: "border-box" }}>
          <StudentSectionNavigation
            sectionLabel="Academic Records"
            items={navMenuItems}
            activeId={tab}
            onSelect={setTab}
            accent="#2563eb"
            inline={false}
          />
          {/* Mobile Sticky Views Sub-Navigation Bar with Left & Right Arrow Buttons */}
          {false && isMobile && (
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 20,
                background: "#f1f5f9",
                padding: "4px 0 6px 0",
                display: "flex",
                alignItems: "center",
                gap: 5,
                width: "100%",
              }}
            >
              {/* Left Arrow Button */}
              <button
                onClick={() => scrollTabs("left")}
                disabled={!canScrollLeft}
                aria-label="Scroll views left"
                style={{
                  width: 28,
                  height: 28,
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
                <ChevronLeft size={15} />
              </button>

              {/* Scrollable Tabs Track */}
              <div
                ref={mobileTabsRef}
                onScroll={checkTabsScroll}
                style={{
                  display: "flex",
                  gap: 6,
                  overflowX: "auto",
                  width: "100%",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  scrollBehavior: "smooth",
                }}
              >
                {navMenuItems.map((item) => {
                  const isActive = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      data-tab-id={item.id}
                      onClick={() => setTab(item.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 12px",
                        borderRadius: 999,
                        border: isActive ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                        background: isActive ? "#ffffff" : "#f8fafc",
                        color: isActive ? "#2563eb" : "#475569",
                        fontSize: 12,
                        fontWeight: isActive ? 800 : 600,
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: isActive ? "#2563eb" : "#64748b" }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Arrow Button */}
              <button
                onClick={() => scrollTabs("right")}
                disabled={!canScrollRight}
                aria-label="Scroll views right"
                style={{
                  width: 28,
                  height: 28,
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
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Top Header Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 16,
              padding: isMobile ? "12px 14px" : "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? 8 : 14,
            }}
          >
            {/* Header Content */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              {isMobile ? (
                /* Mobile Clean Single-Row Name + Semester Badge */
                <>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#0f172a",
                        margin: 0,
                        letterSpacing: "-0.3px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {studentName}
                    </h2>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "#eff6ff",
                      color: "#2563eb",
                      padding: "4px 9px",
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: 700,
                      border: "1px solid #dbeafe",
                      flexShrink: 0,
                    }}
                  >
                    <Activity size={12} />
                    <span>Sem {selectedSem}</span>
                  </span>
                </>
              ) : (
                /* Desktop Header with Title & Action Buttons */
                <>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#2563eb", fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                      <Activity size={13} />
                      <span>Academic Overview · Semester {selectedSem}</span>
                    </div>
                    <h1
                      style={{
                        fontSize: "clamp(22px, 2.5vw, 28px)",
                        fontWeight: 800,
                        color: "#0f172a",
                        margin: 0,
                        letterSpacing: "-0.4px",
                      }}
                    >
                      {studentName}
                    </h1>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={downloadFullTranscript}
                      disabled={isDownloadingBatch}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "9px 16px",
                        borderRadius: 9,
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#334155",
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: isDownloadingBatch ? "not-allowed" : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.15s",
                      }}
                    >
                      <DownloadCloud size={14} color="#2563eb" />
                      <span>Transcript</span>
                    </button>
                    <button
                      onClick={() => navigate(`/analytics/${encodeStudentId(regNo)}`)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "9px 18px",
                        borderRadius: 9,
                        border: "none",
                        background: "#2563eb",
                        color: "#ffffff",
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.15s",
                      }}
                    >
                      <TrendingUp size={14} />
                      <span>Analytics</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Achievement Badges Row (Smooth, Gap-Free Single Row) */}
            {badges.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  overflowX: isMobile ? "auto" : "visible",
                  flexWrap: isMobile ? "nowrap" : "wrap",
                  paddingTop: isMobile ? 6 : 8,
                  borderTop: "1px solid #f1f5f9",
                  alignItems: "center",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {badges.map((b, i) => (
                  <span
                    key={i}
                    style={{
                      background: b.color + "12",
                      color: b.color,
                      border: `1px solid ${b.color}30`,
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 4 Hero Stat Cards (2x2 on Mobile, 4 in row on Desktop) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(200px, 1fr))",
              gap: isMobile ? 8 : 14,
              width: "100%",
            }}
          >
            {/* 1. Latest SGPA */}
            <motion.div
              whileHover={{ y: -2 }}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: isMobile ? "12px 12px" : "18px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: isMobile ? 10.5 : 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Semester SGPA
                </span>
                <span style={{ fontSize: 10, background: "#eff6ff", color: "#2563eb", padding: "1px 6px", borderRadius: 5, fontWeight: 700 }}>
                  Sem {selectedSem}
                </span>
              </div>
              <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: "#2563eb", fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>
                {latestSgpa ? latestSgpa.toFixed(2) : "—"}
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}> /10</span>
              </div>
              <span style={{ fontSize: 10.5, color: "#64748b" }}>Current semester performance</span>
            </motion.div>

            {/* 2. CGPA */}
            <motion.div
              whileHover={{ y: -2 }}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: isMobile ? "12px 12px" : "18px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: isMobile ? 10.5 : 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Cumulative CGPA
                </span>
                <span style={{ fontSize: 10, background: "#f5f3ff", color: "#8b5cf6", padding: "1px 6px", borderRadius: 5, fontWeight: 700 }}>
                  Overall
                </span>
              </div>
              <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: "#8b5cf6", fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>
                {cgpa ? cgpa.toFixed(2) : "—"}
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}> /10</span>
              </div>
              <span style={{ fontSize: 10.5, color: "#64748b" }}>Across all completed semesters</span>
            </motion.div>

            {/* 3. Credits Cleared */}
            <motion.div
              whileHover={{ y: -2 }}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: isMobile ? "12px 12px" : "18px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: isMobile ? 10.5 : 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Credits Cleared
                </span>
                <span style={{ fontSize: 10, background: "#f8fafc", color: "#64748b", border: "1px solid #cbd5e1", padding: "1px 6px", borderRadius: 5, fontWeight: 700 }}>
                  Goal: 160
                </span>
              </div>
              <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: "#0f172a", fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>
                {results.length > 0 ? results.reduce((sum, r) => sum + calculateSemesterMetrics(r.subjects, r.semester).creditsCleared, 0) : studentData.creditsCleared}
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                  {" "}
                  / {results.length > 0 ? results.reduce((sum, r) => sum + calculateSemesterMetrics(r.subjects, r.semester).totalCredits, 0) : studentData.totalCredits}
                </span>
              </div>
              <span style={{ fontSize: 10.5, color: "#64748b" }}>Degree requirement progress</span>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3.5, background: "#f1f5f9" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      100,
                      ((results.length > 0
                        ? results.reduce((sum, r) => sum + calculateSemesterMetrics(r.subjects, r.semester).creditsCleared, 0)
                        : (studentData.creditsCleared || 0)) /
                        160) *
                        100
                    )}%`,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ height: "100%", background: "#2563eb" }}
                />
              </div>
            </motion.div>

            {/* 4. Academic Health */}
            <motion.div
              whileHover={{ y: -2 }}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: isMobile ? "12px 12px" : "18px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: isMobile ? 10.5 : 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Academic Health
                </span>
                <Activity size={14} color={healthColor} />
              </div>
              <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: healthColor, fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>
                {academicHealthScore}
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}> /100</span>
              </div>
              <span style={{ fontSize: 10.5, color: healthColor, fontWeight: 700 }}>{healthLabel}</span>
            </motion.div>
          </div>

          {/* Active Backlogs Alert Accordion */}
          {backlogs.length > 0 && (
            <div
              style={{
                background: "#fffafb",
                border: "1.5px solid #fecaca",
                borderRadius: 16,
                padding: isMobile ? "14px 14px" : "18px 20px",
              }}
            >
              <div
                onClick={() => setIsBacklogsListExpanded(!isBacklogsListExpanded)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      borderRadius: 10,
                      background: "#fee2e2",
                      color: "#dc2626",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <AlertTriangle size={isMobile ? 16 : 18} />
                  </div>
                  <div>
                    <div style={{ color: "#dc2626", fontWeight: 800, fontSize: isMobile ? 14 : 15, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span>{backlogs.length} Active Backlog{backlogs.length > 1 ? "s" : ""} Found</span>
                      <span
                        style={{
                          background: "#fee2e2",
                          border: "1px solid #fecaca",
                          color: "#991b1b",
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 99,
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Action Required
                      </span>
                    </div>
                    <span style={{ fontSize: 11.5, color: "#991b1b", opacity: 0.85 }}>
                      Review pending subjects and exam clearance details
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: isBacklogsListExpanded ? "#fee2e2" : "#ffffff",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    padding: "6px 12px",
                    color: "#dc2626",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ display: isMobile ? "none" : "inline" }}>
                    {isBacklogsListExpanded ? "Hide Details" : "View Subjects"}
                  </span>
                  {isBacklogsListExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </div>

              <AnimatePresence>
                {isBacklogsListExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {backlogs.map((b, i) => {
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            flexDirection: isMobile ? "column" : "row",
                            alignItems: isMobile ? "flex-start" : "center",
                            justifyContent: "space-between",
                            padding: isMobile ? "10px 12px" : "12px 16px",
                            background: "#ffffff",
                            borderRadius: 10,
                            border: "1px solid #fee2e2",
                            fontSize: 12.5,
                            gap: isMobile ? 8 : 12,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 800, color: "#0f172a", fontSize: 13, textTransform: "uppercase" }}>
                              {b.subName}
                            </span>
                            <span
                              style={{
                                color: "#475569",
                                background: "#f1f5f9",
                                border: "1px solid #e2e8f0",
                                fontFamily: "'Space Mono', monospace",
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: 6,
                              }}
                            >
                              {b.subCode}
                            </span>
                            {b.credit && (
                              <span style={{ color: "#64748b", fontSize: 11, fontWeight: 600 }}>
                                ({b.credit} Credits)
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                            <span
                              style={{
                                background: "#eff6ff",
                                border: "1px solid #dbeafe",
                                color: "#1d4ed8",
                                fontWeight: 700,
                                fontSize: 11,
                                padding: "3px 8px",
                                borderRadius: 6,
                              }}
                            >
                              Sem {b.semester}
                            </span>
                            <span
                              style={{
                                background: "#fef2f2",
                                color: "#dc2626",
                                fontWeight: 800,
                                padding: "3px 10px",
                                borderRadius: 6,
                                fontSize: 11.5,
                                border: "1px solid #fecaca",
                              }}
                            >
                              Grade {b.grade || "F"}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* ── BACKLOG DISCLAIMER & WHATSAPP SUPPORT BANNER ── */}
                    <div
                      style={{
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: 12,
                        padding: isMobile ? "12px 14px" : "14px 18px",
                        marginTop: 6,
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        justifyContent: "space-between",
                        alignItems: isMobile ? "stretch" : "center",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: "1 1 auto" }}>
                        <Info size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                        <p style={{ margin: 0, fontSize: 12.5, color: "#92400e", lineHeight: 1.5 }}>
                          <strong style={{ color: "#78350f" }}>Disclaimer:</strong> If you think your backlog is cleared but this website shows this backlog, then it might happen because of missing excel data of your EOD/rechecking result. If you have this excel sheet, please contact the developer to get it updated.
                        </p>
                      </div>

                      <a
                        href={`https://wa.me/919124540575?text=${encodeURIComponent("Hello Developer, I have an inquiry regarding my backlog status / EOD rechecking results on GradeFlow.")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: "#25D366",
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: 12.5,
                          padding: "8px 16px",
                          borderRadius: 10,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <WhatsAppIcon size={16} color="#ffffff" />
                        <span>Contact via WhatsApp</span>
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* University & Branch Ranking Strip (Single Row) */}
          {(() => {
            const cgpaRankNum = semesterRanking ? (semesterRanking.cgpaRank || semesterRanking.universityRank) : null;
            const sgpaRankNum = semesterRanking ? (semesterRanking.sgpaRank || semesterRanking.universityRank) : null;
            const isCgpaTop50 = cgpaRankNum && cgpaRankNum <= 50;
            const isSgpaTop50 = sgpaRankNum && sgpaRankNum <= 50;

            return (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 16,
                  overflow: "hidden",
                  width: "100%",
                }}
              >
                {/* Ranking Strip Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 18px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #cbd5e1",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                    <Trophy size={16} color="#f59e0b" />
                    <span>Rankings & Standing · Semester {selectedSem}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/leaderboard?highlight=${regNo}&branch=${branch}&tab=cgpa`)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Full Leaderboard <ArrowRight size={13} />
                  </button>
                </div>

                {/* Single Row Horizontal Strip / Mobile Balanced Grid (ZERO Empty Gaps) */}
                <div
                  style={{
                    display: isMobile ? "grid" : "flex",
                    gridTemplateColumns: isMobile
                      ? dynamicBranch === "CSE"
                        ? "repeat(3, 1fr)"
                        : "repeat(2, 1fr)"
                      : "none",
                    flexWrap: isMobile ? "wrap" : "nowrap",
                    overflowX: isMobile ? "hidden" : "auto",
                    width: "100%",
                    borderTop: "1px solid #f1f5f9",
                    background: "#ffffff",
                  }}
                >
                  {/* Univ CGPA */}
                  <div
                    onClick={() => isCgpaTop50 && navigate(`/leaderboard?highlight=${regNo}&tab=cgpa`)}
                    style={{
                      flex: isMobile ? "none" : 1,
                      minWidth: isMobile ? "auto" : 110,
                      padding: isMobile ? "10px 4px" : "16px 10px",
                      textAlign: "center",
                      borderRight: "1px solid #f1f5f9",
                      borderBottom: isMobile ? "1px solid #f1f5f9" : "none",
                      cursor: isCgpaTop50 ? "pointer" : "default",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (isCgpaTop50) e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontSize: isMobile ? 9 : 10.5, color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>Univ CGPA</div>
                    <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, color: semesterRanking ? "#2563eb" : "#94a3b8", fontFamily: "'Space Mono', monospace", margin: "2px 0" }}>
                      {semesterRanking && cgpaRankNum ? `#${cgpaRankNum}` : "—"}
                    </div>
                    <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748b" }}>
                      {semesterRanking?.totalStudents ? `of ${semesterRanking.totalStudents}` : "Not Generated"}
                    </div>
                  </div>

                  {/* Univ SGPA */}
                  <div
                    onClick={() => isSgpaTop50 && navigate(`/leaderboard?highlight=${regNo}&tab=sgpa`)}
                    style={{
                      flex: isMobile ? "none" : 1,
                      minWidth: isMobile ? "auto" : 110,
                      padding: isMobile ? "10px 4px" : "16px 10px",
                      textAlign: "center",
                      borderRight: "1px solid #f1f5f9",
                      borderBottom: isMobile ? "1px solid #f1f5f9" : "none",
                      cursor: isSgpaTop50 ? "pointer" : "default",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (isSgpaTop50) e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontSize: isMobile ? 9 : 10.5, color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>Univ SGPA</div>
                    <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, color: semesterRanking ? "#8b5cf6" : "#94a3b8", fontFamily: "'Space Mono', monospace", margin: "2px 0" }}>
                      {semesterRanking && sgpaRankNum ? `#${sgpaRankNum}` : "—"}
                    </div>
                    <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748b" }}>
                      {semesterRanking?.totalStudents ? `of ${semesterRanking.totalStudents}` : "Not Generated"}
                    </div>
                  </div>

                  {/* Branch CGPA */}
                  <div
                    onClick={() => navigate(`/leaderboard?highlight=${regNo}&branch=${branch}&tab=cgpa`)}
                    style={{
                      flex: isMobile ? "none" : 1,
                      minWidth: isMobile ? "auto" : 110,
                      padding: isMobile ? "10px 4px" : "16px 10px",
                      textAlign: "center",
                      borderRight: isMobile && dynamicBranch !== "CSE" ? "none" : "1px solid #f1f5f9",
                      borderBottom: isMobile ? "1px solid #f1f5f9" : "none",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontSize: isMobile ? 9 : 10.5, color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>Branch CGPA</div>
                    <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, color: semesterRanking ? "#0284c7" : "#94a3b8", fontFamily: "'Space Mono', monospace", margin: "2px 0" }}>
                      {semesterRanking && semesterRanking.deptCgpaRank ? `#${semesterRanking.deptCgpaRank}` : "—"}
                    </div>
                    <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748b" }}>
                      {semesterRanking?.deptStudents ? `of ${semesterRanking.deptStudents}` : "Not Generated"}
                    </div>
                  </div>

                  {/* Branch SGPA */}
                  <div
                    onClick={() => navigate(`/leaderboard?highlight=${regNo}&branch=${branch}&tab=sgpa`)}
                    style={{
                      flex: isMobile ? "none" : 1,
                      minWidth: isMobile ? "auto" : 110,
                      padding: isMobile ? "10px 4px" : "16px 10px",
                      textAlign: "center",
                      borderRight: "1px solid #f1f5f9",
                      borderBottom: isMobile ? "1px solid #f1f5f9" : "none",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontSize: isMobile ? 9 : 10.5, color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>Branch SGPA</div>
                    <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, color: semesterRanking ? "#16a34a" : "#94a3b8", fontFamily: "'Space Mono', monospace", margin: "2px 0" }}>
                      {semesterRanking && semesterRanking.deptRank ? `#${semesterRanking.deptRank}` : "—"}
                    </div>
                    <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748b" }}>
                      {semesterRanking?.deptStudents ? `of ${semesterRanking.deptStudents}` : "Not Generated"}
                    </div>
                  </div>

                  {/* Section CGPA (for CSE) */}
                  {dynamicBranch === "CSE" && (
                    <div
                      onClick={() => navigate(`/leaderboard?highlight=${regNo}&branch=${branch}&section=${section}&tab=cgpa`)}
                      style={{
                        flex: isMobile ? "none" : 1,
                        minWidth: isMobile ? "auto" : 110,
                        padding: isMobile ? "10px 4px" : "16px 10px",
                        textAlign: "center",
                        borderRight: "1px solid #f1f5f9",
                        borderBottom: isMobile ? "1px solid #f1f5f9" : "none",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ fontSize: isMobile ? 9 : 10.5, color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>Section CGPA</div>
                      <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, color: semesterRanking ? "#f59e0b" : "#94a3b8", fontFamily: "'Space Mono', monospace", margin: "2px 0" }}>
                        {semesterRanking && semesterRanking.sectionCgpaRank ? `#${semesterRanking.sectionCgpaRank}` : "—"}
                      </div>
                      <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748b" }}>
                        {semesterRanking?.sectionStudents ? `of ${semesterRanking.sectionStudents}` : "Not Generated"}
                      </div>
                    </div>
                  )}

                  {/* Section SGPA (for CSE) */}
                  {dynamicBranch === "CSE" && (
                    <div
                      onClick={() => navigate(`/leaderboard?highlight=${regNo}&branch=${branch}&section=${section}&tab=sgpa`)}
                      style={{
                        flex: isMobile ? "none" : 1,
                        minWidth: isMobile ? "auto" : 110,
                        padding: isMobile ? "10px 4px" : "16px 10px",
                        textAlign: "center",
                        borderRight: isMobile ? "none" : "1px solid #e2e8f0",
                        borderBottom: isMobile ? "1px solid #f1f5f9" : "none",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ fontSize: isMobile ? 9 : 10.5, color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>Section SGPA</div>
                      <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, color: semesterRanking ? "#ea580c" : "#94a3b8", fontFamily: "'Space Mono', monospace", margin: "2px 0" }}>
                        {semesterRanking && semesterRanking.sectionSgpaRank ? `#${semesterRanking.sectionSgpaRank}` : "—"}
                      </div>
                      <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748b" }}>
                        {semesterRanking?.sectionStudents ? `of ${semesterRanking.sectionStudents}` : "Not Generated"}
                      </div>
                    </div>
                  )}

                  {/* Percentile Highlight Bar (Spans full width on mobile) */}
                  <div
                    style={{
                      flex: isMobile ? "none" : 1,
                      gridColumn: isMobile ? "1 / -1" : "auto",
                      minWidth: isMobile ? "auto" : 110,
                      padding: isMobile ? "10px 14px" : "16px 10px",
                      textAlign: "center",
                      background: isMobile ? "#f8fafc" : "transparent",
                      display: isMobile ? "flex" : "block",
                      alignItems: isMobile ? "center" : "initial",
                      justifyContent: isMobile ? "space-between" : "initial",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: isMobile ? 10 : 10.5, color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>Academic Standing</div>
                      <div style={{ fontSize: isMobile ? 11 : 11, color: "#64748b" }}>
                        {semesterRanking?.percentile ? `Top ${(100 - semesterRanking.percentile).toFixed(1)}% in University` : "Percentile Not Generated"}
                      </div>
                    </div>

                    <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: semesterRanking ? "#d97706" : "#94a3b8", fontFamily: "'Space Mono', monospace" }}>
                      {semesterRanking?.percentile ? `${semesterRanking.percentile}%` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════
              DYNAMIC ACTIVE TAB VIEW
          ══════════════════════════════════════════════════════════ */}
          {(() => {
            const currentResult =
              semResult ||
              studentData?.results?.find((r) => r.semester === selectedSem) ||
              studentData?.results?.[studentData.results.length - 1];

            if (!currentResult && !studentData?.results?.length) {
              return <ReportCardSkeleton />;
            }

            return (
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0.95 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.95 }}
                  transition={{ duration: 0.12 }}
                  style={{ width: "100%", minWidth: 0 }}
                >
                  {/* Tab 1: Semester Result (GradeSheet) */}
                  {tab === "result" && (
                    <div style={{ width: "100%", minWidth: 0 }}>
                      <GradeSheet
                        result={currentResult}
                        studentData={studentData}
                        highlightedSubject={highlightedSubject}
                      />
                    </div>
                  )}

                  {/* Tab 2: Internal Marks */}
                  {tab === "internal" && (
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: 16,
                        padding: isMobile ? "14px 14px" : "24px 24px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: isMobile ? 12 : 20,
                          flexWrap: "wrap",
                          gap: 10,
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: isMobile ? 15 : 17,
                              fontWeight: 800,
                              color: "#0f172a",
                              margin: "0 0 2px 0",
                            }}
                          >
                            Internal Assessment Marks
                          </h3>
                          <p style={{ color: "#64748b", fontSize: isMobile ? 11.5 : 13, margin: 0 }}>
                            Semester {internalMarks?.semester || selectedSem} ·{" "}
                            {internalSubjects.length} Subjects
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <button
                            onClick={async () => {
                              try {
                                const { default: jsPDF } = await import("jspdf");
                                const { default: autoTable } = await import("jspdf-autotable");
                                const doc = new jsPDF("landscape", "mm", "a4");
                                const semNumber = internalMarks?.semester || selectedSem;
                                const isSem1 = Number(semNumber) === 1;

                                // University Header
                                doc.setFont("helvetica", "bold");
                                doc.setFontSize(14);
                                doc.text("CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT", 148.5, 12, { align: "center" });

                                doc.setFontSize(11);
                                doc.text("STATEMENT OF INTERNAL ASSESSMENT MARKS", 148.5, 18, { align: "center" });

                                doc.setFont("helvetica", "normal");
                                doc.setFontSize(9.5);
                                doc.setTextColor(70, 70, 70);
                                doc.text(`Semester ${semNumber} Examination Record · Academic Session 2023–2027`, 148.5, 23, { align: "center" });
                                doc.setTextColor(0, 0, 0);

                                // Student Meta Box
                                const section = getSectionFromRegNo(studentData?.regNo);
                                doc.setDrawColor(50, 50, 50);
                                doc.setFillColor(250, 250, 250);
                                doc.roundedRect(12, 27, 273, 10, 1.5, 1.5, "FD");

                                doc.setFontSize(9);
                                doc.setFont("helvetica", "bold");
                                doc.text(`Name: `, 16, 33.5);
                                doc.setFont("helvetica", "normal");
                                doc.text(`${studentData?.studentName || "N/A"}`, 28, 33.5);

                                doc.setFont("helvetica", "bold");
                                doc.text(`Reg No: `, 95, 33.5);
                                doc.setFont("helvetica", "normal");
                                doc.text(`${studentData?.regNo || "N/A"}`, 110, 33.5);

                                doc.setFont("helvetica", "bold");
                                doc.text(`Branch: `, 160, 33.5);
                                doc.setFont("helvetica", "normal");
                                doc.text(`${dynamicBranch} (${section})`, 175, 33.5);

                                doc.setFont("helvetica", "bold");
                                doc.text(`Date: `, 235, 33.5);
                                doc.setFont("helvetica", "normal");
                                doc.text(`${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, 246, 33.5);

                                // Table Data
                                const tableHeaders = isSem1
                                  ? ["SUBJECT NAME", "CODE", "CLASS TEST I", "CLASS TEST II", "CLASS TEST III", "CLASS TEST IV", "ASSIGNMENT", "TOTAL"]
                                  : ["SUBJECT NAME", "CODE", "MID SEM", "PRESENTATION", "ASSIGNMENT", "LEARNING REC.", "INTERNAL PRAC", "PROJECT", "TOTAL"];

                                const tableRows = internalSubjects.map((s) => {
                                  const assessments = getInternalAssessments(s, semNumber);
                                  const total = getSubjectTotal(s, semNumber, assessments);
                                  const formattedCode = s.type ? `${s.subCode || "—"} [${s.type}]` : (s.subCode || "—");
                                  return [
                                    s.subName || "—",
                                    formattedCode,
                                    ...assessments.map((a) => (isMarkAvailable(a.obtained) ? `${formatMark(a.obtained)}/${formatMark(a.max)}` : "—")),
                                    total.hasAny ? `${formatMark(total.score)}/${formatMark(total.max)}` : "—",
                                  ];
                                });

                                const columnStyles = isSem1
                                  ? {
                                      0: { cellWidth: 70, halign: "left", fontStyle: "bold" },
                                      1: { cellWidth: 30, halign: "center", font: "courier" },
                                      2: { cellWidth: 26, halign: "center" },
                                      3: { cellWidth: 26, halign: "center" },
                                      4: { cellWidth: 26, halign: "center" },
                                      5: { cellWidth: 26, halign: "center" },
                                      6: { cellWidth: 27, halign: "center" },
                                      7: { cellWidth: 27, halign: "center", fontStyle: "bold" },
                                    }
                                  : {
                                      0: { cellWidth: 64, halign: "left", fontStyle: "bold" },
                                      1: { cellWidth: 25, halign: "center", font: "courier" },
                                      2: { cellWidth: 23, halign: "center" },
                                      3: { cellWidth: 25, halign: "center" },
                                      4: { cellWidth: 23, halign: "center" },
                                      5: { cellWidth: 26, halign: "center" },
                                      6: { cellWidth: 25, halign: "center" },
                                      7: { cellWidth: 24, halign: "center" },
                                      8: { cellWidth: 23, halign: "center", fontStyle: "bold" },
                                    };

                                autoTable(doc, {
                                  head: [tableHeaders],
                                  body: tableRows,
                                  startY: 40,
                                  margin: { left: 12, right: 12 },
                                  theme: "grid",
                                  styles: {
                                    fontSize: 8.5,
                                    cellPadding: 2,
                                    valign: "middle",
                                    lineColor: [80, 80, 80],
                                    lineWidth: 0.15,
                                  },
                                  headStyles: {
                                    fillColor: [241, 245, 249],
                                    textColor: [15, 23, 42],
                                    fontStyle: "bold",
                                    fontSize: 8.5,
                                    halign: "center",
                                  },
                                  alternateRowStyles: {
                                    fillColor: [250, 252, 255],
                                  },
                                  columnStyles,
                                });

                                const finalY = doc.lastAutoTable.finalY || 160;

                                // Verification & Signatures
                                doc.setFontSize(8);
                                doc.setFont("helvetica", "normal");
                                doc.setTextColor(100, 100, 100);
                                doc.text("* Computer generated official internal assessment statement via GradeFlow.", 12, finalY + 10);
                                doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 12, finalY + 14);

                                doc.setTextColor(0, 0, 0);
                                doc.setFont("helvetica", "bold");
                                doc.setDrawColor(0, 0, 0);
                                doc.setLineWidth(0.3);

                                doc.line(160, finalY + 14, 205, finalY + 14);
                                doc.text("Faculty / Coordinator", 182.5, finalY + 18, { align: "center" });

                                doc.line(225, finalY + 14, 275, finalY + 14);
                                doc.text("Dean / Controller of Exam", 250, finalY + 18, { align: "center" });

                                doc.save(`Internal_Assessment_Marks_${studentData?.regNo || "Student"}_Sem${semNumber}.pdf`);
                              } catch (err) {
                                console.error("PDF generation error:", err);
                                window.print();
                              }
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: isMobile ? "6px 12px" : "8px 16px",
                              borderRadius: 8,
                              border: "1px solid #2563eb",
                              background: "#2563eb",
                              color: "#ffffff",
                              fontSize: isMobile ? 12 : 13,
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            <DownloadCloud size={15} /> Download PDF
                          </button>
                          <button
                            onClick={() => window.print()}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: isMobile ? "6px 12px" : "8px 16px",
                              borderRadius: 8,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              fontSize: isMobile ? 12 : 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            <Printer size={14} /> Print
                          </button>
                        </div>
                      </div>

                      {isInternalLoading ? (
                        <InternalMarksSkeleton />
                      ) : internalMarks && internalSubjects.length > 0 ? (
                      (() => {
                        const INTERNAL_PER_PAGE = 6;
                        const totalInternalPages = Math.ceil(internalSubjects.length / INTERNAL_PER_PAGE) || 1;
                        const currentInternalPage = Math.min(internalPage, totalInternalPages);
                        const paginatedInternalSubjects = internalSubjects.slice(
                          (currentInternalPage - 1) * INTERNAL_PER_PAGE,
                          currentInternalPage * INTERNAL_PER_PAGE
                        );
                        const startIdx = (currentInternalPage - 1) * INTERNAL_PER_PAGE + 1;
                        const endIdx = Math.min(currentInternalPage * INTERNAL_PER_PAGE, internalSubjects.length);

                        // All evaluated / registered subjects for the complete print statement
                        const printSubjectsList = internalSubjects;

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {/* Dual Screen View: Mobile Cards (<1024px) or Desktop High-Density Table (>=1024px) */}
                            {isMobile ? (
                              /* ─── Mobile Assessment Subject Cards ─── */
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {paginatedInternalSubjects.map((s, i) => {
                                  const assessments = getInternalAssessments(s, internalMarks.semester);
                                  const total = getSubjectTotal(s, internalMarks.semester, assessments);
                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        background: "#ffffff",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: 14,
                                        padding: "12px 14px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                      }}
                                    >
                                      {/* Subject Header & Total Score */}
                                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13.5, marginBottom: 4, lineHeight: 1.3 }}>
                                            {s.subName}
                                          </div>
                                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 10.5, color: "#475569", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, fontFamily: "'Space Mono', monospace", border: "1px solid #e2e8f0" }}>
                                              {s.subCode}
                                            </span>
                                            {s.type && (
                                              <span style={{ fontSize: 10, color: "#6b21a8", background: "#f3e8ff", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                                                {s.type}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Total Score Badge */}
                                        <div style={{ flexShrink: 0, textAlign: "right" }}>
                                          <div style={{ fontSize: 9.5, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Total</div>
                                          {total.hasAny ? (
                                            <span style={{ display: "inline-block", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "3px 8px", borderRadius: 6, fontWeight: 800, fontFamily: "'Space Mono', monospace", fontSize: 12.5 }}>
                                              {formatMark(total.score)}{isMarkAvailable(total.max) && `/${formatMark(total.max)}`}
                                            </span>
                                          ) : (
                                            <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>—</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Assessments 2-Column Grid */}
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                                        {assessments.map((a, ci) => (
                                          <div
                                            key={ci}
                                            style={{
                                              background: "#f8fafc",
                                              border: "1px solid #f1f5f9",
                                              borderRadius: 8,
                                              padding: "7px 8px",
                                              display: "flex",
                                              flexDirection: "column",
                                              gap: 2,
                                            }}
                                          >
                                            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.label}>
                                              {a.label}
                                            </div>
                                            {isMarkAvailable(a.obtained) || isMarkAvailable(a.secondary) ? (
                                              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 4 }}>
                                                <MarkValue value={a.obtained} max={a.max} color="#2563eb" showMax={true} />
                                                {a.secondaryLabel && (
                                                  <span style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 700 }}>
                                                    {a.secondaryLabel}: {formatMark(a.secondary)}
                                                  </span>
                                                )}
                                              </div>
                                            ) : (
                                              <span style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 600 }}>Not Evaluated</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              /* ─── Desktop Paginated High-Density Table ─── */
                              <div style={{ width: "100%", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12.5, tableLayout: "fixed" }}>
                                  <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                                      <th style={{ width: "30%", padding: "12px 14px", fontSize: 11, color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Subject
                                      </th>
                                      {getInternalAssessments(internalSubjects[0], internalMarks.semester).map((a, i) => {
                                        const renderHeaderLabel = (lbl) => {
                                          switch (lbl) {
                                            case "Learning Record":
                                              return <span>LEARNING<br />RECORD</span>;
                                            case "Internal Prac":
                                              return <span>INTERNAL<br />PRAC</span>;
                                            case "Project Internal":
                                              return <span>PROJECT<br />INTERNAL</span>;
                                            case "Presentation":
                                              return <span>PRESENT-<br />ATION</span>;
                                            case "Assignment":
                                              return <span>ASSIGN-<br />MENT</span>;
                                            case "Mid Sem":
                                              return <span>MID<br />SEM</span>;
                                            case "Class Test I":
                                              return <span>TEST<br />I</span>;
                                            case "Class Test II":
                                              return <span>TEST<br />II</span>;
                                            case "Class Test III":
                                              return <span>TEST<br />III</span>;
                                            case "Class Test IV":
                                              return <span>TEST<br />IV</span>;
                                            default:
                                              return <span>{lbl.toUpperCase()}</span>;
                                          }
                                        };
                                        return (
                                          <th
                                            key={i}
                                            style={{
                                              width: "10%",
                                              padding: "10px 4px",
                                              textAlign: "center",
                                              fontSize: 10,
                                              color: "#475569",
                                              fontWeight: 800,
                                              letterSpacing: "0.3px",
                                              lineHeight: 1.25,
                                              verticalAlign: "middle",
                                              whiteSpace: "normal",
                                            }}
                                          >
                                            {renderHeaderLabel(a.label)}
                                          </th>
                                        );
                                      })}
                                      <th style={{ width: "10%", padding: "12px 14px", textAlign: "right", fontSize: 11, color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Total
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {paginatedInternalSubjects.map((s, i) => {
                                      const assessments = getInternalAssessments(s, internalMarks.semester);
                                      const total = getSubjectTotal(s, internalMarks.semester, assessments);
                                      return (
                                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#ffffff" : "#fcfdfe" }}>
                                          <td style={{ padding: "12px 14px", verticalAlign: "middle", overflow: "hidden" }}>
                                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13, marginBottom: 3, lineHeight: 1.3, wordBreak: "break-word" }}>
                                              {s.subName}
                                            </div>
                                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                              <span style={{ fontSize: 10.5, color: "#475569", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, fontFamily: "'Space Mono', monospace", border: "1px solid #e2e8f0" }}>
                                                {s.subCode}
                                              </span>
                                              {s.type && (
                                                <span style={{ fontSize: 10, color: "#6b21a8", background: "#f3e8ff", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                                                  {s.type}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          {assessments.map((a, ci) => (
                                            <td key={ci} style={{ padding: "10px 4px", textAlign: "center", verticalAlign: "middle" }}>
                                              {isMarkAvailable(a.obtained) || isMarkAvailable(a.secondary) ? (
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                                  <MarkValue value={a.obtained} max={a.max} color="#2563eb" showMax={true} />
                                                  <span style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 700 }}>
                                                    {a.secondaryLabel}: {formatMark(a.secondary)}
                                                  </span>
                                                </div>
                                              ) : (
                                                <span style={{ color: "#cbd5e1", fontSize: 13 }}>—</span>
                                              )}
                                            </td>
                                          ))}
                                          <td style={{ padding: "12px 14px", textAlign: "right", verticalAlign: "middle" }}>
                                            {total.hasAny ? (
                                              <span style={{ display: "inline-block", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "3px 8px", borderRadius: 6, fontWeight: 800, fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
                                                {formatMark(total.score)}{isMarkAvailable(total.max) && `/${formatMark(total.max)}`}
                                              </span>
                                            ) : (
                                              <span style={{ color: "#cbd5e1", fontSize: 13 }}>—</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Pagination Toolbar */}
                            {totalInternalPages > 1 && (
                              <div
                                className="gf-internal-pagination-toolbar"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  flexWrap: "wrap",
                                  gap: 10,
                                  padding: "10px 14px",
                                  background: "#f8fafc",
                                  borderRadius: 12,
                                  border: "1px solid #e2e8f0",
                                  width: "100%",
                                  boxSizing: "border-box",
                                  overflow: "hidden",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#475569" }}>
                                    Showing <strong style={{ color: "#0f172a" }}>{startIdx}–{endIdx}</strong> of <strong style={{ color: "#0f172a" }}>{internalSubjects.length}</strong> subjects
                                  </span>
                                  <span style={{ fontSize: 11, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "2px 7px", borderRadius: 6, fontWeight: 700 }}>
                                    Scored First
                                  </span>
                                </div>

                                <div
                                  className="gf-pagination-btn-group"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexWrap: "wrap",
                                    gap: 5,
                                    maxWidth: "100%",
                                  }}
                                >
                                  <button
                                    onClick={() => setInternalPage((p) => Math.max(1, p - 1))}
                                    disabled={currentInternalPage <= 1}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 3,
                                      padding: "6px 10px",
                                      height: 32,
                                      borderRadius: 8,
                                      border: "1px solid #cbd5e1",
                                      background: currentInternalPage <= 1 ? "#f1f5f9" : "#ffffff",
                                      color: currentInternalPage <= 1 ? "#94a3b8" : "#1e293b",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: currentInternalPage <= 1 ? "not-allowed" : "pointer",
                                      fontFamily: "'DM Sans', sans-serif",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <ChevronLeft size={13} /> Prev
                                  </button>

                                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                                    {Array.from({ length: totalInternalPages }, (_, idx) => idx + 1)
                                      .filter((p) => p === 1 || p === totalInternalPages || Math.abs(p - currentInternalPage) <= 1)
                                      .map((p, pIdx, arr) => (
                                        <React.Fragment key={p}>
                                          {pIdx > 0 && arr[pIdx - 1] !== p - 1 && (
                                            <span style={{ padding: "0 2px", color: "#94a3b8", fontSize: 11, alignSelf: "center" }}>…</span>
                                          )}
                                          <button
                                            onClick={() => setInternalPage(p)}
                                            style={{
                                              minWidth: 28,
                                              height: 32,
                                              padding: "0 6px",
                                              borderRadius: 8,
                                              border: p === currentInternalPage ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                                              background: p === currentInternalPage ? "#2563eb" : "#ffffff",
                                              color: p === currentInternalPage ? "#ffffff" : "#334155",
                                              fontSize: 12,
                                              fontWeight: 700,
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontFamily: "'DM Sans', sans-serif",
                                              flexShrink: 0,
                                            }}
                                          >
                                            {p}
                                          </button>
                                        </React.Fragment>
                                      ))}
                                  </div>

                                  <button
                                    onClick={() => setInternalPage((p) => Math.min(totalInternalPages, p + 1))}
                                    disabled={currentInternalPage >= totalInternalPages}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 3,
                                      padding: "6px 10px",
                                      height: 32,
                                      borderRadius: 8,
                                      border: "1px solid #cbd5e1",
                                      background: currentInternalPage >= totalInternalPages ? "#f1f5f9" : "#ffffff",
                                      color: currentInternalPage >= totalInternalPages ? "#94a3b8" : "#1e293b",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: currentInternalPage >= totalInternalPages ? "not-allowed" : "pointer",
                                      fontFamily: "'DM Sans', sans-serif",
                                      flexShrink: 0,
                                    }}
                                  >
                                    Next <ChevronRight size={13} />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* ══════════════════════════════════════════════════════════
                                DEDICATED PRINTABLE 1-PAGE STATEMENT (PRINT ONLY)
                            ══════════════════════════════════════════════════════════ */}
                            <div id="printable-internal-sheet" style={{ display: "none" }}>
                              <style>
                                {`
                                @media print {
                                  @page {
                                    size: A4 landscape;
                                    margin: 8mm 10mm 8mm 10mm;
                                  }
                                  html, body {
                                    background: #ffffff !important;
                                    color: #000000 !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                  }
                                  body * {
                                    visibility: hidden !important;
                                  }
                                  #printable-internal-sheet, #printable-internal-sheet * {
                                    visibility: visible !important;
                                  }
                                  #printable-internal-sheet {
                                    position: absolute !important;
                                    left: 0 !important;
                                    top: 0 !important;
                                    width: 100% !important;
                                    display: block !important;
                                    background: #ffffff !important;
                                    color: #000000 !important;
                                    padding: 0 !important;
                                    margin: 0 !important;
                                  }
                                }
                                `}
                              </style>

                              <div style={{ padding: "0 2px", color: "#000000" }}>
                                {/* Institution & Statement Header */}
                                <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: 8, marginBottom: 10 }}>
                                  <div style={{ fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    CENTURION UNIVERSITY OF TECHNOLOGY &amp; MANAGEMENT
                                  </div>
                                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginTop: 2, color: "#1e293b" }}>
                                    STATEMENT OF INTERNAL ASSESSMENT MARKS
                                  </div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginTop: 2 }}>
                                    Semester {internalMarks?.semester || selectedSem} Examination Record · Academic Session 2023–2027
                                  </div>
                                </div>

                                {/* Student Meta Card */}
                                <div style={{ border: "1px solid #333333", borderRadius: 4, padding: "6px 12px", marginBottom: 10, fontSize: 11, display: "grid", gridTemplateColumns: "1.2fr 1fr 1.1fr 0.9fr", gap: 8, background: "#fafafa" }}>
                                  <div><strong>Name:</strong> {studentData?.studentName}</div>
                                  <div><strong>Reg No:</strong> {studentData?.regNo}</div>
                                  <div><strong>Branch:</strong> {dynamicBranch} ({getSectionFromRegNo(studentData?.regNo)})</div>
                                  <div><strong>Date:</strong> {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                                </div>

                                {/* Printable Table (100% fixed layout) */}
                                {(() => {
                                  const isSem1 = Number(internalMarks?.semester) === 1;
                                  const headerAssessments = getInternalAssessments({}, internalMarks?.semester);

                                  return (
                                    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 9.5, border: "1.5px solid #000000", boxSizing: "border-box" }}>
                                      <thead>
                                        <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #000000" }}>
                                          <th style={{ border: "1px solid #000000", padding: "6px 6px", textAlign: "left", width: isSem1 ? "28%" : "25%", fontSize: 9.5, fontWeight: 800, textTransform: "uppercase" }}>
                                            Subject Name
                                          </th>
                                          <th style={{ border: "1px solid #000000", padding: "6px 3px", textAlign: "center", width: isSem1 ? "12%" : "9.5%", fontSize: 9.5, fontWeight: 800, textTransform: "uppercase" }}>
                                            Code
                                          </th>
                                          {headerAssessments.map((a, idx) => {
                                            const colWidth = isSem1 ? "10%" : idx === 3 ? "10%" : "9%";
                                            return (
                                              <th key={idx} style={{ border: "1px solid #000000", padding: "6px 3px", textAlign: "center", width: colWidth, fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>
                                                {a.label}
                                              </th>
                                            );
                                          })}
                                          <th style={{ border: "1px solid #000000", padding: "6px 4px", textAlign: "center", width: isSem1 ? "10%" : "9.5%", fontSize: 9.5, fontWeight: 800, textTransform: "uppercase" }}>
                                            Total
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {printSubjectsList.map((s, idx) => {
                                          const assessments = getInternalAssessments(s, internalMarks.semester);
                                          const total = getSubjectTotal(s, internalMarks.semester, assessments);
                                          return (
                                            <tr key={idx} style={{ borderBottom: "1px solid #333333", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                                              <td style={{ border: "1px solid #333333", padding: "5px 6px", fontWeight: 700, fontSize: 9.5, lineHeight: 1.25, wordBreak: "break-word" }}>
                                                {s.subName}
                                              </td>
                                              <td style={{ border: "1px solid #333333", padding: "5px 3px", textAlign: "center", fontSize: 9.5 }}>
                                                <div style={{ fontFamily: "monospace", fontWeight: 700 }}>{s.subCode}</div>
                                                {s.type && (
                                                  <span style={{ display: "inline-block", fontSize: 8.5, color: "#6b21a8", background: "#f3e8ff", padding: "0 4px", borderRadius: 3, fontWeight: 800, marginTop: 1, border: "1px solid #d8b4fe" }}>
                                                    {s.type}
                                                  </span>
                                                )}
                                              </td>
                                              {assessments.map((a, ci) => (
                                                <td key={ci} style={{ border: "1px solid #333333", padding: "5px 3px", textAlign: "center", fontSize: 9.5 }}>
                                                  {isMarkAvailable(a.obtained) ? `${formatMark(a.obtained)}/${formatMark(a.max)}` : "—"}
                                                </td>
                                              ))}
                                              <td style={{ border: "1px solid #333333", padding: "5px 4px", textAlign: "center", fontWeight: 800, fontSize: 9.5 }}>
                                                {total.hasAny ? `${formatMark(total.score)}/${formatMark(total.max)}` : "—"}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  );
                                })()}

                                {/* Footer Verification & Signatures */}
                                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 10 }}>
                                  <div>
                                    <div style={{ color: "#555555" }}>* Computer generated official internal assessment statement via GradeFlow.</div>
                                    <div style={{ color: "#555555", marginTop: 2 }}>Printed on: {new Date().toLocaleString("en-IN")}</div>
                                  </div>

                                  <div style={{ display: "flex", gap: 36, textAlign: "center" }}>
                                    <div>
                                      <div style={{ width: 130, borderTop: "1px solid #000000", marginBottom: 4 }} />
                                      <strong>Faculty / Coordinator</strong>
                                    </div>
                                    <div>
                                      <div style={{ width: 130, borderTop: "1px solid #000000", marginBottom: 4 }} />
                                      <strong>Dean / Controller of Exam</strong>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div style={{ textAlign: "center", padding: "48px 24px", background: "#f8fafc", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                        <FileEdit size={32} color="#94a3b8" style={{ marginBottom: 8 }} />
                        <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>No internal assessment marks recorded for this semester.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Semester History */}
                {tab === "history" && (
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: 16,
                      padding: isMobile ? "14px 14px" : "24px 26px",
                      display: "flex",
                      flexDirection: "column",
                      gap: isMobile ? 12 : 20,
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <h3 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0" }}>
                          Semester Academic Progression
                        </h3>
                        <p style={{ color: "#64748b", fontSize: isMobile ? 11.5 : 13, margin: 0 }}>
                          Chronological transcript history across all semesters. Tap any card to view its grade sheet.
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: isMobile ? 11 : 12,
                          fontWeight: 700,
                          color: "#2563eb",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          padding: "3px 10px",
                          borderRadius: 20,
                          flexShrink: 0,
                        }}
                      >
                        {results.length} Semesters Recorded
                      </span>
                    </div>

                    {/* Semester Cards List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 8 : 12 }}>
                      {results.map((r) => {
                        const { creditsCleared, totalCredits, sgpa: computedSGPA } = calculateSemesterMetrics(r.subjects, r.semester);
                        const liveSGPA = (r.subjects && r.subjects.length > 0) ? computedSGPA : (typeof r.sgpa === "number" ? r.sgpa : computedSGPA);
                        const sgpaColor = liveSGPA >= 9 ? "#15803d" : liveSGPA >= 7.5 ? "#1d4ed8" : "#b45309";
                        const sgpaBg = liveSGPA >= 9 ? "#dcfce7" : liveSGPA >= 7.5 ? "#dbeafe" : "#fef3c7";
                        const sgpaBorder = liveSGPA >= 9 ? "#bbf7d0" : liveSGPA >= 7.5 ? "#bfdbfe" : "#fde68a";
                        const isClear = creditsCleared === totalCredits;
                        const isSelected = selectedSem === r.semester;
                        const subjectsCount = r.subjects ? r.subjects.length : 0;

                        return (
                          <div
                            key={r.semester}
                            onClick={() => {
                              if (selectedSem === r.semester && semResult && tab === "result") return;
                              setSelectedSem(r.semester);
                              loadSemester(r.semester);
                              setTab("result");
                            }}
                            style={{
                              background: isSelected ? "#eff6ff" : "#ffffff",
                              border: isSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                              borderRadius: 14,
                              padding: isMobile ? "12px 12px" : "16px 20px",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              transition: "all 0.15s ease",
                              gap: 10,
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = "#f8fafc";
                                e.currentTarget.style.borderColor = "#94a3b8";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = "#ffffff";
                                e.currentTarget.style.borderColor = "#cbd5e1";
                              }
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16, minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  width: isMobile ? 40 : 48,
                                  height: isMobile ? 40 : 48,
                                  borderRadius: 12,
                                  background: isSelected ? "#2563eb" : "#f1f5f9",
                                  border: isSelected ? "1px solid #1d4ed8" : "1px solid #e2e8f0",
                                  color: isSelected ? "#ffffff" : "#0f172a",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <span style={{ fontSize: isMobile ? 8.5 : 9.5, fontWeight: 800, textTransform: "uppercase", opacity: isSelected ? 0.9 : 0.6 }}>
                                  Sem
                                </span>
                                <span style={{ fontSize: isMobile ? 14 : 17, fontWeight: 800, fontFamily: "'Space Mono', monospace" }}>
                                  {r.semester}
                                </span>
                              </div>

                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                                  <h4 style={{ fontSize: isMobile ? 13.5 : 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                    Semester {r.semester}
                                  </h4>
                                  <span
                                    style={{
                                      fontSize: isMobile ? 9.5 : 11,
                                      background: isClear ? "#dcfce7" : "#fee2e2",
                                      color: isClear ? "#15803d" : "#b91c1c",
                                      border: isClear ? "1px solid #bbf7d0" : "1px solid #fecaca",
                                      padding: "1px 6px",
                                      borderRadius: 5,
                                      fontWeight: 800,
                                    }}
                                  >
                                    {isClear ? "All Cleared" : "Backlog"}
                                  </span>
                                  {isSelected && !isMobile && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        background: "#dbeafe",
                                        color: "#1d4ed8",
                                        border: "1px solid #bfdbfe",
                                        padding: "1px 7px",
                                        borderRadius: 6,
                                        fontWeight: 800,
                                      }}
                                    >
                                      Viewing
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: isMobile ? 11 : 12.5, color: "#64748b", flexWrap: "wrap" }}>
                                  <span>
                                    Credits: <strong style={{ color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>{creditsCleared}/{totalCredits}</strong>
                                  </span>
                                  <span>•</span>
                                  <span>
                                    <strong style={{ color: "#0f172a" }}>{subjectsCount}</strong> Subjects
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, flexShrink: 0 }}>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: isMobile ? 8.5 : 10, color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                                  SGPA
                                </div>
                                <div style={{ display: "inline-block", marginTop: 2 }}>
                                  <span
                                    style={{
                                      fontSize: isMobile ? 14 : 18,
                                      fontWeight: 800,
                                      color: sgpaColor,
                                      background: sgpaBg,
                                      border: `1px solid ${sgpaBorder}`,
                                      padding: isMobile ? "2px 7px" : "2px 10px",
                                      borderRadius: 7,
                                      fontFamily: "'Space Mono', monospace",
                                      display: "inline-block",
                                    }}
                                  >
                                    {liveSGPA.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              <div
                                style={{
                                  width: isMobile ? 26 : 32,
                                  height: isMobile ? 26 : 32,
                                  borderRadius: 8,
                                  background: isSelected ? "#dbeafe" : "#f1f5f9",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: isSelected ? "#1d4ed8" : "#64748b",
                                  flexShrink: 0,
                                }}
                              >
                                <ChevronRight size={isMobile ? 14 : 16} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 4: Degree Progress (Baskets) */}
                {tab === "baskets" && (
                  <BasketDashboard results={studentData.results} studentData={studentData} />
                )}

                {/* Tab 5: Target Predictor */}
                {tab === "predictor" && <TargetPredictor />}
              </motion.div>
            </AnimatePresence>
          );
        })()}
      </main>
      </div>

      {/* Hidden container for Batch PDF Export */}
      <div style={{ position: "fixed", top: 0, left: "200vw", zIndex: -9999, pointerEvents: "none" }}>
        {isDownloadingBatch &&
          studentData.results.map((r) => (
            <div key={r.semester} id={`batch-export-sem-${r.semester}`} style={{ background: "#fff", padding: 20 }}>
              <GradeSheet result={r} studentData={studentData} />
            </div>
          ))}
      </div>
    </div>
  );
}
