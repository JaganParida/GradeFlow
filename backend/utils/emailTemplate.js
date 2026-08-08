/**
 * GradeFlow Academic Notification Email — Personal Style Template
 * 
 * Gmail Primary Inbox Strategy:
 * - Looks like a PERSONAL email, not marketing/bulk
 * - Minimal HTML (no heavy banners, colored boxes, or complex tables)
 * - Simple text-like formatting that Gmail ML treats as person-to-person
 * - Zero attachments, zero images
 * - List-Unsubscribe header for Gmail trust
 */

function generateBacklogEmailHtml({
  studentName,
  regNo,
  cgpa,
  totalBacklogs,
  completedSemesters,
  remainingSemesters,
  latestSemester,
  backlogSubjects = [],
  developerWhatsapp = "919124540575",
  frontendUrl = "https://grade-flow-navy.vercel.app",
}) {
  const cleanRegNo = String(regNo || "").trim();
  const cleanName = String(studentName || "Student").trim();
  const firstName = cleanName.split(" ")[0];
  firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const formattedCgpa = typeof cgpa === "number" ? cgpa.toFixed(2) : cgpa || "0.00";
  const numBacklogs = Number(totalBacklogs) || backlogSubjects.length || 0;

  const baseUrl = String(frontendUrl || "https://grade-flow-navy.vercel.app").replace(/\/$/, "");
  const studentPortalUrl = `${baseUrl}/dashboard/${cleanRegNo}`;

  const waRawMessage = `Hi, I am ${cleanName} (${cleanRegNo}). I need help updating my GradeFlow academic record.`;
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waRawMessage)}`;

  // Build subject list as simple text lines
  let subjectLines = "";
  if (backlogSubjects.length > 0) {
    backlogSubjects.forEach((s) => {
      subjectLines += `<tr>
        <td style="padding:4px 8px;color:#555;font-size:13px;border-bottom:1px solid #eee;">${s.subCode || "N/A"}</td>
        <td style="padding:4px 8px;color:#333;font-size:13px;border-bottom:1px solid #eee;">${s.subName || "Subject"}</td>
        <td style="padding:4px 8px;color:#333;font-size:13px;border-bottom:1px solid #eee;">Sem ${s.semester || 1}</td>
        <td style="padding:4px 8px;color:#c00;font-size:13px;border-bottom:1px solid #eee;">${s.grade || "F"}</td>
      </tr>`;
    });
  }

  // Personal, conversational email — NOT marketing style
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.6;">
<div style="max-width:560px;margin:20px auto;padding:0 16px;">

<p>Hi ${firstName},</p>

<p>This is an academic update from <strong>GradeFlow</strong> for your registration number <strong>${cleanRegNo}</strong>.</p>

<p>Here is your current academic summary:</p>

<table style="border-collapse:collapse;margin:8px 0 16px 0;font-size:13px;">
  <tr><td style="padding:3px 12px 3px 0;color:#666;">Name</td><td style="padding:3px 0;font-weight:bold;">${cleanName}</td></tr>
  <tr><td style="padding:3px 12px 3px 0;color:#666;">Reg. No.</td><td style="padding:3px 0;font-weight:bold;">${cleanRegNo}</td></tr>
  <tr><td style="padding:3px 12px 3px 0;color:#666;">CGPA</td><td style="padding:3px 0;font-weight:bold;color:#1a73e8;">${formattedCgpa}</td></tr>
  <tr><td style="padding:3px 12px 3px 0;color:#666;">Completed Semesters</td><td style="padding:3px 0;font-weight:bold;">${completedSemesters} of 8</td></tr>
  <tr><td style="padding:3px 12px 3px 0;color:#666;">Pending Backlogs</td><td style="padding:3px 0;font-weight:bold;color:${numBacklogs > 0 ? '#c00' : '#1a8a1a'};">${numBacklogs}</td></tr>
</table>

${numBacklogs > 0 ? `<p>Your pending backlog subjects are:</p>

<table style="border-collapse:collapse;margin:8px 0 16px 0;width:100%;font-size:13px;">
  <tr style="background:#f5f5f5;">
    <th style="padding:6px 8px;text-align:left;font-size:12px;color:#666;border-bottom:1px solid #ddd;">Code</th>
    <th style="padding:6px 8px;text-align:left;font-size:12px;color:#666;border-bottom:1px solid #ddd;">Subject</th>
    <th style="padding:6px 8px;text-align:left;font-size:12px;color:#666;border-bottom:1px solid #ddd;">Sem</th>
    <th style="padding:6px 8px;text-align:left;font-size:12px;color:#666;border-bottom:1px solid #ddd;">Grade</th>
  </tr>
  ${subjectLines}
</table>

<p>Please try to clear these subjects in your upcoming exams. ${remainingSemesters <= 2 ? 'You have limited semesters remaining, so this is important.' : ''}</p>` : `<p>Great news! You currently have <strong>no pending backlogs</strong>. Keep up the good work.</p>`}

<p>You can view your complete semester results, internal marks, and rankings on GradeFlow:<br>
<a href="${studentPortalUrl}" style="color:#1a73e8;">${studentPortalUrl}</a></p>

${numBacklogs > 0 ? `<p>If you have already cleared any of these subjects but your record hasn't been updated yet, please let me know by replying to this email or reaching out on WhatsApp:<br>
<a href="${waUrl}" style="color:#1a73e8;">Contact on WhatsApp</a></p>` : ''}

<p>Best regards,<br>
<strong>Jagan Parida</strong><br>
<span style="color:#666;font-size:12px;">Developer, GradeFlow &mdash; <a href="${baseUrl}" style="color:#666;">${baseUrl}</a></span></p>

</div>
</body>
</html>`;
}

/**
 * Plain-Text version (must closely match the HTML)
 */
function generateBacklogEmailText({
  studentName,
  regNo,
  cgpa,
  totalBacklogs,
  completedSemesters,
  remainingSemesters,
  latestSemester,
  backlogSubjects = [],
  developerWhatsapp = "919124540575",
  frontendUrl = "https://grade-flow-navy.vercel.app",
}) {
  const cleanRegNo = String(regNo || "").trim();
  const cleanName = String(studentName || "Student").trim();
  const firstName = cleanName.split(" ")[0];
  const formattedCgpa = typeof cgpa === "number" ? cgpa.toFixed(2) : cgpa || "0.00";
  const numBacklogs = Number(totalBacklogs) || backlogSubjects.length || 0;
  const baseUrl = String(frontendUrl || "https://grade-flow-navy.vercel.app").replace(/\/$/, "");
  const studentPortalUrl = `${baseUrl}/dashboard/${cleanRegNo}`;

  const waRawMessage = `Hi, I am ${cleanName} (${cleanRegNo}). I need help updating my GradeFlow academic record.`;
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waRawMessage)}`;

  let subjectsList = "";
  backlogSubjects.forEach((s) => {
    subjectsList += `  - ${s.subCode || "N/A"}: ${s.subName || "Subject"} (Sem ${s.semester || 1}, Grade: ${s.grade || "F"})\n`;
  });

  return `Hi ${firstName},

This is an academic update from GradeFlow for your registration number ${cleanRegNo}.

Your current academic summary:
- Name: ${cleanName}
- Reg. No.: ${cleanRegNo}
- CGPA: ${formattedCgpa}
- Completed Semesters: ${completedSemesters} of 8
- Pending Backlogs: ${numBacklogs}

${numBacklogs > 0 ? `Your pending backlog subjects:
${subjectsList}
Please try to clear these subjects in your upcoming exams.` : `Great news! You currently have no pending backlogs. Keep up the good work.`}

View your complete results on GradeFlow:
${studentPortalUrl}

${numBacklogs > 0 ? `If you have already cleared any of these subjects but your record hasn't been updated, please contact me:
WhatsApp: ${waUrl}` : ''}

Best regards,
Jagan Parida
Developer, GradeFlow
${baseUrl}
`;
}

module.exports = {
  generateBacklogEmailHtml,
  generateBacklogEmailText,
};
