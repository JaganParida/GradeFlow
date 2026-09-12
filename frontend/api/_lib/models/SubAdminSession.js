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
    revokedAt: { type: Date, default: null },
    revokeReason: { type: String, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

subAdminSessionSchema.index({ sessionId: 1, isActive: 1 });
subAdminSessionSchema.index({ subAdminId: 1, isActive: 1, expiresAt: 1 });
subAdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.SubAdminSession || mongoose.model("SubAdminSession", subAdminSessionSchema);
