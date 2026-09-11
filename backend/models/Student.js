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

  const raw = String(candidatePassword);
  const trimmed = raw.trim();
  const variants = [raw];
  if (trimmed !== raw && trimmed.length > 0) variants.push(trimmed);

  try {
    const nfkcRaw = raw.normalize("NFKC");
    if (!variants.includes(nfkcRaw)) variants.push(nfkcRaw);
    const nfkcTrimmed = trimmed.normalize("NFKC");
    if (!variants.includes(nfkcTrimmed)) variants.push(nfkcTrimmed);
  } catch (_) {}

  try {
    const decoded = decodeURIComponent(raw);
    if (!variants.includes(decoded)) variants.push(decoded);
    const decodedTrim = decoded.trim();
    if (!variants.includes(decodedTrim)) variants.push(decodedTrim);
  } catch (_) {}

  // 1. Standard Bcrypt comparison across all candidate variants
  if (this.passwordHash.startsWith("$2a$") || this.passwordHash.startsWith("$2b$") || this.passwordHash.startsWith("$2y$")) {
    for (const v of variants) {
      try {
        if (await bcrypt.compare(v, this.passwordHash)) {
          return true;
        }
      } catch (_) {}
    }
  }

  // 2. Plaintext / legacy fallback
  for (const v of variants) {
    if (v === this.passwordHash) {
      try {
        this.passwordHash = await bcrypt.hash(v, 12);
        await this.save();
      } catch (_) {}
      return true;
    }
    try {
      const sha256 = crypto.createHash("sha256").update(v).digest("hex");
      if (sha256 === this.passwordHash) {
        this.passwordHash = await bcrypt.hash(v, 12);
        await this.save();
        return true;
      }
    } catch (_) {}
  }

  return false;
};

studentSchema.methods.setPassword = async function (plainPassword) {
  const cleanPass = String(plainPassword || "").trim();
  this.passwordHash = await bcrypt.hash(cleanPass, 12);
  this.passwordCreatedAt = new Date();
  this.failedPasswordAttempts = 0;
  this.lastFailedPasswordAt = null;
  this.lockedUntil = null;
};

module.exports = mongoose.model("Student", studentSchema);

