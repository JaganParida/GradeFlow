import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calendar,
  Sun,
  Upload,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Layers,
  RefreshCw,
  Plus,
  Edit2,
  Building,
  User,
  MapPin,
  BookOpen,
  Filter,
  Check,
  X,
  FileText,
  Info,
} from "lucide-react";
import { TIME_SLOTS, DAYS_LIST, ALL_SECTIONS } from "../utils/timetableHelper";

const DEFAULT_SLOTS = [
  { index: 0, time: "09:00 - 10:00 AM" },
  { index: 1, time: "10:00 - 11:00 AM" },
  { index: 2, time: "11:15 - 12:15 PM" },
  { index: 3, time: "12:15 - 01:15 PM" },
  { index: 4, time: "02:00 - 03:00 PM" },
  { index: 5, time: "03:00 - 04:00 PM" },
  { index: 6, time: "04:00 - 05:00 PM" },
];

export default function TimetableAdminManager({ authHeaders, API }) {
  const [activeSubTab, setActiveSubTab] = useState("timetable"); // "timetable" | "calendar" | "holidays" | "published"

  // ── Timetable Matrix State ──
  const [batch, setBatch] = useState("2023");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("3");
  const [semester, setSemester] = useState("6");
  const [section, setSection] = useState("CSE-A");
  const [customTitle, setCustomTitle] = useState("");
  const [parsedMatrix, setParsedMatrix] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
  const timetableFileRef = useRef(null);

  // ── Published Schedules ──
  const [publishedList, setPublishedList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [inspectedSchedule, setInspectedSchedule] = useState(null);

  // ── Academic Calendar State ──
  const [calendarYear, setCalendarYear] = useState("2026-27");
  const [semesterType, setSemesterType] = useState("even");
  const [calendarTitle, setCalendarTitle] = useState("Even Semester (Sem 2, 4, 6, 8)");
  const [semestersLabel, setSemestersLabel] = useState("2nd, 4th, 6th, 8th Semester");
  const [calendarActivities, setCalendarActivities] = useState([]);
  const [calendarFileName, setCalendarFileName] = useState("");
  const calendarFileRef = useRef(null);

  // ── Holidays State ──
  const [holidayYear, setHolidayYear] = useState("2026-27");
  const [holidayTitle, setHolidayTitle] = useState("CUTM Academic Session 2026–27 Holidays List");
  const [holidaysList, setHolidaysList] = useState([]);
  const [holidayFileName, setHolidayFileName] = useState("");
  const holidayFileRef = useRef(null);

  useEffect(() => {
    fetchPublishedSchedules();
  }, []);

  async function fetchPublishedSchedules() {
    setIsLoadingList(true);
    try {
      const { data } = await axios.get(`${API}/timetable/admin/schedule/list`, authHeaders);
      if (data.success) {
        setPublishedList(data.schedules || []);
      }
    } catch (e) {
      console.error("Error fetching published schedules:", e);
    } finally {
      setIsLoadingList(false);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // 1. TIMETABLE EXCEL PARSER & TEMPLATE BUILDER
  // ═════════════════════════════════════════════════════════════════

  function handleTimetableFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStatusMsg({ text: "", type: "" });

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const parsed = parseTimetableSheet(rawJson);
        if (parsed) {
          setParsedMatrix(parsed);
          setStatusMsg({
            text: `Successfully parsed timetable from "${file.name}"! Review the preview below before publishing.`,
            type: "success",
          });
        } else {
          setStatusMsg({
            text: "Could not parse timetable structure. Please ensure the days (Monday–Saturday) are in Column A or download our sample template.",
            type: "error",
          });
        }
      } catch (err) {
        console.error("Timetable parse error:", err);
        setStatusMsg({ text: "Error reading spreadsheet file: " + err.message, type: "error" });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function parseTimetableSheet(rows) {
    if (!rows || rows.length < 2) return null;

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const scheduleMap = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };

    // Check if format is Matrix (Day in Col 0, Slots in Col 1..7)
    let isMatrix = false;
    for (const row of rows) {
      if (row && row[0] && days.includes(String(row[0]).trim())) {
        isMatrix = true;
        break;
      }
    }

    if (isMatrix) {
      for (const row of rows) {
        if (!row || !row[0]) continue;
        const dayName = String(row[0]).trim();
        if (!days.includes(dayName)) continue;

        const slots = [];
        for (let i = 1; i <= 7; i++) {
          const cellVal = row[i] ? String(row[i]).trim() : "";
          const slotMeta = DEFAULT_SLOTS[i - 1];

          if (!cellVal || cellVal.toLowerCase() === "free" || cellVal.toLowerCase() === "nil" || cellVal === "-") {
            slots.push({
              slotIndex: i - 1,
              time: slotMeta.time,
              subject: "Free Time / Self Study",
              code: "",
              type: "FREE",
              faculty: "",
              room: "",
              isFree: true,
            });
          } else {
            // Parse cell e.g. "Cloud Computing | CS-204 | Dr. Sujata | TH" OR "Cloud Computing (CUTM1020) Room: 204"
            const parsedCell = parseCellString(cellVal, i - 1, slotMeta.time);
            slots.push(parsedCell);
          }
        }
        scheduleMap[dayName] = slots;
      }
      return scheduleMap;
    }

    // Format 2: Tabular List Format (Day, Slot, Subject, Code, Type, Faculty, Room)
    let hasHeader = false;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length < 3) continue;
      const day = String(row[0]).trim();
      if (days.includes(day)) {
        const slotIdx = parseInt(row[1], 10) || scheduleMap[day].length;
        const subject = String(row[2] || "Free").trim();
        const code = String(row[3] || "").trim();
        const type = String(row[4] || "TH").toUpperCase();
        const faculty = String(row[5] || "").trim();
        const room = String(row[6] || "").trim();
        const isFree = subject.toLowerCase().includes("free") || !subject;

        scheduleMap[day].push({
          slotIndex: slotIdx,
          time: DEFAULT_SLOTS[slotIdx]?.time || `Period ${slotIdx + 1}`,
          subject: isFree ? "Free Time / Self Study" : subject,
          code: isFree ? "" : code,
          type: isFree ? "FREE" : ["PR", "TUT", "TH"].includes(type) ? type : "TH",
          faculty: isFree ? "" : faculty,
          room: isFree ? "" : room,
          isFree,
        });
      }
    }

    return scheduleMap;
  }

  function parseCellString(text, slotIndex, timeSlot) {
    if (text.includes("|")) {
      const parts = text.split("|").map((p) => p.trim());
      const subject = parts[0] || "Lecture";
      const room = parts[1] || "";
      const faculty = parts[2] || "";
      let type = parts[3] ? parts[3].toUpperCase() : "TH";
      if (!["TH", "PR", "TUT", "FREE"].includes(type)) {
        type = subject.toLowerCase().includes("lab") || subject.toLowerCase().includes("practice") ? "PR" : "TH";
      }

      return {
        slotIndex,
        time: timeSlot,
        subject,
        code: "",
        type,
        faculty,
        room,
        isFree: false,
      };
    }

    // Fallback simple title
    const isLab = text.toLowerCase().includes("lab") || text.toLowerCase().includes("practice");
    const isTut = text.toLowerCase().includes("tutorial") || text.toLowerCase().includes("tut");
    return {
      slotIndex,
      time: timeSlot,
      subject: text,
      code: "",
      type: isLab ? "PR" : isTut ? "TUT" : "TH",
      faculty: "",
      room: "",
      isFree: false,
    };
  }

  function downloadTimetableTemplate() {
    const matrixData = [
      [
        "Day",
        "09:00 - 10:00 AM",
        "10:00 - 11:00 AM",
        "11:15 - 12:15 PM",
        "12:15 - 01:15 PM",
        "02:00 - 03:00 PM",
        "03:00 - 04:00 PM",
        "04:00 - 05:00 PM",
      ],
      [
        "Monday",
        "Compiler Design | Room 204 | Dr. Sujata | TH",
        "Computer Networks | Room 204 | Prof. Debasish | TH",
        "Web Technologies | CS Lab 3 | Dr. R. K. Mishra | PR",
        "Web Technologies | CS Lab 3 | Dr. R. K. Mishra | PR",
        "Soft Skills & Aptitude | Room 102 | Ms. Ananya | TUT",
        "FREE",
        "FREE",
      ],
      [
        "Tuesday",
        "Software Engineering | Room 205 | Dr. Smita | TH",
        "Machine Learning | Room 205 | Prof. Priyabrata | TH",
        "FREE",
        "Compiler Design | Room 204 | Dr. Sujata | TH",
        "Cloud Computing Lab | Cloud Lab 2 | Dr. Rajesh | PR",
        "Cloud Computing Lab | Cloud Lab 2 | Dr. Rajesh | PR",
        "FREE",
      ],
      [
        "Wednesday",
        "Machine Learning | Room 205 | Prof. Priyabrata | TH",
        "Software Engineering | Room 205 | Dr. Smita | TH",
        "Computer Networks | Room 204 | Prof. Debasish | TH",
        "Soft Skills & Aptitude | Room 102 | Ms. Ananya | TUT",
        "FREE",
        "FREE",
        "FREE",
      ],
      [
        "Thursday",
        "Computer Networks Lab | Net Lab 1 | Prof. Debasish | PR",
        "Computer Networks Lab | Net Lab 1 | Prof. Debasish | PR",
        "Compiler Design | Room 204 | Dr. Sujata | TH",
        "Software Engineering | Room 205 | Dr. Smita | TH",
        "Web Technologies | Room 204 | Dr. R. K. Mishra | TH",
        "FREE",
        "FREE",
      ],
      [
        "Friday",
        "Machine Learning Lab | AI Lab | Prof. Priyabrata | PR",
        "Machine Learning Lab | AI Lab | Prof. Priyabrata | PR",
        "Web Technologies | Room 204 | Dr. R. K. Mishra | TH",
        "Cloud Computing | Room 204 | Dr. Rajesh | TH",
        "Mini Project Review | Project Lab | Mentor | PR",
        "Mini Project Review | Project Lab | Mentor | PR",
        "FREE",
      ],
      [
        "Saturday",
        "Seminar & Technical Presentation | Aud-1 | Faculty Panel | OTHER",
        "Seminar & Technical Presentation | Aud-1 | Faculty Panel | OTHER",
        "FREE",
        "FREE",
        "FREE",
        "FREE",
        "FREE",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(matrixData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");
    XLSX.writeFile(wb, `GradeFlow_${branch}_${section}_Batch${batch}_Template.xlsx`);
  }

  async function handlePublishTimetable() {
    if (!parsedMatrix) {
      setStatusMsg({ text: "Please upload a timetable spreadsheet first.", type: "error" });
      return;
    }

    setIsPublishing(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const payload = {
        batch,
        branch,
        year,
        semester,
        section,
        title: customTitle || `${branch} Section ${section} (Batch ${batch})`,
        schedule: parsedMatrix,
      };

      const { data } = await axios.post(`${API}/timetable/admin/schedule/save`, payload, authHeaders);
      if (data.success) {
        setStatusMsg({
          text: `Timetable successfully published! Students of ${branch} Sec ${section} (Batch ${batch}) will now see this schedule live.`,
          type: "success",
        });
        fetchPublishedSchedules();
      }
    } catch (e) {
      setStatusMsg({
        text: e.response?.data?.message || "Failed to publish timetable.",
        type: "error",
      });
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleDeleteSchedule(id) {
    if (!window.confirm("Are you sure you want to delete this published timetable?")) return;
    try {
      const { data } = await axios.delete(`${API}/timetable/admin/schedule/${id}`, authHeaders);
      if (data.success) {
        fetchPublishedSchedules();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete schedule.");
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. ACADEMIC CALENDAR UPLOADER & HANDLERS
  // ═════════════════════════════════════════════════════════════════

  function handleCalendarFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCalendarFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        const activities = json.map((row, idx) => ({
          slNo: parseInt(row["Sl No"] || row.slNo || idx + 1, 10),
          name: String(row["Activity Name"] || row.name || row.Activity || "").trim(),
          schedule: String(row["Schedule / Dates"] || row.schedule || row.Dates || "").trim(),
          startDate: String(row["Start Date (YYYY-MM-DD)"] || row.startDate || "").trim(),
          endDate: String(row["End Date (YYYY-MM-DD)"] || row.endDate || "").trim(),
          category: String(row["Category (academic/exam/sports/break)"] || row.category || "academic")
            .toLowerCase()
            .trim(),
          location: String(row.Location || row.location || "").trim(),
        }));

        setCalendarActivities(activities);
        setStatusMsg({
          text: `Loaded ${activities.length} calendar activities from "${file.name}".`,
          type: "success",
        });
      } catch (err) {
        setStatusMsg({ text: "Error parsing calendar file: " + err.message, type: "error" });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function downloadCalendarTemplate() {
    const rows = [
      {
        "Sl No": 1,
        "Activity Name": "Commencement of Classes",
        "Schedule / Dates": "05.01.2026",
        "Start Date (YYYY-MM-DD)": "2026-01-05",
        "End Date (YYYY-MM-DD)": "2026-01-05",
        "Category (academic/exam/sports/break)": "academic",
        Location: "CUTM Campus",
      },
      {
        "Sl No": 2,
        "Activity Name": "Internal Examination - 1",
        "Schedule / Dates": "16.02.2026 - 21.02.2026",
        "Start Date (YYYY-MM-DD)": "2026-02-16",
        "End Date (YYYY-MM-DD)": "2026-02-21",
        "Category (academic/exam/sports/break)": "exam",
        Location: "Exam Halls",
      },
      {
        "Sl No": 3,
        "Activity Name": "Gajajyoti Annual Cultural Fest",
        "Schedule / Dates": "05.03.2026 - 07.03.2026",
        "Start Date (YYYY-MM-DD)": "2026-03-05",
        "End Date (YYYY-MM-DD)": "2026-03-07",
        "Category (academic/exam/sports/break)": "event",
        Location: "Main Auditorium",
      },
      {
        "Sl No": 4,
        "Activity Name": "End Semester Theory Examinations",
        "Schedule / Dates": "11.05.2026 - 23.05.2026",
        "Start Date (YYYY-MM-DD)": "2026-05-11",
        "End Date (YYYY-MM-DD)": "2026-05-23",
        "Category (academic/exam/sports/break)": "exam",
        Location: "Exam Centers",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AcademicCalendar");
    XLSX.writeFile(wb, `GradeFlow_Academic_Calendar_Template.xlsx`);
  }

  async function handlePublishCalendar() {
    if (!calendarActivities.length) {
      setStatusMsg({ text: "Please upload or add calendar activities first.", type: "error" });
      return;
    }

    setIsPublishing(true);
    try {
      const payload = {
        academicYear: calendarYear,
        semesterType,
        title: calendarTitle,
        semestersLabel,
        activities: calendarActivities,
      };

      const { data } = await axios.post(`${API}/timetable/admin/calendar/save`, payload, authHeaders);
      if (data.success) {
        setStatusMsg({ text: "Academic calendar published successfully!", type: "success" });
      }
    } catch (e) {
      setStatusMsg({ text: e.response?.data?.message || "Failed to publish calendar.", type: "error" });
    } finally {
      setIsPublishing(false);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // 3. HOLIDAYS UPLOADER & HANDLERS
  // ═════════════════════════════════════════════════════════════════

  function handleHolidayFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHolidayFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        const list = json.map((row, idx) => {
          const type = String(row["Type (holiday/observation/optional)"] || row.type || "holiday").toLowerCase().trim();
          return {
            slNo: parseInt(row["Sl No"] || row.slNo || idx + 1, 10),
            title: String(row["Holiday Name"] || row.title || row.Name || "").trim(),
            date: String(row["Date (DD.MM.YYYY)"] || row.date || "").trim(),
            day: String(row["Day of Week"] || row.day || "").trim(),
            type: ["holiday", "observation", "optional", "break"].includes(type) ? type : "holiday",
            isOptional: type === "optional" || String(row.isOptional).toLowerCase() === "true",
            isObservation: type === "observation" || String(row.isObservation).toLowerCase() === "true",
            description: String(row.Description || row.description || "").trim(),
          };
        });

        setHolidaysList(list);
        setStatusMsg({ text: `Loaded ${list.length} holidays from "${file.name}".`, type: "success" });
      } catch (err) {
        setStatusMsg({ text: "Error parsing holiday file: " + err.message, type: "error" });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function downloadHolidayTemplate() {
    const rows = [
      {
        "Sl No": 1,
        "Holiday Name": "Makara Sankranti / Pongal",
        "Date (DD.MM.YYYY)": "14.01.2026",
        "Day of Week": "Wednesday",
        "Type (holiday/observation/optional)": "holiday",
        Description: "Official University Holiday",
      },
      {
        "Sl No": 2,
        "Holiday Name": "Republic Day",
        "Date (DD.MM.YYYY)": "26.01.2026",
        "Day of Week": "Monday",
        "Type (holiday/observation/optional)": "observation",
        Description: "Observation Day - Flag Hoisting at 08:30 AM",
      },
      {
        "Sl No": 3,
        "Holiday Name": "Maha Shivaratri",
        "Date (DD.MM.YYYY)": "15.02.2026",
        "Day of Week": "Sunday",
        "Type (holiday/observation/optional)": "holiday",
        Description: "Official University Holiday",
      },
      {
        "Sl No": 4,
        "Holiday Name": "Easter Saturday (Optional Leave)",
        "Date (DD.MM.YYYY)": "04.04.2026",
        "Day of Week": "Saturday",
        "Type (holiday/observation/optional)": "optional",
        Description: "University open, max 2 optional leaves allowed per student/faculty",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AcademicHolidays");
    XLSX.writeFile(wb, `GradeFlow_Academic_Holidays_Template.xlsx`);
  }

  async function handlePublishHolidays() {
    if (!holidaysList.length) {
      setStatusMsg({ text: "Please upload or add holidays first.", type: "error" });
      return;
    }

    setIsPublishing(true);
    try {
      const payload = {
        academicYear: holidayYear,
        title: holidayTitle,
        holidays: holidaysList,
      };

      const { data } = await axios.post(`${API}/timetable/admin/holidays/save`, payload, authHeaders);
      if (data.success) {
        setStatusMsg({ text: "Academic holidays list published successfully!", type: "success" });
      }
    } catch (e) {
      setStatusMsg({ text: e.response?.data?.message || "Failed to publish holidays.", type: "error" });
    } finally {
      setIsPublishing(false);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER UI
  // ═════════════════════════════════════════════════════════════════

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Sub Navigation Tabs ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#ffffff",
          padding: "6px 8px",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab("timetable")}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            background: activeSubTab === "timetable" ? "#0f172a" : "transparent",
            color: activeSubTab === "timetable" ? "#ffffff" : "#475569",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
        >
          <Clock size={15} />
          <span>Class Timetable Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("calendar")}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            background: activeSubTab === "calendar" ? "#0f172a" : "transparent",
            color: activeSubTab === "calendar" ? "#ffffff" : "#475569",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
        >
          <Calendar size={15} />
          <span>Academic Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("holidays")}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            background: activeSubTab === "holidays" ? "#0f172a" : "transparent",
            color: activeSubTab === "holidays" ? "#ffffff" : "#475569",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
        >
          <Sun size={15} />
          <span>Academic Holidays</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab("published");
            fetchPublishedSchedules();
          }}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            background: activeSubTab === "published" ? "#0f172a" : "transparent",
            color: activeSubTab === "published" ? "#ffffff" : "#475569",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
        >
          <Layers size={15} />
          <span>Published Schedules ({publishedList.length})</span>
        </button>
      </div>

      {/* Status Alert Banner */}
      {statusMsg.text && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            background: statusMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${statusMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            color: statusMsg.type === "success" ? "#15803d" : "#b91c1c",
            fontSize: 13.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {statusMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 1: CLASS TIMETABLE MATRIX
      ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === "timetable" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Target Filter Configuration Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "20px 24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={18} color="#2563eb" />
                  Target Batch & Section Routing
                </h3>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
                  Select which cohort will automatically see this timetable in their routine dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={downloadTimetableTemplate}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
              >
                <Download size={14} color="#2563eb" />
                <span>Download Sample Excel Template</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              {/* Batch */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Batch Admission Year
                </label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#0f172a",
                    outline: "none",
                  }}
                >
                  <option value="2023">2023 Batch (Current 6th Sem)</option>
                  <option value="2024">2024 Batch (Current 4th Sem)</option>
                  <option value="2025">2025 Batch (Current 2nd Sem)</option>
                  <option value="2026">2026 Batch</option>
                  <option value="2022">2022 Batch</option>
                  <option value="ALL">All Batches (Global)</option>
                </select>
              </div>

              {/* Branch */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Branch / Department
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#0f172a",
                    outline: "none",
                  }}
                >
                  <option value="CSE">Computer Science & Engg (CSE)</option>
                  <option value="ECE">Electronics & Comm Engg (ECE)</option>
                  <option value="MECH">Mechanical Engineering (MECH)</option>
                  <option value="CIVIL">Civil Engineering (CIVIL)</option>
                  <option value="EEE">Electrical & Electronics (EEE)</option>
                  <option value="BCA">Bachelor of Comp Apps (BCA)</option>
                  <option value="MCA">Master of Comp Apps (MCA)</option>
                  <option value="ALL">All Branches</option>
                </select>
              </div>

              {/* Semester */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#0f172a",
                    outline: "none",
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Class Section
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#0f172a",
                    outline: "none",
                  }}
                >
                  {ALL_SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                  <option value="ALL">All Sections (Shared)</option>
                </select>
              </div>
            </div>

            {/* Custom Title Input */}
            <div style={{ marginTop: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                Custom Timetable Title (Optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={`e.g. ${branch} Sec ${section} Routine (Batch ${batch})`}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "1.5px solid #cbd5e1",
                  fontSize: 13.5,
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            style={{
              background: "#ffffff",
              border: "2px dashed #cbd5e1",
              borderRadius: 16,
              padding: "36px 20px",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onClick={() => timetableFileRef.current?.click()}
          >
            <input
              ref={timetableFileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              style={{ display: "none" }}
              onChange={handleTimetableFileUpload}
            />

            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
              }}
            >
              <Upload size={24} />
            </div>

            <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
              {fileName ? fileName : "Upload Timetable Excel Spreadsheet"}
            </h4>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
              Supports <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong> files with 7 period slots across Monday–Saturday.
            </p>
          </div>

          {/* Interactive Live Matrix Preview */}
          {parsedMatrix && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "20px 24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Parsed Schedule Matrix Preview ({branch} - Sec {section})
                  </h4>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                    Verify the period mapping and room allocations before publishing.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePublishTimetable}
                  disabled={isPublishing}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 12,
                    background: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: isPublishing ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Check size={16} />
                  <span>{isPublishing ? "Publishing Schedule..." : `Publish for ${branch} Sec ${section}`}</span>
                </button>
              </div>

              {/* Matrix Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #cbd5e1" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 800, width: 100 }}>
                        Day
                      </th>
                      {DEFAULT_SLOTS.map((slot) => (
                        <th key={slot.index} style={{ padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 700 }}>
                          <div>P{slot.index + 1}</div>
                          <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 500 }}>{slot.time}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS_LIST.map((day) => {
                      const periods = parsedMatrix[day] || [];
                      return (
                        <tr key={day} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 800, color: "#0f172a" }}>
                            {day}
                          </td>
                          {DEFAULT_SLOTS.map((slot, idx) => {
                            const p = periods[idx] || { isFree: true, subject: "Free" };
                            const isLab = p.type === "PR";
                            const isTut = p.type === "TUT";

                            return (
                              <td key={idx} style={{ padding: "8px 10px", verticalAlign: "top" }}>
                                {p.isFree ? (
                                  <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                                    Free
                                  </span>
                                ) : (
                                  <div
                                    style={{
                                      background: isLab ? "#faf5ff" : isTut ? "#fffbeb" : "#eff6ff",
                                      border: `1px solid ${isLab ? "#e9d5ff" : isTut ? "#fde68a" : "#bfdbfe"}`,
                                      borderRadius: 8,
                                      padding: "6px 8px",
                                      fontSize: 11.5,
                                    }}
                                  >
                                    <div style={{ fontWeight: 800, color: isLab ? "#7c3aed" : isTut ? "#b45309" : "#1d4ed8" }}>
                                      {p.subject}
                                    </div>
                                    {p.room && (
                                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                                        📍 {p.room}
                                      </div>
                                    )}
                                    {p.faculty && (
                                      <div style={{ fontSize: 10, color: "#64748b" }}>
                                        👤 {p.faculty}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 2: ACADEMIC CALENDAR MILESTONES
      ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === "calendar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "20px 24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Calendar size={18} color="#7c3aed" />
                  Academic Calendar Milestones Ingestion
                </h3>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
                  Upload official semester milestones (Registration, Internal Exams, Gajajyoti, End Sem Exams).
                </p>
              </div>

              <button
                type="button"
                onClick={downloadCalendarTemplate}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Download size={14} color="#7c3aed" />
                <span>Download Calendar Template</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Academic Session
                </label>
                <input
                  type="text"
                  value={calendarYear}
                  onChange={(e) => setCalendarYear(e.target.value)}
                  placeholder="e.g. 2026-27"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13.5,
                    color: "#0f172a",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Semester Type
                </label>
                <select
                  value={semesterType}
                  onChange={(e) => setSemesterType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  <option value="even">Even Semester (Sem 2, 4, 6, 8)</option>
                  <option value="odd">Odd Semester (Sem 1, 3, 5, 7)</option>
                  <option value="general">Annual / General University Events</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Applicable Semesters Label
                </label>
                <input
                  type="text"
                  value={semestersLabel}
                  onChange={(e) => setSemestersLabel(e.target.value)}
                  placeholder="e.g. 2nd, 4th, 6th, 8th Semester"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13.5,
                    color: "#0f172a",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            style={{
              background: "#ffffff",
              border: "2px dashed #cbd5e1",
              borderRadius: 16,
              padding: "36px 20px",
              textAlign: "center",
              cursor: "pointer",
            }}
            onClick={() => calendarFileRef.current?.click()}
          >
            <input
              ref={calendarFileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={handleCalendarFileUpload}
            />

            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "#faf5ff",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
              }}
            >
              <Calendar size={24} />
            </div>

            <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
              {calendarFileName ? calendarFileName : "Upload Academic Calendar Spreadsheet"}
            </h4>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
              Columns: <strong>Sl No, Activity Name, Schedule / Dates, Start Date, End Date, Category</strong>
            </p>
          </div>

          {/* Preview & Publish */}
          {calendarActivities.length > 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "20px 24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Parsed Activities Preview ({calendarActivities.length} Milestones)
                </h4>

                <button
                  type="button"
                  onClick={handlePublishCalendar}
                  disabled={isPublishing}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 10,
                    background: "#7c3aed",
                    color: "#ffffff",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isPublishing ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Check size={15} />
                  <span>{isPublishing ? "Publishing..." : "Publish Academic Calendar"}</span>
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #cbd5e1" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left", width: 40 }}>#</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Activity Name</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Schedule</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Dates</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendarActivities.map((act, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 10px", fontWeight: 700 }}>{act.slNo || i + 1}</td>
                        <td style={{ padding: "8px 10px", fontWeight: 800, color: "#0f172a" }}>{act.name}</td>
                        <td style={{ padding: "8px 10px", color: "#64748b" }}>{act.schedule}</td>
                        <td style={{ padding: "8px 10px", color: "#64748b", fontFamily: "'Space Mono', monospace" }}>
                          {act.startDate} {act.endDate ? `→ ${act.endDate}` : ""}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              background: act.category === "exam" ? "#fef2f2" : "#f0fdf4",
                              color: act.category === "exam" ? "#dc2626" : "#16a34a",
                              padding: "2px 8px",
                              borderRadius: 6,
                              textTransform: "uppercase",
                            }}
                          >
                            {act.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 3: ACADEMIC HOLIDAYS & BREAKS
      ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === "holidays" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "20px 24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Sun size={18} color="#dc2626" />
                  Academic Holidays & Observances Ingestion
                </h3>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
                  Upload official university holidays, observation days, optional leave list, and non-instructional Saturdays.
                </p>
              </div>

              <button
                type="button"
                onClick={downloadHolidayTemplate}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Download size={14} color="#dc2626" />
                <span>Download Holidays Template</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Academic Session Year
                </label>
                <input
                  type="text"
                  value={holidayYear}
                  onChange={(e) => setHolidayYear(e.target.value)}
                  placeholder="e.g. 2026-27"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13.5,
                    color: "#0f172a",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Document Title
                </label>
                <input
                  type="text"
                  value={holidayTitle}
                  onChange={(e) => setHolidayTitle(e.target.value)}
                  placeholder="e.g. CUTM Academic Session 2026–27 Holidays List"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13.5,
                    color: "#0f172a",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            style={{
              background: "#ffffff",
              border: "2px dashed #cbd5e1",
              borderRadius: 16,
              padding: "36px 20px",
              textAlign: "center",
              cursor: "pointer",
            }}
            onClick={() => holidayFileRef.current?.click()}
          >
            <input
              ref={holidayFileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={handleHolidayFileUpload}
            />

            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
              }}
            >
              <Sun size={24} />
            </div>

            <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
              {holidayFileName ? holidayFileName : "Upload Academic Holidays Spreadsheet"}
            </h4>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
              Columns: <strong>Sl No, Holiday Name, Date (DD.MM.YYYY), Day of Week, Type</strong>
            </p>
          </div>

          {/* Preview & Publish */}
          {holidaysList.length > 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "20px 24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Parsed Holidays Preview ({holidaysList.length} Items)
                </h4>

                <button
                  type="button"
                  onClick={handlePublishHolidays}
                  disabled={isPublishing}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 10,
                    background: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isPublishing ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Check size={15} />
                  <span>{isPublishing ? "Publishing..." : "Publish Holidays List"}</span>
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #cbd5e1" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left", width: 40 }}>#</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Holiday / Occasion</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Date</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Day</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidaysList.map((h, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 10px", fontWeight: 700 }}>{h.slNo || i + 1}</td>
                        <td style={{ padding: "8px 10px", fontWeight: 800, color: "#0f172a" }}>{h.title}</td>
                        <td style={{ padding: "8px 10px", color: "#64748b", fontFamily: "'Space Mono', monospace" }}>{h.date}</td>
                        <td style={{ padding: "8px 10px", color: "#64748b" }}>{h.day}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              background: h.type === "holiday" ? "#fef2f2" : h.type === "optional" ? "#faf5ff" : "#eff6ff",
                              color: h.type === "holiday" ? "#dc2626" : h.type === "optional" ? "#7c3aed" : "#2563eb",
                              padding: "2px 8px",
                              borderRadius: 6,
                              textTransform: "uppercase",
                            }}
                          >
                            {h.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 4: PUBLISHED SCHEDULES REPOSITORY
      ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === "published" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Live Published Schedules ({publishedList.length})
              </h4>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                Students matching these batches and sections receive their customized routine dynamically.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchPublishedSchedules}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                background: "#f1f5f9",
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                color: "#475569",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingList ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              Loading published schedules...
            </div>
          ) : publishedList.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "50px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#f1f5f9",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px auto",
                }}
              >
                <Clock size={22} />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                No Custom Schedules Published Yet
              </h4>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
                Upload an Excel timetable from the "Class Timetable Matrix" tab to publish custom schedules for any batch or branch.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
              {publishedList.map((sched) => (
                <div
                  key={sched._id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "16px 18px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          background: "#eff6ff",
                          color: "#2563eb",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        BATCH {sched.batch}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          background: "#f0fdf4",
                          color: "#16a34a",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {sched.branch} • SEC {sched.section}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", margin: "8px 0 2px 0" }}>
                      {sched.title || `${sched.branch} Section ${sched.section}`}
                    </h4>
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>
                      Semester {sched.semester} (Year {sched.year}) • Uploaded {new Date(sched.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setInspectedSchedule(sched)}
                      style={{
                        flex: 1,
                        padding: "7px 10px",
                        borderRadius: 8,
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0f172a",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                      }}
                    >
                      <Eye size={13} />
                      <span>Inspect Matrix</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(sched._id)}
                      style={{
                        padding: "7px 10px",
                        borderRadius: 8,
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#dc2626",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inspected Schedule Modal */}
          <AnimatePresence>
            {inspectedSchedule && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setInspectedSchedule(null)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.45)",
                  backdropFilter: "blur(6px)",
                  zIndex: 10000,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                }}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 10 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "#ffffff",
                    borderRadius: 20,
                    padding: "24px",
                    maxWidth: 900,
                    width: "100%",
                    maxHeight: "85vh",
                    overflowY: "auto",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {inspectedSchedule.title}
                      </h3>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        Batch {inspectedSchedule.batch} • {inspectedSchedule.branch} Section {inspectedSchedule.section} • Semester {inspectedSchedule.semester}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectedSchedule(null)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#94a3b8",
                        padding: 4,
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}>
                          <th style={{ padding: "8px 10px", textAlign: "left", width: 80 }}>Day</th>
                          {DEFAULT_SLOTS.map((s) => (
                            <th key={s.index} style={{ padding: "8px 10px", textAlign: "left" }}>
                              <div>P{s.index + 1}</div>
                              <div style={{ fontSize: 9.5, color: "#94a3b8" }}>{s.time}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS_LIST.map((day) => {
                          const periods = inspectedSchedule.schedule?.[day] || [];
                          return (
                            <tr key={day} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 10px", fontWeight: 800, color: "#0f172a" }}>{day}</td>
                              {DEFAULT_SLOTS.map((s, idx) => {
                                const p = periods[idx] || { isFree: true };
                                return (
                                  <td key={idx} style={{ padding: "6px 8px", verticalAlign: "top" }}>
                                    {p.isFree ? (
                                      <span style={{ color: "#cbd5e1" }}>—</span>
                                    ) : (
                                      <div
                                        style={{
                                          background: p.type === "PR" ? "#faf5ff" : "#eff6ff",
                                          border: `1px solid ${p.type === "PR" ? "#e9d5ff" : "#bfdbfe"}`,
                                          borderRadius: 6,
                                          padding: "4px 6px",
                                        }}
                                      >
                                        <div style={{ fontWeight: 800, color: p.type === "PR" ? "#7c3aed" : "#1d4ed8" }}>
                                          {p.subject}
                                        </div>
                                        {p.room && <div style={{ fontSize: 9.5, color: "#64748b" }}>📍 {p.room}</div>}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
