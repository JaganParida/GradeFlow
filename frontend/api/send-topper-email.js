const nodemailer = require("nodemailer");
const { generateTopperEmailHtml, generateTopperEmailText } = require("./_lib/topperEmailTemplate.js");

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

module.exports = async function handler(req, res) {
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
      return res.status(400).json({ message: "Registration number is required." });
    }

    const recipientEmail = customEmail || `${cleanRegNo}@centurionuniv.edu.in`;

    const transporter = createTransporter();

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
      section,
      developerWhatsapp: process.env.DEVELOPER_WHATSAPP || "919124540575",
      frontendUrl: process.env.FRONTEND_URL || "https://grade-flow-navy.vercel.app",
    };

    const html = generateTopperEmailHtml(emailPayload);
    const text = generateTopperEmailText(emailPayload);

    const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";

    const mailOptions = {
      from: `"GradeFlow - Academic Updates" <${senderEmail}>`,
      replyTo: senderEmail,
      to: recipientEmail,
      subject: `Academic Excellence Recognition: ${studentName} (${cleanRegNo})`,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: `🎉 Congratulatory topper email sent successfully to ${recipientEmail}!`,
      messageId: info.messageId,
      recipient: recipientEmail,
    });
  } catch (err) {
    console.error("Vercel Serverless Topper Email Error:", err);
    return res.status(500).json({
      message: err.message || "Failed to send congratulatory topper email.",
      error: err.toString(),
    });
  }
};
