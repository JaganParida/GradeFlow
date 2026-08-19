const mongoose = require("mongoose");

const otpVerificationSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, index: true },
    email: { type: String, required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB automatic TTL cleanup
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OtpVerification", otpVerificationSchema);
