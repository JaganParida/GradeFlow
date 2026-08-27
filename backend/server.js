require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.set("trust proxy", 1);

// Set security HTTP headers with explicit Content Security Policy & HSTS
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.FRONTEND_URL || "https://grade-flow-navy.vercel.app"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Enable CORS with credentials support — whitelist allowed origins and Vercel domains
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://grade-flow-navy.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, "");
    if (
      ALLOWED_ORIGINS.includes(cleanOrigin) ||
      /^https:\/\/grade-flow[a-z0-9\-_]*\.vercel\.app$/i.test(cleanOrigin)
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-requested-with", "x-csrf-token"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Sanitize data to prevent NoSQL Injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// ─── CSRF & Cache Protection for Administrative Endpoints ──────────────────
const { csrfProtect } = require("./middleware/csrf");

// Enforce no-cache on sensitive administrative responses
app.use(["/api/admin", "/api/auth/admin", "/api/auth/subadmin"], (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ─── Rate Limiting Strategy ────────────────────────────────────────────────
const { authLimiter, publicLimiter, adminLimiter } = require("./middleware/rateLimiters");
const errorHandler = require("./middleware/errorHandler");
const {
  syncMaintenanceState,
  getMaintenanceState,
  maintenanceMiddleware,
} = require("./middleware/maintenance");

// ─── Public System Maintenance Check Endpoint (No-cache, Fast) ─────────────
app.get("/api/system/maintenance", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  try {
    const state = await getMaintenanceState();
    res.json({
      success: true,
      enabled: Boolean(state.enabled),
      message: state.message || "",
      enabledAt: state.enabledAt,
    });
  } catch (err) {
    res.json({ success: true, enabled: false });
  }
});

// Enforce Global Maintenance Mode for student/public routes (Main Admin is automatically bypassed)
app.use(maintenanceMiddleware);

// Routes with Endpoint-Specific Configurable Rate Limiters
app.use("/api/auth", authLimiter, csrfProtect, require("./routes/auth"));
app.use(["/api/student", "/api/students"], publicLimiter, require("./routes/student"));
app.use("/api/admin/subadmins", adminLimiter, csrfProtect, require("./routes/subAdminRoutes"));
app.use("/api/admin", adminLimiter, csrfProtect, require("./routes/admin"));
app.use("/api/rankings", publicLimiter, require("./routes/rankings"));
app.use("/api/feedback", publicLimiter, require("./routes/feedback"));
app.use("/api/timetable", publicLimiter, require("./routes/timetable"));

// ─── Attendance OCR Endpoint ───────────────────────────────────
app.post("/api/attendance/ocr", publicLimiter, async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: "imageBase64 is required" });
    }

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
        error: lastError || "All Gemini models failed to process image.",
        subjects: [],
      });
    }

    res.json({
      success: false,
      engine: "no_api_key",
      error: "GEMINI_API_KEY environment variable is not configured.",
      subjects: [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Health Check Endpoint ──────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    name: "GradeFlow API",
    dbStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Centralized Error Handling Middleware (Prevents info leakage)
app.use(errorHandler);

const http = require("http");
const server = http.createServer(app);

// Seed or update admin on first run
async function seedAdmin() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not configured in environment.");
    return;
  }
  const Admin = require("./models/Admin");
  const exists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (!exists) {
    await Admin.create({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    console.log("✅ Admin account initialized securely.");
  } else {
    // Ensure the password stays in sync with the .env file
    exists.password = process.env.ADMIN_PASSWORD;
    await exists.save();
    console.log("✅ Admin credentials synchronized with environment.");
  }
}

const { purgeExpiredBatches } = require("./utils/batchLifecycle");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    await syncMaintenanceState();
    await seedAdmin();

    // ─── 5-Year Batch Data Retention Sweep ───────────────────────────
    try {
      await purgeExpiredBatches();
    } catch (e) {
      console.error("Initial batch purge sweep failed:", e);
    }
    // Schedule daily purge sweep (every 24 hours)
    setInterval(() => {
      purgeExpiredBatches().catch((e) => console.error("Scheduled batch purge sweep failed:", e));
    }, 24 * 60 * 60 * 1000);

    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  });
