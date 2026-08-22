const mongoose = require("mongoose");

const adminOtpVerificationSchema = new mongoose.Schema(
  {
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.AdminOtpVerification || mongoose.model("AdminOtpVerification", adminOtpVerificationSchema);
