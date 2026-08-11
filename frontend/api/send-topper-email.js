const nodemailer = require("nodemailer");
const { generateTopperEmailHtml, generateTopperEmailText } = require("./utils/topperEmailTemplate.js");

function createTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER and EMAIL_PASS environment variables are missing.");
  }

  const host = process.env.EMAIL_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.EMAIL_PORT) || 587;
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: emailUser, pass: emailPass },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

function detectBranch(regNo) {
  const r = String(regNo || "").trim();
  if (r === "230301180026") return "ECE";
  if (r === "230301231033") return "AERO";

  const suffix = r.length >= 9 ? r.slice(2) : r;

  if (suffix.startsWith("0301110") || suffix.startsWith("0301111")) return "CIVIL";
  if (suffix.startsWith("0301120") || suffix.startsWith("0301121")) return "CSE";
  if (suffix.startsWith("0301130") || suffix.startsWith("0301131") || suffix.startsWith("0301132")) return "ECE";
  if (suffix.startsWith("0301150") || suffix.startsWith("0301151")) return "EEE";
  if (suffix.startsWith("0301160") || suffix.startsWith("0301161")) return "ME";
  if (suffix.startsWith("0301180")) return "BIO";
  if (suffix.startsWith("0301190") || suffix.startsWith("0301191")) return "MI";
  if (suffix.startsWith("0301230")) return "AERO";

  return "CSE";
}

function getSectionFromRegNo(regNo) {
  const r = String(regNo || "").trim();
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
  return "A";
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { regNo, customEmail } = req.body || {};
    const cleanRegNo = String(regNo || "").trim();

    if (!cleanRegNo) {
      return res.status(400).json({ message: "Registration number is required" });
    }

    const backendUrl = process.env.BACKEND_INTERNAL_URL || "https://gradeflow-api.onrender.com";
    
    // Fetch latest rankings for student
    const fetchRes = await fetch(`${backendUrl}/api/rankings/top?search=${encodeURIComponent(cleanRegNo)}&limit=50`);
    if (!fetchRes.ok) {
      throw new Error(`Failed to fetch student data from backend API (Status ${fetchRes.status})`);
    }

    const rankings = await fetchRes.json();
    const rk = Array.isArray(rankings) && rankings.length > 0 ? rankings[0] : null;

    const studentName = rk?.studentName || "Student";
    const cgpa = rk?.cgpa || 0;
    const sgpa = rk?.sgpa || 0;
    const semester = rk?.semester || 1;
    const batch = rk?.batch || (`20${cleanRegNo.slice(0, 2)}`);
    const branch = rk?.branch || detectBranch(cleanRegNo);
    let section = rk?.section || getSectionFromRegNo(cleanRegNo);
    section = String(section).replace(/^Sec\s*/i, "");

    const sectionCgpaRank = rk?.sectionCgpaRank || rk?.sectionSgpaRank || 1;
    const sectionSgpaRank = rk?.sectionSgpaRank || 1;
    const universityRank = rk?.universityRank || rk?.cgpaRank || null;

    const recipientEmail = customEmail ? String(customEmail).trim().toLowerCase() : `${cleanRegNo}@centurionuniv.edu.in`.toLowerCase();

    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return res.status(400).json({ message: `Invalid recipient email address: "${recipientEmail}"` });
    }

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
    const subject = `Academic Excellence Recognition: ${cleanName} (${cleanRegNo})`;
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

    // Fire & forget status update to backend tracking
    try {
      await fetch(`${backendUrl}/api/admin/section-toppers/topper-email-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": req.headers.authorization || ""
        },
        body: JSON.stringify({ regNo: cleanRegNo, status: "SUCCESS" })
      });
    } catch (e) {
      console.warn("Failed to sync topper email status to backend:", e);
    }

    return res.status(200).json({
      success: true,
      message: `Congratulatory email sent successfully to ${recipientEmail}`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Vercel send-topper-email error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error sending congratulatory email",
    });
  }
};
