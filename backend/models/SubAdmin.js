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

subAdminSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.SubAdmin || mongoose.model("SubAdmin", subAdminSchema);
