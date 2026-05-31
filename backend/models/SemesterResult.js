const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  slNo: Number,
  subCode: String,
  subName: String,
  type: String,
  credit: Number,
  grade: String,
  gradePoint: Number,
  resultType: {
    type: String,
    enum: ["regular", "eod", "backlog", "supplementary"],
    default: "regular",
  },
});

const semesterResultSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, index: true },
    studentName: String,
    branch: String,
    batch: String,
    program: String,
    semester: { type: Number, required: true },
    session: String,
    subjects: [subjectSchema],
    totalCredits: Number,
    creditsCleared: Number,
    sgpa: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

semesterResultSchema.index({ regNo: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model("SemesterResult", semesterResultSchema);
