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
    cgpa: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

semesterResultSchema.index({ regNo: 1, semester: 1 }, { unique: true });
semesterResultSchema.index({ batch: 1, branch: 1, semester: 1 });
semesterResultSchema.index({ batch: 1, semester: 1 });

const { calculateSemesterMetrics } = require("../utils/gradeCalculations");

semesterResultSchema.pre("save", function (next) {
  if (this.subjects && this.subjects.length > 0) {
    const metrics = calculateSemesterMetrics(this.subjects, this.semester);
    this.totalCredits = metrics.totalCredits;
    this.creditsCleared = metrics.creditsCleared;
    this.sgpa = metrics.sgpa;
  }
  next();
});

module.exports = mongoose.model("SemesterResult", semesterResultSchema);

