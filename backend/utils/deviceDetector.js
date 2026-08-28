/**
 * High-fidelity device, OS, and browser detector for GradeFlow session metadata.
 */
function extractRequestDeviceInfo(req) {
  const userAgent = String(req.headers?.["user-agent"] || "").trim();
  const ip = String(
    req.ip || req.headers?.["x-forwarded-for"] || req.connection?.remoteAddress || ""
  )
    .split(",")[0]
    .trim();

  // 1. Detect Device Type
  let deviceType = "Desktop";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry|bb10/i.test(userAgent)) {
    deviceType = "Mobile";
  } else if (/tablet|ipad|android(?!.*mobile)|kindle|playbook/i.test(userAgent)) {
    deviceType = "Tablet";
  }

  // 2. Detect Operating System
  let os = "Desktop";
  if (/windows nt 10\.0/i.test(userAgent)) os = "Windows 10/11";
  else if (/windows nt 6\.3/i.test(userAgent)) os = "Windows 8.1";
  else if (/windows nt 6\.2/i.test(userAgent)) os = "Windows 8";
  else if (/windows nt 6\.1/i.test(userAgent)) os = "Windows 7";
  else if (/windows/i.test(userAgent)) os = "Windows";
  else if (/macintosh|mac os x/i.test(userAgent)) os = "macOS";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/iphone/i.test(userAgent)) os = "iOS (iPhone)";
  else if (/ipad/i.test(userAgent)) os = "iPadOS";
  else if (/cros/i.test(userAgent)) os = "Chrome OS";
  else if (/linux/i.test(userAgent)) os = "Linux";
  else if (deviceType === "Mobile") os = "Mobile Device";

  // 3. Detect Browser
  let browser = "Web Browser";
  if (/edg\//i.test(userAgent)) browser = "Microsoft Edge";
  else if (/samsungbrowser/i.test(userAgent)) browser = "Samsung Internet";
  else if (/opr\/|opera/i.test(userAgent)) browser = "Opera";
  else if (/chrome|crios/i.test(userAgent) && !/edg\//i.test(userAgent)) browser = "Google Chrome";
  else if (/firefox|fxios/i.test(userAgent)) browser = "Mozilla Firefox";
  else if (/safari/i.test(userAgent) && !/chrome|crios|android/i.test(userAgent)) browser = "Apple Safari";
  else if (/brave/i.test(userAgent)) browser = "Brave";
  else if (/ucbrowser/i.test(userAgent)) browser = "UC Browser";

  const platform = `${os} • ${browser}`;

  return {
    deviceType,
    os,
    browser,
    platform,
    ip,
    userAgent: userAgent.slice(0, 180),
  };
}

module.exports = {
  extractRequestDeviceInfo,
};
