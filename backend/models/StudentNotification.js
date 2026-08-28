const mongoose = require("mongoose");

const StudentNotificationSchema = new mongoose.Schema(
  {
    notificationId: {
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
    type: {
      type: String,
      enum: ["LOGIN_APPROVAL_REQUEST", "SECURITY_NOTICE", "SYSTEM_ALERT"],
      default: "LOGIN_APPROVAL_REQUEST",
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    approvalRequestId: {
      type: String,
      default: null,
      index: true,
    },
    targetSessionId: {
      type: String,
      default: null,
      index: true,
    },
    requestingDevice: {
      deviceType: { type: String, default: "Desktop" },
      os: { type: String, default: "Unknown" },
      browser: { type: String, default: "Unknown" },
      platform: { type: String, default: "Unknown" },
      ip: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["UNREAD", "READ", "APPROVED", "DENIED", "EXPIRED"],
      default: "UNREAD",
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying unread and active notifications by student
StudentNotificationSchema.index({ regNo: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("StudentNotification", StudentNotificationSchema);
