const mongoose = require("mongoose");

const attendanceComponentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, uppercase: true }, // PP, PR, TUT, etc.
    attended: { type: Number, default: 0, min: 0 },
    delivered: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const savedSubjectSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true },
    code: { type: String, default: "" },
    components: [attendanceComponentSchema],
    section: { type: String, default: "" },
    weeklyOccurrences: { type: Array, default: [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, unique: true, index: true },
    section: { type: String, default: "CSE-A" },
    targetGoal: { type: Number, default: 75 },
    savedSubjects: [savedSubjectSchema],
    dailyLogs: {
      type: Map,
      of: Object, // Key: YYYY-MM-DD, Value: { "0": "present", "1": "present" }
      default: {},
    },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
