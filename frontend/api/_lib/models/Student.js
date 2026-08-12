const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, unique: true, index: true },
    lastEmailSentAt: { type: Date },
    lastEmailStatus: { type: String, enum: ['SUCCESS', 'FAILED'] },
    lastEmailError: { type: String },
    lastTopperEmailSentAt: { type: Date },
    lastTopperEmailStatus: { type: String, enum: ['SUCCESS', 'FAILED'] },
    lastTopperEmailError: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Student || mongoose.model("Student", studentSchema);
