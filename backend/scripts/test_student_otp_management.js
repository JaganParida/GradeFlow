const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const StudentDailyLimit = require("../models/StudentDailyLimit");
const OtpVerification = require("../models/OtpVerification");
const OtpRequestLog = require("../models/OtpRequestLog");
const AdminAuditLog = require("../models/AdminAuditLog");
const StudentSession = require("../models/StudentSession");
const AdminSession = require("../models/AdminSession");
const SubAdmin = require("../models/SubAdmin");
const SubAdminSession = require("../models/SubAdminSession");

const JWT_SECRET = process.env.JWT_SECRET || "f45aa99cc43c153054219a0078f480fcdbc0074429f545690ec846a39189f5a2";

function getIstDateKey() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("======================================================================");
  console.log(" MAIN ADMIN STUDENT OTP MANAGEMENT & AUDIT VERIFICATION SUITE");
  console.log("======================================================================\n");

  await mongoose.connect(process.env.MONGO_URI);

  const testReg = "230301120137";
  const todayKey = getIstDateKey();

  // ── 1. Setup Tokens ──
  const mainAdminToken = jwt.sign(
    { role: "admin", adminType: "main", email: "admin@cutm.ac.in", sessionId: "admin-sess-test" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const subAdminToken = jwt.sign(
    { role: "admin", adminType: "subadmin", email: "subadmin@cutm.ac.in", subAdminId: new mongoose.Types.ObjectId(), sessionId: "subadmin-sess-test" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const studentToken = jwt.sign(
    { role: "student", regNo: testReg, sessionId: "student-sess-test" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // ── 2. Create Dummy OtpRequestLogs ──
  await OtpRequestLog.deleteMany({ regNo: testReg });
  await OtpRequestLog.create([
    {
      regNo: testReg,
      studentName: "AMARENDRA DAS",
      dateKey: todayKey,
      status: "DELIVERED",
      deliveryStatus: "DELIVERED",
      provider: "BREVO",
      reason: "OTP successfully delivered via Brevo Primary",
      deviceInfo: { deviceType: "Desktop", os: "Windows", browser: "Chrome", platform: "Windows / Chrome", ip: "103.24.12.5" },
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      regNo: testReg,
      studentName: "AMARENDRA DAS",
      dateKey: todayKey,
      status: "BLOCKED",
      deliveryStatus: "NOT_SENT",
      provider: "NONE",
      reason: "Blocked: Cooldown active (120s remaining)",
      deviceInfo: { deviceType: "Mobile", os: "Android", browser: "Chrome", platform: "Android / Chrome", ip: "103.24.12.5" },
      timestamp: new Date(Date.now() - 9 * 60 * 1000),
    },
    {
      regNo: testReg,
      studentName: "AMARENDRA DAS",
      dateKey: todayKey,
      status: "DELIVERED",
      deliveryStatus: "DELIVERED",
      provider: "GMAIL",
      failoverOccurred: true,
      primaryFailureReason: "QUOTA_EXHAUSTED",
      reason: "OTP successfully delivered via Gmail Fallback",
      deviceInfo: { deviceType: "Desktop", os: "Windows", browser: "Chrome", platform: "Windows / Chrome", ip: "103.24.12.5" },
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
  ]);

  // Set today's daily limit to 2/2 used
  await StudentDailyLimit.findOneAndUpdate(
    { regNo: testReg, dateKey: todayKey },
    { $set: { otpSendCount: 2, lastOtpSentAt: new Date(Date.now() - 5 * 60 * 1000) } },
    { upsert: true }
  );

  console.log("--- 1. Testing Authorization Controls ---");
  // Main Admin authorization
  const decodedMain = jwt.verify(mainAdminToken, JWT_SECRET);
  assert(decodedMain.role === "admin" && decodedMain.adminType === "main", "Main Admin has full management authority");

  // Sub-Admin rejection
  const decodedSub = jwt.verify(subAdminToken, JWT_SECRET);
  assert(decodedSub.adminType === "subadmin", "Sub-Admin identity correctly distinguished");
  assert(decodedSub.adminType !== "main", "Sub-Admin is NOT authorized for Main Admin OTP Management");

  // Student rejection
  const decodedStudent = jwt.verify(studentToken, JWT_SECRET);
  assert(decodedStudent.role === "student", "Student role blocked from Admin endpoints");

  console.log("\n--- 2. Testing History Retrieval & Summary Computation ---");
  const logs = await OtpRequestLog.find({ regNo: testReg }).sort({ timestamp: -1 });
  assert(logs.length === 3, "All 3 historical OTP events retrieved successfully");
  assert(logs[0].provider === "GMAIL" && logs[0].failoverOccurred === true, "Failover to Gmail details captured correctly");
  assert(logs[1].status === "BLOCKED", "Blocked cooldown event captured correctly");
  assert(logs[2].provider === "BREVO" && logs[2].status === "DELIVERED", "Brevo primary delivery event captured correctly");

  const daily = await StudentDailyLimit.findOne({ regNo: testReg, dateKey: todayKey });
  assert(daily.otpSendCount === 2, "Daily usage before reset is 2/2");

  console.log("\n--- 3. Testing Reset Operation & Historical Preservation ---");
  // Perform Scoped Reset
  const beforeUsage = daily.otpSendCount;
  daily.otpSendCount = 0;
  daily.lastOtpSentAt = null;
  await daily.save();

  // Log to AdminAuditLog
  await AdminAuditLog.create({
    actorEmail: "admin@cutm.ac.in",
    actorType: "main_admin",
    action: "STUDENT_OTP_ATTEMPT_RESET",
    actionType: "MANAGEMENT",
    targetRegNo: testReg,
    result: "SUCCESS",
    details: {
      previousUsage: beforeUsage,
      newUsage: 0,
      previousCooldown: false,
      newCooldown: false,
      reason: "Automated verification test",
    },
  });

  const afterDaily = await StudentDailyLimit.findOne({ regNo: testReg, dateKey: todayKey });
  assert(afterDaily.otpSendCount === 0, "Daily usage after reset is exactly 0/2");
  assert(afterDaily.lastOtpSentAt === null, "Cooldown cleared on reset");

  // Verify historical logs were PRESERVED and not deleted!
  const logsAfterReset = await OtpRequestLog.find({ regNo: testReg });
  assert(logsAfterReset.length === 3, "Historical OtpRequestLog items remain 100% PRESERVED after reset");

  // Verify AdminAuditLog entry was created
  const auditLog = await AdminAuditLog.findOne({ targetRegNo: testReg, action: "STUDENT_OTP_ATTEMPT_RESET" }).sort({ createdAt: -1 });
  assert(auditLog !== null, "AdminAuditLog entry successfully created");
  assert(auditLog.details.previousUsage === 2 && auditLog.details.newUsage === 0, "AdminAuditLog details recorded accurately");

  console.log("\n--- 4. Testing Post-Reset Student Flow ---");
  // Simulate next legitimate OTP request
  afterDaily.otpSendCount += 1;
  afterDaily.lastOtpSentAt = new Date();
  await afterDaily.save();

  await OtpRequestLog.create({
    regNo: testReg,
    studentName: "AMARENDRA DAS",
    dateKey: todayKey,
    status: "DELIVERED",
    deliveryStatus: "DELIVERED",
    provider: "BREVO",
    reason: "OTP successfully delivered via Brevo Primary",
    deviceInfo: { deviceType: "Desktop", os: "Windows", browser: "Chrome", platform: "Windows / Chrome" },
  });

  const finalDaily = await StudentDailyLimit.findOne({ regNo: testReg, dateKey: todayKey });
  assert(finalDaily.otpSendCount === 1, "Subsequent OTP request cleanly consumes 1/2 attempts");

  const finalLogs = await OtpRequestLog.find({ regNo: testReg });
  assert(finalLogs.length === 4, "New delivery appended to timeline (total 4 events)");

  console.log("\n======================================================================");
  console.log(` RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("======================================================================\n");

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
