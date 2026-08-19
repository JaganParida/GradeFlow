const connectToDatabase = require("./_lib/db");
const Admin = require("./_lib/models/Admin");
const SemesterResult = require("./_lib/models/SemesterResult");
const OtpVerification = require("./_lib/models/OtpVerification");
const StudentSession = require("./_lib/models/StudentSession");
const StudentDailyLimit = require("./_lib/models/StudentDailyLimit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie",
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

async function sendOtpEmail({ to, studentName = "Student", regNo, otp, expiresInMinutes = 3 }) {
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

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectToDatabase();
    const action = req.query.action;
    const cookies = parseCookies(req.headers.cookie);

    /* ─────────────────────────────────────────────────────────────
       1. STUDENT SEND OTP
    ───────────────────────────────────────────────────────────── */
    if ((action === "student-send-otp" || action === "send-otp") && req.method === "POST") {
      const rawReg = String(req.body.regNo || "").trim().toUpperCase();
      if (!rawReg) {
        return res.status(400).json({ message: "Registration number is required." });
      }

      // Verify student exists in records
      const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
      if (!studentRecord) {
        return res.status(404).json({
          message: "No student records found for this registration number. Please check and try again.",
        });
      }

      const studentName = studentRecord.studentName || "Student";
      const studentEmail = `${rawReg.toLowerCase()}@centurionuniv.edu.in`;

      // ── Single Device Session Check ──
      const existingSession = await StudentSession.findOne({ regNo: rawReg, isActive: true });
      if (existingSession) {
        let incomingToken = cookies.student_jwt;
        if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
          incomingToken = req.headers.authorization.split(" ")[1];
        }

        let isCurrentDevice = false;
        if (incomingToken) {
          try {
            const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
            if (decoded.sessionId === existingSession.sessionId) {
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

        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const lastActive = new Date(existingSession.lastActiveAt).getTime();
        if (Date.now() - lastActive > SEVEN_DAYS_MS) {
          await StudentSession.deleteOne({ _id: existingSession._id });
        } else {
          return res.status(409).json({
            message: "This account is already active and logged in on another device. For security, concurrent logins are restricted. Please log out from your active device first.",
            code: "DEVICE_ALREADY_ACTIVE",
            activeSince: existingSession.loggedInAt,
          });
        }
      }

      // ── Daily Limit Check (Max 2 attempts/day, bypassed for developer whitelisted regNo) ──
      const UNLIMITED_REG_NOS = ["230301120327"];
      const isUnlimited = UNLIMITED_REG_NOS.includes(rawReg);

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
      const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

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
          expiresInMinutes: 3,
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
        expiresInSeconds: 180,
        remainingDailyAttempts: Math.max(0, 2 - dailyLimit.otpSendCount),
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
        return res.status(400).json({
          message: "No active verification code found or code has expired. Please request a new code.",
          code: "OTP_EXPIRED",
        });
      }

      if (new Date() > new Date(otpRecord.expiresAt)) {
        await OtpVerification.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({
          message: "The verification code has expired (validity is strictly 3 minutes). Please request a new code.",
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
        const remainingAttempts = 5 - otpRecord.attempts;
        return res.status(400).json({
          message: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
          code: "INVALID_OTP",
          remainingAttempts,
        });
      }

      // Valid OTP: delete OTP record
      await OtpVerification.deleteOne({ _id: otpRecord._id });

      // Create / overwrite single device session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await StudentSession.deleteMany({ regNo: rawReg });
      await StudentSession.create({
        regNo: rawReg,
        sessionId,
        deviceInfo: {
          userAgent: req.headers["user-agent"] || "",
          ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
        },
        loggedInAt: new Date(),
        lastActiveAt: new Date(),
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

      const cookieOptions = [
        `student_jwt=${token}`,
        `Path=/`,
        `HttpOnly`,
        `Secure`,
        `SameSite=None`,
        `Max-Age=${7 * 24 * 60 * 60}`,
      ].join("; ");
      res.setHeader("Set-Cookie", cookieOptions);

      const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });

      return res.json({
        success: true,
        message: "Successfully verified and authenticated.",
        token,
        student: {
          regNo: rawReg,
          studentName: studentRecord?.studentName || "Student",
          section: studentRecord?.branch || "CSE-A",
        },
      });
    }

    /* ─────────────────────────────────────────────────────────────
       3. STUDENT ME (CURRENT SESSION STATUS)
    ───────────────────────────────────────────────────────────── */
    if ((action === "student-me" || action === "me-student") && req.method === "GET") {
      let token = cookies.student_jwt;
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        return res.status(401).json({ authenticated: false, message: "No active student session." });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "student") {
          return res.status(403).json({ authenticated: false, message: "Invalid session role." });
        }

        const session = await StudentSession.findOne({
          regNo: decoded.regNo,
          sessionId: decoded.sessionId,
          isActive: true,
        });

        if (!session) {
          return res.status(401).json({
            authenticated: false,
            message: "Session ended or logged in from another device.",
            code: "SESSION_TERMINATED",
          });
        }

        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - new Date(session.lastActiveAt).getTime() > SEVEN_DAYS_MS) {
          await StudentSession.deleteOne({ _id: session._id });
          return res.status(401).json({
            authenticated: false,
            message: "Session expired due to 7 days of inactivity.",
            code: "SESSION_INACTIVE_EXPIRED",
          });
        }

        session.lastActiveAt = new Date();
        await session.save();

        const studentRecord = await SemesterResult.findOne({ regNo: decoded.regNo }).sort({ semester: -1 });

        return res.json({
          authenticated: true,
          student: {
            regNo: decoded.regNo,
            studentName: studentRecord?.studentName || "Student",
            section: studentRecord?.branch || "CSE-A",
          },
          session: {
            loggedInAt: session.loggedInAt,
            lastActiveAt: session.lastActiveAt,
          },
        });
      } catch (err) {
        return res.status(401).json({ authenticated: false, message: "Invalid or expired session token." });
      }
    }

    /* ─────────────────────────────────────────────────────────────
       4. STUDENT LOGOUT
    ───────────────────────────────────────────────────────────── */
    if ((action === "student-logout" || action === "logout-student") && req.method === "POST") {
      let token = cookies.student_jwt;
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          await StudentSession.deleteMany({ regNo: decoded.regNo, sessionId: decoded.sessionId });
        } catch {}
      }

      const cookieOptions = [
        `student_jwt=`,
        `Path=/`,
        `HttpOnly`,
        `Secure`,
        `SameSite=None`,
        `Max-Age=0`,
      ].join("; ");
      res.setHeader("Set-Cookie", cookieOptions);

      return res.json({ success: true, message: "Student logged out successfully." });
    }

    /* ─────────────────────────────────────────────────────────────
       5. ADMIN LOGIN, LOGOUT & ME
    ───────────────────────────────────────────────────────────── */
    if (action === "login" && req.method === "POST") {
      const { email, password } = req.body || {};
      const admin = await Admin.findOne({ email });
      if (!admin || !(await admin.comparePassword(password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign(
        { id: admin._id, email: admin.email, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      const cookieOptions = [
        `jwt=${token}`,
        `Path=/`,
        `HttpOnly`,
        `Secure`,
        `SameSite=None`,
        `Max-Age=${24 * 60 * 60}`,
      ].join("; ");
      res.setHeader("Set-Cookie", cookieOptions);
      return res.json({ success: true, email: admin.email, token });
    }

    if (action === "logout" && req.method === "POST") {
      const cookieOptions = [
        `jwt=`,
        `Path=/`,
        `HttpOnly`,
        `Secure`,
        `SameSite=None`,
        `Max-Age=0`,
      ].join("; ");
      res.setHeader("Set-Cookie", cookieOptions);
      return res.status(200).json({ success: true, message: "Admin logged out" });
    }

    if (action === "me" && req.method === "GET") {
      let token = cookies.jwt;
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }
      if (!token || token === "none" || token === "") {
        return res.json({ success: false, message: "Not logged in" });
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id).select("-password");
        if (!admin) {
          return res.json({ success: false, message: "Admin not found" });
        }
        return res.json({ success: true, admin });
      } catch {
        return res.json({ success: false, message: "Token invalid or expired" });
      }
    }

    return res.status(404).json({ message: "Auth action not found" });
  } catch (err) {
    console.error("Vercel Serverless Auth Error:", err);
    return res.status(500).json({ message: err.message || "Server error", error: err.toString() });
  }
};
