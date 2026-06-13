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
export const FAIL_GRADES = Object.freeze(["F", "R", "S", "M"]);

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

export function isSem5RepeatProject(subject = {}, semester, gradeOverride) {
  const credit = Number(subject.credit);
  const grade = normalizeGrade(gradeOverride ?? subject.grade);
  const text = `${subject.type || ""} ${subject.subName || ""}`.toLowerCase();

  return (
    Number(semester) === 5 &&
    grade === "R" &&
    (credit === 6 || text.includes("proj") || text.includes("project"))
  );
}

export function calculateSemesterMetrics(subjects = [], semester) {
  let totalWeighted = 0;
  let totalCredits = 0;
  let displayTotalCredits = 0;
  let creditsCleared = 0;

  (subjects || []).forEach((subject) => {
    const credit = Number(subject.credit) || 0;
    
    if (credit > 0) {
      displayTotalCredits += credit;
    }

    if (isSem5RepeatProject(subject, semester)) return;

    const grade = normalizeGrade(subject.grade);
    const gradePoint = getGradePoint(grade);

    if (credit > 0 && gradePoint !== undefined) {
      totalWeighted += credit * gradePoint;
      totalCredits += credit;

      if (!FAIL_GRADES.includes(grade)) {
        creditsCleared += credit;
      }
    }
  });

  return {
    totalWeighted,
    totalCredits,
    displayTotalCredits,
    creditsCleared,
    sgpa: totalCredits > 0 ? trunc2(totalWeighted / totalCredits) : 0,
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
  let numerator = 0;
  let denominator = 0;

  (results || [])
    .filter((result) => Number(result.semester) <= maxSemester)
    .sort((a, b) => Number(a.semester) - Number(b.semester))
    .forEach((result) => {
      const { sgpa: calculatedSgpa, totalCredits } = calculateSemesterMetrics(
        result.subjects,
        result.semester,
      );
      const sgpa = typeof result.sgpa === 'number' ? result.sgpa : calculatedSgpa;

      if (totalCredits > 0) {
        numerator += sgpa * totalCredits;
        denominator += totalCredits;
      }
    });

  return denominator > 0 ? trunc2(numerator / denominator) : 0;
}
