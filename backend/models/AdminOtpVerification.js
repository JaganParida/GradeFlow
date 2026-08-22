const mongoose = require("mongoose");

const adminOtpVerificationSchema = new mongoose.Schema(
  {
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // 5 minutes TTL
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminOtpVerification", adminOtpVerificationSchema);
