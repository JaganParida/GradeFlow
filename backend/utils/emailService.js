const nodemailer = require("nodemailer");
const { generateBacklogEmailHtml, generateBacklogEmailText } = require("./emailTemplate");

/**
 * Creates a Nodemailer transporter.
 * Supports Brevo (smtp-relay.brevo.com:587) and Gmail.
 */
function createTransporter() {
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
        secure, // false for 587 (STARTTLS), true for 465
        auth: { user: emailUser, pass: emailPass },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      };

  return nodemailer.createTransport(config);
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
    batch,
    branch,
    section,
    developerWhatsapp: process.env.DEVELOPER_WHATSAPP || "919124540575",
    frontendUrl: process.env.FRONTEND_URL || "https://grade-flow-navy.vercel.app",
  };

  const html = generateBacklogEmailHtml(emailPayload);
  const text = generateBacklogEmailText(emailPayload);

  const subject = `Official Academic Status Update: ${regNo}`;
  const frontendUrl = process.env.FRONTEND_URL || "https://grade-flow-navy.vercel.app";

  // Use EMAIL_FROM or registered email address as the 'from' header
  // Note: EMAIL_USER (e.g. b4d4bb001@smtp-brevo.com) is the Brevo SMTP auth login, but 'from' must be a valid email.
  const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";

  const mailOptions = {
    from: `"Jagan Parida" <${senderEmail}>`,
    replyTo: senderEmail,
    to: recipientEmail,
    subject,
    text,
    html,
    list: {
      unsubscribe: {
        url: `${frontendUrl}/dashboard/${regNo}`,
        comment: "View your GradeFlow dashboard",
      },
    },
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
