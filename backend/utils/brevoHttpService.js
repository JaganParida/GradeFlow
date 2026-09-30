/**
 * Brevo HTTP API Mailer for GradeFlow
 * Direct REST API integration via https://api.brevo.com/v3/smtp/email
 */

async function sendEmailViaBrevoApi({
  to,
  toName = "Student",
  subject,
  htmlContent,
  textContent,
  senderName = "GradeFlow - Attendance Assistant",
  senderEmail = process.env.EMAIL_FROM || "jaganparida9154@gmail.com",
}) {
  const apiKey =
    process.env.BREVO_API_KEY ||
    process.env.BREVO_PASS_1 ||
    process.env.EMAIL_PASS;

  if (!apiKey) {
    throw new Error("Brevo API key is not configured. (Check BREVO_API_KEY or EMAIL_PASS in .env)");
  }

  const endpoint = "https://api.brevo.com/v3/smtp/email";

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: to,
        name: toName,
      },
    ],
    subject: subject,
    htmlContent: htmlContent,
  };

  if (textContent) {
    payload.textContent = textContent;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = responseData?.message || response.statusText || `HTTP ${response.status}`;
    throw new Error(`Brevo API Error (${response.status}): ${errorMsg}`);
  }

  return {
    success: true,
    messageId: responseData.messageId || "brevo-api-ok",
    recipient: to,
  };
}

module.exports = {
  sendEmailViaBrevoApi,
};
