// GradeFlow Daily AI Screenshot Scan Limit Utility (2 Scans per student/day, resets at midnight 12:00 AM)
// Excluded from limits: Reg No 230301120327, Admin, Subadmin, and Superadmin accounts.

export const MAX_DAILY_SCANS = 2;

// List of registration numbers with permanent unlimited scan access (Only Master/Developer accounts)
export const UNLIMITED_REG_NOS = [
  "230301120327",
];

// Registry of one-time daily scan resets for specific normal students (resets their used count to 0 so they get fresh 2 scans today)
export const TODAY_RESET_REG_NOS = {
  "230301120320": "2026-09-19_v1",
};

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

  return false;
}

export function getTodayDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function resetStudentScanQuotaLocal(studentId = "") {
  if (typeof window === "undefined") return;
  const cleanId = String(studentId || "").trim().toLowerCase();
  const todayKey = getTodayDateKey();
  const storageKey = `gradeflow_ocr_scans_${cleanId}_${todayKey}`;
  try {
    localStorage.removeItem(storageKey);
    window.dispatchEvent(new CustomEvent("gradeflow_scan_limit_updated", { detail: { newCount: 0, studentId } }));
  } catch (err) {
    console.warn("Could not reset daily scan count locally:", err);
  }
}

export async function fetchServerScanQuota(studentId = "", userRole = "", isAdminToken = false, API = "/api") {
  if (isExemptFromScanLimit(studentId, userRole, isAdminToken)) {
    return {
      used: 0,
      max: Infinity,
      remaining: Infinity,
      isLimitReached: false,
      isExempt: true,
      todayKey: getTodayDateKey(),
    };
  }

  const cleanId = String(studentId || "").trim().toLowerCase();
  if (!cleanId) return getDailyScanStatus(studentId, userRole, isAdminToken);

  try {
    const res = await fetch(`${API}/attendance/scan-quota?studentId=${cleanId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        const todayKey = data.todayKey || getTodayDateKey();
        const storageKey = `gradeflow_ocr_scans_${cleanId}_${todayKey}`;
        const serverUsed = Math.max(0, parseInt(data.used, 10) || 0);

        // Sync with localStorage
        try {
          if (typeof window !== "undefined") {
            const localRaw = localStorage.getItem(storageKey);
            const localUsed = Math.max(0, parseInt(localRaw, 10) || 0);
            // If server reports fewer scans (e.g. admin reset it to 0), accept server state
            if (serverUsed < localUsed || localRaw === null) {
              localStorage.setItem(storageKey, String(serverUsed));
              window.dispatchEvent(new CustomEvent("gradeflow_scan_limit_updated", { detail: { newCount: serverUsed, studentId } }));
            }
          }
        } catch {}

        return {
          used: serverUsed,
          max: MAX_DAILY_SCANS,
          remaining: Math.max(0, MAX_DAILY_SCANS - serverUsed),
          isLimitReached: serverUsed >= MAX_DAILY_SCANS,
          isExempt: false,
          todayKey,
        };
      }
    }
  } catch (err) {
    console.warn("[ScanQuota] Could not fetch server quota, falling back to local:", err.message);
  }

  return getDailyScanStatus(studentId, userRole, isAdminToken);
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

  // One-time today reset grant for normal students whose limit was reached
  if (TODAY_RESET_REG_NOS[cleanId]) {
    const grantToken = `gradeflow_reset_grant_${cleanId}_${TODAY_RESET_REG_NOS[cleanId]}`;
    try {
      if (!localStorage.getItem(grantToken)) {
        localStorage.removeItem(storageKey);
        localStorage.setItem(grantToken, "applied");
      }
    } catch {}
  }

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
