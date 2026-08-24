import React, { useState } from "react";
import {
  Layers,
  Hexagon,
  BookOpen,
  Zap,
  Cpu,
  Target,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

const BASKET_DATA = [
  {
    id: "B1",
    name: "Foundation Sciences",
    icon: <Hexagon size={18} color="#2563eb" />,
    color: "#2563eb",
    targetCredits: 17,
    earnedCredits: 17,
    percentage: 100,
    status: "Completed",
    description: "Physics, Applied Chemistry, Differential Calculus, Linear Algebra, and Environmental Sciences.",
    sampleSubjects: ["Applied Physics", "Engineering Chemistry", "Mathematics I & II", "Environmental Studies"],
  },
  {
    id: "B2",
    name: "Humanities & Management",
    icon: <BookOpen size={18} color="#7c3aed" />,
    color: "#7c3aed",
    targetCredits: 12,
    earnedCredits: 12,
    percentage: 100,
    status: "Completed",
    description: "Professional Communication, Business Ethics, Technical Writing, and Engineering Economics.",
    sampleSubjects: ["Professional Communication", "Ethics in Engineering", "Principles of Economics", "Technical Presentation"],
  },
  {
    id: "B3",
    name: "Smart Stack Programming",
    icon: <Zap size={18} color="#d97706" />,
    color: "#d97706",
    targetCredits: 25,
    earnedCredits: 25,
    percentage: 100,
    status: "Completed",
    description: "Modern digital literacy, programming foundations, web technologies, and computational thinking.",
    sampleSubjects: ["Programming in C", "Object Oriented Java", "Python Essentials", "Web Full-Stack Fundamentals"],
  },
  {
    id: "B4",
    name: "Core Engineering",
    icon: <Cpu size={18} color="#059669" />,
    color: "#059669",
    targetCredits: 58,
    earnedCredits: 48,
    percentage: 83,
    status: "In Progress",
    description: "Data Structures, Database Engineering, Operating Systems, Networks, and Distributed Systems.",
    sampleSubjects: ["Database Management Systems", "Operating Systems", "Computer Networks", "Design & Analysis of Algorithms"],
  },
  {
    id: "B5",
    name: "Domain & Industry Specialization",
    icon: <Target size={18} color="#ea580c" />,
    color: "#ea580c",
    targetCredits: 48,
    earnedCredits: 22,
    percentage: 46,
    status: "In Progress",
    description: "Specialized tracks (AI/ML, Cloud, Cyber Security) and final-year capstone industrial projects.",
    sampleSubjects: ["Machine Learning & Deep Learning", "Cloud Infrastructure", "Information Security", "Capstone Project"],
  },
];

export default function DomainIntelligenceSection({ onOpenDegreeProgress }) {
  const [selectedBasketId, setSelectedBasketId] = useState("B4");
  const activeBasket = BASKET_DATA.find((b) => b.id === selectedBasketId) || BASKET_DATA[0];

  const totalEarned = BASKET_DATA.reduce((acc, b) => acc + b.earnedCredits, 0);
  const totalTarget = 160;

  return (
    <section
      id="domains"
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
      <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "#7c3aed",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          <Layers size={15} strokeWidth={2.4} />
          <span>Curriculum Architecture</span>
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
          160-Credit Degree Framework
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
          Centurion University structures graduation requirements across 5 distinct curricular baskets totaling 160 credits.
        </p>
      </div>

      {/* Degree Overview Strip */}
      <div
        style={{
          background: "#ffffff",
          padding: "20px 22px",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          marginBottom: 32,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Degree Completion Progress: </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#2563eb", fontFamily: "'Space Mono', monospace" }}>
              {totalEarned} / {totalTarget} Credits ({Math.round((totalEarned / totalTarget) * 100)}%)
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>On Track for 2027 Graduation (Sem 6)</span>
        </div>

        {/* Visual Stacked Progress Bar */}
        <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", background: "#f1f5f9", gap: 2, width: "100%" }}>
          {BASKET_DATA.map((b) => {
            const widthPct = (b.earnedCredits / totalTarget) * 100;
            return (
              <div
                key={b.id}
                title={`${b.name}: ${b.earnedCredits} Cr`}
                style={{
                  width: `${widthPct}%`,
                  background: b.color,
                  transition: "width 0.3s ease",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 2-Column Split: Basket Switcher (Left) + Detail View (Right) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.3fr",
          gap: 28,
          alignItems: "start",
          width: "100%",
          boxSizing: "border-box",
        }}
        className="gf-editorial-split"
      >
        {/* Left: Basket Selector List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", minWidth: 0 }}>
          {BASKET_DATA.map((b) => {
            const isSelected = b.id === selectedBasketId;
            return (
              <div
                key={b.id}
                onClick={() => setSelectedBasketId(b.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid",
                  borderColor: isSelected ? b.color : "#e2e8f0",
                  background: isSelected ? "#ffffff" : "#f8fafc",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                  transition: "all 0.15s ease",
                  width: "100%",
                  boxSizing: "border-box",
                  minWidth: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, overflow: "hidden" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #f1f5f9", flexShrink: 0 }}>
                    {b.icon}
                  </div>
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <div style={{ fontSize: 13, fontWeight: isSelected ? 750 : 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {b.id}: {b.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {b.earnedCredits} / {b.targetCredits} Credits
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 750, color: b.percentage === 100 ? "#059669" : b.color, flexShrink: 0, marginLeft: 8 }}>
                  {b.percentage}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Basket Detail Card */}
        <div
          style={{
            background: "#ffffff",
            padding: "24px 22px",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            width: "100%",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: activeBasket.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                Basket {activeBasket.id} Curriculum
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                {activeBasket.name}
              </div>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: activeBasket.percentage === 100 ? "#065f46" : "#1e40af", background: activeBasket.percentage === 100 ? "#dcfce7" : "#eff6ff", padding: "3px 8px", borderRadius: 6 }}>
              {activeBasket.status}
            </span>
          </div>

          <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.55, margin: "0 0 16px 0" }}>
            {activeBasket.description}
          </p>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
              Sample Courses in this Basket:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
              {activeBasket.sampleSubjects.map((sub, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569", background: "#f8fafc", padding: "6px 8px", borderRadius: 6, minWidth: 0 }}>
                  <CheckCircle2 size={13} color="#059669" style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Degree Progress Handoff */}
      <div
        onClick={onOpenDegreeProgress}
        style={{
          marginTop: 24,
          padding: "14px 18px",
          background: "#faf5ff",
          border: "1px solid #e9d5ff",
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
          e.currentTarget.style.background = "#f3e8ff";
          e.currentTarget.style.borderColor = "#c084fc";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#faf5ff";
          e.currentTarget.style.borderColor = "#e9d5ff";
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 750, color: "#6b21a8", lineHeight: 1.3 }}>
            Audit your personalized degree completion & 5 baskets
          </div>
          <div style={{ fontSize: 11.5, color: "#7e22ce", marginTop: 2 }}>
            Review completed credits and remaining graduation requirements in your Dashboard
          </div>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12.5,
            fontWeight: 750,
            color: "#6b21a8",
            flexShrink: 0,
          }}
        >
          <span>Open Degree Progress</span>
          <ChevronRight size={15} />
        </div>
      </div>
    </section>
  );
}
