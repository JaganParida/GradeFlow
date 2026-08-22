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

// ─── Rate Limiting Strategy ────────────────────────────────────────────────
const { authLimiter, publicLimiter, adminLimiter } = require("./middleware/rateLimiters");
const errorHandler = require("./middleware/errorHandler");

// Routes with Endpoint-Specific Configurable Rate Limiters
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use(["/api/student", "/api/students"], publicLimiter, require("./routes/student"));
app.use("/api/admin", adminLimiter, require("./routes/admin"));
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
                      text: `Extract all academic course attendance data from this CUTM ERP screenshot.
SUPPORTED FORMATS:
1. Website ERP table with columns: "Sr.No", "Course Name", "Course Short Name", "Course Code", "Attended/Delivered", "Percent". Extract components (PP, PR, TUT) from "Course Short Name" (e.g. CUTM1020 - PP) and group all rows for the same course.
2. Mobile ERP card format with subject title and component sub-lines (PP, PR, TUT).

Return ONLY a JSON array of objects:
[
  {
    "name": "Robotic Automation with ROS and C++",
    "code": "CUTM1020",
    "components": [
      { "type": "PP", "attended": 6, "delivered": 7 },
      { "type": "PR", "attended": 23, "delivered": 25 },
      { "type": "TUT", "attended": 3, "delivered": 3 }
    ],
    "attended": 32,
    "total": 35,
    "percentage": 91.4
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
              const pct = totalDel > 0 ? parseFloat(((totalAtt / totalDel) * 100).toFixed(1)) : 100;

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
              subjects: formattedSubjects,
            });
          }
        }
      } catch (geminiErr) {
        console.warn("Backend Gemini Vision warning:", geminiErr.message);
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
