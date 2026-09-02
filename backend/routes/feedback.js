const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const { protect } = require("../middleware/auth");
const { requirePermission } = require("../middleware/rbac");
const { publicLimiter } = require("../middleware/rateLimiters");
const { validateFeedbackInput } = require("../middleware/validation");

const jwt = require("jsonwebtoken");

// GET /api/feedback - Retrieve all feedbacks (sorted newest first, regNo included for admin moderation)
router.get("/", async (req, res) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.jwt && req.cookies.jwt !== "none") {
      token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.headers["x-admin-token"]) {
      token = req.headers["x-admin-token"];
    }

    let isAdmin = false;
    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        if (decoded && (decoded.role === "admin" || decoded.adminType === "subadmin" || decoded.email)) {
          isAdmin = true;
        }
      } catch {}
    }

    const selectFields = isAdmin
      ? "name regNo rating comment category likes createdAt"
      : "name rating comment category likes createdAt";

    const feedbacks = await Feedback.find()
      .select(selectFields)
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ message: "Server Error fetching feedbacks" });
  }
});

// POST /api/feedback - Submit new feedback with strict schema validation
router.post("/", publicLimiter, validateFeedbackInput, async (req, res) => {
  try {
    const { name, regNo, rating, comment, category } = req.body;

    if (!name || !rating || !comment) {
      return res.status(400).json({ message: "Name, rating, and comment are required." });
    }

    const newFeedback = new Feedback({
      name,
      regNo,
      rating,
      comment,
      category: category || "Overall Experience",
    });

    const savedFeedback = await newFeedback.save();
    res.status(201).json(savedFeedback);
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(500).json({ message: "Server Error saving feedback" });
  }
});

// POST /api/feedback/:id/like - Increment likes on a feedback (rate-limited)
router.post("/:id/like", publicLimiter, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    
    feedback.likes = (feedback.likes || 0) + 1;
    await feedback.save();
    
    res.json(feedback);
  } catch (error) {
    console.error("Error liking feedback:", error);
    res.status(500).json({ message: "Server Error liking feedback" });
  }
});

// PUT /api/feedback/:id - Update a feedback (admin only)
router.put("/:id", protect, requirePermission("feedback.view", "feedback"), async (req, res) => {
  try {
    const { name, regNo, rating, comment } = req.body;
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    
    if (name) feedback.name = name;
    if (regNo) feedback.regNo = regNo;
    if (rating) feedback.rating = rating;
    if (comment) feedback.comment = comment;
    
    const updatedFeedback = await feedback.save();
    res.json(updatedFeedback);
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ message: "Server Error updating feedback" });
  }
});

// DELETE /api/feedback/:id - Delete a feedback (admin only)
router.delete("/:id", protect, requirePermission("feedback.view", "feedback"), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    
    await feedback.deleteOne();
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Server Error deleting feedback" });
  }
});

module.exports = router;
