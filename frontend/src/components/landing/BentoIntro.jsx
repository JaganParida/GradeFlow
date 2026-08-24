import React from "react";
import {
  BarChart2,
  TrendingUp,
  Target,
  Briefcase,
  Layers,
  Clock,
  Percent,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  LayoutGrid,
} from "lucide-react";

export default function BentoIntro({
  onNavigateSection,
  onOpenAnalytics,
  onOpenPredictor,
  onOpenPlacement,
  onOpenDomains,
  onOpenDegreeProgress,
  onOpenTimetable,
  onOpenAttendance,
  onOpenLeaderboard,
}) {
  return (
    <section
      id="features"
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
      {/* Editorial Section Header */}
      <div className="gf-section-header" style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "#2563eb",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          <LayoutGrid size={15} strokeWidth={2.4} />
          <span>Core Intelligence Architecture</span>
        </div>

        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 46px)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "#0f172a",
            margin: "0 0 16px 0",
          }}
        >
          Everything you need to master your degree
        </h2>

        <p
          style={{
            fontSize: "clamp(15px, 1.8vw, 17px)",
            lineHeight: 1.6,
            color: "#64748b",
            margin: 0,
          }}
        >
          High-fidelity intelligence engines engineered for Centurion University's 160-credit graduation framework.
        </p>
      </div>

      {/* ── Pinterest / Masonry 3-Column Editorial Grid ── */}
      <div
        className="gf-bento-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 20,
          alignItems: "start",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* ── COLUMN 1 ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          {/* Card 1: GPA Progression (Tall with Mini Trend Graphic) */}
          <div
            onClick={onOpenAnalytics || (() => onNavigateSection("analytics"))}
            style={{
              background: "#ffffff",
              padding: "26px 24px",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#93c5fd";
              e.currentTarget.style.background = "#fcfdfe";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#ffffff";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart2 size={20} color="#2563eb" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 750, color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: 6 }}>
                6 Semesters Analyzed
              </span>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
              GPA Progression &amp; Velocity
            </h3>
            <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.55, margin: "0 0 16px 0" }}>
              Track semester-by-semester SGPA movement, cumulative CGPA curves, and course clearance velocity with granular precision.
            </p>

            {/* Embedded Mini Graph Graphic */}
            <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 8, border: "1px solid #f1f5f9", marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>
                <span>SGPA TRAJECTORY</span>
                <span style={{ color: "#059669" }}>+0.90 Trend</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 44, paddingBottom: 4 }}>
                {[
                  { sem: "S1", val: 55, score: "8.2" },
                  { sem: "S2", val: 68, score: "8.5" },
                  { sem: "S3", val: 62, score: "8.3" },
                  { sem: "S4", val: 78, score: "8.8" },
                  { sem: "S5", val: 84, score: "8.9" },
                  { sem: "S6", val: 96, score: "9.1" },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ width: "100%", height: `${s.val}%`, background: i === 5 ? "#2563eb" : "#cbd5e1", borderRadius: 3 }} />
                    <span style={{ fontSize: 9.5, color: "#64748b", fontWeight: 700 }}>{s.sem}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#2563eb" }}>
              <span>Explore Your Analytics</span>
              <ChevronRight size={15} />
            </div>
          </div>

          {/* Card 4: 5-Basket Degree Framework (Compact) */}
          <div
            onClick={onOpenDegreeProgress || onOpenDomains || (() => onNavigateSection("domains"))}
            style={{
              background: "#ffffff",
              padding: "24px 22px",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#c4b5fd";
              e.currentTarget.style.background = "#fcfdfe";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#ffffff";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Layers size={19} color="#7c3aed" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 750, color: "#7c3aed", background: "#f5f3ff", padding: "3px 8px", borderRadius: 6 }}>
                160 Total Credits
              </span>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
              5-Basket Degree Architecture
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: "0 0 14px 0" }}>
              Track Foundation Sciences, Humanities, Smart Stack, Core Engineering, and Domain tracks.
            </p>

            {/* Credit Bar Meter */}
            <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 8, border: "1px solid #f1f5f9", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 5 }}>
                <span style={{ color: "#64748b" }}>124 / 160 Cleared</span>
                <span style={{ color: "#7c3aed" }}>77.5%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "#e2e8f0", overflow: "hidden", display: "flex" }}>
                <div style={{ width: "25%", background: "#2563eb" }} />
                <div style={{ width: "20%", background: "#7c3aed" }} />
                <div style={{ width: "18%", background: "#059669" }} />
                <div style={{ width: "14.5%", background: "#d97706" }} />
              </div>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>
              <span>Check Your Baskets</span>
              <ChevronRight size={15} />
            </div>
          </div>
        </div>

        {/* ── COLUMN 2 ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          {/* Card 2: Target Grade Simulator (Compact) */}
          <div
            onClick={onOpenPredictor || (() => onNavigateSection("predictor"))}
            style={{
              background: "#ffffff",
              padding: "24px 22px",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#fde68a";
              e.currentTarget.style.background = "#fcfdfe";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#ffffff";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Target size={19} color="#d97706" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 750, color: "#d97706", background: "#fffbeb", padding: "3px 8px", borderRadius: 6 }}>
                Dual Calculation Modes
              </span>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
              Target Grade Simulator
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: "0 0 14px 0" }}>
              Compute exact required SGPA for graduation honors and calculate needed external marks from internals.
            </p>

            {/* Target Calculator Mini Preview */}
            <div style={{ background: "#fffbeb", padding: "8px 12px", borderRadius: 8, border: "1px solid #fef3c7", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11.5, color: "#92400e", fontWeight: 700 }}>Target: 8.50 CGPA</span>
              <span style={{ fontSize: 11.5, color: "#b45309", fontWeight: 800, fontFamily: "'Space Mono', monospace" }}>Need 8.80 SGPA</span>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#d97706" }}>
              <span>Simulate Your Target</span>
              <ChevronRight size={15} />
            </div>
          </div>

          {/* Card 5: Class Schedule & Timetable (Tall with Live Schedule Preview) */}
          <div
            onClick={onOpenTimetable || (() => onNavigateSection("timetable-attendance"))}
            style={{
              background: "#ffffff",
              padding: "26px 24px",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#7dd3fc";
              e.currentTarget.style.background = "#fcfdfe";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#ffffff";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={20} color="#0284c7" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 750, color: "#0284c7", background: "#f0f9ff", padding: "3px 8px", borderRadius: 6 }}>
                Zero ERP Downtime
              </span>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
              Class Schedule &amp; Live Periods
            </h3>
            <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.55, margin: "0 0 16px 0" }}>
              Instant access to daily schedules, live periods, classrooms, and faculty when university ERP is down or slow.
            </p>

            {/* Live Period Preview Strip */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
              <div style={{ padding: "8px 10px", background: "#f0f9ff", borderRadius: 8, border: "1px solid #e0f2fe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 750, color: "#0369a1" }}>NOW: Distributed Systems</div>
                  <div style={{ fontSize: 10, color: "#0284c7" }}>Lab 302 &bull; 10:00 AM - 11:30 AM</div>
                </div>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0284c7" }} />
              </div>

              <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 650, color: "#475569" }}>NEXT: Deep Learning &amp; AI</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Lecture Hall 104 &bull; 11:45 AM</div>
                </div>
              </div>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#0284c7" }}>
              <span>View Your Timetable</span>
              <ChevronRight size={15} />
            </div>
          </div>
        </div>

        {/* ── COLUMN 3 ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          {/* Card 3: 50+ Company Eligibility (Tall with Company Cutoff Badges) */}
          <div
            onClick={onOpenPlacement || (() => onNavigateSection("placement"))}
            style={{
              background: "#ffffff",
              padding: "26px 24px",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#6ee7b7";
              e.currentTarget.style.background = "#fcfdfe";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#ffffff";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Briefcase size={20} color="#059669" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 750, color: "#059669", background: "#ecfdf5", padding: "3px 8px", borderRadius: 6 }}>
                Tier 1 &amp; Product Cutoffs
              </span>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
              50+ Company Eligibility
            </h3>
            <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.55, margin: "0 0 16px 0" }}>
              Live criteria evaluation across Product, Service, Core, and PSU cutoff benchmarks for your branch.
            </p>

            {/* Recruiter Evaluation Chips */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 18 }}>
              {[
                { company: "Google / Amazon", cutoff: "8.0+ CGPA", status: "Eligible" },
                { company: "Microsoft / Oracle", cutoff: "7.5+ CGPA", status: "Eligible" },
                { company: "TCS Digital / Infosys SP", cutoff: "7.0+ CGPA", status: "Eligible" },
              ].map((co, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#f8fafc", borderRadius: 6, fontSize: 11.5 }}>
                  <span style={{ fontWeight: 650, color: "#0f172a" }}>{co.company}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: "#059669", background: "#ecfdf5", padding: "2px 6px", borderRadius: 4 }}>
                    {co.status} ({co.cutoff})
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#059669" }}>
              <span>Check Eligibility</span>
              <ChevronRight size={15} />
            </div>
          </div>

          {/* Card 6: Smart Attendance & Safe Bunk (Compact) */}
          <div
            onClick={onOpenAttendance || (() => onNavigateSection("timetable-attendance"))}
            style={{
              background: "#ffffff",
              padding: "24px 22px",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#86efac";
              e.currentTarget.style.background = "#fcfdfe";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#ffffff";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Percent size={19} color="#059669" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 750, color: "#059669", background: "#ecfdf5", padding: "3px 8px", borderRadius: 6 }}>
                75% Criteria Protection
              </span>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
              Smart Attendance &amp; Safe Bunk
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: "0 0 14px 0" }}>
              Monitor 75% university minimum attendance criteria, calculate safe bunk limits, and estimate recovery classes.
            </p>

            {/* Attendance Safe Pill */}
            <div style={{ padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 11.5, fontWeight: 750, color: "#166534" }}>89.3% Overall</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>✓ 4 Bunks Safe</span>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#059669" }}>
              <span>Check Bunk Margins</span>
              <ChevronRight size={15} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
