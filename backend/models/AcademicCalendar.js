const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    slNo: { type: Number, required: true },
    name: { type: String, required: true },
    schedule: { type: String, required: true },
    startDate: { type: String, default: "" }, // YYYY-MM-DD
    endDate: { type: String, default: "" }, // YYYY-MM-DD
    category: {
      type: String,
      enum: ["academic", "exam", "sports", "break", "event", "general"],
      default: "academic",
    },
    location: { type: String, default: "" },
  },
  { _id: false }
);

const academicCalendarSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      required: true,
      default: "2026-27",
      trim: true,
    },
    semesterType: {
      type: String,
      enum: ["odd", "even", "general"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    semestersLabel: {
      type: String,
      default: "",
    },
    activities: [activitySchema],
    uploadedBy: {
      type: String,
      default: "Admin",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AcademicCalendar", academicCalendarSchema);
