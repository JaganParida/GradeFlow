const mongoose = require("mongoose");

const trafficQueueConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global_traffic_config",
      index: true,
    },
    queueEnabled: {
      type: Boolean,
      default: false,
    },
    autoTriggerEnabled: {
      type: Boolean,
      default: true,
    },
    maxActiveCapacity: {
      type: Number,
      default: 200,
      min: 1,
    },
    queueMessage: {
      type: String,
      default: "We are currently experiencing high student traffic. You have been placed in a virtual queue to ensure smooth access.",
      maxlength: 500,
    },
    estimatedWaitPerStudentSeconds: {
      type: Number,
      default: 15,
      min: 1,
      max: 300,
    },
    updatedBy: {
      type: String,
      default: "admin",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.TrafficQueueConfig ||
  mongoose.model("TrafficQueueConfig", trafficQueueConfigSchema);
