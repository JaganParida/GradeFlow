const connectToDatabase = require("./_lib/db");
const jwt = require("jsonwebtoken");
const StudentSession = require("./_lib/models/StudentSession");
const AdminSession = require("./_lib/models/AdminSession");
const SubAdminSession = require("./_lib/models/SubAdminSession");
const { isSessionValid, isAdminSessionValid } = require("./_lib/sessionManager");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with, Cookie, x-student-token, x-admin-token",
};

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name] = rest.join("=");
  });
  return cookies;
}

async function authenticateCaller(req) {
  const cookies = parseCookies(req.headers.cookie);
  let studentToken = req.headers["x-student-token"] || cookies.student_jwt;
  let adminToken = req.headers["x-admin-token"] || cookies.jwt;

  if (!studentToken && !adminToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    const bearer = req.headers.authorization.split(" ")[1];
    studentToken = bearer;
  }

  if ((!studentToken || studentToken === "none") && (!adminToken || adminToken === "none")) {
    return {
      error: {
        status: 401,
        message: "Authentication required to use the Attendance OCR Scanner.",
        code: "AUTH_REQUIRED",
      },
    };
  }

  // 1. Authenticate Student
  if (studentToken && studentToken !== "none") {
    try {
      const decoded = jwt.verify(studentToken, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      if (decoded.role === "student" && decoded.regNo && decoded.sessionId) {
        await connectToDatabase();
        const session = await StudentSession.findOne({ sessionId: decoded.sessionId, isActive: true });
        if (session && isSessionValid(session)) {
          return { caller: { type: "student", regNo: decoded.regNo } };
        }
      }
    } catch {}
  }

  // 2. Authenticate Admin or Sub-Admin
  if (adminToken && adminToken !== "none") {
    try {
      const decoded = jwt.verify(adminToken, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      await connectToDatabase();
      if (decoded.adminType === "subadmin") {
        if (decoded.sessionId) {
          const session = await SubAdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
          if (session) return { caller: { type: "subadmin" } };
        }
      } else {
        if (decoded.sessionId) {
          const session = await AdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
          if (session && isAdminSessionValid(session)) {
            return { caller: { type: "admin" } };
          }
        }
      }
    } catch {}
  }

  return {
    error: {
      status: 401,
      message: "Authentication required to use the Attendance OCR Scanner.",
      code: "AUTH_REQUIRED",
    },
  };
}

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Enforce Caller Authentication (Rejects unauthenticated in <1ms without DB hit)
    const authResult = await authenticateCaller(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({
        success: false,
        message: authResult.error.message,
        code: authResult.error.code,
      });
    }

    const { imageBase64, mimeType = "image/jpeg" } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ message: "imageBase64 is required." });
    }

    // Payload Size Limit: 7MB base64 string corresponds to ~5MB binary image.
    const MAX_BASE64_LENGTH = 7 * 1024 * 1024;
    if (typeof imageBase64 !== "string" || imageBase64.length > MAX_BASE64_LENGTH) {
      return res.status(413).json({
        success: false,
        message: "Image payload exceeds maximum permitted size (5MB). Please upload a compressed image.",
        code: "PAYLOAD_TOO_LARGE",
      });
    }

    // Clean base64 data
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (GEMINI_API_KEY) {
      const modelsToTry = [
        "gemini-3.6-flash",
        "gemini-flash-latest",
        "gemini-3.1-pro-preview",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
      ];

      let lastError = null;

      for (const model of modelsToTry) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": GEMINI_API_KEY,
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `You are an expert Document AI OCR engine for university student ERP attendance portals.
Read the uploaded ERP screenshot only. Do not infer information from prior screenshots. Do not use external knowledge. Do not complete or guess missing text.

Extract EVERY physical ERP component row/card visible in the screenshot.
The fundamental unit is: ONE PHYSICAL ERP COMPONENT ROW = ONE COMPONENT RECORD.

SUPPORTED LAYOUTS:
1. WEBSITE ERP TABLE:
   - Columns: "Sr.No" | "Course Name" | "Course Short Name" | "Course Code" | "Attended/Delivered" | "Percent"
   - Course Short Name contains the component: "PP" (Theory/Practice), "PR" (Practical/Lab), "TUT" (Tutorial/Project).
   - Extract every physical table row as its own record.

2. MOBILE ERP CARDS:
   - Subject Card Header (Subject Title + Course Code) and sub-component lines (PP, PR, TUT).
   - Extract each component line as its own record with its parent card subject name and course code.

STRICT RULES:
- Preserve exact subject names and course codes. Keep legitimate parenthetical tokens (e.g. "(CISCO)").
- Preserve PP, PR, and TUT separately.
- Extract the exact integer attended and delivered session counts.
- If attended/delivered is "0/0", attended is 0 and delivered is 0, and percent is 0.0.
- Do NOT merge rows before outputting. Output every physical row.

OUTPUT FORMAT (JSON Schema):
{
  "erpFormat": "website" or "mobile",
  "rows": [
    {
      "courseName": "Full Course Title as visible in image",
      "courseCode": "Course Code e.g. CUTM1020, CUCS1007",
      "component": "PP" | "PR" | "TUT",
      "attended": 0,
      "delivered": 0,
      "percent": 0.0
    }
  ]
}`,
                      },
                      {
                        inline_data: {
                          mime_type: mimeType || "image/jpeg",
                          data: cleanBase64,
                        },
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.0,
                  response_mime_type: "application/json",
                },
              }),
            }
          );

          if (response.ok) {
            const result = await response.json();
            const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            let parsedData = { rows: [] };
            try {
              parsedData = JSON.parse(rawText.replace(/```json/g, "").replace(/```/g, "").trim());
            } catch {
              const jsonMatch = rawText.match(/\{[\s\S]*\}/);
              if (jsonMatch) parsedData = JSON.parse(jsonMatch[0]);
            }

            const rawRows = Array.isArray(parsedData.rows)
              ? parsedData.rows
              : Array.isArray(parsedData)
              ? parsedData
              : [];

            if (rawRows.length > 0) {
              // Group physical component rows into subjects by Course Code / Course Name
              const subjectsMap = new Map();

              rawRows.forEach((row, idx) => {
                if (!row) return;
                const name = String(row.courseName || row.name || "").trim();
                const code = String(row.courseCode || row.code || "").trim();
                const compType = String(row.component || row.type || "PP").toUpperCase();
                const attended = Math.max(0, parseInt(row.attended, 10) || 0);
                const delivered = Math.max(0, parseInt(row.delivered !== undefined ? row.delivered : row.total, 10) || 0);

                const key = code || name || `sub_${idx}`;

                if (!subjectsMap.has(key)) {
                  subjectsMap.set(key, {
                    id: `ocr_sub_${Date.now()}_${idx}`,
                    name: name || code || "Subject",
                    code: code,
                    components: [],
                  });
                }

                const sub = subjectsMap.get(key);
                if (!sub.code && code) sub.code = code;
                if ((!sub.name || sub.name === sub.code) && name) sub.name = name;

                let comp = sub.components.find((c) => c.type === compType);
                if (!comp) {
                  comp = { type: compType, attended: 0, delivered: 0, percentage: 0 };
                  sub.components.push(comp);
                }
                comp.attended = attended;
                comp.delivered = delivered;
                comp.percentage = delivered > 0 ? parseFloat(((attended / delivered) * 100).toFixed(1)) : 0;
              });

              const formattedSubjects = Array.from(subjectsMap.values()).map((sub, idx) => {
                const totalAtt = sub.components.reduce((acc, c) => acc + c.attended, 0);
                const totalDel = sub.components.reduce((acc, c) => acc + c.delivered, 0);
                const pct = totalDel > 0 ? parseFloat(((totalAtt / totalDel) * 100).toFixed(1)) : 0;

                return {
                  id: sub.id || `ocr_sub_${Date.now()}_${idx}`,
                  name: sub.name,
                  code: sub.code,
                  attendedClasses: totalAtt,
                  totalClasses: totalDel,
                  percentage: pct,
                  components: sub.components,
                };
              });

              return res.json({
                success: true,
                engine: "gemini_vision",
                modelUsed: model,
                rowsCount: rawRows.length,
                subjectsCount: formattedSubjects.length,
                subjects: formattedSubjects,
              });
            }
          } else {
            const errData = await response.text();
            lastError = `Gemini API returned HTTP ${response.status} with model ${model}: ${errData.substring(0, 300)}`;
            console.warn(lastError);
            if (response.status === 401 || response.status === 403) {
              // Invalid API key — don't keep trying other models with a known bad key
              return res.json({
                success: false,
                engine: "gemini_auth_error",
                error: `Gemini API Authentication Failed (${response.status}). The provided GEMINI_API_KEY is invalid. Please check your Google AI Studio API Key (starts with AIzaSy...).`,
                subjects: [],
              });
            }
          }
        } catch (geminiErr) {
          lastError = `Gemini invocation error with model ${model}: ${geminiErr.message}`;
          console.warn(lastError);
        }
      }

      return res.json({
        success: false,
        engine: "gemini_error",
        error: lastError || "All Gemini vision models failed to process the image.",
        subjects: [],
      });
    }

    return res.json({
      success: false,
      engine: "no_api_key",
      error: "GEMINI_API_KEY is not configured in Vercel Environment Variables.",
      subjects: [],
    });
  } catch (err) {
    console.error("Attendance OCR error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to process attendance image: " + err.message,
    });
  }
};
