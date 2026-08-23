import React from "react";
import {
  BarChart2,
  Target,
  Briefcase,
  Layers,
  Clock,
  Percent,
} from "lucide-react";

const CAPABILITIES = [
  { label: "Academic Analytics", icon: <BarChart2 size={14} color="#2563eb" /> },
  { label: "Target Predictor", icon: <Target size={14} color="#d97706" /> },
  { label: "50+ Company Placements", icon: <Briefcase size={14} color="#059669" /> },
  { label: "160-Credit Framework", icon: <Layers size={14} color="#7c3aed" /> },
  { label: "Class Timetables", icon: <Clock size={14} color="#0284c7" /> },
  { label: "75% Attendance Tracker", icon: <Percent size={14} color="#059669" /> },
];

export default function CapabilityStrip() {
  return (
    <section
      className="gf-capability-strip"
      style={{
        padding: "16px 0",
        margin: "24px 0 36px",
        borderTop: "1px solid #f1f5f9",
        borderBottom: "1px solid #f1f5f9",
        background: "#ffffff",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
          gap: "10px 22px",
          minWidth: "max-content",
        }}
      >
        {CAPABILITIES.map((cap, idx) => (
          <React.Fragment key={idx}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: 12.5,
                fontWeight: 650,
                color: "#334155",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cap.icon}
              </span>
              <span>{cap.label}</span>
            </div>
            {idx < CAPABILITIES.length - 1 && (
              <span
                aria-hidden="true"
                style={{
                  color: "#cbd5e1",
                  fontSize: 12,
                  userSelect: "none",
                  flexShrink: 0,
                }}
              >
                &bull;
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
