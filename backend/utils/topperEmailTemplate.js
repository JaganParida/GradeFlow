function generateTopperEmailHtml({
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
  developerWhatsapp = "919124540575",
  frontendUrl = "https://grade-flow-navy.vercel.app/",
}) {
  const cleanRegNo = String(regNo || "").trim();
  const cleanName = String(studentName || "Student").trim();
  const formattedCgpa = typeof cgpa === "number" ? cgpa.toFixed(2) : cgpa || "0.00";
  const formattedSgpa = typeof sgpa === "number" ? sgpa.toFixed(2) : sgpa || "0.00";
  const baseUrl = String(frontendUrl || "https://grade-flow-navy.vercel.app/").replace(/\/$/, "");

  const rankDisplay = sectionCgpaRank ? `#${sectionCgpaRank}` : "Top Rank";

  const waRawMessage = `Hello GradeFlow Developer, I am ${cleanName} (${cleanRegNo}), Section ${section} Topper. I have a query/feedback regarding my academic records on GradeFlow.`;
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waRawMessage)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Academic Excellence Recognition - GradeFlow</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 580px;
      margin: 0 auto;
      padding: 32px 20px;
    }
    .academic-table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0 22px 0;
      font-size: 13.5px;
    }
    .academic-table th,
    .academic-table td {
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      text-align: left;
    }
    .academic-table td.label {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
      width: 42%;
    }
    .academic-table td.val {
      color: #0f172a;
    }
    .btn-wa {
      display: inline-block;
      width: 100%;
      max-width: 360px;
      padding: 12px 20px;
      background-color: #25D366;
      color: #ffffff !important;
      font-size: 13.5px;
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      border-radius: 6px;
      box-sizing: border-box;
      line-height: 1.4;
    }
    .btn-rate {
      display: inline-block;
      width: 100%;
      max-width: 320px;
      padding: 11px 18px;
      background-color: #2563eb;
      color: #ffffff !important;
      font-size: 13px;
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      border-radius: 6px;
      box-sizing: border-box;
      line-height: 1.4;
    }
    @media only screen and (max-width: 480px) {
      .email-container {
        padding: 20px 14px !important;
      }
      .academic-table th,
      .academic-table td {
        padding: 8px 10px !important;
        font-size: 12.5px !important;
      }
      .btn-wa, .btn-rate {
        max-width: 100% !important;
        font-size: 13px !important;
        padding: 12px 14px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    
    <!-- Clean Header Branding -->
    <div style="margin-bottom: 20px;">
      <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Grade<span style="color: #2563eb;">Flow</span>
      </h2>
      <p style="margin: 2px 0 0 0; font-size: 12.5px; color: #64748b;">
        Academic Progress & Result Management System
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 22px 0;" />

    <!-- Salutation & Congratulations -->
    <p style="margin: 0 0 14px 0; font-size: 15px; color: #0f172a;">
      Dear <strong>${cleanName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 14px; color: #334155; line-height: 1.65;">
      We are pleased to inform you that based on the official academic results, you have secured 
      <strong style="color: #2563eb;">${rankDisplay}</strong> in <strong>Section ${section}</strong> for <strong>Semester ${semester}</strong>. 
      Congratulations on your outstanding performance and dedication to academic excellence.
    </p>

    <!-- Academic Table (Only structured element with borders) -->
    <h3 style="font-size: 14.5px; font-weight: 700; margin: 0 0 8px 0; color: #0f172a;">
      Academic Performance Summary
    </h3>
    <table class="academic-table">
      <tr>
        <td class="label">Student Name:</td>
        <td class="val" style="font-weight: 700;">${cleanName}</td>
      </tr>
      <tr>
        <td class="label">Registration No.:</td>
        <td class="val" style="font-family: monospace; font-weight: 600;">${cleanRegNo}</td>
      </tr>
      <tr>
        <td class="label">Branch & Batch:</td>
        <td class="val">${branch} • ${batch}</td>
      </tr>
      <tr>
        <td class="label">Section:</td>
        <td class="val">Section ${section}</td>
      </tr>
      <tr>
        <td class="label">Semester ${semester} SGPA:</td>
        <td class="val" style="color: #2563eb; font-weight: 800; font-size: 14px;">${formattedSgpa}</td>
      </tr>
      <tr>
        <td class="label">Cumulative CGPA:</td>
        <td class="val" style="color: #059669; font-weight: 800; font-size: 14px;">${formattedCgpa}</td>
      </tr>
      <tr>
        <td class="label">Section CGPA Rank:</td>
        <td class="val" style="font-weight: 800; color: #d97706;">🥇 Rank #${sectionCgpaRank || 'N/A'}</td>
      </tr>
      ${sectionSgpaRank ? `
      <tr>
        <td class="label">Section SGPA Rank:</td>
        <td class="val" style="font-weight: 700; color: #d97706;">🏆 Rank #${sectionSgpaRank}</td>
      </tr>
      ` : ''}
      ${universityRank ? `
      <tr>
        <td class="label">University Rank:</td>
        <td class="val" style="font-weight: 700; color: #7c3aed;">⭐ Rank #${universityRank}</td>
      </tr>
      ` : ''}
    </table>

    <!-- Leaderboards Link -->
    <p style="margin: 0 0 20px 0; font-size: 13.5px; color: #475569; line-height: 1.6;">
      View full department leaderboards and section rankings on GradeFlow:<br>
      <a href="${baseUrl}/leaderboard" style="color: #2563eb; font-weight: 600; text-decoration: underline;">${baseUrl}/leaderboard</a>
    </p>

    <!-- Important Support & Verification Section -->
    <div style="margin: 22px 0 14px 0;">
      <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
        Important: Academic Verification & Technical Support
      </h4>
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569; line-height: 1.6;">
        GradeFlow calculates rankings and metrics directly from published academic datasets. If you notice any discrepancy in your subject marks, SGPA/CGPA, or section standing compared to your official university grade sheet, or if you face any technical problem on the website, please feel free to reach out directly.
      </p>
    </div>

    <!-- Responsive WhatsApp CTA -->
    <div style="margin: 12px 0 26px 0;">
      <a href="${waUrl}" class="btn-wa">
        💬 Connect with Developer on WhatsApp
      </a>
    </div>

    <!-- Rate Website Section -->
    <div style="margin: 22px 0 22px 0;">
      <h4 style="margin: 0 0 6px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">
        Rate Your Experience
      </h4>
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #475569; line-height: 1.5;">
        Your feedback helps us continuously improve GradeFlow. Feel free to leave a review or rating on our testimonials page.
      </p>
      <div>
        <a href="${baseUrl}/testimonials" class="btn-rate">
          ⭐ Rate Website on GradeFlow
        </a>
      </div>
    </div>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 20px 0;" />

    <!-- Inspirational Quote -->
    <p style="margin: 0 0 18px 0; font-size: 13px; font-style: italic; color: #64748b;">
      "Excellence is not a single act, but a habit. Keep pushing boundaries and inspiring your peers!"
    </p>

    <!-- Sign-off Footer -->
    <div style="font-size: 12.5px; color: #64748b; line-height: 1.5;">
      <p style="margin: 0 0 2px 0;">Warm Regards,</p>
      <p style="margin: 0 0 6px 0; font-weight: 700; color: #0f172a; font-size: 13px;">GradeFlow Developer</p>
      <p style="margin: 0 0 4px 0;">Academic Progress & Result Management System</p>
      <p style="margin: 0; color: #94a3b8; font-size: 11.5px;">
        This is an official academic performance notification generated by GradeFlow.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

function generateTopperEmailText(payload) {
  const cleanRegNo = String(payload.regNo || "").trim();
  const cleanName = String(payload.studentName || "Student").trim();
  const formattedCgpa = typeof payload.cgpa === "number" ? payload.cgpa.toFixed(2) : payload.cgpa || "0.00";
  const formattedSgpa = typeof payload.sgpa === "number" ? payload.sgpa.toFixed(2) : payload.sgpa || "0.00";

  return `GradeFlow - Academic Excellence Recognition

Dear ${cleanName},

Congratulations on your academic performance in Semester ${payload.semester}!

You are ranked #${payload.sectionCgpaRank || 1} in Section ${payload.section} for Semester ${payload.semester}.

Academic Summary:
----------------
Student Name       : ${cleanName}
Registration No.   : ${cleanRegNo}
Branch & Batch     : ${payload.batch} • ${payload.branch}
Section            : Section ${payload.section}
Semester ${payload.semester} SGPA   : ${formattedSgpa}
Overall CGPA       : ${formattedCgpa}
Section CGPA Rank  : #${payload.sectionCgpaRank || "N/A"}
Section SGPA Rank  : #${payload.sectionSgpaRank || "N/A"}
${payload.universityRank ? `University Rank    : #${payload.universityRank}\n` : ""}
View section leaderboards & analytics on GradeFlow:
https://grade-flow-navy.vercel.app/leaderboard

Important: Academic Verification & Technical Support
---------------------------------------------------
If you notice any discrepancy in your grades, SGPA/CGPA calculations, or experience any issue on GradeFlow, feel free to reach out directly:
Connect on WhatsApp: https://wa.me/${payload.developerWhatsapp || "919124540575"}

Rate Your Experience on GradeFlow:
https://grade-flow-navy.vercel.app/testimonials

Regards,
GradeFlow Developer
Academic Progress & Result Management System
`;
}

module.exports = {
  generateTopperEmailHtml,
  generateTopperEmailText,
};
