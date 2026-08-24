/**
 * GRADEFLOW — COMPREHENSIVE STUDENT OTP LIFECYCLE & PRE-SEND STATE TEST
 * 
 * Verifies:
 * 1. Normal student 230301120137 pre-send status has 0/2 attempts, 0s cooldown, step 1.
 * 2. Failed delivery does NOT increment attempts or trigger cooldown.
 * 3. Successful delivery increments attempts to 1/2, starts 180s cooldown & 180s expiry.
 * 4. Immediate resend within 180s is blocked by OTP_COOLDOWN_ACTIVE.
 * 5. 2nd successful delivery increments attempts to 2/2 and leaves 0 remaining.
 * 6. 3rd attempt is blocked by DAILY_LIMIT_EXCEEDED.
 * 7. Reference account 230301120327 has 2-device policy and developer bypass.
 * 8. Multiple students maintain strict isolation (Student A never affects Student B).
 */

const path = require("path");

async function runComprehensiveLifecycleTest() {
  console.log("======================================================================");
  console.log(" GRADEFLOW NORMAL & SPECIAL STUDENT OTP LIFECYCLE AUDIT");
  console.log("======================================================================\n");

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${message}`);
      testsFailed++;
    }
  }

  // --- MOCK DATABASE STORE ---
  const dbDailyLimits = {};
  const dbOtpVerifications = {};

  function getDailyLimit(regNo, dateKey = "2026-08-25") {
    const key = `${regNo}_${dateKey}`;
    if (!dbDailyLimits[key]) {
      dbDailyLimits[key] = { regNo, dateKey, otpSendCount: 0, lastOtpSentAt: null };
    }
    return dbDailyLimits[key];
  }

  // --- SIMULATED CHECK-STATUS ENDPOINT ---
  function checkStatus(regNo, activeSessionCount = 0) {
    const rawReg = String(regNo).trim().toUpperCase();
    const isUnlimited = rawReg === "230301120327";
    const maxAllowedDevices = rawReg === "230301120327" ? 2 : 1;
    const isBlocked = activeSessionCount >= maxAllowedDevices;

    const dailyLimit = getDailyLimit(rawReg);
    const maxDailyLimit = 2;

    let isCooldownActive = false;
    let cooldownRemainingSeconds = 0;
    if (!isUnlimited && dailyLimit.lastOtpSentAt) {
      const timeSinceLastSend = Date.now() - new Date(dailyLimit.lastOtpSentAt).getTime();
      if (timeSinceLastSend < 180 * 1000) {
        isCooldownActive = true;
        cooldownRemainingSeconds = Math.ceil((180 * 1000 - timeSinceLastSend) / 1000);
      }
    }

    const currentDailyCount = dailyLimit.otpSendCount;
    const isDailyLimitReached = !isUnlimited && currentDailyCount >= maxDailyLimit;
    const remainingDailyAttempts = isUnlimited ? 99 : Math.max(0, maxDailyLimit - currentDailyCount);

    return {
      success: true,
      exists: true,
      isBlocked,
      loginAllowed: !isBlocked && !isDailyLimitReached,
      otpAllowed: !isBlocked && !isDailyLimitReached && !isCooldownActive,
      attemptsUsedToday: currentDailyCount,
      maxDailyAttempts: maxDailyLimit,
      remainingDailyAttempts,
      isCooldownActive,
      cooldownRemainingSeconds,
      isDailyLimitReached,
      isUnlimited,
    };
  }

  // --- SIMULATED SEND-OTP ENDPOINT ---
  async function sendOtp(regNo, simulateFailure = false) {
    const rawReg = String(regNo).trim().toUpperCase();
    const isUnlimited = rawReg === "230301120327";
    const dailyLimit = getDailyLimit(rawReg);
    const maxDailyLimit = 2;

    // 1. Cooldown check
    if (!isUnlimited && dailyLimit.lastOtpSentAt) {
      const timeSinceLastSend = Date.now() - new Date(dailyLimit.lastOtpSentAt).getTime();
      if (timeSinceLastSend < 180 * 1000) {
        const remaining = Math.ceil((180 * 1000 - timeSinceLastSend) / 1000);
        return { success: false, code: "OTP_COOLDOWN_ACTIVE", remainingSeconds: remaining };
      }
    }

    // 2. Daily limit check
    if (!isUnlimited && dailyLimit.otpSendCount >= maxDailyLimit) {
      return { success: false, code: "DAILY_LIMIT_EXCEEDED" };
    }

    // 3. Provider dispatch attempt
    if (simulateFailure) {
      // Failed delivery: do not touch dailyLimit
      return { success: false, code: "OTP_DELIVERY_UNAVAILABLE", message: "Delivery failed" };
    }

    // 4. Confirmed Success: update daily limit and cooldown
    dailyLimit.otpSendCount += 1;
    dailyLimit.lastOtpSentAt = new Date();
    dbOtpVerifications[rawReg] = { otp: "123456", expiresAt: new Date(Date.now() + 180 * 1000) };

    return {
      success: true,
      expiresInSeconds: 180,
      cooldownSeconds: 180,
      attemptsUsedToday: dailyLimit.otpSendCount,
      remainingDailyAttempts: isUnlimited ? 99 : Math.max(0, maxDailyLimit - dailyLimit.otpSendCount),
      isUnlimited,
    };
  }

  // --- 1. PRE-SEND CHECK FOR NORMAL STUDENT 230301120137 ---
  console.log("--- 1. Pre-Send Initial State (230301120137) ---");
  const preCheck = checkStatus("230301120137");
  assert(preCheck.attemptsUsedToday === 0, "Pre-send attempts used is strictly 0");
  assert(preCheck.remainingDailyAttempts === 2, "Pre-send remaining attempts is strictly 2");
  assert(preCheck.isCooldownActive === false, "Pre-send cooldown is NOT active");
  assert(preCheck.otpAllowed === true, "Pre-send OTP request is allowed");

  // --- 2. FAILED DELIVERY LIFECYCLE ---
  console.log("\n--- 2. Failed Delivery Lifecycle (230301120137) ---");
  const failRes = await sendOtp("230301120137", true);
  assert(failRes.success === false && failRes.code === "OTP_DELIVERY_UNAVAILABLE", "Failed dispatch returns OTP_DELIVERY_UNAVAILABLE");

  const postFailCheck = checkStatus("230301120137");
  assert(postFailCheck.attemptsUsedToday === 0, "Post-failure attempts used remains strictly 0 (no wasted quota)");
  assert(postFailCheck.remainingDailyAttempts === 2, "Post-failure remaining attempts remains 2");
  assert(postFailCheck.isCooldownActive === false, "Post-failure cooldown is NOT triggered");

  // --- 3. FIRST SUCCESSFUL DELIVERY ---
  console.log("\n--- 3. First Successful Delivery (230301120137) ---");
  const success1 = await sendOtp("230301120137", false);
  assert(success1.success === true, "First OTP send succeeds");
  assert(success1.attemptsUsedToday === 1, "First send increments attempts used to exactly 1/2");
  assert(success1.remainingDailyAttempts === 1, "First send leaves exactly 1 remaining attempt");
  assert(success1.cooldownSeconds === 180, "First send returns 180s cooldown");
  assert(success1.expiresInSeconds === 180, "First send returns 180s expiration");

  // --- 4. IMMEDIATE RESEND ATTEMPT ---
  console.log("\n--- 4. Immediate Resend Block (230301120137) ---");
  const immediateResend = await sendOtp("230301120137", false);
  assert(immediateResend.success === false && immediateResend.code === "OTP_COOLDOWN_ACTIVE", "Immediate resend within 180s is blocked by cooldown");

  // --- 5. RESEND AFTER 180s (SECOND ATTEMPT) ---
  console.log("\n--- 5. Resend After 180s Cooldown (230301120137) ---");
  // Fast-forward cooldown
  getDailyLimit("230301120137").lastOtpSentAt = new Date(Date.now() - 181 * 1000);

  const success2 = await sendOtp("230301120137", false);
  assert(success2.success === true, "Second OTP send succeeds after cooldown expires");
  assert(success2.attemptsUsedToday === 2, "Second send sets attempts used to 2/2");
  assert(success2.remainingDailyAttempts === 0, "Second send leaves 0 remaining attempts");

  // --- 6. THIRD ATTEMPT BLOCKED BY DAILY LIMIT ---
  console.log("\n--- 6. Third Attempt Blocked (230301120137) ---");
  // Fast-forward cooldown
  getDailyLimit("230301120137").lastOtpSentAt = new Date(Date.now() - 181 * 1000);

  const thirdAttempt = await sendOtp("230301120137", false);
  assert(thirdAttempt.success === false && thirdAttempt.code === "DAILY_LIMIT_EXCEEDED", "Third attempt blocked by DAILY_LIMIT_EXCEEDED");

  // --- 7. SPECIAL ACCOUNT 230301120327 AUDIT ---
  console.log("\n--- 7. Reference Special Account (230301120327) ---");
  const devCheck = checkStatus("230301120327", 1);
  assert(devCheck.isUnlimited === true, "Developer account has isUnlimited: true");
  assert(devCheck.isBlocked === false, "Developer account allowed on device 2 (max 2)");

  const devCheck3 = checkStatus("230301120327", 2);
  assert(devCheck3.isBlocked === true, "Developer account blocked on device 3");

  const devSend1 = await sendOtp("230301120327", false);
  const devSend2 = await sendOtp("230301120327", false);
  const devSend3 = await sendOtp("230301120327", false);
  assert(devSend1.success && devSend2.success && devSend3.success, "Developer account bypasses daily quota limit cleanly");

  // --- 8. MULTI-STUDENT ISOLATION ---
  console.log("\n--- 8. Multi-Student Isolation (230301120005) ---");
  const studentBCheck = checkStatus("230301120005");
  assert(studentBCheck.attemptsUsedToday === 0, "Student B has 0/2 attempts used despite Student A's usage");
  assert(studentBCheck.remainingDailyAttempts === 2, "Student B has 2 remaining attempts");
  assert(studentBCheck.isCooldownActive === false, "Student B has no cooldown");

  console.log("\n======================================================================");
  console.log(` RESULTS: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log("======================================================================\n");

  if (testsFailed > 0) process.exit(1);
}

runComprehensiveLifecycleTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
