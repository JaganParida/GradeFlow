function generateBacklogEmailHtml({
  studentName,
  regNo,
  cgpa,
  totalBacklogs,
  backlogSubjects = [],
  frontendUrl = "https://gradeflow.in"
}) {
  const cleanRegNo = String(regNo || "").trim();
  const cleanName = String(studentName || "Student").trim();
  const formattedCgpa = typeof cgpa === "number" ? cgpa.toFixed(2) : cgpa || "0.00";
  const numBacklogs = Number(totalBacklogs) || backlogSubjects.length || 0;
  const studentPortalUrl = `https://gradeflow.in/dashboard/${cleanRegNo}`;

  let subjectsHtml = "";
  if (backlogSubjects && backlogSubjects.length > 0) {
    subjectsHtml = `
      <br>
      <p style="color: #333333; font-size: 14px; margin-bottom: 8px;">Pending Subjects:</p>
      <table style="width: 100%; max-width: 600px; border-collapse: collapse; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; font-size: 14px; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="border: 1px solid #e0e0e0; padding: 10px; background-color: #f9f9f9; text-align: left; color: #333333;">Sem</th>
            <th style="border: 1px solid #e0e0e0; padding: 10px; background-color: #f9f9f9; text-align: left; color: #333333;">Code</th>
            <th style="border: 1px solid #e0e0e0; padding: 10px; background-color: #f9f9f9; text-align: left; color: #333333;">Subject</th>
            <th style="border: 1px solid #e0e0e0; padding: 10px; background-color: #f9f9f9; text-align: left; color: #333333;">Grade</th>
          </tr>
        </thead>
        <tbody>
          ${backlogSubjects.map(sub => `
            <tr>
              <td style="border: 1px solid #e0e0e0; padding: 10px; color: #333333;">${sub.semester || 1}</td>
              <td style="border: 1px solid #e0e0e0; padding: 10px; color: #333333;">${sub.subCode || 'N/A'}</td>
              <td style="border: 1px solid #e0e0e0; padding: 10px; color: #333333;">${sub.subName || 'Unknown'}</td>
              <td style="border: 1px solid #e0e0e0; padding: 10px; color: #d32f2f;">${sub.grade || 'F'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  const statusMessage = numBacklogs > 0 
    ? `<p style="color: #d32f2f; font-size: 14px; font-weight: bold; margin-bottom: 20px;">You currently have ${numBacklogs} active backlog(s).</p>` 
    : `<p style="color: #333333; font-size: 14px; margin-bottom: 20px;">You have no active backlogs.</p>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Official Academic Status Update</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #ffffff; color: #333333; line-height: 1.6; margin: 0; padding: 20px;">
  
  <p style="margin-bottom: 16px;">Dear ${cleanName},</p>
  
  <p style="margin-bottom: 20px;">
    This is an automated academic record overview from the GradeFlow system regarding your current status.
  </p>

  <table style="width: 100%; max-width: 600px; border-collapse: collapse; border: 1px solid #e0e0e0; margin-bottom: 20px;">
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; width: 40%; background-color: #f9f9f9;">Registration Number:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${cleanRegNo}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Current CGPA:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${formattedCgpa}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e0e0e0; padding: 12px; font-weight: bold; background-color: #f9f9f9;">Active Backlogs:</td>
      <td style="border: 1px solid #e0e0e0; padding: 12px;">${numBacklogs} subject(s)</td>
    </tr>
  </table>

  ${statusMessage}

  ${subjectsHtml}

  <p style="margin-bottom: 10px;">
    You can view your full semester results and rankings on the student portal:<br>
    <a href="${studentPortalUrl}" style="color: #1a73e8; text-decoration: underline;">View Academic Record</a>
  </p>

  <p style="margin-bottom: 20px;">
    If you believe there is an error in this record, please reply to this email or contact the university administration.
  </p>

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

This is an automated academic record overview from the GradeFlow system regarding your current status.

Registration Number: ${cleanRegNo}
Current CGPA: ${formattedCgpa}
Active Backlogs: ${numBacklogs} subject(s)

${numBacklogs > 0 ? "Pending Subjects:\n" + subjectsListText : "You have no active backlogs."}

You can view your full semester results and rankings on the student portal:
https://gradeflow.in/dashboard/${cleanRegNo}

If you believe there is an error in this record, please reply to this email or contact the university administration.
`;
}

module.exports = {
  generateBacklogEmailHtml,
  generateBacklogEmailText,
};
