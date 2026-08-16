import { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download, Image as ImageIcon, Printer, GraduationCap, AlertTriangle, ZoomIn, ZoomOut, Info } from "lucide-react";
import {
  FAIL_GRADES,
  calculateCGPA,
  calculateSemesterMetrics,
} from "../utils/gradeCalculations";

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

const GRADE_LABEL = { F: "Fail (Backlog)", R: "Repeat (Backlog)", S: "Suppl. (Backlog)", M: "Malpractice" };
const GRADE_COLOR = {
  O: "#15803d",
  E: "#1d4ed8",
  A: "#1d4ed8",
  B: "#1d4ed8",
  C: "#b45309",
  D: "#b45309",
  F: "#dc2626",
  R: "#dc2626",
  S: "#dc2626",
  M: "#dc2626",
};

export default function GradeSheet({ result, studentData, highlightedSubject }) {
  const sheetRef = useRef();
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 860) {
        // Default to 35% on standard mobile devices to guarantee no cutoff
        const perfectZoom = window.innerWidth < 500 ? 0.35 : (window.innerWidth - 32) / 820;
        setZoomLevel(Number(Math.min(perfectZoom, 1).toFixed(2)));
      } else {
        setZoomLevel(1);
      }
    };
    handleResize(); // Initial calculation
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!result) return null;

  const subjects = result.subjects || [];

  const { totalCredits, creditsCleared, sgpa: calculatedSgpa } = calculateSemesterMetrics(
    subjects,
    result.semester,
  );
  const sgpa =
    subjects && subjects.length > 0
      ? calculatedSgpa
      : typeof result.sgpa === "number"
        ? result.sgpa
        : calculatedSgpa;
  const hasFailed = subjects.some((s) => FAIL_GRADES.includes(s.grade));

  const allResults = studentData?.results || [];
  const cgpaUpToNow = calculateCGPA(allResults, result.semester);
  const hasGradeF =
    subjects.some((s) => s.grade === "F") ||
    allResults.some((r) => (r.subjects || []).some((s) => s.grade === "F"));

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function downloadPDF() {
    const canvas = await html2canvas(sheetRef.current, {
      scale: 4,
      backgroundColor: "#fff",
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, w, h);
    pdf.save(`GradeSheet_${result.regNo}_Sem${result.semester}.pdf`);
  }

  async function saveImage() {
    const canvas = await html2canvas(sheetRef.current, {
      scale: 4,
      backgroundColor: "#fff",
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `GradeSheet_${result.regNo}_Sem${result.semester}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  function printSheet() {
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>Grade Sheet</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Times New Roman',serif;padding:24px;color:#000;background:#fff}
      h1{font-size:20px;font-weight:800;text-align:center}
      h2{font-size:14px;font-weight:700;text-align:center;margin-top:12px;
         border-bottom:2px solid #000;display:inline-block;padding-bottom:4px}
      .center{text-align:center}
      .top-bar{display:flex;justify-content:space-between;font-size:11px;color:#555;margin-bottom:16px}
      .info-row{display:flex;margin-bottom:5px;font-size:13px}
      .info-label{font-weight:700;width:170px;flex-shrink:0}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th{border:1px solid #aaa;padding:8px 10px;background:#f0f0f0;font-size:11px;font-weight:700}
      td{border:1px solid #aaa;padding:8px 10px;font-size:12px}
      .grade-fail{color:#dc2626;font-weight:700}
      .grade-pass{color:#15803d;font-weight:700}
      .grade-avg{color:#1d4ed8;font-weight:700}
      .summary{display:flex;justify-content:space-between;padding:10px 0;
               border-top:2px solid #000;font-weight:700;color:#1a56db;font-size:13px}
      .formula-box{border-top:1px dashed #bbb;padding-top:8px;margin-top:6px;font-size:10px;color:#444}
      .warn{background:#fff5f5;border:1px solid #fecaca;border-radius:3px;
            padding:5px 8px;font-size:11px;color:#dc2626;margin-top:6px}
      .footer{display:flex;justify-content:space-between;margin-top:48px;font-size:13px;font-weight:700}
      .footer .date{color:#1a56db}
    </style></head><body>
    ${sheetRef.current.innerHTML}
    </body></html>`);
    win.document.close();
    win.print();
  }

  // Cell style helpers
  const th = (align = "center") => ({
    border: "1px solid #c0c0c0",
    padding: "9px 12px",
    background: "#f4f4f4",
    fontWeight: 700,
    fontSize: 11,
    textAlign: align,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#000",
  });
  const td = (align = "center", extra = {}) => ({
    border: "1px solid #d0d0d0",
    padding: "9px 12px",
    fontSize: 12,
    textAlign: align,
    verticalAlign: "middle",
    color: "#000",
    ...extra,
  });

  return (
    <div style={{ width: "100%", maxWidth: "100%", minWidth: 0, overflow: "hidden" }}>
      {/* ── Action Buttons & Toolbar ── */}
      <div data-html2canvas-ignore="true" className="gradesheet-toolbar">
        <div className="gradesheet-toolbar-btns">
          <button className="btn btn-primary" onClick={downloadPDF} style={{ borderRadius: 8, padding: "8px 16px" }}>
            <Download size={16} /> <span>Download</span>
          </button>
          <button className="btn btn-ghost" onClick={saveImage} style={{ borderRadius: 8, padding: "8px 16px", background: "rgba(255,255,255,0.03)" }}>
            <ImageIcon size={16} /> <span>Image</span>
          </button>
          <button className="btn btn-ghost" onClick={printSheet} style={{ borderRadius: 8, padding: "8px 16px", background: "rgba(255,255,255,0.03)" }}>
            <Printer size={16} /> <span>Print</span>
          </button>
        </div>

        <div className="gradesheet-toolbar-zoom">
          <button className="btn btn-ghost" onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.3))} style={{ padding: "6px 10px", border: "none", color: "var(--secondary)", borderRadius: 6 }}>
            <ZoomOut size={16} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", width: 48, textAlign: "center", fontFamily: "'Space Mono', monospace" }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button className="btn btn-ghost" onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 1.5))} style={{ padding: "6px 10px", border: "none", color: "var(--secondary)", borderRadius: 6 }}>
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* ── ERP Grade 'F' Evaluation Disclaimer Banner (Only for students with Grade F) ── */}
      {hasGradeF && (
        <div
          data-html2canvas-ignore="true"
          style={{
            maxWidth: 820,
            margin: "0 auto 16px auto",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.05)",
            boxSizing: "border-box",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "#dbeafe",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            <Info size={17} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 4,
              }}
            >
              <h4
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: "#1e3a8a",
                  margin: 0,
                }}
              >
                ERP Notice · Grade 'F' Evaluation
              </h4>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  padding: "2px 8px",
                  borderRadius: 20,
                  border: "1px solid #bfdbfe",
                }}
              >
                Latest University ERP Logic
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#334155",
                lineHeight: 1.5,
              }}
            >
              Grade 'F' metrics in GradeFlow are evaluated strictly in accordance with the latest Centurion University ERP grading criteria. Due to ERP calculation revisions across versions, if an older printed grade card displays a slight variance, please check and verify with the latest live records on your university ERP portal.
            </p>
          </div>
        </div>
      )}

      {/* ── Official Grade Sheet ── */}
      <div style={{ width: "100%", overflowX: "auto", overflowY: "hidden", paddingBottom: 20 }}>
        <div style={{ 
            width: 820 * zoomLevel, 
            height: 1120 * zoomLevel, 
            overflow: "hidden", /* CRITICAL: Hides the unscaled 820px width from the browser layout engine */
            margin: "0 auto", 
            transition: "all 0.2s ease",
            borderRadius: 10 /* Matches inner paper to cleanly cut off shadow without looking bad */
        }}>
          <div
            id={`gradesheet-capture-${result.semester}`}
            ref={sheetRef}
            style={{
              background: "#fff",
              color: "#000",
              padding: "36px 44px",
              borderRadius: 8,
              width: 820,
              transform: `scale(${zoomLevel})`,
              transformOrigin: "top left",
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: 13,
              boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
              border: "1px solid #e0e0e0",
            }}
          >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "#777",
            marginBottom: 20,
          }}
        >
          <span>
            {new Date().toLocaleDateString("en-IN")} {timeStr}
          </span>
          <span style={{ fontStyle: "italic" }}>
            GradeFlow - Streamlining your academic journey
          </span>
        </div>

        {/* University Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}>
            <GraduationCap size={44} color="#1a56db" />
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              lineHeight: 1.3,
              marginBottom: 4,
            }}
          >
            Centurion University of Technology and Management
          </h1>
          <p style={{ color: "#555", fontSize: 13, marginBottom: 18 }}>
            Jatni, Khurda, Odisha
          </p>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              borderBottom: "2.5px solid #000",
              paddingBottom: 6,
              display: "inline-block",
            }}
          >
            Semester Grade Sheet
          </h2>
        </div>

        {/* Student Info */}
        <div
          style={{
            marginBottom: 24,
            borderLeft: "3px solid #1a56db",
            paddingLeft: 14,
          }}
        >
          {[
            ["Student Regd. No", result.regNo],
            ["Student Name", result.studentName],
            ["Branch", getDynamicBranch(result.regNo, result.branch)],
            ["Batch", result.batch || "—"],
            ["Semester", `Sem ${result.semester}`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", marginBottom: 5 }}>
              <span
                style={{
                  fontWeight: 700,
                  width: 180,
                  flexShrink: 0,
                  fontSize: 13,
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: 13 }}>: {value}</span>
            </div>
          ))}
        </div>

        {/* Subject Table */}
        <table
          style={{ width: "100%", borderCollapse: "collapse", marginBottom: 0 }}
        >
          <thead>
            <tr>
              <th style={th("center")}>Sl.No</th>
              <th style={th("center")}>Sub. Code</th>
              <th style={{ ...th("left"), minWidth: 180 }}>Subject Name</th>
              <th style={th("center")}>Type</th>
              <th style={th("center")}>Credit</th>
              <th style={th("center")}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => {
              const isFail = FAIL_GRADES.includes(s.grade);
              const gradeColor = GRADE_COLOR[s.grade] || "#000";
              const isHighlighted = highlightedSubject && highlightedSubject === s.subCode;
              
              return (
                <tr
                  key={i}
                  style={{
                    background: isHighlighted ? "#fff9c4" : (isFail ? "#fff8f7" : (i % 2 === 0 ? "#fff" : "#fafafa")),
                    transition: "background 0.5s ease",
                  }}
                >
                  <td style={td("center", { color: "#555" })}>{i + 1}</td>
                  <td
                    style={td("center", {
                      fontWeight: 600,
                      fontFamily: "monospace",
                      fontSize: 11,
                    })}
                  >
                    {s.subCode}
                  </td>
                  <td
                    style={td("left", {
                      textTransform: "uppercase",
                      fontSize: 12,
                    })}
                  >
                    {s.subName}
                  </td>
                  <td style={td("center", { fontSize: 11, color: "#555" })}>
                    {s.type}
                  </td>
                  <td style={td("center", { fontWeight: 600 })}>{s.credit}</td>
                  <td
                    style={td("center", {
                      fontWeight: 700,
                      color: gradeColor,
                      lineHeight: 1.1,
                    })}
                  >
                    {s.grade}
                    {GRADE_LABEL[s.grade] && (
                      <span
                        style={{
                          fontSize: 8,
                          display: "block",
                          fontWeight: 400,
                          color: gradeColor,
                          opacity: 0.85,
                        }}
                      >
                        {GRADE_LABEL[s.grade]}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary Block */}
        <div
          style={{
            marginTop: 0,
            borderTop: "2.5px solid #000",
            paddingTop: 12,
          }}
        >
          {/* Stats Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              fontSize: 14,
              color: "#1a56db",
              marginBottom: 10,
            }}
          >
            <span>Total Credits : {totalCredits}</span>
            <span>Credits Cleared : {creditsCleared}</span>
            <span>SGPA : {sgpa.toFixed(2)}</span>
            {studentData?.cgpa !== undefined && (
              <span>CGPA : {cgpaUpToNow.toFixed(2)}</span>
            )}
          </div>

          {/* Fail warning */}
          {hasFailed && (
            <div
              data-html2canvas-ignore="true"
              style={{
                background: "#fff5f5",
                border: "1px solid #fecaca",
                borderRadius: 4,
                padding: "6px 12px",
                fontSize: 11,
                color: "#dc2626",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <AlertTriangle size={14} /> SGPA is calculated on cleared credits ({creditsCleared}/{totalCredits} credits). Failed backlog subjects (R / S / M / F) are not included in cleared credits.
            </div>
          )}

          {/* Grade F ERP Evaluation Notice */}
          {hasGradeF && (
            <div
              data-html2canvas-ignore="true"
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 4,
                padding: "6px 12px",
                fontSize: 11,
                color: "#1e40af",
                marginBottom: 10,
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
                lineHeight: 1.4,
              }}
            >
              <Info size={14} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <strong>ERP Notice:</strong> Grade 'F' metrics reflect the latest University ERP evaluation policy. If an older printed grade card shows a variance, verify with your latest live ERP records.
              </span>
            </div>
          )}
        </div>

        {/* Signature Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 48,
            fontSize: 13,
          }}
        >
          <span style={{ fontWeight: 700, color: "#1a56db" }}>
            Date : {today}
          </span>
          <span style={{ fontWeight: 700 }}>Dean, Examinations</span>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
