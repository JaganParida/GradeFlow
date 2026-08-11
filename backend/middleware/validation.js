/**
 * Centralized Strict Input Validation Middleware
 */

function validateRegNo(regNo) {
  if (!regNo || typeof regNo !== "string") return false;
  const clean = regNo.trim();
  return /^[a-zA-Z0-9]{5,20}$/.test(clean);
}

function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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

  if (regNo && !validateRegNo(regNo)) {
    return res.status(400).json({ message: "Invalid registration number format." });
  }

  req.body.name = name.trim();
  req.body.rating = numRating;
  req.body.comment = comment.trim();
  if (regNo) req.body.regNo = String(regNo).trim();

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

module.exports = {
  validateRegNo,
  validateEmail,
  validateRegNoParam,
  validateFeedbackInput,
  validateEmailRequest,
};
