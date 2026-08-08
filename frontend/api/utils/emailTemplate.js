/**
 * GradeFlow High-Deliverability Professional Backlog Notification Email Generator
 * 
 * Optimized for Gmail Primary Inbox Delivery:
 * - Natural greeting and conversational tone
 * - High-reputation HTTPS image URLs (Vercel CDN)
 * - 100% Mobile Responsive Table Design
 * - Dual Part HTML & Plain Text
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
  const formattedCgpa = typeof cgpa === "number" ? cgpa.toFixed(2) : cgpa || "0.00";
  const numBacklogs = Number(totalBacklogs) || backlogSubjects.length || 0;
  const backlogsText = numBacklogs === 1 ? "1 pending backlog" : `${numBacklogs} pending backlogs`;

  const baseUrl = String(frontendUrl || "https://grade-flow-navy.vercel.app").replace(/\/$/, "");
  const logoUrl = `${baseUrl}/logo.png`;
  const waIconUrl = `${baseUrl}/whatsapp.png`;
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

  const semesterSummaryLines = sortedSemesters.map(
    (sem) => `Semester ${sem}: ${semGrouped[sem].length} ${semGrouped[sem].length === 1 ? "Backlog" : "Backlogs"}`
  );

  let progressMessage = "";
  if (remainingSemesters <= 1) {
    progressMessage = `You are currently in Semester ${latestSemester}, with ${remainingSemesters === 1 ? "1 semester" : "no semesters"} remaining before graduation. Please focus on clearing your pending subjects as soon as possible so your official academic transcript can be updated.`;
  } else {
    progressMessage = `You currently have ${remainingSemesters} semesters remaining in your degree program. We advise you to utilize the upcoming semester examinations to clear these pending subjects.`;
  }

  const waRawMessage = `Hello GradeFlow Developer, I am ${cleanName} with Registration Number ${cleanRegNo}. My backlog/result information needs to be updated. Please help me verify my academic record.`;
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waRawMessage)}`;

  // Semester tables using standard HTML table structures
  const semesterTablesHtml = sortedSemesters
    .map((sem) => {
      const subs = semGrouped[sem];
      const rows = subs
        .map(
          (s) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; font-family: monospace, Courier, sans-serif; font-size: 13px; color: #475569; font-weight: 600;">${s.subCode || "N/A"}</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #1e293b; font-weight: 500;">${s.subName || "Subject"}</td>
            <td style="padding: 10px 14px; font-size: 12px; text-align: right;">
              <span style="background-color: #fee2e2; color: #dc2626; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block;">Pending (${s.grade || "F"})</span>
            </td>
          </tr>`
        )
        .join("");

      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background-color: #ffffff;">
          <tr>
            <td colspan="3" style="background-color: #f1f5f9; padding: 8px 14px; border-left: 4px solid #ef4444; font-weight: 700; color: #0f172a; font-size: 13px;">
              Semester ${sem}
            </td>
          </tr>
          <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 14px; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Subject Code</td>
            <td style="padding: 8px 14px; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Subject Name</td>
            <td style="padding: 8px 14px; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Status</td>
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
  <title>GradeFlow Academic Notice</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 20px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          
          <!-- Header Banner with Official 3D Graduation Cap Logo -->
          <tr>
            <td style="background-color: #0f172a; padding: 22px 24px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="${logoUrl}" width="36" height="36" alt="GradeFlow Logo" style="display: block; border: 0; outline: none;" />
                  </td>
                  <td style="vertical-align: middle; text-align: left;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 22px; color: #ffffff; letter-spacing: -0.5px; display: block; line-height: 1.1;">GradeFlow</span>
                    <span style="font-size: 10px; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; display: block; margin-top: 3px;">Academic Analytics Portal</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 24px; font-size: 14px; line-height: 1.6; color: #334155;">

              <p style="margin-top: 0; font-size: 15px; color: #0f172a; font-weight: 700;">Hello ${cleanName},</p>
              
              <p style="margin-bottom: 20px;">This is an academic progress notification from GradeFlow regarding your current academic performance and pending backlog subjects.</p>

              <!-- Academic Summary Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; padding: 14px 16px;">
                <tr>
                  <td style="padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 13px; color: #0f172a;">Academic Record Summary</td>
                  <td align="right" style="padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Official Data</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 10px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13px;">
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: 500;">Student Name</td>
                        <td align="right" style="padding: 4px 0; color: #0f172a; font-weight: 700;">${cleanName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: 500;">Registration Number</td>
                        <td align="right" style="padding: 4px 0; color: #0f172a; font-weight: 700; font-family: monospace;">${cleanRegNo}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: 500;">Current CGPA</td>
                        <td align="right" style="padding: 4px 0; color: #2563eb; font-weight: 800;">${formattedCgpa}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: 500;">Total Pending Backlogs</td>
                        <td align="right" style="padding: 4px 0; color: #dc2626; font-weight: 800;">${numBacklogs}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: 500;">Completed Semesters</td>
                        <td align="right" style="padding: 4px 0; color: #0f172a; font-weight: 700;">${completedSemesters}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748b; font-weight: 500;">Remaining Semesters</td>
                        <td align="right" style="padding: 4px 0; color: #0f172a; font-weight: 700;">${remainingSemesters}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Total Backlog Highlight Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 16px; text-align: center;">
                    <div style="color: #991b1b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Backlog Status</div>
                    <div style="color: #dc2626; font-size: 16px; font-weight: 800;">
                      You currently have <u>${backlogsText}</u>.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Direct Website Search / Portal Callout -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 14px; text-align: center;">
                    <div style="font-size: 13px; color: #0369a1; margin-bottom: 8px; font-weight: 600;">
                      Search and view your live semester results, internal marks, and academic rankings on GradeFlow:
                    </div>
                    <a href="${studentPortalUrl}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 8px 16px; border-radius: 6px;">
                      View Live Results on GradeFlow Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Semester-Wise Backlog Details -->
              ${
                sortedSemesters.length > 0
                  ? `<div style="margin-bottom: 18px;">
                      <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 10px; border-bottom: 2px solid #0f172a; padding-bottom: 4px; display: inline-block;">
                        Semester-Wise Backlog Breakdown
                      </div>
                      ${semesterTablesHtml}
                    </div>`
                  : ""
              }

              <!-- Academic Progress Advice -->
              <div style="background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px 14px; margin-bottom: 18px; font-size: 13px; color: #334155; line-height: 1.5;">
                <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">Academic Guidance</div>
                ${progressMessage}
              </div>

              <!-- Important Note -->
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px; background-color: #ffffff;">
                <div style="font-weight: 700; font-size: 12px; color: #dc2626; margin-bottom: 2px;">Notice for Students</div>
                <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
                  If you have already cleared any of the subjects listed above but your updated marksheet has not yet reflected on GradeFlow, please contact the developer or support team with your registration number.
                </p>
              </div>

              <!-- Developer Contact / WhatsApp PNG Button Section -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <tr>
                  <td style="padding: 16px 14px;">
                    <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">Need to update your result?</div>
                    <p style="font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 12px;">
                      Contact the support team with your Registration Number to verify your cleared subjects.
                    </p>
                    
                    <a href="${waUrl}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 10px 20px; border-radius: 20px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                        <tr>
                          <td style="vertical-align: middle; padding-right: 6px;">
                            <img src="${waIconUrl}" width="16" height="16" alt="WhatsApp" style="display: block; border: 0; outline: none;" />
                          </td>
                          <td style="vertical-align: middle; color: #ffffff; font-weight: 700;">Contact Developer on WhatsApp</td>
                        </tr>
                      </table>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Quote -->
              <div style="text-align: center; font-style: italic; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px;">
                "Your backlog is not your final result. Clear it, learn from it, and keep moving forward."
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5;">
              <div style="font-weight: 700; color: #0f172a; font-size: 12px; margin-bottom: 2px;">Regards, GradeFlow Team</div>
              <div style="margin-bottom: 6px; color: #64748b; font-size: 11px;">Academic Progress & Result Management System</div>
              <div style="font-size: 10px; color: #94a3b8; max-width: 420px; margin: 0 auto;">
                This is an automated academic notification from GradeFlow. Please do not reply directly to this email address.
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
 * Generates Plain-Text Fallback Version for High Inbox Deliverability (Anti-Spam)
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

  const waRawMessage = `Hello GradeFlow Developer, I am ${cleanName} with Registration Number ${cleanRegNo}. My backlog/result information needs to be updated. Please help me verify my academic record.`;
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waRawMessage)}`;

  let subjectsListText = "";
  backlogSubjects.forEach((s) => {
    subjectsListText += `  - Sem ${s.semester || 1}: ${s.subCode || "N/A"} - ${s.subName || "Subject"} (Grade: ${s.grade || "F"})\n`;
  });

  return `GradeFlow Academic Notice

Hello ${cleanName},

This is an academic progress notification from GradeFlow regarding your current academic performance and pending backlog subjects.

ACADEMIC RECORD SUMMARY:
- Student Name: ${cleanName}
- Registration Number: ${cleanRegNo}
- Current CGPA: ${formattedCgpa}
- Total Pending Backlogs: ${numBacklogs}
- Completed Semesters: ${completedSemesters}
- Remaining Semesters: ${remainingSemesters}

BACKLOG STATUS:
You currently have ${numBacklogs} pending backlog(s).

PENDING SUBJECTS:
${subjectsListText || "  - No active backlogs recorded."}

PORTAL LINK:
View your live results and complete semester history at:
${studentPortalUrl}

NOTICE FOR STUDENTS:
If you have already cleared any of the subjects listed above but your updated marksheet has not yet reflected on GradeFlow, please contact the developer or support team with your registration number.

WHATSAPP SUPPORT:
Contact Developer on WhatsApp: ${waUrl}

"Your backlog is not your final result. Clear it, learn from it, and keep moving forward."

Regards,
GradeFlow Team
${baseUrl}
`;
}

module.exports = {
  generateBacklogEmailHtml,
  generateBacklogEmailText,
};
