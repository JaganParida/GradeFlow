const express = require("express");
const router = express.Router();
const multer = require("multer");
const XLSX = require("xlsx");
const { protect } = require("../middleware/auth");
const SemesterResult = require("../models/SemesterResult");
const InternalMark = require("../models/InternalMark");
const Ranking = require("../models/Ranking");
const { clearStudentCache } = require("./student");
const {
  GRADE_POINTS,
  assignCompetitionRanks,
  calculateCGPA,
  calculateSemesterMetrics,
  calculateSGPA,
  sortByScore,
} = require("../utils/gradeCalculations");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

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
  
  if (r.startsWith("230301120")) {
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

// Helper to generate rankings for a specific semester
async function generateRankingForSemester(semester) {
  const results = await SemesterResult.find({ semester: Number(semester) });
  if (!results.length) return;

  const batches = [...new Set(results.map((r) => r.batch || ""))];
  for (const batch of batches) {
    const batchResults = results.filter((r) => (r.batch || "") === batch);
    const studentData = [];
    for (const r of batchResults) {
      const allResults = await SemesterResult.find({ regNo: r.regNo }).sort({
        semester: 1,
      });
      const cgpa = calculateCGPA(allResults, Number(semester));
      const liveSGPA = calculateSGPA(r.subjects, Number(semester));
      studentData.push({
        regNo: r.regNo,
        studentName: r.studentName,
        branch: r.branch,
        batch: r.batch,
        semester: Number(semester),
        sgpa: liveSGPA,
        cgpa,
      });
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
          filter: { regNo: s.regNo, semester: Number(semester) },
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
      message: `✅ Rankings generated successfully for Semester ${semester}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Regenerate ALL rankings for ALL semesters (recalculates SGPA & CGPA live)
router.post("/rankings/regenerate-all", protect, async (req, res) => {
  try {
    const semesters = await SemesterResult.distinct("semester");
    if (!semesters.length)
      return res.status(404).json({ message: "No semester results found" });

    semesters.sort((a, b) => a - b);
    for (const sem of semesters) {
      await generateRankingForSemester(sem);
    }
    // Clear ALL in-memory student cache so fresh data is served immediately
    clearStudentCache();
    res.json({
      message: `✅ All rankings regenerated for ${semesters.length} semester(s): ${semesters.join(", ")}. Cache cleared.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Clear ALL in-memory student cache (force fresh data for all students)
router.post("/cache/clear", protect, async (req, res) => {
  try {
    clearStudentCache(); // clears all cached entries
    res.json({
      message:
        "✅ Student cache cleared. All future requests will fetch fresh data.",
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
