/**
 * Attendance Setup Reminder Email Template
 * Clean, lightweight, professional layout styled identically to the GradeFlow OTP / Institutional template.
 * No bulky nested boxes. Relatable Hinglish opening hook + concise, crystal-clear English breakdown of all 7 sections.
 */

function generateAttendanceReminderEmailHtml({
  studentName = "Student",
  regNo = "",
  batch = "2023",
  branch = "CSE",
  section = "",
  frontendUrl = "https://grade-flow-six.vercel.app/",
  developerWhatsapp = "919124540575",
}) {
  const cleanRegNo = String(regNo || "").trim();
  const cleanName = String(studentName || "Student").trim();
  const baseUrl = String(frontendUrl || "https://grade-flow-six.vercel.app/").replace(/\/$/, "");
  
  const attendanceUrl = "https://grade-flow-six.vercel.app/";
  const pdfGuideUrl = `${baseUrl}/GradeFlow_Attendance_Setup_Guide.pdf`;
  
  const waCleanPhone = String(developerWhatsapp || "").replace(/[^0-9]/g, "");
  const waMsg = `Hi Developer, I am ${cleanName} (${cleanRegNo}). I have a query regarding GradeFlow Attendance Setup.`;
  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waMsg)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup Your GradeFlow Attendance</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202124; }
    a { color: #1a73e8; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 24px 16px !important; }
      .btn-cta { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 36px 16px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202124; -webkit-font-smoothing: antialiased; line-height: 1.6;">

  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper" style="max-width: 540px; margin: 0 auto; text-align: left;">
    
    <!-- Brand Header (Identical to OTP Verification Template) -->
    <tr>
      <td style="padding-bottom: 20px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <div style="font-size: 22px; font-weight: 700; color: #1a73e8; letter-spacing: -0.5px;">GradeFlow</div>
              <div style="font-size: 12px; color: #5f6368; margin-top: 3px;">
                Centurion University of Technology and Management &bull; Batch ${batch} (${branch})
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Divider Line -->
    <tr>
      <td style="border-top: 1px solid #dadce0; padding-top: 24px;">

        <!-- Greeting -->
        <div style="font-size: 14px; color: #5f6368; margin-bottom: 6px;">
          Hi <strong>${cleanName}</strong> ${cleanRegNo ? `(${cleanRegNo})` : ""},
        </div>

        <div style="font-size: 20px; font-weight: 600; color: #202124; line-height: 1.35; margin-bottom: 18px; letter-spacing: -0.3px;">
          Tumne abhi tak apna Attendance Tracker setup nahi kiya hai!
        </div>

        <!-- Relatable Hinglish Hook (Clean Editorial Quote block) -->
        <div style="border-left: 3px solid #1a73e8; padding-left: 14px; margin-bottom: 18px; color: #3c4043; font-size: 13.5px; line-height: 1.6;">
          Roz repetitive classes attend karne ka mann nahi karta, ya already <strong>85% – 90%</strong> attendance maintain hai aur check karna chahte ho ki <strong>kitni classes miss karne par bhi 75% safe rahegi</strong>? Ya agar percentage gir gayi hai toh <strong>kitni classes attend karke recover hogi</strong> — GradeFlow isi ke liye bana hai.<br><br>
          <span style="color: #137333; font-weight: 600;">&#10003; 100% Accurate & Timetable Synced:</span> Jyada socho mat, <em>use this for your safety!</em> GradeFlow ka algorithm tumhare official CUTM ERP Timetable ke hisaab se calibrated hai. Koi bhi calculation galat nahi hai.
        </div>

        <!-- Timetable Verification Note / Disclaimer -->
        <div style="background-color: #f8f9fa; border: 1px solid #e8eaed; border-radius: 6px; padding: 12px 14px; margin-bottom: 22px; font-size: 13px; color: #3c4043; line-height: 1.55;">
          <strong>Important Timetable Note:</strong> Agar aapko lag raha hai ki aapka timetable match nahi ho raha hai, toh please GradeFlow ke <em>Class Timetable</em> section me jakar apne official college ERP timetable ke sath ek baar cross-check karke confirm kar lein ki sab kuch correct hai. Agar koi mismatch lagta hai, toh developer ko contact karein taaki aapka section timetable update kiya ja sake.
        </div>

        <div style="font-size: 14px; font-weight: 600; color: #202124; margin: 26px 0 14px 0; letter-spacing: -0.2px;">
          What you get inside GradeFlow Attendance (7 Core Sections):
        </div>

        <!-- 7 Sections Breakdown (Clean, Easy English, Step-by-Step, No Bulky Containers) -->
        
        <!-- Section 1 -->
        <div style="margin-bottom: 18px;">
          <div style="font-size: 14px; font-weight: 600; color: #1a73e8;">
            1. Daily Attendance
          </div>
          <div style="font-size: 13px; color: #3c4043; line-height: 1.5; margin-top: 3px;">
            Your today's class schedule is automatically loaded from your section routine. Mark each lecture as Present, Absent, or Cancelled with a single tap.
          </div>
        </div>

        <!-- Section 2 -->
        <div style="margin-bottom: 18px;">
          <div style="font-size: 14px; font-weight: 600; color: #1a73e8;">
            2. Subject-wise Attendance
          </div>
          <div style="font-size: 13px; color: #3c4043; line-height: 1.5; margin-top: 3px;">
            Complete overview of all registered subjects. See attended vs. delivered classes, subject percentage, and instant alerts if any course drops below 75%.
          </div>
        </div>

        <!-- Section 3 -->
        <div style="margin-bottom: 18px;">
          <div style="font-size: 14px; font-weight: 600; color: #1a73e8;">
            3. Daily Attendance Calculator
          </div>
          <div style="font-size: 13px; color: #3c4043; line-height: 1.5; margin-top: 3px;">
            Shows the exact live impact of today's classes before you attend or skip them. See how today's routine will move your overall semester percentage.
          </div>
        </div>

        <!-- Section 4 -->
        <div style="margin-bottom: 18px;">
          <div style="font-size: 14px; font-weight: 600; color: #1a73e8;">
            4. Edit & What-If Simulator
          </div>
          <div style="font-size: 13px; color: #3c4043; line-height: 1.5; margin-top: 3px;">
            Simulate future scenarios. Test what happens to your percentage if you miss the next 3, 5, or 10 classes, or test how quickly extra attendances restore your margin.
          </div>
        </div>

        <!-- Section 5 -->
        <div style="margin-bottom: 18px;">
          <div style="font-size: 14px; font-weight: 600; color: #1a73e8;">
            5. Target with Schedule
          </div>
          <div style="font-size: 13px; color: #3c4043; line-height: 1.5; margin-top: 3px;">
            Set your desired goal (75%, 80%, or custom). Maps your weekly timetable to show the exact calendar dates and class counts needed to hit your target.
          </div>
        </div>

        <!-- Section 6 -->
        <div style="margin-bottom: 18px;">
          <div style="font-size: 14px; font-weight: 600; color: #1a73e8;">
            6. Miss Impact between Target
          </div>
          <div style="font-size: 13px; color: #3c4043; line-height: 1.5; margin-top: 3px;">
            Calculates the recovery penalty if you unexpectedly miss classes while working toward your target, showing how many additional classes are required to recover.
          </div>
        </div>

        <!-- Section 7 -->
        <div style="margin-bottom: 24px;">
          <div style="font-size: 14px; font-weight: 600; color: #1a73e8;">
            7. Future Predictor
          </div>
          <div style="font-size: 13px; color: #3c4043; line-height: 1.5; margin-top: 3px;">
            Analyzes the full academic calendar and upcoming timetable to calculate total safe bunks remaining and forecast your final semester percentage.
          </div>
        </div>

        <!-- Action Section (Buttons & PDF Guide) -->
        <div style="padding: 20px 0 10px 0; border-top: 1px solid #f1f3f4;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <a href="${attendanceUrl}" class="btn-cta" target="_blank" style="display: inline-block; background-color: #1a73e8; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; text-align: center;">
                  Setup Your Attendance &rarr;
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 12px;">
                <div style="font-size: 13px; color: #5f6368;">
                  Setup guide: <a href="${pdfGuideUrl}" target="_blank" style="color: #1a73e8; font-weight: 500; text-decoration: underline;">Download Step-by-Step Setup Guide (PDF)</a>
                  <div style="font-size: 12px; color: #70757a; margin-top: 4px;">
                    Takes less than 2 minutes: Open the guide, check your subjects, and click Auto-Import.
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </div>

      </td>
    </tr>

    <!-- Footer (Identical to OTP Verification Template) -->
    <tr>
      <td style="border-top: 1px solid #dadce0; padding-top: 20px; margin-top: 24px; font-size: 12px; color: #70757a; line-height: 1.6;">
        <div style="font-weight: 600; color: #3c4043;">All regards by GradeFlow Developer</div>
        <div style="margin-top: 2px;">Centurion University of Technology and Management &bull; GradeFlow Assistant</div>
        <div style="margin-top: 8px;">
          Need help with setup? <a href="${waUrl}" target="_blank" style="color: #1a73e8; text-decoration: none;">Chat with Developer on WhatsApp</a>
        </div>
      </td>
    </tr>

  </table>

</body>
</html>`;
}

function generateAttendanceReminderEmailText({
  studentName = "Student",
  regNo = "",
  frontendUrl = "https://grade-flow-six.vercel.app/",
}) {
  const cleanRegNo = String(regNo || "").trim();
  const cleanName = String(studentName || "Student").trim();
  const baseUrl = String(frontendUrl || "https://grade-flow-six.vercel.app/").replace(/\/$/, "");
  const attendanceUrl = "https://grade-flow-six.vercel.app/";
  const pdfGuideUrl = `${baseUrl}/GradeFlow_Attendance_Setup_Guide.pdf`;

  return `Hi ${cleanName} ${cleanRegNo ? `(${cleanRegNo})` : ""},

Tumne abhi tak apna GradeFlow Attendance Tracker setup nahi kiya hai!

Roz repetitive classes attend karne ka mann nahi karta, ya already 85%-90% attendance maintain hai aur check karna chahte ho ki kitni classes miss karne par bhi 75% safe rahegi? Ya agar percentage gir gayi hai toh kitni classes attend karke recover hogi — GradeFlow isi ke liye bana hai.

✓ 100% Accurate & Timetable Synced: Jyada socho mat, use this for your safety! GradeFlow ka algorithm tumhare official CUTM ERP Timetable ke hisaab se calibrated hai. Koi bhi calculation galat nahi hai.

Important Timetable Note:
Agar aapko lag raha hai ki aapka timetable match nahi ho raha hai, toh please GradeFlow ke 'Class Timetable' section me jakar apne official college ERP timetable ke sath cross-check karke confirm kar lein ki sab kuch correct hai. Agar koi mismatch lagta hai, toh developer ko contact karein taaki aapka section timetable update kiya ja sake.

What you get inside GradeFlow Attendance (7 Core Sections):

1. Daily Attendance:
Your today's class schedule is automatically loaded from your section routine. Mark each lecture as Present, Absent, or Cancelled with a single tap.

2. Subject-wise Attendance:
Complete overview of all registered subjects. See attended vs. delivered classes, subject percentage, and instant alerts if any course drops below 75%.

3. Daily Attendance Calculator:
Shows the exact live impact of today's classes before you attend or skip them. See how today's routine will move your overall semester percentage.

4. Edit & What-If Simulator:
Simulate future scenarios. Test what happens to your percentage if you miss the next 3, 5, or 10 classes, or test how quickly extra attendances restore your margin.

5. Target with Schedule:
Set your desired goal (75%, 80%, or custom). Maps your weekly timetable to show the exact calendar dates and class counts needed to hit your target.

6. Miss Impact between Target:
Calculates the recovery penalty if you unexpectedly miss classes while working toward your target, showing how many additional classes are required to recover.

7. Future Predictor:
Analyzes the full academic calendar and upcoming timetable to calculate total safe bunks remaining and forecast your final semester percentage.

Setup your attendance now:
${attendanceUrl}

Download Step-by-Step Setup Guide (PDF):
${pdfGuideUrl}

All regards by GradeFlow Developer
Centurion University of Technology and Management`;
}

module.exports = {
  generateAttendanceReminderEmailHtml,
  generateAttendanceReminderEmailText,
};
