function generateBacklogEmailHtml({
  studentName,
  regNo,
  cgpa,
  totalBacklogs,
  completedSemesters,
  remainingSemesters,
  latestSemester,
  backlogSubjects = [],
  batch = "N/A",
  branch = "N/A",
  section = "N/A",
  developerWhatsapp = "919124540575",
  frontendUrl = "https://grade-flow-navy.vercel.app/"
}) {
  const cleanRegNo = String(regNo || "").trim();
  const cleanName = String(studentName || "Student").trim();
  const formattedCgpa = typeof cgpa === "number" ? cgpa.toFixed(2) : cgpa || "0.00";
  const numBacklogs = Number(totalBacklogs) || backlogSubjects.length || 0;
  const baseUrl = String(frontendUrl || "https://grade-flow-navy.vercel.app/").replace(/\/$/, "");

  // WhatsApp Link
  const waRawMessage = `Hello GradeFlow Developer, I am ${cleanName} with Registration Number ${cleanRegNo}. My backlog/result information needs to be updated. Please help me verify my academic record.`;
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waRawMessage)}`;

  // Group Backlogs by Semester
  const semMap = {};
  backlogSubjects.forEach(sub => {
    const sem = sub.semester || 1;
    if (!semMap[sem]) semMap[sem] = [];
    semMap[sem].push(sub);
  });
  const sortedSemesters = Object.keys(semMap).sort((a, b) => Number(a) - Number(b));

  let semesterTablesHtml = "";
  if (sortedSemesters.length > 0) {
    sortedSemesters.forEach(sem => {
      semesterTablesHtml += `
        <p style="font-weight: bold; margin-bottom: 5px; color: #333333; font-size: 14px;">Semester ${sem}</p>
        <table style="width: 100%; max-width: 600px; border-collapse: collapse; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; font-size: 14px; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="border: 1px solid #e0e0e0; padding: 10px; background-color: #f9f9f9; text-align: left; color: #333333; width: 25%;">Subject Code</th>
              <th style="border: 1px solid #e0e0e0; padding: 10px; background-color: #f9f9f9; text-align: left; color: #333333; width: 55%;">Subject Name</th>
              <th style="border: 1px solid #e0e0e0; padding: 10px; background-color: #f9f9f9; text-align: left; color: #333333; width: 20%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${semMap[sem].map(sub => `
              <tr>
                <td style="border: 1px solid #e0e0e0; padding: 10px; color: #333333;">${sub.subCode || 'N/A'}</td>
                <td style="border: 1px solid #e0e0e0; padding: 10px; color: #333333;">${sub.subName || 'Unknown'}</td>
                <td style="border: 1px solid #e0e0e0; padding: 10px; color: #d32f2f;">Pending</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    });
  }

  // Dynamic Academic Message
  let progressMessage = "";
  if (remainingSemesters <= 1) {
    progressMessage = `You are currently in Semester ${latestSemester}, with ${remainingSemesters} semester remaining.<br>This is an important stage of your academic journey. We strongly encourage you to clear your pending subjects as soon as possible so that your academic record can be updated successfully before graduation.`;
  } else {
    progressMessage = `You currently have ${remainingSemesters} semesters remaining. Use this time wisely to clear your pending subjects and keep your academic progress on track.`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Official Academic Status Update</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #ffffff; color: #333333; line-height: 1.6; margin: 0; padding: 20px;">

  <div style="margin-bottom: 24px;">
    <h2 style="margin: 0; font-size: 20px; font-weight: bold;"><span style="color: #333333;">Grade</span><span style="color: #2563eb;">Flow</span></h2>
    <p style="margin: 0; font-size: 14px; color: #666666;">Academic Progress & Result Management System</p>
  </div>

  <p style="margin-bottom: 16px;">Dear ${cleanName},</p>
  
  <p style="margin-bottom: 24px;">
    This is an academic notification from GradeFlow regarding your current academic progress and pending backlogs.
  </p>

  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333333;">Academic Summary</h3>
  <table style="width: 100%; max-width: 600px; border-collapse: collapse; border: 1px solid #e0e0e0; margin-bottom: 24px; font-size: 14px;">
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; width: 40%; background-color: #f9f9f9;">Student Name:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${cleanName}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Registration No.:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${cleanRegNo}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Batch:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${batch}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Branch:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${branch}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Section:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${section}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Current CGPA:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${formattedCgpa}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Total Backlogs:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${numBacklogs}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Completed Semesters:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${completedSemesters}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Remaining Semesters:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${remainingSemesters}</td>
    </tr>
  </table>

  ${numBacklogs > 0 ? `
  <p style="font-size: 16px; font-weight: bold; color: #d32f2f; margin-bottom: 24px;">
    You currently have ${numBacklogs} pending backlog${numBacklogs > 1 ? 's' : ''}.
  </p>

  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333333;">Semester-Wise Backlog Details</h3>
  ${semesterTablesHtml}

  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333333;">Backlog Summary</h3>
  <table style="width: 100%; max-width: 600px; border-collapse: collapse; border: 1px solid #e0e0e0; margin-bottom: 24px; font-size: 14px;">
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 10px; width: 60%; background-color: #f9f9f9; color: #333333;">Total Pending Backlogs:</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px; font-weight: bold;">${numBacklogs}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 10px; background-color: #f9f9f9; color: #333333;">Semesters With Backlogs:</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px; font-weight: bold;">${sortedSemesters.length}</td>
    </tr>
    ${sortedSemesters.map(sem => `
      <tr>
        <td style="border: 1px solid #e0e0e0; padding: 10px; background-color: #ffffff; color: #666666; padding-left: 20px;">Semester ${sem}:</td>
        <td style="border: 1px solid #e0e0e0; padding: 10px;">${semMap[sem].length} Backlog${semMap[sem].length > 1 ? 's' : ''}</td>
      </tr>
    `).join('')}
  </table>
  ` : `
  <p style="font-size: 16px; font-weight: bold; color: #1a73e8; margin-bottom: 24px;">
    You have no active backlogs.
  </p>
  `}

  <p style="margin-bottom: 24px; font-size: 14px;">
    ${progressMessage}
  </p>

  <!-- Website Link Box -->
  <div style="margin-bottom: 24px; padding: 14px 18px; background-color: #f0f7ff; border: 1px solid #cce3ff; border-radius: 6px;">
    <p style="margin: 0; font-size: 14px; color: #1e3a8a;">
      <strong>For more details & complete performance breakdown, reach out to our website:</strong><br>
      <a href="https://grade-flow-navy.vercel.app/" style="color: #2563eb; font-weight: bold; text-decoration: underline; display: inline-block; marginTop: 4px;">https://grade-flow-navy.vercel.app/</a>
    </p>
  </div>

  <div style="margin-bottom: 24px;">
    <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #d32f2f;">Important</h3>
    <p style="margin-bottom: 10px; font-size: 14px;">Please do not ignore this notification.</p>
    <p style="margin-bottom: 0; font-size: 14px;">
      If you have already cleared any of the subjects listed above but your result has not yet been updated on GradeFlow, please contact the developer so that your academic record can be reviewed and updated.
    </p>
  </div>

    <a href="${waUrl}" style="display: block; width: 100%; max-width: 320px; box-sizing: border-box; text-align: center; padding: 14px 20px; background-color: #25D366; color: #ffffff; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; box-shadow: 0 2px 6px rgba(37,211,102,0.3); margin: 0 auto;">💬 Contact Developer on WhatsApp</a>
  </div>

  <!-- Testimonials & Rating Section -->
  <div style="margin-bottom: 32px; padding: 18px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
    <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 8px 0; color: #0f172a;">Rate Your Experience on GradeFlow</h3>
    <p style="margin: 0 0 14px 0; font-size: 13px; color: #475569;">
      Help us improve! Share your feedback, review, or rating about GradeFlow.
    </p>
    <a href="https://grade-flow-navy.vercel.app/testimonials" style="display: inline-block; padding: 10px 22px; background-color: #2563eb; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">⭐ Rate Website on GradeFlow</a>
  </div>

  <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; font-style: italic; color: #555555; text-align: center;">
      ${numBacklogs > 0 
        ? '"Your backlog is not your final result. Clear it, learn from it, and keep moving forward."'
        : '"Every cleared subject is one step closer to your goal. Stay consistent, stay focused, and keep moving forward."'}
    </p>
  </div>

  <div style="font-size: 13px; color: #777777;">
    <p style="margin: 0 0 5px 0;">Regards,</p>
    <p style="margin: 0 0 15px 0; font-weight: bold;">GradeFlow Developer</p>
    <p style="margin: 0 0 5px 0;">Academic Progress & Result Management System</p>
    <p style="margin: 0;">
      This is an automated academic notification generated by GradeFlow.<br>
      Please do not reply directly to this email.
    </p>
  </div>

</body>
</html>
  `.trim();
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

This is an automated academic notification from GradeFlow regarding your current academic progress and pending backlogs.

Academic Summary
----------------
Student Name       : ${cleanName}
Registration No.   : ${cleanRegNo}
Current CGPA       : ${formattedCgpa}
Total Backlogs     : ${numBacklogs}
Completed Semesters: ${payload.completedSemesters || 0}
Remaining Semesters: ${payload.remainingSemesters || 0}

${numBacklogs > 0 ? `You currently have ${numBacklogs} pending backlog(s).\n\nPending Subjects:\n${subjectsListText}` : "You have no active backlogs."}

For more details & complete performance breakdown, reach out to our website:
https://grade-flow-navy.vercel.app/

Important
---------
Please do not ignore this notification.
If you have already cleared any of the subjects listed above but your result has not yet been updated on GradeFlow, please contact the developer.

Need to update your result?
Contact Developer on WhatsApp: https://wa.me/919124540575

Rate Your Experience on GradeFlow:
https://grade-flow-navy.vercel.app/testimonials

Regards,
GradeFlow Developer
Academic Progress & Result Management System
`;
}

module.exports = {
  generateBacklogEmailHtml,
  generateBacklogEmailText,
};
