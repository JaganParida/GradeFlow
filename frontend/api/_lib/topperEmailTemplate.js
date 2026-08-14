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
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-spacing: 0;
    }
    img {
      border: 0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding: 24px 12px;
    }
    .main-card {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
    }
    .content-container {
      padding: 28px 24px;
    }
    .gf-btn-wa {
      display: inline-block;
      width: 100%;
      max-width: 420px;
      padding: 13px 20px;
      background-color: #25D366;
      color: #ffffff !important;
      font-size: 14px;
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      border-radius: 8px;
      box-sizing: border-box;
      line-height: 1.4;
    }
    .gf-btn-rate {
      display: inline-block;
      width: 100%;
      max-width: 360px;
      padding: 12px 20px;
      background-color: #2563eb;
      color: #ffffff !important;
      font-size: 13.5px;
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      border-radius: 8px;
      box-sizing: border-box;
      line-height: 1.4;
    }
    @media only screen and (max-width: 480px) {
      .content-container {
        padding: 20px 16px !important;
      }
      .gf-table td {
        padding: 8px 10px !important;
        font-size: 12.5px !important;
      }
      .gf-btn-wa, .gf-btn-rate {
        max-width: 100% !important;
        font-size: 13px !important;
        padding: 12px 14px !important;
      }
      .header-title {
        font-size: 18px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">

  <center class="wrapper" style="width: 100%; background-color: #f8fafc; padding: 24px 12px; box-sizing: border-box;">
    <div class="main-card" style="background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04); text-align: left;">
      
      <!-- Top Brand Header Bar -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 22px 24px; border-bottom: 3px solid #2563eb;">
        <table style="width: 100%;">
          <tr>
            <td>
              <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Grade<span style="color: #60a5fa;">Flow</span>
              </h2>
              <p style="margin: 3px 0 0 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                Academic Intelligence & Performance Analytics
              </p>
            </td>
            <td style="text-align: right;">
              <span style="display: inline-block; background-color: rgba(37, 99, 235, 0.25); border: 1px solid rgba(96, 165, 250, 0.4); color: #93c5fd; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px;">
                Official Recognition
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div class="content-container" style="padding: 28px 24px;">
        
        <!-- Recognition Highlight Banner -->
        <div style="margin-bottom: 22px; padding: 18px 20px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; border-radius: 10px;">
          <h1 class="header-title" style="margin: 0 0 6px 0; font-size: 19px; font-weight: 800; color: #1e3a8a;">
            🏆 Academic Excellence Recognition
          </h1>
          <div style="font-size: 13.5px; color: #334155; line-height: 1.6;">
            <div>Honoring: <strong style="color: #0f172a;">${cleanName}</strong></div>
            <div>Standing: <strong style="color: #2563eb;">${rankDisplay}</strong> in <strong style="color: #0f172a;">Section ${section}</strong></div>
            <div>Term: <strong>Semester ${semester}</strong> (${batch} • ${branch})</div>
          </div>
        </div>

        <p style="margin: 0 0 14px 0; font-size: 14.5px; color: #334155;">
          Dear <strong>${cleanName}</strong>,
        </p>
        
        <p style="margin: 0 0 22px 0; font-size: 14px; color: #475569; line-height: 1.6;">
          Congratulations on achieving exceptional results in <strong>Semester ${semester}</strong>! Your consistent dedication, discipline, and academic diligence have placed you among the top rankers in <strong>Section ${section}</strong>.
        </p>

        <!-- Academic Performance Table -->
        <h3 style="font-size: 14.5px; font-weight: 700; margin: 0 0 10px 0; color: #0f172a;">
          📊 Performance Summary Record
        </h3>
        <table class="gf-table" style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; margin-bottom: 22px; font-size: 13.5px; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; font-weight: 600; width: 44%; background-color: #f8fafc; color: #475569;">Student Name:</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; color: #0f172a; font-weight: 700;">${cleanName}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #475569;">Registration No.:</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; color: #0f172a; font-family: monospace; font-weight: 600;">${cleanRegNo}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #475569;">Branch & Batch:</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; color: #0f172a;">${branch} • ${batch}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #475569;">Section:</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; color: #0f172a; font-weight: 600;">Section ${section}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #475569;">Semester ${semester} SGPA:</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; color: #2563eb; font-weight: 800; font-size: 14px;">${formattedSgpa}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #475569;">Cumulative CGPA:</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; color: #059669; font-weight: 800; font-size: 14px;">${formattedCgpa}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #475569;">Section CGPA Rank:</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; font-weight: 800; color: #d97706;">🥇 Rank #${sectionCgpaRank || 'N/A'}</td>
          </tr>
          ${sectionSgpaRank ? `
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #475569;">Section SGPA Rank:</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; font-weight: 700; color: #d97706;">🏆 Rank #${sectionSgpaRank}</td>
          </tr>
          ` : ''}
          ${universityRank ? `
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #475569;">University Rank:</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px; font-weight: 700; color: #7c3aed;">⭐ Rank #${universityRank}</td>
          </tr>
          ` : ''}
        </table>

        <!-- Leaderboards & Verification Box -->
        <div style="margin-bottom: 22px; padding: 14px 18px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
          <p style="margin: 0; font-size: 13px; color: #166534; line-height: 1.5;">
            <strong>🌐 View Full Leaderboards & Department Rankings:</strong><br>
            Explore real-time batch standings, section analytics, and percentile ranks on GradeFlow:<br>
            <a href="${baseUrl}/leaderboard" style="color: #15803d; font-weight: 700; text-decoration: underline; display: inline-block; margin-top: 4px; word-break: break-all;">
              ${baseUrl}/leaderboard
            </a>
          </p>
        </div>

        <!-- IMPORTANT SUPPORT & DATA ASSISTANCE SECTION -->
        <div style="margin-bottom: 24px; padding: 16px 18px; background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
          <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 800; color: #92400e;">
            📌 Important: Data Verification & Technical Support
          </h4>
          <p style="margin: 0 0 8px 0; font-size: 12.5px; color: #78350f; line-height: 1.55;">
            GradeFlow computes performance metrics and section standings directly from published institutional result datasets.
          </p>
          <ul style="margin: 0 0 10px 0; padding-left: 18px; font-size: 12.5px; color: #78350f; line-height: 1.55;">
            <li style="margin-bottom: 4px;">
              <strong>Grade or Calculation Discrepancy:</strong> If you observe any discrepancy in your subject marks, SGPA, CGPA, or section ranking compared to your official university grade sheet.
            </li>
            <li style="margin-bottom: 4px;">
              <strong>Technical Issue / Bug Reporting:</strong> If you face any problem, loading error, or unexpected behavior on the website.
            </li>
            <li>
              <strong>Feedback & Queries:</strong> If you have recommendations or feature requests to make GradeFlow even better.
            </li>
          </ul>
          <p style="margin: 0; font-size: 12.5px; color: #92400e; font-weight: 600;">
            Feel free to reach out directly for immediate support and record verification:
          </p>
        </div>

        <!-- FLUID RESPONSIVE WHATSAPP BUTTON -->
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${waUrl}" class="gf-btn-wa" style="display: inline-block; width: 100%; max-width: 420px; padding: 13px 20px; background-color: #25D366; color: #ffffff !important; font-size: 14px; font-weight: 700; text-align: center; text-decoration: none; border-radius: 8px; box-sizing: border-box; line-height: 1.4; box-shadow: 0 3px 8px rgba(37, 211, 102, 0.25);">
            💬 Connect with Developer on WhatsApp
          </a>
        </div>

        <!-- Testimonials / Experience Rating Section -->
        <div style="margin-bottom: 24px; padding: 18px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;">
          <h4 style="font-size: 14px; font-weight: 800; margin: 0 0 6px 0; color: #0f172a;">
            ⭐ Rate Your Experience on GradeFlow
          </h4>
          <p style="margin: 0 0 14px 0; font-size: 12.5px; color: #64748b; line-height: 1.5;">
            Your feedback helps us continuously improve the platform. Leave a quick review or rating on our testimonials page.
          </p>
          <a href="${baseUrl}/testimonials" class="gf-btn-rate" style="display: inline-block; width: 100%; max-width: 360px; padding: 12px 20px; background-color: #2563eb; color: #ffffff !important; font-size: 13.5px; font-weight: 700; text-align: center; text-decoration: none; border-radius: 8px; box-sizing: border-box; line-height: 1.4; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);">
            ⭐ Rate Website on GradeFlow
          </a>
        </div>

        <!-- Inspirational Quote -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; margin-bottom: 20px; text-align: center;">
          <p style="margin: 0; font-size: 13.5px; font-style: italic; color: #64748b; line-height: 1.5;">
            "Excellence is not a single act, but a habit. Keep pushing boundaries and inspiring your peers!"
          </p>
        </div>

        <!-- Formal Footer -->
        <div style="font-size: 12px; color: #64748b; line-height: 1.5;">
          <p style="margin: 0 0 3px 0;">Warm Regards,</p>
          <p style="margin: 0 0 8px 0; font-weight: 800; color: #0f172a; font-size: 13px;">GradeFlow Developer</p>
          <p style="margin: 0 0 4px 0;">Academic Progress & Result Management System</p>
          <p style="margin: 0; color: #94a3b8; font-size: 11.5px;">
            This is an official academic achievement recognition generated by GradeFlow.<br>
            Please do not reply directly to this automated email.
          </p>
        </div>

      </div>
    </div>
  </center>

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
Batch & Branch     : ${payload.batch} • ${payload.branch}
Section            : Section ${payload.section}
Semester ${payload.semester} SGPA   : ${formattedSgpa}
Overall CGPA       : ${formattedCgpa}
Section CGPA Rank  : #${payload.sectionCgpaRank || "N/A"}
Section SGPA Rank  : #${payload.sectionSgpaRank || "N/A"}
${payload.universityRank ? `University Rank    : #${payload.universityRank}\n` : ""}
View section leaderboards & analytics on GradeFlow:
https://grade-flow-navy.vercel.app/leaderboard

Important: Data Verification & Technical Support
------------------------------------------------
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
