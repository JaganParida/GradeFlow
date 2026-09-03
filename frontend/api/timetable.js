const connectToDatabase = require("./_lib/db");
const TimetableSchedule = require("./_lib/models/TimetableSchedule");
const AcademicCalendar = require("./_lib/models/AcademicCalendar");
const AcademicHoliday = require("./_lib/models/AcademicHoliday");
const SubAdminSession = require("./_lib/models/SubAdminSession");
const SubAdmin = require("./_lib/models/SubAdmin");
const AdminSession = require("./_lib/models/AdminSession");
const jwt = require("jsonwebtoken");
const { isAdminSessionValid, touchAdminSession } = require("./_lib/sessionManager");

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, x-admin-token",
};

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = rest.join("=");
  });
  return cookies;
}

async function authenticateAdmin(req) {
  const cookies = parseCookies(req.headers.cookie);
  let token = req.headers["x-admin-token"];
  if (!token && cookies.jwt && cookies.jwt !== "none") {
    token = cookies.jwt;
  }
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || token === "none") {
    return { error: { status: 401, message: "Not authorized, no administrative session found.", code: "AUTH_REQUIRED" } };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.role === "student" || decoded.regNo) {
      return { error: { status: 403, message: "Forbidden: Administrative access restricted.", code: "STUDENT_ADMIN_ACCESS_FORBIDDEN" } };
    }

    if (decoded.adminType === "subadmin") {
      if (decoded.sessionId) {
        const session = await SubAdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
        if (!session) {
          return { error: { status: 401, message: "Sub-Admin session ended because this device was logged out.", code: "ADMIN_SESSION_TERMINATED" } };
        }
      }
      const subAdmin = await SubAdmin.findById(decoded.subAdminId);
      if (!subAdmin) {
        return { error: { status: 403, message: "Sub-Admin account not found.", code: "SUBADMIN_NOT_FOUND" } };
      }
      if (subAdmin.status !== "active") {
        return { error: { status: 403, message: `Sub-Admin account is ${subAdmin.status}.`, code: `SUBADMIN_${subAdmin.status.toUpperCase()}` } };
      }
      return {
        admin: {
          role: "admin",
          adminType: "subadmin",
          id: subAdmin._id,
          name: subAdmin.name,
          email: subAdmin.email,
          permissions: subAdmin.permissions || { routes: [], actions: [] },
          sessionId: decoded.sessionId,
        },
      };
    }

    // Main Admin: Authoritative MongoDB session validation
    if (!decoded.sessionId) {
      return {
        error: {
          status: 401,
          message: "Administrative session token invalid or missing session identifier.",
          code: "AUTH_SESSION_INVALID",
        },
      };
    }

    const session = await AdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
    if (!session || !isAdminSessionValid(session)) {
      return {
        error: {
          status: 401,
          message: "Admin session ended because this device was logged out.",
          code: "ADMIN_SESSION_TERMINATED",
        },
      };
    }

    await touchAdminSession(session);

    return {
      admin: {
        role: "admin",
        adminType: "main",
        email: decoded.email || process.env.ADMIN_EMAIL,
        permissions: { routes: ["*"], actions: ["*"] },
        sessionId: session.sessionId,
      },
    };
  } catch {
    return { error: { status: 401, message: "Not authorized, invalid admin token.", code: "INVALID_ADMIN_TOKEN" } };
  }
}

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const action = req.query.action || "";
    const cleanUrl = req.url || "";

    // For administrative routes, authenticate first before connecting to database
    if (action.startsWith("admin-") || cleanUrl.includes("/admin")) {
      const auth = await authenticateAdmin(req);
      if (auth.error) return res.status(auth.error.status).json(auth.error);
      req.adminAuth = auth;
    }

    await connectToDatabase();

    // 1. GET /api/timetable/schedule
    if (action === "schedule" || (cleanUrl.includes("/timetable/schedule") && !cleanUrl.includes("admin"))) {
      const { batch, branch, section } = req.query;
      const query = { isActive: true };
      if (batch && batch !== "ALL") query.batch = { $in: [batch, "ALL"] };
      if (branch && branch !== "ALL") query.branch = { $in: [branch.toUpperCase(), "ALL"] };
      if (section && section !== "ALL") query.section = { $in: [section.toUpperCase(), "ALL"] };

      const schedules = await TimetableSchedule.find(query).sort({ updatedAt: -1 });
      let bestMatch = null;
      if (schedules.length > 0) {
        bestMatch =
          schedules.find((s) => s.section === (section || "").toUpperCase() && s.batch === batch) ||
          schedules.find((s) => s.section === (section || "").toUpperCase()) ||
          schedules[0];
      }

      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return res.json({ success: true, found: !!bestMatch, schedule: bestMatch });
    }

    // 2. GET /api/timetable/active-all
    if (action === "active-all" || cleanUrl.includes("/timetable/active-all")) {
      const schedules = await TimetableSchedule.find({ isActive: true }).sort({ batch: -1, section: 1 });
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return res.json({ success: true, count: schedules.length, schedules });
    }

    // 3. GET /api/timetable/calendar
    if (action === "calendar" && req.method === "GET") {
      const { academicYear } = req.query;
      const query = { isActive: true };
      if (academicYear) query.academicYear = academicYear;
      const calendars = await AcademicCalendar.find(query).sort({ updatedAt: -1 });
      return res.json({ success: true, calendars });
    }

    // 4. GET /api/timetable/holidays
    if (action === "holidays" && req.method === "GET") {
      const { academicYear } = req.query;
      const query = { isActive: true };
      if (academicYear) query.academicYear = academicYear;
      const holidayDoc = await AcademicHoliday.findOne(query).sort({ updatedAt: -1 });
      return res.json({ success: true, holidayDoc });
    }

    // ── ADMIN PROTECTED ROUTES ──

    // 5. GET /api/timetable/admin/schedule/list
    if (action === "admin-schedule-list" || cleanUrl.includes("/admin/schedule/list")) {
      const auth = await authenticateAdmin(req);
      if (auth.error) return res.status(auth.error.status).json(auth.error);

      const schedules = await TimetableSchedule.find().sort({ updatedAt: -1 });
      return res.json({ success: true, count: schedules.length, schedules });
    }

    // 6. POST /api/timetable/admin/schedule/save
    if (action === "admin-schedule-save" || (cleanUrl.includes("/admin/schedule/save") && req.method === "POST")) {
      const auth = await authenticateAdmin(req);
      if (auth.error) return res.status(auth.error.status).json(auth.error);

      const { batch, branch, year, semester, section, title, schedule } = req.body || {};
      if (!batch || !branch || !section || !schedule) {
        return res.status(400).json({ success: false, message: "Batch, branch, section, and schedule matrix are required." });
      }

      const normalizedBatch = String(batch).trim();
      const normalizedBranch = String(branch).trim().toUpperCase();
      const normalizedSection = String(section).trim().toUpperCase();

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
        existing.uploadedBy = auth.admin.email || "Admin";
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
        uploadedBy: auth.admin.email || "Admin",
      });

      return res.json({
        success: true,
        message: `Published new timetable for ${normalizedSection} (Batch ${normalizedBatch}) successfully.`,
        schedule: newSchedule,
      });
    }

    // 7. DELETE /api/timetable/admin/schedule/:id
    if (action === "admin-schedule-delete" || (cleanUrl.includes("/admin/schedule/") && req.method === "DELETE")) {
      const auth = await authenticateAdmin(req);
      if (auth.error) return res.status(auth.error.status).json(auth.error);

      const id = req.query.id || cleanUrl.split("/").pop();
      const deleted = await TimetableSchedule.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Schedule not found." });
      }
      return res.json({ success: true, message: "Timetable schedule deleted successfully." });
    }

    // 8. POST /api/timetable/admin/calendar/save
    if (action === "admin-calendar-save" || (cleanUrl.includes("/admin/calendar/save") && req.method === "POST")) {
      const auth = await authenticateAdmin(req);
      if (auth.error) return res.status(auth.error.status).json(auth.error);

      const { academicYear, semesterType, title, semestersLabel, activities } = req.body || {};
      if (!semesterType || !activities || !Array.isArray(activities)) {
        return res.status(400).json({ success: false, message: "semesterType and activities array are required." });
      }

      const year = academicYear || "2026-27";
      const existing = await AcademicCalendar.findOne({ academicYear: year, semesterType });

      if (existing) {
        existing.title = title || existing.title;
        existing.semestersLabel = semestersLabel || existing.semestersLabel;
        existing.activities = activities;
        existing.uploadedAt = new Date();
        existing.uploadedBy = auth.admin.email || "Admin";
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
        uploadedBy: auth.admin.email || "Admin",
      });

      return res.json({
        success: true,
        message: `Published ${semesterType} semester academic calendar successfully.`,
        calendar: newCalendar,
      });
    }

    // 9. POST /api/timetable/admin/holidays/save
    if (action === "admin-holidays-save" || (cleanUrl.includes("/admin/holidays/save") && req.method === "POST")) {
      const auth = await authenticateAdmin(req);
      if (auth.error) return res.status(auth.error.status).json(auth.error);

      const { academicYear, title, holidays, optionalRules } = req.body || {};
      if (!holidays || !Array.isArray(holidays)) {
        return res.status(400).json({ success: false, message: "Holidays array is required." });
      }

      const year = academicYear || "2026-27";
      let holidayDoc = await AcademicHoliday.findOne({ academicYear: year });

      if (holidayDoc) {
        holidayDoc.title = title || holidayDoc.title;
        holidayDoc.holidays = holidays;
        if (optionalRules) holidayDoc.optionalRules = optionalRules;
        holidayDoc.uploadedAt = new Date();
        holidayDoc.uploadedBy = auth.admin.email || "Admin";
        await holidayDoc.save();

        return res.json({
          success: true,
          message: `Updated academic holidays list (${year}) successfully.`,
          holidayDoc,
        });
      }

      holidayDoc = await AcademicHoliday.create({
        academicYear: year,
        title: title || `Academic Holidays List (${year})`,
        holidays,
        optionalRules: optionalRules || [],
        uploadedBy: auth.admin.email || "Admin",
      });

      return res.json({
        success: true,
        message: `Published academic holidays list (${year}) successfully.`,
        holidayDoc,
      });
    }

    return res.status(404).json({ success: false, message: "Endpoint not found in timetable handler." });
  } catch (err) {
    console.error("Timetable serverless error:", err);
    return res.status(500).json({ success: false, message: "Internal server error in timetable handler." });
  }
};
