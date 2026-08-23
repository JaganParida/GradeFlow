import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "What is GradeFlow?",
    answer:
      "GradeFlow is an academic analytics and GPA intelligence platform specifically engineered for university students. It translates complex university grading scales, semester marksheets, and curricular baskets into actionable insights, target grade predictions, and placement readiness evaluations.",
  },
  {
    question: "Who is GradeFlow designed for?",
    answer:
      "GradeFlow is designed for university and college students who want to track their academic trajectory, understand their cumulative CGPA, plan upcoming semesters, verify credit completion against their 160-credit degree requirements, and evaluate company placement cutoffs.",
  },
  {
    question: "What academic metrics can I track with GradeFlow?",
    answer:
      "You can track semester SGPA progression, cumulative CGPA, subject-level grade distributions (O, E, A, B, C, D), credit accumulation across the 5 curriculum baskets (Foundation Sciences, Humanities, Smart Stack, Core Engineering, and Domain Specializations), peer cohort standings, and class attendance.",
  },
  {
    question: "How does the Grade & Target Predictor work?",
    answer:
      "The Target Predictor calculates the exact average SGPA required in your remaining semesters to achieve your desired graduation CGPA using official weighted credit formulas. The Exam Predictor allows you to input internal evaluation marks (out of 40 or 50) and see the exact external scores needed to secure each specific grade.",
  },
  {
    question: "How does Placement Readiness evaluate eligibility?",
    answer:
      "The placement module compares your 10th, 12th, and current CGPA profile against the historical academic recruitment cutoffs of over 50 top hiring companies across Product Based, Service Based, Core Engineering, and PSU categories.",
  },
  {
    question: "How is my academic information protected?",
    answer:
      "GradeFlow uses passwordless, time-limited OTP verification sent directly to your registered university email. Active student sessions are monitored with device-aware controls, and academic records are strictly scoped to authenticated student identities on protected server infrastructure.",
  },
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggleFaq = (idx) => {
    setOpenIdx(openIdx === idx ? -1 : idx);
  };

  return (
    <section
      id="faq"
      className="gf-landing-section"
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "64px 20px",
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div className="gf-section-header" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 40px" }}>
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
          <HelpCircle size={15} strokeWidth={2.4} />
          <span>Frequently Asked Questions</span>
        </div>

        <h2
          style={{
            fontSize: "clamp(26px, 4vw, 42px)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "#0f172a",
            margin: "0 0 14px 0",
          }}
        >
          Common Questions &amp; Answers
        </h2>

        <p
          style={{
            fontSize: "clamp(14.5px, 1.8vw, 16.5px)",
            lineHeight: 1.6,
            color: "#64748b",
            margin: 0,
            textWrap: "balance",
          }}
        >
          Everything you need to know about GradeFlow's calculations, features, and academic privacy.
        </p>
      </div>

      {/* Accordion List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", boxSizing: "border-box" }}>
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              style={{
                background: "#ffffff",
                border: "1px solid",
                borderColor: isOpen ? "#93c5fd" : "#e2e8f0",
                borderRadius: 12,
                overflow: "hidden",
                transition: "all 0.15s ease",
                boxShadow: isOpen ? "0 2px 8px rgba(37, 99, 235, 0.05)" : "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <button
                onClick={() => toggleFaq(idx)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: isOpen ? "#f8fafc" : "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  gap: 14,
                  transition: "background 0.15s ease",
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(14px, 2.5vw, 15.5px)",
                    fontWeight: 750,
                    color: isOpen ? "#2563eb" : "#0f172a",
                    lineHeight: 1.35,
                  }}
                >
                  {item.question}
                </span>
                <ChevronDown
                  size={18}
                  style={{
                    color: isOpen ? "#2563eb" : "#94a3b8",
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                    flexShrink: 0,
                  }}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div
                      style={{
                        padding: "12px 18px 16px",
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        color: "#475569",
                        borderTop: "1px solid #f1f5f9",
                        background: "#ffffff",
                      }}
                    >
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
