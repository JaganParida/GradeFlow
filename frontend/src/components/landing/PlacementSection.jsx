import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Building,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const REAL_COMPANY_CRITERIA = {
  CSE: [
    { name: "Amazon", cutoff: 7.0, category: "Product Based", minX: "70%", minXII: "70%" },
    { name: "Microsoft", cutoff: 7.0, category: "Product Based", minX: "70%", minXII: "70%" },
    { name: "Razorpay", cutoff: 7.0, category: "Startup", minX: "70%", minXII: "70%" },
    { name: "Accenture", cutoff: 6.5, category: "Service Based", minX: "65%", minXII: "65%" },
    { name: "IBM", cutoff: 6.5, category: "Product & Service", minX: "65%", minXII: "65%" },
    { name: "TCS (Digital / Ninja)", cutoff: 6.0, category: "Service Based", minX: "60%", minXII: "60%" },
    { name: "Infosys", cutoff: 6.0, category: "Service Based", minX: "60%", minXII: "60%" },
    { name: "Wipro", cutoff: 6.0, category: "Service Based", minX: "60%", minXII: "60%" },
    { name: "Cognizant", cutoff: 6.0, category: "Service Based", minX: "60%", minXII: "60%" },
    { name: "Capgemini", cutoff: 6.0, category: "Service Based", minX: "60%", minXII: "60%" },
  ],
  ECE: [
    { name: "Qualcomm", cutoff: 7.5, category: "Product Based", minX: "75%", minXII: "75%" },
    { name: "Texas Instruments", cutoff: 7.0, category: "Product Based", minX: "70%", minXII: "70%" },
    { name: "Intel", cutoff: 7.0, category: "Product Based", minX: "70%", minXII: "70%" },
    { name: "Cisco", cutoff: 7.0, category: "Product Based", minX: "70%", minXII: "70%" },
    { name: "Samsung R&D", cutoff: 7.0, category: "Product Based", minX: "70%", minXII: "70%" },
    { name: "Ericsson", cutoff: 6.0, category: "Product Based", minX: "60%", minXII: "60%" },
    { name: "Bharat Electronics (BEL)", cutoff: 6.0, category: "PSU", minX: "60%", minXII: "60%" },
    { name: "TCS Embedded", cutoff: 6.0, category: "Service Based", minX: "60%", minXII: "60%" },
  ],
  ME: [
    { name: "Bosch", cutoff: 7.0, category: "Product Based", minX: "70%", minXII: "70%" },
    { name: "Larsen & Toubro (L&T)", cutoff: 6.75, category: "Core", minX: "60%", minXII: "60%" },
    { name: "Maruti Suzuki", cutoff: 6.5, category: "Core", minX: "65%", minXII: "65%" },
    { name: "Bajaj Auto", cutoff: 6.5, category: "Core", minX: "65%", minXII: "65%" },
    { name: "Ather Energy", cutoff: 6.5, category: "Startup", minX: "65%", minXII: "65%" },
    { name: "Tata Motors", cutoff: 6.0, category: "Core", minX: "60%", minXII: "60%" },
    { name: "Mahindra & Mahindra", cutoff: 6.0, category: "Core", minX: "60%", minXII: "60%" },
    { name: "Coal India Limited", cutoff: 6.0, category: "PSU", minX: "60%", minXII: "60%" },
  ],
  CIVIL: [
    { name: "Larsen & Toubro (L&T)", cutoff: 6.75, category: "Core", minX: "60%", minXII: "60%" },
    { name: "Tata Projects", cutoff: 6.0, category: "Core", minX: "60%", minXII: "60%" },
    { name: "Shapoorji Pallonji", cutoff: 6.0, category: "Core", minX: "60%", minXII: "60%" },
    { name: "Afcons Infrastructure", cutoff: 6.0, category: "Core", minX: "60%", minXII: "60%" },
    { name: "RITES Ltd", cutoff: 6.0, category: "PSU", minX: "60%", minXII: "60%" },
    { name: "Infra.Market", cutoff: 6.0, category: "Startup", minX: "60%", minXII: "60%" },
  ],
  EEE: [
    { name: "General Electric (GE)", cutoff: 6.5, category: "Product Based", minX: "65%", minXII: "65%" },
    { name: "NTPC", cutoff: 6.5, category: "PSU", minX: "65%", minXII: "65%" },
    { name: "Siemens", cutoff: 6.0, category: "Product Based", minX: "60%", minXII: "60%" },
    { name: "Schneider Electric", cutoff: 6.0, category: "Product Based", minX: "60%", minXII: "60%" },
    { name: "ABB Group", cutoff: 6.0, category: "Product Based", minX: "60%", minXII: "60%" },
    { name: "Power Grid Corporation", cutoff: 6.0, category: "PSU", minX: "60%", minXII: "60%" },
  ],
  BIOTECH: [
    { name: "Biocon", cutoff: 6.5, category: "Product Based", minX: "65%", minXII: "65%" },
    { name: "Dr. Reddy's Laboratories", cutoff: 6.5, category: "Pharma", minX: "65%", minXII: "65%" },
    { name: "Serum Institute of India", cutoff: 6.0, category: "Pharma", minX: "60%", minXII: "60%" },
    { name: "Cipla", cutoff: 6.0, category: "Pharma", minX: "60%", minXII: "60%" },
    { name: "Sun Pharma", cutoff: 6.0, category: "Pharma", minX: "60%", minXII: "60%" },
  ],
};

const BRANCHES = ["CSE", "ECE", "ME", "CIVIL", "EEE", "BIOTECH"];

export default function PlacementSection({ onOpenPlacement }) {
  const [selectedBranch, setSelectedBranch] = useState("CSE");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [demoCgpa, setDemoCgpa] = useState(8.2);

  const companiesList = REAL_COMPANY_CRITERIA[selectedBranch] || REAL_COMPANY_CRITERIA.CSE;

  const filteredCompanies = useMemo(() => {
    return companiesList.filter((comp) => {
      if (selectedCategory === "All") return true;
      return comp.category.includes(selectedCategory);
    });
  }, [companiesList, selectedCategory]);

  const eligibleCount = filteredCompanies.filter((c) => demoCgpa >= c.cutoff).length;

  return (
    <section
      id="placement"
      className="gf-landing-section"
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "80px 24px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "#059669",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          <Briefcase size={15} strokeWidth={2.4} />
          <span>Placement Intelligence</span>
        </div>

        <h2
          style={{
            fontSize: "clamp(30px, 4.2vw, 46px)",
            fontWeight: 850,
            lineHeight: 1.12,
            letterSpacing: "-0.035em",
            color: "#0f172a",
            margin: "0 0 16px 0",
          }}
        >
          Know where your academics can take you
        </h2>

        <p
          style={{
            fontSize: "clamp(15px, 1.8vw, 17.5px)",
            lineHeight: 1.6,
            color: "#64748b",
            margin: 0,
          }}
        >
          Evaluate your CGPA profile against 50+ real company recruitment cutoffs across engineering branches.
        </p>
      </div>

      {/* Interactive Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          padding: "16px 20px",
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 32,
        }}
      >
        {/* Branch Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginRight: 6 }}>Branch:</span>
          {BRANCHES.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: selectedBranch === b ? 750 : 600,
                background: selectedBranch === b ? "#059669" : "#f8fafc",
                color: selectedBranch === b ? "#ffffff" : "#475569",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Benchmark Slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 650, color: "#334155" }}>
            Benchmark CGPA: <strong style={{ color: "#059669", fontFamily: "'Space Mono', monospace" }}>{demoCgpa.toFixed(2)}</strong>
          </span>
          <input
            type="range"
            min="6.0"
            max="9.5"
            step="0.1"
            value={demoCgpa}
            onChange={(e) => setDemoCgpa(parseFloat(e.target.value))}
            style={{ width: 130, accentColor: "#059669", height: 6 }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#065f46", background: "#ecfdf5", padding: "4px 10px", borderRadius: 6 }}>
            {eligibleCount} / {filteredCompanies.length} Eligible
          </span>
        </div>
      </div>

      {/* High-Density Company Matrix Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {filteredCompanies.map((company, idx) => {
          const isEligible = demoCgpa >= company.cutoff;
          return (
            <div
              key={idx}
              style={{
                background: "#ffffff",
                borderRadius: 10,
                border: "1px solid",
                borderColor: isEligible ? "#bbf7d0" : "#f1f5f9",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 12,
                transition: "all 0.15s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 750, color: "#0f172a" }}>{company.name}</div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isEligible ? "#166534" : "#991b1b",
                      background: isEligible ? "#dcfce7" : "#fee2e2",
                      padding: "2px 7px",
                      borderRadius: 4,
                    }}
                  >
                    {isEligible ? "Eligible" : `Requires ${company.cutoff.toFixed(1)}`}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{company.category}</div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748b", borderTop: "1px solid #f8fafc", paddingTop: 8 }}>
                <span>Min CGPA: <strong>{company.cutoff.toFixed(1)}</strong></span>
                <span>10th/12th: <strong>{company.minX}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Personalized Placement Intelligence Handoff */}
      <div
        onClick={onOpenPlacement}
        style={{
          marginTop: 24,
          padding: "14px 18px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#dcfce7";
          e.currentTarget.style.borderColor = "#86efac";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#f0fdf4";
          e.currentTarget.style.borderColor = "#bbf7d0";
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 750, color: "#166534", lineHeight: 1.3 }}>
            Check your personalized placement eligibility
          </div>
          <div style={{ fontSize: 11.5, color: "#15803d", marginTop: 2 }}>
            Evaluate your verified CGPA against 50+ company recruitment criteria in Analytics
          </div>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12.5,
            fontWeight: 750,
            color: "#166534",
            flexShrink: 0,
          }}
        >
          <span>Open Placement Readiness</span>
          <ChevronRight size={15} />
        </div>
      </div>
    </section>
  );
}
