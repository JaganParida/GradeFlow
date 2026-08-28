const mongoose = require("mongoose");

const periodSlotSchema = new mongoose.Schema(
  {
    slotIndex: { type: Number, default: 0 },
    time: { type: String, default: "" },
    subject: { type: String, default: "Free Time" },
    code: { type: String, default: "" },
    type: { type: String, default: "PP", trim: true },
    faculty: { type: String, default: "" },
    room: { type: String, default: "" },
    isFree: { type: Boolean, default: false },
  },
  { _id: false }
);

const timetableScheduleSchema = new mongoose.Schema(
  {
    batch: {
      type: String,
      required: true,
      trim: true,
      index: true,
    }, // e.g. "2023", "2024", "ALL"
    branch: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    }, // e.g. "CSE", "ECE", "MECH", "ALL"
    year: {
      type: String,
      default: "3",
      trim: true,
    }, // e.g. "1", "2", "3", "4"
    semester: {
      type: String,
      default: "6",
      trim: true,
    }, // e.g. "1", "2", ... "8"
    section: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    }, // e.g. "CSE-A", "CSE-B", "ALL"
    title: {
      type: String,
      default: "",
    },
    schedule: {
      Monday: [periodSlotSchema],
      Tuesday: [periodSlotSchema],
      Wednesday: [periodSlotSchema],
      Thursday: [periodSlotSchema],
      Friday: [periodSlotSchema],
      Saturday: [periodSlotSchema],
    },
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
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for fast lookup of a student's active schedule
timetableScheduleSchema.index({ batch: 1, branch: 1, section: 1, isActive: 1 });

module.exports = mongoose.model("TimetableSchedule", timetableScheduleSchema);
