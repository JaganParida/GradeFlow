const mongoose = require("mongoose");

const routeVisitSchema = new mongoose.Schema(
  {
    route: { type: String, required: true },
    pageTitle: { type: String, default: "" },
    durationSeconds: { type: Number, default: 0 },
    visitCount: { type: Number, default: 1 },
    weeklyVisitCount: { type: Number, default: 1 },
    hourlyActivity: {
      type: [Number],
      default: () => new Array(24).fill(0),
    },
    mostActiveTimeSlot: {
      type: String,
      default: "General",
    },
    lastVisitedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const studentRouteActivitySchema = new mongoose.Schema(
  {
    regNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    studentName: {
      type: String,
      default: "Student",
      trim: true,
    },
    branch: {
      type: String,
      default: "General",
      trim: true,
    },
    batch: {
      type: String,
      default: "N/A",
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
    currentRoute: {
      type: String,
      default: "/",
    },
    currentPageTitle: {
      type: String,
      default: "Home / Landing",
    },
    timeSpentCurrentRoute: {
      type: Number,
      default: 0,
    },
    totalTimeSpentSeconds: {
      type: Number,
      default: 0,
    },
    totalPageViews: {
      type: Number,
      default: 1,
    },
    mostVisitedRoute: {
      type: String,
      default: "/",
    },
    lastActiveRoute: {
      type: String,
      default: "/",
    },
    lastActivePageTitle: {
      type: String,
      default: "Home / Landing",
    },
    mostTimeSpentRoute: {
      type: String,
      default: "/",
    },
    mostTimeSpentPageTitle: {
      type: String,
      default: "Home / Landing",
    },
    mostTimeSpentSeconds: {
      type: Number,
      default: 0,
    },
    mostVisitedCount: {
      type: Number,
      default: 1,
    },
    hourlyActivity: {
      type: [Number],
      default: () => new Array(24).fill(0),
    },
    mostActiveTimeSlot: {
      type: String,
      default: "General",
    },
    dayOfWeekActivity: {
      type: [Number],
      default: () => new Array(7).fill(0),
    },
    mostActiveDay: {
      type: String,
      default: "General",
    },
    visitsToday: {
      type: Number,
      default: 1,
    },
    visitsThisWeek: {
      type: Number,
      default: 1,
    },
    lastVisitDateStr: {
      type: String,
      default: "",
    },
    lastVisitWeekStr: {
      type: String,
      default: "",
    },
    visitedRoutes: [routeVisitSchema],
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

studentRouteActivitySchema.index({ lastActiveAt: -1 });

module.exports =
  mongoose.models.StudentRouteActivity ||
  mongoose.model("StudentRouteActivity", studentRouteActivitySchema);
