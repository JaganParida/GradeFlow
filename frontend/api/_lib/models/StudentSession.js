const mongoose = require("mongoose");

const studentSessionSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    deviceInfo: {
      userAgent: { type: String, default: "" },
      ip: { type: String, default: "" },
      platform: { type: String, default: "" },
    },
    loggedInAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.StudentSession || mongoose.model("StudentSession", studentSessionSchema);
