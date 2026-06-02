const GRADE_POINTS = Object.freeze({
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

const NON_PASSING_GRADES = Object.freeze(["F", "M", "S", "R"]);
const PASSING_GRADES = Object.freeze(["O", "E", "A", "B", "C", "D"]);
const ROUNDING_EPSILON = 1e-8;

function normalizeGrade(grade) {
  return String(grade || "").trim().toUpperCase();
}

function trunc2(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.floor((num + ROUNDING_EPSILON) * 100) / 100;
}

function round2(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + ROUNDING_EPSILON) * 100) / 100;
}

function getGradePoint(grade) {
  return GRADE_POINTS[normalizeGrade(grade)];
}

function isSem5RepeatProject(subject = {}, semester) {
  const credit = Number(subject.credit);
  const text = `${subject.type || ""} ${subject.subName || ""}`.toLowerCase();

  return (
    Number(semester) === 5 &&
    normalizeGrade(subject.grade) === "R" &&
    (credit === 6 || text.includes("proj") || text.includes("project"))
  );
}

function calculateSemesterMetrics(subjects = [], semester) {
  let totalWeighted = 0;
  let totalCredits = 0;
  let creditsCleared = 0;

  (subjects || []).forEach((subject) => {
    if (isSem5RepeatProject(subject, semester)) return;

    const credit = Number(subject.credit) || 0;
    const grade = normalizeGrade(subject.grade);
    const gradePoint = getGradePoint(grade);

    if (credit > 0 && gradePoint !== undefined) {
      totalWeighted += credit * gradePoint;
      totalCredits += credit;

      if (!NON_PASSING_GRADES.includes(grade)) {
        creditsCleared += credit;
      }
    }
  });

  return {
    totalWeighted,
    totalCredits,
    creditsCleared,
    sgpa: totalCredits > 0 ? trunc2(totalWeighted / totalCredits) : 0,
  };
}

function calculateSGPA(subjects = [], semester) {
  return calculateSemesterMetrics(subjects, semester).sgpa;
}

function calculateCGPA(results = [], upToSemester = null) {
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
      const { sgpa, totalCredits } = calculateSemesterMetrics(
        result.subjects,
        result.semester,
      );

      if (totalCredits > 0) {
        numerator += sgpa * totalCredits;
        denominator += totalCredits;
      }
    });

  return denominator > 0 ? round2(numerator / denominator) : 0;
}

function calculateBacklogs(results = []) {
  return (results || []).flatMap((result) =>
    (result.subjects || [])
      .filter((subject) => {
        if (isSem5RepeatProject(subject, result.semester)) return false;
        return NON_PASSING_GRADES.includes(normalizeGrade(subject.grade));
      })
      .map((subject) => ({
        subName: subject.subName,
        subCode: subject.subCode,
        credit: subject.credit,
        grade: normalizeGrade(subject.grade),
        semester: result.semester,
      })),
  );
}

function sortByScore(records, primaryKey, secondaryKey) {
  records.sort((a, b) => {
    const primaryDiff = (Number(b[primaryKey]) || 0) - (Number(a[primaryKey]) || 0);
    if (primaryDiff !== 0) return primaryDiff;

    if (secondaryKey) {
      const secondaryDiff =
        (Number(b[secondaryKey]) || 0) - (Number(a[secondaryKey]) || 0);
      if (secondaryDiff !== 0) return secondaryDiff;
    }

    return String(a.regNo || "").localeCompare(String(b.regNo || ""));
  });
}

function assignCompetitionRanks(records, scoreKey, rankKey) {
  let currentRank = 1;
  let previousScore = null;

  records.forEach((record, index) => {
    const score = Number(record[scoreKey]) || 0;

    if (index === 0) {
      currentRank = 1;
    } else if (score < previousScore) {
      currentRank++;
    }

    record[rankKey] = currentRank;
    previousScore = score;
  });
}

module.exports = {
  GRADE_POINTS,
  NON_PASSING_GRADES,
  PASSING_GRADES,
  assignCompetitionRanks,
  calculateBacklogs,
  calculateCGPA,
  calculateSemesterMetrics,
  calculateSGPA,
  getGradePoint,
  isSem5RepeatProject,
  normalizeGrade,
  round2,
  sortByScore,
  trunc2,
};
