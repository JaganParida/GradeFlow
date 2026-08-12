const connectToDatabase = require("../lib/utils/db");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const mongoose = await connectToDatabase();
    return res.status(200).json({
      status: "ok",
      name: "GradeFlow Vercel Serverless API",
      dbStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};
