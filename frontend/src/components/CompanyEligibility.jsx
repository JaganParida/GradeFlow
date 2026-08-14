import React, { useState, useEffect, useMemo } from "react";
import {
  CheckCircle,
  GraduationCap,
  Info,
  Target,
  XCircle,
  Calculator,
  Briefcase,
  Search,
  Filter,
  AlertTriangle,
  Building,
  Check,
  TrendingUp,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COMPANY_DATA = {
  CSE: [
    ["TCS", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
    ["Infosys", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
    ["Wipro", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
    ["Cognizant", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
    ["Accenture", "65%", "65%", "6.5 CGPA", 6.5, "Service Based"],
    ["IBM", "65%", "65%", "6.5 CGPA", 6.5, "Product & Service"],
    ["Amazon", "70%", "70%", "7.0 CGPA", 7.0, "Product Based"],
    ["Microsoft", "70%", "70%", "7.0 CGPA", 7.0, "Product Based"],
    ["Razorpay", "70%", "70%", "7.0 CGPA", 7.0, "Startup"],
    ["Capgemini", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
    ["HCLTech", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
    ["Tech Mahindra", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
  ],
  CIVIL: [
    ["Larsen & Toubro (L&T)", "60%", "60%", "6.75 CGPA", 6.75, "Core"],
    ["Tata Projects", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Shapoorji Pallonji", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Afcons Infrastructure", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Hindustan Construction Co. (HCC)", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["JSW Steel (Civil)", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["GMR Group", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Reliance Infrastructure", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Coal India Limited", "60%", "60%", "60%", 6.0, "PSU"],
    ["RITES Ltd", "60%", "60%", "60%", 6.0, "PSU"],
    ["KEC International", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Infra.Market", "60%", "60%", "6.0 CGPA", 6.0, "Startup"],
  ],
  ME: [
    ["Larsen & Toubro (L&T)", "60%", "60%", "6.75 CGPA", 6.75, "Core"],
    ["Tata Motors", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Mahindra & Mahindra", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Maruti Suzuki", "65%", "65%", "6.5 CGPA", 6.5, "Core"],
    ["Bajaj Auto", "65%", "65%", "6.5 CGPA", 6.5, "Core"],
    ["Bosch", "70%", "70%", "7.0 CGPA", 7.0, "Product Based"],
    ["Ashok Leyland", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Godrej & Boyce", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Ather Energy", "65%", "65%", "6.5 CGPA", 6.5, "Startup"],
    ["Coal India Limited", "60%", "60%", "60%", 6.0, "PSU"],
    ["Tata Technologies", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
    ["L&T Technology Services", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
  ],
  ECE: [
    ["Texas Instruments", "70%", "70%", "7.0 CGPA", 7.0, "Product Based"],
    ["Intel", "70%", "70%", "7.0 CGPA", 7.0, "Product Based"],
    ["Qualcomm", "75%", "75%", "7.5 CGPA", 7.5, "Product Based"],
    ["Cisco", "70%", "70%", "7.0 CGPA", 7.0, "Product Based"],
    ["Samsung R&D", "70%", "70%", "7.0 CGPA", 7.0, "Product Based"],
    ["TCS (Embedded/IT)", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
    ["Ericsson", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
    ["boAt", "60%", "60%", "6.0 CGPA", 6.0, "Startup"],
    ["NXP Semiconductors", "70%", "70%", "7.0 CGPA", 7.0, "Product Based"],
    ["Bharat Electronics Ltd (BEL)", "60%", "60%", "60%", 6.0, "PSU"],
    ["L&T Technology Services", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
    ["Tata Elxsi", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
  ],
  EEE: [
    ["Siemens", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
    ["Schneider Electric", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
    ["ABB India", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
    ["General Electric (GE)", "65%", "65%", "6.5 CGPA", 6.5, "Product Based"],
    ["Exponent Energy", "60%", "60%", "6.0 CGPA", 6.0, "Startup"],
    ["Havells India", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Tata Power", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Adani Power", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["NTPC", "65%", "65%", "65%", 6.5, "PSU"],
    ["Coal India Limited", "60%", "60%", "60%", 6.0, "PSU"],
    ["Tata Elxsi", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
    ["Reliance Jio", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
  ],
  BIO: [
    ["Biocon", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
    ["Dr. Reddy's Laboratories", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
    ["Serum Institute of India", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
    ["Bharat Biotech", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
    ["Cipla", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
    ["Sun Pharma", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
    ["Novozymes", "65%", "65%", "6.5 CGPA", 6.5, "Product Based"],
    ["GlaxoSmithKline (GSK)", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
    ["Thermo Fisher Scientific", "65%", "65%", "6.5 CGPA", 6.5, "Product Based"],
    ["String Bio", "60%", "60%", "6.0 CGPA", 6.0, "Startup"],
    ["Syngene International", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
    ["Lupin", "60%", "60%", "6.0 CGPA", 6.0, "Product Based"],
  ],
  MI: [
    ["Coal India Limited", "60%", "60%", "60%", 6.0, "PSU"],
    ["Vedanta Resources", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Hindustan Zinc", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Tata Steel (Mining)", "65%", "65%", "6.5 CGPA", 6.5, "Core"],
    ["NMDC", "60%", "60%", "6.0 CGPA", 6.0, "PSU"],
    ["Rio Tinto (India)", "65%", "65%", "6.5 CGPA", 6.5, "Core"],
    ["JSW Steel (Mining)", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Adani Enterprises (Mining)", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Essel Mining & Industries", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Hindalco Industries", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Ambuja Cements", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Thriveni Earthmovers", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
  ],
  AERO: [
    ["Hindustan Aeronautics (HAL)", "65%", "65%", "6.5 CGPA", 6.5, "PSU"],
    ["ISRO", "65%", "65%", "6.5 CGPA / 65%", 6.5, "PSU"],
    ["DRDO", "60%", "60%", "6.0 CGPA", 6.0, "PSU"],
    ["Boeing India", "70%", "70%", "7.0 CGPA", 7.0, "Product Based"],
    ["Airbus India", "70%", "70%", "7.0 CGPA", 7.0, "Product Based"],
    ["GE Aerospace", "70%", "70%", "7.0 CGPA", 7.0, "Product Based"],
    ["Rolls-Royce India", "70%", "70%", "7.0 CGPA", 7.0, "Product Based"],
    ["Tata Advanced Systems", "60%", "60%", "6.0 CGPA", 6.0, "Core"],
    ["Agnikul Cosmos", "65%", "65%", "6.5 CGPA", 6.5, "Startup"],
    ["Collins Aerospace", "65%", "65%", "6.5 CGPA", 6.5, "Product Based"],
    ["Quest Global", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
    ["L&T Technology Services", "60%", "60%", "6.0 CGPA", 6.0, "Service Based"],
  ],
};

const CATEGORY_STYLES = {
  "Product Based": { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  "Product & Service": { color: "#7e22ce", bg: "#f3e8ff", border: "#e9d5ff" },
  "Service Based": { color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
  Core: { color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  PSU: { color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd" },
  Startup: { color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" },
};

function normalizeBranch(branch) {
  const key = String(branch || "").trim().toUpperCase();
  if (key.includes("CIVIL")) return "CIVIL";
  if (key.includes("CSE") || key.includes("COMPUTER")) return "CSE";
  if (key.includes("ECE") || key.includes("ELECTRONICS")) return "ECE";
  if (key.includes("EEE") || key.includes("ELECTRICAL")) return "EEE";
  if (key === "ME" || key.includes("MECHANICAL")) return "ME";
  if (key.includes("BIO")) return "BIO";
  if (key === "MI" || key.includes("MINING")) return "MI";
  if (key.includes("AERO")) return "AERO";
  return key;
}

export default function CompanyEligibility({ branch, cgpa, regNo }) {
  const branchKey = normalizeBranch(branch);
  const numericCgpa = Number(cgpa) || 0;

  const [localTenth, setLocalTenth] = useState("");
  const [localTwelfth, setLocalTwelfth] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1024 : false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userTenth = localTenth !== "" ? parseFloat(localTenth) : null;
  const userTwelfth = localTwelfth !== "" ? parseFloat(localTwelfth) : null;

  const rawCompanies = COMPANY_DATA[branchKey] || COMPANY_DATA.CSE;

  const processedCompanies = useMemo(() => {
    return rawCompanies.map(([name, reqTenthStr, reqTwelfthStr, btech, cgpaReq, category]) => {
      const reqTenth = parseFloat(reqTenthStr);
      const reqTwelfth = parseFloat(reqTwelfthStr);

      let eligible = numericCgpa >= cgpaReq;
      let tenthPass = true;
      let twelfthPass = true;

      if (userTenth !== null && userTenth < reqTenth) {
        eligible = false;
        tenthPass = false;
      }
      if (userTwelfth !== null && userTwelfth < reqTwelfth) {
        eligible = false;
        twelfthPass = false;
      }

      return {
        name,
        tenth: reqTenthStr,
        twelfth: reqTwelfthStr,
        btech,
        cgpaReq,
        category: category || "General",
        eligible,
        tenthPass,
        twelfthPass,
        gap: Math.max(0, cgpaReq - numericCgpa),
      };
    });
  }, [rawCompanies, numericCgpa, userTenth, userTwelfth]);

  const eligibleCount = processedCompanies.filter((c) => c.eligible).length;
  const totalCount = processedCompanies.length;
  const qualificationRate = totalCount > 0 ? Math.round((eligibleCount / totalCount) * 100) : 0;

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(processedCompanies.map((c) => c.category));
    return ["All", "Eligible Only", ...Array.from(set)];
  }, [processedCompanies]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return processedCompanies.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeCategory === "All") return true;
      if (activeCategory === "Eligible Only") return c.eligible;
      return c.category === activeCategory;
    });
  }, [processedCompanies, searchQuery, activeCategory]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 20, fontFamily: "'DM Sans', sans-serif" }}>
      {/* 1. Header & Summary Row */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", gap: isMobile ? 10 : 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            <div
              style={{
                width: isMobile ? 30 : 36,
                height: isMobile ? 30 : 36,
                borderRadius: 9,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Briefcase size={isMobile ? 15 : 18} />
            </div>
            <div>
              <h2 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                Recruitment Eligibility Matrix
              </h2>
            </div>
          </div>
          <p style={{ color: "#64748b", fontSize: isMobile ? 11.5 : 13, margin: "2px 0 0 0" }}>
            Criteria assessment for <strong>{branchKey}</strong> recruitment drives based on your CGPA
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignSelf: isMobile ? "flex-start" : "auto" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: isMobile ? "6px 12px" : "10px 16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontSize: isMobile ? 9 : 10.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Qualification Rate</div>
              <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 900, color: qualificationRate >= 75 ? "#15803d" : "#2563eb", fontFamily: "'Space Mono', monospace" }}>
                {qualificationRate}%
              </div>
            </div>
            <div style={{ fontSize: isMobile ? 10.5 : 11, color: "#64748b", fontWeight: 600, borderLeft: "1px solid #e2e8f0", paddingLeft: 8 }}>
              {eligibleCount} / {totalCount} Drives
            </div>
          </div>
        </div>
      </div>

      {/* 2. Local 10th & 12th Percentage Filter Studio */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: isMobile ? "12px 14px" : "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 10 : 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Calculator size={15} color="#2563eb" />
            <strong style={{ fontSize: isMobile ? 12.5 : 13.5, color: "#0f172a" }}>10th & 12th Percentages (Optional Filter)</strong>
          </div>
          <span style={{ fontSize: 10.5, color: "#64748b", background: "#ffffff", border: "1px solid #cbd5e1", padding: "1px 6px", borderRadius: 20 }}>
            Device Only
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))", gap: isMobile ? 8 : 14 }}>
          {/* 10th input */}
          <div>
            <label style={{ display: "block", fontSize: isMobile ? 10.5 : 11.5, fontWeight: 800, color: "#475569", marginBottom: 4, textTransform: "uppercase" }}>
              10th / Secondary Percentage (%)
            </label>
            <div style={{ display: "flex", gap: 5 }}>
              <input
                type="number"
                placeholder="e.g. 85.0"
                value={localTenth}
                onChange={(e) => setLocalTenth(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: isMobile ? "7px 10px" : "9px 12px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: 700,
                  color: "#0f172a",
                  fontFamily: "'Space Mono', monospace",
                  outline: "none",
                }}
              />
              {[60, 75, 85, 90].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setLocalTenth(String(val))}
                  style={{
                    padding: isMobile ? "3px 6px" : "4px 8px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: localTenth === String(val) ? "#eff6ff" : "#ffffff",
                    color: localTenth === String(val) ? "#2563eb" : "#475569",
                    fontSize: isMobile ? 10.5 : 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* 12th input */}
          <div>
            <label style={{ display: "block", fontSize: isMobile ? 10.5 : 11.5, fontWeight: 800, color: "#475569", marginBottom: 4, textTransform: "uppercase" }}>
              12th / Diploma Percentage (%)
            </label>
            <div style={{ display: "flex", gap: 5 }}>
              <input
                type="number"
                placeholder="e.g. 80.0"
                value={localTwelfth}
                onChange={(e) => setLocalTwelfth(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: isMobile ? "7px 10px" : "9px 12px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: 700,
                  color: "#0f172a",
                  fontFamily: "'Space Mono', monospace",
                  outline: "none",
                }}
              />
              {[60, 75, 85, 90].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setLocalTwelfth(String(val))}
                  style={{
                    padding: isMobile ? "3px 6px" : "4px 8px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: localTwelfth === String(val) ? "#eff6ff" : "#ffffff",
                    color: localTwelfth === String(val) ? "#2563eb" : "#475569",
                    fontSize: isMobile ? 10.5 : 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Category Filter Toolbar */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "space-between",
          gap: isMobile ? 8 : 12,
          width: "100%",
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            position: "relative",
            width: isMobile ? "100%" : "auto",
            minWidth: isMobile ? "100%" : 240,
            maxWidth: isMobile ? "100%" : 320,
            flex: isMobile ? "none" : "0 1 300px",
            display: "flex",
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          <Search
            size={14}
            color="#64748b"
            style={{
              position: "absolute",
              left: 10,
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          <input
            type="text"
            placeholder="Search company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              height: isMobile ? 36 : 38,
              boxSizing: "border-box",
              padding: "0 28px 0 32px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: isMobile ? 12 : 13,
              color: "#0f172a",
              outline: "none",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 8,
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: 18,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
                padding: 0,
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Category Pills (Horizontal scroll track on mobile) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            paddingBottom: isMobile ? 2 : 0,
          }}
        >
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: isMobile ? "5px 10px" : "6px 12px",
                  borderRadius: 8,
                  border: isSelected ? "1px solid #2563eb" : "1px solid #cbd5e1",
                  background: isSelected ? "#eff6ff" : "#ffffff",
                  color: isSelected ? "#1d4ed8" : "#475569",
                  fontSize: isMobile ? 11.5 : 12,
                  fontWeight: isSelected ? 800 : 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Company Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", gap: isMobile ? 10 : 16 }}>
        {filteredCompanies.map((c, index) => {
          const catStyle = CATEGORY_STYLES[c.category] || CATEGORY_STYLES["Service Based"];
          const isEligible = c.eligible;

          return (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.3) }}
              style={{
                background: "#ffffff",
                border: isEligible ? "1.5px solid #cbd5e1" : "1px solid #e2e8f0",
                borderRadius: 14,
                padding: isMobile ? "12px 14px" : "18px 20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: isMobile ? 10 : 14,
                opacity: isEligible ? 1 : 0.85,
              }}
            >
              {/* Card Header: Company Name + Status Badge */}
              <div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: isMobile ? 14.5 : 16, fontWeight: 900, color: "#0f172a" }}>
                      {c.name}
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 3,
                        fontSize: isMobile ? 10 : 11,
                        fontWeight: 700,
                        color: catStyle.color,
                        background: catStyle.bg,
                        border: `1px solid ${catStyle.border}`,
                        padding: "1px 6px",
                        borderRadius: 5,
                      }}
                    >
                      {c.category}
                    </span>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      fontSize: isMobile ? 10.5 : 11.5,
                      fontWeight: 800,
                      color: isEligible ? "#15803d" : "#b91c1c",
                      background: isEligible ? "#dcfce7" : "#fee2e2",
                      border: `1px solid ${isEligible ? "#bbf7d0" : "#fecaca"}`,
                      padding: "2px 7px",
                      borderRadius: 6,
                      flexShrink: 0,
                    }}
                  >
                    {isEligible ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {isEligible ? "Eligible" : "Need Upgrade"}
                  </span>
                </div>
              </div>

              {/* Requirements 3-box Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 4,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 9,
                  padding: isMobile ? "6px 8px" : "8px 10px",
                  textAlign: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>10th Min</div>
                  <div style={{ fontSize: isMobile ? 11.5 : 12.5, fontWeight: 800, color: c.tenthPass ? "#0f172a" : "#dc2626", marginTop: 1 }}>
                    {c.tenth}
                  </div>
                </div>

                <div style={{ borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>12th Min</div>
                  <div style={{ fontSize: isMobile ? 11.5 : 12.5, fontWeight: 800, color: c.twelfthPass ? "#0f172a" : "#dc2626", marginTop: 1 }}>
                    {c.twelfth}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>B.Tech Min</div>
                  <div style={{ fontSize: isMobile ? 11.5 : 12.5, fontWeight: 800, color: isEligible ? "#15803d" : "#0f172a", marginTop: 1, fontFamily: "'Space Mono', monospace" }}>
                    {c.cgpaReq.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Progress & Gap Advisory */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: isMobile ? 10.5 : 11, color: "#64748b", marginBottom: 3 }}>
                  <span>CGPA Match ({numericCgpa.toFixed(2)} / {c.cgpaReq.toFixed(2)})</span>
                  <span style={{ fontWeight: 700, color: isEligible ? "#15803d" : "#b45309" }}>
                    {Math.round(Math.min((numericCgpa / c.cgpaReq) * 100, 100))}%
                  </span>
                </div>
                <div style={{ width: "100%", height: 4, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min((numericCgpa / c.cgpaReq) * 100, 100)}%`,
                      background: isEligible ? "#16a34a" : "#f59e0b",
                      borderRadius: 4,
                    }}
                  />
                </div>

                {!isEligible && (
                  <div style={{ marginTop: 6, fontSize: isMobile ? 10.5 : 11.5, color: "#b91c1c", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                    <AlertTriangle size={12} />
                    {c.gap > 0 ? `Requires +${c.gap.toFixed(2)} CGPA gain` : "10th/12th % is below threshold"}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredCompanies.length === 0 && (
        <div style={{ textAlign: "center", padding: isMobile ? "24px 14px" : "40px 20px", background: "#f8fafc", borderRadius: 14, border: "1px solid #e2e8f0" }}>
          <Building size={28} color="#94a3b8" style={{ marginBottom: 6 }} />
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: "0 0 3px 0" }}>No matching companies found</h4>
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Try clearing your search query or switching category filters.</p>
        </div>
      )}

      {/* Bottom Academic Notice */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: isMobile ? "10px 12px" : "12px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          fontSize: isMobile ? 11 : 12,
          color: "#64748b",
        }}
      >
        <GraduationCap size={15} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          Official recruitment shortlisting may also consider backlog count, department specific interview rounds,
          and company specific eligibility policies during the final drive announcement.
        </div>
      </div>
    </div>
  );
}
