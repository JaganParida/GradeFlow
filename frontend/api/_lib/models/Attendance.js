const mongoose = require("mongoose");

const attendanceComponentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, uppercase: true },
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
      of: Object,
      default: {},
    },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
