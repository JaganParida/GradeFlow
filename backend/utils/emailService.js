const path = require("path");
const nodemailer = require("nodemailer");
const { generateBacklogEmailHtml, generateBacklogEmailText } = require("./emailTemplate");

/**
 * Creates a Nodemailer transporter with connection timeout configuration
 * suitable for Vercel serverless functions and standard Node.js servers.
 */
function createTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error(
      "Email service is not configured on the server. Please set EMAIL_USER and EMAIL_PASS environment variables."
    );
  }

  const service = process.env.EMAIL_SERVICE;
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT) || 465;
  const secure = port === 465; // true for 465, false for 587/other

  const config = service
    ? {
        service,
        auth: { user: emailUser, pass: emailPass },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      }
    : {
        host,
        port,
        secure,
        auth: { user: emailUser, pass: emailPass },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      };

  return nodemailer.createTransport(config);
}

/**
 * Sends a personalized Backlog Notification Email to a student
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
}) {
  const transporter = createTransporter();

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
    developerWhatsapp: process.env.DEVELOPER_WHATSAPP || "919124540575",
    frontendUrl: process.env.FRONTEND_URL || "https://grade-flow-navy.vercel.app",
  };

  const html = generateBacklogEmailHtml(emailPayload);
  const text = generateBacklogEmailText(emailPayload);

  const numBacklogs = Number(totalBacklogs) || (backlogSubjects ? backlogSubjects.length : 0);
  const subject = `GradeFlow Academic Record Notice – Reg. No. ${regNo}`;

  const mailOptions = {
    from: `"GradeFlow Academic System" <${process.env.EMAIL_USER}>`,
    replyTo: process.env.EMAIL_USER,
    to: recipientEmail,
    subject,
    text,
    html,
    headers: {
      "X-Mailer": "GradeFlow Academic System v1.0",
      "X-Entity-Ref-ID": String(regNo || ""),
      "X-Auto-Response-Suppress": "OOF, AutoReply",
    },
    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../assets/logo.png"),
        cid: "gradeflow-logo",
      },
      {
        filename: "whatsapp.png",
        path: path.join(__dirname, "../assets/whatsapp.png"),
        cid: "whatsapp-icon",
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    messageId: info.messageId,
    recipient: recipientEmail,
  };
}

module.exports = {
  createTransporter,
  sendBacklogEmailNotification,
};
