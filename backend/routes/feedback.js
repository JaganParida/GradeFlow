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

// POST /api/feedback/:id/like - Increment likes on a feedback
router.post("/:id/like", async (req, res) => {
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

// PUT /api/feedback/:id - Update a feedback
router.put("/:id", async (req, res) => {
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

// DELETE /api/feedback/:id - Delete a feedback
router.delete("/:id", async (req, res) => {
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
