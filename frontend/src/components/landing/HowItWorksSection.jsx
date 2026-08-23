import React, { useState } from "react";
import { Lock, BarChart2, Target, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "ACCESS",
    headline: "Keep your academic information organized",
    desc: "Sign in with your university registration number. Verify your identity with a secure, passwordless OTP sent to your registered email.",
    icon: <Lock size={20} color="#2563eb" />,
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    step: "02",
    title: "UNDERSTAND",
    headline: "Turn your academic history into meaningful insights",
    desc: "Instantly visualize your semester performance curve, 5-basket graduation credits, domain tracks, and peer cohort standings.",
    icon: <BarChart2 size={20} color="#059669" />,
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    step: "03",
    title: "PLAN",
    headline: "Use predictions and cutoffs to make better decisions",
    desc: "Run what-if simulations to hit target graduation CGPA scores and evaluate criteria benchmarks across 50+ recruiting companies.",
    icon: <Target size={20} color="#d97706" />,
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
];

export default function HowItWorksSection() {
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  return (
    <section
      id="how-it-works"
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
            color: "#2563eb",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          <span>Execution Blueprint</span>
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
          How GradeFlow works
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
          A streamlined 3-step pathway from raw university records to total academic intelligence.
        </p>
      </div>

      {/* Connected 3-Step Interactive Process Track */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 20,
          width: "100%",
          boxSizing: "border-box",
        }}
        className="gf-steps-grid"
      >
        {STEPS.map((step, idx) => {
          const isSelected = activeStepIdx === idx;
          return (
            <div
              key={idx}
              onClick={() => setActiveStepIdx(idx)}
              style={{
                background: "#ffffff",
                border: "1px solid",
                borderColor: isSelected ? step.color : "#f1f5f9",
                borderRadius: 14,
                padding: "24px 20px",
                boxShadow: isSelected ? "0 4px 20px rgba(15, 23, 42, 0.06)" : "0 2px 10px rgba(15, 23, 42, 0.02)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 0,
                width: "100%",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = step.border;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isSelected ? step.color : "#f1f5f9";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      fontFamily: "'Space Mono', monospace",
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: step.bg,
                      color: step.color,
                      border: `1px solid ${step.border}`,
                    }}
                  >
                    STEP {step.step}
                  </span>

                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: step.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {step.icon}
                  </div>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 750, color: "#0f172a", margin: "0 0 8px 0", lineHeight: 1.35 }}>
                  {step.headline}
                </h3>

                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: 0 }}>
                  {step.desc}
                </p>
              </div>

              <div style={{ borderTop: "1px solid #f8fafc", paddingTop: 12, marginTop: 16, display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: step.color }}>
                <span>Phase {step.step}: {step.title}</span>
                <ChevronRight size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
