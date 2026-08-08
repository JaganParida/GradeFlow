const mongoose = require("mongoose");

const batchPurgeLogSchema = new mongoose.Schema(
  {
    batch: { type: String, required: true },
    purgedAt: { type: Date, default: Date.now },
    recordsDeleted: { type: Number, default: 0 },
    studentsAffected: { type: Number, default: 0 },
    sampleRegNos: [{ type: String }],
    triggerReason: { type: String, default: "5-Year Batch Retention Limit Reached" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BatchPurgeLog", batchPurgeLogSchema);
