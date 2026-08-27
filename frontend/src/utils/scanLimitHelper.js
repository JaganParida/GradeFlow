// GradeFlow Daily AI Screenshot Scan Limit Utility (2 Scans per student/day, resets at midnight 12:00 AM)
// Excluded from limits: Reg No 230301120327, Admin, Subadmin, and Superadmin accounts.

export const MAX_DAILY_SCANS = 2;

// List of registration numbers with permanent unlimited scan access
export const UNLIMITED_REG_NOS = [
  "230301120327",
];

export function isExemptFromScanLimit(studentId = "", userRole = "", isAdminToken = false) {
  if (Boolean(isAdminToken)) return true;

  const cleanId = String(studentId || "").trim().toLowerCase();
  if (UNLIMITED_REG_NOS.some((reg) => reg.toLowerCase() === cleanId)) {
    return true;
  }

  const cleanRole = String(userRole || "").trim().toLowerCase();
  if (["admin", "subadmin", "superadmin", "faculty"].includes(cleanRole)) {
    return true;
  }

  // Also check if admin / privileged session is active in browser storage
  if (typeof window !== "undefined") {
    try {
      const sessionCache = localStorage.getItem("gf_student_session_cache");
      if (sessionCache) {
        const parsed = JSON.parse(sessionCache);
        const cachedRole = String(parsed?.role || "").toLowerCase();
        const cachedReg = String(parsed?.regNo || "").toLowerCase();

        if (["admin", "subadmin", "superadmin"].includes(cachedRole)) {
          return true;
        }
        if (UNLIMITED_REG_NOS.some((reg) => reg.toLowerCase() === cachedReg)) {
          return true;
        }
      }
    } catch {}
  }

  return false;
}

export function getTodayDateKey(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyScanStatus(studentId = "", userRole = "", isAdminToken = false) {
  const isExempt = isExemptFromScanLimit(studentId, userRole, isAdminToken);

  if (isExempt) {
    return {
      used: 0,
      max: Infinity,
      remaining: Infinity,
      isLimitReached: false,
      isExempt: true,
      todayKey: getTodayDateKey(),
      storageKey: "",
    };
  }

  if (typeof window === "undefined") {
    return {
      used: 0,
      max: MAX_DAILY_SCANS,
      remaining: MAX_DAILY_SCANS,
      isLimitReached: false,
      isExempt: false,
      todayKey: getTodayDateKey(),
      storageKey: "",
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
    isExempt: false,
    todayKey,
    storageKey,
  };
}

export function incrementDailyScanCount(studentId = "", userRole = "", isAdminToken = false) {
  if (isExemptFromScanLimit(studentId, userRole, isAdminToken)) {
    return 0; // Excluded users have unlimited scans without incrementing
  }
  if (typeof window === "undefined") return 1;
  const { storageKey, used } = getDailyScanStatus(studentId, userRole, isAdminToken);
  const newCount = used + 1;
  try {
    localStorage.setItem(storageKey, String(newCount));
    window.dispatchEvent(new CustomEvent("gradeflow_scan_limit_updated", { detail: { newCount, studentId } }));
  } catch (err) {
    console.warn("Could not save daily scan count to localStorage:", err);
  }
  return newCount;
}
