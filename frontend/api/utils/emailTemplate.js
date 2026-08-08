/**
 * GradeFlow Professional Backlog Notification Email Generator
 * 
 * Gmail Primary Inbox Optimized:
 * - ZERO attachments (no CID, no inline images) — eliminates Gmail spam scoring
 * - Pure inline SVG icons for GradeFlow logo and WhatsApp icon
 * - Matching website GraduationCap icon (white box + dark cap, same as Navbar)
 * - Clean dual-part HTML + Plain Text MIME
 * - Natural "From" display name matching authenticated Gmail account
 */

// Absolute URL references for images (avoids Gmail SVG stripping)
// These will be generated inside the HTML function using baseUrl

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
  const formattedCgpa = typeof cgpa === "number" ? cgpa.toFixed(2) : cgpa || "0.00";
  const numBacklogs = Number(totalBacklogs) || backlogSubjects.length || 0;
  const backlogsText = numBacklogs === 1 ? "1 pending backlog" : `${numBacklogs} pending backlogs`;

  const baseUrl = String(frontendUrl || "https://grade-flow-navy.vercel.app").replace(/\/$/, "");
  const studentPortalUrl = `${baseUrl}/dashboard/${cleanRegNo}`;

  // Group backlogs by semester
  const semGrouped = {};
  backlogSubjects.forEach((sub) => {
    const sem = sub.semester || 1;
    if (!semGrouped[sem]) semGrouped[sem] = [];
    semGrouped[sem].push(sub);
  });

  const sortedSemesters = Object.keys(semGrouped)
    .map(Number)
    .sort((a, b) => a - b);

  let progressMessage = "";
  if (remainingSemesters <= 1) {
    progressMessage = `You are currently in Semester ${latestSemester}, with ${remainingSemesters === 1 ? "1 semester" : "no semesters"} remaining before graduation. Please prioritize clearing your pending subjects so your official academic transcript reflects accurately.`;
  } else {
    progressMessage = `You currently have ${remainingSemesters} semesters remaining in your degree program. We recommend utilizing the upcoming semester examinations to clear these subjects.`;
  }

  const waRawMessage = `Hello, I am ${cleanName} (Reg. No. ${cleanRegNo}). I need help updating my academic record on GradeFlow.`;
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waRawMessage)}`;

  // Semester tables
  const semesterTablesHtml = sortedSemesters
    .map((sem) => {
      const subs = semGrouped[sem];
      const rows = subs
        .map(
          (s) => `
          <tr>
            <td style="padding:8px 12px;font-family:monospace;font-size:13px;color:#475569;font-weight:600;border-bottom:1px solid #e2e8f0;">${s.subCode || "N/A"}</td>
            <td style="padding:8px 12px;font-size:13px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${s.subName || "Subject"}</td>
            <td style="padding:8px 12px;font-size:12px;text-align:right;border-bottom:1px solid #e2e8f0;">
              <span style="background:#fee2e2;color:#dc2626;padding:2px 6px;border-radius:4px;font-weight:700;font-size:11px;">Pending (${s.grade || "F"})</span>
            </td>
          </tr>`
        )
        .join("");

      return `
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:14px;border:1px solid #e2e8f0;border-radius:6px;border-collapse:separate;overflow:hidden;">
          <tr>
            <td colspan="3" style="background:#f1f5f9;padding:7px 12px;border-left:4px solid #ef4444;font-weight:700;color:#0f172a;font-size:13px;">
              Semester ${sem}
            </td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:6px 12px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;">Code</td>
            <td style="padding:6px 12px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;">Subject</td>
            <td style="padding:6px 12px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;text-align:right;border-bottom:1px solid #e2e8f0;">Status</td>
          </tr>
          ${rows}
        </table>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GradeFlow Academic Record Overview</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;padding:16px 8px;">
    <tr>
      <td align="center">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          
          <!-- Header: White box GraduationCap + GradeFlow text (matches website Navbar) -->
          <tr>
            <td style="background:#0f172a;padding:18px 20px;text-align:center;">
              <table cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="${baseUrl}/logo.png" width="32" height="32" alt="Logo" style="display:block;border-radius:7px;" />
                  </td>
                  <td style="vertical-align:middle;text-align:left;">
                    <span style="font-family:'Courier New',Courier,monospace;font-weight:700;font-size:20px;color:#ffffff;letter-spacing:-0.5px;display:block;line-height:1.1;">GradeFlow</span>
                    <span style="font-size:9px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;display:block;margin-top:2px;">Academic Analytics</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:22px 20px;font-size:14px;line-height:1.6;color:#334155;">

              <p style="margin-top:0;font-size:14px;color:#0f172a;font-weight:600;">Hello ${cleanName},</p>
              
              <p style="margin-bottom:16px;">This is an academic progress update from GradeFlow regarding your current semester results and any pending backlog subjects.</p>

              <!-- Academic Summary -->
              <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:16px;">
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:13px;color:#0f172a;">Academic Summary</td>
                  <td align="right" style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;">Official Record</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:10px 14px;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;">
                      <tr><td style="padding:3px 0;color:#64748b;">Name</td><td align="right" style="padding:3px 0;color:#0f172a;font-weight:700;">${cleanName}</td></tr>
                      <tr><td style="padding:3px 0;color:#64748b;">Reg. No.</td><td align="right" style="padding:3px 0;color:#0f172a;font-weight:700;font-family:monospace;">${cleanRegNo}</td></tr>
                      <tr><td style="padding:3px 0;color:#64748b;">CGPA</td><td align="right" style="padding:3px 0;color:#2563eb;font-weight:800;">${formattedCgpa}</td></tr>
                      <tr><td style="padding:3px 0;color:#64748b;">Pending Backlogs</td><td align="right" style="padding:3px 0;color:#dc2626;font-weight:800;">${numBacklogs}</td></tr>
                      <tr><td style="padding:3px 0;color:#64748b;">Completed Semesters</td><td align="right" style="padding:3px 0;color:#0f172a;font-weight:700;">${completedSemesters}</td></tr>
                      <tr><td style="padding:3px 0;color:#64748b;">Remaining Semesters</td><td align="right" style="padding:3px 0;color:#0f172a;font-weight:700;">${remainingSemesters}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Backlog Status -->
              <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;margin-bottom:16px;">
                <tr>
                  <td style="padding:10px 14px;text-align:center;">
                    <div style="color:#991b1b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Backlog Status</div>
                    <div style="color:#dc2626;font-size:15px;font-weight:800;">You currently have ${backlogsText}.</div>
                  </td>
                </tr>
              </table>

              <!-- Portal Link -->
              <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;margin-bottom:16px;">
                <tr>
                  <td style="padding:12px;text-align:center;">
                    <div style="font-size:12px;color:#0369a1;margin-bottom:6px;font-weight:600;">
                      View your semester results, internal marks, and rankings:
                    </div>
                    <a href="${studentPortalUrl}" target="_blank" style="display:inline-block;background:#0284c7;color:#ffffff;font-weight:700;font-size:12px;text-decoration:none;padding:7px 14px;border-radius:5px;">
                      Open GradeFlow Portal
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Semester-Wise Backlog Details -->
              ${sortedSemesters.length > 0 ? `
              <div style="margin-bottom:14px;">
                <div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:8px;border-bottom:2px solid #0f172a;padding-bottom:3px;display:inline-block;">Backlog Details</div>
                ${semesterTablesHtml}
              </div>` : ""}

              <!-- Academic Guidance -->
              <div style="background:#f8fafc;border-left:3px solid #0f172a;padding:10px 12px;margin-bottom:14px;font-size:12px;color:#334155;line-height:1.5;">
                <div style="font-weight:700;font-size:12px;color:#0f172a;margin-bottom:2px;">Academic Guidance</div>
                ${progressMessage}
              </div>

              <!-- Important Note -->
              <div style="border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;margin-bottom:16px;">
                <div style="font-weight:700;font-size:11px;color:#b91c1c;margin-bottom:2px;">Important</div>
                <p style="margin:0;font-size:11px;color:#475569;line-height:1.5;">
                  If you have already cleared any subject listed above but it still appears as pending, please contact the developer with your registration number so your record can be updated.
                </p>
              </div>

              <!-- WhatsApp Contact -->
              <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:16px;text-align:center;">
                <tr>
                  <td style="padding:14px 12px;">
                    <div style="font-weight:700;font-size:12px;color:#0f172a;margin-bottom:2px;">Need help updating your result?</div>
                    <p style="font-size:11px;color:#64748b;margin:0 0 10px 0;">Contact the developer with your Registration Number.</p>
                    <a href="${waUrl}" target="_blank" style="display:inline-block;background:#25D366;color:#ffffff;font-weight:700;font-size:12px;text-decoration:none;padding:8px 18px;border-radius:18px;">
                      <table cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                        <tr>
                          <td style="vertical-align:middle;padding-right:6px;"><img src="${baseUrl}/whatsapp.png" width="16" height="16" alt="WhatsApp" style="display:block;" /></td>
                          <td style="vertical-align:middle;color:#ffffff;font-weight:700;font-size:12px;">Contact on WhatsApp</td>
                        </tr>
                      </table>
                    </a>
                  </td>
                </tr>
              </table>

              <div style="text-align:center;font-style:italic;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px;">
                "Your backlog is not your final result. Clear it, learn from it, and keep moving forward."
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:14px 18px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;line-height:1.5;">
              <div style="font-weight:700;color:#0f172a;font-size:11px;margin-bottom:1px;">Regards, GradeFlow Team</div>
              <div style="font-size:10px;color:#94a3b8;margin-top:4px;">
                This is an automated academic notification. Please do not reply to this email.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plain-Text Fallback Version
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
  const formattedCgpa = typeof cgpa === "number" ? cgpa.toFixed(2) : cgpa || "0.00";
  const numBacklogs = Number(totalBacklogs) || backlogSubjects.length || 0;
  const baseUrl = String(frontendUrl || "https://grade-flow-navy.vercel.app").replace(/\/$/, "");
  const studentPortalUrl = `${baseUrl}/dashboard/${cleanRegNo}`;

  const waRawMessage = `Hello, I am ${cleanName} (Reg. No. ${cleanRegNo}). I need help updating my academic record on GradeFlow.`;
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waRawMessage)}`;

  let subjectsListText = "";
  backlogSubjects.forEach((s) => {
    subjectsListText += `  - Sem ${s.semester || 1}: ${s.subCode || "N/A"} - ${s.subName || "Subject"} (Grade: ${s.grade || "F"})\n`;
  });

  return `GradeFlow Academic Record Overview

Hello ${cleanName},

This is an academic progress update from GradeFlow regarding your current semester results and any pending backlog subjects.

Academic Summary:
- Name: ${cleanName}
- Registration Number: ${cleanRegNo}
- Current CGPA: ${formattedCgpa}
- Pending Backlogs: ${numBacklogs}
- Completed Semesters: ${completedSemesters}
- Remaining Semesters: ${remainingSemesters}

You currently have ${numBacklogs} pending backlog(s).

Pending Subjects:
${subjectsListText || "  No active backlogs recorded."}

View your live results at:
${studentPortalUrl}

If you have already cleared any subject but it still shows as pending, please contact the developer with your registration number.

WhatsApp Support: ${waUrl}

Regards,
GradeFlow Team
${baseUrl}
`;
}

module.exports = {
  generateBacklogEmailHtml,
  generateBacklogEmailText,
};
