import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calendar as CalendarIcon,
  MapPin,
  User,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sun,
  Coffee,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Calendar,
  Grid,
  List,
  Layers,
  Award,
  Filter,
  Info,
  ExternalLink,
} from "lucide-react";
import {
  ALL_SECTIONS,
  DAYS_LIST,
  TIME_SLOTS,
  ACADEMIC_HOLIDAYS_2026_27,
  getDayName,
  getDaySchedule,
  getHolidayInfo,
  getLivePeriodStatus,
  normalizeSection,
  formatDateKey,
  isSecondSaturday,
  isSunday,
} from "../utils/timetableHelper";
import timetableData from "../data/timetableData.json";

export default function TimetableScheduleView({
  studentSection = "CSE-A",
  regNo = "",
  isMobile = false,
}) {
  // Navigation & View State
  const [selectedSection, setSelectedSection] = useState(
    () => normalizeSection(studentSection, regNo)
  );
  const [viewMode, setViewMode] = useState("day"); // "day" | "week" | "holidays"
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [filterHolidayType, setFilterHolidayType] = useState("all"); // "all" | "holiday" | "observation" | "optional"

  // Sync student section
  useEffect(() => {
    if (studentSection) {
      setSelectedSection(normalizeSection(studentSection, regNo));
    }
  }, [studentSection, regNo]);

  // Keep live time updated
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const selectedDayName = useMemo(() => getDayName(selectedDate), [selectedDate]);
  const holidayInfo = useMemo(() => getHolidayInfo(selectedDate), [selectedDate]);

  // Day schedule for selected section & selected day
  const daySchedule = useMemo(() => {
    return getDaySchedule(selectedSection, selectedDayName);
  }, [selectedSection, selectedDayName]);

  // Handle switching date by day offset
  function changeDateByOffset(offset) {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset);
      return next;
    });
  }

  // Jump to specific weekday in current week
  function jumpToDay(dayName) {
    const dayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(dayName);
    setSelectedDate((prev) => {
      const d = new Date(prev);
      const currentDay = d.getDay();
      const diff = dayIndex - currentDay;
      d.setDate(d.getDate() + diff);
      return d;
    });
  }

  // Holiday list with days-left countdown
  const enrichedHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return ACADEMIC_HOLIDAYS_2026_27.map((h) => {
      const hDate = new Date(h.date);
      hDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((hDate - today) / (1000 * 60 * 60 * 24));

      return {
        ...h,
        diffDays,
        isPast: diffDays < 0,
        isToday: diffDays === 0,
        formattedDisplayDate: hDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };
    }).filter((h) => {
      if (filterHolidayType === "all") return true;
      return h.type === filterHolidayType;
    });
  }, [filterHolidayType]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── Top Header Controls Strip ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 16,
          padding: isMobile ? "14px 14px" : "18px 22px",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04), 0 4px 14px rgba(15, 23, 42, 0.03)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Left: Title & Section Select */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Clock size={20} />
          </div>

          <div>
            <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Class Schedule & Timetable
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
              Official CUTM 7th Semester Routine · <strong>{selectedSection}</strong>
            </p>
          </div>

          {/* Section Selector Dropdown */}
          <div style={{ marginLeft: isMobile ? 0 : 8 }}>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{
                padding: "7px 12px",
                borderRadius: 9,
                border: "1.5px solid #2563eb",
                background: "#eff6ff",
                color: "#1d4ed8",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {ALL_SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: View Mode Toggle Tabs */}
        <div
          style={{
            display: "inline-flex",
            background: "#f1f5f9",
            padding: 3,
            borderRadius: 10,
            gap: 2,
            border: "1px solid #e2e8f0",
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("day")}
            style={{
              padding: isMobile ? "6px 10px" : "6px 14px",
              borderRadius: 8,
              border: "none",
              background: viewMode === "day" ? "#ffffff" : "transparent",
              color: viewMode === "day" ? "#2563eb" : "#64748b",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              boxShadow: viewMode === "day" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Clock size={13} />
            <span>Daily View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("week")}
            style={{
              padding: isMobile ? "6px 10px" : "6px 14px",
              borderRadius: 8,
              border: "none",
              background: viewMode === "week" ? "#ffffff" : "transparent",
              color: viewMode === "week" ? "#2563eb" : "#64748b",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              boxShadow: viewMode === "week" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Grid size={13} />
            <span>Weekly Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("holidays")}
            style={{
              padding: isMobile ? "6px 10px" : "6px 14px",
              borderRadius: 8,
              border: "none",
              background: viewMode === "holidays" ? "#ffffff" : "transparent",
              color: viewMode === "holidays" ? "#dc2626" : "#64748b",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              boxShadow: viewMode === "holidays" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Sun size={13} />
            <span>Holidays</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          VIEW MODE 1: DAILY INTERACTIVE SCHEDULE
      ═══════════════════════════════════════════════════════════════ */}
      {viewMode === "day" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Day / Date Navigation Bar */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 14,
              padding: isMobile ? "10px 12px" : "12px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {/* Quick Date Stepper (< Today >) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => changeDateByOffset(-1)}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Previous Day"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(new Date())}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => changeDateByOffset(1)}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Next Day"
              >
                <ChevronRight size={16} />
              </button>

              <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", marginLeft: 4 }}>
                {selectedDate.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Weekday Quick Jump Pills */}
            <div style={{ display: "flex", gap: 4, overflowX: "auto", maxWidth: "100%", paddingBottom: isMobile ? 4 : 0 }}>
              {DAYS_LIST.map((day) => {
                const isSelected = selectedDayName === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => jumpToDay(day)}
                    style={{
                      padding: isMobile ? "4px 8px" : "5px 12px",
                      borderRadius: 8,
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      border: isSelected ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                      background: isSelected ? "#eff6ff" : "#ffffff",
                      color: isSelected ? "#2563eb" : "#64748b",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {day.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Holiday or Weekend Banner */}
          {holidayInfo?.isHoliday ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: holidayInfo.bg || "#fef2f2",
                border: `1.5px solid ${holidayInfo.color || "#dc2626"}30`,
                borderRadius: 16,
                padding: "36px 20px",
                textAlign: "center",
                color: holidayInfo.color || "#dc2626",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>
                {holidayInfo.title}
              </h3>
              <p style={{ fontSize: 13.5, opacity: 0.9, margin: "6px auto 0 auto", maxWidth: 460 }}>
                {holidayInfo.description}
              </p>
              <div
                style={{
                  display: "inline-block",
                  marginTop: 14,
                  background: "#ffffff",
                  border: `1px solid ${holidayInfo.color}40`,
                  padding: "4px 14px",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 800,
                }}
              >
                No classes scheduled for {selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </motion.div>
          ) : (
            /* Day Periods List */
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {daySchedule.map((period, idx) => {
                const slot = TIME_SLOTS[idx] || {};
                const isToday = formatDateKey(selectedDate) === formatDateKey(currentTime);
                const liveStatus = isToday ? getLivePeriodStatus(idx, currentTime) : "REGULAR";
                const isLiveNow = liveStatus === "LIVE_NOW" && !period.isFree;

                // Color accent based on subject type
                const isLab = period.type === "PR";
                const isTut = period.type === "TUT";
                const isProj = period.type === "PP" || period.type === "Project";

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    style={{
                      background: isLiveNow
                        ? "#f0fdf4"
                        : period.isFree
                        ? "#f8fafc"
                        : "#ffffff",
                      border: isLiveNow
                        ? "2px solid #16a34a"
                        : "1px solid #cbd5e1",
                      borderRadius: 14,
                      padding: isMobile ? "12px 14px" : "14px 18px",
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "160px 1fr auto",
                      gap: isMobile ? 8 : 16,
                      alignItems: "center",
                      boxShadow: isLiveNow
                        ? "0 4px 14px rgba(22, 163, 74, 0.15)"
                        : "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                  >
                    {/* Time Slot Column */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isLiveNow
                            ? "#dcfce7"
                            : slot.isBreak
                            ? "#fef3c7"
                            : "#eff6ff",
                          color: isLiveNow
                            ? "#16a34a"
                            : slot.isBreak
                            ? "#d97706"
                            : "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div style={{ fontSize: 10.5, color: "#64748b" }}>
                          {slot.isBreak ? "Lunch Break" : `Period ${idx + 1}`}
                        </div>
                      </div>
                    </div>

                    {/* Subject & Instructor Details */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: isMobile ? 13 : 14,
                            fontWeight: 800,
                            color: period.isFree ? "#94a3b8" : "#0f172a",
                          }}
                        >
                          {period.subject}
                        </span>

                        {period.type && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 900,
                              background: isLab ? "#f5f3ff" : isTut ? "#fffbeb" : "#ecfdf5",
                              color: isLab ? "#7c3aed" : isTut ? "#b45309" : "#059669",
                              border: `1px solid ${isLab ? "#ddd6fe" : isTut ? "#fde68a" : "#a7f3d0"}`,
                              padding: "1px 6px",
                              borderRadius: 5,
                            }}
                          >
                            {period.type}
                          </span>
                        )}

                        {isLiveNow && (
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 900,
                              background: "#16a34a",
                              color: "#ffffff",
                              padding: "2px 7px",
                              borderRadius: 999,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            ● LIVE NOW
                          </span>
                        )}
                      </div>

                      {/* Room & Faculty Row */}
                      {!period.isFree && (
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4, flexWrap: "wrap", fontSize: 11.5 }}>
                          {period.room && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#2563eb", fontWeight: 700 }}>
                              <MapPin size={12} />
                              {period.room}
                            </span>
                          )}

                          {period.faculty && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#475569", fontWeight: 600 }}>
                              <User size={12} color="#64748b" />
                              {period.faculty}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Status Badge (Desktop) */}
                    {!isMobile && (
                      <div>
                        {period.isFree ? (
                          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>
                            Free Slot
                          </span>
                        ) : isLiveNow ? (
                          <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 800, background: "#dcfce7", padding: "4px 10px", borderRadius: 8 }}>
                            In Progress
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#475569", fontWeight: 700, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: 8 }}>
                            Scheduled
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          VIEW MODE 2: WEEKLY TIMETABLE MATRIX (Full 6 Days Grid)
      ═══════════════════════════════════════════════════════════════ */}
      {viewMode === "week" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Full Weekly Routine Matrix ({selectedSection})
            </h4>
            <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
              Complete instructional timetable from Monday to Saturday for all 8 time periods.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 14px", width: 100, fontWeight: 800, color: "#475569" }}>Day</th>
                  {TIME_SLOTS.map((slot, idx) => (
                    <th key={slot.id} style={{ padding: "12px 10px", minWidth: 140, fontWeight: 800, color: "#475569" }}>
                      <div>{slot.startTime} - {slot.endTime}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Period {idx + 1}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS_LIST.map((day) => {
                  const schedule = getDaySchedule(selectedSection, day);
                  const isCurrentDay = day === getDayName(currentTime);

                  return (
                    <tr
                      key={day}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: isCurrentDay ? "#f0fdf4" : "#ffffff",
                      }}
                    >
                      {/* Day Label */}
                      <td style={{ padding: "12px 14px", fontWeight: 800, color: isCurrentDay ? "#16a34a" : "#0f172a", borderRight: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          {day}
                          {isCurrentDay && <span style={{ fontSize: 9, background: "#16a34a", color: "#ffffff", padding: "1px 5px", borderRadius: 4 }}>TODAY</span>}
                        </div>
                      </td>

                      {/* Periods */}
                      {schedule.map((period, pIdx) => (
                        <td
                          key={pIdx}
                          style={{
                            padding: "10px 10px",
                            verticalAlign: "top",
                            borderRight: "1px solid #f1f5f9",
                            background: period.isFree ? "#fafafa" : "transparent",
                          }}
                        >
                          {period.isFree ? (
                            <span style={{ fontSize: 11, color: "#cbd5e1", fontStyle: "italic" }}>— Free —</span>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 11.5, lineHeight: 1.2 }}>
                                {period.subject}
                              </div>
                              {period.room && (
                                <div style={{ fontSize: 10, color: "#2563eb", fontWeight: 600, marginTop: 3 }}>
                                  📍 {period.room.replace(/CSE-[A-Z]-/, "")}
                                </div>
                              )}
                              {period.faculty && (
                                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                                  👨‍🏫 {period.faculty.split("(")[0].trim()}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          VIEW MODE 3: OFFICIAL ACADEMIC HOLIDAYS LIST (CUTM 2026-27)
      ═══════════════════════════════════════════════════════════════ */}
      {viewMode === "holidays" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Filter Strip */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 14,
              padding: "12px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                CUTM Official Academic Session 2026–27 Holiday Calendar
              </h4>
              <p style={{ fontSize: 11.5, color: "#64748b", margin: "2px 0 0 0" }}>
                Official holidays, observation days, and 2nd Saturday non-instructional days.
              </p>
            </div>

            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {["all", "holiday", "observation", "optional"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterHolidayType(t)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: filterHolidayType === t ? "1.5px solid #dc2626" : "1px solid #e2e8f0",
                    background: filterHolidayType === t ? "#fef2f2" : "#ffffff",
                    color: filterHolidayType === t ? "#dc2626" : "#64748b",
                    textTransform: "capitalize",
                  }}
                >
                  {t === "all" ? "All Occasions" : t}
                </button>
              ))}
            </div>
          </div>

          {/* Holidays Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 12,
            }}
          >
            {enrichedHolidays.map((h, idx) => {
              return (
                <div
                  key={idx}
                  style={{
                    background: "#ffffff",
                    border: h.isToday
                      ? "2px solid #16a34a"
                      : "1px solid #cbd5e1",
                    borderRadius: 14,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                        {h.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          background: h.bg || "#f1f5f9",
                          color: h.color || "#475569",
                          padding: "1px 6px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                        }}
                      >
                        {h.type}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontFamily: "'Space Mono', monospace" }}>
                      📅 {h.formattedDisplayDate} ({h.day})
                    </div>
                  </div>

                  {/* Countdown Badge */}
                  <div>
                    {h.isToday ? (
                      <span style={{ fontSize: 11, fontWeight: 900, background: "#16a34a", color: "#ffffff", padding: "3px 8px", borderRadius: 6 }}>
                        TODAY
                      </span>
                    ) : h.diffDays > 0 ? (
                      <span style={{ fontSize: 11, fontWeight: 800, background: "#eff6ff", color: "#2563eb", padding: "3px 8px", borderRadius: 6 }}>
                        In {h.diffDays} days
                      </span>
                    ) : (
                      <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>
                        Past
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
