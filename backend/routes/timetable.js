const express = require("express");
const router = express.Router();
const TimetableSchedule = require("../models/TimetableSchedule");
const AcademicCalendar = require("../models/AcademicCalendar");
const AcademicHoliday = require("../models/AcademicHoliday");
const { protect } = require("../middleware/auth");

// ═════════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS (For students looking up timetable)
// ═════════════════════════════════════════════════════════════════

// 1. Get Schedule for a specific Batch, Branch, and Section
router.get("/schedule", async (req, res) => {
  try {
    const { batch, branch, section } = req.query;

    const query = { isActive: true };
    if (batch && batch !== "ALL") query.batch = { $in: [batch, "ALL"] };
    if (branch && branch !== "ALL") query.branch = { $in: [branch.toUpperCase(), "ALL"] };
    if (section && section !== "ALL") query.section = { $in: [section.toUpperCase(), "ALL"] };

    const schedules = await TimetableSchedule.find(query).sort({ updatedAt: -1 });

    // Find best match (exact section > section ALL)
    let bestMatch = null;
    if (schedules.length > 0) {
      bestMatch =
        schedules.find(
          (s) => s.section === (section || "").toUpperCase() && s.batch === batch
        ) ||
        schedules.find((s) => s.section === (section || "").toUpperCase()) ||
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
router.get("/active-all", async (req, res) => {
  try {
    const schedules = await TimetableSchedule.find({ isActive: true }).sort({
      batch: -1,
      section: 1,
    });
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
router.post("/admin/schedule/save", protect, async (req, res) => {
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
router.get("/admin/schedule/list", protect, async (req, res) => {
  try {
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
router.delete("/admin/schedule/:id", protect, async (req, res) => {
  try {
    const deleted = await TimetableSchedule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Schedule not found." });
    }
    res.json({ success: true, message: "Timetable schedule deleted successfully." });
  } catch (err) {
    console.error("Admin delete timetable error:", err);
    res.status(500).json({ success: false, message: "Failed to delete schedule." });
  }
});

// 8. Admin: Save or Update Academic Calendar
router.post("/admin/calendar/save", protect, async (req, res) => {
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
router.post("/admin/holidays/save", protect, async (req, res) => {
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

module.exports = router;
