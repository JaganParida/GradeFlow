const mongoose = require("mongoose");

const otpVerificationSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, index: true },
    email: { type: String, required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.OtpVerification || mongoose.model("OtpVerification", otpVerificationSchema);
