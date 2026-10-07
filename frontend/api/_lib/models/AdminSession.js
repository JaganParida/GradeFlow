const mongoose = require("mongoose");

const adminSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    deviceInfo: {
      userAgent: { type: String, default: "" },
      ip: { type: String, default: "" },
      platform: { type: String, default: "" },
    },
    loggedInAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    revokedAt: { type: Date, default: null },
    revokeReason: { type: String, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

adminSessionSchema.index({ sessionId: 1, isActive: 1 });
adminSessionSchema.index({ isActive: 1, expiresAt: 1 });
adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
adminSessionSchema.index({ revokedAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600, sparse: true });

module.exports = mongoose.models.AdminSession || mongoose.model("AdminSession", adminSessionSchema);
