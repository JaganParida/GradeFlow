const jwt = require("jsonwebtoken");
const connectToDatabase = require("./_lib/db");
const AdminSession = require("./_lib/models/AdminSession");
const SubAdminSession = require("./_lib/models/SubAdminSession");
const { isAdminSessionValid } = require("./_lib/sessionManager");
const { generateBacklogEmailHtml, generateBacklogEmailText } = require("./_lib/emailTemplate.js");
const { generateTopperEmailHtml, generateTopperEmailText } = require("./_lib/topperEmailTemplate.js");
const { applyCors } = require("./_lib/cors");
const { sendMailWithFailover } = require("./_lib/emailProviderManager");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name] = rest.join("=");
  });
  return cookies;
}

async function verifyAdminAuth(req) {
  const cookies = parseCookies(req.headers.cookie);
  let token = req.headers["x-admin-token"];
  if (!token && cookies.jwt && cookies.jwt !== "none") {
    token = cookies.jwt;
  }
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || token === "none") {
    return {
      error: {
        status: 401,
        message: "Administrative authorization required to dispatch emails.",
        code: "ADMIN_AUTH_REQUIRED",
      },
    };
  }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch {
      return {
        error: {
          status: 401,
          message: "Invalid or expired administrative token.",
          code: "INVALID_ADMIN_TOKEN",
        },
      };
    }

    if (decoded.role === "student" || decoded.regNo) {
      return {
        error: {
          status: 403,
          message: "Students are not permitted to dispatch administrative emails.",
          code: "STUDENT_EMAIL_DISPATCH_FORBIDDEN",
        },
      };
    }

    try {
      // Connect to database only after cryptographic token verification passes
      await connectToDatabase();

    if (decoded.adminType === "subadmin") {
      if (decoded.sessionId) {
        const session = await SubAdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
        if (!session) {
          return {
            error: {
              status: 401,
              message: "Sub-Admin session ended because this device was logged out.",
              code: "ADMIN_SESSION_TERMINATED",
            },
          };
        }
      }
      return { admin: decoded };
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

    return { admin: decoded };
  } catch (err) {
    return {
      error: {
        status: 500,
        message: "Internal server error during authentication.",
        code: "AUTH_INTERNAL_ERROR",
      },
    };
  }
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
function sanitizeText(val, maxLen = 80) {
  return String(val || "").replace(/[\r\n<>]/g, "").trim().slice(0, maxLen);
}

module.exports = async function handler(req, res) {
  if (applyCors(req, res, "POST,OPTIONS")) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Enforce Administrative Authentication (Rejects unauthenticated in <1ms without DB hit)
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({
        success: false,
        message: authResult.error.message,
        code: authResult.error.code,
      });
    }

    const action = req.query.action || (req.url?.includes("topper") ? "topper" : "backlog");
    const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";

    // 1. TOPPER EMAIL DISPATCH
    if (action === "topper" || req.url?.includes("send-topper-email")) {
      const {
        regNo,
        studentName = "Student",
        cgpa = 0,
        sgpa = 0,
        sectionCgpaRank = 1,
        sectionSgpaRank = 1,
        universityRank = null,
        semester = 1,
        batch = "N/A",
        branch = "N/A",
        section = "N/A",
        customEmail,
      } = req.body || {};

      const cleanRegNo = String(regNo || "").trim().toUpperCase();
      if (!cleanRegNo || !/^[a-zA-Z0-9]{5,20}$/.test(cleanRegNo)) {
        return res.status(400).json({ success: false, message: "Valid registration number is required." });
      }

      let recipientEmail = `${cleanRegNo.toLowerCase()}@centurionuniv.edu.in`;
      if (customEmail && typeof customEmail === "string") {
        const cleanCustom = customEmail.trim().toLowerCase();
        if (EMAIL_REGEX.test(cleanCustom) && cleanCustom.length <= 100) {
          recipientEmail = cleanCustom;
        }
      }

      const emailPayload = {
        studentName: sanitizeText(studentName),
        regNo: cleanRegNo,
        cgpa: Number(cgpa) || 0,
        sgpa: Number(sgpa) || 0,
        sectionCgpaRank: Number(sectionCgpaRank) || 1,
        sectionSgpaRank: Number(sectionSgpaRank) || 1,
        universityRank: universityRank ? Number(universityRank) : null,
        semester: Number(semester) || 1,
        batch: sanitizeText(batch),
        branch: sanitizeText(branch),
        section: sanitizeText(section),
        developerWhatsapp: process.env.DEVELOPER_WHATSAPP || "919124540575",
        frontendUrl: process.env.FRONTEND_URL || "https://grade-flow-six.vercel.app",
      };

      const html = generateTopperEmailHtml(emailPayload);
      const text = generateTopperEmailText(emailPayload);

      const mailOptions = {
        from: `"GradeFlow - Academic Updates" <${senderEmail}>`,
        replyTo: senderEmail,
        to: recipientEmail,
        subject: `🏆 Congratulations ${emailPayload.studentName}! Section Academic Excellence Recognition (Semester ${emailPayload.semester})`,
        text,
        html,
      };

      const info = await sendMailWithFailover(mailOptions);
      return res.json({
        success: true,
        message: `Academic Excellence email successfully dispatched to ${recipientEmail}`,
        messageId: info.messageId,
      });
    }

    // 2. BACKLOG NOTIFICATION EMAIL DISPATCH
    const {
      regNo,
      studentName = "Student",
      cgpa = 0,
      totalBacklogs = 0,
      completedSemesters = 0,
      remainingSemesters = 0,
      latestSemester = 1,
      backlogSubjects = [],
      batch = "N/A",
      branch = "N/A",
      section = "N/A",
      customEmail,
    } = req.body || {};

    const cleanRegNo = String(regNo || "").trim().toUpperCase();
    if (!cleanRegNo || !/^[a-zA-Z0-9]{5,20}$/.test(cleanRegNo)) {
      return res.status(400).json({ success: false, message: "Valid registration number is required." });
    }

    let recipientEmail = `${cleanRegNo.toLowerCase()}@centurionuniv.edu.in`;
    if (customEmail && typeof customEmail === "string") {
      const cleanCustom = customEmail.trim().toLowerCase();
      if (EMAIL_REGEX.test(cleanCustom) && cleanCustom.length <= 100) {
        recipientEmail = cleanCustom;
      }
    }

      const emailPayload = {
      studentName: sanitizeText(studentName),
      regNo: cleanRegNo,
      cgpa: Number(cgpa) || 0,
      totalBacklogs: Number(totalBacklogs) || 0,
      completedSemesters: Number(completedSemesters) || 0,
      remainingSemesters: Number(remainingSemesters) || 0,
      latestSemester: Number(latestSemester) || 1,
      backlogSubjects: Array.isArray(backlogSubjects) ? backlogSubjects : [],
      batch: sanitizeText(batch),
      branch: sanitizeText(branch),
      section: sanitizeText(section),
      developerWhatsapp: process.env.DEVELOPER_WHATSAPP || "919124540575",
      frontendUrl: process.env.FRONTEND_URL || "https://grade-flow-six.vercel.app",
    };

    const html = generateBacklogEmailHtml(emailPayload);
    const text = generateBacklogEmailText(emailPayload);

    const mailOptions = {
      from: `"GradeFlow - Academic Updates" <${senderEmail}>`,
      replyTo: senderEmail,
      to: recipientEmail,
      subject: `Academic Performance Update - Action Required (${emailPayload.studentName})`,
      text,
      html,
    };

    const info = await sendMailWithFailover(mailOptions);

    try {
      const Student = require("./_lib/models/Student");
      await Student.findOneAndUpdate(
        { regNo: cleanRegNo },
        {
          $set: {
            lastBacklogEmailSentAt: new Date(),
            lastBacklogEmailStatus: "SUCCESS",
            lastBacklogEmailError: null,
            lastEmailSentAt: new Date(),
            lastEmailStatus: "SUCCESS",
            lastEmailError: null,
          },
        },
        { upsert: true }
      );
    } catch (dbErr) {
      console.warn("[Emails] Could not persist backlog email status:", dbErr?.message || dbErr);
    }

    return res.json({
      success: true,
      message: `Backlog notification email successfully dispatched to ${recipientEmail}`,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error("Email dispatch handler error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send email.",
      error: err.message,
    });
  }
};
