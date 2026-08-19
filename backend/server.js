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
  const Admin = require("./models/Admin");
  const exists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (!exists) {
    await Admin.create({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    console.log("✅ Admin seeded:", process.env.ADMIN_EMAIL);
  } else {
    // Ensure the password stays in sync with the .env file
    exists.password = process.env.ADMIN_PASSWORD;
    await exists.save();
    console.log("✅ Admin credentials synced with .env");
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
