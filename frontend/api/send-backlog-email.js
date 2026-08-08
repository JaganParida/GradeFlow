/**
 * GradeFlow Backlog Notification Email — Vercel Serverless Function
 *
 * ZERO attachments, personal-style email for Primary Inbox delivery.
 * Uses Nodemailer with Gmail SMTP.
 * 
 * NOTE: Do NOT use require("dotenv") here — Vercel injects env vars automatically.
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

    if (!backlogs.length) {
      return res.status(400).json({ message: `Student ${cleanRegNo} (${studentName}) has 0 active backlogs. No email sent.` });
    }

    const semesters = results.map((r) => Number(r.semester) || 1);
    const latestSemester = semesters.length ? Math.max(...semesters) : 1;
    const completedSemesters = latestSemester;
    const remainingSemesters = Math.max(0, 8 - latestSemester);

    const defaultEmail = `${cleanRegNo}@centurionuniv.edu.in`.toLowerCase();
    const recipientEmail = String(customEmail || email || defaultEmail).trim().toLowerCase();

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

    const frontendBaseUrl = process.env.FRONTEND_URL || "https://grade-flow-navy.vercel.app";

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
      frontendUrl: frontendBaseUrl,
    };

    const html = generateBacklogEmailHtml(emailPayload);
    const text = generateBacklogEmailText(emailPayload);

    const subject = `Your GradeFlow Academic Update - ${cleanRegNo}`;

    const info = await transporter.sendMail({
      from: `"Jagan Parida" <${emailUser}>`,
      replyTo: emailUser,
      to: recipientEmail,
      subject,
      text,
      html,
      list: {
        unsubscribe: {
          url: `${frontendBaseUrl}/dashboard/${cleanRegNo}`,
          comment: "View your GradeFlow dashboard",
        },
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
