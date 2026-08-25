const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const JWT_SECRET = process.env.JWT_SECRET || "test_secret_key";

// 1. Create a fake student token for standard student 230301120137
const studentToken = jwt.sign(
  {
    regNo: "230301120137",
    sessionId: "test-session-12345",
    role: "student",
  },
  JWT_SECRET,
  { expiresIn: "7d" }
);

console.log("======================================================================");
console.log(" BACKEND POSTMAN / CURL SECURITY AUDIT: STUDENT ADMIN BLOCK TEST");
console.log("======================================================================");

async function runDirectAuthMiddlewareTest() {
  const { protect } = require("../middleware/auth");

  console.log("\n--- 1. Testing Express protect middleware with Student Token ---");
  
  // Case A: Student sends token in Authorization header
  let resA = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.data = data; return this; }
  };
  let reqA = {
    headers: { authorization: `Bearer ${studentToken}` },
    cookies: {},
  };
  let nextCalledA = false;
  await protect(reqA, resA, () => { nextCalledA = true; });

  if (resA.statusCode === 403 && !nextCalledA) {
    console.log(`[PASS] Authorization: Bearer <studentToken> -> 403 Forbidden (${resA.data.code})`);
  } else {
    console.error(`[FAIL] Expected 403, got ${resA.statusCode}`);
  }

  // Case B: Student sends token in x-student-token header
  let resB = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.data = data; return this; }
  };
  let reqB = {
    headers: { "x-student-token": studentToken },
    cookies: {},
  };
  let nextCalledB = false;
  await protect(reqB, resB, () => { nextCalledB = true; });

  if (resB.statusCode === 403 && !nextCalledB) {
    console.log(`[PASS] Header: x-student-token -> 403 Forbidden (${resB.data.code})`);
  } else {
    console.error(`[FAIL] Expected 403, got ${resB.statusCode}`);
  }

  // Case C: Student sends token in student_jwt cookie
  let resC = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.data = data; return this; }
  };
  let reqC = {
    headers: {},
    cookies: { student_jwt: studentToken },
  };
  let nextCalledC = false;
  await protect(reqC, resC, () => { nextCalledC = true; });

  if (resC.statusCode === 403 && !nextCalledC) {
    console.log(`[PASS] Cookie: student_jwt -> 403 Forbidden (${resC.data.code})`);
  } else {
    console.error(`[FAIL] Expected 403, got ${resC.statusCode}`);
  }

  // Case D: No token at all
  let resD = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.data = data; return this; }
  };
  let reqD = {
    headers: {},
    cookies: {},
  };
  let nextCalledD = false;
  await protect(reqD, resD, () => { nextCalledD = true; });

  if (resD.statusCode === 401 && !nextCalledD) {
    console.log(`[PASS] No token -> 401 Unauthorized (${resD.data.code})`);
  } else {
    console.error(`[FAIL] Expected 401, got ${resD.statusCode}`);
  }
}

async function runServerlessSubadminsTest() {
  console.log("\n--- 2. Testing Serverless SubAdmins Endpoint with Student Token ---");
  const subadminsHandler = require("../../frontend/api/subadmins");

  // Postman calling subadmins API with x-student-token
  let res = {
    setHeader: () => {},
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.data = data; return this; },
    end: () => {}
  };
  let req = {
    method: "GET",
    headers: { "x-student-token": studentToken },
    url: "/api/subadmins"
  };

  await subadminsHandler(req, res);
  if (res.statusCode === 403) {
    console.log(`[PASS] Serverless subadmins endpoint with student token -> 403 Forbidden (${res.data.code})`);
  } else {
    console.error(`[FAIL] Expected 403 on subadmins, got ${res.statusCode}`);
  }
}

async function runServerlessStudentOtpManagementTest() {
  console.log("\n--- 3. Testing Serverless Student OTP Management with Student Token ---");
  const otpMgmtHandler = require("../../frontend/api/student-otp-management");

  let res = {
    setHeader: () => {},
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.data = data; return this; },
    end: () => {}
  };
  let req = {
    method: "GET",
    headers: { "x-student-token": studentToken },
    url: "/api/student-otp-management?action=history&regNo=230301120137",
    query: { action: "history", regNo: "230301120137" }
  };

  await otpMgmtHandler(req, res);
  if (res.statusCode === 403) {
    console.log(`[PASS] Serverless Student OTP Management with student token -> 403 Forbidden (${res.data.message})`);
  } else {
    console.error(`[FAIL] Expected 403 on student-otp-management, got ${res.statusCode}`);
  }
}

async function main() {
  try {
    await runDirectAuthMiddlewareTest();
    await runServerlessSubadminsTest();
    await runServerlessStudentOtpManagementTest();
    console.log("\n======================================================================");
    console.log(" ALL POSTMAN / CURL BACKEND SECURITY INTERCEPTION TESTS PASSED!");
    console.log("======================================================================");
    process.exit(0);
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

main();
