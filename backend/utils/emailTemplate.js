/**
 * GradeFlow Professional Backlog Notification Email Generator
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
  developerWhatsapp = "919876543210",
  frontendUrl = "https://gradeflow.vercel.app",
}) {
  const cleanRegNo = String(regNo || "").trim();
  const cleanName = String(studentName || "Student").trim();
  const formattedCgpa = typeof cgpa === "number" ? cgpa.toFixed(2) : cgpa || "0.00";
  const numBacklogs = Number(totalBacklogs) || backlogSubjects.length || 0;
  const backlogsText = numBacklogs === 1 ? "1 pending backlog" : `${numBacklogs} pending backlogs`;

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

  // Generate semester breakdown text for summary
  const semesterSummaryLines = sortedSemesters.map(
    (sem) => `Semester ${sem}: ${semGrouped[sem].length} ${semGrouped[sem].length === 1 ? "Backlog" : "Backlogs"}`
  );

  // Dynamic progress message based on remaining semesters
  let progressMessage = "";
  if (remainingSemesters <= 1) {
    progressMessage = `You are currently in <strong>Semester ${latestSemester}</strong>, with <strong>${remainingSemesters === 1 ? "1 semester" : "no semesters"} remaining</strong>. This is a critical stage of your academic journey. We strongly encourage you to clear your pending subjects as soon as possible so that your academic record can be updated successfully before graduation.`;
  } else {
    progressMessage = `You currently have <strong>${remainingSemesters} semesters remaining</strong>. Use this time wisely to clear your pending subjects and keep your academic progress on track.`;
  }

  // Pre-filled WhatsApp message
  const waRawMessage = `Hello GradeFlow Developer, I am ${cleanName} with Registration Number ${cleanRegNo}. My backlog/result information needs to be updated. Please help me verify my academic record.`;
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waRawMessage)}`;

  // Generate semester tables HTML
  const semesterTablesHtml = sortedSemesters
    .map((sem) => {
      const subs = semGrouped[sem];
      const rows = subs
        .map(
          (s) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; font-family: monospace; font-size: 13px; color: #475569; font-weight: 600;">${s.subCode || "N/A"}</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #1e293b; font-weight: 500;">${s.subName || "Subject"}</td>
            <td style="padding: 10px 14px; font-size: 12px; text-align: right;">
              <span style="background-color: #fee2e2; color: #dc2626; padding: 4px 10px; border-radius: 9999px; font-weight: 700; display: inline-block;">Pending (${s.grade || "F"})</span>
            </td>
          </tr>`
        )
        .join("");

      return `
        <div style="margin-bottom: 20px;">
          <div style="background-color: #f1f5f9; padding: 8px 14px; border-left: 4px solid #ef4444; border-radius: 4px; font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 8px;">
            Semester ${sem}
          </div>
          <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f8fafc; text-align: left; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 10px 14px; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Subject Code</th>
                <th style="padding: 10px 14px; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Subject Name</th>
                <th style="padding: 10px 14px; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GradeFlow | Backlog Academic Notification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f6f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 620px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner with GradeFlow Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 28px; text-align: center;">
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <!-- Logo Icon Badge -->
                    <div style="width: 44px; height: 44px; background-color: #ffffff; border-radius: 12px; display: inline-block; text-align: center; line-height: 44px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -2px;">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                      </svg>
                    </div>
                  </td>
                  <td style="vertical-align: middle; text-align: left;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-weight: 800; font-size: 24px; color: #ffffff; letter-spacing: -0.5px; display: block;">GradeFlow</span>
                    <span style="font-size: 11px; color: #94a3b8; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600;">Academic Analytics Portal</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px; color: #334155; font-size: 15px; line-height: 1.6;">

              <p style="margin-top: 0; font-size: 16px; color: #0f172a; font-weight: 600;">Dear ${cleanName},</p>
              
              <p style="margin-bottom: 24px;">This is an official academic notification from GradeFlow regarding your current academic progress and pending backlogs.</p>

              <!-- Academic Summary Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <div style="font-weight: 700; font-size: 15px; color: #0f172a; margin-bottom: 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                  <span>📋 Academic Summary</span>
                  <span style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Official Record</span>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500; width: 48%;">Student Name</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${cleanName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Registration No.</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace; text-align: right;">${cleanRegNo}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Current CGPA</td>
                    <td style="padding: 6px 0; color: #2563eb; font-weight: 800; font-size: 15px; text-align: right;">${formattedCgpa}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Total Backlogs</td>
                    <td style="padding: 6px 0; color: #dc2626; font-weight: 800; text-align: right;">${numBacklogs}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Completed Semesters</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${completedSemesters}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Remaining Semesters</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${remainingSemesters}</td>
                  </tr>
                </table>
              </div>

              <!-- Total Backlog Highlight Box -->
              <div style="background-color: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px; padding: 18px 20px; text-align: center; margin-bottom: 28px;">
                <div style="color: #991b1b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">⚠️ Backlog Status Alert</div>
                <div style="color: #dc2626; font-size: 20px; font-weight: 800;">
                  You currently have <span style="text-decoration: underline;">${backlogsText}</span>.
                </div>
              </div>

              <!-- Semester-Wise Backlog Details -->
              <div style="margin-bottom: 24px;">
                <div style="font-weight: 700; font-size: 16px; color: #0f172a; margin-bottom: 14px;">
                  📚 Semester-Wise Backlog Breakdown
                </div>
                ${semesterTablesHtml}
              </div>

              <!-- Backlog Summary Box -->
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #92400e;">
                <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #78350f;">📌 Backlog Quick Summary</div>
                <div style="margin-bottom: 4px;">• <strong>Total Pending Backlogs:</strong> ${numBacklogs}</div>
                <div style="margin-bottom: 6px;">• <strong>Semesters With Backlogs:</strong> ${sortedSemesters.length}</div>
                <div style="padding-left: 12px; border-left: 2px solid #f59e0b; color: #78350f; font-weight: 500; margin-top: 6px;">
                  ${semesterSummaryLines.join(" | ")}
                </div>
              </div>

              <!-- Academic Progress Advice -->
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #0369a1; line-height: 1.6;">
                <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #075985;">🎓 Academic Progress Advice</div>
                ${progressMessage}
              </div>

              <!-- Important Action Message -->
              <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 28px; background-color: #ffffff;">
                <div style="font-weight: 700; font-size: 14px; color: #dc2626; margin-bottom: 6px;">⚠️ Important Note</div>
                <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                  Please do not ignore this notification. If you have already cleared any of the subjects listed above but your result has not yet been updated on GradeFlow, please contact the developer/GradeFlow support team so that your academic record can be reviewed and updated.
                </p>
              </div>

              <!-- Developer Contact / WhatsApp Button Section -->
              <div style="text-align: center; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px 20px; margin-bottom: 28px;">
                <div style="font-weight: 700; font-size: 15px; color: #0f172a; margin-bottom: 6px;">Need to update your result?</div>
                <p style="font-size: 13px; color: #64748b; margin-top: 0; margin-bottom: 18px; max-width: 440px; margin-left: auto; margin-right: auto;">
                  If you have already cleared a backlog but it is still showing as pending on GradeFlow, please contact the developer/support team with your Registration Number and relevant result details.
                </p>
                
                <a href="${waUrl}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 30px; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);">
                  <table role="presentation" style="margin: 0 auto; display: inline-table;">
                    <tr>
                      <td style="vertical-align: middle; padding-right: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" style="vertical-align: middle;">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.019 4.142-1.087z"/>
                        </svg>
                      </td>
                      <td style="vertical-align: middle;">Contact Developer on WhatsApp</td>
                    </tr>
                  </table>
                </a>
              </div>

              <!-- Motivational Quote -->
              <div style="text-align: center; font-style: italic; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-bottom: 20px;">
                "Your backlog is not your final result. Clear it, learn from it, and keep moving forward."
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              <div style="font-weight: 700; color: #64748b; font-size: 13px; margin-bottom: 4px;">Regards,<br><span style="color: #0f172a;">GradeFlow Team</span></div>
              <div style="margin-bottom: 12px; color: #64748b; font-size: 11px;">Academic Progress & Result Management System</div>
              <div style="font-size: 11px; color: #94a3b8; max-width: 480px; margin: 0 auto;">
                This is an automated academic notification generated by GradeFlow.<br>Please do not reply directly to this email.
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

module.exports = {
  generateBacklogEmailHtml,
};
