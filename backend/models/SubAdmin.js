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

  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$") || this.password.startsWith("$2y$")) {
    for (const v of variants) {
      try {
        if (await bcrypt.compare(v, this.password)) {
          return true;
        }
      } catch (_) {}
    }
  }

  for (const v of variants) {
    if (v === this.password) return true;
  }
  return false;
};

module.exports = mongoose.models.SubAdmin || mongoose.model("SubAdmin", subAdminSchema);
