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
  frontendUrl = "https://grade-flow-navy.vercel.app/"
}) {
  const cleanRegNo = String(regNo || "").trim();
  const cleanName = String(studentName || "Student").trim();
  const formattedCgpa = typeof cgpa === "number" ? cgpa.toFixed(2) : cgpa || "0.00";
  const formattedSgpa = typeof sgpa === "number" ? sgpa.toFixed(2) : sgpa || "0.00";
  const baseUrl = String(frontendUrl || "https://grade-flow-navy.vercel.app/").replace(/\/$/, "");

  const rankDisplay = sectionCgpaRank ? `#${sectionCgpaRank}` : "Top Rank";

  const waRawMessage = `Hello GradeFlow Developer, I am ${cleanName} (${cleanRegNo}). I have a query regarding my academic ranking / grade data on GradeFlow.`;
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waRawMessage)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Academic Excellence Recognition - GradeFlow</title>
</head>
<body style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif; background-color: #ffffff; color: #1e293b; line-height: 1.6; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">

  <div style="max-width: 600px; margin: 0 auto;">
    <!-- Header Branding -->
    <div style="margin-bottom: 24px;">
      <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a;">Grade<span style="color: #2563eb;">Flow</span></h2>
      <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">Academic Progress & Result Management System</p>
    </div>

    <!-- Professional Recognition Header -->
    <div style="margin-bottom: 24px; padding: 18px 20px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; border-radius: 6px;">
      <h1 style="margin: 0 0 8px 0; font-size: 19px; font-weight: 700; color: #0f172a;">Academic Excellence Recognition</h1>
      <div style="font-size: 13.5px; color: #334155; line-height: 1.6;">
        <div><strong>Student:</strong> ${cleanName}</div>
        <div><strong>Section Rank:</strong> <span style="color: #2563eb; font-weight: 700;">${rankDisplay}</span> (Section ${section})</div>
        <div><strong>Semester:</strong> Semester ${semester}</div>
      </div>
    </div>

    <p style="margin-bottom: 16px; font-size: 14px; color: #334155;">Dear ${cleanName},</p>
    
    <p style="margin-bottom: 24px; font-size: 14px; color: #334155;">
      We extend our heartiest congratulations on your academic performance in Semester ${semester}. Your consistency and commitment have earned you a place among the top academic rankers in <strong>Section ${section}</strong>.
    </p>

    <!-- Academic Performance Record -->
    <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 12px; color: #0f172a;">Academic Performance Summary</h3>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin-bottom: 24px; font-size: 13.5px;">
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 600; width: 45%; background-color: #f8fafc; color: #334155;">Student Name:</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; color: #0f172a;">${cleanName}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #334155;">Registration No.:</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; color: #0f172a; font-family: monospace;">${cleanRegNo}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #334155;">Batch & Branch:</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; color: #0f172a;">${batch} • ${branch}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #334155;">Section:</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; color: #0f172a;">Section ${section}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #334155;">Semester ${semester} SGPA:</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; color: #2563eb; font-weight: 700;">${formattedSgpa}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #334155;">Cumulative CGPA:</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; color: #059669; font-weight: 700;">${formattedCgpa}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #334155;">Section CGPA Rank:</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 700; color: #d97706;">#${sectionCgpaRank || 'N/A'}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #334155;">Section SGPA Rank:</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 700; color: #d97706;">#${sectionSgpaRank || 'N/A'}</td>
      </tr>
      ${universityRank ? `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 600; background-color: #f8fafc; color: #334155;">University Rank:</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 700; color: #7c3aed;">#${universityRank}</td>
      </tr>
      ` : ''}
    </table>

    <p style="margin-bottom: 24px; font-size: 13.5px; color: #475569; font-style: italic;">
      "Excellence is an ongoing pursuit. Continue setting high standards for your academic journey."
    </p>

    <!-- Links & Contact -->
    <div style="margin-bottom: 28px;">
      <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 6px 0; color: #0f172a;">Leaderboards & Verification</h4>
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #475569;">
        View full section leaderboards and academic analytics on GradeFlow:<br>
        <a href="${baseUrl}" style="color: #2563eb; font-weight: 600; text-decoration: underline;">${baseUrl}</a>
      </p>
      <div>
        <a href="${waUrl}" style="display: inline-block; padding: 10px 18px; background-color: #25D366; color: #ffffff; font-weight: 600; font-size: 13px; text-decoration: none; border-radius: 6px; white-space: nowrap;">💬 Contact Developer on WhatsApp</a>
      </div>
    </div>

    <!-- Testimonials / Feedback Section -->
    <div style="margin-bottom: 28px; padding: 18px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center;">
      <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 6px 0; color: #0f172a;">Rate Your Experience on GradeFlow</h4>
      <p style="margin: 0 0 14px 0; font-size: 13px; color: #475569;">
        Share your feedback or review about GradeFlow on our official testimonials page.
      </p>
      <a href="${baseUrl}/testimonials" style="display: inline-block; padding: 10px 18px; background-color: #2563eb; color: #ffffff; font-weight: 600; font-size: 13px; text-decoration: none; border-radius: 6px; white-space: nowrap;">⭐ Rate Website on GradeFlow</a>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 12.5px; color: #64748b;">
      <p style="margin: 0 0 4px 0;">Regards,</p>
      <p style="margin: 0 0 12px 0; font-weight: 700; color: #0f172a;">GradeFlow Developer</p>
      <p style="margin: 0 0 4px 0;">Academic Progress & Result Management System</p>
      <p style="margin: 0;">
        This is an official academic performance recognition generated by GradeFlow.<br>
        Please do not reply directly to this email.
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
Batch & Branch     : ${payload.batch} • ${payload.branch}
Section            : Section ${payload.section}
Semester ${payload.semester} SGPA   : ${formattedSgpa}
Overall CGPA       : ${formattedCgpa}
Section CGPA Rank  : #${payload.sectionCgpaRank || "N/A"}
Section SGPA Rank  : #${payload.sectionSgpaRank || "N/A"}
${payload.universityRank ? `University Rank    : #${payload.universityRank}\n` : ""}
View section leaderboards & analytics on GradeFlow:
https://grade-flow-navy.vercel.app/

Contact Developer on WhatsApp: https://wa.me/${payload.developerWhatsapp || "919124540575"}

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
