import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Spinner, SkeletonGrid } from "../components/LoadingSpinner";
import GradeSheet from "../components/GradeSheet";
import BasketDashboard from "../components/BasketDashboard";
import TargetPredictor from "../components/TargetPredictor";
import axios from "axios";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { User, TrendingUp, Star, Target, CheckCircle, Trophy, Award, AlertTriangle, FileText, FileEdit, Calendar, Printer, Share2, DownloadCloud, Loader2, ChevronDown, ChevronUp, Search, Layout, Calculator } from "lucide-react";
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
    return (
      <div className="page">
        <SkeletonGrid count={4} h={100} />
      </div>
    );
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
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                color: "var(--secondary)",
                fontSize: 13,
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <User size={14} /> Student Dashboard
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 800 }}>{studentName}</h1>
            <p style={{ color: "var(--secondary)", marginTop: 4 }}>
              {regNo} · {dynamicBranch} · Batch {batch}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn"
              onClick={downloadFullTranscript}
              disabled={isDownloadingBatch}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            >
              {isDownloadingBatch ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "flex" }}>
                  <Loader2 size={16} />
                </motion.div>
              ) : (
                <DownloadCloud size={16} />
              )}
              {isDownloadingBatch ? "Exporting..." : "Full Transcript"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn"
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
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            >
              <Share2 size={16} /> Share
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary"
              onClick={() => navigate("/analytics/" + regNo)}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <TrendingUp size={16} /> View Analytics
            </motion.button>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div
            style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}
          >
            {badges.map((b, i) => (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                style={{
                  background: b.color + "18",
                  color: b.color,
                  border: `1px solid ${b.color}44`,
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {b.icon} {b.label}
              </motion.span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
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
          <span className="sub">Cumulative</span>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} className="stat-card">
          <span className="label">Credits Cleared</span>
          <span className="value">{studentData.creditsCleared}</span>
          <span className="sub">of 160</span>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} className="stat-card">
          <span className="label">Academic Health</span>
          <span className="value" style={{ color: healthColor }}>
            {academicHealthScore}
            <span style={{ fontSize: 16, color: "var(--secondary)" }}>
              /100
            </span>
          </span>
          <span className="sub" style={{ color: healthColor }}>
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
            border: "1px solid rgba(239,68,68,0.2)",
            borderLeft: "4px solid var(--danger)",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: "var(--radius)",
            padding: "16px 20px",
            marginBottom: 24,
          }}
        >
          <p style={{ color: "var(--success)", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={18} /> ALL CLEAR — No Active Backlogs
          </p>
        </motion.div>
      )}

      {/* Ranking */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card"
        style={{
          marginBottom: 24,
          display: "flex",
          gap: 32,
          flexWrap: "wrap",
          opacity: semesterRanking ? 1 : 0.6,
        }}
      >
        {(() => {
          const cgpaRankNum = semesterRanking ? (semesterRanking.cgpaRank || semesterRanking.universityRank) : null;
          const sgpaRankNum = semesterRanking ? (semesterRanking.sgpaRank || semesterRanking.universityRank) : null;
          const isCgpaTop50 = cgpaRankNum && cgpaRankNum <= 50;
          const isSgpaTop50 = sgpaRankNum && sgpaRankNum <= 50;

          return (
            <>
              <motion.div 
                whileHover={isCgpaTop50 ? { scale: 1.05 } : {}} 
                whileTap={isCgpaTop50 ? { scale: 0.95 } : {}}
                onClick={() => isCgpaTop50 && navigate(`/leaderboard?highlight=${regNo}&tab=cgpa`)}
                style={{ cursor: isCgpaTop50 ? "pointer" : "default" }}
                title={semesterRanking && !isCgpaTop50 ? "Rank must be 50 or better to view on Leaderboard" : ""}
              >
                <p style={{ color: "var(--secondary)", fontSize: 12 }}>
                  CGPA RANK
                </p>
                <p
                  style={{
                    fontFamily: "Space Mono",
                    fontSize: 24,
                    fontWeight: 700,
                    color: semesterRanking ? "var(--accent)" : "var(--muted)",
                  }}
                >
                  {semesterRanking ? `#${cgpaRankNum}` : "—"}
                </p>
                <p style={{ fontSize: 12, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                  {semesterRanking ? `of ${semesterRanking.totalStudents}` : "Not Generated"}
                </p>
              </motion.div>
              <motion.div
                whileHover={isSgpaTop50 ? { scale: 1.05 } : {}} 
                whileTap={isSgpaTop50 ? { scale: 0.95 } : {}}
                onClick={() => isSgpaTop50 && navigate(`/leaderboard?highlight=${regNo}&tab=sgpa`)}
                style={{ cursor: isSgpaTop50 ? "pointer" : "default" }}
                title={semesterRanking && !isSgpaTop50 ? "Rank must be 50 or better to view on Leaderboard" : ""}
              >
                <p style={{ color: "var(--secondary)", fontSize: 12 }}>SGPA RANK</p>
                <p
                  style={{
                    fontFamily: "Space Mono",
                    fontSize: 24,
                    fontWeight: 700,
                    color: semesterRanking ? "#a855f7" : "var(--muted)",
                  }}
                >
                  {semesterRanking ? `#${sgpaRankNum}` : "—"}
                </p>
                <p style={{ fontSize: 12, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                  {semesterRanking ? `of ${semesterRanking.totalStudents}` : "Not Generated"}
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/leaderboard?highlight=${regNo}&branch=${branch}&tab=sgpa`)}
                style={{ cursor: "pointer" }}
                title="View Branch Leaderboard"
              >
                <p style={{ color: "var(--secondary)", fontSize: 12 }}>BRANCH RANK</p>
                <p
                  style={{
                    fontFamily: "Space Mono",
                    fontSize: 24,
                    fontWeight: 700,
                    color: semesterRanking ? "#22c55e" : "var(--muted)",
                  }}
                >
                  {semesterRanking && semesterRanking.deptRank ? `#${semesterRanking.deptRank}` : "—"}
                </p>
                <p style={{ fontSize: 12, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                  {semesterRanking && semesterRanking.deptStudents ? `of ${semesterRanking.deptStudents}` : "Not Generated"}
                </p>
              </motion.div>
            </>
          );
        })()}
        <div>
          <p style={{ color: "var(--secondary)", fontSize: 12 }}>
            PERCENTILE
          </p>
          <p
            style={{
              fontFamily: "Space Mono",
              fontSize: 24,
              fontWeight: 700,
              color: semesterRanking ? "var(--success)" : "var(--muted)",
            }}
          >
            {semesterRanking ? `${semesterRanking.percentile}%` : "—"}
          </p>
          <p style={{ fontSize: 12, color: "var(--secondary)" }}>
            {semesterRanking ? `Top ${(100 - semesterRanking.percentile).toFixed(1)}%` : "Not Generated"}
          </p>
        </div>
      </motion.div>

      {/* Semester Selector — YouTube pill style */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "inline-flex", gap: 2, background: "#212121", padding: "4px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", maxWidth: "100%" }}>
          {results.map((r) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={r.semester}
              onClick={() => {
                setSelectedSem(r.semester);
                loadSemester(r.semester);
              }}
              style={{
                padding: "7px 16px",
                borderRadius: 20,
                border: "none",
                background: selectedSem === r.semester ? "#3f3f3f" : "transparent",
                color: selectedSem === r.semester ? "#f1f1f1" : "#aaaaaa",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.2s",
                boxShadow: selectedSem === r.semester ? "0 1px 4px rgba(0,0,0,0.4)" : "none",
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
        <Spinner />
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

                {internalSubjects.length > 0 && !isMobile ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", background: "#212121", borderRadius: 12, overflow: "hidden", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <th style={{ padding: "14px 16px", fontSize: 12, color: "#aaaaaa", fontWeight: 600 }}>Subject</th>
                          {getInternalAssessments(internalSubjects[0], internalMarks.semester).map((a, i) => (
                             <th key={i} style={{ padding: "14px 16px", textAlign: "center", fontSize: 12, color: "#aaaaaa", fontWeight: 600 }}>{a.label}</th>
                          ))}
                          <th style={{ padding: "14px 16px", textAlign: "right", fontSize: 12, color: "#aaaaaa", fontWeight: 600 }}>Total</th>
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
                                      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
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
                )}
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

          {tab === "baskets" && <BasketDashboard results={studentData.results} />}
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
