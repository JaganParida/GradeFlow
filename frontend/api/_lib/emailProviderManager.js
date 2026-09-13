const nodemailer = require("nodemailer");

/**
 * GradeFlow Serverless Email Provider Abstraction
 * - Primary: Brevo SMTP (smtp-relay.brevo.com:587)
 * - Fallback: Gmail SMTP (smtp.gmail.com:465 / 587)
 * - Error classification and seamless single-OTP failover
 */

class EmailProviderError extends Error {
  constructor(message, classification, originalError = null) {
    super(message);
    this.name = "EmailProviderError";
    this.classification = classification;
    this.originalError = originalError;
  }
}

// In-memory provider circuit-breaker tracking
const providerState = {
  brevo1: {
    isQuotaExhausted: false,
    quotaExhaustedUntil: null,
    consecutiveFailures: 0,
    dailySentCount: 0,
    lastSentDate: new Date().toISOString().slice(0, 10),
  },
  brevo2: {
    isQuotaExhausted: false,
    quotaExhaustedUntil: null,
    consecutiveFailures: 0,
    dailySentCount: 0,
    lastSentDate: new Date().toISOString().slice(0, 10),
  },
  gmail: {
    isQuotaExhausted: false,
    quotaExhaustedUntil: null,
    consecutiveFailures: 0,
    dailySentCount: 0,
    lastSentDate: new Date().toISOString().slice(0, 10),
  },
};
// Backward compatibility alias for legacy tests
providerState.brevo = providerState.brevo1;

function resetDailyCountersIfNewDay() {
  const today = new Date().toISOString().slice(0, 10);
  ["brevo1", "brevo2", "gmail"].forEach((p) => {
    if (providerState[p].lastSentDate !== today) {
      providerState[p].dailySentCount = 0;
      providerState[p].isQuotaExhausted = false;
      providerState[p].quotaExhaustedUntil = null;
      providerState[p].lastSentDate = today;
    }
  });
}

function classifySmtpError(err) {
  const msg = String(err?.message || "").toLowerCase();
  const code = String(err?.code || "").toUpperCase();
  const responseCode = Number(err?.responseCode) || 0;

  if (
    responseCode === 450 ||
    responseCode === 451 ||
    responseCode === 452 ||
    responseCode === 550 ||
    msg.includes("quota") ||
    msg.includes("limit exceeded") ||
    msg.includes("credits exhausted") ||
    msg.includes("maximum credits") ||
    msg.includes("daily sending limit")
  ) {
    return "QUOTA_EXHAUSTED";
  }

  if (responseCode === 429 || msg.includes("too many requests") || msg.includes("rate limit")) {
    return "RATE_LIMITED";
  }

  if (
    responseCode === 535 ||
    code === "EAUTH" ||
    msg.includes("invalid login") ||
    msg.includes("authentication failed") ||
    msg.includes("bad credentials")
  ) {
    return "CONFIG_ERROR";
  }

  if (
    responseCode === 553 ||
    responseCode === 501 ||
    msg.includes("invalid recipient") ||
    msg.includes("recipient address rejected")
  ) {
    return "RECIPIENT_ERROR";
  }

  if (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ESOCKET" ||
    code === "ENOTFOUND" ||
    msg.includes("timeout") ||
    msg.includes("greeting never received")
  ) {
    return "TEMPORARY_FAILURE";
  }

  return "UNKNOWN";
}

// ── 1. Brevo #1 Primary Transporter ──────────────────────────────────
let cachedBrevo1 = null;

function getBrevo1Transporter() {
  if (cachedBrevo1) return cachedBrevo1;
  const emailUser = process.env.BREVO_USER_1 || process.env.BREVO_SMTP_USER_1 || process.env.EMAIL_USER;
  const emailPass = process.env.BREVO_PASS_1 || process.env.BREVO_SMTP_PASS_1 || process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) return null;

  const host = process.env.BREVO_HOST_1 || process.env.EMAIL_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.BREVO_PORT_1 || process.env.EMAIL_PORT) || 587;
  const secure = port === 465;

  cachedBrevo1 = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: emailUser, pass: emailPass },
    family: 4,
    connectionTimeout: 6000,
    greetingTimeout: 4000,
    socketTimeout: 10000,
  });
  return cachedBrevo1;
}

// ── 2. Brevo #2 Secondary Transporter ────────────────────────────────
let cachedBrevo2 = null;

function getBrevo2Transporter() {
  if (cachedBrevo2) return cachedBrevo2;
  const emailUser = process.env.BREVO_USER_2 || process.env.BREVO_SMTP_USER_2 || process.env.EMAIL_USER_2;
  const emailPass = process.env.BREVO_PASS_2 || process.env.BREVO_SMTP_PASS_2 || process.env.EMAIL_PASS_2;
  if (!emailUser || !emailPass) return null;

  const host = process.env.BREVO_HOST_2 || "smtp-relay.brevo.com";
  const port = Number(process.env.BREVO_PORT_2) || 587;
  const secure = port === 465;

  cachedBrevo2 = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: emailUser, pass: emailPass },
    family: 4,
    connectionTimeout: 6000,
    greetingTimeout: 4000,
    socketTimeout: 10000,
  });
  return cachedBrevo2;
}

// ── 3. Gmail Fallback Transporter ─────────────────────────────────────
let cachedGmail = null;

function getGmailTransporter() {
  if (cachedGmail) return cachedGmail;
  const gmailUser =
    process.env.GMAIL_SMTP_USER ||
    process.env.GMAIL_USER ||
    (process.env.EMAIL_SERVICE === "gmail" ? process.env.EMAIL_USER : null);
  const gmailPass =
    process.env.GMAIL_SMTP_PASS ||
    process.env.GMAIL_SMTP_APP_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_PASS ||
    (process.env.EMAIL_SERVICE === "gmail" ? process.env.EMAIL_PASS : null);

  if (!gmailUser || !gmailPass) return null;

  cachedGmail = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
    family: 4,
    connectionTimeout: 6000,
    greetingTimeout: 4000,
    socketTimeout: 10000,
  });
  return cachedGmail;
}

function resetTransporterCache() {
  cachedBrevo1 = null;
  cachedBrevo2 = null;
  cachedGmail = null;
}

async function sendMailWithFailover(mailOptions) {
  resetDailyCountersIfNewDay();

  const brevo1 = getBrevo1Transporter();
  const brevo2 = getBrevo2Transporter();
  const gmail = getGmailTransporter();

  const maxBrevo1Daily = Number(process.env.BREVO_DAILY_LIMIT_1 || process.env.BREVO_DAILY_LIMIT) || 300;
  const maxBrevo2Daily = Number(process.env.BREVO_DAILY_LIMIT_2) || 300;
  const maxGmailDaily = Number(process.env.GMAIL_DAILY_LIMIT) || 500;

  let brevo1Failed = false;
  let brevo1Classification = "UNKNOWN";

  // ── 1. Attempt Brevo #1 Primary First ────────────────────────────────
  const isBrevo1Available =
    brevo1 &&
    !providerState.brevo1.isQuotaExhausted &&
    providerState.brevo1.dailySentCount < maxBrevo1Daily &&
    (!providerState.brevo1.quotaExhaustedUntil || Date.now() > providerState.brevo1.quotaExhaustedUntil);

  if (isBrevo1Available) {
    try {
      const res = await brevo1.sendMail(mailOptions);
      providerState.brevo1.dailySentCount += 1;
      providerState.brevo1.consecutiveFailures = 0;
      return { success: true, provider: "brevo1", messageId: res?.messageId };
    } catch (err) {
      brevo1Failed = true;
      brevo1Classification = classifySmtpError(err);
      providerState.brevo1.consecutiveFailures += 1;
      console.warn(`[Serverless Email] Brevo #1 failed (${brevo1Classification}): ${err.message}`);

      if (brevo1Classification === "QUOTA_EXHAUSTED") {
        providerState.brevo1.isQuotaExhausted = true;
        providerState.brevo1.quotaExhaustedUntil = Date.now() + 3 * 60 * 60 * 1000;
      }
    }
  } else {
    brevo1Failed = true;
    brevo1Classification = brevo1 ? "QUOTA_EXHAUSTED" : "NOT_CONFIGURED";
  }

  // ── 2. Attempt Brevo #2 Secondary ────────────────────────────────────
  let brevo2Failed = false;
  let brevo2Classification = "UNKNOWN";

  if (brevo1Failed) {
    const isBrevo2Available =
      brevo2 &&
      !providerState.brevo2.isQuotaExhausted &&
      providerState.brevo2.dailySentCount < maxBrevo2Daily &&
      (!providerState.brevo2.quotaExhaustedUntil || Date.now() > providerState.brevo2.quotaExhaustedUntil);

    if (isBrevo2Available) {
      try {
        const res = await brevo2.sendMail(mailOptions);
        providerState.brevo2.dailySentCount += 1;
        providerState.brevo2.consecutiveFailures = 0;
        return {
          success: true,
          provider: "brevo2",
          messageId: res?.messageId,
          primaryFailureReason: brevo1Classification,
        };
      } catch (err) {
        brevo2Failed = true;
        brevo2Classification = classifySmtpError(err);
        providerState.brevo2.consecutiveFailures += 1;
        console.warn(`[Serverless Email] Brevo #2 failed (${brevo2Classification}): ${err.message}`);

        if (brevo2Classification === "QUOTA_EXHAUSTED") {
          providerState.brevo2.isQuotaExhausted = true;
          providerState.brevo2.quotaExhaustedUntil = Date.now() + 3 * 60 * 60 * 1000;
        }
      }
    } else {
      brevo2Failed = true;
      brevo2Classification = brevo2 ? "QUOTA_EXHAUSTED" : "NOT_CONFIGURED";
    }
  }

  // ── 3. Attempt Google SMTP Fallback ──────────────────────────────────
  if (brevo1Failed && brevo2Failed) {
    const isGmailAvailable =
      gmail &&
      !providerState.gmail.isQuotaExhausted &&
      providerState.gmail.dailySentCount < maxGmailDaily &&
      (!providerState.gmail.quotaExhaustedUntil || Date.now() > providerState.gmail.quotaExhaustedUntil);

    if (isGmailAvailable) {
      try {
        const fallbackOptions = {
          ...mailOptions,
          from:
            mailOptions.from ||
            `"GradeFlow" <${process.env.GMAIL_SMTP_USER || process.env.GMAIL_USER}>`,
        };
        const res = await gmail.sendMail(fallbackOptions);
        providerState.gmail.dailySentCount += 1;
        providerState.gmail.consecutiveFailures = 0;
        return {
          success: true,
          provider: "gmail_fallback",
          messageId: res?.messageId,
          primaryFailureReason: brevo1Classification,
          secondaryFailureReason: brevo2Classification,
        };
      } catch (err) {
        const gmailClassification = classifySmtpError(err);
        providerState.gmail.consecutiveFailures += 1;
        console.warn(`[Serverless Email] Gmail fallback failed (${gmailClassification}): ${err.message}`);

        if (gmailClassification === "QUOTA_EXHAUSTED") {
          providerState.gmail.isQuotaExhausted = true;
          providerState.gmail.quotaExhaustedUntil = Date.now() + 3 * 60 * 60 * 1000;
        }

        throw new EmailProviderError(
          "Email delivery is temporarily unavailable. Please try again later.",
          "ALL_PROVIDERS_UNAVAILABLE",
          err
        );
      }
    } else {
      throw new EmailProviderError(
        "Email delivery is temporarily unavailable. Please try again later.",
        "ALL_PROVIDERS_UNAVAILABLE"
      );
    }
  }
}

async function sendStudentOtpEmail({ to, studentName, regNo, otp, expiresInMinutes = 3 }) {
  const recipientEmail = String(to || "").trim().toLowerCase();
  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    throw new EmailProviderError("Invalid recipient email address", "RECIPIENT_ERROR");
  }

  const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";
  const subject = `Your GradeFlow Verification Code: ${otp}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Verification Code</title></head>
    <body style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202124;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; text-align: left;">
        <tr>
          <td style="padding-bottom: 24px;">
            <div style="font-size: 20px; font-weight: 700; color: #1a73e8;">GradeFlow</div>
            <div style="font-size: 12px; color: #5f6368; margin-top: 4px;">Centurion University of Technology and Management</div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 28px;">
            <div style="font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 16px;">Sign-in verification code</div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 12px;">Hi ${studentName || "Student"},</div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 28px;">
              Please use the verification code below to sign in to your GradeFlow account for registration number <strong>${regNo}</strong>:
            </div>
            <div style="font-size: 38px; font-weight: 700; letter-spacing: 8px; color: #1a73e8; font-family: monospace; margin-bottom: 28px;">
              ${otp}
            </div>
            <div style="font-size: 13px; color: #5f6368; line-height: 1.6; margin-bottom: 14px;">
              This code will expire in ${expiresInMinutes} minutes. For security reasons, do not share this code with anyone.
            </div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 20px; font-size: 12px; color: #70757a;">
            <div>GradeFlow Academic Intelligence &bull; Centurion University</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `Hi ${studentName || "Student"},\n\nYour GradeFlow verification code for registration number ${regNo} is:\n\n${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\n\nGradeFlow Academic Portal`;

  const mailOptions = {
    from: `"GradeFlow" <${senderEmail}>`,
    replyTo: senderEmail,
    to: recipientEmail,
    subject,
    text,
    html,
  };

  return sendMailWithFailover(mailOptions);
}

async function sendAdminOtpEmail({ to, otp, expiresInMinutes = 5 }) {
  const recipientEmail = String(to || "").trim().toLowerCase();
  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    throw new EmailProviderError("Invalid recipient email address", "RECIPIENT_ERROR");
  }

  const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";
  const subject = `Your GradeFlow Admin Verification Code: ${otp}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Admin Verification Code</title></head>
    <body style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202124;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; text-align: left;">
        <tr>
          <td style="padding-bottom: 24px;">
            <div style="font-size: 20px; font-weight: 700; color: #1a73e8;">GradeFlow</div>
            <div style="font-size: 12px; color: #5f6368; margin-top: 4px;">Centurion University of Technology and Management</div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 28px;">
            <div style="font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 16px;">Admin verification code</div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 12px;">Hi Administrator,</div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 28px;">
              Please use the verification code below to sign in to your GradeFlow Master Admin account:
            </div>
            <div style="font-size: 38px; font-weight: 700; letter-spacing: 8px; color: #1a73e8; font-family: monospace; margin-bottom: 28px;">
              ${otp}
            </div>
            <div style="font-size: 13px; color: #5f6368; line-height: 1.6; margin-bottom: 14px;">
              This code will expire in ${expiresInMinutes} minutes. For security reasons, do not share this code with anyone.
            </div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 20px; font-size: 12px; color: #70757a;">
            <div>GradeFlow Enterprise Security &bull; Centurion University</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `Hi Administrator,\n\nYour GradeFlow Admin verification code is:\n\n${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\n\nGradeFlow Enterprise Security`;

  const mailOptions = {
    from: `"GradeFlow Admin Security" <${senderEmail}>`,
    replyTo: senderEmail,
    to: recipientEmail,
    subject,
    text,
    html,
  };

  return sendMailWithFailover(mailOptions);
}

async function sendSubAdminOtpEmail({ to, name = "Administrator", otp, expiresInMinutes = 5 }) {
  const recipientEmail = String(to || "").trim().toLowerCase();
  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    throw new EmailProviderError("Invalid recipient email address", "RECIPIENT_ERROR");
  }

  const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";
  const subject = `Your GradeFlow Sub-Admin Verification Code: ${otp}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Sub-Admin Verification Code</title></head>
    <body style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202124;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; text-align: left;">
        <tr>
          <td style="padding-bottom: 24px;">
            <div style="font-size: 20px; font-weight: 700; color: #1a73e8;">GradeFlow</div>
            <div style="font-size: 12px; color: #5f6368; margin-top: 4px;">Centurion University of Technology and Management</div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 28px;">
            <div style="font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 16px;">Sub-Admin verification code</div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 12px;">Hi ${name || "Administrator"},</div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 28px;">
              Please use the verification code below to sign in to your GradeFlow Sub-Admin portal:
            </div>
            <div style="font-size: 38px; font-weight: 700; letter-spacing: 8px; color: #1a73e8; font-family: monospace; margin-bottom: 28px;">
              ${otp}
            </div>
            <div style="font-size: 13px; color: #5f6368; line-height: 1.6; margin-bottom: 14px;">
              This code will expire in ${expiresInMinutes} minutes. For security reasons, do not share this code with anyone.
            </div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 20px; font-size: 12px; color: #70757a;">
            <div>GradeFlow Enterprise Security &bull; Centurion University</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `Hi ${name || "Administrator"},\n\nYour GradeFlow Sub-Admin verification code is:\n\n${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\n\nGradeFlow Enterprise Security`;

  const mailOptions = {
    from: `"GradeFlow" <${senderEmail}>`,
    replyTo: senderEmail,
    to: recipientEmail,
    subject,
    text,
    html,
  };

  return sendMailWithFailover(mailOptions);
}

async function sendSubAdminWelcomeEmail({
  to,
  name = "Administrator",
  email,
  password,
  assignedModules = [],
  loginUrl = "https://grade-flow-six.vercel.app/admin",
}) {
  const recipientEmail = String(to || "").trim().toLowerCase();
  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    throw new EmailProviderError("Invalid recipient email address", "RECIPIENT_ERROR");
  }

  const subject = `Your GradeFlow Sub-Admin Account Details`;
  const senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com";
  const modulesList = assignedModules.length > 0 ? assignedModules.join(", ") : "Default Deny (0 Modules Assigned)";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your GradeFlow Sub-Admin Account</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202124; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; text-align: left;">
        <tr>
          <td style="padding-bottom: 24px;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: middle;">
                  <div style="font-size: 20px; font-weight: 700; color: #1a73e8; letter-spacing: -0.5px;">GradeFlow</div>
                </td>
              </tr>
            </table>
            <div style="font-size: 12px; color: #5f6368; margin-top: 4px;">
              Centurion University of Technology and Management
            </div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 28px;">
            <div style="font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 16px;">
              Sub-Admin account access
            </div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 12px;">
              Hi ${name},
            </div>
            <div style="font-size: 14px; color: #3c4043; line-height: 1.6; margin-bottom: 24px;">
              A delegated Sub-Admin account has been created for you on the GradeFlow Institutional Portal. Please use the credentials below to sign in:
            </div>
            <div style="background-color: #f8f9fa; border: 1px solid #dadce0; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
              <div style="font-size: 13px; color: #5f6368; margin-bottom: 8px;">
                Email: <strong style="color: #202124; font-size: 14px;">${email}</strong>
              </div>
              <div style="font-size: 13px; color: #5f6368; margin-bottom: 8px;">
                Password: <strong style="color: #1a73e8; font-size: 14px; font-family: monospace;">${password}</strong>
              </div>
              <div style="font-size: 13px; color: #5f6368;">
                Assigned Modules: <strong style="color: #202124; font-size: 13px;">${modulesList}</strong>
              </div>
            </div>
            <div style="margin-bottom: 28px;">
              <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                Sign In to Sub-Admin Portal
              </a>
            </div>
            <div style="font-size: 13px; color: #5f6368; line-height: 1.6; margin-bottom: 14px;">
              For security reasons, do not share these credentials with anyone. Your access is strictly scoped according to institutional policies.
            </div>
            <div style="font-size: 13px; color: #5f6368; line-height: 1.6; margin-bottom: 32px;">
              If you have any questions regarding your assigned capabilities, please contact the Institutional Main Administrator.
            </div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #dadce0; padding-top: 20px; font-size: 12px; color: #70757a; line-height: 1.5;">
            <div>GradeFlow Academic Intelligence &bull; Centurion University</div>
            <div style="margin-top: 4px; color: #80868b; font-size: 11px;">
              This is an automated administrative notification. Please do not reply directly to this email.
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `Hi ${name},\n\nYour GradeFlow Sub-Admin account credentials:\n\nEmail: ${email}\nPassword: ${password}\nAssigned Modules: ${modulesList}\n\nSign in at: ${loginUrl}\n\nGradeFlow Academic Intelligence\nCenturion University of Technology and Management`;

  const mailOptions = {
    from: `"GradeFlow" <${senderEmail}>`,
    replyTo: senderEmail,
    to: recipientEmail,
    subject,
    text,
    html,
  };

  return sendMailWithFailover(mailOptions);
}

module.exports = {
  EmailProviderError,
  sendMailWithFailover,
  sendStudentOtpEmail,
  sendAdminOtpEmail,
  sendSubAdminOtpEmail,
  sendSubAdminWelcomeEmail,
  providerState,
  resetTransporterCache,
};
