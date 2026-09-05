import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sliders,
  CalendarCheck,
  Flame,
  Compass,
  ChevronUp,
  ChevronRight,
  X,
  CheckCircle2,
  BookOpen,
  Target,
  Sparkles,
  Layers,
} from "lucide-react";

export const STUDIO_SECTIONS = [
  {
    id: "simulator",
    num: "01",
    title: "Calculator & What-If",
    shortTitle: "1. Simulator",
    subtitle: "ERP counts & instant what-if impact",
    badge: "Instant",
    icon: Sliders,
    color: "#2563eb",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    activeGradient: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
  },
  {
    id: "schedule",
    num: "02",
    title: "Complete Schedule",
    shortTitle: "2. Schedule",
    subtitle: "Date-wise timetable classes to target",
    badge: "Date-Wise",
    icon: CalendarCheck,
    color: "#059669",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    activeGradient: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
  },
  {
    id: "penalty",
    num: "03",
    title: "Miss Penalty",
    shortTitle: "3. Miss Penalty",
    subtitle: "Absence cost & recovery streak",
    badge: "Recovery Cost",
    icon: Flame,
    color: "#ea580c",
    bgColor: "#fff7ed",
    borderColor: "#fed7aa",
    activeGradient: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
  },
  {
    id: "roadmap",
    num: "04",
    title: "Attendance Roadmap",
    shortTitle: "4. Roadmap",
    subtitle: "3-Phase sprint & leave strategy",
    badge: "3-Phase Plan",
    icon: Compass,
    color: "#7c3aed",
    bgColor: "#faf5ff",
    borderColor: "#ddd6fe",
    activeGradient: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
  },
];

export default function PredictorStudioNav({
  activeSection = "simulator",
  onSelectSection = () => {},
  isMobile = false,
  activeSubjectName = "",
  currentPercentage = 0,
  targetGoal = 75,
  setTargetGoal = () => {},
}) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Close bottom sheet on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isBottomSheetOpen) {
        setIsBottomSheetOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBottomSheetOpen]);

  // Prevent background scroll when bottom sheet is open on mobile
  useEffect(() => {
    if (isMobile && isBottomSheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isBottomSheetOpen]);

  const activeSectionObj =
    STUDIO_SECTIONS.find((s) => s.id === activeSection) || STUDIO_SECTIONS[0];
  const ActiveIcon = activeSectionObj.icon;

  const handleItemClick = (sectionId) => {
    onSelectSection(sectionId);
    if (isBottomSheetOpen) {
      setIsBottomSheetOpen(false);
    }
  };

  // ── 1. MOBILE EXPERIENCE: TOP SEGMENTED BAR + FLOATING TRIGGER + BOTTOM SHEET ──
  if (isMobile) {
    return (
      <>
        {/* Mobile Top Horizontal Segmented Quick Pills */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 4,
            background: "#f1f5f9",
            padding: 4,
            borderRadius: 12,
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid #e2e8f0",
          }}
        >
          {STUDIO_SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => handleItemClick(sec.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  padding: "7px 2px",
                  borderRadius: 8,
                  fontSize: 10.5,
                  fontWeight: isActive ? 900 : 700,
                  background: isActive ? "#ffffff" : "transparent",
                  color: isActive ? sec.color : "#64748b",
                  border: isActive ? `1px solid ${sec.borderColor}` : "1px solid transparent",
                  boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
              >
                <Icon size={14} color={isActive ? sec.color : "#64748b"} />
                <span>{sec.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Floating / Docked Bottom Action Trigger Pill */}
        <aside
          aria-label="Predictor Studio Navigation Bar"
          style={{
            position: "fixed",
            bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            left: 14,
            right: 14,
            zIndex: 900,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <button
            type="button"
            onClick={() => setIsBottomSheetOpen(true)}
            style={{
              pointerEvents: "auto",
              width: "100%",
              maxWidth: 420,
              background: "#0f172a",
              color: "#ffffff",
              border: "1.5px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 16,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              boxShadow: "0 10px 25px -3px rgba(15, 23, 42, 0.45), 0 4px 10px rgba(0, 0, 0, 0.2)",
              cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: activeSectionObj.color,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                }}
              >
                <ActiveIcon size={16} />
              </div>
              <div style={{ textAlign: "left", minWidth: 0 }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Studio Section {activeSectionObj.num} of 04
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {activeSectionObj.title}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(255, 255, 255, 0.12)",
                padding: "6px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                color: "#e2e8f0",
                flexShrink: 0,
              }}
            >
              <span>Switch</span>
              <ChevronUp size={14} />
            </div>
          </button>
        </aside>

        {/* Mobile Sliding Bottom Sheet Modal */}
        <AnimatePresence>
          {isBottomSheetOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsBottomSheetOpen(false)}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.55)",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                }}
              />

              {/* Bottom Sheet Card */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                style={{
                  position: "relative",
                  background: "#ffffff",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: "12px 18px 28px 18px",
                  boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.25)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  maxHeight: "85vh",
                  overflowY: "auto",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {/* Drag Pill Handle */}
                <div
                  style={{
                    alignSelf: "center",
                    width: 42,
                    height: 4.5,
                    borderRadius: 999,
                    background: "#cbd5e1",
                    marginBottom: 4,
                  }}
                />

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: "#eff6ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#2563eb",
                        }}
                      >
                        <Layers size={13} />
                      </div>
                      <h4 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                        Predictor Studio Sections
                      </h4>
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                      Choose a tool to simulate, inspect routine, or plan recovery:
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBottomSheetOpen(false)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      background: "#f1f5f9",
                      border: "none",
                      color: "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* 4 Section Route Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {STUDIO_SECTIONS.map((sec) => {
                    const isActive = activeSection === sec.id;
                    const Icon = sec.icon;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => handleItemClick(sec.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "12px 14px",
                          borderRadius: 14,
                          background: isActive ? sec.activeGradient : "#f8fafc",
                          border: isActive ? `1.5px solid ${sec.color}` : "1.5px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                          boxSizing: "border-box",
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: isActive ? sec.color : "#ffffff",
                            color: isActive ? "#ffffff" : sec.color,
                            border: isActive ? "none" : `1px solid ${sec.borderColor}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.15)" : "0 1px 2px rgba(0,0,0,0.04)",
                          }}
                        >
                          <Icon size={18} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 900,
                                background: isActive ? sec.color : "#e2e8f0",
                                color: isActive ? "#ffffff" : "#475569",
                                padding: "1px 5px",
                                borderRadius: 4,
                              }}
                            >
                              {sec.num}
                            </span>
                            <span
                              style={{
                                fontSize: 13.5,
                                fontWeight: 900,
                                color: isActive ? "#0f172a" : "#1e293b",
                              }}
                            >
                              {sec.title}
                            </span>
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 800,
                                background: sec.bgColor,
                                color: sec.color,
                                border: `1px solid ${sec.borderColor}`,
                                padding: "1px 6px",
                                borderRadius: 4,
                                marginLeft: "auto",
                              }}
                            >
                              {sec.badge}
                            </span>
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.35 }}>
                            {sec.subtitle}
                          </div>
                        </div>

                        {isActive ? (
                          <CheckCircle2 size={18} color={sec.color} style={{ flexShrink: 0 }} />
                        ) : (
                          <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── 2. DESKTOP EXPERIENCE: SLEEK STICKY ROUTING SIDEBAR ──
  return (
    <aside
      aria-label="Predictor Studio Navigation Sidebar"
      style={{
        width: 260,
        minWidth: 260,
        maxWidth: 270,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: "16px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        position: "sticky",
        top: 24,
        alignSelf: "flex-start",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      {/* Studio Navigator Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: "#2563eb",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              padding: "2px 7px",
              borderRadius: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            STUDIO NAVIGATOR
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>
            4 Modules
          </span>
        </div>

        <h3 style={{ fontSize: 15.5, fontWeight: 900, color: "#0f172a", margin: "4px 0 0 0" }}>
          Predictor Studio
        </h3>

        {activeSubjectName && (
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: "#475569",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: "4px 8px",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <BookOpen size={12} color="#059669" style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{activeSubjectName}</span>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "#f1f5f9" }} />

      {/* 4 Interactive Route Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            paddingLeft: 4,
            marginBottom: 2,
          }}
        >
          SECTIONS
        </div>

        {STUDIO_SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleItemClick(sec.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 10,
                border: isActive ? `1.5px solid ${sec.borderColor}` : "1.5px solid transparent",
                borderLeft: isActive ? `3.5px solid ${sec.color}` : "1.5px solid transparent",
                background: isActive ? sec.activeGradient : "#ffffff",
                color: isActive ? "#0f172a" : "#475569",
                cursor: "pointer",
                transition: "all 0.15s ease",
                textAlign: "left",
                boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.04)" : "none",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "#ffffff";
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: isActive ? sec.color : "#f1f5f9",
                  color: isActive ? "#ffffff" : "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: isActive ? "0 2px 5px rgba(0,0,0,0.15)" : "none",
                }}
              >
                <Icon size={15} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: isActive ? 900 : 700,
                      color: isActive ? "#0f172a" : "#334155",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {sec.title}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "#64748b",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.3,
                  }}
                >
                  {sec.subtitle}
                </div>
              </div>

              {isActive && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: sec.color,
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ height: 1, background: "#f1f5f9" }} />

      {/* Sidebar Footer: Target Goal Milestone Quick Switcher */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10.5, fontWeight: 900, color: "#334155", display: "flex", alignItems: "center", gap: 4 }}>
            <Target size={12} color="#2563eb" />
            TARGET GOAL
          </span>
          <span style={{ fontSize: 11, fontWeight: 900, color: "#2563eb" }}>{targetGoal}%</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
          {[75, 80, 85, 90].map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => setTargetGoal(goal)}
              style={{
                padding: "4px 0",
                borderRadius: 6,
                border: targetGoal === goal ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                background: targetGoal === goal ? "#2563eb" : "#ffffff",
                color: targetGoal === goal ? "#ffffff" : "#475569",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {goal}%
            </button>
          ))}
        </div>

        {/* Current Score Pill */}
        {currentPercentage > 0 && (
          <div
            style={{
              padding: "7px 10px",
              borderRadius: 8,
              background: Number(currentPercentage) >= 75 ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${Number(currentPercentage) >= 75 ? "#bbf7d0" : "#fca5a5"}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 2,
            }}
          >
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#475569" }}>Current Score</span>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 900,
                color: Number(currentPercentage) >= 75 ? "#16a34a" : "#dc2626",
              }}
            >
              {currentPercentage}%
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
