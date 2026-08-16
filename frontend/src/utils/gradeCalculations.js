export const GRADE_POINTS = Object.freeze({
  O: 10,
  E: 9,
  A: 8,
  B: 7,
  C: 6,
  D: 5,
  F: 2,
  R: 0,
  M: 0,
  S: 0,
});

export const PASSING_GRADES = Object.freeze(["O", "E", "A", "B", "C", "D"]);
export const FAIL_GRADES = Object.freeze(["R", "S", "M", "F"]);
export const NON_PASSING_GRADES = Object.freeze(["R", "S", "M", "F"]);

const ROUNDING_EPSILON = 1e-8;

export function normalizeGrade(grade) {
  return String(grade || "").trim().toUpperCase();
}

export function trunc2(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.floor((num + ROUNDING_EPSILON) * 100) / 100;
}

export function round2(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + ROUNDING_EPSILON) * 100) / 100;
}

export function getGradePoint(grade) {
  return GRADE_POINTS[normalizeGrade(grade)];
}

export function isSem5ProjectException(subject = {}, semester) {
  const credit = Number(subject.credit);
  const type = String(subject.type || "").trim().toLowerCase();
  const grade = normalizeGrade(subject.grade);

  const isProject = type === "project";

  if (Number(semester) === 5 && isProject) {
    if (credit === 6) return true;
    if (credit === 8) return true;
    if (credit === 4 && grade === "R") return true;
  }

  return false;
}

export function calculateSemesterMetrics(subjects = [], semester) {
  let totalWeighted = 0;
  let totalCredits = 0;
  let creditsCleared = 0;
  let creditsForDivisor = 0;

  (subjects || []).forEach((subject) => {
    if (isSem5ProjectException(subject, semester)) return;

    const credit = Number(subject.credit) || 0;
    const grade = normalizeGrade(subject.grade);
    const gradePoint = getGradePoint(grade);

    if (credit > 0 && gradePoint !== undefined) {
      totalCredits += credit;

      if (grade === "F") {
        totalWeighted += credit * 2; // F has 2 points per credit (2 * credit)
        creditsForDivisor += credit; // Included in SGPA total credits divisor
        // NOT cleared (creditsCleared not incremented, treated as active backlog)
      } else if (!FAIL_GRADES.includes(grade)) {
        totalWeighted += credit * gradePoint;
        creditsCleared += credit;
        creditsForDivisor += credit;
      }
    }
  });

  const divisor = creditsForDivisor > 0 ? creditsForDivisor : totalCredits;

  return {
    totalWeighted,
    totalCredits,
    creditsCleared,
    creditsForDivisor: divisor,
    sgpa: divisor > 0 ? trunc2(totalWeighted / divisor) : 0,
  };
}

export function calculateSGPA(subjects = [], semester) {
  return calculateSemesterMetrics(subjects, semester).sgpa;
}

export function calculateCGPA(results = [], upToSemester = null) {
  const maxSemester =
    upToSemester === null || upToSemester === undefined
      ? Infinity
      : Number(upToSemester);
  let totalNumerator = 0;
  let totalDenominator = 0;

  (results || [])
    .filter((result) => Number(result.semester) <= maxSemester)
    .sort((a, b) => Number(a.semester) - Number(b.semester))
    .forEach((result) => {
      const hasSubjects = Array.isArray(result.subjects) && result.subjects.length > 0;
      let totalWeighted = 0;
      let divisor = 0;

      if (hasSubjects) {
        const metrics = calculateSemesterMetrics(result.subjects, result.semester);
        totalWeighted = metrics.totalWeighted;
        divisor = metrics.creditsForDivisor;
      } else {
        const total = Number(result.totalCredits) || 0;
        const cleared = Number(result.creditsCleared) || 0;
        divisor = total > 0 ? total : cleared;
        const sgpa = typeof result.sgpa === "number" ? result.sgpa : 0;
        totalWeighted = sgpa * divisor;
      }

      if (divisor > 0) {
        totalNumerator += totalWeighted;
        totalDenominator += divisor;
      }
    });

  return totalDenominator > 0 ? trunc2(totalNumerator / totalDenominator) : 0;
}
