const Busboy = require("busboy");
const XLSX = require("xlsx");
const jwt = require("jsonwebtoken");
const connectToDatabase = require("./db");
const SemesterResult = require("./models/SemesterResult");
const InternalMark = require("./models/InternalMark");
const Ranking = require("./models/Ranking");
const Student = require("./models/Student");
const SystemConfig = require("./models/SystemConfig");
const AdminSession = require("./models/AdminSession");
const SubAdminSession = require("./models/SubAdminSession");
const SubAdmin = require("./models/SubAdmin");
const { isAdminSessionValid, touchAdminSession } = require("./sessionManager");
const { applyCors } = require("./cors");
const { broadcastRealtimeEvent, publishAdminRealtimeEvent } = require("./ablyService");
const {
  GRADE_POINTS,
  calculateSGPA,
  calculateCGPA,
  calculateSemesterMetrics,
  getGradePoint,
  getSectionFromRegNo,
  normalizeGrade,
  assignCompetitionRanks,
  sortByScore,
} = require("./gradeCalculations");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name.trim()] = rest.join("=").trim();
  });
  return cookies;
}

function col(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
  }
  const rowKeys = Object.keys(row || {});
  for (const k of keys) {
    const found = rowKeys.find(
      (rk) =>
        rk.toLowerCase().replace(/[\s_\.]/g, "") ===
        k.toLowerCase().replace(/[\s_\.]/g, "")
    );
    if (found && row[found] !== undefined && row[found] !== "") return row[found];
  }
  return undefined;
}

function sanitizeSheetText(value) {
  const str = String(value ?? "").trim();
  if (/^[=+\-@]/.test(str)) return `'${str}`;
  return str;
}

function parseCredit(val) {
  if (!val && val !== 0) return 0;
  return String(val)
    .split("+")
    .reduce((a, c) => a + parseFloat(c || 0), 0);
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
  if (!regNo) return "CSE";
  const r = String(regNo).trim();
  if (r === "230301180026") return "CSE";
  if (["230301120110", "230301120186", "230301120371", "230301120481"].includes(r)) return "ECE";
  if (r === "230301231033") return "AERO";

  const suffix = r.length >= 9 ? r.slice(2) : r;
  if (suffix.startsWith("0301110") || suffix.startsWith("0301111")) return "CIVIL";
  if (suffix.startsWith("0301120") || suffix.startsWith("0301121")) return "CSE";
  if (suffix.startsWith("0301130") || suffix.startsWith("0301131") || suffix.startsWith("0301132")) return "ECE";
  if (suffix.startsWith("0301150") || suffix.startsWith("0301151")) return "EEE";
  if (suffix.startsWith("0301160") || suffix.startsWith("0301161")) return "ME";
  if (suffix.startsWith("0301180")) return "BIO";
  if (suffix.startsWith("0301190") || suffix.startsWith("0301191")) return "MI";
  if (suffix.startsWith("0301230")) return "AERO";

  if (r.startsWith("230301110") || r.startsWith("230301111")) return "CIVIL";
  if (r.startsWith("230301120") || r.startsWith("230301121")) return "CSE";
  if (r.startsWith("230301130") || r.startsWith("230301131") || r.startsWith("230301132")) return "ECE";
  if (r.startsWith("230301150") || r.startsWith("230301151")) return "EEE";
  if (r.startsWith("230301160") || r.startsWith("230301161")) return "ME";
  if (r.startsWith("230301180")) return "BIO";
  if (r.startsWith("230301190") || r.startsWith("230301191")) return "MI";
  if (r.startsWith("230301230")) return "AERO";
  return "CSE";
}

async function authenticateAdmin(req) {
  const cookies = parseCookies(req.headers.cookie);
  let token = req.headers["x-admin-token"];
  if (!token && cookies.jwt && cookies.jwt !== "none") {
    token = cookies.jwt;
  }
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || token === "none") {
    return { error: { status: 401, message: "Not authorized, no administrative session found.", code: "AUTH_REQUIRED" } };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.role === "student" || decoded.regNo) {
      return { error: { status: 403, message: "Forbidden: Administrative access restricted to administrators.", code: "STUDENT_ADMIN_ACCESS_FORBIDDEN" } };
    }

    if (decoded.adminType === "subadmin") {
      if (decoded.sessionId) {
        const session = await SubAdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
        if (!session) {
          return { error: { status: 401, message: "Sub-Admin session ended because this device was logged out.", code: "ADMIN_SESSION_TERMINATED" } };
        }
      }
      const subAdmin = await SubAdmin.findById(decoded.subAdminId);
      if (!subAdmin) {
        return { error: { status: 403, message: "Sub-Admin account not found.", code: "SUBADMIN_NOT_FOUND" } };
      }
      if (subAdmin.status !== "active") {
        return { error: { status: 403, message: `Sub-Admin account is ${subAdmin.status}.`, code: `SUBADMIN_${subAdmin.status.toUpperCase()}` } };
      }
      return {
        admin: {
          role: "admin",
          adminType: "subadmin",
          id: subAdmin._id,
          username: subAdmin.username,
          name: subAdmin.name,
          email: subAdmin.email,
          permissions: subAdmin.permissions || { routes: [], actions: [] },
          sessionId: decoded.sessionId,
        },
      };
    }

    if (!decoded.sessionId) {
      return {
        error: {
          status: 401,
          message: "Administrative session token invalid or missing session identifier.",
          code: "AUTH_SESSION_INVALID",
        },
      };
    }

    const session = await AdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
    if (!session || !isAdminSessionValid(session)) {
      return {
        error: {
          status: 401,
          message: "Admin session ended because this device was logged out.",
          code: "ADMIN_SESSION_TERMINATED",
        },
      };
    }

    await touchAdminSession(session);

    return {
      admin: {
        role: "admin",
        adminType: "main",
        username: decoded.username || "admin",
        email: decoded.email || process.env.ADMIN_EMAIL,
        permissions: { routes: ["*"], actions: ["*"] },
        sessionId: session.sessionId,
      },
    };
  } catch {
    return { error: { status: 401, message: "Not authorized, invalid admin token.", code: "INVALID_ADMIN_TOKEN" } };
  }
}

function parseMultipartRequest(req) {
  return new Promise((resolve, reject) => {
    if (req.file && req.file.buffer) {
      return resolve({ fields: req.body || {}, fileBuffer: req.file.buffer, fileInfo: req.file });
    }

    try {
      const busboy = Busboy({
        headers: req.headers,
        limits: {
          fileSize: 15 * 1024 * 1024,
          files: 1,
        },
      });

      const fields = {};
      let fileBuffer = null;
      let fileInfo = null;

      busboy.on("field", (name, value) => {
        fields[name] = value;
      });

      busboy.on("file", (name, stream, info) => {
        fileInfo = info;
        const chunks = [];
        stream.on("data", (chunk) => {
          chunks.push(chunk);
        });
        stream.on("end", () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      busboy.on("finish", () => {
        resolve({ fields, fileBuffer, fileInfo });
      });

      busboy.on("error", (err) => {
        reject(err);
      });

      req.pipe(busboy);
    } catch (err) {
      reject(err);
    }
  });
}

async function syncRankingsMetadataAndBroadcast(semester = null) {
  try {
    const semesters = await Ranking.distinct("semester", { sgpa: { $gt: 0 } });
    const batches = await Ranking.distinct("batch", { batch: { $ne: null } });
    const branches = ["CSE", "CIVIL", "ME", "ECE", "EEE", "BIO", "MI", "AERO"];
    const newVersion = Date.now();

    await SystemConfig.findOneAndUpdate(
      { key: "rankings_meta" },
      {
        $set: {
          key: "rankings_meta",
          "rankingsMeta.version": newVersion,
          "rankingsMeta.semesters": semesters.map(Number).sort((a, b) => a - b),
          "rankingsMeta.batches": batches.filter(Boolean).sort(),
          "rankingsMeta.branches": branches,
          "rankingsMeta.updatedAt": new Date(),
        },
      },
      { upsert: true, new: true }
    );

    await broadcastRealtimeEvent("rankings-updated", {
      timestamp: newVersion,
      version: newVersion,
      semester: semester ? Number(semester) : null,
    });
    await publishAdminRealtimeEvent("rankings-updated", {
      timestamp: newVersion,
      version: newVersion,
      semester: semester ? Number(semester) : null,
    });
  } catch (err) {
    console.error("[RankingsSync] Failed to sync metadata:", err?.message || err);
  }
}

async function generateRankingForSemester(semester, preloadedAllResults = null, shouldBroadcast = true, targetBatch = null) {
  const semNum = Number(semester);
  let allResults = preloadedAllResults;
  if (!allResults) {
    const query = { semester: { $lte: semNum } };
    if (targetBatch) {
      query.batch = String(targetBatch).trim();
    }
    allResults = await SemesterResult.find(query, "regNo studentName branch batch semester subjects totalCredits creditsCleared sgpa").lean();
  }
  const semResults = allResults.filter((r) => Number(r.semester) === semNum && (!targetBatch || (r.batch || "") === String(targetBatch).trim()));
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
        section: getSectionFromRegNo(r.regNo),
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
      s.percentile = parseFloat(((1 - (s.sgpaRank - 1) / studentData.length) * 100).toFixed(1));
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

  if (shouldBroadcast) {
    await syncRankingsMetadataAndBroadcast(semNum);
  }
}

// ─── HANDLER: RESULTS & BACKLOGS UPLOAD ────────────────────────────────────────
async function handleRegularAndBacklogUpload(fileBuffer, fields, isBacklogMode, res) {
  const wb = XLSX.read(fileBuffer, { type: "buffer" });
  const formSemester = fields.semester;
  const formBatch = fields.batch;
  const formProgram = fields.program;
  const formSession = fields.session;
  const uploadType = isBacklogMode ? "backlog" : (fields.uploadType || "regular");
  const isEodOrRecheck = isBacklogMode || uploadType === "eod" || uploadType === "rechecking" || uploadType === "backlog";

  const grouped = {};
  let totalParsedRows = 0;

  wb.SheetNames.forEach((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    totalParsedRows += rows.length;

    rows.forEach((row, idx) => {
      const regNo = String(col(row, "Reg_No", "RegNo", "reg_no", "Reg No", "Registration No", "regno") || "").trim();
      const name = sanitizeSheetText(col(row, "Name", "StudentName", "Student Name", "student_name") || "");
      const subCode = sanitizeSheetText(col(row, "Subject_Code", "SubCode", "Sub Code", "subject_code", "Code") || "");
      const subName = sanitizeSheetText(col(row, "Subject_Name", "SubName", "Subject", "subject_name") || "");
      const type = String(col(row, "Type", "type") || "").trim();
      const credit = parseCredit(col(row, "Credits", "Credit", "credits", "credit") || 0);
      const grade = normalizeGrade(col(row, "New Grade", "NewGrade", "Grade", "grade") || "");
      const slNo = col(row, "Sl No", "SlNo", "Sl_No", "sl_no", "S.No", "SNo", "SI No") || idx + 1;

      const excelSem = col(row, "Semester", "semester", "Sem", "sem");
      const semRaw = excelSem !== undefined && excelSem !== null && excelSem !== "" ? excelSem : formSemester;
      let semester = Number(semRaw);

      let batch = detectBatch(regNo);
      if (!batch) {
        batch = String(formBatch || col(row, "Batch", "batch") || "");
      }

      let branch = detectBranch(regNo);
      if (!branch) {
        branch = String(col(row, "Branch", "branch") || sheetName || "").trim();
      }
      const program = String(formProgram || "").trim();
      const session = String(formSession || col(row, "Session", "session") || "");

      if (!regNo) return;
      if (!isEodOrRecheck && (!semester || isNaN(semester))) return;
      if (isEodOrRecheck && isNaN(semester)) semester = null;
      if (!grade || !(grade in GRADE_POINTS)) return;

      const key = isEodOrRecheck && !semester ? regNo : `${regNo}_${semester}`;
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
      success: false,
      message: "No valid rows found. Check that Semester is provided (either in Excel or form fields), and Grade values are valid.",
    });
  }

  let count = 0;
  const affectedSemesters = new Set();
  const bulkOps = [];
  const allRegNos = Array.from(new Set(keys.map((k) => grouped[k].regNo)));

  const allExistingRecords = await SemesterResult.find({ regNo: { $in: allRegNos } }).lean();
  const allExistingRecordsByRegNo = {};
  allExistingRecords.forEach((r) => {
    if (!allExistingRecordsByRegNo[r.regNo]) allExistingRecordsByRegNo[r.regNo] = [];
    allExistingRecordsByRegNo[r.regNo].push(r);
  });

  for (const key of keys) {
    const data = grouped[key];
    const existingRecords = allExistingRecordsByRegNo[data.regNo] || [];
    const recordsToSave = new Map();

    data.subjects.forEach((newSub) => {
      let targetSem = data.semester;

      if (!targetSem && isEodOrRecheck) {
        const rec = existingRecords.find((r) => r.subjects && r.subjects.some((s) => s.subCode === newSub.subCode));
        if (rec) targetSem = rec.semester;
      }

      if (!targetSem) return;

      let record = recordsToSave.get(targetSem) || existingRecords.find((r) => r.semester === targetSem);

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
        record = { ...record };
        if (data.branch) record.branch = data.branch;
        if (data.batch) record.batch = data.batch;
        if (data.studentName) record.studentName = data.studentName;
      }

      if (!Array.isArray(record.subjects)) record.subjects = [];
      const existingSub = record.subjects.find((s) => s.subCode === newSub.subCode);
      if (existingSub) {
        const oldGp = GRADE_POINTS[existingSub.grade] !== undefined ? GRADE_POINTS[existingSub.grade] : -1;
        const newGp = GRADE_POINTS[newSub.grade] !== undefined ? GRADE_POINTS[newSub.grade] : -1;

        if (newGp > oldGp) {
          existingSub.grade = newSub.grade;
          existingSub.gradePoint = newSub.gradePoint;
          if (isEodOrRecheck) existingSub.resultType = newSub.resultType;
        }

        if (!existingSub.credit && newSub.credit) existingSub.credit = newSub.credit;
        if (!existingSub.subName && newSub.subName) existingSub.subName = newSub.subName;
        if (!existingSub.type && newSub.type) existingSub.type = newSub.type;
      } else {
        record.subjects.push(newSub);
      }

      recordsToSave.set(targetSem, record);
      affectedSemesters.add(targetSem);
    });

    for (const [sem, record] of recordsToSave.entries()) {
      const { totalCredits, creditsCleared, sgpa } = calculateSemesterMetrics(record.subjects, record.semester);

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

  if (affectedSemesters.size > 0 && allRegNos.length > 0) {
    const subsequentSemesters = await SemesterResult.find({
      regNo: { $in: allRegNos },
      semester: { $gt: Math.max(...affectedSemesters) },
    }).distinct("semester");

    subsequentSemesters.forEach((s) => affectedSemesters.add(Number(s)));
  }

  const sortedSemesters = Array.from(affectedSemesters).sort((a, b) => a - b);
  for (const sem of sortedSemesters) {
    await generateRankingForSemester(sem, null, true, formBatch || null);
  }

  await broadcastRealtimeEvent("rankings-updated", {
    semesters: sortedSemesters,
    timestamp: Date.now(),
  }).catch(() => {});

  return res.json({
    success: true,
    message: isEodOrRecheck
      ? `Successfully uploaded ${count} backlog clearance record(s) and auto-updated rankings & CGPA!`
      : `Successfully uploaded ${count} student semester record(s) and auto-updated rankings & CGPA!`,
    count,
  });
}

// ─── HANDLER: INTERNAL MARKS UPLOAD ───────────────────────────────────────────
async function handleInternalMarksUpload(fileBuffer, fields, res) {
  const formSemester = fields.semester;
  const formProgram = fields.program;
  const formSession = fields.session;
  const formBatch = fields.batch;
  const grouped = {};
  const wb = XLSX.read(fileBuffer, { type: "buffer" });
  const uploadSemester = Number(formSemester) || 1;
  const isSem1Upload = uploadSemester === 1;

  const sem1Assessments = new Set(["classTest1", "classTest2", "classTest3", "classTest4", "assignment", "total"]);
  const regularAssessments = new Set(["midSem", "presentation", "assignment", "learningRecord", "internalPractical", "projectInternal", "total"]);

  const compactHeader = (v) => String(v || "").trim().toUpperCase().replace(/[\s\-_.:]+/g, "");

  const detectAssessment = (value) => {
    const cleanVal = compactHeader(value);
    if (!cleanVal) return null;
    if (cleanVal.includes("MIDSEMESTER") || cleanVal.includes("MIDSEM")) return "midSem";
    if (cleanVal.includes("CLASSTESTIV") || cleanVal.includes("CLASSTEST4") || cleanVal.includes("CTIV") || cleanVal.includes("CT4")) return "classTest4";
    if (cleanVal.includes("CLASSTESTIII") || cleanVal.includes("CLASSTEST3") || cleanVal.includes("CTIII") || cleanVal.includes("CT3")) return "classTest3";
    if (cleanVal.includes("CLASSTESTII") || cleanVal.includes("CLASSTEST2") || cleanVal.includes("CTII") || cleanVal.includes("CT2")) return "classTest2";
    if (cleanVal.includes("CLASSTESTI") || cleanVal.includes("CLASSTEST1") || cleanVal.includes("CTI") || cleanVal.includes("CT1")) return "classTest1";
    if (cleanVal.includes("PRESENTATION")) return "presentation";
    if (cleanVal.includes("ASSIGNMENT")) return "assignment";
    if (cleanVal.includes("LEARNINGRECORD")) return "learningRecord";
    if (cleanVal.includes("INTERNALPRACTICAL") || cleanVal.includes("INTERNALPRAC")) return "internalPractical";
    if (cleanVal.includes("PROJECTINTERNAL")) return "projectInternal";
    if (cleanVal === "TOTAL" || cleanVal.includes("TOTALSCORE")) return "total";
    return null;
  };

  const isAllowedAssessment = (a) => a && (isSem1Upload ? sem1Assessments.has(a) : regularAssessments.has(a));

  const isSubjectNoise = (val) => {
    const cleanVal = compactHeader(val);
    return (
      !val ||
      detectAssessment(val) ||
      cleanVal.includes("ROUND") ||
      cleanVal.includes("OBTAINED") ||
      cleanVal.includes("MAX") ||
      cleanVal.includes("SEMESTER") ||
      cleanVal.includes("STUDENT") ||
      cleanVal.includes("ROLL") ||
      cleanVal.includes("REGNO") ||
      ["SRNO", "SLNO", "SNO"].includes(cleanVal)
    );
  };

  wb.SheetNames.forEach((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (!rows || rows.length < 5) return;

    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(15, rows.length); r++) {
      const rowStr = rows[r].join("").toLowerCase();
      if (rowStr.includes("student") && (rowStr.includes("rollno") || rowStr.includes("regno"))) {
        headerRowIdx = r;
        break;
      }
    }
    if (headerRowIdx === -1) headerRowIdx = 6;

    let maxCol = 0;
    for (let r = Math.max(0, headerRowIdx - 3); r <= headerRowIdx + 2; r++) {
      if (rows[r] && rows[r].length > maxCol) maxCol = rows[r].length;
    }

    const colMap = {};
    let currentSubject = null;
    let currentAssessment = null;
    let assessmentMetrics = {};

    for (let c = 3; c < maxCol; c++) {
      let foundSubject = null;
      for (let r = Math.max(0, headerRowIdx - 3); r <= headerRowIdx; r++) {
        const val = String(rows[r] && rows[r][c] ? rows[r][c] : "").trim();
        if (val) {
          const subMatch = val.match(/-\s*\((.*?)\)\s*\((pp|pr|tut)/i) || val.match(/\((.*?)\)\s*\((pp|pr|tut)/i);
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

      let foundAss = null;
      for (let r = Math.max(0, headerRowIdx - 3); r <= headerRowIdx + 2; r++) {
        const detected = detectAssessment(rows[r] && rows[r][c]);
        if (isAllowedAssessment(detected)) foundAss = detected;
      }
      if (foundAss) {
        if (currentAssessment !== foundAss) {
          currentAssessment = foundAss;
          assessmentMetrics = {};
        }
      }

      let foundMetric = null;
      for (let r = Math.max(0, headerRowIdx - 3); r <= headerRowIdx + 2; r++) {
        const cleanVal = compactHeader(rows[r] && rows[r][c]);
        if (cleanVal.includes("ROUND")) {
          foundMetric = "roundOff";
        } else if (cleanVal.includes("OBTAINED") || cleanVal.includes("OBT")) {
          foundMetric = !isSem1Upload && assessmentMetrics["obtained"] ? "roundOff" : "obtained";
        } else if (cleanVal.includes("MAX")) {
          foundMetric = "max";
        } else if (currentAssessment === "total" && cleanVal.includes("TOTALSCORE")) {
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
        if (foundMetric === "obtained" && assessmentMetrics["obtained"]) foundMetric = "roundOff";
        assessmentMetrics[foundMetric] = true;
        colMap[c] = {
          subject: currentSubject,
          assessment: "total",
          metric: foundMetric,
        };
      }
    }

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      let regNo = "";
      let name = "";

      for (let c = 0; c < Math.min(5, row.length); c++) {
        const val = String(row[c] || "").trim();
        if (val && !isNaN(val) && val.length > 5 && !regNo) {
          regNo = val;
        } else if (val && isNaN(val) && val.length > 3 && !val.toLowerCase().includes("sr") && !name) {
          name = val;
        }
      }

      if (!regNo) continue;

      const semester = Number(formSemester) || uploadSemester;
      const branch = String(sheetName || "").trim() || detectBranch(regNo);
      const program = String(formProgram || "").trim();
      const session = String(formSession || "").trim();
      let batch = detectBatch(regNo) || String(formBatch || "");

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
        if (rawVal === undefined || rawVal === null || String(rawVal).trim() === "" || String(rawVal).trim() === "-") continue;

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
  });

  let count = 0;
  for (const key of Object.keys(grouped)) {
    const student = grouped[key];
    student.subjects = Object.values(student.subjectsObj);
    delete student.subjectsObj;

    await InternalMark.findOneAndUpdate(
      { regNo: student.regNo, semester: student.semester },
      { $set: student },
      { upsert: true, new: true }
    );
    count++;
  }

  await broadcastRealtimeEvent("rankings-updated", {
    semesters: [uploadSemester],
    timestamp: Date.now(),
  }).catch(() => {});

  return res.json({
    success: true,
    message: `Uploaded internal marks for ${count} student(s)`,
    count,
  });
}

// ─── HANDLER: MISSING RESULTS INGESTION ────────────────────────────────────────
async function handleMissingResultsUpload(fileBuffer, fields, res) {
  const wb = XLSX.read(fileBuffer, { type: "buffer" });
  const formSemester = fields.semester;
  const formBatch = fields.batch;
  const formProgram = fields.program;
  const formSession = fields.session;

  const grouped = {};
  let totalInFile = 0;

  wb.SheetNames.forEach((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    totalInFile += rows.length;

    rows.forEach((row, idx) => {
      const regNo = String(col(row, "Reg_No", "RegNo", "reg_no", "Reg No", "Registration No", "regno") || "").trim();
      const name = sanitizeSheetText(col(row, "Name", "StudentName", "Student Name", "student_name") || "");
      const subCode = sanitizeSheetText(col(row, "Subject_Code", "SubCode", "Sub Code", "subject_code", "Code") || "");
      const subName = sanitizeSheetText(col(row, "Subject_Name", "SubName", "Subject", "subject_name") || "");
      const type = String(col(row, "Type", "type") || "").trim();
      const credit = parseCredit(col(row, "Credits", "Credit", "credits", "credit") || 0);
      const grade = normalizeGrade(col(row, "New Grade", "NewGrade", "Grade", "grade") || "");
      const slNo = col(row, "Sl No", "SlNo", "Sl_No", "sl_no", "S.No", "SNo", "SI No") || idx + 1;

      const semRaw = formSemester || col(row, "Semester", "semester", "Sem", "sem");
      let semester = Number(semRaw);
      let batch = detectBatch(regNo) || String(formBatch || col(row, "Batch", "batch") || "");
      let branch = detectBranch(regNo) || String(col(row, "Branch", "branch") || sheetName || "").trim();
      const program = String(formProgram || "").trim();
      const session = String(formSession || col(row, "Session", "session") || "");

      if (!regNo || !semester || isNaN(semester) || !grade || !(grade in GRADE_POINTS)) return;

      const key = `${regNo}_${semester}`;
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
        resultType: "regular",
      });
    });
  });

  const keys = Object.keys(grouped);
  if (!keys.length) {
    return res.status(400).json({ success: false, message: "No valid rows found in Excel file." });
  }

  const allRegNos = Array.from(new Set(keys.map((k) => grouped[k].regNo)));
  const existingRecords = await SemesterResult.find({ regNo: { $in: allRegNos } }, "regNo semester").lean();
  const existingSet = new Set(existingRecords.map((r) => `${r.regNo}_${r.semester}`));

  const addedStudents = [];
  const bulkOps = [];
  let skippedCount = 0;

  for (const key of keys) {
    if (existingSet.has(key)) {
      skippedCount++;
      continue;
    }

    const data = grouped[key];
    const { totalCredits, creditsCleared, sgpa } = calculateSemesterMetrics(data.subjects, data.semester);

    bulkOps.push({
      updateOne: {
        filter: { regNo: data.regNo, semester: data.semester },
        update: {
          $set: { ...data, totalCredits, creditsCleared, sgpa },
        },
        upsert: true,
      },
    });

    addedStudents.push({
      regNo: data.regNo,
      studentName: data.studentName,
      branch: data.branch,
      batch: data.batch,
      semester: data.semester,
    });
  }

  if (bulkOps.length > 0) {
    await SemesterResult.bulkWrite(bulkOps);
    const affectedSems = [...new Set(addedStudents.map((s) => s.semester))];
    for (const sem of affectedSems) {
      await generateRankingForSemester(sem, null, true, formBatch || null);
    }
  }

  return res.json({
    success: true,
    message: `Successfully ingested ${addedStudents.length} missing student record(s) (${skippedCount} already existed).`,
    totalInFile,
    skippedCount,
    addedCount: addedStudents.length,
    addedStudents,
  });
}

// ─── HANDLER: MISSING INTERNAL INGESTION ──────────────────────────────────────
async function handleMissingInternalUpload(fileBuffer, fields, res) {
  return handleInternalMarksUpload(fileBuffer, fields, res);
}

// ─── ENTRYPOINT FUNCTION FOR ROUTING ──────────────────────────────────────────
async function handleUpload(req, res) {
  applyCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed. Use POST for file uploads." });
  }

  try {
    await connectToDatabase();

    const authResult = await authenticateAdmin(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({
        success: false,
        message: authResult.error.message,
        code: authResult.error.code,
      });
    }

    const { fields, fileBuffer, fileInfo } = await parseMultipartRequest(req);

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Excel file uploaded or file is empty. Please select a valid .xlsx or .xls file.",
      });
    }

    const url = req.url || "";
    const action = String(req.query.action || "").trim();
    const cleanUrl = url.split("?")[0].toLowerCase();

    const isBacklog =
      action === "upload-backlogs" ||
      cleanUrl.includes("backlog") ||
      fields.uploadType === "backlog" ||
      fields.uploadType === "eod";

    const isInternal = action === "upload-internal" || cleanUrl.includes("internal");
    const isMissingResults = action === "upload-missing-results" || cleanUrl.includes("missing-results");
    const isMissingInternal = action === "upload-missing-internal" || cleanUrl.includes("missing-internal");

    if (isMissingResults) {
      return await handleMissingResultsUpload(fileBuffer, fields, res);
    }

    if (isMissingInternal) {
      return await handleMissingInternalUpload(fileBuffer, fields, res);
    }

    if (isInternal) {
      return await handleInternalMarksUpload(fileBuffer, fields, res);
    }

    return await handleRegularAndBacklogUpload(fileBuffer, fields, isBacklog, res);
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error occurred while processing the Excel spreadsheet upload.",
    });
  }
}

module.exports = {
  handleUpload,
};
