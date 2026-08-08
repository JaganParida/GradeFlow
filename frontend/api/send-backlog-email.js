/**
 * GradeFlow Backlog Notification Email — Vercel Serverless Function
 *
 * This function runs on Vercel's infrastructure (NOT on Render).
 * It reads EMAIL_USER, EMAIL_PASS etc. from Vercel Environment Variables.
 * It fetches student academic data from the Render Backend API.
 * It sends the email via Nodemailer directly from Vercel.
 *
 * Why Vercel? → Avoids Render free-tier sleep delay, IP blocking, and request timeouts.
 */

require("dotenv").config();
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
    // ── 1. Validate Email Credentials from Vercel Environment Variables ──
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      return res.status(500).json({
        message: "Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in Vercel Dashboard → Settings → Environment Variables.",
      });
    }

    // ── 2. Extract Registration Number from Request Body ──
    const { regNo, registrationNumber, studentId, customEmail, email } = req.body || {};
    const cleanRegNo = String(regNo || registrationNumber || studentId || "").trim();

    if (!cleanRegNo) {
      return res.status(400).json({ message: "Registration number is required." });
    }

    // ── 3. Fetch Fresh Student Data from Render Backend API ──
    // Never trust frontend-provided academic data — always fetch from DB
    const serverUrl = process.env.SERVER_URL || "https://gradeflow-api.onrender.com";

    let studentData;
    try {
      const apiRes = await axios.get(`${serverUrl}/api/student/${cleanRegNo}`, { timeout: 12000 });
      studentData = apiRes.data;
    } catch (fetchErr) {
      if (fetchErr.response?.status === 404) {
        return res.status(404).json({ message: `No student records found for registration number: ${cleanRegNo}` });
      }
      if (fetchErr.response?.status === 400) {
        return res.status(400).json({ message: `Invalid registration number format: ${cleanRegNo}` });
      }
      console.error("Backend API fetch error:", fetchErr.message);
      return res.status(502).json({ message: "Failed to fetch student data from backend. The backend server may be sleeping — please try again in 30 seconds." });
    }

    if (!studentData || !studentData.results || !studentData.results.length) {
      return res.status(404).json({ message: `No academic records found for: ${cleanRegNo}` });
    }

    // ── 4. Extract & Calculate Academic Information ──
    const studentName = studentData.studentName || "Student";
    const cgpa = studentData.cgpa || 0;
    const backlogs = studentData.backlogs || [];
    const results = studentData.results || [];

    if (!backlogs.length) {
      return res.status(400).json({ message: `Student ${cleanRegNo} (${studentName}) currently has 0 active backlogs. No email sent.` });
    }

    // Calculate semesters
    const semesters = results.map((r) => Number(r.semester) || 1);
    const latestSemester = semesters.length ? Math.max(...semesters) : 1;
    const completedSemesters = latestSemester;
    const remainingSemesters = Math.max(0, 8 - latestSemester);

    // ── 5. Generate Recipient Email ──
    const defaultEmail = `${cleanRegNo}@centurionuniv.edu.in`.toLowerCase();
    const recipientEmail = String(customEmail || email || defaultEmail).trim().toLowerCase();

    // ── 6. Create Nodemailer Transporter ──
    const service = process.env.EMAIL_SERVICE;
    const host = process.env.EMAIL_HOST || "smtp.gmail.com";
    const port = Number(process.env.EMAIL_PORT) || 465;

    const transportConfig = service
      ? { service, auth: { user: emailUser, pass: emailPass } }
      : { host, port, secure: port === 465, auth: { user: emailUser, pass: emailPass } };

    const transporter = nodemailer.createTransport({
      ...transportConfig,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    // ── 7. Generate Professional HTML & Text Email ──
    const emailPayload = {
      studentName,
      regNo: cleanRegNo,
      cgpa,
      totalBacklogs: backlogs.length,
      completedSemesters,
      remainingSemesters,
      latestSemester,
      backlogSubjects: backlogs,
      developerWhatsapp: process.env.DEVELOPER_WHATSAPP || "919124540575",
      frontendUrl: process.env.FRONTEND_URL || "https://grade-flow-navy.vercel.app",
    };

    const html = generateBacklogEmailHtml(emailPayload);
    const text = generateBacklogEmailText(emailPayload);

    const subject = `GradeFlow | Backlog Academic Notification – ${backlogs.length} Pending Subject${backlogs.length === 1 ? "" : "s"}`;

    // ── 8. Send Email with Anti-Spam Headers & Text Fallback ──
    const info = await transporter.sendMail({
      from: `"GradeFlow Academic System" <${emailUser}>`,
      replyTo: emailUser,
      to: recipientEmail,
      subject,
      text,
      html,
      headers: {
        "X-Mailer": "GradeFlow Academic System v1.0",
        "X-Entity-Ref-ID": cleanRegNo,
        "X-Auto-Response-Suppress": "OOF, AutoReply",
      },
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

    // Handle specific SMTP errors
    if (err.code === "EAUTH") {
      return res.status(500).json({ message: "SMTP authentication failed. Please verify EMAIL_USER and EMAIL_PASS in Vercel Environment Variables." });
    }
    if (err.code === "ESOCKET" || err.code === "ECONNECTION") {
      return res.status(500).json({ message: "SMTP connection failed. Please check EMAIL_SERVICE/EMAIL_HOST configuration." });
    }

    return res.status(500).json({
      message: err.message || "Failed to send email. Please try again.",
    });
  }
};
