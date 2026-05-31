const mongoose = require("mongoose");

const rankingSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true },
    studentName: String,
    branch: String,
    batch: String,
    semester: Number,
    sgpa: Number,
    cgpa: Number,
    deptRank: Number,
    universityRank: Number,
    cgpaRank: Number,
    sgpaRank: Number,
    percentile: Number,
    totalStudents: Number,
    deptStudents: Number,
  },
  { timestamps: true },
);

rankingSchema.index({ semester: 1, branch: 1 });

module.exports = mongoose.model("Ranking", rankingSchema);
