import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Copy,
  Save,
  Sliders,
  ChevronDown,
  Sparkles,
  Coffee,
  Utensils,
  Zap,
  List,
  Grid,
} from "lucide-react";
import timetableData from "../data/timetableData.json";
import {
  TIME_SLOTS,
  DAYS_LIST,
  ALL_SECTIONS,
  normalizeSection,
  setCustomSchedulesStore,
  cleanSubjectBaseName,
} from "../utils/timetableHelper";
import {
  parseAcademicCalendarFile,
  parseAcademicHolidaysFile,
  getDayOfWeekFromDate,
} from "../utils/calendarHolidayParser";

// Known CUTM subjects catalog for quick 1-click autocomplete in slot editor
const KNOWN_SUBJECTS = [
  { name: "Cloud Fundamentals (Azure)", code: "CUCS1015", type: "PP", defaultRoom: "CSE-F-AR-317" },
  { name: "Data Structure and Algorithms", code: "CUTM3166", type: "PP", defaultRoom: "CSE-F-AR-317" },
  { name: "Information Security (CISCO)", code: "CUCS1007", type: "PP", defaultRoom: "CSE-F-AR-317" },
  { name: "Network and Protocols for IoT", code: "CUCS1006", type: "PP", defaultRoom: "CSE-F-AR-317" },
  { name: "Theory of Computation and Compiler Design", code: "CUCS1008", type: "PP", defaultRoom: "CSE-F-AR-317" },
  { name: "Prompt Engineering using ChatGPT", code: "CUCS1014", type: "PP", defaultRoom: "CSE-F-AR-317" },
  { name: "Robotic automation with ROS and C++", code: "CUTM1020", type: "PP", defaultRoom: "CSE-F-AR-317" },
  { name: "Minor Project II", code: "CUTM1577", type: "PR", defaultRoom: "LAB-03" },
  { name: "Cloud Fundamentals (Azure) Lab", code: "CUCS1015", type: "PR", defaultRoom: "LAB-01" },
  { name: "Data Structure and Algorithms (PR)", code: "CUTM3166", type: "PR", defaultRoom: "CSE-F-AR-317" },
  { name: "Data Structure and Algorithms (TUT)", code: "CUTM3166", type: "TUT", defaultRoom: "CSE-F-AR-317" },
  { name: "Network and Protocols for IoT (PR)", code: "CUCS1006", type: "PR", defaultRoom: "CSE-F-AR-317" },
  { name: "Network and Protocols for IoT (TUT)", code: "CUCS1006", type: "TUT", defaultRoom: "CSE-F-AR-317" },
  { name: "Information Security (CISCO) (PR)", code: "CUCS1007", type: "PR", defaultRoom: "CSE-F-AR-317" },
  { name: "Information Security (CISCO) (TUT)", code: "CUCS1007", type: "TUT", defaultRoom: "CSE-F-AR-317" },
  { name: "Theory of Computation and Compiler Design (TUT)", code: "CUCS1008", type: "TUT", defaultRoom: "CSE-F-AR-317" },
  { name: "Prompt Engineering using ChatGPT (PR)", code: "CUCS1014", type: "PR", defaultRoom: "CSE-F-AR-317" },
  { name: "Robotic automation with ROS and C++ (PR)", code: "CUTM1020", type: "PR", defaultRoom: "CSE-F-AR-317" },
  { name: "Robotic automation with ROS and C++ (TUT)", code: "CUTM1020", type: "TUT", defaultRoom: "CSE-F-AR-317" },
];

// All 8 standard daily slots matching CUTM routine with Lunch Break at index 3
const DEFAULT_SLOTS = [
  { index: 0, slotName: "P1", time: "09:30 - 10:30 AM", isBreak: false },
  { index: 1, slotName: "P2", time: "10:30 - 11:30 AM", isBreak: false },
  { index: 2, slotName: "P3", time: "11:30 - 12:30 PM", isBreak: false },
  { index: 3, slotName: "LUNCH", time: "12:30 - 01:30 PM", isBreak: true },
  { index: 4, slotName: "P4", time: "01:30 - 02:30 PM", isBreak: false },
  { index: 5, slotName: "P5", time: "02:30 - 03:30 PM", isBreak: false },
  { index: 6, slotName: "P6", time: "03:30 - 04:30 PM", isBreak: false },
  { index: 7, slotName: "P7", time: "04:30 - 05:30 PM", isBreak: false },
];

export default function TimetableAdminManager({ authHeaders, API }) {
  const [activeSubTab, setActiveSubTab] = useState("editor"); // "editor" | "excel_upload" | "calendar" | "holidays" | "published"

  // Responsive device width tracking
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Mobile View Switcher: "matrix" or "day_view"
  const [mobileLayoutMode, setMobileLayoutMode] = useState("day_view");
  const [mobileActiveDay, setMobileActiveDay] = useState("Monday");

  // ── Section-Wise Timetable Interactive Editor State ──
  const [batch, setBatch] = useState("2023");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("3");
  const [semester, setSemester] = useState("6");
  const [section, setSection] = useState("CSE-F");
  const [customTitle, setCustomTitle] = useState("");
  const [currentMatrix, setCurrentMatrix] = useState({});
  const [isMatrixLoading, setIsMatrixLoading] = useState(false);
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLiveCustomPublished, setIsLiveCustomPublished] = useState(false);

  // ── Period Slot Edit Modal ──
  const [slotModal, setSlotModal] = useState({
    isOpen: false,
    day: "Monday",
    slotIndex: 0,
    period: {
      subject: "",
      code: "",
      type: "PP",
      faculty: "",
      room: "",
      timeSlot: "",
      isFree: false,
    },
  });

  // ── Clone Matrix Modal ──
  const [cloneModal, setCloneModal] = useState({
    isOpen: false,
    targetSection: "CSE-B",
    isCloning: false,
  });

  // ── Excel Upload / Parser State ──
  const [parsedMatrix, setParsedMatrix] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
  const timetableFileRef = useRef(null);

  // ── Published Schedules ──
  const [publishedList, setPublishedList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

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

  // ═════════════════════════════════════════════════════════════════
  // INITIAL DATA FETCH & SECTION SCHEDULE SYNC
  // ═════════════════════════════════════════════════════════════════

  useEffect(() => {
    fetchPublishedSchedules();
  }, []);

  useEffect(() => {
    loadSectionTimetable(section, batch, branch);
  }, [section, batch, branch]);

  async function fetchPublishedSchedules() {
    setIsLoadingList(true);
    try {
      const { data } = await axios.get(`${API}/timetable/admin/schedule/list`, authHeaders);
      if (data.success) {
        setPublishedList(data.schedules || []);
        // Update local helper cache
        setCustomSchedulesStore(data.schedules || []);
      }
    } catch (e) {
      console.error("Error fetching published schedules:", e);
    } finally {
      setIsLoadingList(false);
    }
  }

  // Load schedule for specific section (checks MongoDB published schedule first, fallback to JSON)
  async function loadSectionTimetable(sec, bch, brn) {
    setIsMatrixLoading(true);
    setHasUnsavedChanges(false);

    try {
      const { data } = await axios.get(
        `${API}/timetable/schedule?batch=${bch}&branch=${brn}&section=${sec}`,
        authHeaders
      );

      if (data.success && data.found && data.schedule && data.schedule.schedule) {
        const dbSchedule = JSON.parse(JSON.stringify(data.schedule.schedule));
        setCurrentMatrix(normalizeMatrixStructure(dbSchedule));
        setCustomTitle(data.schedule.title || `${brn} Sec ${sec} (Batch ${bch})`);
        setIsLiveCustomPublished(true);
      } else {
        const norm = normalizeSection(sec);
        const jsonTemplate = timetableData[norm] || timetableData["CSE-F"] || {};
        setCurrentMatrix(normalizeMatrixStructure(JSON.parse(JSON.stringify(jsonTemplate))));
        setCustomTitle(`${brn} Sec ${sec} (Batch ${bch})`);
        setIsLiveCustomPublished(false);
      }
    } catch (err) {
      console.warn("Could not fetch schedule from API, falling back to JSON:", err);
      const norm = normalizeSection(sec);
      const jsonTemplate = timetableData[norm] || timetableData["CSE-F"] || {};
      setCurrentMatrix(normalizeMatrixStructure(JSON.parse(JSON.stringify(jsonTemplate))));
      setIsLiveCustomPublished(false);
    } finally {
      setIsMatrixLoading(false);
    }
  }

  // Ensure matrix has all 6 days with exactly 8 slots (including Lunch Break at index 3)
  function normalizeMatrixStructure(rawMatrix) {
    const normalized = {};
    DAYS_LIST.forEach((day) => {
      const periods = Array.isArray(rawMatrix[day]) ? rawMatrix[day] : [];
      const safePeriods = [];

      for (let i = 0; i < 8; i++) {
        const slotMeta = DEFAULT_SLOTS[i] || {};
        const p = periods[i];

        if (slotMeta.isBreak || i === 3) {
          // Lunch Break slot (Index 3: 12:30 - 01:30 PM)
          safePeriods.push({
            slotIndex: 3,
            time: "12:30 - 01:30 PM",
            subject: "Lunch Break / Recess",
            code: "",
            type: "BREAK",
            faculty: "",
            room: "",
            isFree: true,
            isBreak: true,
          });
          continue;
        }

        if (p && p.subject && p.subject !== "No Class / Free" && p.subject !== "Lunch Break / Recess" && !p.isFree && !p.isBreak) {
          safePeriods.push({
            slotIndex: i,
            time: p.time || p.timeSlot || slotMeta.time || "09:30 - 10:30 AM",
            subject: p.subject,
            code: p.code || "",
            type: (p.type || "PP").toUpperCase(),
            faculty: p.faculty || "",
            room: p.room || "",
            isFree: false,
            isBreak: false,
          });
        } else {
          safePeriods.push({
            slotIndex: i,
            time: p?.time || p?.timeSlot || slotMeta.time || "09:30 - 10:30 AM",
            subject: "No Class / Free",
            code: "",
            type: "FREE",
            faculty: "",
            room: "",
            isFree: true,
            isBreak: false,
          });
        }
      }
      normalized[day] = safePeriods;
    });
    return normalized;
  }

  // ═════════════════════════════════════════════════════════════════
  // SECTION TIMETABLE EDITING HANDLERS
  // ═════════════════════════════════════════════════════════════════

  function openEditSlotModal(day, slotIndex) {
    if (slotIndex === 3) return; // Lunch break is fixed

    const period = currentMatrix[day]?.[slotIndex] || {
      subject: "",
      code: "",
      type: "PP",
      faculty: "",
      room: "",
      timeSlot: "",
      isFree: true,
    };

    setSlotModal({
      isOpen: true,
      day,
      slotIndex,
      period: {
        subject: period.isFree ? "" : period.subject,
        code: period.code || "",
        type: period.type === "FREE" ? "PP" : period.type || "PP",
        faculty: period.faculty || "",
        room: period.room || "",
        timeSlot: period.time || period.timeSlot || DEFAULT_SLOTS[slotIndex]?.time || "",
        isFree: !!period.isFree,
      },
    });
  }

  function handleSaveSlotModal() {
    const { day, slotIndex, period } = slotModal;
    const isFree = !period.subject || period.subject.trim() === "" || period.type === "FREE";

    const updatedPeriod = {
      slotIndex,
      time: period.timeSlot || DEFAULT_SLOTS[slotIndex]?.time || "",
      subject: isFree ? "No Class / Free" : period.subject.trim(),
      code: isFree ? "" : (period.code || "").trim(),
      type: isFree ? "FREE" : (period.type || "PP").toUpperCase(),
      faculty: isFree ? "" : (period.faculty || "").trim(),
      room: isFree ? "" : (period.room || "").trim(),
      isFree,
      isBreak: false,
    };

    setCurrentMatrix((prev) => {
      const next = { ...prev };
      const dayPeriods = [...(next[day] || [])];
      dayPeriods[slotIndex] = updatedPeriod;
      next[day] = dayPeriods;
      return next;
    });

    setHasUnsavedChanges(true);
    setSlotModal((prev) => ({ ...prev, isOpen: false }));
  }

  function handleClearPeriodSlot(day, slotIndex) {
    if (slotIndex === 3) return;
    const slot = DEFAULT_SLOTS[slotIndex] || {};
    const clearedPeriod = {
      slotIndex,
      time: slot.time || "09:30 - 10:30 AM",
      subject: "No Class / Free",
      code: "",
      type: "FREE",
      faculty: "",
      room: "",
      isFree: true,
      isBreak: false,
    };

    setCurrentMatrix((prev) => {
      const next = { ...prev };
      const dayPeriods = [...(next[day] || [])];
      dayPeriods[slotIndex] = clearedPeriod;
      next[day] = dayPeriods;
      return next;
    });

    setHasUnsavedChanges(true);
  }

  function handleQuickTypeToggle(day, slotIndex) {
    if (slotIndex === 3) return;
    setCurrentMatrix((prev) => {
      const next = { ...prev };
      const dayPeriods = [...(next[day] || [])];
      const currentPeriod = dayPeriods[slotIndex];
      if (!currentPeriod || currentPeriod.isFree || currentPeriod.isBreak) return prev;

      let nextType = "PP";
      if (currentPeriod.type === "PP") nextType = "PR";
      else if (currentPeriod.type === "PR") nextType = "TUT";
      else if (currentPeriod.type === "TUT") nextType = "PP";

      dayPeriods[slotIndex] = { ...currentPeriod, type: nextType };
      next[day] = dayPeriods;
      return next;
    });
    setHasUnsavedChanges(true);
  }

  // 1-Click Save and Publish to MongoDB Atlas (Dynamic Global Sync)
  async function handleSaveLiveMatrix() {
    setIsSavingMatrix(true);
    setStatusMsg({ text: "", type: "" });

    try {
      const payload = {
        batch: String(batch).trim(),
        branch: String(branch).trim().toUpperCase(),
        year: String(year).trim(),
        semester: String(semester).trim(),
        section: String(section).trim().toUpperCase(),
        title: customTitle || `${branch} Sec ${section} (Batch ${batch})`,
        schedule: currentMatrix,
      };

      const { data } = await axios.post(
        `${API}/timetable/admin/schedule/save`,
        payload,
        authHeaders
      );

      if (data.success) {
        setHasUnsavedChanges(false);
        setIsLiveCustomPublished(true);
        setStatusMsg({
          text: `Successfully published & synced live timetable for ${branch} Section ${section} (Batch ${batch})! All student pages and Attendance Trackers are now dynamically updated.`,
          type: "success",
        });

        // Update local memory & storage cache
        setCustomSchedulesStore([
          {
            batch,
            branch,
            section,
            schedule: currentMatrix,
          },
        ]);

        fetchPublishedSchedules();
      } else {
        setStatusMsg({ text: data.message || "Failed to save timetable.", type: "error" });
      }
    } catch (err) {
      console.error("Save matrix error:", err);
      setStatusMsg({
        text: err.response?.data?.message || "Server error while saving timetable schedule.",
        type: "error",
      });
    } finally {
      setIsSavingMatrix(false);
    }
  }

  // Reset current matrix to default JSON
  function handleResetToSectionDefault() {
    const norm = normalizeSection(section);
    const jsonTemplate = timetableData[norm] || timetableData["CSE-F"] || {};
    setCurrentMatrix(normalizeMatrixStructure(JSON.parse(JSON.stringify(jsonTemplate))));
    setHasUnsavedChanges(true);
    setStatusMsg({
      text: `Reset matrix for Section ${section} to default curriculum template. Click "Save & Publish" to update the live cloud database.`,
      type: "info",
    });
  }

  // Clone / Replicate current matrix to another target section
  async function handleCloneScheduleToTarget() {
    if (!cloneModal.targetSection) return;
    setCloneModal((prev) => ({ ...prev, isCloning: true }));

    try {
      const payload = {
        batch: String(batch).trim(),
        branch: String(branch).trim().toUpperCase(),
        year: String(year).trim(),
        semester: String(semester).trim(),
        section: String(cloneModal.targetSection).trim().toUpperCase(),
        title: `${branch} Sec ${cloneModal.targetSection} (Batch ${batch}) - Cloned from ${section}`,
        schedule: currentMatrix,
      };

      const { data } = await axios.post(
        `${API}/timetable/admin/schedule/save`,
        payload,
        authHeaders
      );

      if (data.success) {
        setStatusMsg({
          text: `Successfully cloned timetable from ${section} to ${cloneModal.targetSection}! Target section is now live.`,
          type: "success",
        });
        setCloneModal({ isOpen: false, targetSection: "CSE-B", isCloning: false });
        fetchPublishedSchedules();
      }
    } catch (e) {
      setStatusMsg({
        text: e.response?.data?.message || "Failed to clone timetable.",
        type: "error",
      });
      setCloneModal((prev) => ({ ...prev, isCloning: false }));
    }
  }

  // Calculate live matrix statistics (excluding Lunch Break)
  const matrixStats = useMemo(() => {
    let totalClasses = 0;
    let theoryCount = 0;
    let labCount = 0;
    let tutCount = 0;
    const uniqueSubjects = new Set();

    DAYS_LIST.forEach((day) => {
      const periods = currentMatrix[day] || [];
      periods.forEach((p, idx) => {
        if (idx === 3 || p.isBreak || p.type === "BREAK") return;
        if (!p.isFree && p.subject && p.subject !== "No Class / Free" && p.subject !== "Lunch Break / Recess") {
          totalClasses++;
          uniqueSubjects.add(cleanSubjectBaseName(p.subject));
          if (p.type === "PR") labCount++;
          else if (p.type === "TUT") tutCount++;
          else theoryCount++;
        }
      });
    });

    return {
      totalClasses,
      theoryCount,
      labCount,
      tutCount,
      uniqueSubjectCount: uniqueSubjects.size,
    };
  }, [currentMatrix]);

  // ═════════════════════════════════════════════════════════════════
  // EXCEL & SPREADSHEET IMPORT / EXPORT
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
          setCurrentMatrix(normalizeMatrixStructure(parsed));
          setHasUnsavedChanges(true);
          setStatusMsg({
            text: `Successfully parsed timetable from "${file.name}"! Loaded into the Interactive Matrix Editor below. Review & click "Save & Publish" when ready.`,
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
    const scheduleMap = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };

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
        for (let i = 1; i <= 8; i++) {
          const cellVal = row[i] ? String(row[i]).trim() : "";
          const slotMeta = DEFAULT_SLOTS[i - 1] || {};

          if (i === 4 || slotMeta.isBreak) {
            slots.push({
              slotIndex: 3,
              time: "12:30 - 01:30 PM",
              subject: "Lunch Break / Recess",
              code: "",
              type: "BREAK",
              faculty: "",
              room: "",
              isFree: true,
              isBreak: true,
            });
            continue;
          }

          if (!cellVal || cellVal.toLowerCase() === "free" || cellVal.toLowerCase() === "nil" || cellVal === "-") {
            slots.push({
              slotIndex: i - 1,
              time: slotMeta.time,
              subject: "No Class / Free",
              code: "",
              type: "FREE",
              faculty: "",
              room: "",
              isFree: true,
              isBreak: false,
            });
          } else {
            slots.push(parseCellString(cellVal, i - 1, slotMeta.time));
          }
        }
        scheduleMap[dayName] = slots;
      }
      return scheduleMap;
    }
    return null;
  }

  function parseCellString(raw, slotIndex, timeStr) {
    let subject = raw;
    let code = "";
    let type = "PP";
    let room = "";
    let faculty = "";

    const parts = raw.split("|").map((s) => s.trim());
    if (parts.length >= 2) {
      subject = parts[0];
      room = parts[1] || "";
      if (parts[2]) faculty = parts[2];
      if (parts[3]) type = parts[3].toUpperCase().includes("PR") ? "PR" : parts[3].toUpperCase().includes("TUT") ? "TUT" : "PP";
    } else {
      if (/lab|practical|pr/i.test(raw)) type = "PR";
      else if (/tut|tutorial/i.test(raw)) type = "TUT";

      const roomMatch = raw.match(/room[:s]*([a-zA-Z0-9-]+)/i);
      if (roomMatch) room = roomMatch[1];

      const codeMatch = raw.match(/\b(CU[A-Z]{2,4}\d{4}|CUTM\d{4})\b/i);
      if (codeMatch) code = codeMatch[1].toUpperCase();
    }

    return {
      slotIndex,
      time: timeStr || "",
      subject: cleanSubjectBaseName(subject) || subject,
      code,
      type,
      faculty,
      room,
      isFree: false,
      isBreak: false,
    };
  }

  function downloadTimetableTemplate() {
    const rows = [
      {
        Day: "Monday",
        "P1 (09:30-10:30)": "Data Structure and Algorithms (PR) | CSE-F-AR-317 | Baddigam Siddardhareddy | PR",
        "P2 (10:30-11:30)": "Data Structure and Algorithms (PR) | CSE-F-AR-317 | Baddigam Siddardhareddy | PR",
        "P3 (11:30-12:30)": "Network and Protocols for IoT(PP) | CSE-F-AR-317 | Dr. Prabin Kumar Panigrahi | PP",
        "Lunch (12:30-01:30)": "Lunch Break",
        "P4 (01:30-02:30)": "Robotic automation with ROS and C++(PR) | CSE-F-AR-317 | Biswajit Mallik | PR",
        "P5 (02:30-03:30)": "Robotic automation with ROS and C++(PR) | CSE-F-AR-317 | Biswajit Mallik | PR",
        "P6 (03:30-04:30)": "Information Security (CISCO)(PR) | CSE-F-AR-317 | Smita Patra | PR",
        "P7 (04:30-05:30)": "Information Security (CISCO)(PR) | CSE-F-AR-317 | Smita Patra | PR",
      },
      {
        Day: "Tuesday",
        "P1 (09:30-10:30)": "Cloud Fundamentals (Azure)(PP) | CSE-F-AR-317 | Partha Sarathi Pradhan | PP",
        "P2 (10:30-11:30)": "Theory of Computation and Compiler Design(PP) | CSE-F-AR-317 | Sasmita Tripathy | PP",
        "P3 (11:30-12:30)": "Theory of Computation and Compiler Design(PP) | CSE-F-AR-317 | Sasmita Tripathy | PP",
        "Lunch (12:30-01:30)": "Lunch Break",
        "P4 (01:30-02:30)": "Data Structure and Algorithms (PR) | CSE-F-AR-317 | Baddigam Siddardhareddy | PR",
        "P5 (02:30-03:30)": "Data Structure and Algorithms (PR) | CSE-F-AR-317 | Baddigam Siddardhareddy | PR",
        "P6 (03:30-04:30)": "Robotic automation with ROS and C++(PR) | CSE-F-AR-317 | Biswajit Mallik | PR",
        "P7 (04:30-05:30)": "Robotic automation with ROS and C++(PR) | CSE-F-AR-317 | Biswajit Mallik | PR",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");
    XLSX.writeFile(wb, `GradeFlow_Section_${section}_Timetable_Template.xlsx`);
  }

  // ═════════════════════════════════════════════════════════════════
  // CALENDAR & HOLIDAY HANDLERS
  // ═════════════════════════════════════════════════════════════════

  async function handleCalendarFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCalendarFileName(file.name);
    setStatusMsg({ text: `Analyzing "${file.name}"...`, type: "info" });

    try {
      const res = await parseAcademicCalendarFile(file);
      if (res.success && Array.isArray(res.activities)) {
        setCalendarActivities(res.activities);
        setStatusMsg({
          text: `Successfully parsed ${res.activities.length} calendar events from "${file.name}"! Review below before publishing.`,
          type: "success",
        });
      }
    } catch (err) {
      console.error("Calendar parse error:", err);
      setStatusMsg({ text: "Error parsing calendar file: " + (err.message || err), type: "error" });
    }
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
        setStatusMsg({ text: "Academic calendar published successfully! Live database updated.", type: "success" });
      }
    } catch (e) {
      setStatusMsg({ text: e.response?.data?.message || "Failed to publish calendar.", type: "error" });
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleHolidayFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHolidayFileName(file.name);
    setStatusMsg({ text: `Analyzing "${file.name}"...`, type: "info" });

    try {
      const res = await parseAcademicHolidaysFile(file);
      if (res.success && Array.isArray(res.holidays)) {
        setHolidaysList(res.holidays);
        setStatusMsg({
          text: `Successfully parsed ${res.holidays.length} holidays from "${file.name}"! Review below before publishing.`,
          type: "success",
        });
      }
    } catch (err) {
      console.error("Holiday parse error:", err);
      setStatusMsg({ text: "Error parsing holiday document: " + (err.message || err), type: "error" });
    }
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
        setStatusMsg({ text: "Academic holidays list published successfully! Live database updated.", type: "success" });
      }
    } catch (e) {
      setStatusMsg({ text: e.response?.data?.message || "Failed to publish holidays.", type: "error" });
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleDeletePublishedSchedule(id) {
    if (!window.confirm("Are you sure you want to delete this published timetable schedule?")) return;
    try {
      const { data } = await axios.delete(`${API}/timetable/admin/schedule/${id}`, authHeaders);
      if (data.success) {
        setStatusMsg({ text: "Timetable schedule deleted successfully.", type: "success" });
        fetchPublishedSchedules();
      }
    } catch (e) {
      setStatusMsg({ text: "Failed to delete schedule.", type: "error" });
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER UI
  // ═════════════════════════════════════════════════════════════════

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20, width: "100%", maxWidth: "100%" }}>
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
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab("editor")}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            background: activeSubTab === "editor" ? "#0f172a" : "transparent",
            color: activeSubTab === "editor" ? "#ffffff" : "#475569",
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
          <span>Section Timetable Editor</span>
          {hasUnsavedChanges && (
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#f59e0b" }} />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("excel_upload")}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            background: activeSubTab === "excel_upload" ? "#0f172a" : "transparent",
            color: activeSubTab === "excel_upload" ? "#ffffff" : "#475569",
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
          <FileSpreadsheet size={15} />
          <span>Excel / CSV Importer</span>
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
            background:
              statusMsg.type === "success" ? "#f0fdf4" : statusMsg.type === "info" ? "#eff6ff" : "#fef2f2",
            border: `1px solid ${
              statusMsg.type === "success" ? "#bbf7d0" : statusMsg.type === "info" ? "#bfdbfe" : "#fecaca"
            }`,
            color:
              statusMsg.type === "success" ? "#15803d" : statusMsg.type === "info" ? "#1d4ed8" : "#b91c1c",
            fontSize: 13.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : statusMsg.type === "info" ? (
            <Info size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span style={{ flex: 1 }}>{statusMsg.text}</span>
          <button
            type="button"
            onClick={() => setStatusMsg({ text: "", type: "" })}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 1: SECTION-WISE TIMETABLE INTERACTIVE EDITOR
      ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === "editor" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Target Filter & Control Bar */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "20px 24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 16.5, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={19} color="#2563eb" />
                  <span>Section-Wise Timetable Live Editor</span>
                  {isLiveCustomPublished ? (
                    <span style={{ fontSize: 11, fontWeight: 800, background: "#ecfdf5", color: "#059669", padding: "2px 8px", borderRadius: 999, border: "1px solid #a7f3d0", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={11} color="#059669" />
                      Live Custom Published
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 800, background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: 999, border: "1px solid #bfdbfe", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <BookOpen size={11} color="#2563eb" />
                      Standard Curriculum Template
                    </span>
                  )}
                </h3>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
                  Select batch, branch, and section to edit period slots, assign faculty & rooms, or clone routines.
                </p>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleResetToSectionDefault}
                  title="Reset to default template"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 9,
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#334155",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Reset to Template</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCloneModal({ isOpen: true, targetSection: "CSE-B", isCloning: false })}
                  title="Clone to another section"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 9,
                    border: "1px solid #bfdbfe",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Copy size={14} />
                  <span>Clone to Section...</span>
                </button>

                <button
                  type="button"
                  onClick={downloadTimetableTemplate}
                  title="Export Excel template"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 9,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Download size={14} />
                  <span>Export Template</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveLiveMatrix}
                  disabled={isSavingMatrix}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: hasUnsavedChanges
                      ? "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)"
                      : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: isSavingMatrix ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    boxShadow: hasUnsavedChanges
                      ? "0 4px 12px rgba(234, 88, 12, 0.3)"
                      : "0 4px 12px rgba(5, 150, 105, 0.25)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Save size={15} />
                  <span>
                    {isSavingMatrix
                      ? "Saving & Publishing..."
                      : hasUnsavedChanges
                      ? "Save & Publish Changes *"
                      : "Save & Publish Live Timetable"}
                  </span>
                </button>
              </div>
            </div>

            {/* Selector Inputs */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              {/* Batch */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  Batch Year
                </label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 9,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0f172a",
                    outline: "none",
                  }}
                >
                  <option value="2023">2023 Batch (6th Sem)</option>
                  <option value="2024">2024 Batch (4th Sem)</option>
                  <option value="2025">2025 Batch (2nd Sem)</option>
                  <option value="2026">2026 Batch</option>
                  <option value="2022">2022 Batch</option>
                  <option value="ALL">All Batches</option>
                </select>
              </div>

              {/* Branch */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  Branch / Program
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 9,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0f172a",
                    outline: "none",
                  }}
                >
                  <option value="CSE">Computer Science &amp; Engg (CSE)</option>
                  <option value="ECE">Electronics &amp; Comm Engg (ECE)</option>
                  <option value="MECH">Mechanical Engineering (MECH)</option>
                  <option value="CIVIL">Civil Engineering (CIVIL)</option>
                  <option value="EEE">Electrical &amp; Electronics (EEE)</option>
                  <option value="BCA">Bachelor of Comp Apps (BCA)</option>
                  <option value="MCA">Master of Comp Apps (MCA)</option>
                </select>
              </div>

              {/* Semester */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 9,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    fontWeight: 700,
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
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  Class Section
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 9,
                    border: "2px solid #2563eb",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#1d4ed8",
                    background: "#eff6ff",
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

              {/* Title / Description */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  Timetable Display Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => {
                    setCustomTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder={`e.g. ${branch} Sec ${section} Routine (Batch ${batch})`}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 9,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Summary Statistics Strip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                background: "#f8fafc",
                padding: "8px 14px",
                borderRadius: 10,
                fontSize: 12,
                color: "#475569",
              }}
            >
              <span style={{ fontWeight: 800, color: "#0f172a" }}>Section {section} Summary:</span>
              <span><strong>{matrixStats.totalClasses}</strong> Total Classes / Week</span>
              <span>•</span>
              <span style={{ color: "#2563eb" }}><strong>{matrixStats.theoryCount}</strong> Theory (PP)</span>
              <span>•</span>
              <span style={{ color: "#7c3aed" }}><strong>{matrixStats.labCount}</strong> Practical (PR)</span>
              <span>•</span>
              <span style={{ color: "#b45309" }}><strong>{matrixStats.tutCount}</strong> Tutorial (TUT)</span>
              <span>•</span>
              <span><strong>{matrixStats.uniqueSubjectCount}</strong> Unique Subjects</span>
            </div>
          </div>

          {/* Interactive Timetable Grid Table (100% Fluid Width - No Laptop Scrollbar) */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: isMobile ? "12px 10px" : "14px 16px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
              width: "100%",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                tableLayout: "fixed",
                borderCollapse: "separate",
                borderSpacing: "5px 6px",
              }}
            >
              <thead>
                <tr>
                  {/* Day Column Header */}
                  <th
                    style={{
                      padding: "6px 4px",
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 900,
                      color: "#475569",
                      width: "6%",
                      background: "#f8fafc",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      letterSpacing: "0.04em",
                    }}
                  >
                    DAY
                  </th>

                  {/* 8 Period Slot Headers */}
                  {DEFAULT_SLOTS.map((slot) => {
                    if (slot.isBreak || slot.index === 3) {
                      return (
                        <th
                          key={slot.index}
                          style={{
                            padding: "6px 4px",
                            textAlign: "center",
                            background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                            borderRadius: 8,
                            border: "1px solid #fed7aa",
                            width: "10%",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#c2410c", fontWeight: 900, fontSize: 10.5 }}>
                              <Utensils size={11} color="#ea580c" />
                              <span>LUNCH</span>
                            </div>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#9a3412", background: "rgba(255,255,255,0.7)", padding: "1px 4px", borderRadius: 3 }}>
                              12:30–1:30
                            </span>
                          </div>
                        </th>
                      );
                    }

                    return (
                      <th
                        key={slot.index}
                        style={{
                          padding: "6px 6px",
                          textAlign: "left",
                          background: "#f8fafc",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          width: "12%",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 11.5, fontWeight: 900, color: "#0f172a" }}>{slot.slotName}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#475569", background: "#ffffff", padding: "1px 4px", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                              {slot.time.split(" - ")[0]}
                            </span>
                          </div>
                          <span style={{ fontSize: 8.5, color: "#64748b", fontWeight: 600 }}>{slot.time}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {DAYS_LIST.map((day) => {
                  const periods = currentMatrix[day] || [];
                  const shortDay = day.slice(0, 3);
                  return (
                    <tr key={day}>
                      {/* Day Label Column Cell */}
                      <td
                        style={{
                          padding: "2px 2px",
                          verticalAlign: "middle",
                          width: "6%",
                        }}
                      >
                        <div
                          title={day}
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: "8px 2px",
                            textAlign: "center",
                            fontWeight: 900,
                            fontSize: 11.5,
                            color: "#0f172a",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {shortDay}
                        </div>
                      </td>

                      {/* 8 Period Slots for this day */}
                      {DEFAULT_SLOTS.map((slot, pIdx) => {
                        if (slot.isBreak || pIdx === 3) {
                          // Dedicated Lunch Break Recess Card
                          return (
                            <td
                              key={pIdx}
                              style={{
                                verticalAlign: "middle",
                                width: "10%",
                              }}
                            >
                              <div
                                style={{
                                  background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                                  border: "1.5px dashed #fed7aa",
                                  borderRadius: 8,
                                  padding: "8px 4px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 3,
                                  minHeight: 90,
                                  color: "#c2410c",
                                  boxSizing: "border-box",
                                }}
                              >
                                <div
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 999,
                                    background: "#ffedd5",
                                    border: "1px solid #fed7aa",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Utensils size={11} color="#ea580c" />
                                </div>
                                <span style={{ fontSize: 9.5, fontWeight: 900, textAlign: "center", lineHeight: 1.1 }}>
                                  Lunch
                                </span>
                                <span style={{ fontSize: 8.5, fontWeight: 700, color: "#9a3412" }}>
                                  12:30–1:30
                                </span>
                              </div>
                            </td>
                          );
                        }

                        const period = periods[pIdx] || { isFree: true, subject: "No Class / Free", type: "FREE" };
                        const isFree = period.isFree || period.type === "FREE" || !period.subject || period.subject === "No Class / Free";
                        const isLab = period.type === "PR";
                        const isTut = period.type === "TUT";

                        return (
                          <td
                            key={pIdx}
                            style={{
                              verticalAlign: "top",
                              width: "12%",
                            }}
                          >
                            {isFree ? (
                              /* Clean Empty / Free Slot Card */
                              <div
                                style={{
                                  background: "#f8fafc",
                                  border: "1.5px dashed #cbd5e1",
                                  borderRadius: 8,
                                  padding: "8px 6px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 5,
                                  minHeight: 90,
                                  boxSizing: "border-box",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>
                                  Free
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openEditSlotModal(day, pIdx)}
                                  style={{
                                    border: "1px solid #cbd5e1",
                                    background: "#ffffff",
                                    color: "#2563eb",
                                    borderRadius: 6,
                                    padding: "2px 6px",
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  <Plus size={10} />
                                  <span>Add</span>
                                </button>
                              </div>
                            ) : (
                              /* Professional Active Period Card */
                              <div
                                style={{
                                  background: isLab ? "#faf5ff" : isTut ? "#fffbeb" : "#eff6ff",
                                  border: `1.5px solid ${isLab ? "#d8b4fe" : isTut ? "#fde68a" : "#bfdbfe"}`,
                                  borderRadius: 8,
                                  padding: "6px 7px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 3,
                                  minHeight: 90,
                                  boxSizing: "border-box",
                                  position: "relative",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {/* Period Card Header: Type Pill & Quick Actions */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span
                                    onClick={() => handleQuickTypeToggle(day, pIdx)}
                                    title="Click to toggle Theory (PP) / Lab (PR) / Tutorial (TUT)"
                                    style={{
                                      fontSize: 9,
                                      fontWeight: 900,
                                      padding: "1px 4px",
                                      borderRadius: 4,
                                      background: isLab ? "#7c3aed" : isTut ? "#b45309" : "#2563eb",
                                      color: "#ffffff",
                                      cursor: "pointer",
                                      letterSpacing: "0.02em",
                                    }}
                                  >
                                    {period.type || "PP"}
                                  </span>

                                  {/* Action Buttons */}
                                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <button
                                      type="button"
                                      onClick={() => openEditSlotModal(day, pIdx)}
                                      title="Edit slot details"
                                      style={{
                                        border: "1px solid rgba(0,0,0,0.08)",
                                        background: "#ffffff",
                                        color: "#475569",
                                        cursor: "pointer",
                                        padding: "2px 3px",
                                        borderRadius: 4,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <Edit2 size={9} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleClearPeriodSlot(day, pIdx)}
                                      title="Clear / make free"
                                      style={{
                                        border: "1px solid rgba(220,38,38,0.15)",
                                        background: "#ffffff",
                                        color: "#dc2626",
                                        cursor: "pointer",
                                        padding: "2px 3px",
                                        borderRadius: 4,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <Trash2 size={9} />
                                    </button>
                                  </div>
                                </div>

                                {/* Subject Title */}
                                <div
                                  onClick={() => openEditSlotModal(day, pIdx)}
                                  title={period.subject}
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                    color: isLab ? "#6b21a8" : isTut ? "#78350f" : "#1e40af",
                                    lineHeight: 1.25,
                                    cursor: "pointer",
                                    minHeight: 26,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {period.subject}
                                </div>

                                {/* Room & Faculty Details */}
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.5,
                                    marginTop: "auto",
                                    paddingTop: 3,
                                    borderTop: "1px solid rgba(0,0,0,0.05)",
                                  }}
                                >
                                  {period.room ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 3,
                                        fontSize: 9,
                                        color: "#475569",
                                      }}
                                    >
                                      <MapPin size={9} color="#64748b" style={{ flexShrink: 0 }} />
                                      <span
                                        style={{
                                          fontWeight: 700,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {period.room}
                                      </span>
                                    </div>
                                  ) : null}

                                  {period.faculty ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 3,
                                        fontSize: 9,
                                        color: "#475569",
                                      }}
                                      title={period.faculty}
                                    >
                                      <User size={9} color="#64748b" style={{ flexShrink: 0 }} />
                                      <span
                                        style={{
                                          fontWeight: 600,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {period.faculty}
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
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

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 2: EXCEL / CSV BULK SPREADSHEET IMPORTER
      ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === "excel_upload" && (
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
                  <FileSpreadsheet size={18} color="#2563eb" />
                  Excel Spreadsheet Timetable Uploader
                </h3>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
                  Upload an existing Excel routine file to parse into Section {section}.
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
                }}
              >
                <Download size={14} color="#2563eb" />
                <span>Download Sample Excel Template</span>
              </button>
            </div>

            {/* Upload Dropzone */}
            <div
              style={{
                background: "#f8fafc",
                border: "2px dashed #cbd5e1",
                borderRadius: 16,
                padding: "36px 20px",
                textAlign: "center",
                cursor: "pointer",
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
                Supports <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong> files with 8 slots across Monday–Saturday.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 3: ACADEMIC CALENDAR
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
                  <Calendar size={18} color="#2563eb" />
                  Academic Calendar Configuration
                </h3>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
                  Upload official semester circular milestones (instruction end dates, exam dates).
                </p>
              </div>

              <button
                type="button"
                onClick={handlePublishCalendar}
                disabled={isPublishing}
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: "#16a34a",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
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

            <div
              style={{
                background: "#f8fafc",
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
                accept=".xlsx,.xls,.csv,.pdf,.json"
                style={{ display: "none" }}
                onChange={handleCalendarFileUpload}
              />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px auto",
                }}
              >
                <Upload size={22} />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                {calendarFileName ? calendarFileName : "Upload Academic Calendar Spreadsheet / Circular"}
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 4: ACADEMIC HOLIDAYS
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
                  <Sun size={18} color="#ea580c" />
                  Academic Holidays Configuration
                </h3>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
                  Official university holidays, puja leaves, and gazetted observation dates.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePublishHolidays}
                disabled={isPublishing}
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: "#ea580c",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
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

            <div
              style={{
                background: "#fff7ed",
                border: "2px dashed #fed7aa",
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
                accept=".xlsx,.xls,.csv,.pdf,.json"
                style={{ display: "none" }}
                onChange={handleHolidayFileUpload}
              />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#ffedd5",
                  color: "#ea580c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px auto",
                }}
              >
                <Upload size={22} />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                {holidayFileName ? holidayFileName : "Upload Holidays List Circular / Spreadsheet"}
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 5: PUBLISHED SCHEDULES
      ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === "published" && (
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={18} color="#2563eb" />
                  Live Published Timetable Schedules ({publishedList.length})
                </h3>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
                  All section timetables stored on MongoDB Atlas and actively serving student routines.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchPublishedSchedules}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <RefreshCw size={13} />
                <span>Refresh List</span>
              </button>
            </div>

            {isLoadingList ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: 13 }}>
                Loading published schedules from cloud...
              </div>
            ) : publishedList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>No custom schedules published yet.</p>
                <p style={{ fontSize: 12.5, margin: "4px 0 12px 0" }}>
                  All sections currently use the default curriculum templates. Edit and publish a section to make it live.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("editor")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 9,
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Open Section Timetable Editor
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {publishedList.map((sch) => (
                  <div
                    key={sch._id}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 900, background: "#dbeafe", color: "#1d4ed8", padding: "2px 7px", borderRadius: 5 }}>
                          Batch {sch.batch} • {sch.branch}
                        </span>
                        <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "4px 0 0 0" }}>
                          Section {sch.section}
                        </h4>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, background: "#ecfdf5", color: "#059669", padding: "2px 6px", borderRadius: 4 }}>
                        ACTIVE
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "#475569" }}>
                      {sch.title || `${sch.branch} Sec ${sch.section}`}
                    </div>

                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      Last updated: {new Date(sch.updatedAt || sch.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSection(sch.section);
                          setBatch(sch.batch || "2023");
                          setBranch(sch.branch || "CSE");
                          setActiveSubTab("editor");
                        }}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: 7,
                          border: "1px solid #bfdbfe",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <Edit2 size={12} />
                        <span>Edit in Editor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePublishedSchedule(sch._id)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 7,
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          color: "#dc2626",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 1: PERIOD SLOT EDIT MODAL
      ═════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {slotModal.isOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                background: "#ffffff",
                borderRadius: 18,
                maxWidth: "min(480px, 95vw)", maxHeight: "90vh",
                width: "100%",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    Edit Period — {slotModal.day}, {DEFAULT_SLOTS[slotModal.slotIndex]?.slotName} ({DEFAULT_SLOTS[slotModal.slotIndex]?.time})
                  </h4>
                  <span style={{ fontSize: 11.5, color: "#64748b" }}>
                    Section {section}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSlotModal((prev) => ({ ...prev, isOpen: false }))}
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Quick Subject Autocomplete Dropdown */}
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 4 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Zap size={13} color="#2563eb" /> Quick Select from Enrolled Subjects</span>
                  </label>
                  <select
                    onChange={(e) => {
                      const selected = KNOWN_SUBJECTS.find((s) => s.name === e.target.value);
                      if (selected) {
                        setSlotModal((prev) => ({
                          ...prev,
                          period: {
                            ...prev.period,
                            subject: selected.name,
                            code: selected.code,
                            type: selected.type,
                            room: prev.period.room || selected.defaultRoom,
                            isFree: false,
                          },
                        }));
                      }
                    }}
                    defaultValue=""
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "#0f172a",
                      outline: "none",
                      background: "#f8fafc",
                    }}
                  >
                    <option value="" disabled>
                      Choose a subject to auto-fill details...
                    </option>
                    {KNOWN_SUBJECTS.map((s, idx) => (
                      <option key={idx} value={s.name}>
                        {s.name} ({s.code}) — {s.type === "PR" ? "Lab (PR)" : s.type === "TUT" ? "Tutorial (TUT)" : "Theory (PP)"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Title */}
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 4 }}>
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={slotModal.period.subject}
                    onChange={(e) =>
                      setSlotModal((prev) => ({
                        ...prev,
                        period: { ...prev.period, subject: e.target.value, isFree: !e.target.value },
                      }))
                    }
                    placeholder="e.g. Cloud Fundamentals (Azure)"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Course Code & Component Type */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 4 }}>
                      Course Code (e.g. CUCS1015)
                    </label>
                    <input
                      type="text"
                      value={slotModal.period.code}
                      onChange={(e) =>
                        setSlotModal((prev) => ({
                          ...prev,
                          period: { ...prev.period, code: e.target.value.toUpperCase() },
                        }))
                      }
                      placeholder="CUCS1015"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1.5px solid #cbd5e1",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#0f172a",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 4 }}>
                      Component Type
                    </label>
                    <select
                      value={slotModal.period.type}
                      onChange={(e) =>
                        setSlotModal((prev) => ({
                          ...prev,
                          period: { ...prev.period, type: e.target.value },
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1.5px solid #cbd5e1",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#0f172a",
                        outline: "none",
                      }}
                    >
                      <option value="PP">Theory (PP)</option>
                      <option value="PR">Practical / Lab (PR)</option>
                      <option value="TUT">Tutorial (TUT)</option>
                      <option value="FREE">Free Time / No Class</option>
                    </select>
                  </div>
                </div>

                {/* Faculty & Room */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 4 }}>
                      Faculty Name
                    </label>
                    <input
                      type="text"
                      value={slotModal.period.faculty}
                      onChange={(e) =>
                        setSlotModal((prev) => ({
                          ...prev,
                          period: { ...prev.period, faculty: e.target.value },
                        }))
                      }
                      placeholder="Dr. / Prof. Name"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1.5px solid #cbd5e1",
                        fontSize: 12.5,
                        color: "#0f172a",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 4 }}>
                      Room / Lab Location
                    </label>
                    <input
                      type="text"
                      value={slotModal.period.room}
                      onChange={(e) =>
                        setSlotModal((prev) => ({
                          ...prev,
                          period: { ...prev.period, room: e.target.value },
                        }))
                      }
                      placeholder="Room 204 / LAB-03"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1.5px solid #cbd5e1",
                        fontSize: 12.5,
                        color: "#0f172a",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: "14px 20px",
                  background: "#f8fafc",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    handleClearPeriodSlot(slotModal.day, slotModal.slotIndex);
                    setSlotModal((prev) => ({ ...prev, isOpen: false }));
                  }}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Clear Slot (Make Free)
                </button>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSlotModal((prev) => ({ ...prev, isOpen: false }))}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSlotModal}
                    style={{
                      padding: "7px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Check size={14} />
                    <span>Apply to Slot</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════
          MODAL 2: CLONE TIMETABLE TO TARGET SECTION MODAL
      ═════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {cloneModal.isOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: "#ffffff",
                borderRadius: 18,
                maxWidth: "min(420px, 95vw)",
                width: "100%",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
                  <Copy size={17} color="#2563eb" />
                  <span>Clone Timetable to Section</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setCloneModal({ isOpen: false, targetSection: "CSE-B", isCloning: false })}
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
                This will duplicate the current timetable matrix of <strong>Section {section}</strong> and publish it as the active schedule for the target section below.
              </p>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Select Target Destination Section:
                </label>
                <select
                  value={cloneModal.targetSection}
                  onChange={(e) => setCloneModal((prev) => ({ ...prev, targetSection: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 9,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0f172a",
                    outline: "none",
                  }}
                >
                  {ALL_SECTIONS.filter((s) => s !== section).map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setCloneModal({ isOpen: false, targetSection: "CSE-B", isCloning: false })}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCloneScheduleToTarget}
                  disabled={cloneModal.isCloning}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: cloneModal.isCloning ? "not-allowed" : "pointer",
                  }}
                >
                  {cloneModal.isCloning ? "Cloning..." : `Clone to ${cloneModal.targetSection}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
