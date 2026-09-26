const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const studentSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    passwordHash: { type: String, default: null },
    passwordCreatedAt: { type: Date, default: null },
    role: { type: String, default: "student" },
    passwordResetTokenHash: { type: String, default: null, index: true },
    passwordResetExpiresAt: { type: Date, default: null },
    failedPasswordAttempts: { type: Number, default: 0 },
    lastFailedPasswordAt: { type: Date, default: null },
    lockedUntil: { type: Date, default: null },
    recoveryRestrictedUntil: { type: Date, default: null },
    recoveryOtpSentAt: { type: Date, default: null },
    recoveryOtpCount: { type: Number, default: 0 },
    lastEmailSentAt: { type: Date },
    lastEmailStatus: { type: String, default: null },
    lastEmailError: { type: String },
    lastBacklogEmailSentAt: { type: Date },
    lastBacklogEmailStatus: { type: String, default: null },
    lastBacklogEmailError: { type: String },
    lastTopperEmailSentAt: { type: Date },
    lastTopperEmailStatus: { type: String, default: null },
    lastTopperEmailError: { type: String },
    // Portal Access Control & Block Fields
    isBlocked: { type: Boolean, default: false, index: true },
    blockType: { type: String, enum: ["temporary", "permanent", null], default: null },
    blockedUntil: { type: Date, default: null, index: true },
    blockedReason: { type: String, default: "" },
    blockedAt: { type: Date, default: null },
    blockedBy: { type: String, default: null }
  },
  { timestamps: true }
);

studentSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  if (candidatePassword === undefined || candidatePassword === null) return false;

  let clean = String(candidatePassword);
  try {
    clean = clean.normalize("NFKC");
  } catch (_) {}
  clean = clean.trim();

  // 1. Standard Bcrypt comparison (single execution, avoids CPU loop)
  if (
    this.passwordHash.startsWith("$2a$") ||
    this.passwordHash.startsWith("$2b$") ||
    this.passwordHash.startsWith("$2y$")
  ) {
    try {
      if (await bcrypt.compare(clean, this.passwordHash)) {
        return true;
      }
    } catch (_) {}
  }

  // 2. Legacy plaintext or raw SHA256 migration fallback
  if (clean === this.passwordHash) {
    try {
      this.passwordHash = await bcrypt.hash(clean, 12);
      await this.save();
    } catch (_) {}
    return true;
  }
  try {
    const sha256 = crypto.createHash("sha256").update(clean).digest("hex");
    if (sha256 === this.passwordHash) {
      this.passwordHash = await bcrypt.hash(clean, 12);
      await this.save();
      return true;
    }
  } catch (_) {}

  return false;
};

studentSchema.methods.setPassword = async function (plainPassword) {
  let cleanPass = String(plainPassword || "");
  try {
    cleanPass = cleanPass.normalize("NFKC");
  } catch (_) {}
  cleanPass = cleanPass.trim();

  this.passwordHash = await bcrypt.hash(cleanPass, 12);
  this.passwordCreatedAt = new Date();
  this.failedPasswordAttempts = 0;
  this.lastFailedPasswordAt = null;
  this.lockedUntil = null;
  this.recoveryRestrictedUntil = null;
  this.recoveryOtpSentAt = null;
  this.recoveryOtpCount = 0;
  this.passwordResetTokenHash = null;
  this.passwordResetExpiresAt = null;
};

studentSchema.methods.isCurrentlyBlocked = function () {
  if (!this.isBlocked) return false;
  if (this.blockType === "permanent") return true;
  if (this.blockType === "temporary" && this.blockedUntil) {
    return new Date() < new Date(this.blockedUntil);
  }
  return Boolean(this.isBlocked);
};

studentSchema.statics.isStudentBlocked = function (studentDoc) {
  if (!studentDoc || !studentDoc.isBlocked) return false;
  if (studentDoc.blockType === "permanent") return true;
  if (studentDoc.blockType === "temporary" && studentDoc.blockedUntil) {
    return new Date() < new Date(studentDoc.blockedUntil);
  }
  return Boolean(studentDoc.isBlocked);
};

const StudentModel = mongoose.models.Student || mongoose.model("Student", studentSchema);
StudentModel.isStudentBlocked = studentSchema.statics.isStudentBlocked;

module.exports = StudentModel;

