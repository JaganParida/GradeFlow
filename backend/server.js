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

// Enable CORS with credentials support — whitelist allowed origins (No open *.vercel.app wildcards)
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://grade-flow-navy.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

const VERCEL_PREVIEW_PREFIX = process.env.VERCEL_PROJECT_PREFIX || "";

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (
      VERCEL_PREVIEW_PREFIX &&
      origin.startsWith(`https://${VERCEL_PREVIEW_PREFIX}`) &&
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

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
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
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
                        text: `You are an expert Document AI OCR parser for university student ERP attendance portals (Centurion University CUTM ERP, TCS iON, Web ERP, Mobile ERP).
Extract ALL course attendance records exactly as visible in the screenshot.

SUPPORTED ERP LAYOUTS:
1. WEBSITE ERP TABLE:
   - Table columns: "Sr.No" | "Course Name" | "Course Short Name" | "Course Code" | "Attended/Delivered" | "Percent"
   - Identify component type from "Course Short Name" or column headers:
     - "- PP" or "PP" -> type: "PP" (Theory/Practice)
     - "- PR" or "PR" -> type: "PR" (Practical/Lab)
     - "- TUT" or "TUT" -> type: "TUT" (Tutorial/Project)
   - Extract attended/delivered integer fraction "A/D" (e.g. "3/6", "26/28", "0/0", "16/20", "12/14", "8/10", "6/7", "22/30", "12/16", "16/18", "6/8").
   - If attended/delivered is "0/0", attended is 0 and delivered is 0.
   - GROUPING: Group all component rows sharing the same Course Code or Course Name into a SINGLE object with its "components" array.

2. MOBILE ERP CARD FORMAT:
   - Cards with Subject Title, Course Code in parentheses e.g. "ROBOTIC AUTOMATION WITH ROS AND C++ (CUTM1020)" and sub-lines with components "(PP) 3/6", "(PR) 26/28", "(TUT) 5/6".

STRICT EXTRACTION RULES:
- Extract ONLY what is visible in the provided image. Do NOT invent, assume, or guess subjects or numbers.
- Compute total attended as the sum of all component attended classes.
- Compute total delivered as the sum of all component delivered classes.
- If total delivered is 0, percentage is 0.0.

OUTPUT FORMAT:
Return ONLY a valid JSON array of course objects (no markdown, no preamble):
[
  {
    "name": "Course Title",
    "code": "COURSE_CODE",
    "components": [
      { "type": "PP", "attended": 0, "delivered": 0 }
    ],
    "attended": 0,
    "total": 0,
    "percentage": 0.0
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
                  temperature: 0.0,
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
                      delivered: Math.max(0, parseInt(c.delivered !== undefined ? c.delivered : c.total, 10) || 0),
                    }))
                  : [
                      {
                        type: "PP",
                        attended: Math.max(0, parseInt(s.attended, 10) || 0),
                        delivered: Math.max(0, parseInt(s.delivered !== undefined ? s.delivered : s.total, 10) || 0),
                      },
                    ];

                const totalAtt = comps.reduce((acc, c) => acc + (Number(c.attended) || 0), 0);
                const totalDel = comps.reduce((acc, c) => acc + (Number(c.delivered) || 0), 0);
                const calculatedPct = totalDel > 0 ? parseFloat(((totalAtt / totalDel) * 100).toFixed(1)) : 0;
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
                subjects: formattedSubjects,
              });
            }
          }
        } catch (geminiErr) {
          console.warn(`Backend Gemini Vision warning with model ${model}:`, geminiErr.message);
        }
      }
    }

    res.json({
      success: true,
      engine: "client_fallback",
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
