const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminEmail: { type: String, required: true, index: true },
    action: { type: String, required: true },
    route: { type: String, default: "" },
    targetRegNo: { type: String, index: true },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.AdminAuditLog || mongoose.model("AdminAuditLog", adminAuditLogSchema);
