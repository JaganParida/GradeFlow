const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, unique: true, index: true },
    tenthPercentage: { type: Number, default: null },
    twelfthPercentage: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
