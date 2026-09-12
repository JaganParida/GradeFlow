const mongoose = require("mongoose");

const studentSessionSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, index: true, uppercase: true, trim: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String, index: true },
    tokenHash: { type: String, default: "" },
    deviceInfo: {
      deviceType: { type: String, default: "Desktop" },
      os: { type: String, default: "Unknown" },
      browser: { type: String, default: "Unknown" },
      platform: { type: String, default: "" },
      ip: { type: String, default: "" },
      userAgent: { type: String, default: "" },
      currentRoute: { type: String, default: "/dashboard" },
      pageTitle: { type: String, default: "Student Dashboard" },
    },
    currentRoute: { type: String, default: "/dashboard" },
    pageTitle: { type: String, default: "Student Dashboard" },
    loggedInAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) },
    revokedAt: { type: Date, default: null },
    revokeReason: { type: String, default: null },
    loggedOutAt: { type: Date, default: null },
    logoutType: { type: String, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

studentSessionSchema.index({ regNo: 1, isActive: 1, expiresAt: 1 });
studentSessionSchema.index({ regNo: 1, sessionId: 1, isActive: 1 });
studentSessionSchema.index({ sessionId: 1, isActive: 1 });
studentSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
studentSessionSchema.index({ revokedAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600, sparse: true });

module.exports = mongoose.models.StudentSession || mongoose.model("StudentSession", studentSessionSchema);
