const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const studentSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    passwordHash: { type: String, default: null },
    passwordCreatedAt: { type: Date, default: null },
    role: { type: String, default: "student" },
    failedPasswordAttempts: { type: Number, default: 0 },
    lastFailedPasswordAt: { type: Date, default: null },
    lockedUntil: { type: Date, default: null },
    lastEmailSentAt: { type: Date },
    lastEmailStatus: { type: String, enum: ['SUCCESS', 'FAILED'] },
    lastEmailError: { type: String },
    lastTopperEmailSentAt: { type: Date },
    lastTopperEmailStatus: { type: String, enum: ['SUCCESS', 'FAILED'] },
    lastTopperEmailError: { type: String }
  },
  { timestamps: true }
);

studentSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

studentSchema.methods.setPassword = async function (plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, 12);
  this.passwordCreatedAt = new Date();
  this.failedPasswordAttempts = 0;
  this.lastFailedPasswordAt = null;
  this.lockedUntil = null;
};

module.exports = mongoose.models.Student || mongoose.model("Student", studentSchema);
