const nodemailer = require("nodemailer");
const { generateBacklogEmailHtml, generateBacklogEmailText } = require("./emailTemplate");

/**
 * Creates a Nodemailer transporter.
 * Supports Brevo (smtp-relay.brevo.com:587) and Gmail.
 */
let cachedTransporter = null;

/**
 * Creates and caches a high-performance pooled Nodemailer transporter.
 * Supports Brevo (smtp-relay.brevo.com:587) and Gmail.
 */
function createTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error(
      "Email service is not configured. Set EMAIL_USER and EMAIL_PASS environment variables."
    );
  }

  // If EMAIL_HOST is provided (e.g. Brevo: smtp-relay.brevo.com), use host & port configuration
  const host = process.env.EMAIL_HOST || (process.env.EMAIL_SERVICE ? null : "smtp-relay.brevo.com");
  const port = Number(process.env.EMAIL_PORT) || 587;
  const secure = port === 465;
  const service = host ? null : process.env.EMAIL_SERVICE || "gmail";

  const poolConfig = {
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 10,
  };

  const config = service
    ? {
        service,
        ...poolConfig,
        auth: { user: emailUser, pass: emailPass },
        family: 4, // Force IPv4 to prevent 3-5s IPv6 socket timeout on cloud hosts
        connectionTimeout: 5000,
        greetingTimeout: 3000,
        socketTimeout: 8000,
      }
    : {
        host,
        port,
        secure, // false for 587 (STARTTLS), true for 465
        ...poolConfig,
        auth: { user: emailUser, pass: emailPass },
        family: 4, // Force IPv4 to prevent 3-5s IPv6 socket timeout on cloud hosts
        connectionTimeout: 5000,
        greetingTimeout: 3000,
        socketTimeout: 8000,
      };

  cachedTransporter = nodemailer.createTransport(config);
  return cachedTransporter;
}

async function sendMailWithRetry(mailOptions) {
  try {
    const transporter = createTransporter();
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.warn("Retrying email dispatch after refreshing connection pool:", err.message);
    cachedTransporter = null;
    const freshTransporter = createTransporter();
    return await freshTransporter.sendMail(mailOptions);
  }
}

/**
 * Sends a personalized Backlog Notification Email to a student.
 */
async function sendBacklogEmailNotification({
  to,
  studentName,
  regNo,
  cgpa,
  totalBacklogs,
  completedSemesters,
  remainingSemesters,
  latestSemester,
  backlogSubjects,
  batch = "N/A",
  branch = "N/A",
  section = "N/A",
}) {
  const recipientEmail = String(to || "").trim().toLowerCase();

  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    throw new Error(`Invalid recipient email address: "${to}"`);
  }

  const emailPayload = {
    studentName,
    regNo,
    cgpa,
    totalBacklogs,
    completedSemesters,
    remainingSemesters,
    latestSemester,
    backlogSubjects,
    batch,
    branch,
    section,
    developerWhatsapp: process.env.DEVELOPER_WHATSAPP || "919124540575",
    frontendUrl: process.env.FRONTEND_URL || "https://grade-flow-navy.vercel.app",
  };

  const html = generateBacklogEmailHtml(emailPayload);
  const text = generateBacklogEmailText(emailPayload);

  const subject = `Official Academic Status Update: ${regNo}`;
  const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";

  const mailOptions = {
    from: `"GradeFlow - Academic Updates" <${senderEmail}>`,
    replyTo: senderEmail,
    to: recipientEmail,
    subject,
    text,
    html,
  };

  const info = await sendMailWithRetry(mailOptions);
  return {
    success: true,
    messageId: info.messageId,
    recipient: recipientEmail,
  };
}

/**
 * Sends a personalized Congratulatory Topper Email to a student.
 */
async function sendTopperEmailNotification({
  to,
  studentName,
  regNo,
  cgpa,
  sgpa,
  sectionCgpaRank,
  sectionSgpaRank,
  universityRank,
  semester,
  batch = "N/A",
  branch = "N/A",
  section = "N/A",
}) {
  const { generateTopperEmailHtml, generateTopperEmailText } = require("./topperEmailTemplate");
  const recipientEmail = String(to || "").trim().toLowerCase();

  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    throw new Error(`Invalid recipient email address: "${to}"`);
  }

  const emailPayload = {
    studentName,
    regNo,
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

  const subject = `Academic Excellence Recognition: ${studentName} (${regNo})`;
  const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";

  const mailOptions = {
    from: `"GradeFlow - Academic Updates" <${senderEmail}>`,
    replyTo: senderEmail,
    to: recipientEmail,
    subject,
    text,
    html,
  };

  return sendMailWithRetry(mailOptions);
}

module.exports = {
  createTransporter,
  sendBacklogEmailNotification,
  sendTopperEmailNotification,
};
