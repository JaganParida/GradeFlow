const mongoose = require("mongoose");

const otpRequestLogSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, index: true },
    studentName: { type: String, default: "Student" },
    dateKey: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["DELIVERED", "FAILED", "BLOCKED", "RATE_LIMITED"],
      required: true,
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ["DELIVERED", "FAILED", "NOT_SENT"],
      default: "NOT_SENT",
    },
    provider: {
      type: String,
      enum: ["BREVO", "GMAIL", "NONE", "ALL_FAILED"],
      default: "NONE",
    },
    failoverOccurred: { type: Boolean, default: false },
    primaryFailureReason: { type: String, default: null },
    reason: { type: String, default: "OTP Request" },
    deviceInfo: {
      deviceType: { type: String, default: "Unknown" },
      os: { type: String, default: "Unknown" },
      browser: { type: String, default: "Unknown" },
      platform: { type: String, default: "Unknown" },
      ip: { type: String, default: "" },
      userAgent: { type: String, default: "" },
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

otpRequestLogSchema.index({ regNo: 1, timestamp: -1 });
otpRequestLogSchema.index({ dateKey: 1, status: 1 });

module.exports = mongoose.models.OtpRequestLog || mongoose.model("OtpRequestLog", otpRequestLogSchema);
