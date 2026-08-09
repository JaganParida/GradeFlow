/**
 * GradeFlow Backlog Notification Email — Vercel Serverless Function
 *
 * Supports Brevo SMTP (smtp-relay.brevo.com:587) and Gmail.
 */

const nodemailer = require("nodemailer");
const axios = require("axios");
const { generateBacklogEmailHtml, generateBacklogEmailText } = require("./utils/emailTemplate");

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      return res.status(500).json({
        message: "Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in Vercel Environment Variables.",
      });
    }

    const { regNo, registrationNumber, studentId, customEmail, email } = req.body || {};
    const cleanRegNo = String(regNo || registrationNumber || studentId || "").trim();

    if (!cleanRegNo) {
      return res.status(400).json({ message: "Registration number is required." });
    }

    const serverUrl = process.env.SERVER_URL || "https://gradeflow-api.onrender.com";

    let studentData;
    try {
      const apiRes = await axios.get(`${serverUrl}/api/student/${cleanRegNo}`, { timeout: 15000 });
      studentData = apiRes.data;
    } catch (fetchErr) {
      if (fetchErr.response?.status === 404) {
        return res.status(404).json({ message: `No student records found for: ${cleanRegNo}` });
      }
      if (fetchErr.response?.status === 400) {
        return res.status(400).json({ message: `Invalid registration number: ${cleanRegNo}` });
      }
      console.error("Backend API fetch error:", fetchErr.message);
      return res.status(502).json({ message: "Failed to fetch student data from backend. The server may be starting up — please try again in 30 seconds." });
    }

    if (!studentData || !studentData.results || !studentData.results.length) {
      return res.status(404).json({ message: `No academic records found for: ${cleanRegNo}` });
    }

    const studentName = studentData.studentName || "Student";
    const cgpa = studentData.cgpa || 0;
    const backlogs = studentData.backlogs || [];
    const results = studentData.results || [];

    const semesters = results.map((r) => Number(r.semester) || 1);
    const latestSemester = semesters.length ? Math.max(...semesters) : 1;
    const completedSemesters = latestSemester;
    const remainingSemesters = Math.max(0, 8 - latestSemester);

    const defaultEmail = `${cleanRegNo}@centurionuniv.edu.in`.toLowerCase();
    const recipientEmail = String(customEmail || email || defaultEmail).trim().toLowerCase();

    // Prioritize EMAIL_HOST (Brevo: smtp-relay.brevo.com:587)
    const host = process.env.EMAIL_HOST || (process.env.EMAIL_SERVICE ? null : "smtp-relay.brevo.com");
    const port = Number(process.env.EMAIL_PORT) || 587;
    const secure = port === 465;
    const service = host ? null : process.env.EMAIL_SERVICE || "gmail";

    const transportConfig = service
      ? { service, auth: { user: emailUser, pass: emailPass } }
      : { host, port, secure, auth: { user: emailUser, pass: emailPass } };

    const transporter = nodemailer.createTransport({
      ...transportConfig,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    const frontendBaseUrl = process.env.FRONTEND_URL || "https://grade-flow-navy.vercel.app";

    const batch = studentData.batch || (results[0] && results[0].batch) || `20${cleanRegNo.slice(0, 2)}`;
    const branch = studentData.branch || (results[0] && results[0].branch) || "N/A";
    
    // Complete Section extraction matching the backend logic
    function getSectionFromRegNo(regNo) {
      if (!regNo) return "J";
      const r = String(regNo).trim();
      if (r === "230301180026") return "I";
      if (/^\d{2}0301120/.test(r)) {
         const num = parseInt(r.slice(-3), 10);
         if (num >= 1 && num <= 60) return "A";
         if (num >= 61 && num <= 120) return "B";
         if (num >= 121 && num <= 180) return "C";
         if (num >= 181 && num <= 240) return "D";
         if (num >= 241 && num <= 300) return "E";
         if (num >= 301 && num <= 360) return "F";
         if (num >= 361 && num <= 420) return "G";
         if (num >= 421 && num <= 480) return "H";
         if (num >= 481 && num <= 549) return "I";
      }
      return "J";
    }

    let rawSec = studentData.section || (results[0] && results[0].section) || getSectionFromRegNo(cleanRegNo);
    let section = rawSec;
    if (section && !section.startsWith("Sec")) section = `Sec ${section}`;
    if (!section) section = "N/A";

    const emailPayload = {
      studentName,
      regNo: cleanRegNo,
      cgpa,
      totalBacklogs: backlogs.length,
      completedSemesters,
      remainingSemesters,
      latestSemester,
      backlogSubjects: backlogs,
      batch,
      branch,
      section,
      developerWhatsapp: process.env.DEVELOPER_WHATSAPP || "919124540575",
      frontendUrl: frontendBaseUrl,
    };

    const html = generateBacklogEmailHtml(emailPayload);
    const text = generateBacklogEmailText(emailPayload);

    const subject = `Official Academic Status Update: ${cleanRegNo}`;

    // Sender must be a valid verified sender email in Brevo
    const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";

    const info = await transporter.sendMail({
      from: `"GradeFlow - Academic Updates" <${senderEmail}>`,
      replyTo: senderEmail,
      to: recipientEmail,
      subject,
      text,
      html,
    });

    return res.status(200).json({
      success: true,
      message: `Backlog notification email sent successfully to ${recipientEmail}`,
      recipientEmail,
      studentName,
      totalBacklogs: backlogs.length,
      messageId: info.messageId,
      sentAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Vercel email handler error:", err);

    if (err.code === "EAUTH") {
      return res.status(500).json({ message: "SMTP authentication failed. Verify EMAIL_USER and EMAIL_PASS." });
    }
    if (err.code === "ESOCKET" || err.code === "ECONNECTION") {
      return res.status(500).json({ message: "SMTP connection failed. Check EMAIL_HOST configuration." });
    }

    return res.status(500).json({
      message: err.message || "Failed to send email.",
    });
  }
};
