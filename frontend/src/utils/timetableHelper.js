import timetableData from "../data/timetableData.json";

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
    return {
      isHoliday: matchedHoliday.type !== "observation",
      isObservation: matchedHoliday.type === "observation",
      title: matchedHoliday.name,
      type: matchedHoliday.type,
      color: matchedHoliday.color,
      bg: matchedHoliday.bg,
      description: matchedHoliday.type === "observation"
        ? `Official University Observation Day: ${matchedHoliday.name}`
        : `University Academic Holiday: ${matchedHoliday.name}`,
    };
  }

  // 2. Check Sunday Weekend Holiday
  if (isSunday(d)) {
    return {
      isHoliday: true,
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
  const normSec = normalizeSection(section);
  const secData = timetableData[normSec] || timetableData["CSE-A"];
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

export default {
  ALL_SECTIONS,
  DAYS_LIST,
  TIME_SLOTS,
  ACADEMIC_HOLIDAYS_2026_27,
  formatDateKey,
  getDayName,
  getDaySchedule,
  getHolidayInfo,
  getLivePeriodStatus,
  getLiveScheduleOverview,
  isSecondSaturday,
  isSunday,
  normalizeSection,
};
