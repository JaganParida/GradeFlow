const mongoose = require("mongoose");

const holidayItemSchema = new mongoose.Schema(
  {
    slNo: { type: Number, required: true },
    title: { type: String, required: true },
    date: { type: String, required: true }, // e.g. "01.01.2027"
    day: { type: String, required: true }, // e.g. "Friday"
    type: {
      type: String,
      enum: ["holiday", "observation", "optional", "break", "other"],
      default: "holiday",
    },
    isOptional: { type: Boolean, default: false },
    isObservation: { type: Boolean, default: false },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const academicHolidaySchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      required: true,
      default: "2026-27",
      trim: true,
    },
    title: {
      type: String,
      default: "CUTM Academic Session Holidays List",
    },
    holidays: [holidayItemSchema],
    optionalRules: {
      description: {
        type: String,
        default:
          "University remains open and instructional classes run as scheduled on optional holidays. Maximum 2 optional leaves can be availed per year.",
      },
      optionalList: [
        {
          slNo: Number,
          name: String,
          date: String,
          day: String,
        },
      ],
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
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AcademicHoliday", academicHolidaySchema);
