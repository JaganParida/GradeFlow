const connectToDatabase = require("./utils/db");
const SemesterResult = require("./models/SemesterResult");
const InternalMark = require("./models/InternalMark");
const Ranking = require("./models/Ranking");
const Student = require("./models/Student");
const {
  calculateBacklogs,
  calculateCGPA,
  calculateSemesterMetrics,
  getSectionFromRegNo,
} = require("./utils/gradeCalculations");

function calcAcademicHealth(cgpa, sgpa, backlogs, results) {
  let score = 0;
  score += Math.min(cgpa * 5, 50);
  score += Math.min(sgpa * 2, 20);
  score += backlogs === 0 ? 20 : Math.max(0, 20 - backlogs * 5);
  const totalSubjects = results.reduce((a, r) => a + (r.subjects || []).length, 0);
  score += Math.min(10, totalSubjects > 0 ? 10 : 0);
  return Math.round(Math.min(score, 100));
}

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
};

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    await connectToDatabase();

    const queryRegNo = req.query.regNo || req.query.registrationNumber || req.query.id;
    const cleanRegNo = String(queryRegNo || "").trim();

    if (!cleanRegNo || !/^[a-zA-Z0-9]{5,20}$/.test(cleanRegNo)) {
      return res.status(400).json({ message: "Invalid registration number format. Must be 5-20 alphanumeric characters." });
    }

    const sem = req.query.sem;
    const action = req.query.action;

    // Sub-resource: specific semester result
    if (action === "semester" && sem) {
      const result = await SemesterResult.findOne({ regNo: cleanRegNo, semester: Number(sem) });
      if (!result) return res.status(404).json({ message: "Result not found" });
      return res.json(result);
    }

    // Sub-resource: specific semester ranking
    if (action === "ranking" && sem) {
      const ranking = await Ranking.findOne({ regNo: cleanRegNo, semester: Number(sem) });
      if (!ranking) return res.status(404).json({ message: "Ranking not found" });
      return res.json(ranking);
    }

    // Sub-resource: internal marks
    if (action === "internal" && sem) {
      const marks = await InternalMark.findOne({ regNo: cleanRegNo, semester: Number(sem) });
      if (!marks) return res.status(404).json({ message: "Internal marks not found" });
      return res.json(marks);
    }

    // Full student profile
    const results = await SemesterResult.find({ regNo: cleanRegNo }).sort({ semester: 1 });
    if (!results || !results.length) {
      return res.status(404).json({ message: "Student not found" });
    }

    const cgpa = calculateCGPA(results);
    const backlogs = calculateBacklogs(results);
    const latestResult = results[results.length - 1];
    const latestMetrics = calculateSemesterMetrics(latestResult.subjects, latestResult.semester);
    const liveLatestSgpa =
      latestResult.subjects && latestResult.subjects.length > 0
        ? latestMetrics.sgpa
        : typeof latestResult.sgpa === "number"
        ? latestResult.sgpa
        : latestMetrics.sgpa;

    const healthScore = calcAcademicHealth(cgpa, liveLatestSgpa, backlogs.length, results);

    const ranking = await Ranking.findOne({
      regNo: cleanRegNo,
      semester: latestResult.semester,
    });

    const studentProfile = await Student.findOne({ regNo: cleanRegNo });

    const responseData = {
      regNo: cleanRegNo,
      studentName: latestResult.studentName,
      branch: studentProfile?.branch || latestResult.branch,
      batch: studentProfile?.batch || latestResult.batch,
      section: studentProfile?.section || getSectionFromRegNo(cleanRegNo),
      cgpa,
      latestSgpa: liveLatestSgpa,
      latestSemester: latestResult.semester,
      totalCredits: results.reduce(
        (sum, r) => sum + calculateSemesterMetrics(r.subjects, r.semester).totalCredits,
        0
      ),
      creditsCleared: results.reduce(
        (sum, r) => sum + calculateSemesterMetrics(r.subjects, r.semester).creditsCleared,
        0
      ),
      academicHealthScore: healthScore,
      backlogs,
      results,
      ranking: ranking || null,
    };

    return res.json(responseData);
  } catch (err) {
    console.error("Vercel Serverless Student Error:", err);
    return res.status(500).json({ message: "Server error fetching student profile" });
  }
};
