const connectToDatabase = require("./_lib/db");
const Feedback = require("./_lib/models/Feedback");
const jwt = require("jsonwebtoken");

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie",
};

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = rest.join("=");
  });
  return cookies;
}

function verifyAdmin(req) {
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies.jwt;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token || token === "none") return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectToDatabase();
    const feedbackId = req.query.id;

    if (req.method === "GET" && !feedbackId) {
      const feedbacks = await Feedback.find().sort({ createdAt: -1 });
      return res.json(feedbacks);
    }

    if (req.method === "POST" && !feedbackId) {
      const { name, regNo, rating, comment, category } = req.body || {};
      if (!name || typeof name !== "string" || name.trim().length < 1 || name.trim().length > 100) {
        return res.status(400).json({ message: "Name is required and must be between 1 and 100 characters." });
      }
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({ message: "Rating must be a number between 1 and 5." });
      }
      if (!regNo || typeof regNo !== "string" || !/^[a-zA-Z0-9]{5,20}$/.test(regNo.trim())) {
        return res.status(400).json({ message: "A valid student Registration Number is required to submit a review." });
      }
      const newFeedback = new Feedback({
        name: name.trim(),
        regNo: String(regNo).trim(),
        rating: numRating,
        comment: comment.trim(),
        category: typeof category === "string" && category.trim() ? category.trim() : "Overall Experience",
      });
      const savedFeedback = await newFeedback.save();
      return res.status(201).json(savedFeedback);
    }

    if (req.method === "POST" && feedbackId && req.query.action === "like") {
      const feedback = await Feedback.findById(feedbackId);
      if (!feedback) return res.status(404).json({ message: "Feedback not found" });
      feedback.likes = (feedback.likes || 0) + 1;
      await feedback.save();
      return res.json(feedback);
    }

    if (req.method === "PUT" && feedbackId) {
      if (!verifyAdmin(req)) return res.status(401).json({ message: "Not authorized" });
      const feedback = await Feedback.findById(feedbackId);
      if (!feedback) return res.status(404).json({ message: "Feedback not found" });
      const { name, regNo, rating, comment } = req.body || {};
      if (name) feedback.name = name;
      if (regNo) feedback.regNo = regNo;
      if (rating) feedback.rating = rating;
      if (comment) feedback.comment = comment;
      const updatedFeedback = await feedback.save();
      return res.json(updatedFeedback);
    }

    if (req.method === "DELETE" && feedbackId) {
      if (!verifyAdmin(req)) return res.status(401).json({ message: "Not authorized" });
      const feedback = await Feedback.findById(feedbackId);
      if (!feedback) return res.status(404).json({ message: "Feedback not found" });
      await feedback.deleteOne();
      return res.json({ message: "Feedback deleted successfully" });
    }

    return res.status(404).json({ message: "Route not found" });
  } catch (err) {
    console.error("Vercel Serverless Feedback Error:", err);
    return res.status(500).json({ message: err.message || "Server error", error: err.toString() });
  }
};
