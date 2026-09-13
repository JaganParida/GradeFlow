const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const subAdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "disabled", "revoked", "inactive"],
      default: "active",
      index: true,
    },
    role: { type: String, default: "subadmin" },
    permissions: {
      routes: { type: [String], default: [] },       // e.g. ["overview", "toppers", "backlogs"]
      sections: { type: [String], default: [] },     // e.g. ["overview.upload-results", "toppers.view"]
      actions: { type: [String], default: [] },      // e.g. ["students.view", "students.update", "results.upload"]
    },
    createdBy: { type: String, default: "main_admin" },
    lastLoginAt: { type: Date },
    lastActiveAt: { type: Date },
  },
  { timestamps: true }
);

subAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

subAdminSchema.methods.comparePassword = async function (candidatePassword) {
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

module.exports = mongoose.models.SubAdmin || mongoose.model("SubAdmin", subAdminSchema);
