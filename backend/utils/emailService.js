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

/**
 * Sends a 6-digit OTP verification code to student's centurion email.
 */
async function sendOtpEmail({
  to,
  studentName = "Student",
  regNo,
  otp,
  expiresInMinutes = 3,
}) {
  const recipientEmail = String(to || "").trim().toLowerCase();

  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    throw new Error(`Invalid recipient email address: "${to}"`);
  }

  const subject = `Your GradeFlow Verification Code: ${otp}`;
  const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GradeFlow Verification Code</title>
    </head>
    <body style="margin: 0; padding: 32px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 460px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);">
        <!-- Top University Header -->
        <tr>
          <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
            <div style="font-size: 19px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">GradeFlow</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px; font-weight: 500;">Centurion University of Technology and Management</div>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding: 28px 32px;">
            <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
              Hello ${studentName || "Student"},
            </div>
            <div style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
              Here is your single-use verification code to authenticate student account <strong>${regNo}</strong> on GradeFlow:
            </div>

            <!-- Crisp Monospace OTP Display -->
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
              <tr>
                <td align="center" style="background: #f1f5f9; border-radius: 12px; padding: 18px 24px; border: 1px solid #e2e8f0;">
                  <div style="font-family: 'SF Mono', 'Space Mono', Monaco, Consolas, monospace; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #1e293b;">
                    ${otp}
                  </div>
                </td>
              </tr>
            </table>

            <div style="font-size: 12.5px; color: #64748b; line-height: 1.5; text-align: center;">
              ⏳ This verification code expires in <strong>${expiresInMinutes} minutes</strong>.
            </div>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px dashed #e2e8f0; font-size: 11.5px; color: #94a3b8; line-height: 1.5; text-align: center;">
              🔒 <strong>Single Device Session:</strong> If you did not request this OTP, please ignore this email. Maximum 2 verification attempts allowed per calendar day.
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding: 16px 32px; background: #fafafa; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} GradeFlow &middot; CUTM Student Academic Portal
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `Hello ${studentName || "Student"},\n\nYour GradeFlow login verification code for registration number ${regNo} is: ${otp}\n\nThis OTP is valid for ${expiresInMinutes} minutes only.\n\nGradeFlow Academic Portal`;

  const mailOptions = {
    from: `"GradeFlow" <${senderEmail}>`,
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
  sendOtpEmail,
};

