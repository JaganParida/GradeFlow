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
                      text: `You are an expert OCR parser for university student attendance portals (like CUTM ERP, TCS iON, etc.).
Extract all academic subject attendance data from this screenshot.
For each subject in the table, extract:
- name: The full or clean subject name (e.g., "Database Management Systems", "Computer Networks", "Design and Analysis of Algorithms")
- code: The subject code if visible (e.g., "CUTM1020", "CS301"), or empty string
- attended: Total number of classes attended (integer)
- total: Total number of classes conducted/delivered (integer)
- percentage: The percentage value (float, e.g. 85.5)

Return ONLY a JSON array of objects with the exact structure:
[
  {
    "name": "Database Management Systems",
    "code": "CUTM1020",
    "attended": 28,
    "total": 32,
    "percentage": 87.5
  }
]
Do not include any explanation or markdown formatting other than the json block.`,
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
              const attended = Math.max(0, parseInt(s.attended, 10) || 0);
              const total = Math.max(attended, parseInt(s.total, 10) || attended);
              const calculatedPct = total > 0 ? parseFloat(((attended / total) * 100).toFixed(1)) : 100;
              const pct = typeof s.percentage === "number" ? parseFloat(s.percentage.toFixed(1)) : calculatedPct;

              return {
                id: `ocr_sub_${Date.now()}_${idx}`,
                name: String(s.name || `Subject ${idx + 1}`).trim(),
                code: String(s.code || "").trim(),
                attendedClasses: attended,
                totalClasses: total,
                percentage: pct,
                components: [
                  {
                    name: "Theory / Lab",
                    attended,
                    total,
                  },
                ],
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
