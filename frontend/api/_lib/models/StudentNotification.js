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
      enum: [
        "LOGIN_APPROVAL_REQUEST",
        "SECURITY_NOTICE",
        "SYSTEM_ALERT",
        "BROADCAST_ANNOUNCEMENT",
        "RESULT_ANNOUNCEMENT",
        "TIMETABLE_UPDATE",
        "FEATURE_EXPLORE",
        "URGENT_ALERT",
      ],
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
    primaryButton: {
      label: { type: String, default: "Check Now" },
      action: { type: String, default: "NAVIGATE" },
      targetRoute: { type: String, default: "" },
    },
    secondaryButton: {
      label: { type: String, default: "Understood" },
      action: { type: String, default: "DISMISS" },
    },
    badge: {
      type: String,
      default: "Announcement",
    },
    badgeColor: {
      type: String,
      default: "blue",
    },
    sender: {
      name: { type: String, default: "Admin Team" },
      role: { type: String, default: "ADMIN" },
    },
    targetAudience: {
      type: String,
      default: "ALL",
      index: true,
    },
    readBy: [
      {
        regNo: { type: String, uppercase: true },
        readAt: { type: Date, default: Date.now },
        actionTaken: { type: String, default: "CHECK_NOW" },
      },
    ],
    dismissedBy: [
      {
        type: String,
        uppercase: true,
      },
    ],
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

StudentNotificationSchema.index({ regNo: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.StudentNotification || mongoose.model("StudentNotification", StudentNotificationSchema);
