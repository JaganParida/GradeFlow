const express = require("express");
const router = express.Router();
const TimetableSchedule = require("../models/TimetableSchedule");
const AcademicCalendar = require("../models/AcademicCalendar");
const AcademicHoliday = require("../models/AcademicHoliday");
const { protect } = require("../middleware/auth");
const { requirePermission } = require("../middleware/rbac");
const { publicLimiter } = require("../middleware/rateLimiters");
const { globalDbQueue } = require("../utils/dbProtection");

function getSectionVariants(sec) {
  if (!sec) return [];
  const s = String(sec).trim().toUpperCase();
  const bare = s.replace(/^CSE-?/i, "").replace(/^SEC\s*/i, "").trim();
  return Array.from(new Set([s, bare, `CSE-${bare}`, `SEC ${bare}`, `SECTION ${bare}`, "ALL"]));
}

// ═════════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS (For students looking up timetable)
// ═════════════════════════════════════════════════════════════════

// 1. Get Schedule for a specific Batch, Branch, and Section
router.get("/schedule", publicLimiter, async (req, res) => {
  try {
    if (req.query._t || req.headers["cache-control"]?.includes("no-cache")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    } else {
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    }
    const { batch, branch, section } = req.query;

    if (branch && branch !== "ALL" && branch.toUpperCase() !== "CSE") {
      return res.status(403).json({
        success: false,
        found: false,
        message: "Class routine and weekly matrix are restricted to Computer Science & Engineering (CSE) students.",
        code: "BRANCH_NOT_ALLOWED"
      });
    }

    const query = { isActive: true };
    if (batch && batch !== "ALL") query.batch = { $in: [batch, "ALL"] };
    if (branch && branch !== "ALL") query.branch = { $in: [branch.toUpperCase(), "ALL"] };
    if (section && section !== "ALL") {
      query.section = { $in: getSectionVariants(section) };
    }

    const schedules = await globalDbQueue.run(() =>
      TimetableSchedule.find(query).sort({ updatedAt: -1 })
    );

    // Find best match (exact section > section ALL)
    let bestMatch = null;
    if (schedules.length > 0) {
      const variants = getSectionVariants(section);
      bestMatch =
        schedules.find(
          (s) => variants.includes((s.section || "").toUpperCase()) && s.batch === batch
        ) ||
        schedules.find((s) => variants.includes((s.section || "").toUpperCase())) ||
        schedules[0];
    }

    res.json({
      success: true,
      found: !!bestMatch,
      schedule: bestMatch,
    });
  } catch (err) {
    console.error("Error fetching timetable schedule:", err);
    res.status(500).json({ success: false, message: "Server error fetching timetable." });
  }
});

// 2. Get All Active Schedules (Map of batch/section -> schedule)
router.get("/active-all", publicLimiter, async (req, res) => {
  try {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    const schedules = await globalDbQueue.run(() =>
      TimetableSchedule.find({ isActive: true }).sort({
        batch: -1,
        section: 1,
      })
    );
    res.json({
      success: true,
      count: schedules.length,
      schedules,
    });
  } catch (err) {
    console.error("Error fetching all active schedules:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// 2.5 Get Consolidated Timetable Bundle (Schedules + Calendar + Holidays)
router.get("/bundle", publicLimiter, async (req, res) => {
  try {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    const { academicYear } = req.query;
    const calQuery = { isActive: true };
    if (academicYear) calQuery.academicYear = academicYear;
    const holQuery = { isActive: true };
    if (academicYear) holQuery.academicYear = academicYear;

    const [schedules, calendars, holidayDoc] = await Promise.all([
      globalDbQueue.run(() => TimetableSchedule.find({ isActive: true }).sort({ batch: -1, section: 1 }).lean()),
      globalDbQueue.run(() => AcademicCalendar.find(calQuery).sort({ updatedAt: -1 }).lean()),
      globalDbQueue.run(() => AcademicHoliday.findOne(holQuery).sort({ updatedAt: -1 }).lean()),
    ]);

    const latestTs = Math.max(
      ...schedules.map((s) => (s.updatedAt ? new Date(s.updatedAt).getTime() : 0)),
      ...calendars.map((c) => (c.updatedAt ? new Date(c.updatedAt).getTime() : 0)),
      holidayDoc?.updatedAt ? new Date(holidayDoc.updatedAt).getTime() : 0,
      0
    );
    const etag = `W/"tt-bundle-${latestTs}-${schedules.length}"`;

    if (req.headers["if-none-match"] === etag) {
      res.setHeader("ETag", etag);
      return res.status(304).end();
    }

    res.setHeader("ETag", etag);
    res.json({
      success: true,
      etag,
      timestamp: Date.now(),
      count: schedules.length,
      schedules,
      calendars,
      holidayDoc,
    });
  } catch (err) {
    console.error("Error fetching timetable bundle:", err);
    res.status(500).json({ success: false, message: "Server error fetching timetable bundle." });
  }
});

// 3. Get Active Academic Calendar
router.get("/calendar", async (req, res) => {
  try {
    const { academicYear } = req.query;
    const query = { isActive: true };
    if (academicYear) query.academicYear = academicYear;

    const calendars = await AcademicCalendar.find(query).sort({ updatedAt: -1 });
    res.json({
      success: true,
      calendars,
    });
  } catch (err) {
    console.error("Error fetching academic calendar:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// 4. Get Active Holidays List
router.get("/holidays", async (req, res) => {
  try {
    const { academicYear } = req.query;
    const query = { isActive: true };
    if (academicYear) query.academicYear = academicYear;

    const holidayDoc = await AcademicHoliday.findOne(query).sort({ updatedAt: -1 });
    res.json({
      success: true,
      holidayDoc,
    });
  } catch (err) {
    console.error("Error fetching academic holidays:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ═════════════════════════════════════════════════════════════════
// ADMIN PROTECTED ENDPOINTS (For Timetable & Calendar Management)
// ═════════════════════════════════════════════════════════════════

// 5. Admin: Save or Update Timetable Schedule
router.post("/admin/schedule/save", protect, requirePermission("timetable.manage", "timetable"), async (req, res) => {
  try {
    const { batch, branch, year, semester, section, title, schedule } = req.body;

    if (!batch || !branch || !section || !schedule) {
      return res.status(400).json({
        success: false,
        message: "Batch, branch, section, and schedule matrix are required.",
      });
    }

    const normalizedBatch = String(batch).trim();
    const normalizedBranch = String(branch).trim().toUpperCase();
    const normalizedSection = String(section).trim().toUpperCase();

    // Upsert or create new active schedule
    const existing = await TimetableSchedule.findOne({
      batch: normalizedBatch,
      branch: normalizedBranch,
      section: normalizedSection,
    });

    if (existing) {
      existing.year = year || existing.year;
      existing.semester = semester || existing.semester;
      existing.title = title || `${normalizedBranch} Sec ${normalizedSection} (Batch ${normalizedBatch})`;
      existing.schedule = schedule;
      existing.isActive = true;
      existing.uploadedAt = new Date();
      existing.uploadedBy = req.admin?.email || "Admin";
      await existing.save();

      try {
        const { publishAdminRealtimeEvent, broadcastRealtimeEvent } = require("../utils/ablyService");
        await Promise.allSettled([
          publishAdminRealtimeEvent("timetable-updated", { timestamp: Date.now() }),
          broadcastRealtimeEvent("timetable-updated", { timestamp: Date.now() }),
        ]);
      } catch (e) {
        console.warn("[Ably] Timetable updated publish warning:", e?.message || e);
      }

      return res.json({
        success: true,
        message: `Updated timetable for ${normalizedSection} (Batch ${normalizedBatch}) successfully.`,
        schedule: existing,
      });
    }

    const newSchedule = await TimetableSchedule.create({
      batch: normalizedBatch,
      branch: normalizedBranch,
      year: year || "3",
      semester: semester || "6",
      section: normalizedSection,
      title: title || `${normalizedBranch} Sec ${normalizedSection} (Batch ${normalizedBatch})`,
      schedule,
      isActive: true,
      uploadedBy: req.admin?.email || "Admin",
    });

    try {
      const { publishAdminRealtimeEvent, broadcastRealtimeEvent } = require("../utils/ablyService");
      await Promise.allSettled([
        publishAdminRealtimeEvent("timetable-updated", { timestamp: Date.now() }),
        broadcastRealtimeEvent("timetable-updated", { timestamp: Date.now() }),
      ]);
    } catch (e) {
      console.warn("[Ably] Timetable updated publish warning:", e?.message || e);
    }

    res.json({
      success: true,
      message: `Published new timetable for ${normalizedSection} (Batch ${normalizedBatch}) successfully.`,
      schedule: newSchedule,
    });
  } catch (err) {
    console.error("Admin save timetable error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to save timetable." });
  }
});

// 6. Admin: List All Timetable Schedules
router.get("/admin/schedule/list", protect, requirePermission("timetable.manage", "timetable"), async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const schedules = await TimetableSchedule.find().sort({ updatedAt: -1 });
    res.json({
      success: true,
      count: schedules.length,
      schedules,
    });
  } catch (err) {
    console.error("Admin list timetable error:", err);
    res.status(500).json({ success: false, message: "Failed to list schedules." });
  }
});

// 7. Admin: Delete / Deactivate Timetable Schedule
router.delete("/admin/schedule/:id", protect, requirePermission("timetable.manage", "timetable"), async (req, res) => {
  try {
    const deleted = await TimetableSchedule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Schedule not found." });
    }

    try {
      const { publishAdminRealtimeEvent, broadcastRealtimeEvent } = require("../utils/ablyService");
      await Promise.allSettled([
        publishAdminRealtimeEvent("timetable-updated", { timestamp: Date.now() }),
        broadcastRealtimeEvent("timetable-updated", { timestamp: Date.now() }),
      ]);
    } catch (e) {
      console.warn("[Ably] Timetable updated publish warning:", e?.message || e);
    }

    res.json({ success: true, message: "Timetable schedule deleted successfully." });
  } catch (err) {
    console.error("Admin delete timetable error:", err);
    res.status(500).json({ success: false, message: "Failed to delete schedule." });
  }
});

// 8. Admin: Save or Update Academic Calendar
router.post("/admin/calendar/save", protect, requirePermission("timetable.manage", "timetable"), async (req, res) => {
  try {
    const { academicYear, semesterType, title, semestersLabel, activities } = req.body;

    if (!semesterType || !activities || !Array.isArray(activities)) {
      return res.status(400).json({
        success: false,
        message: "semesterType and activities array are required.",
      });
    }

    const year = academicYear || "2026-27";
    const existing = await AcademicCalendar.findOne({
      academicYear: year,
      semesterType,
    });

    if (existing) {
      existing.title = title || existing.title;
      existing.semestersLabel = semestersLabel || existing.semestersLabel;
      existing.activities = activities;
      existing.uploadedAt = new Date();
      existing.uploadedBy = req.admin?.email || "Admin";
      await existing.save();

      return res.json({
        success: true,
        message: `Updated ${semesterType} semester academic calendar successfully.`,
        calendar: existing,
      });
    }

    const newCalendar = await AcademicCalendar.create({
      academicYear: year,
      semesterType,
      title: title || `${semesterType.toUpperCase()} Semester Calendar (${year})`,
      semestersLabel: semestersLabel || "",
      activities,
      uploadedBy: req.admin?.email || "Admin",
    });

    res.json({
      success: true,
      message: `Published ${semesterType} semester academic calendar successfully.`,
      calendar: newCalendar,
    });
  } catch (err) {
    console.error("Admin save calendar error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to save calendar." });
  }
});

// 9. Admin: Save or Update Holidays List
router.post("/admin/holidays/save", protect, requirePermission("timetable.manage", "timetable"), async (req, res) => {
  try {
    const { academicYear, title, holidays, optionalRules } = req.body;

    if (!holidays || !Array.isArray(holidays)) {
      return res.status(400).json({
        success: false,
        message: "Holidays array is required.",
      });
    }

    const year = academicYear || "2026-27";
    let holidayDoc = await AcademicHoliday.findOne({ academicYear: year });

    if (holidayDoc) {
      holidayDoc.title = title || holidayDoc.title;
      holidayDoc.holidays = holidays;
      if (optionalRules) holidayDoc.optionalRules = optionalRules;
      holidayDoc.uploadedAt = new Date();
      holidayDoc.uploadedBy = req.admin?.email || "Admin";
      await holidayDoc.save();

      return res.json({
        success: true,
        message: `Updated academic holidays list for ${year} successfully.`,
        holidayDoc,
      });
    }

    holidayDoc = await AcademicHoliday.create({
      academicYear: year,
      title: title || `CUTM Academic Session ${year} Holidays List`,
      holidays,
      optionalRules: optionalRules || undefined,
      uploadedBy: req.admin?.email || "Admin",
    });

    res.json({
      success: true,
      message: `Published academic holidays list for ${year} successfully.`,
      holidayDoc,
    });
  } catch (err) {
    console.error("Admin save holidays error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to save holidays." });
  }
});

// 10. Admin: Save or Update Emergency Class Suspension / Holiday Override
router.post("/admin/suspension/save", protect, requirePermission("timetable.manage", "timetable"), async (req, res) => {
  try {
    const { academicYear, date, title, category, description, affectedSections } = req.body;

    if (!date || !title) {
      return res.status(400).json({
        success: false,
        message: "Date and suspension title/reason are required.",
      });
    }

    const year = academicYear || "2026-27";
    let holidayDoc = await AcademicHoliday.findOne({ academicYear: year });
    if (!holidayDoc) {
      holidayDoc = new AcademicHoliday({
        academicYear: year,
        title: `CUTM Academic Session ${year} Holidays List`,
        holidays: [],
        uploadedBy: req.admin?.email || "Admin",
      });
    }

    const d = new Date(date + "T00:00:00");
    const dayName = isNaN(d.getTime())
      ? "Day"
      : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];

    const cleanSections = Array.isArray(affectedSections) && affectedSections.length > 0
      ? affectedSections.map((s) => String(s).trim().toUpperCase())
      : ["ALL"];

    const cleanCategory = String(category || "emergency").toLowerCase();

    // Color/bg theme by category
    let color = "#dc2626";
    let bg = "#fef2f2";
    if (cleanCategory.includes("cyclone") || cleanCategory.includes("weather")) {
      color = "#ea580c";
      bg = "#fff7ed";
    } else if (cleanCategory.includes("protest")) {
      color = "#b91c1c";
      bg = "#fef2f2";
    } else if (cleanCategory.includes("admin")) {
      color = "#4338ca";
      bg = "#eef2ff";
    }

    const suspensionItem = {
      slNo: (holidayDoc.holidays?.length || 0) + 1,
      title: String(title).trim(),
      date: String(date).trim(),
      day: dayName,
      type: "suspension",
      isOptional: false,
      isObservation: false,
      isSuspension: true,
      category: cleanCategory,
      affectedSections: cleanSections,
      color,
      bg,
      description: String(description || `Classes suspended on ${date} as per administrative notice. Counted as non-instructional holiday.`).trim(),
    };

    // Update existing if date matches or append
    const existingIdx = (holidayDoc.holidays || []).findIndex((h) => h.date === suspensionItem.date);
    if (existingIdx !== -1) {
      holidayDoc.holidays[existingIdx] = {
        ...(holidayDoc.holidays[existingIdx]?.toObject?.() || holidayDoc.holidays[existingIdx]),
        ...suspensionItem,
      };
    } else {
      holidayDoc.holidays.push(suspensionItem);
    }

    holidayDoc.uploadedAt = new Date();
    holidayDoc.uploadedBy = req.admin?.email || "Admin";
    await holidayDoc.save();

    try {
      const { publishAdminRealtimeEvent, broadcastRealtimeEvent } = require("../utils/ablyService");
      await Promise.allSettled([
        publishAdminRealtimeEvent("timetable-updated", { timestamp: Date.now() }),
        broadcastRealtimeEvent("timetable-updated", { timestamp: Date.now() }),
        publishAdminRealtimeEvent("admin-cache-invalidate", { scope: "attendance", timestamp: Date.now() }),
      ]);
    } catch (e) {
      console.warn("[Ably] Timetable suspension update publish warning:", e?.message || e);
    }

    res.json({
      success: true,
      message: `Class suspension for ${date} published successfully. All selected sections will treat this date as a holiday.`,
      suspension: suspensionItem,
      holidayDoc,
    });
  } catch (err) {
    console.error("Admin save suspension error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to save class suspension." });
  }
});

// 11. Admin: Delete Class Suspension / Holiday Override
router.post("/admin/suspension/delete", protect, requirePermission("timetable.manage", "timetable"), async (req, res) => {
  try {
    const { academicYear, date } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required to delete suspension." });
    }

    const year = academicYear || "2026-27";
    const holidayDoc = await AcademicHoliday.findOne({ academicYear: year });
    if (!holidayDoc) {
      return res.status(404).json({ success: false, message: "Holidays record not found." });
    }

    const initialLen = holidayDoc.holidays.length;
    holidayDoc.holidays = holidayDoc.holidays.filter((h) => h.date !== date || (!h.isSuspension && h.type !== "suspension"));

    if (holidayDoc.holidays.length === initialLen) {
      return res.status(404).json({ success: false, message: "No suspension found for specified date." });
    }

    holidayDoc.uploadedAt = new Date();
    holidayDoc.uploadedBy = req.admin?.email || "Admin";
    await holidayDoc.save();

    try {
      const { publishAdminRealtimeEvent, broadcastRealtimeEvent } = require("../utils/ablyService");
      await Promise.allSettled([
        publishAdminRealtimeEvent("timetable-updated", { timestamp: Date.now() }),
        broadcastRealtimeEvent("timetable-updated", { timestamp: Date.now() }),
        publishAdminRealtimeEvent("admin-cache-invalidate", { scope: "attendance", timestamp: Date.now() }),
      ]);
    } catch (e) {
      console.warn("[Ably] Timetable suspension delete publish warning:", e?.message || e);
    }

    res.json({
      success: true,
      message: `Suspension on ${date} removed successfully. Regular classes restored.`,
    });
  } catch (err) {
    console.error("Admin delete suspension error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to delete suspension." });
  }
});

// 12. Admin: List All Suspensions
router.get("/admin/suspension/list", protect, requirePermission("timetable.manage", "timetable"), async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const { academicYear } = req.query;
    const year = academicYear || "2026-27";
    const holidayDoc = await AcademicHoliday.findOne({ academicYear: year });
    const suspensions = (holidayDoc?.holidays || []).filter(
      (h) => h.isSuspension || h.type === "suspension"
    );
    res.json({
      success: true,
      count: suspensions.length,
      suspensions,
    });
  } catch (err) {
    console.error("Admin list suspension error:", err);
    res.status(500).json({ success: false, message: "Failed to list suspensions." });
  }
});

module.exports = router;
