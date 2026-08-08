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

  <div style="margin-bottom: 32px;">
    <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333333;">Need to update your result?</h3>
    <p style="margin-bottom: 16px; font-size: 14px;">
      If you have already cleared a backlog but it is still showing as pending on GradeFlow, please contact the developer with your Registration Number and relevant result details.
    </p>
    <a href="${waUrl}" style="display: inline-flex; align-items: center; padding: 12px 20px; background-color: #25D366; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" style="vertical-align: middle; margin-right: 8px; display: inline-block;">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
      <span style="vertical-align: middle;">Contact Developer on WhatsApp</span>
    </a>
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

Regards,
GradeFlow Developer
Academic Progress & Result Management System
`;
}

module.exports = {
  generateBacklogEmailHtml,
  generateBacklogEmailText,
};
