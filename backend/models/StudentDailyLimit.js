const mongoose = require("mongoose");

const studentDailyLimitSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, index: true },
    dateKey: { type: String, required: true, index: true }, // Format: YYYY-MM-DD in Asia/Kolkata timezone
    otpSendCount: { type: Number, default: 0 },
    lastOtpSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index so each regNo has only one record per dayKey
studentDailyLimitSchema.index({ regNo: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("StudentDailyLimit", studentDailyLimitSchema);
