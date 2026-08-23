import React from "react";
import {
  FileText,
  DownloadCloud,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  FileCheck,
} from "lucide-react";

export default function GradeSheetSection() {
  return (
    <section
      id="gradesheet"
      className="gf-landing-section"
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "80px 24px",
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: 36,
          alignItems: "center",
          width: "100%",
          boxSizing: "border-box",
        }}
        className="gf-editorial-split"
      >
        {/* Left: Narrative & Format Cards */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: "#0284c7",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            <FileText size={15} strokeWidth={2.4} />
            <span>Academic Records</span>
          </div>

          <h2
            style={{
              fontSize: "clamp(28px, 3.8vw, 42px)",
              fontWeight: 850,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              color: "#0f172a",
              margin: "0 0 16px 0",
            }}
          >
            Your academic record
            <br />
            Ready when you need it
          </h2>

          <p
            style={{
              fontSize: "clamp(14.5px, 1.8vw, 16px)",
              lineHeight: 1.6,
              color: "#64748b",
              margin: "0 0 24px 0",
            }}
          >
            Generate official grade sheets and semester transcripts formatted cleanly for university submissions, internship applications, and corporate background checks.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9", minWidth: 0 }}>
              <DownloadCloud size={18} color="#0284c7" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>PDF Official Transcript</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Vector-rendered with university header and verification seal</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9", minWidth: 0 }}>
              <FileSpreadsheet size={18} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Excel Credit Workbook</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Raw numerical marksheets and basket calculations</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Document Preview Card */}
        <div
          style={{
            background: "#ffffff",
            padding: "24px 22px",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
            width: "100%",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, borderBottom: "2px solid #0f172a", paddingBottom: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>CENTURION UNIVERSITY</div>
              <div style={{ fontSize: 10.5, color: "#64748b" }}>ACADEMIC GRADE SHEET RECORD</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#2563eb" }}>OFFICIAL COPY</div>
              <div style={{ fontSize: 9.5, color: "#94a3b8" }}>BATCH 2023–2027 (SEM 6)</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 6, fontSize: 11.5, color: "#475569", marginBottom: 14, background: "#f8fafc", padding: "8px 10px", borderRadius: 6 }}>
            <div>Name: <strong>Demo Student</strong></div>
            <div>Reg No: <strong>23030112XXXX</strong></div>
            <div>Branch: <strong>Computer Science</strong></div>
            <div>CGPA: <strong style={{ color: "#2563eb" }}>8.74</strong></div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>
              <span>COURSE TITLE</span>
              <span>GRADE / CR</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span>Distributed Systems</span>
              <span><strong>O</strong> (4 Cr)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span>Machine Learning &amp; AI</span>
              <span><strong>E</strong> (4 Cr)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span>Full Stack Capstone</span>
              <span><strong>O</strong> (6 Cr)</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, borderTop: "1px solid #e2e8f0", paddingTop: 10, marginTop: 10, fontSize: 11.5, fontWeight: 700, color: "#0f172a" }}>
            <span>Semester SGPA: 9.10</span>
            <span style={{ color: "#059669" }}>Status: PASSED (ALL CLEARED)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
