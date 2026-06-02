const express = require("express");
const router = express.Router();
const multer = require("multer");
const XLSX = require("xlsx");
const { protect } = require("../middleware/auth");
const SemesterResult = require("../models/SemesterResult");
const InternalMark = require("../models/InternalMark");
const Ranking = require("../models/Ranking");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// SGPA logic based on custom grade points mapping
const GRADE_POINTS = {
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
};
const NON_PASSING_GRADES = ["F", "M", "S", "R"];

// SGPA: ALL grades contribute (F=2, R=0, S=0, M=0 per official grade table).
// Only exception: Sem 5 R-grade 6-credit project is fully excluded.
function calcSGPA(subjects, semester) {
  let totalWeighted = 0,
    totalCredits = 0;
  subjects.forEach((s) => {
    // Exception: Semester 5, "R" grade, "Project" type, 6 credits → fully skip
    if (
      semester === 5 &&
      s.grade === "R" &&
      s.credit === 6 &&
      s.type &&
      s.type.toLowerCase().includes("proj")
    ) {
      return;
    }

    // All other grades (including F=2, R=0, S=0, M=0) are included
    if (s.credit && GRADE_POINTS[s.grade] !== undefined) {
      totalWeighted += s.credit * GRADE_POINTS[s.grade];
      totalCredits += s.credit;
    }
  });
  return totalCredits > 0
    ? Math.floor((totalWeighted / totalCredits) * 100 + 0.0001) / 100
    : 0;
}

// Flexible column reader — handles any casing/spacing
function col(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
  }
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const found = rowKeys.find(
      (rk) =>
        rk.toLowerCase().replace(/[\s_\.]/g, "") ===
        k.toLowerCase().replace(/[\s_\.]/g, ""),
    );
    if (found && row[found] !== undefined && row[found] !== "")
      return row[found];
  }
  return undefined;
}

// Helper to generate rankings for a specific semester
async function generateRankingForSemester(semester) {
  const results = await SemesterResult.find({ semester: Number(semester) });
  if (!results.length) return;

  const studentData = [];
  for (const r of results) {
    const allResults = await SemesterResult.find({ regNo: r.regNo }).sort({
      semester: 1,
    });
    let cgpaNumerator = 0,
      cgpaDenominator = 0;

    // Group subjects by semester to calculate SGPA per semester
    const sems = [...new Set(allResults.map((r) => r.semester))];
    sems.forEach((sem) => {
      let semW = 0,
        semC = 0;
      allResults
        .filter((r) => r.semester === sem)
        .forEach((ar) => {
          ar.subjects.forEach((s) => {
            // Exception: Sem 5 R-grade 6-credit project → fully skip
            if (
              Number(ar.semester) === 5 &&
              s.grade === "R" &&
              (s.credit === 6 ||
                (s.subName && s.subName.toLowerCase().includes("project")))
            ) {
              return;
            }
            // All other grades (F=2, R=0, S=0, M=0) are included per official formula
            if (s.credit && GRADE_POINTS[s.grade] !== undefined) {
              semW += s.credit * GRADE_POINTS[s.grade];
              semC += s.credit;
            }
          });
        });

      if (semC > 0) {
        let semSGPA = Math.floor((semW / semC) * 100 + 0.0001) / 100;
        cgpaNumerator += semSGPA * semC;
        cgpaDenominator += semC;
      }
    });

    const cgpa =
      cgpaDenominator > 0
        ? Math.floor((cgpaNumerator / cgpaDenominator) * 100 + 0.0001) / 100
        : 0;
    studentData.push({
      regNo: r.regNo,
      studentName: r.studentName,
      branch: r.branch,
      batch: r.batch,
      semester: Number(semester),
      sgpa: r.sgpa,
      cgpa,
    });
  }

  // Calculate CGPA Rank
  studentData.sort((a, b) => b.cgpa - a.cgpa);
  let cgpaRank = 1;
  studentData.forEach((s, i) => {
    if (i > 0 && s.cgpa < studentData[i - 1].cgpa) cgpaRank++;
    s.cgpaRank = cgpaRank;
  });

  // Calculate SGPA Rank
  studentData.sort((a, b) => b.sgpa - a.sgpa);
  let sgpaRank = 1;
  studentData.forEach((s, i) => {
    if (i > 0 && s.sgpa < studentData[i - 1].sgpa) sgpaRank++;
    s.universityRank = sgpaRank; // keep for backward compat
    s.sgpaRank = sgpaRank;
    s.totalStudents = studentData.length;
    s.percentile = parseFloat(
      ((1 - (sgpaRank - 1) / studentData.length) * 100).toFixed(1),
    );
  });

  const byBranch = {};
  studentData.forEach((s) => {
    if (!byBranch[s.branch]) byBranch[s.branch] = [];
    byBranch[s.branch].push(s);
  });
  Object.values(byBranch).forEach((group) => {
    group.sort((a, b) => b.sgpa - a.sgpa);
    let dr = 1;
    group.forEach((s, i) => {
      if (i > 0 && s.sgpa < group[i - 1].sgpa) dr = i + 1;
      s.deptRank = dr;
      s.deptStudents = group.length;
    });
  });

  if (studentData.length > 0) {
    const bulkOps = studentData.map((s) => ({
      updateOne: {
        filter: { regNo: s.regNo, semester: Number(semester) },
        update: { $set: s },
        upsert: true,
      },
    }));
    await Ranking.bulkWrite(bulkOps);
  }
}

// Upload semester results
router.post(
  "/upload/results",
  protect,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const wb = XLSX.read(req.file.buffer, { type: "buffer" });
      const formSemester = req.body.semester;
      const formBatch = req.body.batch;
      const formProgram = req.body.program;
      const formSession = req.body.session;
      const uploadType = req.body.uploadType || "regular";

      const grouped = {};
      let totalParsedRows = 0;

      function detectBranch(regNo) {
        if (!regNo) return "";
        const r = String(regNo).trim();

        // Exact Matches (Exceptions)
        if (r === "230301180026") return "CSE";
        if (
          [
            "230301120110",
            "230301120186",
            "230301120371",
            "230301120481",
          ].includes(r)
        )
          return "ECE";
        if (r === "230301231033") return "AERO";

        // Prefixes
        if (r.startsWith("230301110") || r.startsWith("230301111"))
          return "CIVIL";
        if (r.startsWith("230301120") || r.startsWith("230301121"))
          return "CSE";
        if (
          r.startsWith("230301130") ||
          r.startsWith("230301131") ||
          r.startsWith("230301132")
        )
          return "ECE";
        if (r.startsWith("230301150") || r.startsWith("230301151"))
          return "EEE";
        if (r.startsWith("230301160") || r.startsWith("230301161")) return "ME";
        if (r.startsWith("230301180")) return "BIO";
        if (r.startsWith("230301190") || r.startsWith("230301191")) return "MI";
        if (r.startsWith("230301230")) return "AERO";

        return "";
      }

      wb.SheetNames.forEach((sheetName) => {
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        totalParsedRows += rows.length;

        rows.forEach((row, idx) => {
          const regNo = String(
            col(
              row,
              "Reg_No",
              "RegNo",
              "reg_no",
              "Reg No",
              "Registration No",
              "regno",
            ) || "",
          ).trim();
          const name = String(
            col(row, "Name", "StudentName", "Student Name", "student_name") ||
              "",
          ).trim();
          const subCode = String(
            col(
              row,
              "Subject_Code",
              "SubCode",
              "Sub Code",
              "subject_code",
              "Code",
            ) || "",
          ).trim();
          const subName = String(
            col(row, "Subject_Name", "SubName", "Subject", "subject_name") ||
              "",
          ).trim();
          const type = String(col(row, "Type", "type") || "").trim();

          function parseCredit(val) {
            if (!val && val !== 0) return 0;
            return val
              .toString()
              .split("+")
              .reduce((a, c) => a + parseFloat(c || 0), 0);
          }

          const credit = parseCredit(
            col(row, "Credits", "Credit", "credits", "credit") || 0,
          );
          const grade = String(
            col(row, "New Grade", "NewGrade", "Grade", "grade") || "",
          )
            .trim()
            .toUpperCase();
          const slNo =
            col(
              row,
              "Sl No",
              "SlNo",
              "Sl_No",
              "sl_no",
              "S.No",
              "SNo",
              "SI No",
            ) || idx + 1;

          const semRaw =
            formSemester || col(row, "Semester", "semester", "Sem", "sem");
          let semester = Number(semRaw);
          const batch = String(formBatch || col(row, "Batch", "batch") || "");

          let branch = detectBranch(regNo);
          if (!branch) {
            branch = String(
              col(row, "Branch", "branch") || sheetName || "",
            ).trim();
          }
          const program = String(formProgram || "").trim();
          const session = String(
            formSession || col(row, "Session", "session") || "",
          );

          const isEodOrRecheck =
            uploadType === "eod" || uploadType === "rechecking";

          if (!regNo) {
            console.warn(`Row ${idx + 2}: skipped — missing RegNo`);
            return;
          }

          if (!isEodOrRecheck && (!semester || isNaN(semester))) {
            console.warn(
              `Row ${idx + 2}: skipped — missing Semester for regular upload`,
              { regNo },
            );
            return;
          }

          if (isEodOrRecheck && isNaN(semester)) {
            semester = null;
          }

          if (!grade || !(grade in GRADE_POINTS)) {
            console.warn(
              `Row ${idx + 2}: invalid grade "${grade}" for ${regNo}`,
            );
            return;
          }

          const key =
            isEodOrRecheck && !semester ? regNo : `${regNo}_${semester}`;
          if (!grouped[key]) {
            grouped[key] = {
              regNo,
              studentName: name,
              branch,
              batch,
              program,
              semester,
              session,
              subjects: [],
            };
          }

          grouped[key].subjects.push({
            slNo: Number(slNo),
            subCode,
            subName,
            type,
            credit,
            grade,
            gradePoint: GRADE_POINTS[grade],
            resultType: uploadType,
          });
        });
      });

      const keys = Object.keys(grouped);
      if (!keys.length) {
        return res.status(400).json({
          message:
            "No valid rows found. Check that Semester is provided (either in Excel or the form fields below), and Grade values are valid.",
        });
      }

      let count = 0;
      const affectedSemesters = new Set();
      const bulkOps = [];
      const isEodOrRecheck =
        uploadType === "eod" || uploadType === "rechecking";
      let allExistingRecordsByRegNo = {};

      // ALWAYS fetch all existing records to allow smart merging and prevent downgrading
      const allRegNos = Array.from(new Set(keys.map((k) => grouped[k].regNo)));
      const allExistingRecords = await SemesterResult.find({
        regNo: { $in: allRegNos },
      });
      allExistingRecords.forEach((r) => {
        if (!allExistingRecordsByRegNo[r.regNo])
          allExistingRecordsByRegNo[r.regNo] = [];
        allExistingRecordsByRegNo[r.regNo].push(r);
      });

      for (const key of keys) {
        const data = grouped[key];
        const existingRecords = allExistingRecordsByRegNo[data.regNo] || [];
        const recordsToSave = new Map();

        data.subjects.forEach((newSub) => {
          let targetSem = data.semester;

          if (!targetSem && isEodOrRecheck) {
            const rec = existingRecords.find(
              (r) =>
                r.subjects &&
                r.subjects.some((s) => s.subCode === newSub.subCode),
            );
            if (rec) targetSem = rec.semester;
          }

          if (!targetSem) {
            console.warn(
              `Could not determine semester for subject ${newSub.subCode} for ${data.regNo}`,
            );
            return;
          }

          let record =
            recordsToSave.get(targetSem) ||
            existingRecords.find((r) => r.semester === targetSem);

          if (!record) {
            record = {
              regNo: data.regNo,
              studentName: data.studentName,
              branch: data.branch,
              batch: data.batch,
              program: data.program,
              semester: targetSem,
              session: data.session,
              subjects: [],
            };
          } else {
            record = { ...(record.toObject ? record.toObject() : record) };
            // Forcefully update metadata with newly corrected data from upload
            if (data.branch) record.branch = data.branch;
            if (data.batch) record.batch = data.batch;
            if (data.studentName) record.studentName = data.studentName;
          }

          const existingSub = record.subjects.find(
            (s) => s.subCode === newSub.subCode,
          );
          if (existingSub) {
            const oldGp =
              GRADE_POINTS[existingSub.grade] !== undefined
                ? GRADE_POINTS[existingSub.grade]
                : -1;
            const newGp =
              GRADE_POINTS[newSub.grade] !== undefined
                ? GRADE_POINTS[newSub.grade]
                : -1;

            // Upgrade if grade is better
            if (newGp > oldGp) {
              existingSub.grade = newSub.grade;
              existingSub.gradePoint = newSub.gradePoint;
              if (isEodOrRecheck) existingSub.resultType = newSub.resultType;
            }

            // Always heal missing metadata if the new file has it
            if (!existingSub.credit && newSub.credit)
              existingSub.credit = newSub.credit;
            if (!existingSub.subName && newSub.subName)
              existingSub.subName = newSub.subName;
            if (!existingSub.type && newSub.type)
              existingSub.type = newSub.type;
          } else {
            record.subjects.push(newSub);
          }

          recordsToSave.set(targetSem, record);
          affectedSemesters.add(targetSem);
        });

        for (const [sem, record] of recordsToSave.entries()) {
          // Exclude only the special Sem5 R-project for all credit/SGPA calculations
          const validSubjectsForCalc = record.subjects.filter((s) => {
            if (
              Number(record.semester) === 5 &&
              s.grade === "R" &&
              s.credit === 6 &&
              s.type &&
              s.type.toLowerCase().includes("proj")
            ) {
              return false;
            }
            return true;
          });

          const totalCredits = validSubjectsForCalc.reduce(
            (a, s) => a + (s.credit || 0),
            0,
          );
          // Credits cleared = only passing grades (not F/R/M/S)
          const creditsCleared = validSubjectsForCalc
            .filter((s) => !NON_PASSING_GRADES.includes(s.grade))
            .reduce((a, s) => a + (s.credit || 0), 0);
          const sgpa = calcSGPA(validSubjectsForCalc, record.semester);

          bulkOps.push({
            updateOne: {
              filter: { regNo: data.regNo, semester: sem },
              update: {
                $set: { ...record, totalCredits, creditsCleared, sgpa },
              },
              upsert: true,
            },
          });
          count++;
        }
      }

      if (bulkOps.length > 0) {
        await SemesterResult.bulkWrite(bulkOps);
      }

      // Automatically generate rankings for affected semesters
      for (const sem of affectedSemesters) {
        await generateRankingForSemester(sem);
      }

      res.json({
        message: `✅ Successfully uploaded ${count} student semester record(s) and auto-updated rankings!`,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: err.message });
    }
  },
);

// Upload internal marks
router.post(
  "/upload/internal",
  protect,
  upload.single("file"),
  async (req, res) => {
    try {
      const formSemester = req.body.semester;
      const formProgram = req.body.program;
      const formSession = req.body.session;
      const grouped = {};
      const wb = XLSX.read(req.file.buffer, { type: "buffer" });
      const uploadSemester = Number(formSemester);
      const isSem1Upload = uploadSemester === 1;

      let colMap = {};

      const sem1Assessments = new Set([
        "classTest1",
        "classTest2",
        "classTest3",
        "classTest4",
        "assignment",
        "total",
      ]);
      const regularAssessments = new Set([
        "midSem",
        "presentation",
        "assignment",
        "learningRecord",
        "internalPractical",
        "projectInternal",
        "total",
      ]);

      const compactHeader = (value) =>
        String(value || "")
          .trim()
          .toUpperCase()
          .replace(/[\s\-_.:]+/g, "");

      const detectAssessment = (value) => {
        const val = String(value || "")
          .trim()
          .toUpperCase();
        const compactVal = compactHeader(value);
        if (!compactVal) return null;

        if (compactVal.includes("MIDSEMESTER") || compactVal.includes("MIDSEM"))
          return "midSem";
        if (
          compactVal.includes("CLASSTESTIV") ||
          compactVal.includes("CLASSTEST4") ||
          compactVal.includes("CTIV") ||
          compactVal.includes("CT4")
        )
          return "classTest4";
        if (
          compactVal.includes("CLASSTESTIII") ||
          compactVal.includes("CLASSTEST3") ||
          compactVal.includes("CTIII") ||
          compactVal.includes("CT3")
        )
          return "classTest3";
        if (
          compactVal.includes("CLASSTESTII") ||
          compactVal.includes("CLASSTEST2") ||
          compactVal.includes("CTII") ||
          compactVal.includes("CT2")
        )
          return "classTest2";
        if (
          compactVal.includes("CLASSTESTI") ||
          compactVal.includes("CLASSTEST1") ||
          compactVal.includes("CTI") ||
          compactVal.includes("CT1")
        )
          return "classTest1";
        if (compactVal.includes("PRESENTATION")) return "presentation";
        if (compactVal.includes("ASSIGNMENT")) return "assignment";
        if (compactVal.includes("LEARNINGRECORD")) return "learningRecord";
        if (
          compactVal.includes("INTERNALPRACTICAL") ||
          compactVal.includes("INTERNALPRAC")
        )
          return "internalPractical";
        if (compactVal.includes("PROJECTINTERNAL")) return "projectInternal";
        if (
          compactVal === "TOTAL" ||
          compactVal.includes("TOTALSCORE") ||
          val.includes("TOTAL:")
        )
          return "total";

        return null;
      };

      const isAllowedAssessment = (assessment) =>
        assessment &&
        (isSem1Upload
          ? sem1Assessments.has(assessment)
          : regularAssessments.has(assessment));

      const isMetricHeader = (value) => {
        const cleanVal = compactHeader(value);
        return (
          cleanVal.includes("ROUND") ||
          cleanVal.includes("OBTAINED") ||
          cleanVal.includes("OBT") ||
          cleanVal.includes("MAX")
        );
      };

      const isSubjectNoise = (value) => {
        const val = String(value || "")
          .trim()
          .toLowerCase();
        const compactVal = compactHeader(val);
        return (
          !val ||
          detectAssessment(val) ||
          isMetricHeader(val) ||
          val.includes("semester") ||
          val.includes("student") ||
          val.includes("roll") ||
          val.includes("regno") ||
          val.includes("reg no") ||
          ["SRNO", "SLNO", "SNO", "SINO"].includes(compactVal)
        );
      };

      const hasNumericValue = (value) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !Number.isNaN(Number(value));

      const hasInternalScore = (subject) =>
        Object.entries(subject).some(
          ([key, value]) =>
            (key.endsWith("Obtained") ||
              key.endsWith("RoundOff") ||
              key === "totalScore") &&
            hasNumericValue(value),
        );

      const hasComponentScore = (subject) =>
        Object.entries(subject).some(
          ([key, value]) =>
            (key.endsWith("Obtained") || key.endsWith("RoundOff")) &&
            hasNumericValue(value),
        );

      const normalizeInternalSubject = (subject) => {
        if (!hasComponentScore(subject) && Number(subject.totalScore) === 0) {
          delete subject.totalScore;
        }

        if (isSem1Upload && hasNumericValue(subject.totalScore)) {
          const totalScore = Number(subject.totalScore);
          const componentMax = [
            subject.classTest1Max,
            subject.classTest2Max,
            subject.classTest3Max,
            subject.classTest4Max,
            subject.assignmentMax,
          ]
            .filter(hasNumericValue)
            .reduce((sum, value) => sum + Number(value), 0);

          if (
            !hasNumericValue(subject.totalMax) ||
            Number(subject.totalMax) < totalScore
          ) {
            if (componentMax >= totalScore) {
              subject.totalMax = componentMax;
            } else if (totalScore <= 50) {
              subject.totalMax = 50;
            }
          }
        }

        return subject;
      };

      wb.SheetNames.forEach((sheetName) => {
        const ws = wb.Sheets[sheetName];
        // Read as 2D array to process complex headers
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (!rows || rows.length < 5) return;

        // Find the header row index (where "Student" and "Rollno" usually are)
        let headerRowIdx = -1;
        for (let r = 0; r < Math.min(15, rows.length); r++) {
          const rowStr = rows[r].join("").toLowerCase();
          if (
            rowStr.includes("student") &&
            (rowStr.includes("rollno") || rowStr.includes("regno"))
          ) {
            headerRowIdx = r;
            break;
          }
        }

        try {
          require("fs").writeFileSync(
            require("path").join(__dirname, "../../rows_debug.json"),
            JSON.stringify({ headerRowIdx, rows: rows.slice(0, 10) }, null, 2),
          );
        } catch (e) {}

        // If we can't find a clear header row, default to row 6 (index 5) or 7 (index 6) based on common format
        if (headerRowIdx === -1) headerRowIdx = 6;

        let maxCol = 0;
        for (
          let r = Math.max(0, headerRowIdx - 3);
          r <= headerRowIdx + 2;
          r++
        ) {
          if (rows[r] && rows[r].length > maxCol) maxCol = rows[r].length;
        }

        colMap = {};
        let currentSubject = null;
        let currentAssessment = null;
        let assessmentMetrics = {};

        for (let c = 3; c < maxCol; c++) {
          // Check for Subject (can be above or exactly on headerRowIdx)
          let foundSubject = null;
          for (let r = Math.max(0, headerRowIdx - 3); r <= headerRowIdx; r++) {
            const val = String(rows[r] && rows[r][c] ? rows[r][c] : "")
              .trim()
              .toLowerCase();
            if (val) {
              const subMatch =
                val.match(/-\s*\((.*?)\)\s*\((pp|pr|tut)/i) ||
                val.match(/\((.*?)\)\s*\((pp|pr|tut)/i);
              if (subMatch) {
                foundSubject = {
                  subCode: subMatch[1].toUpperCase(),
                  subName: val.split("-")[0].trim().toUpperCase(),
                  type: subMatch[2].toUpperCase(),
                };
              } else if (val.length > 5 && !isSubjectNoise(val)) {
                foundSubject = {
                  subCode: val.substring(0, 8).toUpperCase(),
                  subName: val.toUpperCase(),
                  type: "PP",
                };
              }
            }
          }
          if (foundSubject) {
            currentSubject = foundSubject;
            currentAssessment = null;
            assessmentMetrics = {};
          }

          // Check for Assessment
          let foundAss = null;
          for (
            let r = Math.max(0, headerRowIdx - 3);
            r <= headerRowIdx + 2;
            r++
          ) {
            const detected = detectAssessment(rows[r] && rows[r][c]);
            if (isAllowedAssessment(detected)) foundAss = detected;
          }
          if (foundAss) {
            if (currentAssessment !== foundAss) {
              currentAssessment = foundAss;
              assessmentMetrics = {};
            }
          }

          // Check for Metric
          let foundMetric = null;
          for (
            let r = Math.max(0, headerRowIdx - 3);
            r <= headerRowIdx + 2;
            r++
          ) {
            const rawText = String(rows[r] && rows[r][c] ? rows[r][c] : "");
            const cleanVal = compactHeader(rawText);
            if (cleanVal.includes("ROUND")) {
              foundMetric = "roundOff";
            } else if (
              cleanVal.includes("OBTAINED") ||
              cleanVal.includes("OBT")
            ) {
              if (!isSem1Upload && assessmentMetrics["obtained"]) {
                // If we already found the main obtained column for this assessment,
                // this second "obtained" is actually the round off column due to split headers.
                foundMetric = "roundOff";
              } else {
                foundMetric = "obtained";
              }
            } else if (cleanVal.includes("MAX")) {
              foundMetric = "max";
            } else if (
              currentAssessment === "total" &&
              cleanVal.includes("TOTALSCORE")
            ) {
              foundMetric = "obtained";
            }
          }

          if (currentSubject && currentAssessment && foundMetric) {
            assessmentMetrics[foundMetric] = true;
            colMap[c] = {
              subject: currentSubject,
              assessment: currentAssessment,
              metric: foundMetric,
            };
          } else if (currentSubject && !currentAssessment && foundMetric) {
            if (foundMetric === "obtained" && assessmentMetrics["obtained"])
              foundMetric = "roundOff";
            assessmentMetrics[foundMetric] = true;
            colMap[c] = {
              subject: currentSubject,
              assessment: "total",
              metric: foundMetric,
            };
          }
        }

        // Parse data rows
        for (let r = headerRowIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;

          let regNo = "";
          let name = "";

          // The rollno is usually in the first few columns
          for (let c = 0; c < Math.min(5, row.length); c++) {
            const val = String(row[c] || "").trim();
            // A typical rollno like 230301120327
            if (val && !isNaN(val) && val.length > 5 && !regNo) {
              regNo = val;
            } else if (
              val &&
              isNaN(val) &&
              val.length > 3 &&
              !val.toLowerCase().includes("sr") &&
              !name
            ) {
              name = val;
            }
          }

          if (!regNo) continue;

          const semester = Number(formSemester);
          const branch = String(sheetName || "").trim();
          const program = String(formProgram || "").trim();
          const session = String(formSession || "").trim();

          const key = `${regNo}_${semester}`;
          if (!grouped[key]) {
            grouped[key] = {
              regNo,
              studentName: name,
              branch,
              program,
              session,
              semester,
              subjectsObj: {},
            };
          }

          for (const c in colMap) {
            const map = colMap[c];
            const rawVal = row[c];
            if (
              rawVal === undefined ||
              rawVal === null ||
              String(rawVal).trim() === "" ||
              String(rawVal).trim() === "-"
            )
              continue;

            const val = Number(rawVal);
            if (isNaN(val)) continue;

            const subjKey = `${map.subject.subCode}_${map.subject.type}`;
            if (!grouped[key].subjectsObj[subjKey]) {
              grouped[key].subjectsObj[subjKey] = {
                subCode: map.subject.subCode,
                subName: map.subject.subName,
                type: map.subject.type,
              };
            }

            let fieldName;
            if (map.assessment === "total") {
              if (map.metric === "obtained") fieldName = "totalScore";
              else if (map.metric === "max") fieldName = "totalMax";
              else continue;
            } else {
              fieldName = `${map.assessment}${map.metric.charAt(0).toUpperCase() + map.metric.slice(1)}`;
            }

            if (grouped[key].subjectsObj[subjKey][fieldName] === undefined) {
              grouped[key].subjectsObj[subjKey][fieldName] = val;
            }
          }
        }

        console.log(
          `Parsed ${Object.keys(colMap).length} valid columns in colMap.`,
        );
        const sampleStudent = grouped[Object.keys(grouped)[0]];
        console.log(
          `Sample student subjectsObj keys:`,
          sampleStudent ? Object.keys(sampleStudent.subjectsObj) : "None",
        );
      });

      try {
        require("fs").writeFileSync(
          require("path").join(__dirname, "../../grouped_debug.json"),
          JSON.stringify(grouped, null, 2),
        );
        require("fs").writeFileSync(
          require("path").join(__dirname, "../../colmap_debug.json"),
          JSON.stringify(colMap, null, 2),
        );
      } catch (e) {}

      let count = 0;
      for (const key of Object.keys(grouped)) {
        const student = grouped[key];
        student.subjects = Object.values(student.subjectsObj)
          .map(normalizeInternalSubject)
          .map((subject, index) => ({ subject, index }))
          .sort(
            (a, b) =>
              Number(hasInternalScore(b.subject)) -
                Number(hasInternalScore(a.subject)) || a.index - b.index,
          )
          .map(({ subject }) => subject);
        delete student.subjectsObj;

        await InternalMark.findOneAndUpdate(
          { regNo: student.regNo, semester: student.semester },
          { $set: student },
          { upsert: true, new: true },
        );
        count++;
      }
      res.json({
        message: `✅ Uploaded internal marks for ${count} student(s)`,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// Generate rankings for a semester
router.post("/rankings/generate", protect, async (req, res) => {
  try {
    const { semester } = req.body;
    const results = await SemesterResult.find({ semester: Number(semester) });
    if (!results.length)
      return res
        .status(404)
        .json({ message: "No results found for this semester" });

    await generateRankingForSemester(Number(semester));
    res.json({
      message: `o. Rankings generated successfully for Semester ${semester}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/stats", protect, async (req, res) => {
  try {
    const [totalResults, totalInternal, totalRankings] = await Promise.all([
      SemesterResult.countDocuments(),
      InternalMark.countDocuments(),
      Ranking.countDocuments(),
    ]);
    const uniqueStudents = await SemesterResult.distinct("regNo");
    res.json({
      totalStudents: uniqueStudents.length,
      totalResults,
      totalInternal,
      totalRankings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
