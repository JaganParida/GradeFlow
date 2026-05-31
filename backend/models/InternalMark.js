const mongoose = require("mongoose");

const internalMarkSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, index: true },
    studentName: String,
    branch: String,
    program: String,
    session: String,
    semester: { type: Number, required: true },
    subjects: [
      {
        subCode: String,
        subName: String,
        type: { type: String },
        midSemObtained: Number,
        midSemMax: Number,
        midSemRoundOff: Number,
        presentationObtained: Number,
        presentationMax: Number,
        presentationRoundOff: Number,
        assignmentObtained: Number,
        assignmentMax: Number,
        assignmentRoundOff: Number,
        learningRecordObtained: Number,
        learningRecordMax: Number,
        learningRecordRoundOff: Number,
        internalPracticalObtained: Number,
        internalPracticalMax: Number,
        internalPracticalRoundOff: Number,
        projectInternalObtained: Number,
        projectInternalMax: Number,
        projectInternalRoundOff: Number,
        totalScore: Number,
        totalMax: Number,
      },
    ],
  },
  { timestamps: true },
);

internalMarkSchema.index({ regNo: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model("InternalMark", internalMarkSchema);
