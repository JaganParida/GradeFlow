const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    actorEmail: { type: String, required: true, index: true },
    actorType: { type: String, enum: ["main_admin", "subadmin", "unknown"], default: "main_admin", index: true },
    action: { type: String, required: true, index: true },
    actionType: { type: String, default: "MANAGEMENT" },
    route: { type: String, default: "" },
    targetId: { type: String, default: "", index: true },
    targetRegNo: { type: String, index: true },
    result: { type: String, enum: ["SUCCESS", "FORBIDDEN", "DENIED", "FAILED"], default: "SUCCESS", index: true },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.AdminAuditLog || mongoose.model("AdminAuditLog", adminAuditLogSchema);
