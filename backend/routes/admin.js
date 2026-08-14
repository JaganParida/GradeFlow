const express = require("express");
const router = express.Router();
const multer = require("multer");
const XLSX = require("xlsx");
const { protect } = require("../middleware/auth");
const { emailLimiter } = require("../middleware/rateLimiters");
const { sendBacklogEmailNotification } = require("../utils/emailService");
const SemesterResult = require("../models/SemesterResult");
const InternalMark = require("../models/InternalMark");
const Ranking = require("../models/Ranking");
const Student = require("../models/Student");
const BatchPurgeLog = require("../models/BatchPurgeLog");
const { isBatchExpired, purgeExpiredBatches } = require("../utils/batchLifecycle");
const { clearStudentCache } = require("./student");
const {
  GRADE_POINTS,
  assignCompetitionRanks,
  calculateCGPA,
  calculateSemesterMetrics,
  calculateSGPA,
  sortByScore,
  calculateBacklogs,
  getGradePoint,
  normalizeGrade,
} = require("../utils/gradeCalculations");

const { uploadStorage, validateFileBuffer } = require("../middleware/uploadSafety");
const {
  validateEmailRequest,
  validateAcademicFilters,
  validateGradeUpdateInput,
} = require("../middleware/validation");
const upload = uploadStorage;

// Defense-in-Depth: Enforce JWT authentication on ALL admin routes
router.use(protect);

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

function detectBatch(regNo) {
  if (!regNo) return "";
  const r = String(regNo).trim();
  if (/^\d{2}/.test(r)) {
    return `20${r.slice(0, 2)}`;
  }
  return "";
}

function detectBranch(regNo) {
  if (!regNo) return "UNKNOWN";
  const r = String(regNo).trim();

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

  const suffix = r.length >= 9 ? r.slice(2) : r;

  if (suffix.startsWith("0301110") || suffix.startsWith("0301111")) return "CIVIL";
  if (suffix.startsWith("0301120") || suffix.startsWith("0301121")) return "CSE";
  if (
    suffix.startsWith("0301130") ||
    suffix.startsWith("0301131") ||
    suffix.startsWith("0301132")
  )
    return "ECE";
  if (suffix.startsWith("0301150") || suffix.startsWith("0301151")) return "EEE";
  if (suffix.startsWith("0301160") || suffix.startsWith("0301161")) return "ME";
  if (suffix.startsWith("0301180")) return "BIO";
  if (suffix.startsWith("0301190") || suffix.startsWith("0301191")) return "MI";
  if (suffix.startsWith("0301230")) return "AERO";

  if (r.startsWith("230301110") || r.startsWith("230301111")) return "CIVIL";
  if (r.startsWith("230301120") || r.startsWith("230301121")) return "CSE";
  if (
    r.startsWith("230301130") ||
    r.startsWith("230301131") ||
    r.startsWith("230301132")
  )
    return "ECE";
  if (r.startsWith("230301150") || r.startsWith("230301151")) return "EEE";
  if (r.startsWith("230301160") || r.startsWith("230301161")) return "ME";
  if (r.startsWith("230301180")) return "BIO";
  if (r.startsWith("230301190") || r.startsWith("230301191")) return "MI";
  if (r.startsWith("230301230")) return "AERO";

  return "OTHER";
}

// Helper to generate rankings for a specific semester
async function generateRankingForSemester(semester, preloadedAllResults = null) {
  const semNum = Number(semester);
  const allResults = preloadedAllResults || (await SemesterResult.find({}).lean());
  const semResults = allResults.filter((r) => Number(r.semester) === semNum);
  if (!semResults.length) return;

  const resultsByRegNo = new Map();
  for (const r of allResults) {
    const regNo = String(r.regNo || "").trim();
    if (!regNo) continue;
    if (!resultsByRegNo.has(regNo)) {
      resultsByRegNo.set(regNo, []);
    }
    resultsByRegNo.get(regNo).push(r);
  }

  for (const list of resultsByRegNo.values()) {
    list.sort((a, b) => Number(a.semester) - Number(b.semester));
  }

  const batches = [...new Set(semResults.map((r) => r.batch || ""))];
  for (const batch of batches) {
    const batchResults = semResults.filter((r) => (r.batch || "") === batch);
    const studentData = [];
    const semBulkOps = [];

    for (const r of batchResults) {
      const regNo = String(r.regNo || "").trim();
      const studentAllResults = resultsByRegNo.get(regNo) || [];
      const liveSGPA = calculateSGPA(r.subjects, semNum);
      const cgpa = calculateCGPA(studentAllResults, semNum);
      const { totalCredits, creditsCleared } = calculateSemesterMetrics(r.subjects, semNum);

      studentData.push({
        regNo: r.regNo,
        studentName: r.studentName,
        branch: r.branch,
        batch: r.batch,
        semester: semNum,
        sgpa: liveSGPA,
        cgpa,
      });

      semBulkOps.push({
        updateOne: {
          filter: { regNo: r.regNo, semester: semNum },
          update: {
            $set: {
              sgpa: liveSGPA,
              cgpa: cgpa,
              totalCredits,
              creditsCleared,
            },
          },
        },
      });
    }

    if (semBulkOps.length > 0) {
      await SemesterResult.bulkWrite(semBulkOps);
    }

    sortByScore(studentData, "cgpa", "sgpa");
    assignCompetitionRanks(studentData, "cgpa", "cgpaRank");
    sortByScore(studentData, "sgpa", "cgpa");
    assignCompetitionRanks(studentData, "sgpa", "sgpaRank");

    studentData.forEach((s) => {
      s.universityRank = s.sgpaRank;
      s.totalStudents = studentData.length;
      s.percentile = parseFloat(
        ((1 - (s.sgpaRank - 1) / studentData.length) * 100).toFixed(1),
      );
    });

    const byBranch = {};
    const bySection = {};
    studentData.forEach((s) => {
      if (!byBranch[s.branch]) byBranch[s.branch] = [];
      byBranch[s.branch].push(s);

      if (s.branch === "CSE") {
        const sec = getSectionFromRegNo(s.regNo);
        if (!bySection[sec]) bySection[sec] = [];
        bySection[sec].push(s);
      }
    });

    Object.values(byBranch).forEach((group) => {
      sortByScore(group, "sgpa", "cgpa");
      assignCompetitionRanks(group, "sgpa", "deptRank");
      
      sortByScore(group, "cgpa", "sgpa");
      assignCompetitionRanks(group, "cgpa", "deptCgpaRank");

      group.forEach((s) => (s.deptStudents = group.length));
    });

    Object.values(bySection).forEach((group) => {
      sortByScore(group, "sgpa", "cgpa");
      assignCompetitionRanks(group, "sgpa", "sectionSgpaRank");

      sortByScore(group, "cgpa", "sgpa");
      assignCompetitionRanks(group, "cgpa", "sectionCgpaRank");

      group.forEach((s) => (s.sectionStudents = group.length));
    });

    if (studentData.length > 0) {
      const bulkOps = studentData.map((s) => ({
        updateOne: {
          filter: { regNo: s.regNo, semester: semNum },
          update: { $set: s },
          upsert: true,
        },
      }));
      await Ranking.bulkWrite(bulkOps);
    }
  }
}

// Upload semester results
router.post(
  "/upload/results",
  protect,
  upload.single("file"),
  validateFileBuffer,
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
      let skippedExpiredRowsCount = 0;

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

        // Dynamic Suffix Matching (works for any batch YY)
        const suffix = r.length >= 9 ? r.slice(2) : r;

        if (suffix.startsWith("0301110") || suffix.startsWith("0301111"))
          return "CIVIL";
        if (suffix.startsWith("0301120") || suffix.startsWith("0301121"))
          return "CSE";
        if (
          suffix.startsWith("0301130") ||
          suffix.startsWith("0301131") ||
          suffix.startsWith("0301132")
        )
          return "ECE";
        if (suffix.startsWith("0301150") || suffix.startsWith("0301151"))
          return "EEE";
        if (suffix.startsWith("0301160") || suffix.startsWith("0301161")) return "ME";
        if (suffix.startsWith("0301180")) return "BIO";
        if (suffix.startsWith("0301190") || suffix.startsWith("0301191")) return "MI";
        if (suffix.startsWith("0301230")) return "AERO";

        // Fallbacks
        if (r.startsWith("230301110") || r.startsWith("230301111")) return "CIVIL";
        if (r.startsWith("230301120") || r.startsWith("230301121")) return "CSE";
        if (r.startsWith("230301130") || r.startsWith("230301131") || r.startsWith("230301132")) return "ECE";
        if (r.startsWith("230301150") || r.startsWith("230301151")) return "EEE";
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
          let batch = detectBatch(regNo);
          if (!batch) {
            batch = String(formBatch || col(row, "Batch", "batch") || "");
          }

          if (isBatchExpired(batch)) {
            console.warn(`Row ${idx + 2}: skipped — Batch ${batch} has exceeded the 5-year retention limit`);
            skippedExpiredRowsCount++;
            return;
          }

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
          const { totalCredits, creditsCleared, sgpa } =
            calculateSemesterMetrics(record.subjects, record.semester);

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

      // CRITICAL: Invalidate cache for all uploaded students so Dashboard/Analytics
      // immediately reflect the new data instead of serving stale cached responses
      allRegNos.forEach((rn) => clearStudentCache(rn));

      res.json({
        message: `✅ Successfully uploaded ${count} student semester record(s) and auto-updated rankings!`,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Server error during upload" });
    }
  },
);

// Upload internal marks
router.post(
  "/upload/internal",
  protect,
  upload.single("file"),
  validateFileBuffer,
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

      const hasPositiveMarkValue = (value) => {
        if (value === undefined || value === null) return false;
        const text = String(value).trim();
        if (text === "" || text === "-") return false;
        const num = Number(text);
        return Number.isFinite(num) && num > 0;
      };

      const hasInternalScore = (subject) =>
        Object.entries(subject).some(
          ([key, value]) =>
            (key.endsWith("Obtained") ||
              key.endsWith("RoundOff") ||
              key === "totalScore") &&
            hasPositiveMarkValue(value),
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

        // Debug logging removed for security — student data should not be written to disk

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
          let batch = detectBatch(regNo);
          if (!batch) {
            batch = String(formBatch || col(row, "Batch", "batch") || "");
          }

          if (isBatchExpired(batch)) {
            console.warn(`Row: skipped internal mark — Batch ${batch} has exceeded the 5-year retention limit`);
            continue;
          }

          const key = `${regNo}_${semester}`;
          if (!grouped[key]) {
            grouped[key] = {
              regNo,
              studentName: name,
              branch,
              batch,
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

      // Debug logging removed for security — student data should not be written to disk

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

      // Invalidate cache for uploaded students so internal marks display live immediately
      Object.keys(grouped).forEach((k) => clearStudentCache(grouped[k].regNo));

      res.json({
        message: `✅ Uploaded internal marks for ${count} student(s)`,
      });
    } catch (err) {
      console.error("Internal marks upload error:", err);
      res.status(500).json({ message: "Server error during internal marks upload" });
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
      message: `✅ Rankings generated successfully for Semester ${semester}`,
    });
  } catch (err) {
    console.error("Rankings generation error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Regenerate ALL rankings for ALL semesters (recalculates SGPA & CGPA live)
router.post("/rankings/regenerate-all", protect, async (req, res) => {
  try {
    const allSemesterResults = await SemesterResult.find({}).lean();
    if (!allSemesterResults.length)
      return res.status(404).json({ message: "No semester results found" });

    const semesters = [
      ...new Set(allSemesterResults.map((r) => Number(r.semester))),
    ]
      .filter((s) => !isNaN(s) && s > 0)
      .sort((a, b) => a - b);

    for (const sem of semesters) {
      await generateRankingForSemester(sem, allSemesterResults);
    }
    // Clear ALL in-memory student cache so fresh data is served immediately
    clearStudentCache();
    res.json({
      message: `✅ All rankings regenerated for ${semesters.length} semester(s): ${semesters.join(", ")}. Cache cleared.`,
    });
  } catch (err) {
    console.error("Rankings regeneration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Search/List registered students for dropdown/autocomplete (Super Fast & Light)
router.get("/students/search", protect, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.json([]);
    }
    const reg = new RegExp(q, "i");
    const query = { $or: [{ regNo: reg }, { studentName: reg }] };

    const results = await SemesterResult.find(query, "regNo studentName branch batch")
      .limit(100)
      .lean();

    const studentMap = new Map();
    results.forEach((r) => {
      if (!studentMap.has(r.regNo)) {
        studentMap.set(r.regNo, {
          regNo: r.regNo,
          studentName: r.studentName,
          branch: r.branch,
          batch: r.batch,
        });
      }
    });

    const students = Array.from(studentMap.values()).slice(0, 30);
    res.json(students);
  } catch (err) {
    console.error("Student search error:", err);
    res.status(500).json({ message: "Server error searching students" });
  }
});

// Get full semester & subject details for a specific student
router.get("/student/details/:regNo", protect, async (req, res) => {
  try {
    const regNo = String(req.params.regNo || "").trim();
    if (!regNo) return res.status(400).json({ message: "Registration number required" });

    const results = await SemesterResult.find({ regNo }).sort({ semester: 1 }).lean();
    if (!results || !results.length) {
      return res.status(404).json({ message: "No data present related to this student" });
    }

    // Compute live SGPA and CGPA up to each semester so dropdown & details display accurate CGPA
    const enrichedResults = results.map((r) => {
      const liveSGPA = calculateSGPA(r.subjects, r.semester);
      const liveCGPA = calculateCGPA(results, r.semester);
      return {
        ...r,
        sgpa: liveSGPA,
        cgpa: liveCGPA,
      };
    });

    const latest = enrichedResults[enrichedResults.length - 1];
    res.json({
      regNo,
      studentName: latest.studentName,
      branch: latest.branch,
      batch: latest.batch,
      semesters: enrichedResults,
    });
  } catch (err) {
    console.error("Fetch student details error:", err);
    res.status(500).json({ message: "Server error fetching student details" });
  }
});

// Update individual grade for a student's subject manually
router.post("/student/update-grade", validateGradeUpdateInput, async (req, res) => {
  try {
    const { regNo, semester, subCode, newGrade } = req.body;

    const trimmedRegNo = String(regNo || "").trim();
    const semNum = Number(semester);
    const rawSubCode = String(subCode || "").trim();
    const normalizedGrade = normalizeGrade(newGrade);

    if (!trimmedRegNo || !semNum || !rawSubCode || !normalizedGrade) {
      return res.status(400).json({ message: "Registration Number, Semester, Subject, and New Grade are required" });
    }

    const semResult = await SemesterResult.findOne({
      regNo: trimmedRegNo,
      semester: semNum,
    });

    if (!semResult) {
      return res.status(404).json({ message: `No academic records found for student ${trimmedRegNo} in Semester ${semNum}` });
    }

    // Flexible subject matching (exact, normalized alphanumeric, or by _id)
    const normalizeSub = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetNorm = normalizeSub(rawSubCode);

    const subjectIndex = (semResult.subjects || []).findIndex(
      (s) =>
        String(s.subCode || "").trim().toLowerCase() === rawSubCode.toLowerCase() ||
        String(s.subName || "").trim().toLowerCase() === rawSubCode.toLowerCase() ||
        (s._id && String(s._id) === rawSubCode) ||
        (targetNorm && normalizeSub(s.subCode) === targetNorm) ||
        (targetNorm && normalizeSub(s.subName) === targetNorm) ||
        (targetNorm && targetNorm.length >= 3 && (normalizeSub(s.subCode).includes(targetNorm) || targetNorm.includes(normalizeSub(s.subCode))))
    );

    if (subjectIndex === -1) {
      return res.status(404).json({ message: `Subject "${rawSubCode}" not found for this student in Semester ${semNum}` });
    }

    const targetSubject = semResult.subjects[subjectIndex];
    const oldGrade = targetSubject.grade;

    // Update grade and gradePoint on target subject
    targetSubject.grade = normalizedGrade;
    const newGp = getGradePoint(normalizedGrade);
    if (newGp !== undefined) {
      targetSubject.gradePoint = newGp;
    }
    semResult.markModified("subjects");

    // Save target semester result first
    await semResult.save();

    // Cascading Recalculation: Fetch ALL semester records for this student
    const allStudentResults = await SemesterResult.find({ regNo: trimmedRegNo }).sort({ semester: 1 });

    // Recalculate SGPA, CGPA, totalCredits, and creditsCleared sequentially for ALL semesters of this student
    for (const r of allStudentResults) {
      const semNumber = Number(r.semester);
      const metrics = calculateSemesterMetrics(r.subjects, semNumber);
      r.totalCredits = metrics.totalCredits;
      r.creditsCleared = metrics.creditsCleared;
      r.sgpa = metrics.sgpa;
      r.cgpa = calculateCGPA(allStudentResults, semNumber);
      r.markModified("subjects");
      await r.save();
    }

    // Automatically regenerate rankings for ALL semesters where this student has uploaded records
    const affectedSemesters = [...new Set(allStudentResults.map((r) => Number(r.semester)))];
    for (const sem of affectedSemesters) {
      await generateRankingForSemester(sem);
    }

    // Clear in-memory student cache globally so all endpoints (backlogs, leaderboards, profiles, stats) update instantly
    clearStudentCache();

    // Fetch updated target result for final JSON response
    const updatedTargetSem = allStudentResults.find((r) => Number(r.semester) === semNum) || semResult;

    res.json({
      success: true,
      message: `✅ Grade for "${targetSubject.subName}" (${targetSubject.subCode}) updated from ${oldGrade} to ${normalizedGrade} for ${semResult.studentName} (${trimmedRegNo})! SGPA, CGPA, Backlogs, Rankings & Website synchronized!`,
      studentName: semResult.studentName,
      regNo: trimmedRegNo,
      semester: semNum,
      sgpa: updatedTargetSem.sgpa,
      cgpa: updatedTargetSem.cgpa,
      subjects: updatedTargetSem.subjects,
    });
  } catch (err) {
    console.error("Manual grade update error:", err);
    res.status(500).json({ message: err.message || "Server error updating grade" });
  }
});

// Get backlog students breakdown & leaderboard for admin
router.get("/backlogs", validateAcademicFilters, async (req, res) => {
  try {
    const { batch, branch, section, semester, search, page = 1, limit = 50 } = req.query;

    const [semResults, rankings, studentsTracking] = await Promise.all([
      SemesterResult.find({}).sort({ semester: 1 }).lean(),
      Ranking.find({}).lean(),
      Student.find({}).lean()
    ]);

    const studentTrackingMap = new Map();
    studentsTracking.forEach((st) => {
      studentTrackingMap.set(st.regNo, st);
    });

    // Map rankings by regNo to get latest CGPA and Ranks
    const studentRankingMap = new Map();
    rankings.forEach((rk) => {
      if (!rk.regNo) return;
      const regNo = String(rk.regNo).trim();
      const existing = studentRankingMap.get(regNo);
      if (!existing || rk.semester > existing.semester) {
        studentRankingMap.set(regNo, {
          cgpa: rk.cgpa || 0,
          universityRank: rk.universityRank || rk.cgpaRank || null,
          deptRank: rk.deptCgpaRank || rk.deptRank || null,
          departmentRank: rk.deptCgpaRank || rk.deptRank || null,
          branchRank: rk.deptCgpaRank || rk.deptRank || null,
          batchRank: rk.universityRank || rk.cgpaRank || null,
          sectionRank: rk.sectionCgpaRank || rk.sectionSgpaRank || null,
          semester: rk.semester,
        });
      }
    });

    const VALID_BRANCHES = new Set(["CSE", "ECE", "ME", "CIVIL", "EEE", "BIO", "MI", "AERO"]);

    // Group all semester results by regNo to run central backlog evaluation
    const studentResultsMap = new Map();
    semResults.forEach((r) => {
      if (!r.regNo || !r.subjects || !r.subjects.length) return;
      const regNo = String(r.regNo).trim();
      if (!studentResultsMap.has(regNo)) {
        studentResultsMap.set(regNo, []);
      }
      studentResultsMap.get(regNo).push(r);
    });

    const studentBacklogMap = new Map();

    studentResultsMap.forEach((userResults, regNo) => {
      // Calculate backlogs using central gradeCalculations utility (identical to Student Dashboard)
      const backlogs = calculateBacklogs(userResults);
      if (!backlogs || !backlogs.length) return;

      const latestResult = userResults[userResults.length - 1] || userResults[0];
      let b = String(latestResult.batch || "").trim();
      if (!b && /^\d{2}/.test(regNo)) {
        b = `20${regNo.slice(0, 2)}`;
      }

      let br = detectBranch(regNo);
      if ((br === "OTHER" || br === "UNKNOWN") && latestResult.branch && VALID_BRANCHES.has(String(latestResult.branch).trim().toUpperCase())) {
        br = String(latestResult.branch).trim().toUpperCase();
      }

      let rawSec = getSectionFromRegNo(regNo);
      if (rawSec && !rawSec.startsWith("Sec")) rawSec = `Sec ${rawSec}`;

      const rkInfo = studentRankingMap.get(regNo) || null;
      const trackingInfo = studentTrackingMap.get(regNo) || {};

      const semBreakdown = {};
      backlogs.forEach((sub) => {
        const sNum = sub.semester || 1;
        semBreakdown[sNum] = (semBreakdown[sNum] || 0) + 1;
      });

      studentBacklogMap.set(regNo, {
        regNo,
        studentName: latestResult.studentName || "N/A",
        batch: b || "N/A",
        branch: br || "N/A",
        section: rawSec || "N/A",
        totalBacklogs: backlogs.length,
        backlogs: backlogs,
        semBreakdown,
        rankInfo: rkInfo,
        lastEmailSentAt: trackingInfo.lastEmailSentAt || null,
        lastEmailStatus: trackingInfo.lastEmailStatus || null,
        lastEmailError: trackingInfo.lastEmailError || null
      });
    });

    let studentList = Array.from(studentBacklogMap.values());

    if (batch) {
      studentList = studentList.filter((s) => s.batch === batch);
    }
    if (branch) {
      studentList = studentList.filter((s) => s.branch === branch);
    }
    if (section) {
      const cleanSec = String(section).replace(/^Sec\s*/i, "").trim().toUpperCase();
      studentList = studentList.filter((s) => {
        const sSec = String(s.section || "").replace(/^Sec\s*/i, "").trim().toUpperCase();
        return sSec === cleanSec;
      });
    }
    if (semester) {
      const semNum = Number(semester);
      studentList = studentList.filter((s) => (s.semBreakdown[semNum] || 0) > 0);
    }
    if (search) {
      const q = String(search).toLowerCase().trim();
      studentList = studentList.filter(
        (s) =>
          s.regNo.toLowerCase().includes(q) ||
          s.studentName.toLowerCase().includes(q)
      );
    }

    studentList.sort((a, b) => b.totalBacklogs - a.totalBacklogs);

    const totalStudentsWithBacklogs = studentList.length;
    const totalBacklogsCount = studentList.reduce((acc, s) => acc + s.totalBacklogs, 0);

    const batchMap = new Map();
    const branchMap = new Map();
    const semMap = new Map();

    studentList.forEach((s) => {
      const bt = s.batch || "Other";
      if (!batchMap.has(bt)) {
        batchMap.set(bt, { batch: bt, studentCount: 0, backlogCount: 0 });
      }
      const btEntry = batchMap.get(bt);
      btEntry.studentCount++;
      btEntry.backlogCount += s.totalBacklogs;

      const br = s.branch || "Other";
      if (!branchMap.has(br)) {
        branchMap.set(br, { branch: br, studentCount: 0, backlogCount: 0 });
      }
      const brEntry = branchMap.get(br);
      brEntry.studentCount++;
      brEntry.backlogCount += s.totalBacklogs;

      Object.entries(s.semBreakdown || {}).forEach(([semNum, count]) => {
        const sNum = Number(semNum);
        if (!semMap.has(sNum)) {
          semMap.set(sNum, { semester: sNum, studentCount: 0, backlogCount: 0 });
        }
        const semEntry = semMap.get(sNum);
        semEntry.studentCount++;
        semEntry.backlogCount += count;
      });
    });

    const batchBreakdownSummary = Array.from(batchMap.values()).sort((a, b) => b.batch.localeCompare(a.batch));
    const branchBreakdown = Array.from(branchMap.values()).sort((a, b) => b.backlogCount - a.backlogCount);
    const semBreakdownSummary = Array.from(semMap.values()).sort((a, b) => a.semester - b.semester);

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 50);
    const totalPages = Math.ceil(totalStudentsWithBacklogs / limitNum) || 1;

    const startIndex = (pageNum - 1) * limitNum;
    const paginatedStudents = studentList.slice(startIndex, startIndex + limitNum);

    res.json({
      totalStudentsWithBacklogs,
      totalBacklogsCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
      batchBreakdownSummary,
      branchBreakdown,
      semBreakdownSummary,
      students: paginatedStudents,
    });
  } catch (err) {
    console.error("Fetch backlogs error:", err);
    res.status(500).json({ message: "Server error fetching backlogs" });
  }
});

// Send backlog notification email to student
router.post("/backlogs/send-email", emailLimiter, validateEmailRequest, async (req, res) => {
  try {
    const { regNo, registrationNumber, studentId, customEmail, email } = req.body;
    const cleanRegNo = String(regNo || registrationNumber || studentId || "").trim();

    if (!cleanRegNo) {
      return res.status(400).json({ message: "Registration number is required" });
    }

    // Retrieve student results from DB with projected fields
    const results = await SemesterResult.find({ regNo: cleanRegNo }).select("studentName batch branch semester sgpa results subjects").sort({ semester: 1 }).lean();
    if (!results || !results.length) {
      return res.status(404).json({ message: `No student records found for registration number "${cleanRegNo}"` });
    }

    // Calculate backlogs, CGPA, and metrics
    const backlogSubjects = calculateBacklogs(results);
    if (!backlogSubjects || !backlogSubjects.length) {
      return res.status(400).json({ message: `Student (${cleanRegNo}) currently has 0 active backlogs!` });
    }

    const cgpa = calculateCGPA(results);
    const latestResult = results[results.length - 1];
    const studentName = latestResult.studentName || "Student";
    const latestSemester = Math.max(...results.map((r) => Number(r.semester) || 1));
    const completedSemesters = latestSemester;
    const remainingSemesters = Math.max(0, 8 - latestSemester);

    // Calculate Batch, Branch, and Section for the email
    let batch = String(latestResult.batch || "").trim();
    if (!batch && /^\d{2}/.test(cleanRegNo)) {
      batch = `20${cleanRegNo.slice(0, 2)}`;
    }

    const VALID_BRANCHES = new Set(["CSE", "ECE", "ME", "CIVIL", "EEE", "BIO", "MI", "AERO"]);
    let branch = detectBranch(cleanRegNo);
    if ((branch === "OTHER" || branch === "UNKNOWN") && latestResult.branch && VALID_BRANCHES.has(String(latestResult.branch).trim().toUpperCase())) {
      branch = String(latestResult.branch).trim().toUpperCase();
    }

    let section = getSectionFromRegNo(cleanRegNo);
    if (section && !section.startsWith("Sec")) section = `Sec ${section}`;
    if (!section) section = "N/A";

    // Dynamic email address generation: {regNo}@centurionuniv.edu.in
    const defaultEmail = `${cleanRegNo}@centurionuniv.edu.in`.toLowerCase();
    const recipientEmail = (customEmail || email || defaultEmail).trim().toLowerCase();

    // Send email using Nodemailer utility
    const result = await sendBacklogEmailNotification({
      to: recipientEmail,
      studentName,
      regNo: cleanRegNo,
      cgpa,
      totalBacklogs: backlogSubjects.length,
      completedSemesters,
      remainingSemesters,
      latestSemester,
      backlogSubjects,
      batch,
      branch,
      section,
    });

    // Update Email Status asynchronously
    const sentDate = new Date();
    Student.findOneAndUpdate(
      { regNo: cleanRegNo },
      {
        $set: {
          lastEmailSentAt: sentDate,
          lastEmailStatus: 'SUCCESS',
          lastEmailError: null
        }
      },
      { upsert: true }
    ).catch(() => {});

    res.json({
      success: true,
      message: `Backlog notification email successfully sent to ${recipientEmail}`,
      studentName,
      regNo: cleanRegNo,
      recipientEmail,
      totalBacklogs: backlogSubjects.length,
      cgpa,
      messageId: result.messageId,
      sentAt: sentDate.toISOString(),
      lastEmailStatus: 'SUCCESS'
    });
  } catch (err) {
    console.error("Backlog email send error:", err);
    
    // Attempt to update Email Status to FAILED
    const cleanRegNo = String(req.body.regNo || req.body.registrationNumber || req.body.studentId || "").trim();
    if (cleanRegNo) {
      await Student.findOneAndUpdate(
        { regNo: cleanRegNo },
        {
          lastEmailSentAt: new Date(),
          lastEmailStatus: 'FAILED',
          lastEmailError: err.message || 'Unknown error occurred'
        },
        { upsert: true }
      ).catch(dbErr => console.error("Failed to update email log:", dbErr));
    }

    res.status(500).json({
      message: err.message || "Failed to send backlog notification email",
    });
  }
});

// Update email status from frontend
router.post("/backlogs/email-status", protect, async (req, res) => {
  try {
    const { regNo, status, error } = req.body;
    const cleanRegNo = String(regNo || "").trim();
    if (!cleanRegNo) {
      return res.status(400).json({ message: "Registration number required" });
    }

    await Student.findOneAndUpdate(
      { regNo: cleanRegNo },
      {
        lastEmailSentAt: new Date(),
        lastEmailStatus: status === "SUCCESS" ? "SUCCESS" : "FAILED",
        lastEmailError: error || null
      },
      { upsert: true }
    );

    res.json({ success: true, message: "Email status updated" });
  } catch (err) {
    console.error("Failed to update email status:", err);
    res.status(500).json({ message: "Failed to update email status" });
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

    const semResults = await SemesterResult.find({}, "regNo batch semester").lean();
    const rankings = await Ranking.find({}, "regNo batch semester").lean();
    const internalMarks = await InternalMark.find({}, "regNo batch semester").lean();

    const batchMap = new Map();

    semResults.forEach((r) => {
      let b = String(r.batch || "").trim();
      if (!b && r.regNo && /^\d{2}/.test(r.regNo)) {
        b = `20${r.regNo.slice(0, 2)}`;
      }
      if (!b) b = "Other";

      if (!batchMap.has(b)) {
        batchMap.set(b, {
          batch: b,
          studentsSet: new Set(),
          rankedStudentsSet: new Set(),
          semMap: new Map(),
          totalResults: 0,
          totalInternal: 0,
          totalRankings: 0,
        });
      }
      const entry = batchMap.get(b);
      if (r.regNo) {
        entry.studentsSet.add(r.regNo);
        if (r.semester) {
          const semNum = Number(r.semester);
          if (!isNaN(semNum) && semNum > 0) {
            if (!entry.semMap.has(semNum)) {
              entry.semMap.set(semNum, new Set());
            }
            entry.semMap.get(semNum).add(r.regNo);
          }
        }
      }
      entry.totalResults++;
    });

    internalMarks.forEach((m) => {
      let b = String(m.batch || "").trim();
      if (!b && m.regNo && /^\d{2}/.test(m.regNo)) {
        b = `20${m.regNo.slice(0, 2)}`;
      }
      if (!b) b = "Other";

      if (!batchMap.has(b)) {
        batchMap.set(b, {
          batch: b,
          studentsSet: new Set(),
          rankedStudentsSet: new Set(),
          semMap: new Map(),
          totalResults: 0,
          totalInternal: 0,
          totalRankings: 0,
        });
      }
      const entry = batchMap.get(b);
      if (m.regNo) entry.studentsSet.add(m.regNo);
      entry.totalInternal++;
    });

    rankings.forEach((rk) => {
      let b = String(rk.batch || "").trim();
      if (!b && rk.regNo && /^\d{2}/.test(rk.regNo)) {
        b = `20${rk.regNo.slice(0, 2)}`;
      }
      if (!b) b = "Other";

      if (!batchMap.has(b)) {
        batchMap.set(b, {
          batch: b,
          studentsSet: new Set(),
          rankedStudentsSet: new Set(),
          semMap: new Map(),
          totalResults: 0,
          totalInternal: 0,
          totalRankings: 0,
        });
      }
      const entry = batchMap.get(b);
      if (rk.regNo) {
        entry.studentsSet.add(rk.regNo);
        entry.rankedStudentsSet.add(rk.regNo);
      }
      entry.totalRankings++;
    });

    const batchBreakdown = Array.from(batchMap.values())
      .map((item) => {
        const semBreakdown = Array.from(item.semMap.entries())
          .map(([sem, set]) => ({ semester: sem, studentCount: set.size }))
          .sort((a, b) => a.semester - b.semester);

        return {
          batch: item.batch,
          totalStudents: item.studentsSet.size,
          totalRankedStudents: item.rankedStudentsSet.size,
          totalResults: item.totalResults,
          totalInternal: item.totalInternal,
          totalRankings: item.totalRankings,
          semBreakdown,
        };
      })
      .sort((a, b) => {
        if (a.batch === "Other") return 1;
        if (b.batch === "Other") return -1;
        return Number(b.batch) - Number(a.batch);
      });

    res.json({
      totalStudents: uniqueStudents.length,
      totalResults,
      totalInternal,
      totalRankings,
      batchBreakdown,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch recent 5-Year Batch Data Retention Purge Audit Logs
router.get("/purge-logs", protect, async (req, res) => {
  try {
    const logs = await BatchPurgeLog.find({}).sort({ purgedAt: -1 }).limit(20).lean();
    res.json(logs);
  } catch (err) {
    console.error("Purge logs fetch error:", err);
    res.status(500).json({ message: "Server error fetching purge logs" });
  }
});

// Manual trigger for Expired Batch Purge (> 5 Years Old)
router.post("/purge-expired", protect, async (req, res) => {
  try {
    const result = await purgeExpiredBatches();
    clearStudentCache();
    res.json({
      message: `✅ Batch purge complete. ${result.purgedCount} expired batch(es) purged.`,
      result,
    });
  } catch (err) {
    console.error("Manual purge error:", err);
    res.status(500).json({ message: "Server error executing batch purge" });
  }
});

// Delete a specific Purge Audit Log notification
router.delete("/purge-logs/:id", protect, async (req, res) => {
  try {
    await BatchPurgeLog.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("Delete purge log error:", err);
    res.status(500).json({ message: "Server error deleting purge log" });
  }
});

// Delete all Purge Audit Log notifications
router.delete("/purge-logs", protect, async (req, res) => {
  try {
    await BatchPurgeLog.deleteMany({});
    res.json({ message: "All notifications cleared" });
  } catch (err) {
    console.error("Delete all purge logs error:", err);
    res.status(500).json({ message: "Server error clearing purge logs" });
  }
});

// Get section toppers (Top 10 rankers per section/branch) - Queries pre-calculated rankings
router.get("/section-toppers", validateAcademicFilters, async (req, res) => {
  try {
    const { batch = "2023", branch = "CSE", section = "Sec A", semester, search, limit = 10 } = req.query;

    const [allRankings, studentsTracking] = await Promise.all([
      Ranking.find({}).lean(),
      Student.find({}).lean()
    ]);

    const studentTrackingMap = new Map();
    studentsTracking.forEach((st) => {
      studentTrackingMap.set(st.regNo, st);
    });

    let filteredRankings = allRankings;

    if (semester) {
      const semNum = Number(semester);
      filteredRankings = filteredRankings.filter((rk) => Number(rk.semester) === semNum);
    } else {
      const latestMap = new Map();
      allRankings.forEach((rk) => {
        const regNo = rk.regNo;
        const currentSem = Number(rk.semester) || 0;
        const existing = latestMap.get(regNo);
        if (!existing || currentSem > (Number(existing.semester) || 0)) {
          latestMap.set(regNo, rk);
        }
      });
      filteredRankings = Array.from(latestMap.values());
    }

    let validStudents = [];

    filteredRankings.forEach((rk) => {
      const regNo = String(rk.regNo || "").trim();
      if (!regNo) return;

      const cgpa = Number(rk.cgpa) || 0;
      const sgpa = Number(rk.sgpa) || 0;
      if (cgpa <= 0) return;

      let b = String(rk.batch || "").trim();
      if (!b && /^\d{2}/.test(regNo)) {
        b = `20${regNo.slice(0, 2)}`;
      }

      let br = detectBranch(regNo);
      if (rk.branch) br = String(rk.branch).trim().toUpperCase();

      let sec = getSectionFromRegNo(regNo);
      if (sec && !sec.startsWith("Sec")) sec = `Sec ${sec}`;
      if (!sec) sec = "N/A";

      const tracking = studentTrackingMap.get(regNo) || {};

      validStudents.push({
        regNo,
        studentName: rk.studentName || "Student",
        batch: b,
        branch: br,
        section: sec.replace(/^Sec\s*/i, ""),
        fullSection: sec,
        semester: rk.semester,
        cgpa,
        sgpa,
        sectionCgpaRank: rk.sectionCgpaRank || null,
        sectionSgpaRank: rk.sectionSgpaRank || null,
        deptCgpaRank: rk.deptCgpaRank || null,
        deptRank: rk.deptRank || null,
        universityRank: rk.universityRank || rk.cgpaRank || null,
        lastTopperEmailSentAt: tracking.lastTopperEmailSentAt ? tracking.lastTopperEmailSentAt.toISOString() : null,
        lastTopperEmailStatus: tracking.lastTopperEmailStatus || null,
        lastTopperEmailError: tracking.lastTopperEmailError || null,
      });
    });

    if (batch) {
      validStudents = validStudents.filter((s) => s.batch === batch);
    }
    if (branch) {
      validStudents = validStudents.filter((s) => s.branch === branch);
    }
    if (section) {
      const cleanSec = String(section).replace(/^Sec\s*/i, "").trim().toUpperCase();
      validStudents = validStudents.filter((s) => {
        const sSec = String(s.section || "").replace(/^Sec\s*/i, "").trim().toUpperCase();
        return sSec === cleanSec;
      });
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      validStudents = validStudents.filter(
        (s) =>
          s.regNo.toLowerCase().includes(q) ||
          s.studentName.toLowerCase().includes(q)
      );
    }

    validStudents.sort((a, b) => b.cgpa - a.cgpa || b.sgpa - a.sgpa);

    // Ensure section rank is set and filter all students holding Section Rank <= 10
    let currentRank = 1;
    let prevCgpa = null;
    validStudents.forEach((s, idx) => {
      if (idx === 0) {
        currentRank = 1;
      } else if (s.cgpa < prevCgpa) {
        currentRank = idx + 1;
      }
      if (!s.sectionCgpaRank) {
        s.sectionCgpaRank = currentRank;
      }
      prevCgpa = s.cgpa;
    });

    // Include all students holding Section Rank 1 through Rank 10 (including ties and rank 10 holders)
    const top10Toppers = validStudents.filter((s) => Number(s.sectionCgpaRank) <= 10);

    res.json({
      totalToppers: top10Toppers.length,
      students: top10Toppers,
    });
  } catch (err) {
    console.error("Fetch section toppers error:", err);
    res.status(500).json({ message: "Server error fetching section toppers" });
  }
});

// Update topper email status in Student model
router.post("/section-toppers/topper-email-status", protect, async (req, res) => {
  try {
    const { regNo, status, errorMsg } = req.body;
    const cleanRegNo = String(regNo || "").trim();
    if (!cleanRegNo) return res.status(400).json({ message: "RegNo is required" });

    const update = {
      lastTopperEmailSentAt: new Date(),
      lastTopperEmailStatus: status || "SUCCESS",
      lastTopperEmailError: errorMsg || null,
    };

    await Student.findOneAndUpdate(
      { regNo: cleanRegNo },
      { $set: update },
      { upsert: true, new: true }
    );

    res.json({ message: "Topper email status updated successfully" });
  } catch (err) {
    console.error("Update topper email status error:", err);
    res.status(500).json({ message: "Server error updating topper email status" });
  }
});

// Send congratulatory topper email to student (Backend fallback)
router.post("/section-toppers/send-email", emailLimiter, validateEmailRequest, async (req, res) => {
  try {
    const { regNo, customEmail, studentName: bodyName, cgpa: bodyCgpa, sgpa: bodySgpa, semester: bodySem, batch: bodyBatch, branch: bodyBranch, section: bodySection, sectionCgpaRank: bodySecRank, sectionSgpaRank: bodySgpaRank, universityRank: bodyUniRank } = req.body;
    const cleanRegNo = String(regNo || "").trim();

    if (!cleanRegNo) {
      return res.status(400).json({ message: "Registration number is required" });
    }

    const { sendTopperEmailNotification } = require("../utils/emailService");
    
    let studentName = bodyName;
    let cgpa = Number(bodyCgpa) || 0;
    let sgpa = Number(bodySgpa) || cgpa;
    let semester = Number(bodySem) || 1;
    let batch = bodyBatch || (`20${cleanRegNo.slice(0, 2)}`);
    let branch = bodyBranch || detectBranch(cleanRegNo);
    let section = bodySection || getSectionFromRegNo(cleanRegNo) || "N/A";
    if (section && !section.startsWith("Sec")) section = `Sec ${section}`;

    let sectionCgpaRank = bodySecRank || 1;
    let sectionSgpaRank = bodySgpaRank || 1;
    let universityRank = bodyUniRank || null;

    if (!studentName || cgpa <= 0) {
      const rk = await Ranking.findOne({ regNo: cleanRegNo }).sort({ semester: -1 }).lean();
      if (rk) {
        studentName = rk.studentName || "Student";
        cgpa = Number(rk.cgpa) || cgpa;
        sgpa = Number(rk.sgpa) || sgpa;
        semester = Number(rk.semester) || semester;
        batch = rk.batch || batch;
        branch = rk.branch || branch;
        sectionCgpaRank = rk.sectionCgpaRank || sectionCgpaRank;
        sectionSgpaRank = rk.sectionSgpaRank || sectionSgpaRank;
        universityRank = rk.universityRank || universityRank;
      } else {
        const results = await SemesterResult.find({ regNo: cleanRegNo }).select("studentName batch branch semester sgpa results subjects").sort({ semester: 1 }).lean();
        if (results && results.length) {
          const calcCgpa = calculateCGPA(results);
          const latestResult = results[results.length - 1];
          studentName = latestResult.studentName || "Student";
          cgpa = Number(calcCgpa) || 0;
          sgpa = Number(latestResult.sgpa) || cgpa;
          semester = Number(latestResult.semester) || 1;
          batch = latestResult.batch || batch;
          branch = latestResult.branch || branch;
        }
      }
    }

    studentName = studentName || "Student";
    const recipientEmail = customEmail ? String(customEmail).trim().toLowerCase() : `${cleanRegNo}@centurionuniv.edu.in`.toLowerCase();

    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return res.status(400).json({ message: `Invalid recipient email address: "${recipientEmail}"` });
    }

    await sendTopperEmailNotification({
      to: recipientEmail,
      studentName,
      regNo: cleanRegNo,
      cgpa,
      sgpa,
      sectionCgpaRank,
      sectionSgpaRank,
      universityRank,
      semester,
      batch,
      branch,
      section: section.replace(/^Sec\s*/i, ""),
    });

    // Update tracking asynchronously without blocking response
    Student.findOneAndUpdate(
      { regNo: cleanRegNo },
      {
        $set: {
          lastTopperEmailSentAt: new Date(),
          lastTopperEmailStatus: "SUCCESS",
          lastTopperEmailError: null,
        },
      },
      { upsert: true }
    ).catch(() => {});

    res.json({
      success: true,
      message: `Congratulatory email sent successfully to ${recipientEmail}`,
    });
  } catch (err) {
    console.error("Send section topper email error:", err);
    res.status(500).json({ message: err.message || "Failed to send email" });
  }
});

module.exports = router;

