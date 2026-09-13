const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  if (candidatePassword === undefined || candidatePassword === null) return false;

  let clean = String(candidatePassword);
  try {
    clean = clean.normalize("NFKC");
  } catch (_) {}

  // 1. Canonical Bcrypt comparison (single execution, avoids CPU loop)
  if (
    this.password.startsWith("$2a$") ||
    this.password.startsWith("$2b$") ||
    this.password.startsWith("$2y$")
  ) {
    try {
      if (await bcrypt.compare(clean, this.password)) {
        return true;
      }
    } catch (_) {}
    // Safe compatibility: only test trimmed variant if input actually differed from trimmed
    const trimmed = clean.trim();
    if (trimmed !== clean && trimmed.length > 0) {
      try {
        if (await bcrypt.compare(trimmed, this.password)) {
          return true;
        }
      } catch (_) {}
    }
  }

  // 2. Legacy plaintext migration fallback (instant string comparison ~0ms CPU)
  if (clean === this.password || clean.trim() === this.password) {
    try {
      this.password = clean;
      await this.save();
    } catch (_) {}
    return true;
  }

  return false;
};

module.exports = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
