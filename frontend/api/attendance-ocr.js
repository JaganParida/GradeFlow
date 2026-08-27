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
      const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
      ];

      for (const model of modelsToTry) {
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
                        text: `You are an expert OCR and Document AI parser for university student attendance portals (CUTM ERP, TCS iON, Web ERP, Mobile ERP).
Accurately extract all academic course attendance records from this screenshot.

SUPPORTED UNIVERSITY ERP FORMATS:
1. CUTM WEBSITE ERP TABLE FORMAT:
   - The screenshot shows a full tabular matrix with columns:
     "Sr.No" | "Course Name" | "Course Short Name" | "Course Code" | "Attended/Delivered" | "Percent"
   - Every single row in the table represents an academic course component.
   - Look at "Course Short Name" to identify the component type:
     - Contains "- PP" or "PP" -> type: "PP" (Theory/Practice)
     - Contains "- PR" or "PR" -> type: "PR" (Practical/Lab)
     - Contains "- TUT" or "TUT" -> type: "TUT" (Tutorial)
   - Look at "Attended/Delivered" (e.g. inside rounded pills like "3/6", "26/28", "5/6", "0/0", "16/20", "12/12", "12/14", "8/10", "6/7", "22/30", "12/16", "16/18", "8/8", "6/8"):
     - The first integer before the slash is 'attended'.
     - The second integer after the slash is 'delivered'.
   - GROUPING RULE: Group all component rows that share the same "Course Code" (e.g. CUTM1020, CUCS1007, CUTM3166) or same "Course Name" into a SINGLE subject object with all its components inside the "components" array!

2. CUTM MOBILE ERP CARD FORMAT:
   - Each card has a subject title with code in parentheses (e.g. "ROBOTIC AUTOMATION WITH ROS AND C++ (CUTM1020)") and sub-lines with components "(PP) 3/6", "(PR) 26/28", "(TUT) 5/6".

OUTPUT FORMAT:
Return ONLY a valid JSON array of objects for each unique course (no markdown, no preamble):
[
  {
    "name": "ROBOTIC AUTOMATION WITH ROS AND C++",
    "code": "CUTM1020",
    "components": [
      { "type": "PP", "attended": 3, "delivered": 6 },
      { "type": "PR", "attended": 26, "delivered": 28 },
      { "type": "TUT", "attended": 5, "delivered": 6 }
    ],
    "attended": 34,
    "total": 40,
    "percentage": 85.0
  }
]`,
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
                  temperature: 0.1,
                  response_mime_type: "application/json",
                },
              }),
            }
          );

          if (response.ok) {
            const result = await response.json();
            const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
            let parsedData = [];
            try {
              parsedData = JSON.parse(rawText.replace(/```json/g, "").replace(/```/g, "").trim());
            } catch {
              const jsonMatch = rawText.match(/\[[\s\S]*\]/);
              if (jsonMatch) parsedData = JSON.parse(jsonMatch[0]);
            }

            if (Array.isArray(parsedData) && parsedData.length > 0) {
              const formattedSubjects = parsedData.map((s, idx) => {
                const comps = Array.isArray(s.components) && s.components.length > 0
                  ? s.components.map((c) => ({
                      type: String(c.type || "PP").toUpperCase(),
                      attended: Math.max(0, parseInt(c.attended, 10) || 0),
                      delivered: Math.max(0, parseInt(c.delivered || c.total, 10) || 0),
                    }))
                  : [
                      {
                        type: "PP",
                        attended: Math.max(0, parseInt(s.attended, 10) || 0),
                        delivered: Math.max(0, parseInt(s.total, 10) || 0),
                      },
                    ];

                const totalAtt = comps.reduce((acc, c) => acc + (Number(c.attended) || 0), 0);
                const totalDel = comps.reduce((acc, c) => acc + (Number(c.delivered) || 0), 0);
                const calculatedPct = totalDel > 0 ? parseFloat(((totalAtt / totalDel) * 100).toFixed(1)) : 100;
                const pct = typeof s.percentage === "number" ? parseFloat(s.percentage.toFixed(1)) : calculatedPct;

                return {
                  id: `ocr_sub_${Date.now()}_${idx}`,
                  name: String(s.name || `Subject ${idx + 1}`).trim(),
                  code: String(s.code || "").trim(),
                  attendedClasses: totalAtt,
                  totalClasses: totalDel,
                  percentage: pct,
                  components: comps,
                };
              });

              return res.json({
                success: true,
                engine: "gemini_vision",
                modelUsed: model,
                subjectsCount: formattedSubjects.length,
                subjects: formattedSubjects,
              });
            }
          }
        } catch (geminiErr) {
          console.warn(`Gemini Vision OCR Error with model ${model}:`, geminiErr.message);
        }
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
