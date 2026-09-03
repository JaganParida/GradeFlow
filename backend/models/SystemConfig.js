const mongoose = require("mongoose");

const systemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // For maintenance mode configuration
    maintenance: {
      enabled: {
        type: Boolean,
        default: false,
      },
      message: {
        type: String,
        default: "",
        maxlength: 300,
      },
      enabledAt: {
        type: Date,
        default: null,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: String,
        default: "",
      },
    },
    // For manual / auto admin portal button visibility control
    adminButtonVisibility: {
      mode: {
        type: String,
        enum: ["AUTO", "MANUAL"],
        default: "AUTO",
      },
      allowedRoles: {
        mainAdmin: { type: Boolean, default: true },
        subAdmin: { type: Boolean, default: true },
        specialStudent: { type: Boolean, default: true }, // 230301120327
        allStudents: { type: Boolean, default: false },
        guests: { type: Boolean, default: false },
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SystemConfig ||
  mongoose.model("SystemConfig", systemConfigSchema);
