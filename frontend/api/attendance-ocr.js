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
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an expert OCR parser for university student attendance portals (CUTM ERP, TCS iON, Web & Mobile Apps).
Extract all academic course attendance data from this screenshot.

SUPPORTED UNIVERSITY ERP FORMATS:
1. CUTM WEBSITE ERP TABLE FORMAT:
   - Columns: "Sr.No", "Course Name", "Course Short Name", "Course Code", "Attended/Delivered", "Percent"
   - In "Course Short Name", the component type is attached to the code (e.g. "CUTM1020 - PP", "CUTM1020 - PR", "CUTM1020 - TUT", "CUCS1007 - PP", "CUTM3166 - PR").
   - Extract component types: "PP" (Theory), "PR" (Practical/Practice/Lab), "TUT" (Tutorial).
   - Group all component rows belonging to the same Course Name / Course Code under that subject!

2. CUTM MOBILE ERP CARD FORMAT:
   - Each subject card has a main title with a code, e.g. "ROBOTIC AUTOMATION WITH ROS AND C++ (CUTM1020)" and contains sub-component rows like "(PP) 2/5", "(PR) 18/22", "(TUT) 3/6".

OUTPUT FORMAT:
Return ONLY a valid JSON array of objects for each unique course:
[
  {
    "name": "Robotic Automation with ROS and C++",
    "code": "CUTM1020",
    "components": [
      { "type": "PP", "attended": 2, "delivered": 5 },
      { "type": "PR", "attended": 18, "delivered": 22 },
      { "type": "TUT", "attended": 3, "delivered": 6 }
    ],
    "attended": 23,
    "total": 33,
    "percentage": 69.7
  }
]
Do not include markdown ticks, preamble, or explanation.`,
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
              subjectsCount: formattedSubjects.length,
              subjects: formattedSubjects,
            });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini Vision OCR Error, using fallback parser:", geminiErr);
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
