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

module.exports = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
