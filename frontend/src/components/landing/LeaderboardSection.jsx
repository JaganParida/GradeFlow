import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Award,
  Medal,
  Crown,
  Users,
  Filter,
  Shield,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

const DEMO_LEADERBOARD = [
  { rank: 1, name: "Student A****", branch: "CSE", cgpa: 9.64, badge: "Gold Medal", percentile: "Top 0.5%", isUser: false },
  { rank: 2, name: "Student B****", branch: "CSE", cgpa: 9.48, badge: "Silver Medal", percentile: "Top 1.0%", isUser: false },
  { rank: 3, name: "Student C****", branch: "ECE", cgpa: 9.32, badge: "Bronze Medal", percentile: "Top 2.0%", isUser: false },
  { rank: 4, name: "Student D****", branch: "CSE", cgpa: 9.18, badge: "Distinction", percentile: "Top 3.5%", isUser: false },
  { rank: 5, name: "Student E****", branch: "ME", cgpa: 9.05, badge: "Distinction", percentile: "Top 4.5%", isUser: false },
  { rank: 8, name: "You (Demo Profile)", branch: "CSE", cgpa: 8.74, badge: "Top 5% Cohort", percentile: "Top 5.0%", isUser: true },
  { rank: 9, name: "Student F****", branch: "Civil", cgpa: 8.68, badge: "First Class", percentile: "Top 7.0%", isUser: false },
];

export default function LeaderboardSection({ onOpenLeaderboard }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredList = DEMO_LEADERBOARD.filter((item) => {
    if (activeFilter === "all") return true;
    return item.branch.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <section
      id="leaderboard"
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
            color: "#d97706",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          <Trophy size={15} strokeWidth={2.4} />
          <span>Cohort Benchmarks</span>
        </div>

        <h2
          style={{
            fontSize: "clamp(30px, 4.2vw, 46px)",
            fontWeight: 850,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            color: "#0f172a",
            margin: "0 0 16px 0",
          }}
        >
          Know where you stand
        </h2>

        <p
          style={{
            fontSize: "clamp(15px, 1.8vw, 17.5px)",
            lineHeight: 1.6,
            color: "#64748b",
            margin: 0,
          }}
        >
          Anonymized percentile rankings and department cohort benchmarks that respect student privacy.
        </p>
      </div>

      {/* Podium + Table Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr",
          gap: 36,
          alignItems: "start",
        }}
        className="gf-editorial-split"
      >
        {/* Left: Top Rankers Podium */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 16 }}>
            Top University Cohort Rankers
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DEMO_LEADERBOARD.slice(0, 3).map((ranker, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 18px",
                  background: "#ffffff",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: i === 0 ? "#fef3c7" : i === 1 ? "#f1f5f9" : "#ffedd5",
                      color: i === 0 ? "#b45309" : i === 1 ? "#475569" : "#c2410c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    {ranker.rank}
                  </span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 750, color: "#0f172a" }}>{ranker.name}</div>
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>{ranker.branch} &bull; {ranker.percentile}</div>
                  </div>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#2563eb", fontFamily: "'Space Mono', monospace" }}>
                  {ranker.cgpa.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
            * Names are anonymized to protect student privacy according to institutional academic compliance standards.
          </div>
        </div>

        {/* Right: Cohort Leaderboard Table */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 750, color: "#0f172a" }}>Batch of 2027 Rankings (Semester 6)</span>
            <button
              onClick={onOpenLeaderboard}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12.5,
                fontWeight: 700,
                color: "#2563eb",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span>View Full Leaderboard</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {filteredList.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: idx < filteredList.length - 1 ? "1px solid #f8fafc" : "none",
                  background: item.isUser ? "#eff6ff" : "transparent",
                  minWidth: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, overflow: "hidden" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 750, color: item.isUser ? "#2563eb" : "#64748b", width: 18, flexShrink: 0 }}>
                    #{item.rank}
                  </span>
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <div style={{ fontSize: 13, fontWeight: item.isUser ? 800 : 650, color: item.isUser ? "#1e40af" : "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{item.branch} &bull; {item.badge}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#059669", background: "#ecfdf5", padding: "2px 6px", borderRadius: 4 }}>
                    {item.percentile}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>
                    {item.cgpa.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
