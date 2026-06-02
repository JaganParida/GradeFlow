const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");

// GET /api/feedback - Retrieve all feedbacks (sorted newest first)
router.get("/", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ message: "Server Error fetching feedbacks" });
  }
});

// POST /api/feedback - Submit new feedback
router.post("/", async (req, res) => {
  try {
    const { name, regNo, rating, comment } = req.body;

    if (!name || !rating || !comment) {
      return res.status(400).json({ message: "Name, rating, and comment are required." });
    }

    const newFeedback = new Feedback({
      name,
      regNo,
      rating,
      comment,
    });

    const savedFeedback = await newFeedback.save();
    res.status(201).json(savedFeedback);
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(500).json({ message: "Server Error saving feedback" });
  }
});

module.exports = router;
