import timetableData from "../data/timetableData.json";
import {
  BASKET_1_SYLLABUS,
  BASKET_2_SYLLABUS,
  BASKET_3_SYLLABUS,
  BASKET_4_SYLLABUS,
  COMMON_BASKET_5_SYLLABUS,
  BASKET_5_SKILL_COURSES,
  BASKET_5_DOMAINS_DATA,
  isMatch,
} from "./basketLogic";

// ── Custom Dynamic Timetable Schedules Store (Synced with MongoDB Atlas) ────
let customSchedulesStore = {};

// Auto-hydrate from localStorage if running in browser
if (typeof window !== "undefined" && window.localStorage) {
  try {
    const cached = window.localStorage.getItem("gradeflow_custom_schedules");
    if (cached) {
      customSchedulesStore = JSON.parse(cached) || {};
    }
  } catch (e) {
    console.warn("Failed to load cached custom schedules:", e);
  }
}

/**
 * Set and cache active published schedules from backend API
 */
export function setCustomSchedulesStore(schedules) {
  if (!schedules) return;
  const store = {};

  if (Array.isArray(schedules)) {
    schedules.forEach((s) => {
      if (s && s.section && s.schedule) {
        const norm = normalizeSection(s.section);
        store[norm] = s.schedule;
        if (s.section !== norm) {
          store[s.section.toUpperCase()] = s.schedule;
        }
      }
    });
  } else if (typeof schedules === "object") {
    Object.keys(schedules).forEach((k) => {
      const norm = normalizeSection(k);
      store[norm] = schedules[k];
    });
  }

  customSchedulesStore = { ...customSchedulesStore, ...store };

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem("gradeflow_custom_schedules", JSON.stringify(customSchedulesStore));
    } catch (e) {
      console.warn("Failed to cache custom schedules:", e);
    }
  }
}

/**
 * Retrieve the active section schedule (Custom Published -> fallback to Default JSON)
 */
export function getActiveSectionSchedule(sectionName = "CSE-A") {
  const normSec = normalizeSection(sectionName);
  
  // 1. Check in-memory / cached custom published schedule
  if (customSchedulesStore[normSec]) {
    return customSchedulesStore[normSec];
  }
  if (customSchedulesStore[String(sectionName).toUpperCase()]) {
    return customSchedulesStore[String(sectionName).toUpperCase()];
  }

  // 2. Fallback to bundled standard JSON timetable
  return timetableData[normSec] || timetableData["CSE-A"] || {};
}

// ── Time Slot Configuration with Exact Minute Offsets ───────────────────────
export const TIME_SLOTS = [
  { id: "slot-1", label: "9.30AM-10.30AM", startMin: 570, endMin: 630, startTime: "09:30", endTime: "10:30" },
  { id: "slot-2", label: "10.30AM-11.30AM", startMin: 630, endMin: 690, startTime: "10:30", endTime: "11:30" },
  { id: "slot-3", label: "11.30AM-12.30PM", startMin: 690, endMin: 750, startTime: "11:30", endTime: "12:30" },
  { id: "slot-4", label: "12.30PM-1.30PM", startMin: 750, endMin: 810, startTime: "12:30", endTime: "13:30", isBreak: true },
  { id: "slot-5", label: "1.30PM-2.30PM", startMin: 810, endMin: 870, startTime: "13:30", endTime: "14:30" },
  { id: "slot-6", label: "2.30PM-3.30PM", startMin: 870, endMin: 930, startTime: "14:30", endTime: "15:30" },
  { id: "slot-7", label: "3.30PM-4.30PM", startMin: 930, endMin: 990, startTime: "15:30", endTime: "16:30" },
  { id: "slot-8", label: "4.30PM-5.30PM", startMin: 990, endMin: 1050, startTime: "16:30", endTime: "17:30" },
];

export const DAYS_LIST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const ALL_SECTIONS = [
  "CSE-A",
  "CSE-B",
  "CSE-C",
  "CSE-D",
  "CSE-E",
  "CSE-F",
  "CSE-G",
  "CSE-H",
  "CSE-I",
  "CSE-J",
];

// ── CUTM Official Academic Session 2026–27 Holiday Calendar ──────────────────
export const ACADEMIC_HOLIDAYS_2026_27 = [
  { date: "2026-07-16", day: "Thursday", name: "Ratha Yatra", type: "holiday", color: "#e11d48", bg: "#ffe4e6" },
  { date: "2026-08-15", day: "Saturday", name: "Independence Day", type: "observation", color: "#d97706", bg: "#fef3c7" },
  { date: "2026-08-28", day: "Friday", name: "Raksha Bandhan", type: "optional", color: "#7c3aed", bg: "#f5f3ff" },
  { date: "2026-09-04", day: "Friday", name: "Janmastami", type: "holiday", color: "#2563eb", bg: "#eff6ff" },
  { date: "2026-09-14", day: "Monday", name: "Ganesh Puja", type: "holiday", color: "#ea580c", bg: "#fff7ed" },
  { date: "2026-10-02", day: "Friday", name: "Gandhi Jayanti", type: "observation", color: "#d97706", bg: "#fef3c7" },
  { date: "2026-10-17", day: "Saturday", name: "Durga Puja (Maha Saptami)", type: "holiday", color: "#dc2626", bg: "#fef2f2" },
  { date: "2026-10-18", day: "Sunday", name: "Durga Puja (Maha Ashtami)", type: "holiday", color: "#dc2626", bg: "#fef2f2" },
  { date: "2026-10-19", day: "Monday", name: "Durga Puja (Maha Navami)", type: "holiday", color: "#dc2626", bg: "#fef2f2" },
  { date: "2026-10-20", day: "Tuesday", name: "Durga Puja (Vijaya Dashami)", type: "holiday", color: "#dc2626", bg: "#fef2f2" },
  { date: "2026-10-25", day: "Sunday", name: "Gajalaxmi Puja", type: "holiday", color: "#dc2626", bg: "#fef2f2" },
  { date: "2026-11-08", day: "Sunday", name: "Diwali", type: "holiday", color: "#ea580c", bg: "#fff7ed" },
  { date: "2026-11-24", day: "Tuesday", name: "Kartika Purnima", type: "optional", color: "#7c3aed", bg: "#f5f3ff" },
  { date: "2026-12-01", day: "Tuesday", name: "Prathamastami", type: "optional", color: "#7c3aed", bg: "#f5f3ff" },
  { date: "2026-12-25", day: "Friday", name: "Christmas Day", type: "holiday", color: "#16a34a", bg: "#f0fdf4" },
  { date: "2027-01-01", day: "Friday", name: "New Year Day", type: "holiday", color: "#2563eb", bg: "#eff6ff" },
  { date: "2027-01-14", day: "Thursday", name: "Makara Sankranti", type: "holiday", color: "#d97706", bg: "#fef3c7" },
  { date: "2027-01-26", day: "Tuesday", name: "Republic Day", type: "observation", color: "#d97706", bg: "#fef3c7" },
  { date: "2027-02-11", day: "Thursday", name: "Saraswati Puja", type: "holiday", color: "#f59e0b", bg: "#fefce8" },
  { date: "2027-03-06", day: "Saturday", name: "Maha Sivaratri", type: "holiday", color: "#7c3aed", bg: "#f5f3ff" },
  { date: "2027-03-10", day: "Wednesday", name: "Id-Ul-Fitre", type: "holiday", color: "#059669", bg: "#ecfdf5" },
  { date: "2027-03-22", day: "Monday", name: "Holi", type: "holiday", color: "#ec4899", bg: "#fdf2f8" },
  { date: "2027-03-26", day: "Friday", name: "Good Friday", type: "optional", color: "#7c3aed", bg: "#f5f3ff" },
  { date: "2027-04-01", day: "Thursday", name: "Utkal Diwas", type: "observation", color: "#d97706", bg: "#fef3c7" },
  { date: "2027-04-14", day: "Wednesday", name: "Maha Vishuva Sankranti", type: "holiday", color: "#ea580c", bg: "#fff7ed" },
  { date: "2027-04-15", day: "Thursday", name: "Sri Ram Navami", type: "holiday", color: "#f59e0b", bg: "#fefce8" },
  { date: "2027-05-17", day: "Monday", name: "Eid-ul-Adha (Bakrid)", type: "optional", color: "#059669", bg: "#ecfdf5" },
  { date: "2027-06-15", day: "Tuesday", name: "Raja Sankaranti", type: "holiday", color: "#e11d48", bg: "#ffe4e6" },
];

// ── CUTM School of Engineering & Technology Academic Calendar 2026–27 ───────
export const CUTM_ACADEMIC_CALENDAR_2026_27 = {
  oddSemester: {
    title: "Odd Semester",
    semestersLabel: "3rd, 5th and 7th Semesters",
    activities: [
      {
        slNo: 1,
        name: "Subject Depository to be send to ERP",
        schedule: "1st to 5th June 2026",
        startDate: "2026-06-01",
        endDate: "2026-06-05",
        category: "registration",
      },
      {
        slNo: 2,
        name: "Subject Registration",
        schedule: "10th to 25th June 2026",
        startDate: "2026-06-10",
        endDate: "2026-06-25",
        category: "registration",
      },
      {
        slNo: 3,
        name: "Timetable Configuration and uploading of Session Plan in ERP",
        schedule: "1st to 4th July 2026",
        startDate: "2026-07-01",
        endDate: "2026-07-04",
        category: "academic",
      },
      {
        slNo: 4,
        name: "Commencement of Classes",
        schedule: "6th July 2026",
        startDate: "2026-07-06",
        endDate: "2026-07-06",
        category: "academic",
      },
      {
        slNo: 5,
        name: "Mid Semester Examination",
        schedule: "7th to 11th September 2026",
        startDate: "2026-09-07",
        endDate: "2026-09-11",
        category: "exam",
      },
      {
        slNo: 6,
        name: "Last Date of Instruction",
        schedule: "31st October 2026",
        startDate: "2026-10-31",
        endDate: "2026-10-31",
        category: "academic",
      },
      {
        slNo: 7,
        name: "Practical / Project / Thesis Examination",
        schedule: "4th to 10th November 2026",
        startDate: "2026-11-04",
        endDate: "2026-11-10",
        category: "exam",
      },
      {
        slNo: 8,
        name: "End Semester Theory Examination",
        schedule: "12th to 28th November 2026",
        startDate: "2026-11-12",
        endDate: "2026-11-28",
        category: "exam",
      },
    ],
  },
  evenSemester: {
    title: "Even Semester",
    semestersLabel: "4th, 6th and 8th Semesters",
    activities: [
      {
        slNo: 1,
        name: "Subject Depository to be send to ERP",
        schedule: "20th to 25th November 2026",
        startDate: "2026-11-20",
        endDate: "2026-11-25",
        category: "registration",
      },
      {
        slNo: 2,
        name: "Subject Registration",
        schedule: "30th Nov. to 2nd Dec. 2026",
        startDate: "2026-11-30",
        endDate: "2026-12-02",
        category: "registration",
      },
      {
        slNo: 3,
        name: "Timetable Configuration and uploading of Session Plan in ERP",
        schedule: "3rd to 5th December 2026",
        startDate: "2026-12-03",
        endDate: "2026-12-05",
        category: "academic",
      },
      {
        slNo: 4,
        name: "Commencement of Classes",
        schedule: "7th December 2026",
        startDate: "2026-12-07",
        endDate: "2026-12-07",
        category: "academic",
      },
      {
        slNo: 5,
        name: "Mid Semester Examination",
        schedule: "27th January to 2nd February 2027",
        startDate: "2027-01-27",
        endDate: "2027-02-02",
        category: "exam",
      },
      {
        slNo: 6,
        name: "Last Date of Instruction",
        schedule: "3rd April 2027",
        startDate: "2027-04-03",
        endDate: "2027-04-03",
        category: "academic",
      },
      {
        slNo: 7,
        name: "Practical / Project / Thesis Examination",
        schedule: "7th to 13th April 2027",
        startDate: "2027-04-07",
        endDate: "2027-04-13",
        category: "exam",
      },
      {
        slNo: 8,
        name: "End Semester Theory Examination",
        schedule: "15th to 30th April 2027",
        startDate: "2027-04-15",
        endDate: "2027-04-30",
        category: "exam",
      },
    ],
    lateralEntryNote:
      "For Lateral Entry students: The commencement of class and Midterm exam will be notified later depending upon the last date of admission.",
  },
  events: {
    title: "University Event Window & Festivals",
    items: [
      {
        slNo: 1,
        name: "Inter / Intra University Sports",
        schedule: "30th November to 5th December 2026",
        startDate: "2026-11-30",
        endDate: "2026-12-05",
        category: "sports",
      },
      {
        slNo: 2,
        name: "Indigenous Sports",
        schedule: "5th–6th February 2027",
        startDate: "2027-02-05",
        endDate: "2027-02-06",
        category: "sports",
      },
      {
        slNo: 3,
        name: "Gajajyoti — Bhubaneswar Campus",
        schedule: "10th to 12th February 2027",
        startDate: "2027-02-10",
        endDate: "2027-02-12",
        category: "festival",
        location: "Bhubaneswar Campus",
      },
      {
        slNo: 4,
        name: "Gajajyoti — Paralakhemundi Campus",
        schedule: "18th to 20th February 2027",
        startDate: "2027-02-18",
        endDate: "2027-02-20",
        category: "festival",
        location: "Paralakhemundi Campus",
      },
      {
        slNo: 5,
        name: "Gajajyoti — Chatrapur Campus",
        schedule: "24th February 2027",
        startDate: "2027-02-24",
        endDate: "2027-02-24",
        category: "festival",
        location: "Chatrapur Campus",
      },
      {
        slNo: 6,
        name: "Gajajyoti — Balasore Campus",
        schedule: "26th–27th February 2027",
        startDate: "2027-02-26",
        endDate: "2027-02-27",
        category: "festival",
        location: "Balasore Campus",
      },
      {
        slNo: 7,
        name: "Summer Internship Window",
        schedule: "1st May to 30th June 2027",
        startDate: "2027-05-01",
        endDate: "2027-06-30",
        category: "internship",
      },
    ],
  },
};

/**
 * Format a Date object as YYYY-MM-DD local string
 */
export function formatDateKey(dateObj) {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a given date is Sunday
 */
export function isSunday(dateObj) {
  const d = new Date(dateObj);
  return d.getDay() === 0;
}

// ── CUTM Optional Holidays Guidelines (2026–27 Circular) ─────────────────────
export const CUTM_OPTIONAL_HOLIDAYS_RULES = {
  title: "CUTM Optional Holidays Guidelines (2026–27)",
  maxLeavesAllowed: 2,
  description:
    "CUTM provides 5 designated optional holidays out of which any two holidays can be availed by students and faculty during the academic session.",
  headsOfInstitutesRule:
    "Heads of Institutes at different campuses are allowed to declare two holidays depending on local social exigencies.",
  sundayOverlapNote:
    "Diwali (08-11-2026) and Gajalaxmi Puja (25-10-2026) fall on Sundays.",
  optionalList: [
    { slNo: "i", name: "Raksha Bandhan", date: "2026-08-28", day: "Friday" },
    { slNo: "ii", name: "Kartika Purnima", date: "2026-11-24", day: "Tuesday" },
    { slNo: "iii", name: "Prathamastami", date: "2026-12-01", day: "Tuesday" },
    { slNo: "iv", name: "Good Friday", date: "2027-03-26", day: "Friday" },
    { slNo: "v", name: "Eid-ul-Adha (Bakrid)", date: "2027-05-17", day: "Monday" },
  ],
};

/**
 * Checks if a given date is the 2nd Saturday of that month
 * (Falls on day 8 to 14 of the month)
 */
export function isSecondSaturday(dateObj) {
  const d = new Date(dateObj);
  if (d.getDay() !== 6) return false;
  const dayOfMonth = d.getDate();
  return dayOfMonth >= 8 && dayOfMonth <= 14;
}

/**
 * Get comprehensive Holiday / Weekend information for any date
 */
export function getHolidayInfo(dateObj) {
  const d = new Date(dateObj);
  const dateKey = formatDateKey(d);

  // 1. Check Official Academic Calendar Holidays
  const matchedHoliday = ACADEMIC_HOLIDAYS_2026_27.find((h) => h.date === dateKey);
  if (matchedHoliday) {
    const isOptional = matchedHoliday.type === "optional";
    const isObservation = matchedHoliday.type === "observation";
    const isFullHoliday = !isOptional && !isObservation;

    return {
      isHoliday: isFullHoliday,
      isOptional,
      isObservation,
      title: matchedHoliday.name,
      type: matchedHoliday.type,
      color: matchedHoliday.color,
      bg: matchedHoliday.bg,
      description: isOptional
        ? `Optional University Holiday: ${matchedHoliday.name}. University remains open and classes are conducted as scheduled. Students & faculty are permitted to avail any 2 optional leaves per academic year.`
        : isObservation
        ? `Official University Observation Day: ${matchedHoliday.name}. Commemorative events and classes held as notified.`
        : `Official University Academic Holiday: ${matchedHoliday.name}. University is closed.`,
    };
  }

  // 2. Check Sunday Weekend Holiday
  if (isSunday(d)) {
    return {
      isHoliday: true,
      isOptional: false,
      isObservation: false,
      title: "Sunday (Weekend Holiday)",
      type: "weekend",
      color: "#dc2626",
      bg: "#fef2f2",
      description: "University is closed on Sundays. Enjoy your weekend!",
    };
  }

  // 3. Check 2nd Saturday Holiday
  if (isSecondSaturday(d)) {
    return {
      isHoliday: true,
      isOptional: false,
      isObservation: false,
      title: "2nd Saturday (University Holiday)",
      type: "second_saturday",
      color: "#7c3aed",
      bg: "#f5f3ff",
      description: "2nd Saturday is an official university non-instructional holiday.",
    };
  }

  return null;
}

/**
 * Analyze Academic Calendar for a given date:
 * - Check if before Commencement of Classes (July 6, 2026)
 * - Check if after Last Date of Instruction (October 31, 2026)
 * - Check if on Examination dates (Mid Sem, Practical, End Sem)
 * - Check if on University Events / Festivals
 */
export function getAcademicCalendarDateStatus(dateObj) {
  if (!dateObj) return null;
  const d = new Date(dateObj);
  d.setHours(0, 0, 0, 0);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateStr = `${y}-${m}-${day}`;

  // Session Range for Odd Semester: 2026-07-06 to 2026-10-31
  const sessionStartStr = "2026-07-06";
  const lastInstructionDateStr = "2026-10-31";

  if (dateStr < sessionStartStr) {
    return {
      isOutsideSession: true,
      type: "pre_session",
      title: "Pre-Semester Period",
      message: "Odd Semester classes officially commenced on 6th July 2026. Prior dates do not have scheduled class routines.",
      color: "#64748b",
      bg: "#f8fafc",
    };
  }

  // Check if exactly the Last Date of Instruction
  if (dateStr === lastInstructionDateStr) {
    return {
      isCalendarEvent: true,
      isLastInstruction: true,
      classesSuspended: false,
      title: "Last Date of Instruction (Odd Semester)",
      message: "Today marks the final day of classroom teaching & instructional delivery for the Odd Semester 2026.",
      color: "#2563eb",
      bg: "#eff6ff",
    };
  }

  // Check if date is after the Last Date of Instruction (Post-Instruction & Examinations)
  if (dateStr > lastInstructionDateStr) {
    const oddActivities = CUTM_ACADEMIC_CALENDAR_2026_27?.oddSemester?.activities || [];
    for (const act of oddActivities) {
      if (dateStr >= act.startDate && dateStr <= act.endDate) {
        return {
          isOutsideSession: true,
          isExam: true,
          classesSuspended: true,
          title: act.name,
          schedule: act.schedule,
          message: `Semester instructional classes ended on 31st Oct 2026. ${act.name} is underway (${act.schedule}).`,
          color: "#dc2626",
          bg: "#fef2f2",
        };
      }
    }

    return {
      isOutsideSession: true,
      type: "post_instruction",
      title: "Semester Instruction Concluded",
      message: "Instructional teaching for the Odd Semester ended on 31st October 2026. Examinations and assessments follow.",
      color: "#d97706",
      bg: "#fffbeb",
    };
  }

  // Check if date falls in Mid-Semester Exam or other within-session activities
  const oddActivities = CUTM_ACADEMIC_CALENDAR_2026_27?.oddSemester?.activities || [];
  for (const act of oddActivities) {
    if (dateStr >= act.startDate && dateStr <= act.endDate) {
      if (act.category === "exam") {
        return {
          isCalendarEvent: true,
          isExam: true,
          classesSuspended: true,
          title: act.name,
          schedule: act.schedule,
          message: `${act.name} is currently underway (${act.schedule}). Regular theory & practice classes are suspended for examinations.`,
          color: "#ea580c",
          bg: "#fff7ed",
        };
      }
    }
  }

  // Check University Events
  const events = CUTM_ACADEMIC_CALENDAR_2026_27?.events?.items || [];
  for (const ev of events) {
    if (dateStr >= ev.startDate && dateStr <= ev.endDate) {
      return {
        isCalendarEvent: true,
        isEvent: true,
        classesSuspended: false,
        title: ev.name,
        schedule: ev.schedule,
        message: `University event window: ${ev.name} (${ev.schedule}). Classes may be subject to event schedules.`,
        color: "#7c3aed",
        bg: "#f5f3ff",
      };
    }
  }

  return null;
}

/**
 * Get Day name for a date (e.g. "Monday", "Tuesday", etc.)
 */
export function getDayName(dateObj) {
  const d = new Date(dateObj);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return dayNames[d.getDay()];
}

/**
 * Clean & Format Section Name from RegNo or Raw String
 * e.g., "A" -> "CSE-A", "CSE" -> "CSE-A", "CSE-B" -> "CSE-B"
 */
export function normalizeSection(rawSection, regNo = "") {
  let sec = String(rawSection || "").trim().toUpperCase();

  if (sec.startsWith("CSE-")) {
    if (ALL_SECTIONS.includes(sec)) return sec;
  }

  if (sec.length === 1 && ALL_SECTIONS.includes(`CSE-${sec}`)) {
    return `CSE-${sec}`;
  }

  // Detect section from RegNo if available
  if (regNo && /^\d{2}0301120/.test(String(regNo))) {
    const num = parseInt(String(regNo).slice(-3), 10);
    if (num >= 1 && num <= 60) return "CSE-A";
    if (num >= 61 && num <= 120) return "CSE-B";
    if (num >= 121 && num <= 180) return "CSE-C";
    if (num >= 181 && num <= 240) return "CSE-D";
    if (num >= 241 && num <= 300) return "CSE-E";
    if (num >= 301 && num <= 360) return "CSE-F";
    if (num >= 361 && num <= 420) return "CSE-G";
    if (num >= 421 && num <= 480) return "CSE-H";
    if (num >= 481 && num <= 549) return "CSE-I";
  }

  return "CSE-A";
}

/**
 * Get Section Schedule for a specific Day from parsed database
 */
export function getDaySchedule(section, dayName) {
  const secData = getActiveSectionSchedule(section);
  if (!secData) return [];
  return secData[dayName] || [];
}

/**
 * Evaluate Live Status of each Period based on current wall-clock time
 */
export function getLivePeriodStatus(timeSlotIndex, now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slot = TIME_SLOTS[timeSlotIndex];
  if (!slot) return "UPCOMING";

  if (currentMinutes >= slot.startMin && currentMinutes < slot.endMin) {
    return "LIVE_NOW";
  } else if (currentMinutes >= slot.endMin) {
    return "COMPLETED";
  } else {
    return "UPCOMING";
  }
}

/**
 * Format minutes into a clean human-readable duration (e.g. "45m", "1h 15m", "6h 43m")
 */
export function formatDurationMinutes(minutes = 0) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) {
    return `${m}m`;
  }
  const hours = Math.floor(m / 60);
  const remainingMins = m % 60;
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

/**
 * Find Current Active Period & Next Upcoming Period
 */
export function getLiveScheduleOverview(section, dateObj = new Date()) {
  const holidayInfo = getHolidayInfo(dateObj);
  const dayName = getDayName(dateObj);

  if (holidayInfo?.isHoliday) {
    return {
      isHoliday: true,
      holidayInfo,
      dayName,
      activeClass: null,
      nextClass: null,
      classesToday: [],
    };
  }

  const schedule = getDaySchedule(section, dayName);
  const currentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();

  let activeClass = null;
  let nextClass = null;
  let remainingClassesCount = 0;

  schedule.forEach((period, idx) => {
    const slot = TIME_SLOTS[idx] || {};
    const status = getLivePeriodStatus(idx, dateObj);

    if (status === "LIVE_NOW" && !period.isFree) {
      const remainingMins = slot.endMin ? Math.max(0, slot.endMin - currentMinutes) : 0;
      activeClass = {
        ...period,
        slot,
        status,
        remainingMins,
        remainingDurationStr: formatDurationMinutes(remainingMins),
      };
    }

    if (status === "UPCOMING" && !period.isFree) {
      remainingClassesCount++;
      if (!nextClass) {
        const startsInMins = slot.startMin ? Math.max(0, slot.startMin - currentMinutes) : 0;
        nextClass = {
          ...period,
          slot,
          status,
          startsInMins,
          startsInDurationStr: formatDurationMinutes(startsInMins),
        };
      }
    }
  });

  return {
    isHoliday: false,
    holidayInfo: null,
    dayName,
    activeClass,
    nextClass,
    remainingClassesCount,
    classesToday: schedule,
  };
}

/**
 * Extract clean base name from raw subject string
 */
export function cleanSubjectBaseName(rawSubject) {
  if (!rawSubject || rawSubject === "No Class / Free" || /lunch\s*break|recess/i.test(rawSubject)) return "";
  return String(rawSubject)
    .replace(/\s*\((PP|PR|TUT|Theory|Practice|Project|Lab|T\+P|P\+P|PP\s*\+\s*PR|PR\s*\+\s*PP|PP\/PR|TUT\s*\+\s*PP)\)\s*$/i, "")
    .replace(/\((PP|PR|TUT|Theory|Practice|Project|Lab|T\+P|P\+P|PP\s*\+\s*PR|PR\s*\+\s*PP|PP\/PR|TUT\s*\+\s*PP)\)$/i, "")
    .replace(/\s*\(PP\s*\+\s*PR\)\s*$/i, "")
    .trim();
}

/**
 * Scan section schedule and return all unique subjects with components, weekly frequency, and slots
 */
export function getSectionSubjectCatalog(sectionName = "CSE-A") {
  const secData = getActiveSectionSchedule(sectionName);
  if (!secData) return [];

  const catalogMap = new Map();

  DAYS_LIST.forEach((day) => {
    const dayPeriods = secData[day] || [];
    dayPeriods.forEach((period, pIdx) => {
      if (period.isFree || !period.subject || period.subject === "No Class / Free") return;

      const baseName = cleanSubjectBaseName(period.subject);
      if (!baseName) return;

      const componentType = (period.type || "PP").toUpperCase();
      const slot = TIME_SLOTS[pIdx] || {};

      if (!catalogMap.has(baseName)) {
        catalogMap.set(baseName, {
          subjectName: baseName,
          components: new Set(),
          weeklyOccurrences: [],
          faculties: new Set(),
          rooms: new Set(),
        });
      }

      const entry = catalogMap.get(baseName);
      entry.components.add(componentType);
      if (period.faculty) entry.faculties.add(period.faculty.trim());
      if (period.room) entry.rooms.add(period.room.trim());
      entry.weeklyOccurrences.push({
        day,
        periodIndex: pIdx + 1,
        timeSlot: period.timeSlot || `${slot.startTime} - ${slot.endTime}`,
        type: componentType,
        room: period.room,
        faculty: period.faculty,
      });
    });
  });

  return Array.from(catalogMap.values())
    .map((item) => ({
      subjectName: item.subjectName,
      components: Array.from(item.components),
      classesPerWeek: item.weeklyOccurrences.length,
      weeklyOccurrences: item.weeklyOccurrences,
      faculties: Array.from(item.faculties),
      rooms: Array.from(item.rooms),
    }))
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
}

/**
 * Comprehensive Attendance Mathematical Predictor
 */
export function calculateAttendance({
  components = [],
  targetPercentage = 75,
  simulateAbsent = 0,
  simulatePresent = 0,
}) {
  let totalAttended = 0;
  let totalDelivered = 0;

  components.forEach((c) => {
    const att = Math.max(0, Number(c.attended) || 0);
    const del = Math.max(att, Number(c.delivered) || 0);
    totalAttended += att;
    totalDelivered += del;
  });

  const currentPercentage = totalDelivered > 0 ? (totalAttended / totalDelivered) * 100 : 100;
  const target = Math.min(100, Math.max(1, Number(targetPercentage) || 75));

  // Simulation: Absent X classes
  const simulatedAbsentTotalDelivered = totalDelivered + Number(simulateAbsent || 0);
  const simulatedAbsentPercentage =
    simulatedAbsentTotalDelivered > 0
      ? (totalAttended / simulatedAbsentTotalDelivered) * 100
      : currentPercentage;

  // Simulation: Attend Y classes
  const simulatedPresentTotalAttended = totalAttended + Number(simulatePresent || 0);
  const simulatedPresentTotalDelivered = totalDelivered + Number(simulatePresent || 0);
  const simulatedPresentPercentage =
    simulatedPresentTotalDelivered > 0
      ? (simulatedPresentTotalAttended / simulatedPresentTotalDelivered) * 100
      : currentPercentage;

  // Goal Planner to reach target%
  let classesNeeded = 0;
  let safeBunks = 0;

  if (target >= 100) {
    if (totalAttended === totalDelivered) {
      classesNeeded = 0;
      safeBunks = 0;
    } else {
      classesNeeded = Infinity;
      safeBunks = 0;
    }
  } else if (currentPercentage < target) {
    // Deficit zone: Need N continuous classes
    const numerator = target * totalDelivered - 100 * totalAttended;
    const denominator = 100 - target;
    classesNeeded = Math.ceil(numerator / denominator);
    safeBunks = 0;
  } else {
    // Safe zone: Can bunk B classes
    classesNeeded = 0;
    const numerator = 100 * totalAttended - target * totalDelivered;
    safeBunks = Math.floor(numerator / target);
  }

  // Safety status
  let status = "SAFE"; // "SAFE" (>=75%), "WARNING" (65-74.9%), "CRITICAL" (<65%)
  if (currentPercentage < 65) status = "CRITICAL";
  else if (currentPercentage < 75) status = "WARNING";

  return {
    totalAttended,
    totalDelivered,
    currentPercentage: Number(currentPercentage.toFixed(2)),
    status,
    target,
    classesNeeded: Number.isFinite(classesNeeded) ? classesNeeded : 999,
    safeBunks: Math.max(0, safeBunks),
    simulatedAbsent: {
      missedCount: simulateAbsent,
      projectedPercentage: Number(simulatedAbsentPercentage.toFixed(2)),
      delta: Number((simulatedAbsentPercentage - currentPercentage).toFixed(2)),
      isBelow75: simulatedAbsentPercentage < 75,
    },
    simulatedPresent: {
      attendedCount: simulatePresent,
      projectedPercentage: Number(simulatedPresentPercentage.toFixed(2)),
      delta: Number((simulatedPresentPercentage - currentPercentage).toFixed(2)),
    },
  };
}

/**
 * Estimate target reach date based on weekly timetable schedule & CUTM academic calendar
 */
export function estimateTargetReachDate(
  classesNeeded,
  weeklyOccurrences = [],
  startDate = new Date(),
  currentAttended = 0,
  currentDelivered = 0,
  targetPercentage = 75,
  maxSessionsLimit = 200
) {
  if (!classesNeeded || classesNeeded <= 0 || !Array.isArray(weeklyOccurrences) || weeklyOccurrences.length === 0) {
    return null;
  }

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayIndices = weeklyOccurrences.map((occ) => daysOfWeek.indexOf(occ.day)).filter((idx) => idx >= 0);

  if (dayIndices.length === 0) return null;

  // CUTM Odd Semester Last Date of Instruction (31 Oct 2026)
  const lastInstructionDate = new Date("2026-10-31T23:59:59");

  let remaining = classesNeeded;
  const requiredSessions = [];
  let totalRemainingSemClasses = 0;
  let reachDate = null;

  const simCurrent = new Date(startDate);
  let curAtt = Number(currentAttended) || 0;
  let curDel = Number(currentDelivered) || 0;

  // Scan until Last Date of Instruction
  while (simCurrent <= lastInstructionDate) {
    simCurrent.setDate(simCurrent.getDate() + 1);
    if (simCurrent > lastInstructionDate) break;

    // Skip official non-working academic calendar holidays
    const hol = getHolidayInfo(simCurrent);
    if (hol?.isHoliday) continue;

    // Skip examination weeks when regular classes are suspended
    const acStatus = getAcademicCalendarDateStatus(simCurrent);
    if (acStatus?.classesSuspended || acStatus?.isExam) continue;

    const dayIdx = simCurrent.getDay();
    const dayName = daysOfWeek[dayIdx];
    const matchingOccurrences = weeklyOccurrences.filter((occ) => occ.day === dayName);

    matchingOccurrences.forEach((occ) => {
      totalRemainingSemClasses++;

      if (remaining > 0) {
        remaining--;
        curAtt += 1;
        curDel += 1;
        const runningPct = curDel > 0 ? (curAtt / curDel) * 100 : 100;

        if (remaining === 0 && !reachDate) {
          reachDate = new Date(simCurrent);
        }

        if (requiredSessions.length < maxSessionsLimit) {
          requiredSessions.push({
            sessionNumber: requiredSessions.length + 1,
            date: new Date(simCurrent),
            dateKey: formatDateKey(simCurrent),
            dateStr: simCurrent.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            }),
            fullDateStr: simCurrent.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            day: occ.day,
            timeSlot: occ.timeSlot,
            room: occ.room || "Classroom",
            type: occ.type || "Lecture",
            faculty: occ.faculty || "",
            runningAttended: curAtt,
            runningDelivered: curDel,
            runningPercentage: Number(runningPct.toFixed(1)),
            isMilestoneTarget: remaining === 0,
          });
        }
      }
    });
  }

  const isAttainable = classesNeeded <= totalRemainingSemClasses;
  const maxAttainableAttended = (Number(currentAttended) || 0) + totalRemainingSemClasses;
  const maxAttainableDelivered = (Number(currentDelivered) || 0) + totalRemainingSemClasses;
  const maxAttainablePercentage =
    maxAttainableDelivered > 0
      ? Number(((maxAttainableAttended / maxAttainableDelivered) * 100).toFixed(1))
      : 0;

  const weeksCount = (classesNeeded / weeklyOccurrences.length).toFixed(1);

  return {
    isAttainable,
    estimatedDate: reachDate
      ? reachDate.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null,
    rawReachDate: reachDate,
    estimatedWeeks: Number(weeksCount),
    classesPerWeek: weeklyOccurrences.length,
    classesNeeded,
    totalRemainingSemClasses,
    maxAttainablePercentage,
    lastInstructionDateStr: "31 Oct 2026",
    requiredSessions,
    upcomingSessions: requiredSessions.slice(0, 5),
  };
}

/**
 * Simulate what happens if a student misses M classes during their sprint to target
 * Calculates the exact compounded penalty: M missed classes require (T / (100 - T)) * M extra classes
 */
export function simulateMissPenalty({
  currentAttended = 0,
  currentDelivered = 0,
  targetPercentage = 75,
  missedCount = 1,
  weeklyOccurrences = [],
  startDate = new Date(),
}) {
  const target = Math.min(99.9, Math.max(1, Number(targetPercentage) || 75));
  const att = Math.max(0, Number(currentAttended) || 0);
  const del = Math.max(att, Number(currentDelivered) || 0);
  const miss = Math.max(0, Number(missedCount) || 0);

  // Base requirement without missing classes
  const baseNumerator = target * del - 100 * att;
  const denominator = 100 - target;
  const baseNeeded = baseNumerator > 0 ? Math.ceil(baseNumerator / denominator) : 0;

  // Requirement if `miss` classes are missed
  const newDel = del + miss;
  const newNumerator = target * newDel - 100 * att;
  const newNeeded = newNumerator > 0 ? Math.ceil(newNumerator / denominator) : 0;

  const extraClassesNeeded = Math.max(0, newNeeded - baseNeeded);
  const recoveryMultiplier = Number((target / denominator).toFixed(2));

  // Calendar projections
  const baseProjection = estimateTargetReachDate(
    baseNeeded,
    weeklyOccurrences,
    startDate,
    att,
    del,
    target
  );

  const delayedProjection = estimateTargetReachDate(
    newNeeded,
    weeklyOccurrences,
    startDate,
    att,
    newDel,
    target
  );

  // Calculate day difference if both reach dates exist
  let delayInDays = 0;
  if (baseProjection?.rawReachDate && delayedProjection?.rawReachDate) {
    const diffMs = delayedProjection.rawReachDate.getTime() - baseProjection.rawReachDate.getTime();
    delayInDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  // Find newly appended sessions that weren't in base projection
  const appendedSessions = (delayedProjection?.requiredSessions || []).slice(baseNeeded);

  return {
    missedCount: miss,
    targetPercentage: target,
    baseNeeded,
    newNeeded,
    extraClassesNeeded,
    recoveryMultiplier,
    delayInDays,
    baseProjection,
    delayedProjection,
    appendedSessions,
  };
}

/**
 * Multi-Phase Attendance Goal & Future Bunk Strategy Simulator:
 * Phase 1: Attend consecutively to reach primary Target Goal T1% (e.g. 80%) on Date D1.
 * Phase 2: Take B planned absent classes (e.g. 6 bunks for fest/leave) from Date D1 -> Date D_bunk.
 * Phase 3: Calculate post-bunk recovery extra classes & exact class dates required to recover back to Target T2%.
 */
export function simulateMultiPhaseAttendance({
  currentAttended = 0,
  currentDelivered = 0,
  targetGoal = 80,
  plannedBunksAfterTarget = 6,
  recoveryTarget = 75,
  weeklyOccurrences = [],
  startDate = new Date(),
}) {
  const t1 = Math.min(99.9, Math.max(1, Number(targetGoal) || 80));
  const t2 = Math.min(99.9, Math.max(1, Number(recoveryTarget) || 75));
  const bunks = Math.max(0, Number(plannedBunksAfterTarget) || 0);
  const att0 = Math.max(0, Number(currentAttended) || 0);
  const del0 = Math.max(att0, Number(currentDelivered) || 0);

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const lastInstructionDate = new Date("2026-10-31T23:59:59");

  // ── PHASE 1: Reach Primary Target T1 ────────────────────────────────────────
  const p1Numerator = t1 * del0 - 100 * att0;
  const p1Denominator = 100 - t1;
  const p1ClassesNeeded = p1Numerator > 0 ? Math.ceil(p1Numerator / p1Denominator) : 0;

  const phase1Projection = estimateTargetReachDate(
    p1ClassesNeeded > 0 ? p1ClassesNeeded : 1,
    weeklyOccurrences,
    startDate,
    att0,
    del0,
    t1
  );

  const p1Attended = att0 + p1ClassesNeeded;
  const p1Delivered = del0 + p1ClassesNeeded;
  const p1Percentage = p1Delivered > 0 ? (p1Attended / p1Delivered) * 100 : 100;
  const p1ReachDate = p1ClassesNeeded === 0 ? new Date(startDate) : (phase1Projection?.rawReachDate || new Date(startDate));

  // ── PHASE 2: Simulate Planned Bunks (Miss next B classes) ───────────────────
  let bunksRemaining = bunks;
  const bunkSessions = [];
  let lastBunkDate = new Date(p1ReachDate);
  const simCurrent = new Date(p1ReachDate);

  while (simCurrent <= lastInstructionDate && bunksRemaining > 0) {
    simCurrent.setDate(simCurrent.getDate() + 1);
    if (simCurrent > lastInstructionDate) break;

    const hol = getHolidayInfo(simCurrent);
    if (hol?.isHoliday) continue;

    const acStatus = getAcademicCalendarDateStatus(simCurrent);
    if (acStatus?.classesSuspended || acStatus?.isExam) continue;

    const dayIdx = simCurrent.getDay();
    const dayName = daysOfWeek[dayIdx];
    const matchingOccurrences = weeklyOccurrences.filter((occ) => occ.day === dayName);

    matchingOccurrences.forEach((occ) => {
      if (bunksRemaining > 0) {
        bunksRemaining--;
        lastBunkDate = new Date(simCurrent);
        bunkSessions.push({
          bunkNumber: bunkSessions.length + 1,
          date: new Date(simCurrent),
          dateKey: formatDateKey(simCurrent),
          dateStr: simCurrent.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
          fullDateStr: simCurrent.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          day: occ.day,
          timeSlot: occ.timeSlot,
          room: occ.room || "Classroom",
          type: occ.type || "Lecture",
          faculty: occ.faculty || "",
        });
      }
    });
  }

  const p2Attended = p1Attended;
  const p2Delivered = p1Delivered + bunks;
  const p2Percentage = p2Delivered > 0 ? (p2Attended / p2Delivered) * 100 : 100;
  const isBelowRecoveryTarget = p2Percentage < t2;
  const isBelow75 = p2Percentage < 75;

  // ── PHASE 3: Recovery Roadmap post-bunk ─────────────────────────────────────
  let recoveryClassesNeeded = 0;
  let safeBunksRemaining = 0;

  if (p2Percentage < t2) {
    const recNum = t2 * p2Delivered - 100 * p2Attended;
    const recDen = 100 - t2;
    recoveryClassesNeeded = Math.ceil(recNum / recDen);
    safeBunksRemaining = 0;
  } else {
    recoveryClassesNeeded = 0;
    const safeNum = 100 * p2Attended - t2 * p2Delivered;
    safeBunksRemaining = Math.floor(safeNum / t2);
  }

  const recoveryProjection =
    recoveryClassesNeeded > 0
      ? estimateTargetReachDate(
          recoveryClassesNeeded,
          weeklyOccurrences,
          lastBunkDate,
          p2Attended,
          p2Delivered,
          t2
        )
      : null;

  const finalAttended = p2Attended + recoveryClassesNeeded;
  const finalDelivered = p2Delivered + recoveryClassesNeeded;
  const finalPercentage = finalDelivered > 0 ? (finalAttended / finalDelivered) * 100 : 100;

  return {
    primaryTarget: t1,
    recoveryTarget: t2,
    plannedBunks: bunks,
    // Phase 1 summary
    phase1: {
      classesNeeded: p1ClassesNeeded,
      reachDateStr:
        phase1Projection?.estimatedDate ||
        (p1ClassesNeeded === 0
          ? "Already Achieved"
          : phase1Projection?.isAttainable === false
          ? `Exceeds Semester (Max: ${phase1Projection?.maxAttainablePercentage || 0}% by 31 Oct)`
          : "Not Attainable within Semester"),
      rawReachDate: p1ReachDate,
      totalAttended: p1Attended,
      totalDelivered: p1Delivered,
      projectedPercentage: Number(p1Percentage.toFixed(2)),
      sessions: phase1Projection?.requiredSessions || [],
      isAttainable: phase1Projection?.isAttainable ?? true,
      maxAttainablePercentage: phase1Projection?.maxAttainablePercentage || 0,
      totalSemesterClassesRemaining: phase1Projection?.totalRemainingSemClasses || 0,
    },
    // Phase 2 summary (The planned absent classes)
    phase2: {
      bunkCount: bunks,
      bunkSessions,
      lastBunkDateStr: lastBunkDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      postBunkAttended: p2Attended,
      postBunkDelivered: p2Delivered,
      postBunkPercentage: Number(p2Percentage.toFixed(2)),
      percentageDrop: Number((p1Percentage - p2Percentage).toFixed(2)),
      isBelowRecoveryTarget,
      isBelow75,
    },
    // Phase 3 summary (Recovery roadmap)
    phase3: {
      classesNeeded: recoveryClassesNeeded,
      safeBunksRemaining,
      recoveryReachDateStr:
        recoveryProjection?.estimatedDate ||
        (recoveryClassesNeeded === 0
          ? "Maintained Safely"
          : recoveryProjection?.isAttainable === false
          ? `Exceeds Semester (Max: ${recoveryProjection?.maxAttainablePercentage || 0}% by 31 Oct)`
          : "Not Attainable within Semester"),
      rawRecoveryDate: recoveryProjection?.rawReachDate || null,
      recoverySessions: recoveryProjection?.requiredSessions || [],
      finalAttended,
      finalDelivered,
      finalPercentage: Number(finalPercentage.toFixed(2)),
      isAttainable: recoveryProjection ? recoveryProjection.isAttainable : true,
      maxAttainablePercentage: recoveryProjection?.maxAttainablePercentage || 0,
      totalSemesterClassesRemaining: recoveryProjection?.totalRemainingSemClasses || 0,
    },
  };
}

/**
 * Validate if a student belongs to the 2023 CSE Batch
 */
export function is2023CSEBatch(studentData, regNo = "") {
  const reg = String(studentData?.regNo || regNo || "").trim().toUpperCase();
  const rawBatch = String(studentData?.batch || "").trim();
  const rawBranch = String(studentData?.branch || studentData?.department || "").trim().toUpperCase();

  // If no info provided (unsearched guest)
  if (!reg && !rawBatch && !rawBranch) {
    return true;
  }

  // Check Registration Number (e.g. 230301120001, 23030112...)
  if (reg) {
    const isYear2023 = reg.startsWith("23");
    const isCSE = reg.includes("030112") || rawBranch.includes("CSE") || rawBranch.includes("COMPUTER") || !rawBranch;
    return isYear2023 && isCSE;
  }

  // Check batch and branch fields
  const isBatch2023 = rawBatch === "2023" || rawBatch.startsWith("2023") || rawBatch === "23";
  const isCSEBranch = rawBranch.includes("CSE") || rawBranch.includes("COMPUTER SCIENCE");

  return isBatch2023 && isCSEBranch;
}

/**
 * Automatically resolve and return the official University Subject Code (e.g. CUCS1014, CUCS1015, CUTM1020)
 * strictly and exclusively by cross-referencing:
 * 1. The Student's actual Degree Progress / Semester records (studentData.semesters[].subjects)
 * 2. The Official Branch Degree Progress Syllabus Baskets (B1, B2, B3, B4 Core & Electives, B5 Domains & Skills)
 */
export function resolveSubjectCode(period, studentData = null) {
  if (!period || period.isFree || !period.subject || period.subject === "No Class / Free") {
    return "";
  }

  // 1. Direct explicit period code if provided
  if (period.code && String(period.code).trim() && period.code !== "-") {
    return String(period.code).trim().toUpperCase();
  }

  const rawTarget = String(period.subject || period.subName || "").trim();
  const cleanTarget = cleanSubjectBaseName(rawTarget);
  if (!cleanTarget || cleanTarget === "Free" || cleanTarget === "No Class / Free") {
    return "";
  }

  const targetSubObj = { subName: cleanTarget };

  // 2. Strict Check: Student's Personal Degree Progress & Semester Records
  if (studentData) {
    if (Array.isArray(studentData.semesters)) {
      for (const sem of studentData.semesters) {
        if (Array.isArray(sem.subjects)) {
          for (const s of sem.subjects) {
            if (!s.subCode) continue;
            if (isMatch(targetSubObj, s)) {
              return String(s.subCode).trim().toUpperCase();
            }
          }
        }
      }
    }

    if (Array.isArray(studentData.subjects)) {
      for (const s of studentData.subjects) {
        if (!s.subCode) continue;
        if (isMatch(targetSubObj, s)) {
          return String(s.subCode).trim().toUpperCase();
        }
      }
    }
  }

  // 3. Strict Check: Official Branch Degree Progress Syllabus Baskets (Centurion University ERP Syllabus)
  const allDegreeProgressSyllabus = [
    ...BASKET_4_SYLLABUS,
    ...BASKET_1_SYLLABUS,
    ...BASKET_2_SYLLABUS,
    ...BASKET_3_SYLLABUS,
    ...COMMON_BASKET_5_SYLLABUS,
    ...BASKET_5_SKILL_COURSES,
  ];

  for (const s of allDegreeProgressSyllabus) {
    if (!s.subCode) continue;
    if (isMatch(targetSubObj, s)) {
      return String(s.subCode).trim().toUpperCase();
    }
  }

  // Check Basket 5 Domain Specialization Courses
  if (Array.isArray(BASKET_5_DOMAINS_DATA)) {
    for (const domain of BASKET_5_DOMAINS_DATA) {
      if (Array.isArray(domain.subjects)) {
        for (const s of domain.subjects) {
          if (!s.subCode) continue;
          if (isMatch(targetSubObj, s)) {
            return String(s.subCode).trim().toUpperCase();
          }
        }
      }
    }
  }

  return "";
}

export default {
  ALL_SECTIONS,
  DAYS_LIST,
  TIME_SLOTS,
  ACADEMIC_HOLIDAYS_2026_27,
  CUTM_ACADEMIC_CALENDAR_2026_27,
  CUTM_OPTIONAL_HOLIDAYS_RULES,
  cleanSubjectBaseName,
  getSectionSubjectCatalog,
  calculateAttendance,
  estimateTargetReachDate,
  simulateMissPenalty,
  simulateMultiPhaseAttendance,
  is2023CSEBatch,
  resolveSubjectCode,
  formatDateKey,
  getDayName,
  getDaySchedule,
  getHolidayInfo,
  getAcademicCalendarDateStatus,
  getLivePeriodStatus,
  getLiveScheduleOverview,
  isSecondSaturday,
  isSunday,
  normalizeSection,
};
