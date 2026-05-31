import React, { useMemo } from "react";
import { categorizeBaskets } from "../utils/basketLogic";
import { CheckCircle, Award, Target, BookOpen, Hexagon, Cpu, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";

const BASKET_ICONS = {
  B1: <Hexagon size={24} color="var(--accent)" />,
  B2: <BookOpen size={24} color="#a855f7" />,
  B3: <Zap size={24} color="#f59e0b" />,
  B4: <Cpu size={24} color="#ef4444" />,
  B5: <Target size={24} color="var(--success)" />,
};

const BASKET_NAMES = {
  B1: "Foundation in Sciences",
  B2: "Humanities & Management",
  B3: "Smart Stack",
  B4: "Core Engineering",
  B5: "Domain, Skills & Projects",
};

export default function BasketDashboard({ results }) {
  const [expandedBasket, setExpandedBasket] = React.useState(null);
  
  const baskets = useMemo(() => categorizeBaskets(results), [results]);

  const totalEarned = baskets.B1.credits + baskets.B2.credits + baskets.B3.credits + baskets.B4.credits + baskets.B5.credits;
  const targetTotal = 160;

  // Honours logic: Extra 20 credits in Basket V
  const honoursCredits = Math.max(0, baskets.B5.credits - baskets.B5.target);
  const honoursTarget = 20;
  const isHonoursEligible = honoursCredits >= honoursTarget;

  return (
    <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        
        {/* Main Degree Progress */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(62,166,255,0.1)", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
             <svg width="80" height="80" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                <circle cx="40" cy="40" r="36" fill="none" stroke="var(--border-color)" strokeWidth="6" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="var(--accent)" strokeWidth="6" strokeDasharray="226" strokeDashoffset={226 - (226 * Math.min(1, totalEarned / targetTotal))} strokeLinecap="round" />
             </svg>
             <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>{Math.round(Math.min(100, (totalEarned/targetTotal)*100))}%</span>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>B.Tech Completion</h3>
            <p style={{ fontSize: 13, color: "var(--secondary)", fontWeight: 500 }}>
              <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 16 }}>{totalEarned}</span> / {targetTotal} Credits
            </p>
          </div>
        </div>

        {/* Honours Progress */}
        <div style={{ background: isHonoursEligible ? "rgba(245,158,11,0.08)" : "var(--card-bg)", border: isHonoursEligible ? "1px solid rgba(245,158,11,0.3)" : "1px solid var(--border-color)", borderRadius: 16, padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(245,158,11,0.1)", display: "flex", justifyContent: "center", alignItems: "center" }}>
             <Award size={32} color="#f59e0b" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: isHonoursEligible ? "#f59e0b" : "var(--text-main)", marginBottom: 4 }}>B.Tech Honours</h3>
            {isHonoursEligible ? (
              <p style={{ fontSize: 13, color: "var(--success)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                 <CheckCircle size={14} /> Criteria Met!
              </p>
            ) : (
              <p style={{ fontSize: 13, color: "var(--secondary)", fontWeight: 500 }}>
                <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 16 }}>{honoursCredits}</span> / {honoursTarget} Extra Domain Credits
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Baskets Grid */}
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)", marginTop: 10 }}>Curriculum Baskets</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {Object.entries(baskets).map(([key, data], i) => {
          const progress = Math.min(100, (data.credits / data.target) * 100);
          const isComplete = data.credits >= data.target;
          const isExpanded = expandedBasket === key;

          return (
            <motion.div 
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" }}
            >
              {/* Basket Header */}
              <div 
                onClick={() => setExpandedBasket(isExpanded ? null : key)}
                style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg-main)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {BASKET_ICONS[key]}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>Basket {key.replace('B', '')}: {BASKET_NAMES[key]}</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 150, height: 6, background: "var(--bg-main)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: isComplete ? "var(--success)" : "var(--accent)", width: `${progress}%`, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isComplete ? "var(--success)" : "var(--secondary)" }}>
                        {data.credits} / {data.target} Cr
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ color: "var(--secondary)" }}>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Expanded Subject List */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid var(--border-color)", padding: 20, background: "var(--bg-main)" }}>
                  {data.subjects.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--secondary)", fontStyle: "italic" }}>No subjects completed in this basket yet.</p>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", paddingBottom: 10, fontSize: 12, color: "var(--secondary)", borderBottom: "1px solid var(--border-color)" }}>Subject</th>
                          <th style={{ textAlign: "center", paddingBottom: 10, fontSize: 12, color: "var(--secondary)", borderBottom: "1px solid var(--border-color)" }}>Sem</th>
                          <th style={{ textAlign: "center", paddingBottom: 10, fontSize: 12, color: "var(--secondary)", borderBottom: "1px solid var(--border-color)" }}>Grade</th>
                          <th style={{ textAlign: "right", paddingBottom: 10, fontSize: 12, color: "var(--secondary)", borderBottom: "1px solid var(--border-color)" }}>Credits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.subjects.map((sub, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: "12px 0", fontSize: 13, color: "var(--text-main)", fontWeight: 500 }}>
                              {sub.subName}
                              <div style={{ fontSize: 11, color: "var(--secondary)", marginTop: 2 }}>{sub.subCode}</div>
                            </td>
                            <td style={{ padding: "12px 0", fontSize: 13, color: "var(--secondary)", textAlign: "center" }}>{sub.semester}</td>
                            <td style={{ padding: "12px 0", textAlign: "center" }}>
                              <span style={{ 
                                padding: "2px 8px", 
                                borderRadius: 6, 
                                fontSize: 12, 
                                fontWeight: 700,
                                background: ['F','R','M','S','I'].includes(sub.grade) ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
                                color: ['F','R','M','S','I'].includes(sub.grade) ? "var(--danger)" : "var(--success)"
                              }}>
                                {sub.grade}
                              </span>
                            </td>
                            <td style={{ padding: "12px 0", fontSize: 13, color: "var(--text-main)", fontWeight: 700, textAlign: "right" }}>
                              {sub.earnedCredits}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
    </div>
  );
}
