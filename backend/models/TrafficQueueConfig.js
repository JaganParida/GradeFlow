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
    // Master switch for manual queue mode
    queueEnabled: {
      type: Boolean,
      default: false,
    },
    // Whether to auto-activate the queue when active student count reaches or exceeds maxActiveCapacity
    autoTriggerEnabled: {
      type: Boolean,
      default: true,
    },
    // Maximum concurrent active users allowed on the site before queue takes effect (Default: 200)
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
