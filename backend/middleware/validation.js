/**
 * Centralized Strict Input Validation Middleware
 */

const VALID_BRANCHES = new Set(["CSE", "ECE", "ME", "CIVIL", "EEE", "BIO", "MI", "AERO"]);
const VALID_GRADES = new Set(["O", "E", "A", "B", "C", "D", "F", "R", "S", "M", "I"]);

function validateRegNo(regNo) {
  if (!regNo || typeof regNo !== "string") return false;
  const clean = regNo.trim();
  return /^[a-zA-Z0-9]{5,20}$/.test(clean);
}

function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().length <= 100;
}

// Middleware to validate Admin Login payload
function validateLoginInput(req, res, next) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !validateEmail(email)) {
    return res.status(400).json({ message: "A valid email address is required." });
  }

  if (!password || typeof password !== "string" || password.length < 6 || password.length > 128) {
    return res.status(400).json({ message: "Password must be a string between 6 and 128 characters." });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

// Middleware to validate registration number in req.params
function validateRegNoParam(req, res, next) {
  const regNo = req.params.regNo || req.params.registrationNumber;
  if (!validateRegNo(regNo)) {
    return res.status(400).json({ message: "Invalid registration number format. Must be 5-20 alphanumeric characters." });
  }
  req.params.regNo = String(regNo).trim();
  next();
}

// Middleware to validate feedback submission body
function validateFeedbackInput(req, res, next) {
  const { name, rating, comment, regNo } = req.body || {};

  if (!name || typeof name !== "string" || name.trim().length < 1 || name.trim().length > 100) {
    return res.status(400).json({ message: "Name is required and must be between 1 and 100 characters." });
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ message: "Rating must be a number between 1 and 5." });
  }

  if (!comment || typeof comment !== "string" || comment.trim().length < 1 || comment.trim().length > 1000) {
    return res.status(400).json({ message: "Comment is required and must be between 1 and 1000 characters." });
  }

  if (!regNo || typeof regNo !== "string" || !validateRegNo(regNo)) {
    return res.status(400).json({ message: "A valid student Registration Number is required to submit a review." });
  }

  req.body.name = name.trim();
  req.body.rating = numRating;
  req.body.comment = comment.trim();
  req.body.regNo = String(regNo).trim();

  next();
}

// Middleware to validate email sending requests
function validateEmailRequest(req, res, next) {
  const { regNo, customEmail } = req.body || {};

  if (!validateRegNo(regNo)) {
    return res.status(400).json({ message: "Valid registration number is required." });
  }

  if (customEmail && !validateEmail(customEmail)) {
    return res.status(400).json({ message: "Invalid custom recipient email address format." });
  }

  req.body.regNo = String(regNo).trim();
  if (customEmail) req.body.customEmail = String(customEmail).trim().toLowerCase();

  next();
}

// Middleware to validate Academic Filters in query parameters
function validateAcademicFilters(req, res, next) {
  const { batch, branch, semester, section, page, limit, search } = req.query;

  if (batch && !/^20\d{2}$/.test(String(batch).trim())) {
    return res.status(400).json({ message: "Invalid batch format. Expected 4-digit year (e.g. 2024)." });
  }

  if (branch) {
    const cleanBranch = String(branch).trim().toUpperCase();
    if (cleanBranch !== "ALL" && !VALID_BRANCHES.has(cleanBranch)) {
      return res.status(400).json({ message: `Invalid branch '${branch}'. Allowed branches: ${Array.from(VALID_BRANCHES).join(", ")}` });
    }
  }

  if (semester) {
    const numSem = Number(semester);
    if (isNaN(numSem) || numSem < 1 || numSem > 8) {
      return res.status(400).json({ message: "Semester must be an integer between 1 and 8." });
    }
  }

  if (section) {
    const cleanSec = String(section).trim().replace(/^sec\s*/i, "").toUpperCase();
    if (cleanSec.length > 2 || !/^[A-P]$/.test(cleanSec)) {
      return res.status(400).json({ message: "Invalid section identifier." });
    }
  }

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({ message: "Page must be a positive integer." });
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 200)) {
    return res.status(400).json({ message: "Limit must be between 1 and 200." });
  }

  if (search && typeof search === "string" && search.length > 100) {
    return res.status(400).json({ message: "Search query must be under 100 characters." });
  }

  next();
}

// Middleware to validate Grade Update input
function validateGradeUpdateInput(req, res, next) {
  const { regNo, semester, subCode, newGrade } = req.body || {};

  if (!validateRegNo(regNo)) {
    return res.status(400).json({ message: "Valid registration number is required." });
  }

  const numSem = Number(semester);
  if (isNaN(numSem) || numSem < 1 || numSem > 8) {
    return res.status(400).json({ message: "Semester must be a valid integer between 1 and 8." });
  }

  if (!subCode || typeof subCode !== "string" || subCode.trim().length < 2 || subCode.trim().length > 30) {
    return res.status(400).json({ message: "Valid subject code is required." });
  }

  const cleanGrade = String(newGrade || "").trim().toUpperCase();
  if (!VALID_GRADES.has(cleanGrade)) {
    return res.status(400).json({ message: `Invalid grade '${newGrade}'. Allowed grades: ${Array.from(VALID_GRADES).join(", ")}` });
  }

  req.body.regNo = String(regNo).trim();
  req.body.semester = numSem;
  req.body.subCode = String(subCode).trim().toUpperCase();
  req.body.newGrade = cleanGrade;

  next();
}

module.exports = {
  VALID_BRANCHES,
  VALID_GRADES,
  validateRegNo,
  validateEmail,
  validateLoginInput,
  validateRegNoParam,
  validateFeedbackInput,
  validateEmailRequest,
  validateAcademicFilters,
  validateGradeUpdateInput,
};
