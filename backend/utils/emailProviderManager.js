const nodemailer = require("nodemailer");

/**
 * GradeFlow Production Email Provider Abstraction
 * - Primary: Brevo SMTP (smtp-relay.brevo.com:587)
 * - Fallback: Gmail SMTP (smtp.gmail.com:465 / 587)
 * - Error classification and seamless single-OTP failover
 */

class EmailProviderError extends Error {
  constructor(message, classification, originalError = null) {
    super(message);
    this.name = "EmailProviderError";
    this.classification = classification; // "QUOTA_EXHAUSTED" | "RATE_LIMITED" | "TEMPORARY_FAILURE" | "CONFIG_ERROR" | "RECIPIENT_ERROR" | "UNKNOWN"
    this.originalError = originalError;
  }
}

// In-memory provider circuit-breaker tracking
const providerState = {
  brevo: {
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

function resetDailyCountersIfNewDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (providerState.brevo.lastSentDate !== today) {
    providerState.brevo.dailySentCount = 0;
    providerState.brevo.isQuotaExhausted = false;
    providerState.brevo.quotaExhaustedUntil = null;
    providerState.brevo.lastSentDate = today;
  }
  if (providerState.gmail.lastSentDate !== today) {
    providerState.gmail.dailySentCount = 0;
    providerState.gmail.isQuotaExhausted = false;
    providerState.gmail.quotaExhaustedUntil = null;
    providerState.gmail.lastSentDate = today;
  }
}

function classifySmtpError(err) {
  const msg = String(err?.message || "").toLowerCase();
  const code = String(err?.code || "").toUpperCase();
  const responseCode = Number(err?.responseCode) || 0;

  // Quota Exceeded Signals
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

  // Rate Limiting Signals
  if (responseCode === 429 || msg.includes("too many requests") || msg.includes("rate limit")) {
    return "RATE_LIMITED";
  }

  // Configuration or Authentication Errors
  if (
    responseCode === 535 ||
    code === "EAUTH" ||
    msg.includes("invalid login") ||
    msg.includes("authentication failed") ||
    msg.includes("bad credentials")
  ) {
    return "CONFIG_ERROR";
  }

  // Recipient / Address Syntax Errors
  if (
    responseCode === 553 ||
    responseCode === 501 ||
    msg.includes("invalid recipient") ||
    msg.includes("recipient address rejected")
  ) {
    return "RECIPIENT_ERROR";
  }

  // Network / Socket / Timeout Errors (Temporary)
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

// ── 1. Brevo Primary Transporter ──────────────────────────────────────
let cachedBrevoTransporter = null;

function getBrevoTransporter() {
  if (cachedBrevoTransporter) return cachedBrevoTransporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return null; // Not configured
  }

  const host = process.env.EMAIL_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.EMAIL_PORT) || 587;
  const secure = port === 465;

  cachedBrevoTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: emailUser, pass: emailPass },
    family: 4, // Force IPv4 to avoid cloud container IPv6 socket hangs
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 6000,
    greetingTimeout: 4000,
    socketTimeout: 10000,
  });

  return cachedBrevoTransporter;
}

// ── 2. Gmail Fallback Transporter ─────────────────────────────────────
let cachedGmailTransporter = null;

function getGmailTransporter() {
  if (cachedGmailTransporter) return cachedGmailTransporter;

  // Use dedicated Gmail credentials if set, otherwise fallback to EMAIL_USER/EMAIL_PASS if service is gmail
  const gmailUser = process.env.GMAIL_SMTP_USER || process.env.GMAIL_USER || (process.env.EMAIL_SERVICE === "gmail" ? process.env.EMAIL_USER : null);
  const gmailPass =
    process.env.GMAIL_SMTP_PASS ||
    process.env.GMAIL_SMTP_APP_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_PASS ||
    (process.env.EMAIL_SERVICE === "gmail" ? process.env.EMAIL_PASS : null);

  if (!gmailUser || !gmailPass) {
    return null; // Gmail fallback not configured
  }

  cachedGmailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
    family: 4,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    connectionTimeout: 6000,
    greetingTimeout: 4000,
    socketTimeout: 10000,
  });

  return cachedGmailTransporter;
}

/**
 * Dispatches an email with automatic Brevo -> Gmail fallback.
 * Uses the exact same mail payload without regenerating OTPs.
 */
async function sendMailWithFailover(mailOptions) {
  resetDailyCountersIfNewDay();

  const brevoTransporter = getBrevoTransporter();
  const gmailTransporter = getGmailTransporter();

  const maxBrevoDaily = Number(process.env.BREVO_DAILY_LIMIT) || 300;
  const maxGmailDaily = Number(process.env.GMAIL_DAILY_LIMIT) || 500;

  const primaryChoice = (process.env.PRIMARY_EMAIL_PROVIDER || process.env.EMAIL_PROVIDER || "").toLowerCase();
  const preferGmail = primaryChoice === "gmail" || process.env.EMAIL_SERVICE === "gmail" || process.env.GMAIL_PRIMARY === "true";

  if (preferGmail && gmailTransporter) {
    const isGmailAvailable =
      !providerState.gmail.isQuotaExhausted &&
      providerState.gmail.dailySentCount < maxGmailDaily &&
      (!providerState.gmail.quotaExhaustedUntil || Date.now() > providerState.gmail.quotaExhaustedUntil);

    if (isGmailAvailable) {
      try {
        const gmailSender = process.env.GMAIL_SMTP_USER || process.env.GMAIL_USER || mailOptions.from;
        const gmailOptions = {
          ...mailOptions,
          from: mailOptions.from || `"GradeFlow" <${gmailSender}>`,
        };
        const result = await gmailTransporter.sendMail(gmailOptions);
        providerState.gmail.dailySentCount += 1;
        providerState.gmail.consecutiveFailures = 0;
        return { success: true, provider: "gmail", messageId: result?.messageId };
      } catch (gmailErr) {
        const gmailClass = classifySmtpError(gmailErr);
        console.warn(`[EmailService] Gmail primary delivery failed (${gmailClass}): ${gmailErr.message}`);
        if (brevoTransporter) {
          try {
            const result = await brevoTransporter.sendMail(mailOptions);
            providerState.brevo.dailySentCount += 1;
            providerState.brevo.consecutiveFailures = 0;
            return { success: true, provider: "brevo_fallback", messageId: result?.messageId, primaryFailureReason: gmailClass };
          } catch (brevoErr) {
            throw new EmailProviderError("OTP delivery is temporarily unavailable. Please try again later.", "ALL_PROVIDERS_UNAVAILABLE", brevoErr);
          }
        } else {
          throw new EmailProviderError("OTP delivery is temporarily unavailable. Please try again later.", "ALL_PROVIDERS_UNAVAILABLE", gmailErr);
        }
      }
    }
  }

  let brevoFailed = false;
  let brevoClassification = "UNKNOWN";

  // Check if Brevo is currently exhausted or tripped
  const isBrevoAvailable =
    brevoTransporter &&
    !providerState.brevo.isQuotaExhausted &&
    providerState.brevo.dailySentCount < maxBrevoDaily &&
    (!providerState.brevo.quotaExhaustedUntil || Date.now() > providerState.brevo.quotaExhaustedUntil);

  if (isBrevoAvailable) {
    try {
      const result = await brevoTransporter.sendMail(mailOptions);
      providerState.brevo.dailySentCount += 1;
      providerState.brevo.consecutiveFailures = 0;
      return { success: true, provider: "brevo", messageId: result?.messageId };
    } catch (err) {
      brevoFailed = true;
      brevoClassification = classifySmtpError(err);
      providerState.brevo.consecutiveFailures += 1;

      console.warn(
        `[EmailService] Brevo delivery failed (${brevoClassification}): ${err.message}`
      );

      if (brevoClassification === "QUOTA_EXHAUSTED") {
        providerState.brevo.isQuotaExhausted = true;
        // Trip circuit breaker for 3 hours or until IST midnight
        providerState.brevo.quotaExhaustedUntil = Date.now() + 3 * 60 * 60 * 1000;
      }
    }
  } else {
    brevoFailed = true;
    brevoClassification = "QUOTA_EXHAUSTED";
  }

  // ── Fallback to Gmail SMTP if Brevo failed / exhausted ────────────────
  if (brevoFailed) {
    const isGmailAvailable =
      gmailTransporter &&
      !providerState.gmail.isQuotaExhausted &&
      providerState.gmail.dailySentCount < maxGmailDaily &&
      (!providerState.gmail.quotaExhaustedUntil || Date.now() > providerState.gmail.quotaExhaustedUntil);

    if (isGmailAvailable) {
      try {
        const gmailSender =
          process.env.GMAIL_SMTP_USER || process.env.GMAIL_USER || mailOptions.from;
        const fallbackOptions = {
          ...mailOptions,
          from: mailOptions.from || `"GradeFlow" <${gmailSender}>`,
        };

        const result = await gmailTransporter.sendMail(fallbackOptions);
        providerState.gmail.dailySentCount += 1;
        providerState.gmail.consecutiveFailures = 0;

        return {
          success: true,
          provider: "gmail_fallback",
          messageId: result?.messageId,
          primaryFailureReason: brevoClassification,
        };
      } catch (err) {
        const gmailClassification = classifySmtpError(err);
        providerState.gmail.consecutiveFailures += 1;

        console.warn(
          `[EmailService] Gmail fallback delivery failed (${gmailClassification}): ${err.message}`
        );

        if (gmailClassification === "QUOTA_EXHAUSTED") {
          providerState.gmail.isQuotaExhausted = true;
          providerState.gmail.quotaExhaustedUntil = Date.now() + 3 * 60 * 60 * 1000;
        }

        throw new EmailProviderError(
          "OTP delivery is temporarily unavailable. Please try again later.",
          "ALL_PROVIDERS_UNAVAILABLE",
          err
        );
      }
    } else {
      // Neither Brevo nor Gmail available
      throw new EmailProviderError(
        "OTP delivery is temporarily unavailable. Please try again later.",
        "ALL_PROVIDERS_UNAVAILABLE"
      );
    }
  }
}

// ── Exported Service Helpers ──────────────────────────────────────────

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

module.exports = {
  EmailProviderError,
  sendMailWithFailover,
  sendStudentOtpEmail,
  providerState,
};
