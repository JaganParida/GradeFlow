/**
 * Centralized Developer & Special Student Privilege Management (Vercel Serverless)
 * Single source of truth for developer roll number & privilege configuration.
 * Configured dynamically via environment variables (CWE-798 Defense).
 */

const DEFAULT_DEVELOPER_REGNO = "230301120327";

function getDeveloperRegNo() {
  const envVal = process.env.DEVELOPER_STUDENT_REGNO || process.env.SPECIAL_STUDENT_REGNO;
  return (envVal && typeof envVal === "string" ? envVal : DEFAULT_DEVELOPER_REGNO)
    .trim()
    .toUpperCase();
}

function isDeveloperOrSpecialStudent(regNo) {
  if (!regNo || typeof regNo !== "string") return false;
  const clean = regNo.trim().toUpperCase();
  return clean === getDeveloperRegNo();
}

function getDeveloperDailyOtpMax() {
  const envVal = parseInt(process.env.DEVELOPER_DAILY_OTP_MAX, 10);
  return !isNaN(envVal) && envVal > 0 ? envVal : 5;
}

function getDeveloperMaxDevices() {
  const envVal = parseInt(process.env.DEVELOPER_MAX_DEVICES, 10);
  return !isNaN(envVal) && envVal > 0 ? envVal : 2;
}

module.exports = {
  getDeveloperRegNo,
  isDeveloperOrSpecialStudent,
  getDeveloperDailyOtpMax,
  getDeveloperMaxDevices,
  DEFAULT_DEVELOPER_REGNO,
};
