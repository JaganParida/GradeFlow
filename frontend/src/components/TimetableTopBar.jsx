import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calendar,
  MapPin,
  User,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Sun,
  Coffee,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  BookOpen,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import {
  ALL_SECTIONS,
  TIME_SLOTS,
  DAYS_LIST,
  getLiveScheduleOverview,
  normalizeSection,
  getHolidayInfo,
  formatDateKey,
  getDayName,
} from "../utils/timetableHelper";

export default function TimetableTopBar({
  studentSection = "CSE-A",
  regNo = "",
  onOpenFullSchedule,
  isMobile = false,
}) {
  const [selectedSection, setSelectedSection] = useState(
    () => normalizeSection(studentSection, regNo)
  );
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync section if student changes
  useEffect(() => {
    if (studentSection) {
      setSelectedSection(normalizeSection(studentSection, regNo));
    }
  }, [studentSection, regNo]);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute live schedule state
  const liveData = useMemo(() => {
    return getLiveScheduleOverview(selectedSection, currentTime);
  }, [selectedSection, currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [currentTime]);

  const holiday = liveData.holidayInfo;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: 16,
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04), 0 6px 18px rgba(15, 23, 42, 0.03)",
        overflow: "hidden",
        marginBottom: 16,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ── Top Header Strip ── */}
      <div
        style={{
          padding: isMobile ? "12px 14px" : "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          background: holiday?.isHoliday
            ? "linear-gradient(135deg, #fff1f2 0%, #fef2f2 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          borderBottom: isExpanded ? "1px solid #e2e8f0" : "none",
        }}
      >
        {/* Left: Date & Section Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: holiday?.isHoliday ? "#fee2e2" : "#eff6ff",
              color: holiday?.isHoliday ? "#dc2626" : "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {holiday?.isHoliday ? <Sun size={18} /> : <Clock size={18} />}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: isMobile ? 12.5 : 13.5, fontWeight: 800, color: "#0f172a" }}>
                {formattedDate}
              </span>

              {/* Section Selector Pill */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowSectionMenu(!showSectionMenu)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 999,
                    padding: "2px 8px 2px 10px",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#2563eb",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                  title="Switch timetable section"
                >
                  <span>{selectedSection}</span>
                  <ChevronDown size={12} color="#64748b" />
                </button>

                {/* Section Dropdown Menu */}
                {showSectionMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: 4,
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: 10,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                      zIndex: 60,
                      minWidth: 120,
                      maxHeight: 220,
                      overflowY: "auto",
                      padding: 4,
                    }}
                  >
                    {ALL_SECTIONS.map((sec) => (
                      <div
                        key={sec}
                        onClick={() => {
                          setSelectedSection(sec);
                          setShowSectionMenu(false);
                        }}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          background: selectedSection === sec ? "#eff6ff" : "transparent",
                          color: selectedSection === sec ? "#2563eb" : "#334155",
                        }}
                        onMouseEnter={(e) => {
                          if (selectedSection !== sec) e.currentTarget.style.background = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          if (selectedSection !== sec) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {sec}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sub-label */}
            <div style={{ fontSize: isMobile ? 11 : 11.5, color: "#64748b", marginTop: 2 }}>
              {holiday?.isHoliday ? (
                <span style={{ color: "#dc2626", fontWeight: 700 }}>{holiday.title}</span>
              ) : liveData.activeClass ? (
                <span style={{ color: "#059669", fontWeight: 700 }}>
                  🟢 Live Class Now: {liveData.activeClass.subject} ({liveData.activeClass.remainingMins}m remaining)
                </span>
              ) : liveData.nextClass ? (
                <span style={{ color: "#7c3aed", fontWeight: 700 }}>
                  ⏱️ Next Class in {liveData.nextClass.startsInMins}m: {liveData.nextClass.subject}
                </span>
              ) : (
                <span>Today's Schedule & Routine</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: isMobile ? "5px 10px" : "6px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s ease",
            }}
          >
            <span>{isExpanded ? "Hide Slots" : "Today's Periods"}</span>
            <ChevronDown
              size={13}
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </button>

          {onOpenFullSchedule && (
            <button
              type="button"
              onClick={onOpenFullSchedule}
              style={{
                padding: isMobile ? "5px 10px" : "6px 14px",
                borderRadius: 8,
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                boxShadow: "0 1px 4px rgba(37, 99, 235, 0.25)",
              }}
            >
              <span>Full Timetable</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Expandable Today's Timeline & Periods Strip ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            {holiday?.isHoliday ? (
              <div
                style={{
                  padding: "20px 24px",
                  textAlign: "center",
                  background: holiday.bg || "#fef2f2",
                  color: holiday.color || "#dc2626",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>🎉</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{holiday.title}</div>
                <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4 }}>
                  {holiday.description || "No regular instructional classes scheduled today."}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: isMobile ? "12px 10px" : "14px 18px",
                  overflowX: "auto",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "thin",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    minWidth: isMobile ? 850 : "100%",
                  }}
                >
                  {liveData.classesToday.map((period, idx) => {
                    const slot = TIME_SLOTS[idx] || {};
                    const isLive = liveData.activeClass?.slot?.id === slot.id;
                    const isNext = liveData.nextClass?.slot?.id === slot.id;

                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          minWidth: 125,
                          background: isLive
                            ? "#ecfdf5"
                            : isNext
                            ? "#f5f3ff"
                            : period.isFree
                            ? "#f8fafc"
                            : "#ffffff",
                          border: isLive
                            ? "2px solid #10b981"
                            : isNext
                            ? "1.5px solid #8b5cf6"
                            : "1px solid #e2e8f0",
                          borderRadius: 12,
                          padding: "10px 10px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          position: "relative",
                          boxShadow: isLive ? "0 4px 12px rgba(16, 185, 129, 0.15)" : "none",
                        }}
                      >
                        {/* Period Top: Time & Status Tag */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#64748b", fontFamily: "'Space Mono', monospace" }}>
                            {slot.startTime}
                          </span>
                          {isLive && (
                            <span style={{ fontSize: 9, fontWeight: 900, background: "#10b981", color: "#ffffff", padding: "1px 5px", borderRadius: 4 }}>
                              LIVE
                            </span>
                          )}
                          {isNext && (
                            <span style={{ fontSize: 9, fontWeight: 800, background: "#8b5cf6", color: "#ffffff", padding: "1px 5px", borderRadius: 4 }}>
                              NEXT
                            </span>
                          )}
                          {slot.isBreak && (
                            <span style={{ fontSize: 9, fontWeight: 700, background: "#fef3c7", color: "#b45309", padding: "1px 4px", borderRadius: 4 }}>
                              LUNCH
                            </span>
                          )}
                        </div>

                        {/* Subject Name */}
                        <div
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: period.isFree ? "#94a3b8" : "#0f172a",
                            lineHeight: 1.25,
                            minHeight: 30,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                          title={period.subject}
                        >
                          {period.subject}
                        </div>

                        {/* Location / Room */}
                        {period.room && (
                          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, color: "#475569", fontWeight: 600 }}>
                            <MapPin size={10} color="#2563eb" />
                            <span>{period.room.replace(/CSE-[A-Z]-/, "")}</span>
                          </div>
                        )}

                        {/* Faculty */}
                        {period.faculty && (
                          <div
                            style={{
                              fontSize: 10,
                              color: "#64748b",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={period.faculty}
                          >
                            {period.faculty.split("(")[0].trim()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
