const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const { protect } = require("../middleware/auth");
const { requirePermission } = require("../middleware/rbac");
const { publicLimiter } = require("../middleware/rateLimiters");
const { validateFeedbackInput } = require("../middleware/validation");
const { validateFeedbackComment } = require("../utils/feedbackValidator");

const jwt = require("jsonwebtoken");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    let [name, ...rest] = cookie.trim().split("=");
    name = name?.trim();
    if (!name) return;
    cookies[name] = rest.join("=");
  });
  return cookies;
}

// Helper to check admin status
function checkIsAdmin(req) {
  let cookieJwt = req.cookies?.jwt;
  if (!cookieJwt && req.headers?.cookie) {
    const parsed = parseCookies(req.headers.cookie);
    cookieJwt = parsed.jwt;
  }

  const authHeader = req.headers?.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const customAdminToken = req.headers?.["x-admin-token"];

  const candidates = [
    cookieJwt,
    req.cookies?.admin_token,
    customAdminToken,
    bearerToken,
  ].filter((t) => t && typeof t === "string" && t !== "none" && t !== "true" && t !== "false" && t.length > 20);

  if (!process.env.JWT_SECRET || candidates.length === 0) return false;

  for (const token of candidates) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      if (decoded && (decoded.role === "admin" || decoded.adminType === "subadmin" || decoded.email)) {
        return true;
      }
    } catch (_) {}
  }
  return false;
}

// GET /api/feedback - Retrieve feedbacks
// Admin & creator 230301120327 see all; students see public + their own review; public sees approved rating >= 3
router.get("/", async (req, res) => {
  try {
    const isAdmin = checkIsAdmin(req);
    const studentRegNo = (
      req.query.studentRegNo ||
      req.query.regNo ||
      req.headers["x-student-regno"] ||
      ""
    ).toString().trim().toUpperCase();

    const isCreator = studentRegNo === "230301120327";

    let filter = {};
    if (isAdmin || isCreator) {
      filter = {};
    } else if (studentRegNo) {
      const regVariants = Array.from(new Set([
        studentRegNo,
        studentRegNo.toLowerCase(),
        studentRegNo.toUpperCase(),
      ]));
      filter = {
        $or: [
          { status: { $nin: ["hidden", "needs_review"] }, rating: { $gte: 3 } },
          { regNo: { $in: regVariants } },
        ],
      };
    } else {
      filter = { status: { $nin: ["hidden", "needs_review"] }, rating: { $gte: 3 } };
    }

    const feedbacks = await Feedback.find(filter)
      .select("name regNo rating comment category likes status createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ message: "Server Error fetching feedbacks" });
  }
});

// POST /api/feedback - Submit new feedback (strictly 1 feedback per student regNo)
router.post("/", publicLimiter, validateFeedbackInput, async (req, res) => {
  try {
    const { name, regNo, rating, comment, category } = req.body;

    if (!name || !rating || !comment) {
      return res.status(400).json({ message: "Name, rating, and comment are required." });
    }

    const cleanRegNo = String(regNo || "").trim().toUpperCase();
    if (!cleanRegNo || !/^[a-zA-Z0-9]{5,20}$/.test(cleanRegNo)) {
      return res.status(400).json({ message: "A valid student Registration Number is required to submit a review." });
    }

    // Single feedback check per student
    const regVariants = Array.from(new Set([cleanRegNo, cleanRegNo.toLowerCase(), String(regNo).trim()]));
    const existingFeedback = await Feedback.findOne({ regNo: { $in: regVariants } });
    if (existingFeedback) {
      return res.status(400).json({
        message: "You have already submitted a review. Multiple submissions are not allowed. You can edit your review within 24 hours.",
        alreadySubmitted: true,
        feedbackId: existingFeedback._id,
      });
    }

    const SemesterResult = require("../models/SemesterResult");
    const officialRecord = await SemesterResult.findOne({ regNo: cleanRegNo }).select("studentName").lean();

    let verifiedName = name;
    if (officialRecord && officialRecord.studentName && officialRecord.studentName.trim().length >= 2) {
      verifiedName = officialRecord.studentName.trim();
    } else if (cleanRegNo === "000000000000" || cleanRegNo.startsWith("0000")) {
      return res.status(400).json({ message: "Registration number not found in university records. Only enrolled students can submit feedback." });
    }

    const verifiedCommentCheck = validateFeedbackComment(comment, verifiedName);
    if (!verifiedCommentCheck.isValid) {
      return res.status(400).json({ message: verifiedCommentCheck.error });
    }

    const numRating = Number(rating);
    const feedbackStatus = numRating <= 2 ? "needs_review" : "approved";

    const newFeedback = new Feedback({
      name: verifiedName,
      regNo: cleanRegNo,
      rating: numRating,
      comment: comment.trim(),
      category: category || "Overall Experience",
      status: feedbackStatus,
    });

    const savedFeedback = await newFeedback.save();

    if (cleanRegNo) {
      try {
        const studentRoute = require("./student");
        if (typeof studentRoute.clearStudentCache === "function") {
          studentRoute.clearStudentCache(cleanRegNo);
        }
      } catch (err) {
        console.warn("Failed to clear student cache on feedback submit:", err.message);
      }
      try {
        const { publishStudentRealtimeEvent } = require("../utils/ablyService");
        if (typeof publishStudentRealtimeEvent === "function") {
          publishStudentRealtimeEvent(cleanRegNo, "feedback-status-changed", {
            hasSubmittedFeedback: true,
            regNo: cleanRegNo,
            status: feedbackStatus,
            timestamp: Date.now(),
          }).catch(() => {});
        }
      } catch (_) {}
    }

    res.status(201).json(savedFeedback);
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(500).json({ message: "Server Error saving feedback" });
  }
});


// POST /api/feedback/:id/like - Increment likes on a feedback (rate-limited)
router.post("/:id/like", publicLimiter, async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ message: "Invalid feedback ID format" });
    }
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true, select: "name regNo rating comment category likes status createdAt updatedAt" }
    ).lean();
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.json(feedback);
  } catch (error) {
    console.error("Error liking feedback:", error);
    res.status(500).json({ message: "Server Error liking feedback" });
  }
});

// PUT /api/feedback/:id - Update feedback (Admin anytime, or Student within 24 hours)
router.put("/:id", async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ message: "Invalid feedback ID format" });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    const isAdmin = checkIsAdmin(req);
    const requesterRegNo = (
      req.body.studentRegNo ||
      req.query.studentRegNo ||
      req.headers["x-student-regno"] ||
      ""
    ).toString().trim().toUpperCase();

    if (isAdmin) {
      const { name, regNo, rating, comment, category, status } = req.body;
      if (name) feedback.name = name.trim();
      if (regNo) feedback.regNo = String(regNo).trim().toUpperCase();
      if (rating !== undefined) {
        const numRating = Number(rating);
        if (!isNaN(numRating) && numRating >= 1 && numRating <= 5) {
          feedback.rating = numRating;
        }
      }
      if (comment) feedback.comment = comment.trim();
      if (category) feedback.category = category.trim();
      if (status && ["approved", "hidden", "needs_review"].includes(status)) {
        feedback.status = status;
      }
      feedback.updatedAt = new Date();
      const updated = await feedback.save();

      try {
        const studentRoute = require("./student");
        if (typeof studentRoute.clearStudentCache === "function") {
          studentRoute.clearStudentCache(feedback.regNo);
        }
      } catch (_) {}

      try {
        const { publishStudentRealtimeEvent, publishAdminRealtimeEvent } = require("../utils/ablyService");
        if (typeof publishStudentRealtimeEvent === "function" && feedback.regNo) {
          const normReg = String(feedback.regNo).trim().toUpperCase();
          publishStudentRealtimeEvent(normReg, "feedback-status-changed", {
            hasSubmittedFeedback: true,
            regNo: normReg,
            status: updated.status,
            timestamp: Date.now(),
          }).catch(() => {});
        }
        if (typeof publishAdminRealtimeEvent === "function") {
          publishAdminRealtimeEvent("feedback-updated", { timestamp: Date.now() }).catch(() => {});
        }
      } catch (_) {}

      return res.json(updated);
    }


    // Student edit: verify ownership
    if (!requesterRegNo || requesterRegNo !== feedback.regNo.toUpperCase()) {
      return res.status(403).json({ message: "You are not authorized to edit this review." });
    }

    // Check 24-hour window
    const createdAtMs = new Date(feedback.createdAt).getTime();
    const isWithin24Hours = (Date.now() - createdAtMs) <= (24 * 60 * 60 * 1000);
    if (!isWithin24Hours) {
      return res.status(403).json({
        message: "Editing is locked. Reviews can only be edited within 24 hours of submission.",
        expired: true,
      });
    }

    const { rating, comment, category } = req.body;
    if (rating !== undefined) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5." });
      }
      feedback.rating = numRating;
      if (numRating <= 2) {
        feedback.status = "needs_review";
      } else if (feedback.status === "needs_review") {
        feedback.status = "approved";
      }
    }

    if (comment) {
      const trimmedComment = comment.trim();
      const commentCheck = validateFeedbackComment(trimmedComment, feedback.name);
      if (!commentCheck.isValid) {
        return res.status(400).json({ message: commentCheck.error });
      }
      feedback.comment = trimmedComment;
    }

    if (category && typeof category === "string") {
      feedback.category = category.trim();
    }

    feedback.updatedAt = new Date();
    const updated = await feedback.save();

    try {
      const studentRoute = require("./student");
      if (typeof studentRoute.clearStudentCache === "function") {
        studentRoute.clearStudentCache(feedback.regNo);
      }
    } catch (_) {}

    return res.json(updated);
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ message: "Server Error updating feedback" });
  }
});

// DELETE /api/feedback/:id - Delete feedback (Admin anytime, or Student owner)
router.delete("/:id", async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ message: "Invalid feedback ID format" });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    const isAdmin = checkIsAdmin(req);
    const requesterRegNo = (
      req.body?.studentRegNo ||
      req.query?.studentRegNo ||
      req.headers["x-student-regno"] ||
      ""
    ).toString().trim().toUpperCase();

    if (!isAdmin && (!requesterRegNo || requesterRegNo !== feedback.regNo.toUpperCase())) {
      return res.status(403).json({ message: "You are not authorized to delete this review." });
    }

    const deletedRegNo = feedback.regNo;
    await feedback.deleteOne();

    try {
      const studentRoute = require("./student");
      if (typeof studentRoute.clearStudentCache === "function") {
        studentRoute.clearStudentCache(deletedRegNo);
      }
    } catch (_) {}

    try {
      const { publishStudentRealtimeEvent, publishAdminRealtimeEvent } = require("../utils/ablyService");
      if (typeof publishStudentRealtimeEvent === "function" && deletedRegNo) {
        const normReg = String(deletedRegNo).trim().toUpperCase();
        publishStudentRealtimeEvent(normReg, "feedback-status-changed", {
          hasSubmittedFeedback: false,
          regNo: normReg,
          timestamp: Date.now(),
        }).catch(() => {});
      }
      if (typeof publishAdminRealtimeEvent === "function") {
        publishAdminRealtimeEvent("feedback-updated", { timestamp: Date.now() }).catch(() => {});
      }
    } catch (_) {}

    return res.json({ message: "Feedback deleted successfully", deletedId: req.params.id, regNo: deletedRegNo });

  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Server Error deleting feedback" });
  }
});

module.exports = router;
