const mongoose = require("mongoose");
const SemesterResult = require("./models/SemesterResult");
const Ranking = require("./models/Ranking");
const {
  assignCompetitionRanks,
  calculateCGPA,
  calculateSGPA,
  sortByScore,
} = require("./utils/gradeCalculations");
require("dotenv").config();

async function regenerate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const semesters = await SemesterResult.distinct("semester");
    console.log("Semesters found:", semesters);

    for (const semester of semesters) {
      console.log(`Generating rankings for semester ${semester}...`);
      const results = await SemesterResult.find({ semester: Number(semester) });

      const studentData = [];
      for (const r of results) {
        const allResults = await SemesterResult.find({ regNo: r.regNo }).sort({
          semester: 1,
        });
        const cgpa = calculateCGPA(allResults, Number(semester));
        const liveSGPA = calculateSGPA(r.subjects, r.semester);

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
        s.universityRank = s.sgpaRank; // keep for backward compat
        s.totalStudents = studentData.length;
        s.percentile = parseFloat(
          ((1 - (s.sgpaRank - 1) / studentData.length) * 100).toFixed(1),
        );
      });

      const byBranch = {};
      studentData.forEach((s) => {
        if (!byBranch[s.branch]) byBranch[s.branch] = [];
        byBranch[s.branch].push(s);
      });
      Object.values(byBranch).forEach((group) => {
        sortByScore(group, "sgpa", "cgpa");
        assignCompetitionRanks(group, "sgpa", "deptRank");
        group.forEach((s) => {
          s.deptStudents = group.length;
        });
      });

      for (const s of studentData) {
        await Ranking.findOneAndUpdate(
          { regNo: s.regNo, semester: Number(semester) },
          { $set: s },
          { upsert: true, new: true },
        );
      }
      console.log(`Finished semester ${semester}`);
    }
    console.log("All done!");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

regenerate();
