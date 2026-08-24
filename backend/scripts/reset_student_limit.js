const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const StudentDailyLimit = require("../models/StudentDailyLimit");
const OtpVerification = require("../models/OtpVerification");

async function resetLimit() {
  const targetReg = "230301120137";
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("MONGO_URI is missing from environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB Atlas.");

    // Delete or reset daily limit records for this student
    const deleteLimitResult = await StudentDailyLimit.deleteMany({ regNo: targetReg });
    console.log(`Reset ${deleteLimitResult.deletedCount} daily limit record(s) for student ${targetReg}.`);

    // Clean up any stale unverified OTP record
    const deleteOtpResult = await OtpVerification.deleteMany({ regNo: targetReg });
    console.log(`Cleaned up ${deleteOtpResult.deletedCount} OTP record(s) for student ${targetReg}.`);

    console.log(`\nSUCCESS: Daily OTP limit and cooldown for student ${targetReg} have been completely reset to 0 for today!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Failed to reset daily limit:", err);
    process.exit(1);
  }
}

resetLimit();
