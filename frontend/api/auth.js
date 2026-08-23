const connectToDatabase = require("./_lib/db");
const Admin = require("./_lib/models/Admin");
const AdminSession = require("./_lib/models/AdminSession");
const AdminOtpVerification = require("./_lib/models/AdminOtpVerification");
const SubAdmin = require("./_lib/models/SubAdmin");
const SubAdminSession = require("./_lib/models/SubAdminSession");
const SubAdminOtpVerification = require("./_lib/models/SubAdminOtpVerification");
const SemesterResult = require("./_lib/models/SemesterResult");
const OtpVerification = require("./_lib/models/OtpVerification");
const StudentSession = require("./_lib/models/StudentSession");
const StudentDailyLimit = require("./_lib/models/StudentDailyLimit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const {
  SEVEN_DAYS_MS,
  MAX_ADMIN_DEVICES,
  getMaxAllowedDevices,
  cleanExpiredSessions,
  getActiveSessions,
  isSessionValid,
  touchSession,
  cleanExpiredAdminSessions,
  getActiveAdminSessions,
  isAdminSessionValid,
  touchAdminSession,
} = require("./_lib/sessionManager");

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, x-student-token, x-admin-token",
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

function createTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER and EMAIL_PASS environment variables are missing.");
  }

  const host = process.env.EMAIL_HOST || (process.env.EMAIL_SERVICE ? null : "smtp-relay.brevo.com");
  const port = Number(process.env.EMAIL_PORT) || 587;
  const secure = port === 465;
  const service = host ? null : process.env.EMAIL_SERVICE || "gmail";

  const config = service
    ? { service, auth: { user: emailUser, pass: emailPass } }
    : {
        host,
        port,
        secure,
        auth: { user: emailUser, pass: emailPass },
        tls: { rejectUnauthorized: false },
      };

  return nodemailer.createTransport({
    ...config,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

function getIstDateKey() {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 60 * 60000;
  const istDate = new Date(utcTime + istOffset);
  return istDate.toISOString().slice(0, 10);
}

function getTimeUntilIstMidnight() {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 60 * 60000;
  const istDate = new Date(utcTime + istOffset);

  const midnight = new Date(istDate);
  midnight.setHours(24, 0, 0, 0);

  const diffMs = midnight.getTime() - istDate.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);

  return { hours, mins, totalSeconds };
}

async function sendOtpEmail({ to, studentName = "Student", regNo, otp, expiresInMinutes = 5 }) {
  const transporter = createTransporter();
  const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GradeFlow Verification Code</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202124; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; text-align: left;">
        <tr>
          <td style="padding-bottom: 24px;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: middle;">
                  <div style="font-size: 20px; font-weight: 700; color: #1a73e8; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">GradeFlow</div>
                </td>
              </tr>
            </table>
            <div style="font-size: 12px; color: #5f6368; margin-top: 4px; font-weight: 400;">
              Centurion University of Technology and Management
            </div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 28px;">
            <div style="font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 16px; letter-spacing: -0.3px;">
              Verification code
            </div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 12px;">
              Hi ${studentName || "Student"},
            </div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 28px;">
              Please use the verification code below to sign in to your GradeFlow account for registration number <strong>${regNo}</strong>:
            </div>
            <div style="font-size: 38px; font-weight: 700; letter-spacing: 8px; color: #1a73e8; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; margin-bottom: 28px;">
              ${otp}
            </div>
            <div style="font-size: 13px; color: #5f6368; line-height: 1.6; margin-bottom: 14px;">
              This code will expire in ${expiresInMinutes} minutes. For security reasons, do not share this code with anyone.
            </div>
            <div style="font-size: 13px; color: #5f6368; line-height: 1.6; margin-bottom: 32px;">
              If you did not request this verification code, you can safely ignore this email. Someone may have entered your registration number by mistake.
            </div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 20px; font-size: 12px; color: #70757a; line-height: 1.5;">
            <div>GradeFlow Academic Intelligence &bull; Centurion University</div>
            <div style="margin-top: 4px; color: #80868b; font-size: 11px;">
              This is an automated authentication message. Please do not reply directly to this email.
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `Hi ${studentName || "Student"},\n\nYour GradeFlow verification code for registration number ${regNo} is:\n\n${otp}\n\nThis code will expire in ${expiresInMinutes} minutes. If you did not request this code, you can safely ignore this email.\n\nGradeFlow Academic Portal\nCenturion University of Technology and Management`;

  const mailOptions = {
    from: `"GradeFlow" <${senderEmail}>`,
    replyTo: senderEmail,
    to,
    subject: `Your GradeFlow Verification Code: ${otp}`,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
}

async function sendAdminOtpEmail({ to, otp, expiresInMinutes = 5 }) {
  const transporter = createTransporter();
  const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GradeFlow Admin Verification Code</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);">
        <!-- Brand Header -->
        <tr>
          <td style="padding-bottom: 20px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <div style="font-size: 20px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px;">GradeFlow</div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Institutional Administration Gateway &bull; Centurion University</div>
                </td>
                <td align="right">
                  <span style="display: inline-block; padding: 4px 10px; background: #eff6ff; border: 1px solid #dbeafe; border-radius: 99px; font-size: 11px; font-weight: 700; color: #2563eb; letter-spacing: 0.3px;">ADMIN SECURITY</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider Line -->
        <tr>
          <td style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <div style="font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 12px; letter-spacing: -0.4px;">
              Admin Verification Code
            </div>
            <div style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 8px;">
              Dear Administrator,
            </div>
            <div style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
              An administrative login attempt has been initiated with the correct master password. Use the single-use verification code below to authorize this session:
            </div>

            <!-- Crisp OTP Box -->
            <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: 'Space Mono', 'SF Pro Display', monospace;">
                ${otp}
              </div>
            </div>

            <div style="font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 12px;">
              This code will expire in <strong>${expiresInMinutes} minutes</strong>. For security reasons, do not share this code with anyone.
            </div>

            <div style="font-size: 12.5px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px;">
              If you did not initiate this login request, someone may be attempting to access the administration portal. Please verify your credentials immediately.
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 11.5px; color: #64748b; line-height: 1.5;">
            <div>GradeFlow Enterprise Security &bull; Max 2 Authorized Active Devices</div>
            <div style="margin-top: 4px; color: #94a3b8; font-size: 11px;">
              This is an automated administrative authentication message. Please do not reply directly to this email.
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `GradeFlow Institutional Admin Verification Code:\n\n${otp}\n\nThis code will expire in ${expiresInMinutes} minutes. If you did not initiate this login request, please verify your credentials immediately.\n\nGradeFlow Institutional Administration Gateway\nCenturion University of Technology and Management`;

  const mailOptions = {
    from: `"GradeFlow Admin Security" <${senderEmail}>`,
    replyTo: senderEmail,
    to,
    subject: `GradeFlow Admin Verification Code: ${otp}`,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
}

async function sendSubAdminOtpEmail({ to, name = "Administrator", otp, expiresInMinutes = 5 }) {
  const transporter = createTransporter();
  const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sub-Admin Verification Code</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202124; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; text-align: left;">
        <!-- Brand Header -->
        <tr>
          <td style="padding-bottom: 24px;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: middle;">
                  <div style="font-size: 20px; font-weight: 700; color: #1a73e8; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">GradeFlow</div>
                </td>
              </tr>
            </table>
            <div style="font-size: 12px; color: #5f6368; margin-top: 4px; font-weight: 400;">
              Centurion University of Technology and Management
            </div>
          </td>
        </tr>

        <!-- Divider Line -->
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 28px;">
            <div style="font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 16px; letter-spacing: -0.3px;">
              Sub-Admin verification code
            </div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 28px;">
              Hi ${name},<br><br>
              Please use the verification code below to securely sign in to your GradeFlow Sub-Admin portal:
            </div>

            <!-- OTP Code Display -->
            <div style="margin: 28px 0; text-align: left;">
              <span style="font-family: 'Roboto Mono', Menlo, Consolas, Monaco, monospace; font-size: 38px; font-weight: 700; color: #1a73e8; letter-spacing: 8px; line-height: 1; display: inline-block;">
                ${otp}
              </span>
            </div>

            <div style="font-size: 13px; color: #5f6368; line-height: 1.6; margin-bottom: 16px;">
              This code will expire in ${expiresInMinutes} minutes. For security reasons, do not share this code with anyone.
            </div>

            <div style="font-size: 13px; color: #5f6368; line-height: 1.6; margin-bottom: 32px;">
              If you did not attempt to sign in to GradeFlow Sub-Admin portal, please contact the Master Administrator immediately.
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 20px; font-size: 12px; color: #70757a; line-height: 1.5;">
            <div>GradeFlow Enterprise Security &bull; Centurion University</div>
            <div style="margin-top: 4px; color: #80868b; font-size: 11px;">
              This is an automated authentication message. Please do not reply directly to this email.
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `Hi ${name},\n\nYour GradeFlow Sub-Admin verification code is:\n\n${otp}\n\nThis code will expire in ${expiresInMinutes} minutes. If you did not request this code, please inform the Master Administrator immediately.\n\nGradeFlow Enterprise Security\nCenturion University of Technology and Management`;

  const mailOptions = {
    from: `"GradeFlow" <${senderEmail}>`,
    replyTo: senderEmail,
    to,
    subject: `Your GradeFlow Sub-Admin Verification Code: ${otp}`,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectToDatabase();
    let action = req.query.action;
    if (!action && req.url) {
      const cleanUrl = req.url.split("?")[0];
      if (cleanUrl.includes("subadmin/verify-otp")) action = "subadmin-verify-otp";
      else if (cleanUrl.includes("subadmin/login")) action = "subadmin-login";
      else if (cleanUrl.includes("admin/login-password") || cleanUrl.endsWith("/login")) action = "admin-login-password";
      else if (cleanUrl.includes("admin/verify-otp")) action = "admin-verify-otp";
      else if (cleanUrl.includes("admin/check-status")) action = "admin-check-status";
      else if (cleanUrl.includes("admin/me") || cleanUrl.endsWith("/me")) action = "admin-me";
      else if (cleanUrl.includes("admin/logout") || cleanUrl.endsWith("/logout")) action = "admin-logout";
      else if (cleanUrl.includes("student/send-otp")) action = "student-send-otp";
      else if (cleanUrl.includes("student/verify-otp")) action = "student-verify-otp";
      else if (cleanUrl.includes("student/check-status")) action = "student-check-status";
      else if (cleanUrl.includes("student/me")) action = "student-me";
      else if (cleanUrl.includes("student/logout")) action = "student-logout";
    }
    const cookies = parseCookies(req.headers.cookie);

    /* ─────────────────────────────────────────────────────────────
       0. STUDENT LIVE DEVICE STATUS CHECK (Instant UI Pre-Check)
    ───────────────────────────────────────────────────────────── */
    if ((action === "student-check-status" || action === "check-status") && req.method === "GET") {
      const rawReg = String(req.query.regNo || "").trim().toUpperCase();
      if (!rawReg) {
        return res.status(400).json({ message: "Registration number required." });
      }

      const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
      if (!studentRecord) {
        return res.json({ success: true, exists: false });
      }

      const maxAllowedDevices = getMaxAllowedDevices(rawReg);
      const activeSessions = await getActiveSessions(StudentSession, rawReg);

      let incomingToken = req.headers["x-student-token"];
      if (!incomingToken && cookies.student_jwt && cookies.student_jwt !== "none") {
        incomingToken = cookies.student_jwt;
      }
      if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        incomingToken = req.headers.authorization.split(" ")[1];
      }

      let isCurrentDevice = false;
      let currentSessionId = null;
      if (incomingToken && incomingToken !== "none") {
        try {
          const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
          if (decoded.regNo === rawReg && activeSessions.some((s) => s.sessionId === decoded.sessionId)) {
            isCurrentDevice = true;
            currentSessionId = decoded.sessionId;
          }
        } catch {}
      }

      const isBlocked = activeSessions.length >= maxAllowedDevices && !isCurrentDevice;

      const sessionDetails = activeSessions.map((s, idx) => ({
        deviceIndex: idx + 1,
        sessionId: s.sessionId,
        isCurrentDevice: s.sessionId === currentSessionId,
        platform: s.deviceInfo?.platform || "Unknown",
        userAgent: s.deviceInfo?.userAgent || "Unknown",
        ip: s.deviceInfo?.ip || "",
        loggedInAt: s.loggedInAt,
        lastActiveAt: s.lastActiveAt,
        expiresAt: s.expiresAt,
        status: "ACTIVE",
      }));

      return res.json({
        success: true,
        exists: true,
        studentName: studentRecord.studentName || "Student",
        isCurrentDevice,
        activeDeviceCount: activeSessions.length,
        maxAllowedDevices,
        isBlocked,
        loginAllowed: !isBlocked,
        otpAllowed: !isBlocked,
        verificationAllowed: !isBlocked,
        blockReason: isBlocked ? "DEVICE_LIMIT_REACHED" : null,
        blockMessage: isBlocked
          ? rawReg === "230301120327"
            ? `Account 230301120327 is already actively logged in on 2 devices (maximum 2 allowed). Please log out from one device before signing in on a new device.`
            : `Registration number ${rawReg} is already logged in on an active device. Single-device security policy is active. Please log out from that device first.`
          : null,
        sessions: sessionDetails,
      });
    }

    /* ─────────────────────────────────────────────────────────────
       1. STUDENT SEND OTP
    ───────────────────────────────────────────────────────────── */
    if ((action === "student-send-otp" || action === "send-otp") && req.method === "POST") {
      const rawReg = String(req.body.regNo || "").trim().toUpperCase();
      if (!rawReg) {
        return res.status(400).json({ message: "Registration number is required." });
      }

      const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
      if (!studentRecord) {
        return res.status(404).json({
          message: "No student records found for this registration number. Please check and try again.",
        });
      }

      const studentName = studentRecord.studentName || "Student";
      const studentEmail = `${rawReg.toLowerCase()}@centurionuniv.edu.in`;

      // ── Active Multi-Device Security Guard ──
      const maxAllowedDevices = getMaxAllowedDevices(rawReg);
      const isUnlimited = rawReg === "230301120327";

      const activeSessions = await getActiveSessions(StudentSession, rawReg);

      // Check if current requesting device already has an active session
      let incomingToken = req.headers["x-student-token"];
      if (!incomingToken && cookies.student_jwt && cookies.student_jwt !== "none") {
        incomingToken = cookies.student_jwt;
      }
      if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        incomingToken = req.headers.authorization.split(" ")[1];
      }

      let isCurrentDevice = false;
      if (incomingToken && incomingToken !== "none") {
        try {
          const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
          if (decoded.regNo === rawReg && activeSessions.some((s) => s.sessionId === decoded.sessionId)) {
            isCurrentDevice = true;
          }
        } catch {}
      }

      if (isCurrentDevice) {
        return res.json({
          success: true,
          alreadyLoggedIn: true,
          message: "You are already logged in on this device.",
          student: { regNo: rawReg, studentName },
        });
      }

      // CRITICAL: Block OTP Generation if device limit is already reached!
      if (activeSessions.length >= maxAllowedDevices) {
        const sanitizedDevices = activeSessions.map((s, idx) => ({
          deviceIndex: idx + 1,
          platform: s.deviceInfo?.platform || "Unknown",
          userAgent: s.deviceInfo?.userAgent || "Unknown",
          loggedInAt: s.loggedInAt,
          lastActiveAt: s.lastActiveAt,
          status: "ACTIVE",
        }));
        return res.status(403).json({
          success: false,
          code: "DEVICE_LIMIT_REACHED",
          message: rawReg === "230301120327"
            ? `Account 230301120327 is already active on ${activeSessions.length} devices (maximum limit: 2). Please log out from one device before logging in on a new device.`
            : `Registration number ${rawReg} is already logged in on an active device (maximum limit: 1). Single-device security policy is active. Please log out from your other device before signing in here.`,
          activeDeviceCount: activeSessions.length,
          maxAllowedDevices,
          isBlocked: true,
          activeDevices: sanitizedDevices,
        });
      }

      // ── Daily Limit Check (Max 2 attempts/day, bypassed for 230301120327) ──
      const dateKey = getIstDateKey();
      let dailyLimit = await StudentDailyLimit.findOne({ regNo: rawReg, dateKey });
      if (!dailyLimit) {
        dailyLimit = new StudentDailyLimit({ regNo: rawReg, dateKey, otpSendCount: 0 });
      }

      if (!isUnlimited && dailyLimit.otpSendCount >= 2) {
        const { hours, mins, totalSeconds } = getTimeUntilIstMidnight();
        return res.status(429).json({
          message: `Daily OTP limit reached (maximum 2 requests per calendar day). Login for ${rawReg} is locked for today. It will automatically reset at 12:00 AM midnight (in ${hours}h ${mins}m).`,
          code: "DAILY_LIMIT_EXCEEDED",
          remainingSeconds: totalSeconds,
        });
      }

      // ── Generate 6-Digit OTP ──
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpSalt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(otpCode, otpSalt);

      await OtpVerification.deleteMany({ regNo: rawReg });
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await OtpVerification.create({
        regNo: rawReg,
        email: studentEmail,
        otpHash,
        expiresAt,
        attempts: 0,
      });

      dailyLimit.otpSendCount += 1;
      dailyLimit.lastOtpSentAt = new Date();
      await dailyLimit.save();

      // ── Dispatch Email via Nodemailer ──
      try {
        await sendOtpEmail({
          to: studentEmail,
          studentName,
          regNo: rawReg,
          otp: otpCode,
          expiresInMinutes: 5,
        });
      } catch (emailErr) {
        console.error("Vercel Email dispatch error:", emailErr);
        return res.status(500).json({
          message: "Failed to deliver OTP email to your university address. Please try again later.",
          error: emailErr.message,
        });
      }

      const maskedEmail = `${studentEmail.slice(0, 4)}***@${studentEmail.split("@")[1]}`;
      return res.json({
        success: true,
        message: `A 6-digit verification code has been sent to ${studentEmail}.`,
        maskedEmail,
        studentName,
        regNo: rawReg,
        expiresInSeconds: 300,
        remainingDailyAttempts: isUnlimited ? 99 : Math.max(0, 2 - dailyLimit.otpSendCount),
        isUnlimited,
      });
    }

    /* ─────────────────────────────────────────────────────────────
       2. STUDENT VERIFY OTP
    ───────────────────────────────────────────────────────────── */
    if ((action === "student-verify-otp" || action === "verify-otp") && req.method === "POST") {
      const rawReg = String(req.body.regNo || "").trim().toUpperCase();
      const rawOtp = String(req.body.otp || "").trim();

      if (!rawReg || !rawOtp) {
        return res.status(400).json({ message: "Registration number and OTP code are required." });
      }

      const otpRecord = await OtpVerification.findOne({ regNo: rawReg });
      if (!otpRecord) {
        const activeSessions = await getActiveSessions(StudentSession, rawReg);
        if (activeSessions.length > 0) {
          const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
          return res.json({
            success: true,
            message: "Student already verified and authenticated.",
            student: {
              regNo: rawReg,
              studentName: studentRecord?.studentName || "Student",
              section: studentRecord?.branch || "CSE-A",
            },
          });
        }
        return res.status(400).json({
          message: "No active verification code found or code has expired. Please request a new code.",
          code: "OTP_EXPIRED",
        });
      }

      if (new Date() > new Date(otpRecord.expiresAt)) {
        await OtpVerification.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({
          message: "The verification code has expired (validity is 5 minutes). Please request a new code.",
          code: "OTP_EXPIRED",
        });
      }

      if (otpRecord.attempts >= 5) {
        await OtpVerification.deleteOne({ _id: otpRecord._id });
        return res.status(429).json({
          message: "Too many failed attempts. This code has been invalidated for security. Please request a new code.",
          code: "MAX_ATTEMPTS_EXCEEDED",
        });
      }

      const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
      if (!isMatch) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remainingAttempts = Math.max(0, 5 - otpRecord.attempts);
        return res.status(400).json({
          message: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
          code: "INVALID_OTP",
          remainingAttempts,
        });
      }

      // Valid OTP: delete OTP record
      await OtpVerification.deleteOne({ _id: otpRecord._id });

      // Atomic Device Limit Check before creating session
      const maxAllowedDevices = getMaxAllowedDevices(rawReg);
      const activeSessions = await getActiveSessions(StudentSession, rawReg);

      if (activeSessions.length >= maxAllowedDevices) {
        const sanitizedDevices = activeSessions.map((s, idx) => ({
          deviceIndex: idx + 1,
          platform: s.deviceInfo?.platform || "Unknown",
          userAgent: s.deviceInfo?.userAgent || "Unknown",
          loggedInAt: s.loggedInAt,
          lastActiveAt: s.lastActiveAt,
          status: "ACTIVE",
        }));
        return res.status(403).json({
          success: false,
          code: "DEVICE_LIMIT_REACHED",
          message: rawReg === "230301120327"
            ? `Account 230301120327 is already active on ${activeSessions.length} devices (maximum limit: 2). Please log out from one device before logging in on a new device.`
            : `Registration number ${rawReg} is already logged in on an active device (maximum limit: 1). Single-device security policy is active. Please log out from your other device first.`,
          activeDeviceCount: activeSessions.length,
          maxAllowedDevices,
          isBlocked: true,
        });
      }

      // Fetch student profile info
      const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
      const studentName = studentRecord?.studentName || "Student";

      // Create new session document for this device (WITHOUT deleting/evicting existing valid sessions)
      const sessionId = crypto.randomUUID();
      const now = Date.now();
      const expiresAt = new Date(now + SEVEN_DAYS_MS);

      await StudentSession.create({
        regNo: rawReg,
        sessionId,
        deviceInfo: {
          userAgent: req.headers["user-agent"] || "",
          ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
        },
        loggedInAt: new Date(now),
        lastActiveAt: new Date(now),
        expiresAt,
        isActive: true,
      });

      const token = jwt.sign(
        {
          role: "student",
          regNo: rawReg,
          sessionId,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.setHeader("Set-Cookie", [
        `student_jwt=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
        `student_jwt=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
      ]);

      return res.json({
        success: true,
        token,
        message: "Authentication successful.",
        student: {
          regNo: rawReg,
          studentName,
          sessionId,
        },
      });
    }

    /* ─────────────────────────────────────────────────────────────
       3. CURRENT AUTHENTICATED STUDENT CHECK (/student/me)
    ───────────────────────────────────────────────────────────── */
    if ((action === "student-me" || action === "me-student") && req.method === "GET") {
      let token = req.headers["x-student-token"];
      if (!token && cookies.student_jwt && cookies.student_jwt !== "none") {
        token = cookies.student_jwt;
      }
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token || token === "none") {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ success: false, message: "Token invalid or expired" });
      }

      if (!decoded.regNo || !decoded.sessionId) {
        return res.status(401).json({ success: false, message: "Invalid session token" });
      }

      const session = await StudentSession.findOne({
        regNo: decoded.regNo,
        sessionId: decoded.sessionId,
        isActive: true,
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          code: "SESSION_TERMINATED",
          message: "Session terminated or logged out from this device.",
        });
      }

      if (!isSessionValid(session)) {
        await StudentSession.deleteOne({ _id: session._id });
        return res.status(401).json({
          success: false,
          code: "INACTIVITY_LOGOUT",
          message: "Session expired due to 7 continuous days of inactivity.",
        });
      }

      // Rolling activity update
      await touchSession(session);

      const studentRecord = await SemesterResult.findOne({ regNo: decoded.regNo }).sort({ semester: -1 });

      return res.json({
        success: true,
        student: {
          regNo: decoded.regNo,
          studentName: studentRecord?.studentName || "Student",
          sessionId: decoded.sessionId,
        },
      });
    }

    /* ─────────────────────────────────────────────────────────────
       4. STUDENT LOGOUT (/student/logout) - ONLY CURRENT DEVICE
    ───────────────────────────────────────────────────────────── */
    if ((action === "student-logout" || action === "logout-student") && req.method === "POST") {
      let token = cookies.student_jwt;
      if (!token && req.headers["x-student-token"]) {
        token = req.headers["x-student-token"];
      }
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (token && token !== "none") {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded && decoded.sessionId) {
            // ONLY REVOKE THE SPECIFIC DEVICE'S SESSION!
            await StudentSession.deleteOne({ sessionId: decoded.sessionId });
          }
        } catch {}
      }

      res.setHeader("Set-Cookie", [
        `student_jwt=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        `student_jwt=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      ]);

      return res.json({ success: true, message: "Logged out successfully from this device." });
    }

    /* ─────────────────────────────────────────────────────────────
       5. ADMIN STATUS CHECK (/admin/check-status)
    ───────────────────────────────────────────────────────────── */
    if ((action === "admin-check-status" || action === "check-admin-status") && req.method === "GET") {
      const activeSessions = await getActiveAdminSessions(AdminSession);

      let incomingToken = cookies.jwt;
      if (!incomingToken && req.headers["x-admin-token"]) {
        incomingToken = req.headers["x-admin-token"];
      }
      if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        incomingToken = req.headers.authorization.split(" ")[1];
      }

      let isCurrentDevice = false;
      let currentSessionId = null;
      if (incomingToken && incomingToken !== "none") {
        try {
          const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
          if (decoded.role === "admin" && decoded.sessionId) {
            if (activeSessions.some((s) => s.sessionId === decoded.sessionId)) {
              isCurrentDevice = true;
              currentSessionId = decoded.sessionId;
            }
          }
        } catch {}
      }

      const isBlocked = activeSessions.length >= MAX_ADMIN_DEVICES && !isCurrentDevice;
      const sanitizedDevices = activeSessions.map((s, idx) => ({
        deviceIndex: idx + 1,
        platform: s.deviceInfo?.platform || "Unknown",
        userAgent: s.deviceInfo?.userAgent || "Unknown",
        loggedInAt: s.loggedInAt,
        lastActiveAt: s.lastActiveAt,
        status: "ACTIVE",
      }));

      return res.json({
        success: true,
        isCurrentDevice,
        activeDeviceCount: activeSessions.length,
        maxAllowedDevices: MAX_ADMIN_DEVICES,
        isBlocked,
        otpAllowed: !isBlocked,
        loginAllowed: !isBlocked,
        blockReason: isBlocked ? "ADMIN_DEVICE_LIMIT_REACHED" : null,
        activeDevices: sanitizedDevices,
      });
    }

    /* ─────────────────────────────────────────────────────────────
       6. ADMIN PASSWORD LOGIN -> SEND OTP
    ───────────────────────────────────────────────────────────── */
    if ((action === "admin-login-password" || action === "login") && req.method === "POST") {
      let adminEmail = process.env.ADMIN_EMAIL;
      let adminPassword = process.env.ADMIN_PASSWORD;

      let adminDoc = null;
      if (!adminEmail || !adminPassword) {
        adminDoc = await Admin.findOne().sort({ createdAt: -1 });
        if (adminDoc && !adminEmail) {
          adminEmail = adminDoc.email;
        }
      } else {
        adminDoc = await Admin.findOne({ email: adminEmail });
      }

      if (!adminEmail && !adminDoc) {
        return res.status(500).json({
          message: "Admin authentication is temporarily unavailable due to server configuration. Please ensure ADMIN_EMAIL and ADMIN_PASSWORD are set.",
          code: "ADMIN_CONFIG_MISSING",
        });
      }

      const candidatePassword = String(req.body.password || "");
      if (!candidatePassword) {
        return res.status(400).json({
          message: "Please enter your administrative password.",
          code: "PASSWORD_REQUIRED",
        });
      }

      // Secure comparison against environment ADMIN_PASSWORD or MongoDB Admin record
      let isPasswordCorrect = false;
      if (adminPassword) {
        const candidateBuf = Buffer.from(candidatePassword, "utf8");
        const adminPassBuf = Buffer.from(adminPassword, "utf8");
        if (candidateBuf.length === adminPassBuf.length) {
          isPasswordCorrect = crypto.timingSafeEqual(candidateBuf, adminPassBuf);
        }
      }

      if (!isPasswordCorrect && adminDoc && typeof adminDoc.comparePassword === "function") {
        isPasswordCorrect = await adminDoc.comparePassword(candidatePassword);
      }

      if (!isPasswordCorrect) {
        return res.status(401).json({
          message: "Invalid password. Access denied.",
          code: "INVALID_PASSWORD",
        });
      }

      // Check active admin devices
      const activeSessions = await getActiveAdminSessions(AdminSession);

      let incomingToken = cookies.jwt;
      if (!incomingToken && req.headers["x-admin-token"]) {
        incomingToken = req.headers["x-admin-token"];
      }
      if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        incomingToken = req.headers.authorization.split(" ")[1];
      }

      let isCurrentDevice = false;
      if (incomingToken && incomingToken !== "none") {
        try {
          const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
          if (decoded.role === "admin" && decoded.sessionId) {
            const matching = activeSessions.find((s) => s.sessionId === decoded.sessionId);
            if (matching && isAdminSessionValid(matching)) {
              await touchAdminSession(matching);
              isCurrentDevice = true;
              return res.json({
                success: true,
                alreadyLoggedIn: true,
                token: incomingToken,
                message: "Admin is already actively authenticated on this device.",
              });
            }
          }
        } catch {}
      }

      // CRITICAL GUARD: Strict 2-Device Limit Check BEFORE generating or sending OTP
      if (activeSessions.length >= MAX_ADMIN_DEVICES && !isCurrentDevice) {
        const sanitizedDevices = activeSessions.map((s, idx) => ({
          deviceIndex: idx + 1,
          platform: s.deviceInfo?.platform || "Unknown",
          userAgent: s.deviceInfo?.userAgent || "Unknown",
          loggedInAt: s.loggedInAt,
          lastActiveAt: s.lastActiveAt,
          status: "ACTIVE",
        }));
        return res.status(403).json({
          message: `Admin portal is currently active on ${activeSessions.length} authorized devices (maximum limit: ${MAX_ADMIN_DEVICES}). Please log out from another device before logging in here.`,
          code: "ADMIN_DEVICE_LIMIT_REACHED",
          activeDeviceCount: activeSessions.length,
          maxAllowedDevices: MAX_ADMIN_DEVICES,
          activeDevices: sanitizedDevices,
        });
      }

      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await AdminOtpVerification.deleteMany({});
      await AdminOtpVerification.create({
        otpHash,
        expiresAt,
        attempts: 0,
      });

      const recipientEmail = adminEmail || adminDoc?.email;
      try {
        await sendAdminOtpEmail({
          to: recipientEmail,
          otp,
          expiresInMinutes: 5,
        });
      } catch (emailErr) {
        console.error("Admin OTP email dispatch error:", emailErr.message);
        return res.status(500).json({
          message: "Failed to dispatch verification code to administrator email. Please verify SMTP server settings.",
          code: "EMAIL_DISPATCH_FAILED",
        });
      }

      return res.json({
        success: true,
        step: "OTP_REQUIRED",
        expiresInSeconds: 300,
        message: "A 6-digit verification code has been dispatched to the authorized institutional administrator email.",
      });
    }

    /* ─────────────────────────────────────────────────────────────
       7. ADMIN VERIFY OTP (/admin/verify-otp)
    ───────────────────────────────────────────────────────────── */
    if (action === "admin-verify-otp" && req.method === "POST") {
      const rawOtp = String(req.body.otp || "").trim();
      if (!rawOtp || rawOtp.length !== 6) {
        return res.status(400).json({
          message: "Please enter a valid 6-digit verification code.",
          code: "INVALID_FORMAT",
        });
      }

      const otpRecord = await AdminOtpVerification.findOne({
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({
          message: "Verification code has expired or is invalid. Please request a new code.",
          code: "OTP_EXPIRED",
        });
      }

      if (otpRecord.attempts >= 5) {
        await AdminOtpVerification.deleteMany({});
        return res.status(429).json({
          message: "Maximum verification attempts exceeded. Please enter your password to request a new code.",
          code: "MAX_ATTEMPTS_EXCEEDED",
        });
      }

      const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
      if (!isMatch) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remaining = 5 - otpRecord.attempts;
        return res.status(400).json({
          message: `Invalid verification code. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`,
          code: "INVALID_OTP",
          remainingAttempts: remaining,
        });
      }

      await AdminOtpVerification.deleteMany({});

      const activeSessions = await getActiveAdminSessions(AdminSession);
      if (activeSessions.length >= MAX_ADMIN_DEVICES) {
        const sanitizedDevices = activeSessions.map((s, idx) => ({
          deviceIndex: idx + 1,
          platform: s.deviceInfo?.platform || "Unknown",
          userAgent: s.deviceInfo?.userAgent || "Unknown",
          loggedInAt: s.loggedInAt,
          lastActiveAt: s.lastActiveAt,
          status: "ACTIVE",
        }));
        return res.status(403).json({
          message: `Admin device limit reached (${MAX_ADMIN_DEVICES} devices active). Please log out from another device.`,
          code: "ADMIN_DEVICE_LIMIT_REACHED",
          activeDevices: sanitizedDevices,
        });
      }

      const sessionId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);

      const userAgent = req.headers["user-agent"] || "Unknown";
      const ip = req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "";
      const platform = req.headers["sec-ch-ua-platform"] || "Web";

      await AdminSession.create({
        sessionId,
        deviceInfo: { userAgent, ip, platform },
        loggedInAt: now,
        lastActiveAt: now,
        expiresAt,
        isActive: true,
      });

      const token = jwt.sign(
        { role: "admin", sessionId, loggedInAt: now },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const maxAge = 7 * 24 * 60 * 60;
      res.setHeader("Set-Cookie", [
        `jwt=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`,
        `jwt=${token}; Path=/; HttpOnly; SameSite=None; Max-Age=${maxAge}`,
      ]);

      return res.json({
        success: true,
        token,
        message: "Admin authenticated successfully.",
      });
    }

    /* ─────────────────────────────────────────────────────────────
       7.5. SUB-ADMIN LOGIN (/api/auth/subadmin/login)
    ───────────────────────────────────────────────────────────── */
    if (action === "subadmin-login" && req.method === "POST") {
      const { email, password } = req.body || {};
      const cleanEmail = String(email || "").trim().toLowerCase();
      const candidatePassword = String(password || "");

      if (!candidatePassword) {
        return res.status(400).json({
          success: false,
          message: "Password is required.",
          code: "CREDENTIALS_REQUIRED",
        });
      }

      let subAdmin = null;
      if (cleanEmail) {
        subAdmin = await SubAdmin.findOne({ email: cleanEmail });
        if (!subAdmin) {
          return res.status(401).json({
            success: false,
            message: "Invalid Sub-Admin credentials.",
            code: "INVALID_CREDENTIALS",
          });
        }
        const isMatch = await subAdmin.comparePassword(candidatePassword);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: "Invalid Sub-Admin password.",
            code: "INVALID_CREDENTIALS",
          });
        }
      } else {
        const activeSubAdmins = await SubAdmin.find({ status: "active" });
        for (const sa of activeSubAdmins) {
          const isMatch = await sa.comparePassword(candidatePassword);
          if (isMatch) {
            subAdmin = sa;
            break;
          }
        }
        if (!subAdmin) {
          return res.status(401).json({
            success: false,
            message: "The Sub-Admin password entered does not match institutional records.",
            code: "INVALID_CREDENTIALS",
          });
        }
      }

      if (subAdmin.status !== "active") {
        return res.status(403).json({
          success: false,
          message: `Your Sub-Admin account is currently ${subAdmin.status}. Please contact the Main Administrator.`,
          code: `SUBADMIN_${subAdmin.status.toUpperCase()}`,
        });
      }

      // STRICT 1-DEVICE POLICY CHECK:
      const activeSessions = await SubAdminSession.find({
        subAdminId: subAdmin._id,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      let incomingToken = req.headers["x-admin-token"] || cookies.jwt;
      if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        incomingToken = req.headers.authorization.split(" ")[1];
      }

      let isCurrentDevice = false;
      if (incomingToken && incomingToken !== "none") {
        try {
          const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
          if (decoded.adminType === "subadmin" && decoded.sessionId) {
            const matching = activeSessions.find((s) => s.sessionId === decoded.sessionId);
            if (matching && matching.isActive) {
              isCurrentDevice = true;
              return res.json({
                success: true,
                alreadyLoggedIn: true,
                token: incomingToken,
                adminType: "subadmin",
                name: subAdmin.name,
                email: subAdmin.email,
                permissions: subAdmin.permissions || { routes: [], sections: [], actions: [] },
                message: "Sub-Admin is already actively authenticated on this device.",
              });
            }
          }
        } catch {}
      }

      // CRITICAL GUARD: Max 1 active device session
      if (activeSessions.length >= 1 && !isCurrentDevice) {
        const sanitizedDevices = activeSessions.map((s, idx) => ({
          deviceIndex: idx + 1,
          platform: s.deviceInfo?.platform || "Unknown",
          userAgent: s.deviceInfo?.userAgent || "Unknown",
          loggedInAt: s.loggedInAt,
          lastActiveAt: s.lastActiveAt,
          status: "ACTIVE",
        }));
        return res.status(403).json({
          success: false,
          message: `Your Sub-Admin portal is currently active on another device (maximum limit: 1 device). Please log out from that device to sign in here.`,
          code: "SUBADMIN_DEVICE_LIMIT_REACHED",
          activeDeviceCount: activeSessions.length,
          maxAllowedDevices: 1,
          activeDevices: sanitizedDevices,
        });
      }

      // Generate secure 6-digit OTP code
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

      // Store in SubAdminOtpVerification
      await SubAdminOtpVerification.deleteMany({ email: subAdmin.email });
      await SubAdminOtpVerification.create({
        email: subAdmin.email,
        otpHash,
        expiresAt,
        attempts: 0,
      });

      // Dispatch OTP email to Sub-Admin's registered email
      try {
        await sendSubAdminOtpEmail({
          to: subAdmin.email,
          name: subAdmin.name,
          otp,
          expiresInMinutes: 5,
        });
      } catch (emailErr) {
        console.error("Sub-Admin OTP email dispatch error:", emailErr.message);
        return res.status(500).json({
          success: false,
          message: "Failed to dispatch verification code to Sub-Admin email. Please check server email configuration.",
          code: "EMAIL_DISPATCH_FAILED",
        });
      }

      function maskEmail(e) {
        if (!e || !e.includes("@")) return e;
        const [l, d] = e.split("@");
        if (l.length <= 2) return `${l[0]}*@${d}`;
        return `${l[0]}${"*".repeat(Math.max(1, l.length - 2))}${l[l.length - 1]}@${d}`;
      }

      return res.json({
        success: true,
        step: "OTP_REQUIRED",
        email: subAdmin.email,
        maskedEmail: maskEmail(subAdmin.email),
        name: subAdmin.name,
        expiresInSeconds: 300,
        message: `A 6-digit verification code has been dispatched to ${maskEmail(subAdmin.email)}.`,
      });
    }

    /* ─────────────────────────────────────────────────────────────
       7.6. SUB-ADMIN VERIFY OTP (/api/auth/subadmin/verify-otp)
    ───────────────────────────────────────────────────────────── */
    if (action === "subadmin-verify-otp" && req.method === "POST") {
      const cleanEmail = String(req.body?.email || "").trim().toLowerCase();
      const rawOtp = String(req.body?.otp || "").trim();

      if (!cleanEmail || !rawOtp || rawOtp.length !== 6) {
        return res.status(400).json({
          success: false,
          message: "Please provide your registered Sub-Admin email and 6-digit verification code.",
          code: "INVALID_FORMAT",
        });
      }

      const subAdmin = await SubAdmin.findOne({ email: cleanEmail });
      if (!subAdmin) {
        return res.status(404).json({
          success: false,
          message: "Sub-Admin account not found.",
          code: "SUBADMIN_NOT_FOUND",
        });
      }

      if (subAdmin.status !== "active") {
        return res.status(403).json({
          success: false,
          message: `Your Sub-Admin account is currently ${subAdmin.status}. Access blocked.`,
          code: `SUBADMIN_${subAdmin.status.toUpperCase()}`,
        });
      }

      const otpRecord = await SubAdminOtpVerification.findOne({
        email: cleanEmail,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Verification code has expired or is invalid. Please request a new code.",
          code: "OTP_EXPIRED",
        });
      }

      if (otpRecord.attempts >= 5) {
        await SubAdminOtpVerification.deleteMany({ email: cleanEmail });
        return res.status(429).json({
          success: false,
          message: "Maximum verification attempts exceeded. Please enter your password to request a new code.",
          code: "MAX_ATTEMPTS_EXCEEDED",
        });
      }

      const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
      if (!isMatch) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remaining = 5 - otpRecord.attempts;
        return res.status(400).json({
          success: false,
          message: `Invalid verification code. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`,
          code: "INVALID_OTP",
          remainingAttempts: remaining,
        });
      }

      // OTP is valid! Delete used OTP records
      await SubAdminOtpVerification.deleteMany({ email: cleanEmail });

      // Strict 1-Device Limit: Invalidate any previous active sessions for this Sub-Admin
      await SubAdminSession.updateMany(
        { subAdminId: subAdmin._id, isActive: true },
        { isActive: false }
      );

      // Create new Sub-Admin Session
      const sessionId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);

      const userAgent = req.headers["user-agent"] || "Unknown";
      const ip = req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "";
      const platform = req.headers["sec-ch-ua-platform"] || "Web";

      await SubAdminSession.create({
        subAdminId: subAdmin._id,
        sessionId,
        deviceInfo: { userAgent, ip, platform },
        loggedInAt: now,
        lastActiveAt: now,
        expiresAt,
        isActive: true,
      });

      subAdmin.lastLoginAt = now;
      subAdmin.lastActiveAt = now;
      await subAdmin.save();

      const token = jwt.sign(
        {
          role: "admin",
          adminType: "subadmin",
          subAdminId: subAdmin._id,
          name: subAdmin.name,
          email: subAdmin.email,
          sessionId,
          loggedInAt: now,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const maxAge = 7 * 24 * 60 * 60;
      res.setHeader("Set-Cookie", [
        `jwt=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`,
        `jwt=${token}; Path=/; HttpOnly; SameSite=None; Max-Age=${maxAge}`,
      ]);

      return res.json({
        success: true,
        token,
        adminType: "subadmin",
        name: subAdmin.name,
        email: subAdmin.email,
        permissions: subAdmin.permissions || { routes: [], sections: [], actions: [] },
        message: `Welcome back, ${subAdmin.name}!`,
      });
    }

    /* ─────────────────────────────────────────────────────────────
       8. ADMIN CURRENT SESSION CHECK (/me or /admin/me)
    ───────────────────────────────────────────────────────────── */
    if ((action === "me" || action === "admin-me") && req.method === "GET") {
      let token = cookies.jwt;
      if (!token && req.headers["x-admin-token"]) {
        token = req.headers["x-admin-token"];
      }
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token || token === "none" || token === "") {
        return res.json({ success: false, message: "Not logged in" });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === "student") {
          return res.status(403).json({ message: "Forbidden: Admin privileges required" });
        }

        if (decoded.adminType === "subadmin") {
          if (decoded.sessionId) {
            const session = await SubAdminSession.findOne({
              sessionId: decoded.sessionId,
              isActive: true,
            });

            if (!session) {
              return res.status(401).json({
                success: false,
                code: "ADMIN_SESSION_TERMINATED",
                message: "Sub-Admin session ended because this device was logged out.",
              });
            }

            if (session.expiresAt && session.expiresAt < new Date()) {
              await SubAdminSession.deleteOne({ _id: session._id });
              return res.status(401).json({
                success: false,
                code: "INACTIVITY_LOGOUT",
                message: "Sub-Admin session expired due to 7 continuous days of inactivity.",
              });
            }

            session.lastActiveAt = new Date();
            session.expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);
            await session.save();
          }

          const subAdmin = await SubAdmin.findById(decoded.subAdminId);
          if (!subAdmin || subAdmin.status !== "active") {
            return res.status(403).json({
              success: false,
              code: "SUBADMIN_INACTIVE",
              message: "Sub-Admin account is inactive or revoked.",
            });
          }

          return res.json({
            success: true,
            role: "admin",
            adminType: "subadmin",
            subAdminId: subAdmin._id,
            name: subAdmin.name,
            email: subAdmin.email,
            permissions: subAdmin.permissions || { routes: [], sections: [], actions: [] },
            sessionId: decoded.sessionId,
            token,
          });
        }

        if (decoded.sessionId) {
          const session = await AdminSession.findOne({
            sessionId: decoded.sessionId,
            isActive: true,
          });

          if (!session) {
            return res.json({
              success: false,
              code: "ADMIN_SESSION_TERMINATED",
              message: "Admin session ended because this device was logged out.",
            });
          }

          if (!isAdminSessionValid(session)) {
            await AdminSession.deleteOne({ _id: session._id });
            return res.json({
              success: false,
              code: "INACTIVITY_LOGOUT",
              message: "Admin session expired due to 7 continuous days of inactivity.",
            });
          }

          await touchAdminSession(session);

          return res.json({
            success: true,
            role: "admin",
            adminType: "main",
            name: "Main Administrator",
            email: decoded.email || process.env.ADMIN_EMAIL,
            sessionId: session.sessionId,
            token,
          });
        }

        return res.json({
          success: true,
          role: "admin",
          adminType: "main",
          name: "Main Administrator",
          email: decoded.email || process.env.ADMIN_EMAIL,
          token,
        });
      } catch (err) {
        return res.json({ success: false, message: "Token invalid or expired" });
      }
    }

    /* ─────────────────────────────────────────────────────────────
       9. ADMIN LOGOUT (/logout or /admin/logout) - ONLY CALLING DEVICE
    ───────────────────────────────────────────────────────────── */
    if ((action === "logout" || action === "admin-logout") && req.method === "POST") {
      let token = cookies.jwt;
      if (!token && req.headers["x-admin-token"]) {
        token = req.headers["x-admin-token"];
      }
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (token && token !== "none") {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded?.sessionId) {
            if (decoded.adminType === "subadmin") {
              await SubAdminSession.deleteOne({ sessionId: decoded.sessionId });
            } else {
              await AdminSession.deleteOne({ sessionId: decoded.sessionId });
            }
          }
        } catch {}
      }

      res.setHeader("Set-Cookie", [
        `jwt=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        `jwt=; Path=/; HttpOnly; SameSite=None; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      ]);

      return res.status(200).json({ success: true, message: "Logged out successfully from this device." });
    }

    return res.status(404).json({ message: `Unknown auth action: ${action}` });
  } catch (error) {
    console.error("Auth handler error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
