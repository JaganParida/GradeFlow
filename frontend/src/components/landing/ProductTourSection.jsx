import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2,
  Target,
  Briefcase,
  Layers,
  Trophy,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

const TOUR_TABS = [
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart2 size={16} />,
    title: "Semester Trajectory & Grade Distribution",
    desc: "Understand semester-by-semester SGPA movement, credit allocations, and GPA acceleration curves with mathematical transparency.",
    metrics: [
      { label: "CGPA Tracked", value: "8.74 / 10.0" },
      { label: "Trend", value: "↑ Improving (+0.32)" },
      { label: "Course Clearance", value: "100% Cleared" },
    ],
    previewImage: (
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a", marginBottom: 12 }}>Multi-Semester Progression</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 6, textAlign: "center" }}>
          {[
            { s: "Sem 1", v: "7.80" },
            { s: "Sem 2", v: "8.20" },
            { s: "Sem 3", v: "8.45" },
            { s: "Sem 4", v: "8.70" },
            { s: "Sem 5", v: "8.95" },
            { s: "Sem 6", v: "9.10" },
          ].map((item, i) => (
            <div key={i} style={{ background: "#f8fafc", padding: "8px 4px", borderRadius: 6, border: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 10.5, color: "#64748b" }}>{item.s}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#2563eb", fontFamily: "'Space Mono', monospace" }}>{item.v}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "predictor",
    label: "Predictor",
    icon: <Target size={16} />,
    title: "What-If Simulation & Target Forecasting",
    desc: "Calculate exactly what upcoming semesters need to look like to graduate with distinction, first class, or your target CGPA.",
    metrics: [
      { label: "Target CGPA", value: "8.50 Goal" },
      { label: "Required SGPA", value: "8.82 Avg" },
      { label: "Remaining", value: "3 Semesters" },
    ],
    previewImage: (
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a", marginBottom: 12 }}>Target CGPA Simulation Result</div>
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11.5, color: "#92400e", fontWeight: 600 }}>Target: 8.50 Graduation CGPA</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#b45309" }}>Average 8.82 SGPA Required</div>
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 700, background: "#fef3c7", color: "#b45309", padding: "3px 7px", borderRadius: 6 }}>Attainable</span>
        </div>
      </div>
    ),
  },
  {
    id: "placement",
    label: "Placements",
    icon: <Briefcase size={16} />,
    title: "Company Recruitment Cutoff Matching",
    desc: "Benchmark your GPA against 50+ tier-1, product-based, service, and core recruitment cutoffs across all branches.",
    metrics: [
      { label: "Eligible Companies", value: "42 of 50+" },
      { label: "Product Criteria", value: "Met (7.0+ CGPA)" },
      { label: "Service Criteria", value: "Met (6.0+ CGPA)" },
    ],
    previewImage: (
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a", marginBottom: 12 }}>Recruiter Eligibility Snapshot</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          {[
            { n: "Amazon", c: "7.0 Min", s: "Eligible" },
            { n: "Microsoft", c: "7.0 Min", s: "Eligible" },
            { n: "TCS Digital", c: "6.0 Min", s: "Eligible" },
            { n: "Qualcomm", c: "7.5 Min", s: "Eligible" },
          ].map((comp, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "6px 10px", borderRadius: 6, fontSize: 11.5, minWidth: 0 }}>
              <span style={{ fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{comp.n} ({comp.c})</span>
              <span style={{ fontWeight: 700, color: "#16a34a", marginLeft: 4 }}>{comp.s}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "domains",
    label: "Degree Baskets",
    icon: <Layers size={16} />,
    title: "5-Basket 160-Credit Degree Framework",
    desc: "Monitor credit requirements across Foundation Sciences, Humanities, Smart Stack, Core Engineering, and Domain Specializations.",
    metrics: [
      { label: "Total Target", value: "160 Credits" },
      { label: "Cleared", value: "124 Credits (78%)" },
      { label: "Graduation Target", value: "Class of 2027 (Sem 6)" },
    ],
    previewImage: (
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a", marginBottom: 12 }}>160-Credit Basket Distribution</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { name: "Core Engineering (B4)", cr: "48 / 58 Cr", pct: 83, c: "#059669" },
            { name: "Smart Stack (B3)", cr: "25 / 25 Cr", pct: 100, c: "#d97706" },
            { name: "Domain Track (B5)", cr: "22 / 48 Cr", pct: 46, c: "#ea580c" },
          ].map((b, i) => (
            <div key={i} style={{ fontSize: 11.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: "#334155" }}>{b.name}</span>
                <span style={{ color: b.c, fontWeight: 750 }}>{b.cr}</span>
              </div>
              <div style={{ height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${b.pct}%`, height: "100%", background: b.c }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "leaderboard",
    label: "Rankings",
    icon: <Trophy size={16} />,
    title: "University & Cohort Standing",
    desc: "Transparent branch-level academic percentiles calculated with full student identity anonymity compliance.",
    metrics: [
      { label: "Percentile", value: "Top 5.0% Cohort" },
      { label: "Branch Standing", value: "Rank #8 in CSE" },
      { label: "Privacy", value: "100% Anonymized" },
    ],
    previewImage: (
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a", marginBottom: 12 }}>Cohort Ranking Snapshot</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#eff6ff", padding: "10px 12px", borderRadius: 8, border: "1px solid #bfdbfe", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1e40af" }}>Rank #8 &bull; You (Demo Student)</div>
            <div style={{ fontSize: 11, color: "#2563eb" }}>Top 5.0% of Computer Science Cohort</div>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#1e40af", fontFamily: "'Space Mono', monospace" }}>8.74 CGPA</span>
        </div>
      </div>
    ),
  },
];

export default function ProductTourSection() {
  const [activeTabId, setActiveTabId] = useState("analytics");
  const activeTab = TOUR_TABS.find((t) => t.id === activeTabId) || TOUR_TABS[0];

  return (
    <section
      id="tour"
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
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 44px" }}>
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
          <Layers size={15} strokeWidth={2.4} />
          <span>Interactive Product Tour</span>
        </div>

        <h2
          style={{
            fontSize: "clamp(28px, 4.2vw, 46px)",
            fontWeight: 850,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            color: "#0f172a",
            margin: "0 0 16px 0",
          }}
        >
          Explore GradeFlow by Capability
        </h2>

        <p
          style={{
            fontSize: "clamp(15px, 1.8vw, 17px)",
            lineHeight: 1.6,
            color: "#64748b",
            margin: 0,
            textWrap: "balance",
          }}
        >
          Select each capability tab to preview how GradeFlow structures your academic journey.
        </p>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 32,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {TOUR_TABS.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 750 : 600,
                background: isActive ? "#2563eb" : "#f8fafc",
                color: isActive ? "#ffffff" : "#475569",
                border: isActive ? "1px solid #2563eb" : "1px solid #e2e8f0",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Tour Display Panel */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          padding: "32px 30px",
          display: "grid",
          gridTemplateColumns: "1.1fr 1.2fr",
          gap: 32,
          alignItems: "center",
          width: "100%",
          boxSizing: "border-box",
        }}
        className="gf-editorial-split"
      >
        {/* Left Side: Context & Metrics */}
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>
            {activeTab.title}
          </h3>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px 0" }}>
            {activeTab.desc}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 10,
              padding: "16px 0",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            {activeTab.metrics.map((m, i) => (
              <div key={i} style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Interactive Preview Card */}
        <div style={{ width: "100%", minWidth: 0 }}>
          {activeTab.previewImage}
        </div>
      </div>
    </section>
  );
}
