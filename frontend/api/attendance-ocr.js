const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with",
};

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ message: "imageBase64 is required." });
    }

    // Clean base64 data
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (GEMINI_API_KEY) {
      const model = "gemini-2.5-pro";
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
              engine: "gemini_2.5_pro",
              modelUsed: model,
              rowsCount: rawRows.length,
              subjectsCount: formattedSubjects.length,
              subjects: formattedSubjects,
            });
          }
        } else {
          const errData = await response.text();
          console.warn(`Gemini 2.5 Pro API returned error (${response.status}):`, errData);
        }
      } catch (geminiErr) {
        console.warn(`Gemini 2.5 Pro invocation error:`, geminiErr.message);
      }
    }

    // Fallback response allowing client to run local OCR extraction
    return res.json({
      success: true,
      engine: "client_fallback",
      message: "Please proceed with client-side OCR parsing or manual adjustment.",
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
