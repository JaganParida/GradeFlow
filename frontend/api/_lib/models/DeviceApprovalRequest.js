const mongoose = require("mongoose");

const DeviceApprovalRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    regNo: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    requestingDeviceInfo: {
      deviceType: { type: String, default: "Desktop" },
      os: { type: String, default: "Unknown" },
      browser: { type: String, default: "Unknown" },
      platform: { type: String, default: "Unknown" },
      ip: { type: String, default: "" },
      userAgent: { type: String, default: "" },
    },
    targetSessionId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "DENIED", "EXPIRED"],
      default: "PENDING",
      index: true,
    },
    approvedSessionId: {
      type: String,
      default: null,
    },
    approvedToken: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    respondedBySessionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

DeviceApprovalRequestSchema.index({ regNo: 1, status: 1, expiresAt: 1 });

module.exports = mongoose.models.DeviceApprovalRequest || mongoose.model("DeviceApprovalRequest", DeviceApprovalRequestSchema);
