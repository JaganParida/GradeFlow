require("dotenv").config();
const mongoose = require("mongoose");
const SemesterResult = require("./models/SemesterResult");
const Ranking = require("./models/Ranking");
const adminRouter = require("./routes/admin");
const generateRankingForSemester = adminRouter.generateRankingForSemester;
const { clearStudentCache } = require("./routes/student");

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGO_URI is missing from environment variables.");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ MongoDB Connected.");

    const semesters = await SemesterResult.distinct("semester");
    if (!semesters || !semesters.length) {
      console.log("⚠️ No semester results found in database.");
      process.exit(0);
    }

    semesters.sort((a, b) => Number(a) - Number(b));
    console.log(`Found ${semesters.length} semester(s) to process: ${semesters.join(", ")}`);

    for (const sem of semesters) {
      console.log(`\n⏳ Regenerating rankings for Semester ${sem}...`);
      await generateRankingForSemester(Number(sem));
      const count = await Ranking.countDocuments({ semester: Number(sem) });
      console.log(`✅ Semester ${sem} completed. Total ranking records: ${count}`);
    }

    clearStudentCache();
    console.log("\n✅ Student cache cleared.");

    const totalRankings = await Ranking.countDocuments();
    console.log(`\n🎉 DONE! Successfully regenerated rankings for all semesters. Total ranking records in DB: ${totalRankings}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.warn("⚠️ Direct MongoDB connection failed (likely IP whitelist restriction). Falling back to remote API trigger on Render...");
    
    try {
      const serverUrl = process.env.SERVER_URL || "https://gradeflow-api.onrender.com";
      console.log(`Logging in to Admin API at ${serverUrl}...`);
      
      const loginRes = await fetch(`${serverUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok || !loginData.token) {
        throw new Error(`Admin login failed: ${loginData.message || loginRes.statusText}`);
      }

      console.log("✅ Admin authenticated. Triggering full ranking regeneration on Render backend...");

      const regenRes = await fetch(`${serverUrl}/api/admin/rankings/regenerate-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginData.token}`,
        },
      });

      const regenData = await regenRes.json();
      if (!regenRes.ok) {
        throw new Error(`Regenerate request failed: ${regenData.message || regenRes.statusText}`);
      }

      console.log(`\n🎉 ${regenData.message}`);
      process.exit(0);
    } catch (apiErr) {
      console.error("❌ Remote API trigger also failed:", apiErr.message);
      process.exit(1);
    }
  }
}

run();
