/**
 * domainHelper.js
 *
 * Centralized utility for domain and environment checks.
 * Detects legacy retired domains (e.g. grade-flow-navy) and migration preview modes.
 * Ensures the migration screen remains 100% clean and isolated without interference
 * from new-version onboarding modals, feedback prompts, or background auth cycles.
 */

export const NEW_ORIGIN = "https://grade-flow-six.vercel.app";

/**
 * Returns true if the current runtime environment is the retired legacy domain
 * or has migration preview flags active.
 */
export function isOldDomainEnvironment() {
  if (typeof window === "undefined") return false;
  try {
    const host = window.location.hostname.toLowerCase();
    if (host.includes("grade-flow-navy") || host.includes("gradeflow-navy")) {
      return true;
    }
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("migration") === "1" ||
      params.get("migration") === "true" ||
      params.get("domain") === "1"
    ) {
      return true;
    }
  } catch (_) {}
  return false;
}
