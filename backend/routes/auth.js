const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({ token, email: admin.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
