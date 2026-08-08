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
  frontendUrl = "https://gradeflow.in",
}) {
  const cleanRegNo = String(regNo || "").trim();
  const cleanName = String(studentName || "Student").trim();
  const formattedCgpa = typeof cgpa === "number" ? cgpa.toFixed(2) : cgpa || "0.00";
  const numBacklogs = Number(totalBacklogs) || backlogSubjects.length || 0;
  const baseUrl = String(frontendUrl || "https://gradeflow.in").replace(/\/$/, "");
  const studentPortalUrl = `${baseUrl}/dashboard/${cleanRegNo}`;

  const waRawMessage = `Hello, I am ${cleanName} (Reg. No. ${cleanRegNo}). I need help updating my academic record on GradeFlow.`;
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waRawMessage)}`;

  let subjectsHtml = "";
  if (backlogSubjects && backlogSubjects.length > 0) {
    subjectsHtml = backlogSubjects.map(sub => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">Sem ${sub.semester || 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;"><strong>${sub.subCode || 'N/A'}</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">${sub.subName || 'Unknown'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #ef4444; font-size: 13px; font-weight: bold;">${sub.grade || 'F'}</td>
      </tr>
    `).join('');
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Academic Status Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
  
  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    
    <!-- Header -->
    <tr>
      <td style="padding: 24px 30px; border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
        <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 600;">GradeFlow</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Official Academic Status Update</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 30px;">
        <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px; line-height: 1.6;">
          Dear <strong>${cleanName}</strong>,
        </p>
        
        <p style="margin: 0 0 24px 0; color: #334155; font-size: 14px; line-height: 1.6;">
          This is an automated summary of your current academic standing, including completed semesters and pending subjects.
        </p>

        <!-- Summary Table -->
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 6px;">
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc; color: #64748b; font-size: 13px; width: 45%;">Registration Number</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">${cleanRegNo}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc; color: #64748b; font-size: 13px;">Current CGPA</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0284c7; font-size: 14px; font-weight: 700;">${formattedCgpa}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; background-color: #f8fafc; color: #64748b; font-size: 13px;">Active Backlogs</td>
            <td style="padding: 12px 16px; color: #ef4444; font-size: 14px; font-weight: 700;">${numBacklogs} subject(s)</td>
          </tr>
        </table>

        ${numBacklogs > 0 ? `
        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px;">Pending Subjects Detail</h3>
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; border-collapse: collapse;">
          <thead>
            <tr>
              <th align="left" style="padding: 10px; border-bottom: 2px solid #cbd5e1; color: #475569; font-size: 12px; font-weight: 600; text-transform: uppercase;">Sem</th>
              <th align="left" style="padding: 10px; border-bottom: 2px solid #cbd5e1; color: #475569; font-size: 12px; font-weight: 600; text-transform: uppercase;">Code</th>
              <th align="left" style="padding: 10px; border-bottom: 2px solid #cbd5e1; color: #475569; font-size: 12px; font-weight: 600; text-transform: uppercase;">Subject</th>
              <th align="left" style="padding: 10px; border-bottom: 2px solid #cbd5e1; color: #475569; font-size: 12px; font-weight: 600; text-transform: uppercase;">Grade</th>
            </tr>
          </thead>
          <tbody>
            ${subjectsHtml}
          </tbody>
        </table>
        ` : `
        <div style="padding: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; margin-bottom: 24px;">
          <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 500;">
            Excellent! You have 0 active backlogs. Keep up the good work.
          </p>
        </div>
        `}

        <div style="margin-bottom: 24px; text-align: center;">
          <a href="${studentPortalUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 6px;">
            View Complete Report Card
          </a>
        </div>

        <div style="padding: 16px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; text-align: center;">
          <p style="margin: 0 0 10px 0; color: #475569; font-size: 13px;">
            If you have already cleared a subject but it still appears as pending, please contact the developer to update your record.
          </p>
          <a href="${waUrl}" style="color: #16a34a; font-size: 13px; font-weight: 600; text-decoration: none;">
            Contact Support via WhatsApp &rarr;
          </a>
        </div>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
          This is an automated system notification generated by GradeFlow.<br>
          Please do not reply directly to this email address.
        </p>
      </td>
    </tr>

  </table>
  
</body>
</html>`;
}

function generateBacklogEmailText(payload) {
  const cleanRegNo = String(payload.regNo || "").trim();
  const cleanName = String(payload.studentName || "Student").trim();
  const formattedCgpa = typeof payload.cgpa === "number" ? payload.cgpa.toFixed(2) : payload.cgpa || "0.00";
  const numBacklogs = payload.totalBacklogs || (payload.backlogSubjects || []).length || 0;
  
  let subjectsListText = "";
  (payload.backlogSubjects || []).forEach((s) => {
    subjectsListText += `  - Sem ${s.semester || 1}: ${s.subCode || "N/A"} - ${s.subName || "Subject"} (Grade: ${s.grade || "F"})\n`;
  });

  return `GradeFlow - Official Academic Status Update

Dear ${cleanName},

This is an automated summary of your current academic standing.

Registration Number: ${cleanRegNo}
Current CGPA: ${formattedCgpa}
Active Backlogs: ${numBacklogs}

Pending Subjects:
${subjectsListText || "None (0 active backlogs)"}

To view your complete results, please visit the student portal.
If you believe there is an error in this record, please contact support via WhatsApp.

--
GradeFlow System
`;
}

module.exports = {
  generateBacklogEmailHtml,
  generateBacklogEmailText,
};
