import React, { useState } from "react";
import {
  Clock,
  Calendar as CalendarIcon,
  Percent,
  MapPin,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Calculator,
  WifiOff,
  Zap,
} from "lucide-react";

const DEMO_CLASSES_TODAY = [
  { time: "09:30 AM - 10:30 AM", code: "CUTM1042", name: "Distributed Systems & Cloud", room: "CS-304", faculty: "Dr. S. K. Mishra", status: "Completed" },
  { time: "10:30 AM - 11:30 AM", code: "CUTM1028", name: "Advanced Data Structures", room: "Lab 2", faculty: "Prof. A. Patnaik", status: "Live Now" },
  { time: "11:30 AM - 12:30 PM", code: "CUTM1105", name: "Machine Learning & AI", room: "CS-201", faculty: "Dr. R. Mohanty", status: "Upcoming" },
  { time: "02:00 PM - 04:00 PM", code: "CUTM1034", name: "Database Engineering Lab", room: "Systems Lab 4", faculty: "Prof. P. Das", status: "Upcoming" },
];

const DEMO_ATTENDANCE_COURSES = [
  { name: "Distributed Systems", code: "CUTM1042", conducted: 28, attended: 25, pct: 89.3, safeBunks: 4, status: "Safe" },
  { name: "Advanced Data Structures", code: "CUTM1028", conducted: 30, attended: 24, pct: 80.0, safeBunks: 2, status: "Safe" },
  { name: "Machine Learning & AI", code: "CUTM1105", conducted: 26, attended: 19, pct: 73.1, safeBunks: 0, recoverNeeded: 2, status: "Critical" },
  { name: "Database Engineering", code: "CUTM1034", conducted: 24, attended: 22, pct: 91.7, safeBunks: 5, status: "Safe" },
];

export default function TimetableAttendanceSection({ onOpenTimetable, onOpenAttendance }) {
  const [activeTab, setActiveTab] = useState("timetable"); // "timetable" | "attendance" | "calendar"
  const [selectedSection, setSelectedSection] = useState("CSE-A");

  // Dynamic Bunk Calculator Mini-State
  const [calcConducted, setCalcConducted] = useState(32);
  const [calcAttended, setCalcAttended] = useState(26);
  const currentPct = calcConducted > 0 ? (calcAttended / calcConducted) * 100 : 0;
  
  // Safe bunk calculation: floor((attended - 0.75 * conducted) / 0.75)
  const safeBunksCount = Math.max(0, Math.floor((calcAttended - 0.75 * calcConducted) / 0.75));
  // Recovery classes needed if below 75%: ceil((0.75 * conducted - attended) / 0.25)
  const recoveryClassesNeeded = currentPct < 75 ? Math.ceil((0.75 * calcConducted - calcAttended) / 0.25) : 0;

  return (
    <section
      id="timetable-attendance"
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
      <div className="gf-section-header" style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "#0284c7",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          <Clock size={15} strokeWidth={2.4} />
          <span>Operational Continuity &bull; ERP Fallback</span>
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
          Never miss a class or attendance criteria
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
          GradeFlow preserves your daily period timetable, room numbers, and 75% attendance criteria so you always know where to be, even when the university ERP server is slow or offline.
        </p>
      </div>

      {/* Split Interactive Workbench */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 1.2fr",
          gap: 28,
          alignItems: "start",
          width: "100%",
          boxSizing: "border-box",
        }}
        className="gf-editorial-split"
      >
        {/* Left Column: Feature Highlights & Tab Switcher */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", minWidth: 0 }}>
          {/* ERP Independence Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "16px 18px",
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: 12,
              marginBottom: 20,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0284c7", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
              <Zap size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 750, color: "#0369a1" }}>
                Zero ERP Downtime Dependency
              </div>
              <div style={{ fontSize: 12, color: "#0284c7", marginTop: 2, lineHeight: 1.5 }}>
                Access period timings, faculty rooms, and attendance calculations even when university portals are undergoing server maintenance.
              </div>
            </div>
          </div>

          {/* Interactive Feature Switcher */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, width: "100%" }}>
            <div
              onClick={() => setActiveTab("timetable")}
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid",
                borderColor: activeTab === "timetable" ? "#0284c7" : "#e2e8f0",
                background: activeTab === "timetable" ? "#ffffff" : "#f8fafc",
                cursor: "pointer",
                boxShadow: activeTab === "timetable" ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                transition: "all 0.15s ease",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <Clock size={17} color="#0284c7" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: activeTab === "timetable" ? 750 : 600, color: "#0f172a" }}>
                    Live Period Schedule &amp; Classrooms
                  </span>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0284c7", background: "#f0f9ff", padding: "2px 7px", borderRadius: 4, flexShrink: 0 }}>
                  Real-time
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 0 25px", lineHeight: 1.45 }}>
                Instant view of today's classes, room allocations, subject codes, and live ongoing periods.
              </p>
            </div>

            <div
              onClick={() => setActiveTab("attendance")}
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid",
                borderColor: activeTab === "attendance" ? "#059669" : "#e2e8f0",
                background: activeTab === "attendance" ? "#ffffff" : "#f8fafc",
                cursor: "pointer",
                boxShadow: activeTab === "attendance" ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                transition: "all 0.15s ease",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <Percent size={17} color="#059669" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: activeTab === "attendance" ? 750 : 600, color: "#0f172a" }}>
                    Smart Bunk &amp; 75% Safety Calculator
                  </span>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#059669", background: "#ecfdf5", padding: "2px 7px", borderRadius: 4, flexShrink: 0 }}>
                  75% Rule
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 0 25px", lineHeight: 1.45 }}>
                Calculates how many classes you can safely bunk without falling below 75% or how many consecutive classes needed to recover.
              </p>
            </div>

            <div
              onClick={() => setActiveTab("calendar")}
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid",
                borderColor: activeTab === "calendar" ? "#7c3aed" : "#e2e8f0",
                background: activeTab === "calendar" ? "#ffffff" : "#f8fafc",
                cursor: "pointer",
                boxShadow: activeTab === "calendar" ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                transition: "all 0.15s ease",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <CalendarIcon size={17} color="#7c3aed" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: activeTab === "calendar" ? 750 : 600, color: "#0f172a" }}>
                    Academic Calendar &amp; University Holidays
                  </span>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", padding: "2px 7px", borderRadius: 4, flexShrink: 0 }}>
                  2026–27
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 0 25px", lineHeight: 1.45 }}>
                Full schedule of official semester exams, gazetted holidays, recesses, and academic milestone dates.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Stage Preview */}
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
          {activeTab === "timetable" && (
            <div>
              {/* Timetable Header Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 750, color: "#0f172a" }}>Today's Class Schedule (Monday)</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Section: {selectedSection} &bull; 4 Classes Scheduled</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["CSE-A", "CSE-B", "CSE-C"].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setSelectedSection(sec)}
                      style={{
                        padding: "4px 8px",
                        fontSize: 11,
                        fontWeight: selectedSection === sec ? 750 : 600,
                        borderRadius: 6,
                        border: "1px solid",
                        borderColor: selectedSection === sec ? "#0284c7" : "#e2e8f0",
                        background: selectedSection === sec ? "#f0f9ff" : "#ffffff",
                        color: selectedSection === sec ? "#0369a1" : "#64748b",
                        cursor: "pointer",
                      }}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Schedule Timeline List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DEMO_CLASSES_TODAY.map((cls, i) => {
                  const isLive = cls.status === "Live Now";
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: isLive ? "#eff6ff" : "#f8fafc",
                        border: "1px solid",
                        borderColor: isLive ? "#bfdbfe" : "#f1f5f9",
                        minWidth: 0,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{cls.name}</span>
                          <span style={{ fontSize: 10, color: "#64748b", background: "#ffffff", padding: "1px 5px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                            {cls.room}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {cls.time} &bull; {cls.faculty}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 4,
                          color: isLive ? "#1d4ed8" : cls.status === "Completed" ? "#64748b" : "#059669",
                          background: isLive ? "#dbeafe" : cls.status === "Completed" ? "#f1f5f9" : "#ecfdf5",
                          flexShrink: 0,
                        }}
                      >
                        {cls.status}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                <button
                  onClick={onOpenTimetable}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    justifyContent: "center",
                    padding: "11px 16px",
                    borderRadius: 8,
                    background: "#0284c7",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                >
                  <span>Check Your Real Timetable on GradeFlow</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div>
              {/* Interactive Bunk Margin Simulator */}
              <div style={{ fontSize: 13.5, fontWeight: 750, color: "#0f172a", marginBottom: 10 }}>
                Live 75% Attendance &amp; Safe Bunk Calculator
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: 10, border: "1px solid #f1f5f9", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, fontSize: 12.5, fontWeight: 650, color: "#334155", marginBottom: 6 }}>
                  <span>Attended Classes: {calcAttended} of {calcConducted} Total</span>
                  <span style={{ color: currentPct >= 75 ? "#059669" : "#dc2626", fontFamily: "'Space Mono', monospace", fontWeight: 800 }}>
                    {currentPct.toFixed(1)}%
                  </span>
                </div>

                <input
                  type="range"
                  min="10"
                  max={calcConducted}
                  value={calcAttended}
                  onChange={(e) => setCalcAttended(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: currentPct >= 75 ? "#059669" : "#dc2626", height: 6, marginBottom: 10 }}
                />

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: currentPct >= 75 ? "#ecfdf5" : "#fef2f2",
                    border: "1px solid",
                    borderColor: currentPct >= 75 ? "#a7f3d0" : "#fecaca",
                    fontSize: 12,
                    color: currentPct >= 75 ? "#065f46" : "#991b1b",
                    fontWeight: 650,
                    lineHeight: 1.45,
                  }}
                >
                  {currentPct >= 75
                    ? `Safe Zone: You can safely bunk ${safeBunksCount} upcoming classes and still stay above 75%.`
                    : `Shortage Alert: You must attend ${recoveryClassesNeeded} consecutive classes to recover to 75%.`}
                </div>
              </div>

              {/* Subject Attendance Breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {DEMO_ATTENDANCE_COURSES.map((sub, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, padding: "8px 10px", background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 6, fontSize: 11.5, minWidth: 0 }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 650, color: "#0f172a" }}>{sub.name}</span>
                      <span style={{ fontSize: 10, color: "#64748b", marginLeft: 6 }}>({sub.attended}/{sub.conducted})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: sub.status === "Safe" ? "#059669" : "#dc2626" }}>
                        {sub.status === "Safe" ? `${sub.safeBunks} Safe` : `Need ${sub.recoverNeeded}`}
                      </span>
                      <span style={{ fontWeight: 800, color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>
                        {sub.pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                <button
                  onClick={onOpenAttendance}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    justifyContent: "center",
                    padding: "11px 16px",
                    borderRadius: 8,
                    background: "#059669",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                >
                  <span>Check Your Real Attendance &amp; Safe Bunks</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {activeTab === "calendar" && (
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 750, color: "#0f172a", marginBottom: 10 }}>
                Academic Calendar &amp; Holidays (2026–2027)
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { date: "March 8, 2026", name: "Maha Shivratri", type: "Gazetted Holiday", status: "Off" },
                  { date: "March 25, 2026", name: "Holi Festival", type: "Gazetted Holiday", status: "Off" },
                  { date: "April 15–25, 2026", name: "Mid-Semester Examinations", type: "Exam Window", status: "Exam" },
                  { date: "June 1–20, 2026", name: "End-Semester Finals", type: "Final Exam", status: "Exam" },
                  { date: "June 21 - July 15, 2026", name: "Summer Internship & Recess", type: "Academic Break", status: "Recess" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9", minWidth: 0 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{item.name}</div>
                      <div style={{ fontSize: 10.5, color: "#64748b" }}>{item.date} &bull; {item.type}</div>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: item.status === "Off" ? "#fef3c7" : item.status === "Exam" ? "#fee2e2" : "#eff6ff", color: item.status === "Off" ? "#b45309" : item.status === "Exam" ? "#991b1b" : "#1d4ed8", flexShrink: 0 }}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
