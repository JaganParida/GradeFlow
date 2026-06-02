require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// Middleware
app.set("trust proxy", 1);
app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── Rate Limiting Strategy ────────────────────────────────────────────────
//
// We do NOT apply global rate limiting to student routes because:
//   1. College campuses share a single public IP — so a 500/min limit
//      would block the entire college after a few active students.
//   2. Student data is served from the in-memory cache (15-min TTL),
//      so cached lookups are near-zero cost on the server.
//
// We ONLY apply a strict rate limit to the admin /auth/login endpoint
// to block brute-force password attacks (10 attempts per 15 minutes).
//
const adminBruteForceLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 login attempts per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please wait 15 minutes and try again.",
  },
});

// Routes
app.use("/api/auth", adminBruteForceLimit, require("./routes/auth"));
app.use("/api/student", require("./routes/student"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/rankings", require("./routes/rankings"));

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", name: "GradeFlow API" }),
);

const http = require("http");
const server = http.createServer(app);

// Seed admin on first run
async function seedAdmin() {
  const Admin = require("./models/Admin");
  const exists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (!exists) {
    await Admin.create({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    console.log("✅ Admin seeded:", process.env.ADMIN_EMAIL);
  }
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    await seedAdmin();
    server.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`),
    );
  })
  .catch((err) => {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  });
