const mongoose = require("mongoose");

const attendanceScanLogSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, index: true, uppercase: true, trim: true },
    studentName: { type: String, default: "Student" },
    scannedAt: { type: Date, default: Date.now, index: true },
    dateKey: { type: String, required: true, index: true }, // Format: YYYY-MM-DD in Asia/Kolkata
    engine: { type: String, default: "gemini_vision" }, // gemini_vision | tesseract_fallback
    modelUsed: { type: String, default: "" },
    subjectsDetected: { type: Number, default: 0 },
    isReset: { type: Boolean, default: false, index: true },
    resetAt: { type: Date, default: null },
    resetBy: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound index for querying daily student scans efficiently
attendanceScanLogSchema.index({ regNo: 1, dateKey: 1, isReset: 1 });
attendanceScanLogSchema.index({ scannedAt: -1 });

module.exports = mongoose.models.AttendanceScanLog || mongoose.model("AttendanceScanLog", attendanceScanLogSchema);
