const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { protect } = require("../middleware/auth");
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
      { expiresIn: "1d" },
    );
    
    const isProd = process.env.NODE_ENV === "production";
    const options = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
      httpOnly: true, // Prevents XSS attacks
      secure: isProd, // HTTPS required in production
      sameSite: isProd ? "none" : "lax", // Cross-site cookie support
      path: "/",
    };
    
    res.cookie("jwt", token, options);
    res.json({ success: true, email: admin.email });
  } catch (err) {
    console.error("Auth login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const options = {
    expires: new Date(0), // Instantly expire in 1970
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };
  res.cookie("jwt", "", options);
  res.clearCookie("jwt", options);
  res.status(200).json({ success: true, message: "User logged out" });
});

router.get("/me", async (req, res) => {
  try {
    let token;
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token || token === "none" || token === "") {
      return res.json({ success: false, message: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");
    
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }
    
    res.json({ success: true, admin });
  } catch (err) {
    res.json({ success: false, message: "Token invalid or expired" });
  }
});

module.exports = router;
