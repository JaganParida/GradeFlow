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
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SystemConfig ||
  mongoose.model("SystemConfig", systemConfigSchema);
