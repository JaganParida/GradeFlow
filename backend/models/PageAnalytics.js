const mongoose = require("mongoose");

const pageAnalyticsSchema = new mongoose.Schema(
  {
    route: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    pageTitle: {
      type: String,
      default: "",
      trim: true,
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Keep a bounded set of unique visitor hashes for accurate distinct user count
    visitorTokens: {
      type: [String],
      default: [],
      select: false, // Don't fetch the full tokens array on general queries for high performance
    },
    lastVisitedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Helpful index for sorting by popularity
pageAnalyticsSchema.index({ totalViews: -1 });

module.exports =
  mongoose.models.PageAnalytics ||
  mongoose.model("PageAnalytics", pageAnalyticsSchema);
