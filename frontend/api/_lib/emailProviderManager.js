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
    msg.includes("maximum credits")
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
    msg.includes("authentication failed")
  ) {
    return "CONFIG_ERROR";
  }

  if (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ESOCKET" ||
    msg.includes("timeout")
  ) {
    return "TEMPORARY_FAILURE";
  }

  return "UNKNOWN";
}

let cachedBrevo = null;
function getBrevoTransporter() {
  if (cachedBrevo) return cachedBrevo;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) return null;

  const host = process.env.EMAIL_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.EMAIL_PORT) || 587;
  const secure = port === 465;

  cachedBrevo = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: emailUser, pass: emailPass },
    family: 4,
    connectionTimeout: 6000,
    greetingTimeout: 4000,
    socketTimeout: 10000,
  });
  return cachedBrevo;
}

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

async function sendMailWithFailover(mailOptions) {
  const brevo = getBrevoTransporter();
  const gmail = getGmailTransporter();

  const primaryChoice = (process.env.PRIMARY_EMAIL_PROVIDER || process.env.EMAIL_PROVIDER || "").toLowerCase();
  const preferGmail = primaryChoice === "gmail" || process.env.EMAIL_SERVICE === "gmail" || process.env.GMAIL_PRIMARY === "true";

  if (preferGmail && gmail) {
    // ── Attempt Gmail Primary ──
    try {
      const gmailSender = process.env.GMAIL_SMTP_USER || process.env.GMAIL_USER || mailOptions.from;
      const gmailOptions = {
        ...mailOptions,
        from: mailOptions.from || `"GradeFlow" <${gmailSender}>`,
      };
      const res = await gmail.sendMail(gmailOptions);
      return { success: true, provider: "gmail", messageId: res?.messageId };
    } catch (gmailErr) {
      const gmailClass = classifySmtpError(gmailErr);
      console.warn(`[Serverless Email] Gmail primary failed (${gmailClass}): ${gmailErr.message}`);
      if (brevo) {
        try {
          const res = await brevo.sendMail(mailOptions);
          return { success: true, provider: "brevo_fallback", messageId: res?.messageId, primaryFailureReason: gmailClass };
        } catch (brevoErr) {
          throw new EmailProviderError("OTP delivery is temporarily unavailable. Please try again later.", "ALL_PROVIDERS_UNAVAILABLE", brevoErr);
        }
      } else {
        throw new EmailProviderError("OTP delivery is temporarily unavailable. Please try again later.", "ALL_PROVIDERS_UNAVAILABLE", gmailErr);
      }
    }
  }

  // ── Attempt Brevo Primary ──
  let brevoFailed = false;
  let brevoClassification = "UNKNOWN";

  if (brevo) {
    try {
      const res = await brevo.sendMail(mailOptions);
      return { success: true, provider: "brevo", messageId: res?.messageId };
    } catch (err) {
      brevoFailed = true;
      brevoClassification = classifySmtpError(err);
      console.warn(`[Serverless Email] Brevo failed (${brevoClassification}): ${err.message}`);
    }
  } else {
    brevoFailed = true;
    brevoClassification = "NOT_CONFIGURED";
  }

  if (brevoFailed) {
    if (gmail) {
      try {
        const fallbackOptions = {
          ...mailOptions,
          from:
            mailOptions.from ||
            `"GradeFlow" <${process.env.GMAIL_SMTP_USER || process.env.GMAIL_USER}>`,
        };
        const res = await gmail.sendMail(fallbackOptions);
        return {
          success: true,
          provider: "gmail_fallback",
          messageId: res?.messageId,
          primaryFailureReason: brevoClassification,
        };
      } catch (err) {
        const gmailClassification = classifySmtpError(err);
        console.warn(`[Serverless Email] Gmail fallback failed (${gmailClassification}): ${err.message}`);
        throw new EmailProviderError(
          "OTP delivery is temporarily unavailable. Please try again later.",
          "ALL_PROVIDERS_UNAVAILABLE",
          err
        );
      }
    } else {
      throw new EmailProviderError(
        "OTP delivery is temporarily unavailable. Please try again later.",
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

module.exports = {
  EmailProviderError,
  sendMailWithFailover,
  sendStudentOtpEmail,
};
