const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, unique: true, index: true },
    lastEmailSentAt: { type: Date },
    lastEmailStatus: { type: String, enum: ['SUCCESS', 'FAILED'] },
    lastEmailError: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
