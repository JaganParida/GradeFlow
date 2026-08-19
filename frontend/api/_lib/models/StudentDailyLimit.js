const mongoose = require("mongoose");

const studentDailyLimitSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    otpSendCount: { type: Number, default: 0 },
    lastOtpSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

studentDailyLimitSchema.index({ regNo: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.models.StudentDailyLimit || mongoose.model("StudentDailyLimit", studentDailyLimitSchema);
