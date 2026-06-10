import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Spinner, DashboardSkeleton, ReportCardSkeleton } from "../components/LoadingSpinner";
import GradeSheet from "../components/GradeSheet";
import BasketDashboard from "../components/BasketDashboard";
import TargetPredictor from "../components/TargetPredictor";
import axios from "axios";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { User, TrendingUp, Star, Target, CheckCircle, Trophy, Award, AlertTriangle, FileText, FileEdit, Calendar, Printer, Share2, DownloadCloud, Loader2, ChevronDown, ChevronUp, Search, Layout, Calculator, Info, MessageCircle } from "lucide-react";
import { calculateSGPA as calcSGPAFromSubjects } from "../utils/gradeCalculations";

const GRADE_COLORS = {
  O: "#f59e0b",
  E: "#22c55e",
  A: "#3ea6ff",
  B: "#a855f7",
  C: "#f97316",
  D: "#6b7280",
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

function MarkValue({ value, max, color = "#3ea6ff", showMax = true }) {
  if (!isMarkAvailable(value)) {
    return <span style={{ color: "var(--muted)" }}>{MARK_PLACEHOLDER}</span>;
  }

  return (
    <span style={{ display: "inline-block", color, fontWeight: 700, background: `${color}14`, padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
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

  return subjects
    .map((subject, index) => ({ subject, index }))
    .sort((a, b) => Number(hasSubjectInternalScore(b.subject, semester)) - Number(hasSubjectInternalScore(a.subject, semester)) || a.index - b.index)
    .map(({ subject }) => subject);
}

function GradeBadge({ grade }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: GRADE_COLORS[grade] + "22",
        color: GRADE_COLORS[grade],
        padding: "2px 10px",
        borderRadius: 6,
        fontWeight: 700,
        fontSize: 13,
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

export default function Dashboard() {
  const { regNo } = useParams();
  const { studentData, fetchStudent, loading, error, API } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("result");
  const [selectedSem, setSelectedSem] = useState(null);
  const [semResult, setSemResult] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [isDownloadingBatch, setIsDownloadingBatch] = useState(false);
  const [expandedBacklog, setExpandedBacklog] = useState(null);
  const [highlightedSubject, setHighlightedSubject] = useState(null);
  const [isBacklogsListExpanded, setIsBacklogsListExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const downloadFullTranscript = async () => {
    setIsDownloadingBatch(true);
    
    setTimeout(async () => {
      try {
        const pdf = new jsPDF("p", "mm", "a4");
        
        for (let i = 0; i < studentData.results.length; i++) {
          const r = studentData.results[i];
          const element = document.getElementById(`gradesheet-capture-${r.semester}`);
          if (!element) continue;
          
          // Let the browser breathe and animate the spinner before the next heavy html2canvas task
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
  const [internalMarks, setInternalMarks] = useState(null);
  const [semesterRanking, setSemesterRanking] = useState(null);
  const [loadingSem, setLoadingSem] = useState(false);

  useEffect(() => {
    if (!studentData || studentData.regNo !== regNo) {
      fetchStudent(regNo);
    }
  }, [regNo]);

  useEffect(() => {
    if (studentData) {
      const sem = studentData.latestSemester;
      setSelectedSem(sem);
      loadSemester(sem);
    }
  }, [studentData]);

  async function loadSemester(sem) {
    setLoadingSem(true);
    try {
      const [resRes, intRes, rankRes] = await Promise.allSettled([
        axios.get(`${API}/student/${regNo}/semester/${sem}`),
        axios.get(`${API}/student/${regNo}/internal/${sem}`),
        axios.get(`${API}/student/${regNo}/ranking/${sem}`)
      ]);
      if (resRes.status === "fulfilled") setSemResult(resRes.value.data);
      if (intRes.status === "fulfilled") setInternalMarks(intRes.value.data);
      else setInternalMarks(null);
      if (rankRes.status === "fulfilled") setSemesterRanking(rankRes.value.data);
      else setSemesterRanking(null);
    } finally {
      setLoadingSem(false);
    }
  }

  if (loading)
    return <DashboardSkeleton />;
  if (error || !studentData)
    return (
      <div className="page" style={{ textAlign: "center", padding: 80 }}>
        <p style={{ color: "var(--danger)", marginBottom: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={20} /> {error || "Student not found"}
        </p>
        <button className="btn btn-ghost" onClick={() => navigate("/")}>
          ← Back to Search
        </button>
      </div>
    );

  const {
    studentName,
    branch,
    batch,
    cgpa,
    latestSgpa,
    academicHealthScore,
    backlogs,
    results,
    ranking,
  } = studentData;

  const dynamicBranch = getDynamicBranch(regNo, branch);
  const internalSubjects = getSortedInternalSubjects(internalMarks);

  const healthColor =
    academicHealthScore >= 80
      ? "var(--success)"
      : academicHealthScore >= 60
        ? "var(--warning)"
        : "var(--danger)";
  const healthLabel =
    academicHealthScore >= 80
      ? "Excellent"
      : academicHealthScore >= 60
        ? "Good"
        : academicHealthScore >= 40
          ? "Average"
          : "Needs Improvement";

  const badges = [
    latestSgpa >= 9.0 && { label: "Academic Excellence", color: "#f59e0b", icon: <Star size={14} /> },
    cgpa >= 8.5 && { label: "Consistent Performer", color: "#3ea6ff", icon: <Target size={14} /> },
    backlogs.length === 0 && {
      label: "No Backlog Champion",
      color: "#22c55e",
      icon: <CheckCircle size={14} />
    },
    semesterRanking &&
      semesterRanking.universityRank <= 10 && {
        label: "Top Ranker",
        color: "#a855f7",
        icon: <Trophy size={14} />
      },
    latestSgpa === 10 && { label: "Perfect SGPA", color: "#f97316", icon: <Award size={14} /> },
  ].filter(Boolean);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="page">
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
            paddingBottom: 24,
            borderBottom: "1px solid var(--border)"
          }}
        >
          <div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 11,
                fontWeight: 800,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}
            >
              <User size={12} /> Student Dashboard
            </p>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>{studentName}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-strong)", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontFamily: "Space Mono", color: "var(--text-muted)" }}>{regNo}</span>
              <span style={{ color: "var(--border-strong)" }}>·</span>
              <span style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-strong)", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{dynamicBranch}</span>
              <span style={{ color: "var(--border-strong)" }}>·</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Batch {batch}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-ghost"
              onClick={downloadFullTranscript}
              disabled={isDownloadingBatch}
            >
              {isDownloadingBatch ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "flex" }}>
                  <Loader2 size={15} />
                </motion.div>
              ) : (
                <DownloadCloud size={15} />
              )}
              {isDownloadingBatch ? "Exporting..." : "Transcript"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-ghost"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${studentName}'s GradeFlow Profile`,
                    url: window.location.href,
                  }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
            >
              <Share2 size={15} /> Share
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary"
              onClick={() => navigate("/analytics/" + regNo)}
            >
              <TrendingUp size={15} /> Analytics
            </motion.button>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {badges.map((b, i) => (
              <motion.span
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                key={i}
                style={{
                  background: b.color + "14",
                  color: b.color,
                  border: `1px solid ${b.color}33`,
                  padding: "5px 12px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  letterSpacing: "0.3px",
                }}
              >
                {b.icon} {b.label}
              </motion.span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <motion.div whileHover={{ y: -4 }} className="stat-card">
          <span className="label">Latest SGPA</span>
          <span className="value" style={{ color: "var(--accent)" }}>
            {latestSgpa?.toFixed(2)}
          </span>
          <span className="sub">Semester {studentData.latestSemester}</span>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} className="stat-card">
          <span className="label">CGPA</span>
          <span className="value" style={{ color: "#a855f7" }}>
            {cgpa?.toFixed(2)}
          </span>
          <span className="sub">Cumulative GPA</span>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} className="stat-card" style={{ position: "relative", overflow: "hidden" }}>
          <span className="label">Credits Cleared</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="value">{studentData.creditsCleared}</span>
            <span style={{ fontSize: 16, color: "var(--text-muted)", fontWeight: 600 }}>
              / {studentData.totalCredits}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <span className="sub" style={{ margin: 0 }}>Up to Sem {studentData.latestSemester}</span>
            <span style={{ fontSize: 10, background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 4, color: "var(--text-muted)", fontWeight: 700, border: "1px solid var(--border)" }}>Goal: 160</span>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.04)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((studentData.creditsCleared / 160) * 100, 100)}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ height: "100%", background: "linear-gradient(90deg, var(--accent), rgba(255,255,255,0.4))" }}
            />
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} className="stat-card">
          <span className="label">Academic Health</span>
          <span className="value" style={{ color: healthColor }}>
            {academicHealthScore}
            <span style={{ fontSize: 16, color: "var(--text-muted)" }}>/100</span>
          </span>
          <span className="sub" style={{ color: healthColor, fontWeight: 700 }}>
            {healthLabel}
          </span>
        </motion.div>
      </div>

      {/* Backlogs */}
      {backlogs.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.18)",
            borderLeft: "3px solid var(--danger)",
            borderRadius: "var(--radius-sm)",
            padding: "14px 18px",
            marginBottom: 24,
          }}
        >
          <div
            onClick={() => setIsBacklogsListExpanded(!isBacklogsListExpanded)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <p
              style={{ color: "var(--danger)", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}
            >
              <AlertTriangle size={16} /> {backlogs.length} Active Backlogs Found
            </p>
            {isBacklogsListExpanded ? <ChevronUp size={18} color="var(--danger)" /> : <ChevronDown size={18} color="var(--danger)" />}
          </div>
          
          {isBacklogsListExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, overflow: "hidden" }}>
              {backlogs.map((b, i) => {
                const isExpanded = expandedBacklog === i;
                return (
                  <motion.div
                    key={i}
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    {/* Header (Click to expand) */}
                    <div
                      onClick={(e) => { e.stopPropagation(); setExpandedBacklog(isExpanded ? null : i); }}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{b.subName}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ background: "rgba(255,255,255,0.1)", color: "var(--secondary)", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>Sem {b.semester}</span>
                        {isExpanded ? <ChevronUp size={16} color="var(--secondary)" /> : <ChevronDown size={16} color="var(--secondary)" />}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        style={{ padding: "0 16px 16px 16px" }}
                      >
                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                          <span style={{ background: "rgba(255,255,255,0.05)", color: "var(--secondary)", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>{b.subCode}</span>
                          <span style={{ background: "rgba(255,255,255,0.05)", color: "var(--secondary)", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>{b.credit} Credits</span>
                        </div>
                        
                        <button
                          className="btn btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTab("result");
                            setSelectedSem(b.semester);
                            loadSemester(b.semester);
                            setHighlightedSubject(b.subCode);
                            setTimeout(() => setHighlightedSubject(null), 3500);
                            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                          }}
                          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 16px" }}
                        >
                          <Search size={14} /> Find in Report Card
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
              
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)", borderRadius: 8 }}>
                <p style={{ fontSize: 13, color: "var(--warning)", display: "flex", alignItems: "flex-start", gap: 8, margin: 0, lineHeight: 1.5 }}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    <strong>Disclaimer:</strong> If you think your backlog is cleared but this website shows this backlog, then it might happen because of missing excel data of your EOD/rechecking result. If you have this excel sheet, please contact the developer to get it updated.
                  </span>
                </p>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                  <a 
                    href="https://wa.me/919124540575?text=Hi%2C%20I%20have%20the%20excel%20sheet%20for%20this"
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#25D366", color: "#fff", padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: "none", transition: "transform 0.2s" }}
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Contact via WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          )}

        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderLeft: "3px solid var(--success)",
            borderRadius: "var(--radius-sm)",
            padding: "14px 18px",
            marginBottom: 24,
          }}
        >
          <p style={{ color: "var(--success)", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <CheckCircle size={17} /> ALL CLEAR — No Active Backlogs
          </p>
        </motion.div>
      )}

      {/* Ranking Strip */}
      {(() => {
        const cgpaRankNum = semesterRanking ? (semesterRanking.cgpaRank || semesterRanking.universityRank) : null;
        const sgpaRankNum = semesterRanking ? (semesterRanking.sgpaRank || semesterRanking.universityRank) : null;
        const isCgpaTop50 = cgpaRankNum && cgpaRankNum <= 50;
        const isSgpaTop50 = sgpaRankNum && sgpaRankNum <= 50;
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rank-strip"
            style={{ marginBottom: 24, opacity: semesterRanking ? 1 : 0.55 }}
          >
            <div
              className="rank-strip-item"
              onClick={() => isCgpaTop50 && navigate(`/leaderboard?highlight=${regNo}&tab=cgpa`)}
              style={{ cursor: isCgpaTop50 ? "pointer" : "default" }}
              title={semesterRanking && !isCgpaTop50 ? "Rank must be ≤50 to view on Leaderboard" : ""}
            >
              <div className="rank-strip-label">CGPA Rank</div>
              <div className="rank-strip-value" style={{ color: semesterRanking ? "var(--accent)" : "var(--text-muted)" }}>
                {semesterRanking ? `#${cgpaRankNum}` : "—"}
              </div>
              <div className="rank-strip-sub">{semesterRanking ? `of ${semesterRanking.totalStudents} students` : "Not Generated"}</div>
            </div>
            <div
              className="rank-strip-item"
              onClick={() => isSgpaTop50 && navigate(`/leaderboard?highlight=${regNo}&tab=sgpa`)}
              style={{ cursor: isSgpaTop50 ? "pointer" : "default" }}
              title={semesterRanking && !isSgpaTop50 ? "Rank must be ≤50 to view on Leaderboard" : ""}
            >
              <div className="rank-strip-label">SGPA Rank</div>
              <div className="rank-strip-value" style={{ color: semesterRanking ? "#a855f7" : "var(--text-muted)" }}>
                {semesterRanking ? `#${sgpaRankNum}` : "—"}
              </div>
              <div className="rank-strip-sub">{semesterRanking ? `of ${semesterRanking.totalStudents} students` : "Not Generated"}</div>
            </div>
            <div
              className="rank-strip-item"
              onClick={() => navigate(`/leaderboard?highlight=${regNo}&branch=${branch}&tab=sgpa`)}
              style={{ cursor: "pointer" }}
              title="View Branch Leaderboard"
            >
              <div className="rank-strip-label">Branch Rank</div>
              <div className="rank-strip-value" style={{ color: semesterRanking ? "#22c55e" : "var(--text-muted)" }}>
                {semesterRanking && semesterRanking.deptRank ? `#${semesterRanking.deptRank}` : "—"}
              </div>
              <div className="rank-strip-sub">{semesterRanking && semesterRanking.deptStudents ? `of ${semesterRanking.deptStudents}` : "Not Generated"}</div>
            </div>
            <div className="rank-strip-item">
              <div className="rank-strip-label">Percentile</div>
              <div className="rank-strip-value" style={{ color: semesterRanking ? "var(--success)" : "var(--text-muted)" }}>
                {semesterRanking ? `${semesterRanking.percentile}%` : "—"}
              </div>
              <div className="rank-strip-sub">{semesterRanking ? `Top ${(100 - semesterRanking.percentile).toFixed(1)}%` : "Not Generated"}</div>
            </div>
          </motion.div>
        );
      })()}

      {/* Semester Selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "inline-flex", gap: 3, background: "rgba(255,255,255,0.03)", padding: "5px", borderRadius: 16, border: "1px solid var(--border)", flexWrap: "wrap", maxWidth: "100%" }}>
          {results.map((r) => (
            <motion.button
              whileTap={{ scale: 0.93 }}
              key={r.semester}
              onClick={() => {
                setSelectedSem(r.semester);
                loadSemester(r.semester);
              }}
              style={{
                padding: "7px 18px",
                borderRadius: 999,
                border: "none",
                background: selectedSem === r.semester ? "#2a2a2a" : "transparent",
                color: selectedSem === r.semester ? "#f1f1f1" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.2s",
                boxShadow: selectedSem === r.semester ? "0 1px 6px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.06)" : "none",
                whiteSpace: "nowrap",
              }}
            >
              Sem {r.semester}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {[
          ["result", "Result", <FileText size={14} key="result" />],
          ["internal", "Internal Marks", <FileEdit size={14} key="int" />],
          ["history", "Semester History", <Calendar size={14} key="hist" />],
          ["baskets", "Degree Progress", <Layout size={14} key="basket" />],
          ["predictor", "Target Predictor", <Calculator size={14} key="pred" />],
        ].map(([t, l, icon]) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {icon} {l}
          </button>
        ))}
      </div>

      {loadingSem ? (
        <ReportCardSkeleton />
      ) : (
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: "100%", maxWidth: "100%" }}
        >
          {tab === "result" && (
            <div style={{ display: "flex", justifyContent: "center", width: "100%", minWidth: 0, maxWidth: "100%" }}>
              <GradeSheet result={semResult} studentData={studentData} highlightedSubject={highlightedSubject} />
            </div>
          )}

          {tab === "internal" &&
            (internalMarks ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Internal Assessment Marks</h3>
                    <p style={{ color: "#aaaaaa", fontSize: 13 }}>Semester {internalMarks.semester} · {internalSubjects.length} Subjects</p>
                  </div>
                  <button className="btn btn-ghost" onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 14px" }}>
                    <Printer size={14} /> Print
                  </button>
                </div>

                {internalSubjects.length > 0 && (!isMobile ? (
                  <div style={{ width: "100%", overflowX: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", background: "#212121", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <th style={{ padding: "14px 16px", fontSize: 12, color: "#aaaaaa", fontWeight: 600 }}>Subject</th>
                          {getInternalAssessments(internalSubjects[0], internalMarks.semester).map((a, i) => (
                             <th key={i} style={{ padding: "14px 16px", textAlign: "center", fontSize: 12, color: "#aaaaaa", fontWeight: 600, whiteSpace: "nowrap" }}>{a.label}</th>
                          ))}
                          <th style={{ padding: "14px 16px", textAlign: "right", fontSize: 12, color: "#aaaaaa", fontWeight: 600, whiteSpace: "nowrap" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {internalSubjects.map((s, i) => {
                          const isSem1 = Number(internalMarks.semester) === 1;
                          const assessments = getInternalAssessments(s, internalMarks.semester);
                          const total = getSubjectTotal(s, internalMarks.semester, assessments);
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <td style={{ padding: "14px 16px", borderRight: "1px solid rgba(255,255,255,0.02)" }}>
                                 <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 4 }}>{s.subName}</div>
                                 <div style={{ display: "flex", gap: 6 }}>
                                   <span style={{ fontSize: 10, color: "#aaaaaa", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, fontFamily: "Space Mono" }}>{s.subCode}</span>
                                   {s.type && <span style={{ fontSize: 10, color: "#a855f7", background: "rgba(168,85,247,0.12)", padding: "2px 6px", borderRadius: 4 }}>{s.type}</span>}
                                 </div>
                              </td>
                              {assessments.map((a, ci) => {
                                const hasData = isMarkAvailable(a.obtained) || isMarkAvailable(a.secondary);
                                return (
                                  <td key={ci} style={{ padding: "14px 16px", textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.02)", verticalAlign: "middle" }}>
                                    {hasData ? (
                                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                          <span style={{ fontSize: 9, color: "#717171", fontWeight: 700, textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.5px" }}>Obtained</span>
                                          <MarkValue value={a.obtained} max={a.max} color="#f1f1f1" showMax={true} />
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                          <span style={{ fontSize: 9, color: "#717171", fontWeight: 700, textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.5px" }}>{isSem1 ? "Max" : "Roundoff"}</span>
                                          <MarkValue value={a.secondary} max={a.max} color="#a855f7" showMax={true} />
                                        </div>
                                      </div>
                                    ) : (
                                      <span style={{ color: "#555", fontSize: 14, fontWeight: 700 }}>—</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                {total.hasAny ? (
                                  <span style={{ display: "inline-block", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)", padding: "4px 10px", borderRadius: 12, fontFamily: "Space Mono", fontWeight: 700, fontSize: 13, color: "var(--success)", whiteSpace: "nowrap" }}>
                                    {formatMark(total.score)}{isMarkAvailable(total.max) && <span style={{ color: "rgba(34,197,94,0.55)", fontSize: 11 }}>/{formatMark(total.max)}</span>}
                                  </span>
                                ) : <span style={{ color: "#717171" }}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {internalSubjects.map((s, i) => {
                      const isSem1 = Number(internalMarks.semester) === 1;
                      const assessments = getInternalAssessments(s, internalMarks.semester);
                      const total = getSubjectTotal(s, internalMarks.semester, assessments);
                      return (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          style={{ background: "#212121", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: 12, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono", fontSize: 12, fontWeight: 700, color: "#aaaaaa", flexShrink: 0 }}>{i + 1}</div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.subName}</div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 10, color: "#aaaaaa", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)", fontFamily: "Space Mono" }}>{s.subCode}</span>
                                  {s.type && <span style={{ fontSize: 10, color: "#a855f7", background: "rgba(168,85,247,0.12)", padding: "2px 7px", borderRadius: 5 }}>{s.type}</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: 10, color: "#aaaaaa", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, marginBottom: 4 }}>Total</div>
                              {total.hasAny ? (
                                <span style={{ display: "inline-block", border: "1px solid rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.1)", padding: "4px 12px", borderRadius: 20, fontFamily: "Space Mono", fontWeight: 800, fontSize: 14, color: "var(--success)", whiteSpace: "nowrap" }}>
                                  {formatMark(total.score)}{isMarkAvailable(total.max) && <span style={{ color: "rgba(34,197,94,0.55)", fontSize: 11 }}>/{formatMark(total.max)}</span>}
                                </span>
                              ) : <span style={{ color: "#717171", fontSize: 13 }}>—</span>}
                            </div>
                          </div>
  
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 1, background: "rgba(255,255,255,0.04)" }}>
                            {assessments.map((assessment, ci) => (
                              <div key={ci} style={{ background: "#212121", padding: "12px 16px" }}>
                                <div style={{ fontSize: 10, color: "#717171", textTransform: "uppercase", letterSpacing: "0.7px", fontWeight: 700, marginBottom: 8 }}>{assessment.label}</div>
                                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                                  <div>
                                    <div style={{ fontSize: 9, color: "#717171", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Obtained</div>
                                    <MarkValue value={assessment.obtained} max={assessment.max} color="#f1f1f1" showMax={true} />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 9, color: "#717171", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>{isSem1 ? "Max" : "Round Off"}</div>
                                    <MarkValue value={assessment.secondary} max={assessment.max} color="#a855f7" showMax={true} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 24px", background: "#212121", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                <FileEdit size={36} style={{ color: "#717171", marginBottom: 12 }} />
                <p style={{ color: "#aaaaaa", fontSize: 14 }}>No internal marks available for this semester.</p>
              </div>
            ))}

          {tab === "history" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Semester History</h3>
                <p style={{ color: "#aaaaaa", fontSize: 13 }}>Click any semester to view its result</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {results.map((r, i) => {
                  const liveSGPA = calcSGPAFromSubjects(r.subjects, r.semester);
                  const sgpaColor = liveSGPA >= 9 ? "var(--success)" : liveSGPA >= 7 ? "#f1f1f1" : "var(--warning)";
                  const isClear = r.creditsCleared === r.totalCredits;
                  return (
                    <motion.div
                      key={r.semester}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => { setSelectedSem(r.semester); loadSemester(r.semester); setTab("result"); }}
                      style={{ background: "#212121", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}
                      whileHover={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "#2a2a2a" }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 9, color: "#717171", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Sem</span>
                        <span style={{ fontFamily: "Space Mono", fontSize: 16, fontWeight: 800, lineHeight: 1.1, color: "#f1f1f1" }}>{r.semester}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "#f1f1f1" }}>Semester {r.semester}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: isClear ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: isClear ? "var(--success)" : "var(--danger)", border: `1px solid ${isClear ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>{isClear ? "✓ Clear" : "✗ Backlog"}</span>
                        </div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: "#aaaaaa" }}>Credits: <strong style={{ color: "#f1f1f1" }}>{r.creditsCleared}/{r.totalCredits}</strong></span>
                          {r.session && <span style={{ fontSize: 12, color: "#aaaaaa" }}>{r.session}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: "#717171", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>SGPA</div>
                        <div style={{ fontFamily: "Space Mono", fontWeight: 800, fontSize: 22, color: sgpaColor, lineHeight: 1.1 }}>{liveSGPA.toFixed(2)}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "baskets" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ overflow: "hidden", width: "100%", padding: "4px 0", marginBottom: 16 }}>
                <motion.div
                  initial={{ x: 0 }}
                  animate={{ x: "-50%" }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}
                >
                  {[1, 2].map((i) => (
                    <span key={i} style={{ fontSize: 14.5, color: "var(--text)", paddingRight: 50 }}>
                      The basket tracker data follows the official CUTM 2025-26 syllabus for B.Tech CSE (it is properly correct for CSE now).{" "}
                      <a href="https://cutm.ac.in/wp-content/uploads/syllabus/soet/btech/2025/CSE%20Syllabus-2025-26.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "#3ea6ff", textDecoration: "underline", fontWeight: 700 }}>
                        View Official Syllabus PDF
                      </a>
                    </span>
                  ))}
                </motion.div>
              </div>
              <BasketDashboard results={studentData.results} />
            </motion.div>
          )}
          {tab === "predictor" && <TargetPredictor />}
        </motion.div>
      )}

      {/* Hidden container for Batch PDF Export */}
      <div style={{ position: "fixed", top: 0, left: "200vw", zIndex: -9999, pointerEvents: "none" }}>
        {isDownloadingBatch && studentData.results.map((r) => (
          <div key={r.semester} id={`batch-export-sem-${r.semester}`} style={{ background: "#fff", padding: 20 }}>
            <GradeSheet result={r} studentData={studentData} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
