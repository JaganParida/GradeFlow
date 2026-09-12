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
    lastTopperEmailSentAt: { type: Date },
    lastTopperEmailStatus: { type: String, default: null },
    lastTopperEmailError: { type: String }
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

module.exports = mongoose.models.Student || mongoose.model("Student", studentSchema);

