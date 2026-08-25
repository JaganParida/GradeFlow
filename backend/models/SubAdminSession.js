const mongoose = require("mongoose");

const subAdminSessionSchema = new mongoose.Schema(
  {
    subAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "SubAdmin", required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    deviceInfo: {
      userAgent: { type: String, default: "" },
      ip: { type: String, default: "" },
      platform: { type: String, default: "" },
    },
    loggedInAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) }, // Permanent session (no auto-expiration)
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.SubAdminSession || mongoose.model("SubAdminSession", subAdminSessionSchema);
