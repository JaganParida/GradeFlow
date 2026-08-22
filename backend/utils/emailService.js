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
    <body style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202124; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; text-align: left;">
        <!-- Brand Header -->
        <tr>
          <td style="padding-bottom: 24px;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: middle;">
                  <div style="font-size: 20px; font-weight: 700; color: #1a73e8; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">GradeFlow</div>
                </td>
              </tr>
            </table>
            <div style="font-size: 12px; color: #5f6368; margin-top: 4px; font-weight: 400;">
              Centurion University of Technology and Management
            </div>
          </td>
        </tr>

        <!-- Divider Line -->
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 28px;">
            <div style="font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 16px; letter-spacing: -0.3px;">
              Verification code
            </div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 12px;">
              Hi ${studentName || "Student"},
            </div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 28px;">
              Please use the verification code below to sign in to your GradeFlow account for registration number <strong>${regNo}</strong>:
            </div>

            <!-- Crisp OTP Code -->
            <div style="font-size: 38px; font-weight: 700; letter-spacing: 8px; color: #1a73e8; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; margin-bottom: 28px;">
              ${otp}
            </div>

            <div style="font-size: 13px; color: #5f6368; line-height: 1.6; margin-bottom: 14px;">
              This code will expire in ${expiresInMinutes} minutes. For security reasons, do not share this code with anyone.
            </div>

            <div style="font-size: 13px; color: #5f6368; line-height: 1.6; margin-bottom: 32px;">
              If you did not request this verification code, you can safely ignore this email. Someone may have entered your registration number by mistake.
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 20px; font-size: 12px; color: #70757a; line-height: 1.5;">
            <div>GradeFlow Academic Intelligence &bull; Centurion University</div>
            <div style="margin-top: 4px; color: #80868b; font-size: 11px;">
              This is an automated authentication message. Please do not reply directly to this email.
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `Hi ${studentName || "Student"},\n\nYour GradeFlow verification code for registration number ${regNo} is:\n\n${otp}\n\nThis code will expire in ${expiresInMinutes} minutes. If you did not request this code, you can safely ignore this email.\n\nGradeFlow Academic Portal\nCenturion University of Technology and Management`;

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

/**
 * Sends a 6-digit Admin Security Verification Code to the authorized institutional ADMIN_EMAIL.
 */
async function sendAdminOtpEmail({ to, otp, expiresInMinutes = 5 }) {
  const recipientEmail = String(to || "").trim().toLowerCase();

  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    throw new Error(`Invalid recipient email address`);
  }

  const subject = `GradeFlow Institutional Admin Security Code: ${otp}`;
  const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GradeFlow Institutional Admin Code</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; text-align: left; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px 28px;">
        <tr>
          <td style="padding-bottom: 20px;">
            <div style="font-size: 20px; font-weight: 800; color: #38bdf8; letter-spacing: -0.5px;">GradeFlow Admin Security</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Institutional Administration Gateway</div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #334155; padding-top: 24px;">
            <div style="font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 12px;">Admin Verification Code</div>
            <div style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px;">
              An administrative login attempt has been initiated with the correct master password. Use the single-use verification code below to authorize this session:
            </div>
            <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace; background: #0f172a; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid #334155; margin-bottom: 24px;">
              ${otp}
            </div>
            <div style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px;">
              This code will expire in ${expiresInMinutes} minutes. If you did not initiate this login request, please inspect your server security immediately.
            </div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #334155; padding-top: 18px; font-size: 11px; color: #64748b;">
            GradeFlow Enterprise Security Gateway &bull; Max 2 Authorized Active Devices
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `GradeFlow Institutional Admin Security Code:\n\n${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\n\nGradeFlow Enterprise Security Gateway`;

  const mailOptions = {
    from: `"GradeFlow Admin Gateway" <${senderEmail}>`,
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
  sendAdminOtpEmail,
};

