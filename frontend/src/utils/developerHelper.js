/**
 * Frontend Developer & Special Student Helper
 * Centralizes the developer identity check and allows dynamic configuration
 * via VITE_SPECIAL_STUDENT_REGNO while defaulting to the legacy developer roll number.
 */

export const DEFAULT_DEVELOPER_REGNO = "230301120327";

export function getDeveloperRegNo() {
  const envVal = import.meta.env?.VITE_DEVELOPER_STUDENT_REGNO || import.meta.env?.VITE_SPECIAL_STUDENT_REGNO;
  return (envVal && typeof envVal === "string" ? envVal : DEFAULT_DEVELOPER_REGNO)
    .trim()
    .toUpperCase();
}

export function isDeveloperOrSpecialStudent(regNo) {
  if (!regNo || typeof regNo !== "string") return false;
  return regNo.trim().toUpperCase() === getDeveloperRegNo();
}

export function getDeveloperMaxDevices() {
  const envVal = import.meta.env?.VITE_DEVELOPER_MAX_DEVICES;
  const parsed = parseInt(envVal, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

export function getDeveloperDailyOtpMax() {
  const envVal = import.meta.env?.VITE_DEVELOPER_DAILY_OTP_MAX;
  const parsed = parseInt(envVal, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}
