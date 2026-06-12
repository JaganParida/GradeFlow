const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    // Fallback for API testing (e.g., Postman) if needed
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || token === "none") return res.status(401).json({ message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = { protect };
