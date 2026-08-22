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

const NON_PASSING_GRADES = Object.freeze(["M", "S", "R", "F"]);
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

function isSem5ProjectException(subject = {}, semester) {
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

function calculateSemesterMetrics(subjects = [], semester) {
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
      creditsForDivisor += credit; // Every registered course credit is added to Denominator

      if (PASSING_GRADES.includes(grade)) {
        totalWeighted += credit * gradePoint;
        creditsCleared += credit;
      } else if (grade === "F") {
        totalWeighted += credit * 2; // F has 2 points per credit (2 * credit)
        // NOT cleared (creditsCleared not incremented, treated as active backlog)
      } else {
        // S, R, M have 0 points per credit (0 * credit = 0)
        totalWeighted += credit * 0;
        // NOT cleared (treated as backlog)
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

function calculateSGPA(subjects = [], semester) {
  return calculateSemesterMetrics(subjects, semester).sgpa;
}

function calculateCGPA(results = [], upToSemester = null) {
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

function calculateBacklogs(results = []) {
  return (results || []).flatMap((result) =>
    (result.subjects || [])
      .filter((subject) => {
        if (isSem5ProjectException(subject, result.semester)) return false;
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

function calculateBacklogs(results = []) {
  return (results || []).flatMap((result) =>
    (result.subjects || [])
      .filter((subject) => {
        if (isSem5ProjectException(subject, result.semester)) return false;
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

function getSectionFromRegNo(regNo) {
  if (!regNo) return "J";
  const r = String(regNo).trim();
  if (r === "230301180026") return "I";
  
  if (/^\d{2}0301120/.test(r)) {
     const num = parseInt(r.slice(-3), 10);
     if (num >= 1 && num <= 60) return "A";
     if (num >= 61 && num <= 120) return "B";
     if (num >= 121 && num <= 180) return "C";
     if (num >= 181 && num <= 240) return "D";
     if (num >= 241 && num <= 300) return "E";
     if (num >= 301 && num <= 360) return "F";
     if (num >= 361 && num <= 420) return "G";
     if (num >= 421 && num <= 480) return "H";
     if (num >= 481 && num <= 549) return "I";
  }
  return "J";
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
  getSectionFromRegNo,
  isSem5ProjectException,
  normalizeGrade,
  round2,
  sortByScore,
  trunc2,
};
