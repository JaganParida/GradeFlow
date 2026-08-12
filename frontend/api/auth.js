const connectToDatabase = require("./_lib/db");
const Admin = require("./_lib/models/Admin");
const jwt = require("jsonwebtoken");

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
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

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectToDatabase();
    const action = req.query.action;
    const cookies = parseCookies(req.headers.cookie);

    if (action === "login" && req.method === "POST") {
      const { email, password } = req.body || {};
      const admin = await Admin.findOne({ email });
      if (!admin || !(await admin.comparePassword(password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign(
        { id: admin._id, email: admin.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      const cookieOptions = [
        `jwt=${token}`,
        `Path=/`,
        `HttpOnly`,
        `Secure`,
        `SameSite=None`,
        `Max-Age=${24 * 60 * 60}`,
      ].join("; ");
      res.setHeader("Set-Cookie", cookieOptions);
      return res.json({ success: true, email: admin.email });
    }

    if (action === "logout" && req.method === "POST") {
      const cookieOptions = [
        `jwt=`,
        `Path=/`,
        `HttpOnly`,
        `Secure`,
        `SameSite=None`,
        `Max-Age=0`,
      ].join("; ");
      res.setHeader("Set-Cookie", cookieOptions);
      return res.status(200).json({ success: true, message: "User logged out" });
    }

    if (action === "me" && req.method === "GET") {
      let token = cookies.jwt;
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }
      if (!token || token === "none" || token === "") {
        return res.json({ success: false, message: "Not logged in" });
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id).select("-password");
        if (!admin) {
          return res.json({ success: false, message: "Admin not found" });
        }
        return res.json({ success: true, admin });
      } catch {
        return res.json({ success: false, message: "Token invalid or expired" });
      }
    }

    return res.status(404).json({ message: "Auth action not found" });
  } catch (err) {
    console.error("Vercel Serverless Auth Error:", err);
    return res.status(500).json({ message: err.message || "Server error", error: err.toString() });
  }
};
