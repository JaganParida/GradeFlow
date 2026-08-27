// GradeFlow Daily AI Screenshot Scan Limit Utility (2 Scans per student/day, resets at midnight 12:00 AM)

export const MAX_DAILY_SCANS = 2;

export function getTodayDateKey(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyScanStatus(studentId = "") {
  if (typeof window === "undefined") {
    return {
      used: 0,
      max: MAX_DAILY_SCANS,
      remaining: MAX_DAILY_SCANS,
      isLimitReached: false,
      todayKey: getTodayDateKey(),
    };
  }
  const cleanId = String(studentId || "default_student").trim().toLowerCase();
  const todayKey = getTodayDateKey();
  const storageKey = `gradeflow_ocr_scans_${cleanId}_${todayKey}`;

  const raw = localStorage.getItem(storageKey);
  const used = Math.max(0, parseInt(raw, 10) || 0);
  const remaining = Math.max(0, MAX_DAILY_SCANS - used);
  const isLimitReached = used >= MAX_DAILY_SCANS;

  return {
    used,
    max: MAX_DAILY_SCANS,
    remaining,
    isLimitReached,
    todayKey,
    storageKey,
  };
}

export function incrementDailyScanCount(studentId = "") {
  if (typeof window === "undefined") return 1;
  const { storageKey, used } = getDailyScanStatus(studentId);
  const newCount = used + 1;
  try {
    localStorage.setItem(storageKey, String(newCount));
    window.dispatchEvent(new CustomEvent("gradeflow_scan_limit_updated", { detail: { newCount, studentId } }));
  } catch (err) {
    console.warn("Could not save daily scan count to localStorage:", err);
  }
  return newCount;
}
