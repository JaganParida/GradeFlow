const mongoose = require("mongoose");

const routeQuotaBreakdownSchema = new mongoose.Schema(
  {
    route: { type: String, required: true },
    pageTitle: { type: String, default: "" },
    requestCount: { type: Number, default: 0 },
    bytesEstimated: { type: Number, default: 0 },
    lastRequestedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const vercelQuotaMetricSchema = new mongoose.Schema(
  {
    dateStr: {
      type: String,
      required: true,
      unique: true,
      index: true, // Format: YYYY-MM-DD (IST)
    },
    monthStr: {
      type: String,
      required: true,
      index: true, // Format: YYYY-MM (IST)
    },
    dayOfWeek: {
      type: Number,
      default: 0, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    estimatedBandwidthBytes: {
      type: Number,
      default: 0,
    },
    uniqueStudents: {
      type: Number,
      default: 0,
    },
    hourlyRequests: {
      type: [Number],
      default: () => new Array(24).fill(0),
    },
    routeBreakdown: [routeQuotaBreakdownSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.VercelQuotaMetric ||
  mongoose.model("VercelQuotaMetric", vercelQuotaMetricSchema);
