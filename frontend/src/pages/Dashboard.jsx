import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Spinner, SkeletonGrid } from "../components/LoadingSpinner";
import GradeSheet from "../components/GradeSheet";
import axios from "axios";
import { motion } from "framer-motion";
import { User, TrendingUp, Star, Target, CheckCircle, Trophy, Award, AlertTriangle, FileText, FileEdit, Calendar, Printer } from "lucide-react";

const GRADE_COLORS = {
  O: "#f59e0b",
  E: "#22c55e",
  A: "#3ea6ff",
  B: "#a855f7",
  C: "#f97316",
  D: "#6b7280",
  F: "#ef4444",
};

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

export default function Dashboard() {
  const { regNo } = useParams();
  const { studentData, fetchStudent, loading, error, API } = useApp();
  const [tab, setTab] = useState("result");
  const [selectedSem, setSelectedSem] = useState(null);
  const [semResult, setSemResult] = useState(null);
  const [internalMarks, setInternalMarks] = useState(null);
  const [semesterRanking, setSemesterRanking] = useState(null);
  const [loadingSem, setLoadingSem] = useState(false);
  const navigate = useNavigate();

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
              {regNo} · {branch} · Batch {batch}
            </p>
          </div>
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
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "var(--radius)",
            padding: "16px 20px",
            marginBottom: 24,
          }}
        >
          <p
            style={{ color: "var(--danger)", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}
          >
            <AlertTriangle size={18} /> Active Backlogs Found
          </p>
          {backlogs.map((b, i) => (
            <p key={i} style={{ color: "var(--secondary)", fontSize: 13, marginLeft: 26 }}>
              • {b.subName} ({b.subCode})
            </p>
          ))}
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

      {/* Semester Selector */}
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}
      >
        {results.map((r) => (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key={r.semester}
            onClick={() => {
              setSelectedSem(r.semester);
              loadSemester(r.semester);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${selectedSem === r.semester ? "var(--accent)" : "var(--border)"}`,
              background:
                selectedSem === r.semester
                  ? "rgba(62,166,255,0.1)"
                  : "transparent",
              color:
                selectedSem === r.semester
                  ? "var(--accent)"
                  : "var(--secondary)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            Sem {r.semester}
          </motion.button>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {[
          ["result", "Result", <FileText size={14} key="result" />],
          ["internal", "Internal Marks", <FileEdit size={14} key="int" />],
          ["history", "Semester History", <Calendar size={14} key="hist" />],
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
        >
          {tab === "result" && (
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <GradeSheet result={semResult} studentData={studentData} />
            </div>
          )}

          {tab === "internal" &&
            (internalMarks ? (
              <div>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => window.print()}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Printer size={16} /> Print
                  </button>
                </div>
                <div className="table-wrap desktop-only">
                  <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                      <tr>
                        <th rowSpan="2" style={{ borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", width: "40px", textAlign: "center" }}>#</th>
                        <th rowSpan="2" style={{ borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>SUBJECT DETAILS</th>
                        <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>MID SEMESTER</th>
                        <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>PRESENTATION</th>
                        <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>ASSIGNMENT</th>
                        <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>LEARNING RECORD</th>
                        <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>INTERNAL PRACTICAL</th>
                        <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>PROJECT INTERNAL</th>
                        <th rowSpan="2" style={{ color: "var(--success)", borderBottom: "1px solid var(--success)", borderLeft: "1px solid var(--success)22", textAlign: "center" }}>TOTAL SCORE</th>
                      </tr>
                      <tr>
                        {[...Array(6)].map((_, i) => (
                          <React.Fragment key={i}>
                            <th style={{ fontSize: 9, color: "#3ea6ff", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", textAlign: "center", padding: "8px 4px" }}>OBTAINED</th>
                            <th style={{ fontSize: 9, color: "#a855f7", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", textAlign: "center", padding: "8px 4px" }}>ROUND OFF</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {internalMarks.subjects.map((s, i) => {
                        let calcTotalObtained = 0;
                        let calcTotalMax = 0;
                        let hasAny = false;
                        return (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ color: "var(--secondary)", borderRight: "1px solid var(--border)", textAlign: "center" }}>{i + 1}</td>
                          <td style={{ borderRight: "1px solid var(--border)", padding: "12px 16px" }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{s.subName}</div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <span style={{ fontSize: 10, color: "var(--secondary)", background: "var(--bg-card)", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--border)" }}>{s.subCode}</span>
                              <span style={{ fontSize: 10, color: "#a855f7", background: "rgba(168,85,247,0.1)", padding: "2px 6px", borderRadius: 4 }}>{s.type}</span>
                            </div>
                          </td>
                          {[
                            [s.midSemObtained, s.midSemMax, s.midSemRoundOff],
                            [s.presentationObtained, s.presentationMax, s.presentationRoundOff],
                            [s.assignmentObtained, s.assignmentMax, s.assignmentRoundOff],
                            [s.learningRecordObtained, s.learningRecordMax, s.learningRecordRoundOff],
                            [s.internalPracticalObtained, s.internalPracticalMax, s.internalPracticalRoundOff],
                            [s.projectInternalObtained, s.projectInternalMax, s.projectInternalRoundOff],
                          ].map(([obt, max, roundOff], ci) => {
                            const calculatedRoundOff = obt != null ? Math.round(obt) : null;
                            const finalObt = calculatedRoundOff != null ? calculatedRoundOff : obt;
                            if (finalObt != null) {
                              calcTotalObtained += finalObt;
                              if (max != null) calcTotalMax += max;
                              hasAny = true;
                            }
                            return (
                            <React.Fragment key={ci}>
                              <td style={{ textAlign: "center", borderRight: "1px dashed rgba(255,255,255,0.05)", padding: "8px" }}>
                                {obt != null ? (
                                  <span style={{ display: "inline-block", color: "#3ea6ff", fontWeight: 700, background: "rgba(62,166,255,0.08)", padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
                                    {obt} <span style={{ color: "rgba(62,166,255,0.6)", fontSize: 10, fontWeight: 500 }}>/{max}</span>
                                  </span>
                                ) : <span style={{ color: "var(--muted)" }}>—</span>}
                              </td>
                              <td style={{ textAlign: "center", borderRight: "1px solid var(--border)", padding: "8px" }}>
                                {calculatedRoundOff != null ? (
                                  <span style={{ display: "inline-block", color: "#a855f7", fontWeight: 700, background: "rgba(168,85,247,0.08)", padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
                                    {calculatedRoundOff} <span style={{ color: "rgba(168,85,247,0.6)", fontSize: 10, fontWeight: 500 }}>/{max}</span>
                                  </span>
                                ) : <span style={{ color: "var(--muted)" }}>—</span>}
                              </td>
                            </React.Fragment>
                            );
                          })}
                          <td style={{ fontWeight: 800, color: "var(--success)", borderLeft: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.02)", textAlign: "center", fontSize: 15 }}>
                            {hasAny ? (
                              <span style={{ display: "inline-block", border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.1)", padding: "6px 12px", borderRadius: 6, whiteSpace: "nowrap" }}>
                                {calcTotalObtained} <span style={{ color: "rgba(34,197,94,0.6)", fontSize: 12, fontWeight: 500 }}>/{calcTotalMax || s.totalMax || s.totalScore}</span>
                              </span>
                            ) : (
                              <span style={{ color: "var(--muted)" }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive View */}
                <div className="mobile-only">
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {internalMarks.subjects.map((s, i) => {
                    let calcTotalObtained = 0;
                    let calcTotalMax = 0;
                    let hasAny = false;

                    const mobileAssessments = [
                      { label: "Mid Sem", obt: s.midSemObtained, max: s.midSemMax, rnd: s.midSemRoundOff },
                      { label: "Presentation", obt: s.presentationObtained, max: s.presentationMax, rnd: s.presentationRoundOff },
                      { label: "Assignment", obt: s.assignmentObtained, max: s.assignmentMax, rnd: s.assignmentRoundOff },
                      { label: "Learning Record", obt: s.learningRecordObtained, max: s.learningRecordMax, rnd: s.learningRecordRoundOff },
                      { label: "Internal Prac", obt: s.internalPracticalObtained, max: s.internalPracticalMax, rnd: s.internalPracticalRoundOff },
                      { label: "Project Internal", obt: s.projectInternalObtained, max: s.projectInternalMax, rnd: s.projectInternalRoundOff },
                    ];

                    mobileAssessments.forEach(item => {
                      const calculatedRnd = item.obt != null ? Math.round(item.obt) : null;
                      const finalObt = calculatedRnd != null ? calculatedRnd : item.obt;
                      if (finalObt != null) {
                        calcTotalObtained += finalObt;
                        if (item.max != null) calcTotalMax += item.max;
                        hasAny = true;
                      }
                      // Override the rnd property so the UI below renders it
                      item.rnd = calculatedRnd;
                    });

                    return (
                    <div key={i} className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.subName}</div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 10, color: "var(--secondary)", background: "var(--bg-card)", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--border)" }}>{s.subCode}</span>
                            <span style={{ fontSize: 10, color: "#a855f7", background: "rgba(168,85,247,0.1)", padding: "2px 6px", borderRadius: 4 }}>{s.type}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "var(--secondary)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 2 }}>Total</div>
                          <div style={{ fontWeight: 800, color: "var(--success)", fontSize: 15 }}>
                            {hasAny ? (
                              <span style={{ display: "inline-block", border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.1)", padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
                                {calcTotalObtained} <span style={{ color: "rgba(34,197,94,0.6)", fontSize: 10, fontWeight: 500 }}>/{calcTotalMax || s.totalMax || s.totalScore}</span>
                              </span>
                            ) : (
                              <span style={{ color: "var(--muted)" }}>—</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                        {mobileAssessments.filter(x => x.obt != null || x.rnd != null).map((item, idx) => (
                          <div key={idx} style={{ background: "rgba(255,255,255,0.02)", padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 10, color: "var(--secondary)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 6 }}>{item.label}</div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <div style={{ fontSize: 12 }}>
                                  <span style={{ color: "var(--secondary)", fontSize: 10, marginRight: 4 }}>OBT</span>
                                  {item.obt != null ? <span style={{ display: "inline-block", color: "#3ea6ff", fontWeight: 700, background: "rgba(62,166,255,0.08)", padding: "2px 6px", borderRadius: 6, whiteSpace: "nowrap" }}>{item.obt} <span style={{ color: "rgba(62,166,255,0.6)", fontSize: 9 }}>/{item.max}</span></span> : <span style={{ color: "var(--muted)" }}>—</span>}
                                </div>
                                <div style={{ fontSize: 12 }}>
                                  <span style={{ color: "var(--secondary)", fontSize: 10, marginRight: 4 }}>RND</span>
                                  {item.rnd != null ? <span style={{ display: "inline-block", color: "#a855f7", fontWeight: 700, background: "rgba(168,85,247,0.08)", padding: "2px 6px", borderRadius: 6, whiteSpace: "nowrap" }}>{item.rnd} <span style={{ color: "rgba(168,85,247,0.6)", fontSize: 9 }}>/{item.max}</span></span> : <span style={{ color: "var(--muted)" }}>—</span>}
                                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    );
                  })}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--secondary)", padding: 20 }}>
                No internal marks data available for this semester.
              </p>
            ))}

          {tab === "history" && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Semester</th>
                    <th>SGPA</th>
                    <th>Total Credits</th>
                    <th>Credits Cleared</th>
                    <th>Status</th>
                    <th>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={r.semester}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedSem(r.semester);
                        loadSemester(r.semester);
                        setTab("result");
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>Semester {r.semester}</td>
                      <td
                        style={{
                          fontFamily: "Space Mono",
                          color:
                            r.sgpa >= 9
                              ? "var(--success)"
                              : r.sgpa >= 7
                                ? "var(--accent)"
                                : "var(--warning)",
                        }}
                      >
                        {r.sgpa?.toFixed(2)}
                      </td>
                      <td>{r.totalCredits}</td>
                      <td>{r.creditsCleared}</td>
                      <td>
                        <span
                          className={`badge ${r.creditsCleared === r.totalCredits ? "badge-success" : "badge-danger"}`}
                        >
                          {r.creditsCleared === r.totalCredits
                            ? "Clear"
                            : "Backlog"}
                        </span>
                      </td>
                      <td style={{ color: "var(--secondary)" }}>
                        {r.session || "—"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
