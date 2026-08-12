const nodemailer = require("nodemailer");
const { generateTopperEmailHtml, generateTopperEmailText } = require("../lib/utils/topperEmailTemplate.js");

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
    : { host, port, secure, auth: { user: emailUser, pass: emailPass } };

  return nodemailer.createTransport({
    ...config,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
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

    const cleanRegNo = String(regNo || "").trim();

    if (!cleanRegNo) {
      return res.status(400).json({ message: "Registration number is required" });
    }

    const defaultEmail = `${cleanRegNo}@centurionuniv.edu.in`.toLowerCase();
    const recipientEmail = String(customEmail || defaultEmail).trim().toLowerCase();

    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return res.status(400).json({ message: `Invalid recipient email address: "${recipientEmail}"` });
    }

    const frontendBaseUrl = process.env.FRONTEND_URL || "https://grade-flow-navy.vercel.app";

    const emailPayload = {
      studentName,
      regNo: cleanRegNo,
      cgpa,
      sgpa,
      sectionCgpaRank,
      sectionSgpaRank,
      universityRank,
      semester,
      batch,
      branch,
      section: String(section).replace(/^Sec\s*/i, ""),
      developerWhatsapp: process.env.DEVELOPER_WHATSAPP || "919124540575",
      frontendUrl: frontendBaseUrl,
    };

    const html = generateTopperEmailHtml(emailPayload);
    const text = generateTopperEmailText(emailPayload);
    const subject = `Academic Excellence Recognition: ${studentName} (${cleanRegNo})`;
    const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";

    const transporter = createTransporter();
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
      message: `Congratulatory email sent successfully to ${recipientEmail}`,
      recipientEmail,
      messageId: info.messageId,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Vercel send-topper-email error:", error);
    if (error.code === "EAUTH") {
      return res.status(500).json({ message: "SMTP authentication failed. Verify EMAIL_USER and EMAIL_PASS." });
    }
    if (error.code === "ESOCKET" || error.code === "ECONNECTION") {
      return res.status(500).json({ message: "SMTP connection failed. Check EMAIL_HOST configuration." });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error sending congratulatory email",
    });
  }
};
