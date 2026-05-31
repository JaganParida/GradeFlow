import React, { useMemo } from "react";
import { categorizeBaskets, BASKET_1_SYLLABUS, BASKET_2_SYLLABUS, BASKET_3_SYLLABUS, BASKET_5_DOMAINS } from "../utils/basketLogic";
import { CheckCircle, Award, Target, BookOpen, Hexagon, Cpu, Zap, ChevronDown, ChevronUp, Folder } from "lucide-react";
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
  const [expandedDomain, setExpandedDomain] = React.useState(null);
  
  const baskets = useMemo(() => categorizeBaskets(results), [results]);

  const totalEarned = baskets.B1.credits + baskets.B2.credits + baskets.B3.credits + baskets.B4.credits + baskets.B5.credits;
  const targetTotal = 160;

  // Honours logic: Extra 20 credits in Basket V
  const honoursCredits = Math.max(0, baskets.B5.credits - baskets.B5.target);
  const honoursTarget = 20;
  const isHonoursEligible = honoursCredits >= honoursTarget;

  const renderSubjectRow = (sub, idx, isPending = false) => {
    const isBacklog = !isPending && ['F','R','M','S','I'].includes(sub.grade);
    const isPassed = !isPending && !isBacklog;

    let rowBg = "transparent";
    if (isPassed) rowBg = "rgba(34, 197, 94, 0.06)"; // subtle green for completed
    if (isBacklog) rowBg = "rgba(239, 68, 68, 0.06)"; // subtle red for backlogs

    return (
      <div key={idx} className="basket-subject-row" style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "16px 24px", alignItems: "center", borderBottom: "1px solid var(--border-color)", background: rowBg, opacity: isPending ? 0.6 : 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, color: "var(--text-main)", fontWeight: 700, lineHeight: 1.4, textTransform: "uppercase" }}>{sub.subName}</span>
          {sub.subCode && <span style={{ fontSize: 12, color: "var(--secondary)", fontFamily: "Space Mono, monospace" }}>{sub.subCode}</span>}
        </div>
        
        <div className="mobile-flex-row" style={{ textAlign: "center", fontSize: 14, color: "var(--secondary)", fontWeight: 600 }}>
          <span className="mobile-label">Semester</span>
          <span>{isPending ? "—" : sub.semester}</span>
        </div>
        
        <div className="mobile-flex-row" style={{ textAlign: "center", display: "flex", justifyContent: "center" }}>
          <span className="mobile-label">Status</span>
          {isPending ? (
            <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, background: "rgba(255,255,255,0.05)", color: "var(--secondary)" }}>PENDING</span>
          ) : (
            <span style={{ 
              padding: "4px 10px", 
              borderRadius: 8, 
              fontSize: 13, 
              fontWeight: 800,
              background: isBacklog ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
              color: isBacklog ? "var(--danger)" : "var(--success)"
            }}>
              {sub.grade}
            </span>
          )}
        </div>
        
        <div className="mobile-flex-row" style={{ textAlign: "right", fontSize: 15, color: "var(--text-main)", fontWeight: 800 }}>
          <span className="mobile-label">Credits</span>
          <span>{isPending ? sub.credits : sub.earnedCredits}</span>
        </div>
      </div>
    );
  };

  const renderBasketContents = (key, data) => {
    let syllabusList = [];
    if (key === 'B1') syllabusList = BASKET_1_SYLLABUS;
    if (key === 'B2') syllabusList = BASKET_2_SYLLABUS;
    if (key === 'B3') syllabusList = BASKET_3_SYLLABUS;

    if (['B1', 'B2', 'B3'].includes(key)) {
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="basket-grid-header" style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "16px 24px", borderBottom: "1px solid var(--border-color)", borderTop: "1px solid var(--border-color)", fontSize: 12, color: "var(--secondary)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
            <div>Subject</div>
            <div style={{ textAlign: "center" }}>Sem</div>
            <div style={{ textAlign: "center" }}>Status</div>
            <div style={{ textAlign: "right" }}>Credits</div>
          </div>
          {syllabusList.map((syllabusSub, idx) => {
             // Find if student has taken this subject
             const takenSub = data.subjects.find(s => s.subName && s.subName.toLowerCase().includes(syllabusSub.subName.toLowerCase()));
             if (takenSub) return renderSubjectRow(takenSub, idx, false);
             return renderSubjectRow({ subName: syllabusSub.subName, credits: syllabusSub.credits }, idx, true);
          })}
          {/* Render extra subjects the student took in this basket not in static list */}
          {data.subjects.filter(s => !syllabusList.some(syllabusSub => s.subName && s.subName.toLowerCase().includes(syllabusSub.subName.toLowerCase()))).map((extraSub, idx) => {
             return renderSubjectRow(extraSub, 'extra-' + idx, false);
          })}
        </div>
      );
    }
    
    if (key === 'B4') {
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {data.subjects.length === 0 ? (
            <p style={{ padding: 20, fontSize: 13, color: "var(--secondary)", fontStyle: "italic" }}>No subjects completed in this basket yet.</p>
          ) : (
            <>
              <div className="basket-grid-header" style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "16px 24px", borderBottom: "1px solid var(--border-color)", borderTop: "1px solid var(--border-color)", fontSize: 12, color: "var(--secondary)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                <div>Subject</div>
                <div style={{ textAlign: "center" }}>Sem</div>
                <div style={{ textAlign: "center" }}>Grade</div>
                <div style={{ textAlign: "right" }}>Credits</div>
              </div>
              {data.subjects.map((sub, idx) => renderSubjectRow(sub, idx, false))}
            </>
          )}
        </div>
      );
    }

    if (key === 'B5') {
      return (
        <div style={{ display: "flex", flexDirection: "column", background: "var(--bg-main)", padding: "16px 24px" }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)", marginBottom: 16 }}>Specialization Domains</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {BASKET_5_DOMAINS.map((domain, dIdx) => (
              <div key={dIdx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: 12, overflow: "hidden" }}>
                <div 
                  onClick={() => setExpandedDomain(expandedDomain === domain ? null : domain)}
                  style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: expandedDomain === domain ? "rgba(255,255,255,0.04)" : "transparent" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Folder size={18} color="var(--accent)" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>{domain}</span>
                  </div>
                  {expandedDomain === domain ? <ChevronUp size={18} color="var(--secondary)" /> : <ChevronDown size={18} color="var(--secondary)" />}
                </div>
                {expandedDomain === domain && (
                  <div style={{ padding: "0 16px 16px 16px", borderTop: "1px solid var(--border-color)" }}>
                    <p style={{ marginTop: 16, fontSize: 13, color: "var(--secondary)", fontStyle: "italic", lineHeight: 1.5 }}>
                      The specific subjects for the <strong>{domain}</strong> track are managed directly by your department. Register for these tracks via ERP to build your domain specialization!
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)", marginTop: 24, marginBottom: 16 }}>Your Completed B5 Subjects & Projects</h4>
          {data.subjects.length === 0 ? (
             <p style={{ fontSize: 13, color: "var(--secondary)", fontStyle: "italic" }}>No subjects completed in this basket yet.</p>
          ) : (
             <div style={{ border: "1px solid var(--border-color)", borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
               {/* Desktop Header for Completed B5 Subjects */}
               <div className="basket-grid-header" style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "16px 24px", borderBottom: "1px solid var(--border-color)", fontSize: 12, color: "var(--secondary)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                 <div>Subject</div>
                 <div style={{ textAlign: "center" }}>Sem</div>
                 <div style={{ textAlign: "center" }}>Grade</div>
                 <div style={{ textAlign: "right" }}>Credits</div>
               </div>
               {data.subjects.map((sub, idx) => renderSubjectRow(sub, idx, false))}
             </div>
          )}
        </div>
      );
    }
  };

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
                <div style={{ padding: "0 0 16px 0", background: "var(--bg-main)", borderTop: "1px solid var(--border-color)" }}>
                  <style>
                    {`
                      @media (max-width: 640px) {
                        .basket-grid-header { display: none !important; }
                        .basket-subject-row {
                          grid-template-columns: 1fr !important;
                          gap: 12px;
                          background: rgba(255,255,255,0.02);
                          border-radius: 12px;
                          margin: 12px 16px;
                          border: 1px solid var(--border-color) !important;
                          padding: 16px !important;
                        }
                        .mobile-flex-row {
                          text-align: right !important;
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                          border-top: 1px dashed rgba(255,255,255,0.1);
                          padding-top: 12px;
                        }
                        .mobile-label { display: block !important; color: var(--secondary); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                      }
                      .mobile-label { display: none; }
                    `}
                  </style>

                  {renderBasketContents(key, data)}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
    </div>
  );
}
