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

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Server is experiencing high traffic. Retrying...",
    status: 429
  }
});
app.use(limiter);

// Routes
app.use("/api/auth", require("./routes/auth"));
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
    console.log("o. Admin seeded:", process.env.ADMIN_EMAIL);
  }
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("o. MongoDB connected");
    await seedAdmin();
    server.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`),
    );
  })
  .catch((err) => {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  });
