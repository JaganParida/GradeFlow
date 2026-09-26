import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Printer, GraduationCap, AlertTriangle, ZoomIn, ZoomOut, MessageSquare, Lock, ShieldCheck, FileDown, ImageDown, Loader2 } from "lucide-react";
import {
  FAIL_GRADES,
  calculateCGPA,
  calculateSemesterMetrics,
} from "../utils/gradeCalculations";
import { useApp } from "../context/AppContext";

function getDynamicBranch(regNo, fallbackBranch) {
  if (!regNo) return fallbackBranch || "—";
  const r = String(regNo).trim();
  
  // Specific student administrative transfers / overrides
  if (r === "230301180026") return "CSE";
  if (["230301120110", "230301120186", "230301120371", "230301120481"].includes(r)) return "ECE";
  if (r === "230301231033") return "AERO";

  // Dynamic branch mapping across all batches (2021, 2022, 2023, 2024, 2025, 2026...)
  if (r.length >= 8) {
    const dept = r.slice(2, 8);
    if (dept === "030111") return "CIVIL";
    if (dept === "030112") return "CSE";
    if (dept === "030113") return "ECE";
    if (dept === "030115") return "EEE";
    if (dept === "030116") return "ME";
    if (dept === "030118") return "BIO";
    if (dept === "030119") return "MI";
    if (dept === "030123") return "AERO";
  }
  
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

export default function GradeSheet({ result, studentData, highlightedSubject, searchedRegNo }) {
  const sheetRef = useRef();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [sheetHeight, setSheetHeight] = useState(680);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 860) {
        const availableWidth = window.innerWidth - 24;
        const perfectZoom = Math.min(Math.max(availableWidth / 820, 0.35), 1);
        setZoomLevel(Number(perfectZoom.toFixed(2)));
      } else {
        setZoomLevel(1);
      }
    };
    handleResize(); // Initial calculation
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Dynamically measure actual paper content height so there is no oversized empty whitespace
  useEffect(() => {
    if (!sheetRef.current) return;
    const updateHeight = () => {
      if (sheetRef.current) {
        const h = sheetRef.current.offsetHeight;
        if (h > 200) {
          setSheetHeight(h);
        }
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(sheetRef.current);
    return () => ro.disconnect();
  }, [result]);

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

  const displayRegNo = result?.regNo || studentData?.regNo || searchedRegNo || "";
  const cleanRegNo = String(displayRegNo).trim().toUpperCase();
  const displayStudentName = result?.studentName || studentData?.studentName || "—";
  const rawBranch = result?.branch || studentData?.branch || "";
  const displayBranch = getDynamicBranch(displayRegNo, rawBranch);
  const displayBatch = result?.batch || studentData?.batch || "—";

  const [hasSubmittedLocally, setHasSubmittedLocally] = useState(false);

  useEffect(() => {
    const onSubmitted = (e) => {
      const reg = e?.detail?.regNo;
      if (reg && String(reg).trim().toUpperCase() === cleanRegNo) {
        setHasSubmittedLocally(true);
      }
    };
    const onDeleted = (e) => {
      const reg = e?.detail?.regNo;
      if (!reg || String(reg).trim().toUpperCase() === cleanRegNo) {
        setHasSubmittedLocally(false);
      }
    };
    window.addEventListener("gradeflow:feedback-submitted", onSubmitted);
    window.addEventListener("gradeflow:feedback-deleted", onDeleted);
    return () => {
      window.removeEventListener("gradeflow:feedback-submitted", onSubmitted);
      window.removeEventListener("gradeflow:feedback-deleted", onDeleted);
    };
  }, [cleanRegNo]);

  useEffect(() => {
    if (studentData && studentData.hasSubmittedFeedback === false) {
      setHasSubmittedLocally(false);
    }
  }, [studentData?.hasSubmittedFeedback]);

  const isExempt = cleanRegNo === "230301120327";
  const isUnlocked = Boolean(
    isExempt ||
    studentData?.hasSubmittedFeedback ||
    hasSubmittedLocally
  );


  function triggerFeedbackModal() {
    window.dispatchEvent(
      new CustomEvent("open-feedback-modal", {
        detail: {
          from: "gradesheet",
          rating: 5,
          regNo: displayRegNo,
          studentName: displayStudentName,
        },
      })
    );
  }

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
    if (!isUnlocked) {
      triggerFeedbackModal();
      return;
    }
    if (isDownloadingPdf || isSavingImage) return;

    try {
      setIsDownloadingPdf(true);
      await new Promise((resolve) => setTimeout(resolve, 60));
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");
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
      pdf.save(`GradeSheet_${displayRegNo || "Student"}_Sem${result.semester}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  async function saveImage() {
    if (!isUnlocked) {
      triggerFeedbackModal();
      return;
    }
    if (isDownloadingPdf || isSavingImage) return;

    try {
      setIsSavingImage(true);
      await new Promise((resolve) => setTimeout(resolve, 60));
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(sheetRef.current, {
        scale: 4,
        backgroundColor: "#fff",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `GradeSheet_${displayRegNo || "Student"}_Sem${result.semester}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error("Failed to export image:", err);
    } finally {
      setIsSavingImage(false);
    }
  }

  function printSheet() {
    if (!isUnlocked) {
      triggerFeedbackModal();
      return;
    }
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
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            disabled={isDownloadingPdf || isSavingImage}
            className="btn btn-primary gradesheet-btn"
            onClick={downloadPDF}
            title={isDownloadingPdf ? "Exporting PDF..." : !isUnlocked ? "Unlock via Feedback to Download PDF" : "Download PDF"}
            style={{
              cursor: isDownloadingPdf || isSavingImage ? "not-allowed" : "pointer",
            }}
          >
            {!isUnlocked ? (
              <Lock size={14} className="gradesheet-btn-icon" strokeWidth={2.2} />
            ) : (
              <FileDown size={15} className="gradesheet-btn-icon" strokeWidth={2.2} />
            )}
            <span>PDF</span>
            {isDownloadingPdf && (
              <Loader2 size={13} className="gf-spin" style={{ flexShrink: 0, marginLeft: 1 }} />
            )}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            disabled={isDownloadingPdf || isSavingImage}
            className="btn btn-ghost gradesheet-btn"
            onClick={saveImage}
            title={isSavingImage ? "Exporting Image..." : !isUnlocked ? "Unlock via Feedback to Download Image" : "Download Image (PNG)"}
            style={{
              cursor: isDownloadingPdf || isSavingImage ? "not-allowed" : "pointer",
            }}
          >
            {!isUnlocked ? (
              <Lock size={14} className="gradesheet-btn-icon" strokeWidth={2.2} />
            ) : (
              <ImageDown size={15} className="gradesheet-btn-icon" strokeWidth={2.2} />
            )}
            <span>Image</span>
            {isSavingImage && (
              <Loader2 size={13} className="gf-spin" style={{ flexShrink: 0, marginLeft: 1 }} />
            )}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            disabled={isDownloadingPdf || isSavingImage}
            className="btn btn-ghost gradesheet-btn"
            onClick={printSheet}
            title={!isUnlocked ? "Unlock via Feedback to Print" : "Print Sheet"}
            style={{
              cursor: isDownloadingPdf || isSavingImage ? "not-allowed" : "pointer",
            }}
          >
            {!isUnlocked ? (
              <Lock size={14} className="gradesheet-btn-icon" strokeWidth={2.2} />
            ) : (
              <Printer size={15} className="gradesheet-btn-icon" strokeWidth={2.2} />
            )}
            <span>Print</span>
          </motion.button>
        </div>

        <div className="gradesheet-toolbar-zoom">
          <button
            type="button"
            className="btn btn-ghost gradesheet-zoom-btn"
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.3))}
            aria-label="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="gradesheet-zoom-val">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            className="btn btn-ghost gradesheet-zoom-btn"
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 1.5))}
            aria-label="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
        </div>
      </div>

      {/* ── Official Grade Sheet ── */}
      <div style={{ width: "100%", overflowX: "auto", overflowY: "hidden", paddingBottom: 20 }}>
        <div style={{ 
            width: Math.round(820 * zoomLevel), 
            height: Math.round(sheetHeight * zoomLevel), 
            overflow: "hidden", /* CRITICAL: Hides the unscaled 820px width from the browser layout engine */
            margin: "0 auto", 
            position: "relative",
            transition: "all 0.25s ease",
            borderRadius: 10, /* Matches inner paper to cleanly cut off shadow without looking bad */
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
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
              border: "1px solid #e0e0e0",
              filter: isUnlocked ? "none" : "blur(3.2px)",
              pointerEvents: isUnlocked ? "auto" : "none",
              userSelect: isUnlocked ? "auto" : "none",
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
          <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
            <img src="/webisteLogo.png" alt="GradeFlow Logo" style={{ height: 48, width: "auto", objectFit: "contain" }} />
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
            ["Student Regd. No", displayRegNo || "—"],
            ["Student Name", displayStudentName || "—"],
            ["Branch", displayBranch || "—"],
            ["Batch", displayBatch || "—"],
            ["Semester", result.semester ? `Sem ${result.semester}` : "—"],
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
                  <td style={td("center", { fontWeight: 600 })}>
                    {isUnlocked ? s.credit : "•"}
                  </td>
                  <td
                    style={td("center", {
                      fontWeight: 700,
                      color: isUnlocked ? gradeColor : "#94a3b8",
                      lineHeight: 1.1,
                    })}
                  >
                    {isUnlocked ? (
                      <>
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
                      </>
                    ) : (
                      <span style={{ letterSpacing: "2px", fontWeight: 800, color: "#94a3b8", userSelect: "none" }}>
                        ••
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
            <span>Credits Cleared : {isUnlocked ? creditsCleared : "••"}</span>
            <span>SGPA : {isUnlocked ? sgpa.toFixed(2) : "•.••"}</span>
            {studentData?.cgpa !== undefined && (
              <span>CGPA : {isUnlocked ? cgpaUpToNow.toFixed(2) : "•.••"}</span>
            )}
          </div>

          {/* Fail warning */}
          {hasFailed && isUnlocked && (
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
              <AlertTriangle size={14} /> SGPA includes evaluated subjects ({totalCredits} credits). Failed backlog subjects (R / S / M / F) are not included in cleared credits ({creditsCleared}/{totalCredits} credits).
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

        {/* ── Frosted Blur Overlay strictly inside report card area ── */}
        {!isUnlocked && (
          <div
            data-html2canvas-ignore="true"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isMobile ? "12px 10px" : "24px 20px",
              zIndex: 30,
              background: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: isMobile ? 295 : 400,
                background: "#ffffff",
                borderRadius: isMobile ? 14 : 18,
                padding: isMobile ? "16px 14px" : "28px 24px",
                boxShadow: "0 20px 45px -12px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e4e4e7",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxSizing: "border-box",
                margin: "0 auto",
              }}
            >
              {/* Luxury Obsidian Black Icon Container */}
              <div
                style={{
                  width: isMobile ? 38 : 46,
                  height: isMobile ? 38 : 46,
                  borderRadius: isMobile ? 11 : 13,
                  background: "#09090b",
                  border: "1px solid #27272a",
                  boxShadow: "0 8px 18px -4px rgba(0, 0, 0, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: isMobile ? 10 : 14,
                  color: "#ffffff",
                }}
              >
                <Lock size={isMobile ? 16 : 19} color="#ffffff" strokeWidth={2.2} />
              </div>

              {/* Title (Clean Typography, No Toy Badge) */}
              <h3
                style={{
                  fontSize: isMobile ? 15 : 18.5,
                  fontWeight: 800,
                  color: "#09090b",
                  lineHeight: 1.25,
                  margin: isMobile ? "0 0 6px 0" : "0 0 8px 0",
                  letterSpacing: "-0.4px",
                }}
              >
                {isMobile ? "Official Grades Protected" : "Official Grade Sheet Protected"}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: isMobile ? 11 : 12.5,
                  color: "#52525b",
                  lineHeight: 1.5,
                  margin: isMobile ? "0 0 12px 0" : "0 0 16px 0",
                  maxWidth: 340,
                }}
              >
                {isMobile
                  ? "Share a brief review of GradeFlow to reveal your semester marks, SGPA and export official PDF."
                  : "Submit a verified review of your GradeFlow experience to reveal semester marks, SGPA & CGPA, and export official transcripts."}
              </p>

              {/* Micro-Features: Clean Separate Chips, Never Awkwardly Wraps Text */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: isMobile ? 6 : 8,
                  marginBottom: isMobile ? 14 : 18,
                  width: "100%",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4.5,
                    padding: isMobile ? "4px 8.5px" : "5px 12px",
                    borderRadius: 20,
                    background: "#f4f4f5",
                    border: "1px solid #e4e4e7",
                    fontSize: isMobile ? 10.5 : 11.5,
                    color: "#27272a",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  <ShieldCheck size={isMobile ? 12 : 13.5} color="#09090b" strokeWidth={2.2} />
                  <span>{isMobile ? "1-Time Unlock" : "1-Time Permanent Unlock"}</span>
                </span>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4.5,
                    padding: isMobile ? "4px 8.5px" : "5px 12px",
                    borderRadius: 20,
                    background: "#f4f4f5",
                    border: "1px solid #e4e4e7",
                    fontSize: isMobile ? 10.5 : 11.5,
                    color: "#27272a",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  <FileDown size={isMobile ? 12 : 13.5} color="#09090b" strokeWidth={2.2} />
                  <span>{isMobile ? "PDF Export" : "Official PDF Export"}</span>
                </span>
              </div>

              {/* Luxury Obsidian Black Button */}
              <button
                type="button"
                onClick={triggerFeedbackModal}
                style={{
                  width: "100%",
                  padding: isMobile ? "9px 14px" : "11px 18px",
                  borderRadius: isMobile ? 9 : 11,
                  background: "#09090b",
                  boxShadow: "0 8px 20px -4px rgba(0, 0, 0, 0.35)",
                  border: "1px solid #27272a",
                  color: "#ffffff",
                  fontSize: isMobile ? 12.5 : 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#18181b";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px -4px rgba(0, 0, 0, 0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#09090b";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 20px -4px rgba(0, 0, 0, 0.35)";
                }}
              >
                <MessageSquare size={isMobile ? 14 : 15} color="#ffffff" />
                <span>Give Feedback to Unlock</span>
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
