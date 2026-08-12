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

  const waRawMessage = `Hello GradeFlow Developer, I am ${cleanName} (${cleanRegNo}), Section ${section} Topper. Thank you for the academic excellence recognition on GradeFlow!`;
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waRawMessage)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Academic Excellence Recognition</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #ffffff; color: #333333; line-height: 1.6; margin: 0; padding: 20px;">

  <div style="margin-bottom: 24px;">
    <h2 style="margin: 0; font-size: 20px; font-weight: bold;"><span style="color: #333333;">Grade</span><span style="color: #2563eb;">Flow</span></h2>
    <p style="margin: 0; font-size: 14px; color: #666666;">Academic Progress & Result Management System</p>
  </div>

  <p style="margin-bottom: 16px; font-size: 16px;">Dear <strong>${cleanName}</strong>,</p>

  <div style="margin-bottom: 24px; padding: 18px 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
    <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #166534;">🎉 Congratulations on Your Outstanding Academic Achievement!</h3>
    <p style="margin: 0; font-size: 14px; color: #15803d; line-height: 1.5;">
      We are thrilled to inform you that based on the official academic results, you have secured 
      <strong>Top Rank in Section ${section}</strong> for Semester ${semester}!
    </p>
  </div>

  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333333;">Academic Performance Highlights</h3>
  <table style="width: 100%; max-width: 600px; border-collapse: collapse; border: 1px solid #e0e0e0; margin-bottom: 24px; font-size: 14px;">
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; width: 40%; background-color: #f9f9f9;">Student Name:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;"><strong>${cleanName}</strong></td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Registration No.:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${cleanRegNo}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Branch & Batch:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${branch} (${batch})</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Section:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;"><strong>Section ${section}</strong></td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Semester ${semester} SGPA:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px; color: #166534; font-weight: bold;">${formattedSgpa}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Cumulative CGPA:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px; color: #2563eb; font-weight: bold;">${formattedCgpa}</td>
    </tr>
    ${sectionSgpaRank ? `
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Section SGPA Rank:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; color: #d97706;">🏆 Rank ${sectionSgpaRank}</td>
    </tr>` : ""}
    ${sectionCgpaRank ? `
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Section CGPA Rank:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; color: #d97706;">🥇 Rank ${sectionCgpaRank}</td>
    </tr>` : ""}
    ${universityRank ? `
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">University Rank:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">Rank ${universityRank}</td>
    </tr>` : ""}
  </table>

  <div style="margin-bottom: 24px; padding: 14px 18px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;">
    <p style="margin: 0; font-size: 14px; color: #1e40af;">
      <strong>View Full Leaderboards & Department Rankings on GradeFlow:</strong><br>
      <a href="https://grade-flow-navy.vercel.app/leaderboard" style="color: #2563eb; font-weight: bold; text-decoration: underline; display: inline-block; margin-top: 4px;">https://grade-flow-navy.vercel.app/leaderboard</a>
    </p>
  </div>

  <div style="text-align: center; margin-top: 18px; margin-bottom: 28px;">
    <a href="${waUrl}" style="display: inline-block; padding: 12px 20px; background-color: #25D366; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 8px; box-shadow: 0 2px 6px rgba(37,211,102,0.25); white-space: nowrap;">💬 Share Gratitude with Developer on WhatsApp</a>
  </div>

  <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; font-style: italic; color: #555555; text-align: center;">
      "Excellence is not a single act, but a habit. Keep pushing boundaries and inspiring your peers!"
    </p>
  </div>

  <div style="font-size: 13px; color: #777777;">
    <p style="margin: 0 0 5px 0;">Warm Regards,</p>
    <p style="margin: 0 0 15px 0; font-weight: bold;">GradeFlow Developer</p>
    <p style="margin: 0 0 5px 0;">Academic Progress & Result Management System</p>
    <p style="margin: 0;">
      This is an official academic recognition message generated by GradeFlow.<br>
      Please do not reply directly to this email.
    </p>
  </div>

</body>
</html>
  `.trim();
}

function generateTopperEmailText(payload) {
  const cleanRegNo = String(payload.regNo || "").trim();
  const cleanName = String(payload.studentName || "Student").trim();

  return `GradeFlow - Academic Excellence Recognition

Dear ${cleanName},

Congratulations on securing Top Rank in Section ${payload.section || "N/A"} for Semester ${payload.semester}!

Academic Summary:
----------------
Student Name       : ${cleanName}
Registration No.   : ${cleanRegNo}
Branch & Batch     : ${payload.branch} (${payload.batch})
Section            : Section ${payload.section}
Semester SGPA      : ${payload.sgpa}
Cumulative CGPA    : ${payload.cgpa}
Section SGPA Rank  : Rank ${payload.sectionSgpaRank || "N/A"}
Section CGPA Rank  : Rank ${payload.sectionCgpaRank || "N/A"}

View Full Leaderboards:
https://grade-flow-navy.vercel.app/leaderboard

Regards,
GradeFlow Developer
Academic Progress & Result Management System
`;
}

module.exports = {
  generateTopperEmailHtml,
  generateTopperEmailText,
};
