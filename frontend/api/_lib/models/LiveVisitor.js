const mongoose = require("mongoose");

const liveVisitorSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    regNo: {
      type: String,
      default: null,
      index: true,
      uppercase: true,
      trim: true,
    },
    studentName: {
      type: String,
      default: "Guest Visitor",
      trim: true,
    },
    branch: {
      type: String,
      default: "General",
      trim: true,
    },
    batch: {
      type: String,
      default: "2023",
      trim: true,
    },
    currentRoute: {
      type: String,
      default: "/",
      trim: true,
    },
    pageTitle: {
      type: String,
      default: "Home / Landing",
      trim: true,
    },
    deviceType: {
      type: String,
      default: "Desktop",
    },
    os: {
      type: String,
      default: "Unknown",
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    ip: {
      type: String,
      default: "",
    },
    isGuest: {
      type: Boolean,
      default: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 300, // MongoDB TTL: automatically purged after 5 minutes of no pings
    },
  },
  { timestamps: true }
);

liveVisitorSchema.index({ lastSeenAt: -1 });

module.exports =
  mongoose.models.LiveVisitor ||
  mongoose.model("LiveVisitor", liveVisitorSchema);
