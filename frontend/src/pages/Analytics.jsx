import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  LineChart,
  Line,
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
import { Spinner } from "../components/LoadingSpinner";
import { motion, animate } from "framer-motion";
import { TrendingUp, TrendingDown, Star, Trophy, CheckCircle, AlertTriangle, Target, Medal, Award, BarChart2, PieChart, Briefcase, GraduationCap, Check, X, ArrowLeft, Building2, FileText } from "lucide-react";

const GRADE_POINTS = { O: 10, E: 9, A: 8, B: 7, C: 6, D: 5, F: 2, R: 0, M: 0, S: 0 };
const GRADE_ORDER = ["O", "E", "A", "B", "C", "D", "F"];

// Truncate to 2 decimal places — official university formula uses floor, NOT round
// Example: 93/18 = 5.1666... → 5.16 (correct), Math.round gives 5.17 (wrong)
function trunc2(x) {
  return Math.floor(x * 100) / 100;
}

// Live-calculate SGPA from a semester's subjects (mirrors backend & GradeSheet exactly)
function calcSGPA(subjects, semester) {
  let totalWeighted = 0, totalCredits = 0;
  (subjects || []).forEach((s) => {
    // Exception: Sem 5 R-grade 6-credit project is fully excluded
    if (
      Number(semester) === 5 &&
      s.grade === 'R' &&
      Number(s.credit) === 6 &&
      s.type && s.type.toLowerCase().includes('proj')
    ) return;
    // All other grades (F=2, R=0, S=0, M=0) contribute per official formula
    if (s.credit && GRADE_POINTS[s.grade] !== undefined) {
      totalWeighted += s.credit * GRADE_POINTS[s.grade];
      totalCredits += s.credit;
    }
  });
  // Official formula: truncate to 2 decimal places (floor)
  return totalCredits > 0 ? trunc2(totalWeighted / totalCredits) : 0;
}

function AnimatedNumber({ value }) {
  const nodeRef = useRef();

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || value == null || Number.isNaN(value)) return;

    const startValue = parseFloat(node.textContent) || value;
    if (Number.isNaN(startValue)) return;

    const controls = animate(startValue, value, {
      duration: 0.6,
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
  let cgpaNumerator = 0;
  let cgpaDenominator = 0;

  // Calculate SGPA per semester, then weighted-average for CGPA
  results.slice(0, upToIdx + 1).forEach((r) => {
    let semTW = 0;
    let semTC = 0;
    r.subjects.forEach((s) => {
      // Exception: Sem 5 R-grade 6-credit project is fully excluded
      if (Number(r.semester) === 5 && s.grade === 'R' && (Number(s.credit) === 6 && (s.type && s.type.toLowerCase().includes('proj')))) return;
      // All other grades (F=2, R=0, S=0, M=0) contribute per official formula
      if (s.credit && GRADE_POINTS[s.grade] !== undefined) {
        semTW += s.credit * GRADE_POINTS[s.grade];
        semTC += s.credit;
      }
    });
    
    if (semTC > 0) {
      // Official formula: SGPA TRUNCATED (floor) to 2 decimal places per semester
      let semSGPA = trunc2(semTW / semTC);
      cgpaNumerator += semSGPA * semTC;
      cgpaDenominator += semTC;
    }
  });

  // CGPA = Σ(SGPA_i × Credits_i) / Σ(Credits_i), truncated to 2 decimal places
  return cgpaDenominator > 0 ? trunc2(cgpaNumerator / cgpaDenominator) : 0;
}

function generateInsights(data) {
  const insights = [];
  const { results, cgpa, latestSgpa, backlogs, ranking, branch } = data;
  // Use live-calculated SGPAs for accuracy
  const liveSGPAs = results.map(r => calcSGPA(r.subjects, r.semester));
  if (results.length >= 2) {
    const prev = liveSGPAs[liveSGPAs.length - 2];
    const curr = liveSGPAs[liveSGPAs.length - 1];
    const diff = (curr - prev).toFixed(2);
    if (diff > 0)
      insights.push({
        icon: <TrendingUp size={18} color="var(--success)" />,
        text: `Your SGPA improved by ${diff} this semester. Great progress!`,
        type: "success",
      });
    else if (diff < 0)
      insights.push({
        icon: <TrendingDown size={18} color="var(--warning)" />,
        text: `Your SGPA dropped by ${Math.abs(diff)}. Focus on improvement next semester.`,
        type: "warning",
      });
  }
  const bestSemIdx = liveSGPAs.reduce((bestIdx, sgpa, i) => sgpa > (liveSGPAs[bestIdx] || 0) ? i : bestIdx, 0);
  const bestSem = results[bestSemIdx];
  const bestSGPA = liveSGPAs[bestSemIdx];
  if (bestSem)
    insights.push({
      icon: <Star size={18} color="var(--accent)" />,
      text: `Your strongest semester is Semester ${bestSem.semester} with SGPA ${bestSGPA?.toFixed(2)}.`,
      type: "info",
    });
  if (cgpa >= 8.5)
    insights.push({
      icon: <Trophy size={18} color="var(--success)" />,
      text: "You are performing above department average. Keep it up!",
      type: "success",
    });
  if (backlogs.length === 0)
    insights.push({
      icon: <CheckCircle size={18} color="var(--success)" />,
      text: "Excellent! You have no active backlogs.",
      type: "success",
    });
  if (backlogs.length > 0)
    insights.push({
      icon: <AlertTriangle size={18} color="var(--danger)" />,
      text: `You have ${backlogs.length} active backlog(s). Prioritize clearing them.`,
      type: "danger",
    });
  if (ranking) {
    if (ranking.universityRank <= 10)
      insights.push({
        icon: <Target size={18} color="var(--success)" />,
        text: `You are ranked #${ranking.universityRank} in the university. Outstanding!`,
        type: "success",
      });
    if (ranking.deptRank <= 5)
      insights.push({
        icon: <Medal size={18} color="var(--success)" />,
        text: `Top 5 in your department — Rank #${ranking.deptRank}!`,
        type: "success",
      });
  }
  if (latestSgpa >= 9.0)
    insights.push({
      icon: <Award size={18} color="var(--success)" />,
      text: "Eligible for Academic Excellence badge this semester!",
      type: "success",
    });
  return insights;
}

export default function Analytics() {
  const { regNo } = useParams();
  const { studentData, fetchStudent, loading } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [targetCGPA, setTargetCGPA] = useState("");
  const [whatIfGrades, setWhatIfGrades] = useState({});
  const [whatIfCGPA, setWhatIfCGPA] = useState(null);
  const [whatIfSGPA, setWhatIfSGPA] = useState(null);

  useEffect(() => {
    if (!studentData || studentData.regNo !== regNo) fetchStudent(regNo);
  }, [regNo]);

  const radarData = useMemo(() => {
    if (!studentData || !studentData.results) return [];
    
    let theoryW = 0, theoryC = 0;
    let practicalW = 0, practicalC = 0;
    let projectW = 0, projectC = 0;

    studentData.results.forEach(r => {
      r.subjects?.forEach(s => {
        if (!s.credit || !GRADE_POINTS[s.grade]) return;
        const type = s.type ? s.type.toLowerCase() : (s.subName ? s.subName.toLowerCase() : "");
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
      { subject: 'Theory', score: theoryC ? (theoryW / theoryC) * 10 : 0, fullMark: 100 },
      { subject: 'Practical', score: practicalC ? (practicalW / practicalC) * 10 : 0, fullMark: 100 },
      { subject: 'Projects', score: projectC ? (projectW / projectC) * 10 : 0, fullMark: 100 },
    ];
  }, [studentData]);

  // What-if simulator (Auto-calculate)
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
        const grade =
          isLatest && whatIfGrades[s.subCode]
            ? whatIfGrades[s.subCode]
            : s.grade;
            
        // Exception: Sem 5 R-grade 6-credit project is fully excluded
        if (Number(r.semester) === 5 && grade === 'R' && (Number(s.credit) === 6 && (s.type && s.type.toLowerCase().includes('proj')))) {
          return;
        }

        // All other grades (F=2, R=0, S=0, M=0) contribute per official formula
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
        // Official formula: SGPA TRUNCATED (floor) to 2 decimal places per semester
        let semSGPA = trunc2(semTW / semTC);
        cgpaNumerator += semSGPA * semTC;
        cgpaDenominator += semTC;
      }
    });
    
    // CGPA = Σ(SGPA_i × Credits_i) / Σ(Credits_i), truncated to 2 decimal places
    setWhatIfCGPA(cgpaDenominator > 0 ? trunc2(cgpaNumerator / cgpaDenominator).toFixed(2) : "0.00");
    setWhatIfSGPA(sgpa_tc > 0 ? trunc2(sgpa_tw / sgpa_tc).toFixed(2) : "0.00");
  }, [whatIfGrades, studentData]);

  if (loading || !studentData)
    return (
      <div className="page">
        <Spinner />
      </div>
    );

  const {
    results,
    cgpa,
    latestSgpa,
    latestSemester,
    totalCredits,
    creditsCleared,
    backlogs,
    ranking,
    studentName,
    branch,
    batch,
  } = studentData;

  // Chart data — use live-calculated SGPA so it always matches the report card
  const chartData = results.map((r, i) => ({
    sem: `Sem ${r.semester}`,
    SGPA: parseFloat(calcSGPA(r.subjects, r.semester).toFixed(2)),
    CGPA: calcCGPAUpTo(results, i),
  }));

  // CGPA predictor
  const remainingSems = 8 - latestSemester;
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

  // Radar Chart Data calculated above

  // Subject analysis
  const latestSubjects = results[results.length - 1]?.subjects || [];
  const graded = latestSubjects.filter(
    (s) => s.grade && s.grade !== "F" && GRADE_POINTS[s.grade],
  );
  const best = graded.reduce(
    (a, s) =>
      (GRADE_POINTS[s.grade] || 0) > (GRADE_POINTS[a?.grade] || 0) ? s : a,
    graded[0],
  );
  const worst = graded.reduce(
    (a, s) =>
      (GRADE_POINTS[s.grade] || 0) < (GRADE_POINTS[a?.grade] || 0) ? s : a,
    graded[0],
  );

  // Placement readiness
  const placementScore = Math.round(
    Math.min((cgpa / 10) * 40, 40) +
      (backlogs.length === 0 ? 30 : Math.max(0, 30 - backlogs.length * 10)) +
      (latestSgpa >= 8.5 ? 20 : latestSgpa >= 7.5 ? 15 : 10) +
      10,
  );

  const companies = [
    { name: "TCS", cgpaReq: 6.0, noBacklog: false },
    { name: "Infosys", cgpaReq: 6.5, noBacklog: false },
    { name: "Wipro", cgpaReq: 6.5, noBacklog: false },
    { name: "Accenture", cgpaReq: 7.0, noBacklog: true },
    { name: "Amazon", cgpaReq: 7.5, noBacklog: true },
    { name: "Microsoft", cgpaReq: 8.0, noBacklog: true },
    { name: "Google", cgpaReq: 8.5, noBacklog: true },
  ];

  const insights = generateInsights(studentData);

  const typeColor = {
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    info: "var(--accent)",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="page">
      <div style={{ marginBottom: 28 }}>
        <button
          className="btn btn-ghost"
          onClick={() => navigate(`/dashboard/${regNo}`)}
          style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}
        >
          <ArrowLeft size={16} /> Dashboard
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Academic Analytics</h1>
        <p style={{ color: "var(--secondary)" }}>
          {studentName} · {branch} · Batch {batch}
        </p>
      </div>

      <div className="tabs" style={{ marginBottom: 28 }}>
        {[
          ["overview", "Overview", <BarChart2 size={14} key="ov" />],
          ["predictor", "Predictor", <Target size={14} key="pr" />],
          ["whatif", "What-If", <PieChart size={14} key="wi" />],
          ["placement", "Placement", <Briefcase size={14} key="pl" />],
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

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
      {tab === "overview" && (
        <div>
          {/* Stats row */}
          <div className="grid-4" style={{ marginBottom: 28 }}>
            <motion.div whileHover={{ y: -4 }} className="stat-card">
              <span className="label">CGPA</span>
              <span className="value" style={{ color: "var(--accent)" }}>
                {cgpa}
              </span>
              <span className="sub">Cumulative</span>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} className="stat-card">
              <span className="label">Latest SGPA</span>
              <span className="value">{latestSgpa?.toFixed(2)}</span>
              <span className="sub">Sem {latestSemester}</span>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} className="stat-card">
              <span className="label">Credits Done</span>
              <span className="value">{creditsCleared}</span>
              <span className="sub">of 160</span>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} className="stat-card">
              <span className="label">Backlogs</span>
              <span
                className="value"
                style={{
                  color: backlogs.length ? "var(--danger)" : "var(--success)",
                }}
              >
                {backlogs.length}
              </span>
              <span className="sub">
                {backlogs.length ? "Active" : "All Clear"}
              </span>
            </motion.div>
          </div>

          {/* Charts Grid */}
          <div className="grid-2" style={{ marginBottom: 24, alignItems: "stretch" }}>
            {/* CGPA Trend Chart */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ display: "flex", flexDirection: "column" }}>
              <h3 style={{ marginBottom: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={18} /> SGPA & CGPA Trend
              </h3>
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 180 : 260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="sem" tick={{ fill: "#aaa", fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: "#aaa", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#212121",
                        border: "1px solid #2a2a2a",
                        borderRadius: 8,
                        color: "#f1f1f1",
                      }}
                    />
                    <ReferenceLine
                      y={cgpa}
                      stroke="#a855f7"
                      strokeDasharray="4 4"
                      label={{
                        value: `CGPA ${cgpa}`,
                        fill: "#a855f7",
                        fontSize: 11,
                      }}
                    />
                    <Line isAnimationActive={false}
                      type="monotone"
                      dataKey="SGPA"
                      stroke="#3ea6ff"
                      strokeWidth={2.5}
                      dot={{ fill: "#3ea6ff", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                    <Line isAnimationActive={false}
                      type="monotone"
                      dataKey="CGPA"
                      stroke="#a855f7"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "#a855f7", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Subject Insights Radar Chart */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ display: "flex", flexDirection: "column" }}>
              <h3 style={{ marginBottom: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <Target size={18} /> Advanced Subject Insights
              </h3>
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 200 : 260}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#aaa", fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar isAnimationActive={false}
                      name="Score"
                      dataKey="score"
                      stroke="#3ea6ff"
                      fill="#3ea6ff"
                      fillOpacity={0.4}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#212121",
                        border: "1px solid #2a2a2a",
                        borderRadius: 8,
                        color: "#f1f1f1",
                      }}
                      formatter={(value) => [value.toFixed(2), "Performance"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Subject Performance */}
          {best && worst && (
            <div className="grid-2" style={{ marginBottom: 24 }}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="card"
                style={{ borderColor: "rgba(34,197,94,0.3)" }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--secondary)",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Medal size={14} /> BEST SUBJECT
                </p>
                <p style={{ fontWeight: 700, fontSize: 16 }}>{best.subName}</p>
                <p style={{ color: "var(--secondary)", fontSize: 13 }}>
                  {best.subCode}
                </p>
                <span
                  style={{
                    marginTop: 8,
                    display: "inline-block",
                    background: "#22c55e22",
                    color: "var(--success)",
                    padding: "2px 10px",
                    borderRadius: 6,
                    fontWeight: 700,
                  }}
                >
                  {best.grade}
                </span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="card"
                style={{ borderColor: "rgba(245,158,11,0.3)" }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--secondary)",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Target size={14} /> NEEDS FOCUS
                </p>
                <p style={{ fontWeight: 700, fontSize: 16 }}>{worst.subName}</p>
                <p style={{ color: "var(--secondary)", fontSize: 13 }}>
                  {worst.subCode}
                </p>
                <span
                  style={{
                    marginTop: 8,
                    display: "inline-block",
                    background: "#f59e0b22",
                    color: "var(--warning)",
                    padding: "2px 10px",
                    borderRadius: 6,
                    fontWeight: 700,
                  }}
                >
                  {worst.grade}
                </span>
              </motion.div>
            </div>
          )}

          {/* Graduation Progress */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
                alignItems: "center"
              }}
            >
              <h3 style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <GraduationCap size={18} /> Graduation Progress
              </h3>
              <span
                style={{
                  color: "var(--accent)",
                  fontFamily: "Space Mono",
                  fontWeight: 700,
                }}
              >
                {Math.round((creditsCleared / 160) * 100)}%
              </span>
            </div>
            <div
              className="progress-bar-bg"
              style={{ height: 10, marginBottom: 8 }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((creditsCleared / 160) * 100, 100)}%` }}
                transition={{ duration: 1 }}
                className="progress-bar-fill"
                style={{
                  background: "linear-gradient(90deg, var(--accent), #a855f7)",
                }}
              />
            </div>
            <p style={{ fontSize: 13, color: "var(--secondary)" }}>
              {creditsCleared} credits completed ·{" "}
              {Math.max(0, 160 - creditsCleared)} remaining
            </p>
          </motion.div>

          {/* AI Insights */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Star size={18} /> Academic Insights
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {insights.map((ins, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "12px 14px",
                    background: typeColor[ins.type] + "10",
                    borderRadius: 8,
                    borderLeft: `3px solid ${typeColor[ins.type]}`,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{ins.icon}</span>
                  <p style={{ fontSize: 14, color: "var(--text)" }}>
                    {ins.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {tab === "predictor" && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Target size={18} /> CGPA Predictor
          </h3>
          <p
            style={{
              color: "var(--secondary)",
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            Find out what SGPA you need to achieve your target CGPA.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--secondary)",
                  marginBottom: 6,
                }}
              >
                Current CGPA
              </label>
              <input value={cgpa} disabled />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--secondary)",
                  marginBottom: 6,
                }}
              >
                Remaining Semesters
              </label>
              <input value={remainingSems} disabled />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--secondary)",
                  marginBottom: 6,
                }}
              >
                Target CGPA
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={targetCGPA}
                onChange={(e) => setTargetCGPA(e.target.value)}
                placeholder="e.g. 9.0"
              />
            </div>
          </div>
          {requiredSGPA && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: "rgba(62,166,255,0.1)",
                border: "1px solid rgba(62,166,255,0.3)",
                borderRadius: 10,
                padding: 20,
                marginTop: 8,
              }}
            >
              <p
                style={{
                  color: "var(--secondary)",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                Required SGPA in remaining semesters
              </p>
              <p
                style={{
                  fontFamily: "Space Mono",
                  fontSize: 36,
                  fontWeight: 700,
                  color: "var(--accent)",
                }}
              >
                {requiredSGPA}
              </p>
              {parseFloat(requiredSGPA) > 10 ? (
                <p style={{ color: "var(--danger)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={14} /> Target CGPA is not achievable. Try a lower target.
                </p>
              ) : parseFloat(requiredSGPA) <= 0 ? (
                <p style={{ color: "var(--success)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={14} /> You have already achieved this target!
                </p>
              ) : (
                <p style={{ color: "var(--success)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={14} /> Achievable! Maintain SGPA of {requiredSGPA} each semester.
                </p>
              )}
            </motion.div>
          )}

          {/* Degree classification */}
          <div style={{ marginTop: 28 }}>
            <h4 style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <GraduationCap size={16} /> Degree Classification
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Distinction", req: 9.0, color: "#f59e0b" },
                {
                  label: "First Class With Distinction",
                  req: 8.5,
                  color: "#3ea6ff",
                },
                { label: "First Class", req: 7.5, color: "#22c55e" },
                { label: "Second Class", req: 6.0, color: "#6b7280" },
              ].map((c) => (
                <div
                  key={c.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    background: cgpa >= c.req ? c.color + "15" : "transparent",
                    border: `1px solid ${cgpa >= c.req ? c.color + "44" : "var(--border)"}`,
                    borderRadius: 8,
                    transition: "all 0.3s",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: cgpa >= c.req ? c.color : "var(--muted)",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, fontSize: 14 }}>{c.label}</span>
                  <span style={{ fontSize: 12, color: "var(--secondary)" }}>
                    CGPA ≥ {c.req}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: cgpa >= c.req ? c.color : "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    {cgpa >= c.req ? <><Check size={12}/> Achieved</> : "Not Yet"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "whatif" && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <PieChart size={18} /> What-If Simulator
          </h3>
          <p
            style={{
              color: "var(--secondary)",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            Change grades for Semester {latestSemester} virtually and see how it
            affects your CGPA.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {latestSubjects.map((s) => (
              <div
                key={s.subCode}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: "var(--surface)",
                  borderRadius: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{s.subName}</p>
                  <p style={{ fontSize: 12, color: "var(--secondary)" }}>
                    {s.subCode} · {s.credit} credits · Current: {s.grade}
                  </p>
                </div>
                <select
                  value={whatIfGrades[s.subCode] || s.grade}
                  onChange={(e) =>
                    setWhatIfGrades({
                      ...whatIfGrades,
                      [s.subCode]: e.target.value,
                    })
                  }
                  style={{ width: 80 }}
                >
                  {GRADE_ORDER.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              className="btn btn-ghost"
              onClick={() => setWhatIfGrades({})}
              disabled={Object.keys(whatIfGrades).length === 0}
            >
              Reset All
            </button>
          </div>
          {(whatIfCGPA !== null) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 20,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 16,
              }}
            >
              {/* Simulated CGPA */}
              <div style={{ background: "rgba(62,166,255,0.06)", border: "1px solid rgba(62,166,255,0.2)", borderRadius: 10, padding: 20 }}>
                <p style={{ color: "var(--secondary)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Target size={14}/> Simulated CGPA</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
                  <p style={{ fontFamily: "Space Mono", fontSize: 42, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
                    <AnimatedNumber value={parseFloat(whatIfCGPA)} />
                  </p>
                  <p style={{
                    color: parseFloat(whatIfCGPA) > cgpa ? "var(--success)" : parseFloat(whatIfCGPA) < cgpa ? "var(--danger)" : "var(--secondary)",
                    fontWeight: 600,
                  }}>
                    {parseFloat(whatIfCGPA) > cgpa ? `▲ +${(whatIfCGPA - cgpa).toFixed(2)}` : parseFloat(whatIfCGPA) < cgpa ? `▼ ${(whatIfCGPA - cgpa).toFixed(2)}` : "→ No change"} from {cgpa}
                  </p>
                </div>
              </div>

              {/* Simulated SGPA */}
              <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: 20 }}>
                <p style={{ color: "var(--secondary)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><TrendingUp size={14}/> Simulated SGPA</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
                  <p style={{ fontFamily: "Space Mono", fontSize: 42, fontWeight: 800, color: "var(--success)", lineHeight: 1 }}>
                    <AnimatedNumber value={parseFloat(whatIfSGPA)} />
                  </p>
                  <p style={{
                    color: parseFloat(whatIfSGPA) > latestSgpa ? "var(--success)" : parseFloat(whatIfSGPA) < latestSgpa ? "var(--danger)" : "var(--secondary)",
                    fontWeight: 600,
                  }}>
                    {parseFloat(whatIfSGPA) > latestSgpa ? `▲ +${(whatIfSGPA - latestSgpa).toFixed(2)}` : parseFloat(whatIfSGPA) < latestSgpa ? `▼ ${(whatIfSGPA - latestSgpa).toFixed(2)}` : "→ No change"} from {latestSgpa?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {tab === "placement" && (
        <div>
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <motion.div
              whileHover={{ y: -2 }}
              className="card"
              style={{
                borderColor:
                  placementScore >= 75
                    ? "rgba(34,197,94,0.4)"
                    : "rgba(245,158,11,0.4)",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "var(--secondary)",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Briefcase size={14} /> PLACEMENT READINESS
              </p>
              <p
                style={{
                  fontFamily: "Space Mono",
                  fontSize: 48,
                  fontWeight: 800,
                  color:
                    placementScore >= 75 ? "var(--success)" : "var(--warning)",
                }}
              >
                {placementScore}
                <span style={{ fontSize: 20 }}>/100</span>
              </p>
              <p
                style={{
                  fontWeight: 600,
                  color:
                    placementScore >= 75 ? "var(--success)" : "var(--warning)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4
                }}
              >
                {placementScore >= 75
                  ? <><CheckCircle size={14} /> Ready for Placements</>
                  : <><AlertTriangle size={14} /> Needs Improvement</>}
              </p>
              <div className="progress-bar-bg" style={{ marginTop: 12 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${placementScore}%` }}
                  transition={{ duration: 1 }}
                  className="progress-bar-fill"
                  style={{
                    background:
                      placementScore >= 75
                        ? "var(--success)"
                        : "var(--warning)",
                  }}
                />
              </div>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} className="card">
              <p
                style={{
                  fontSize: 12,
                  color: "var(--secondary)",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <FileText size={14} /> ELIGIBILITY FACTORS
              </p>
              {[
                { label: "CGPA Score", val: `${cgpa} / 10`, ok: cgpa >= 6.5 },
                {
                  label: "No Active Backlogs",
                  val:
                    backlogs.length === 0
                      ? "Yes"
                      : `${backlogs.length} pending`,
                  ok: backlogs.length === 0,
                },
                {
                  label: "SGPA Performance",
                  val: latestSgpa?.toFixed(2),
                  ok: latestSgpa >= 7,
                },
              ].map((f) => (
                <div
                  key={f.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{f.label}</span>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span style={{ fontFamily: "Space Mono", fontSize: 13 }}>
                      {f.val}
                    </span>
                    <span
                      style={{
                        color: f.ok ? "var(--success)" : "var(--danger)",
                        fontSize: 16,
                      }}
                    >
                      {f.ok ? <Check size={16} /> : <X size={16} />}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={18} /> Company Eligibility
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {companies.map((co, i) => {
                const eligible =
                  cgpa >= co.cgpaReq &&
                  (!co.noBacklog || backlogs.length === 0);
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={co.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 14,
                      padding: "12px 16px",
                      background: eligible
                        ? "rgba(34,197,94,0.06)"
                        : "rgba(239,68,68,0.06)",
                      border: `1px solid ${eligible ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)"}`,
                      borderRadius: 10,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>
                      <Building2 color={eligible ? "var(--success)" : "var(--danger)"} size={20} />
                    </span>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>
                      {co.name}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--secondary)" }}>
                      CGPA ≥ {co.cgpaReq}
                      {co.noBacklog ? " · No Backlog" : ""}
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: eligible ? "var(--success)" : "var(--danger)",
                        background: eligible
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(239,68,68,0.15)",
                        padding: "3px 10px",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      {eligible ? <><Check size={14}/> Eligible</> : <><X size={14}/> Not Eligible</>}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
      </motion.div>
    </motion.div>
  );
}
