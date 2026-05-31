const mongoose = require("mongoose");
const SemesterResult = require("./models/SemesterResult");
const Ranking = require("./models/Ranking");
require("dotenv").config();

const GRADE_POINTS = {
  O: 10, E: 9, A: 8, B: 7, C: 6, D: 5, R: 10, F: 2, M: 0, S: 0,
};

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
        let totalW = 0, totalC = 0;
        allResults.forEach((ar) =>
          ar.subjects.forEach((s) => {
            if (s.credit && GRADE_POINTS[s.grade] !== undefined) {
              totalW += s.credit * GRADE_POINTS[s.grade];
              totalC += s.credit;
            }
          }),
        );
        const cgpa = totalC > 0 ? Math.floor((totalW / totalC) * 100 + 0.0001) / 100 : 0;
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

      // Calculate CGPA Rank (Dense)
      studentData.sort((a, b) => b.cgpa - a.cgpa);
      let cgpaRank = 1;
      studentData.forEach((s, i) => {
        if (i > 0 && s.cgpa < studentData[i - 1].cgpa) cgpaRank++;
        s.cgpaRank = cgpaRank;
      });

      // Calculate SGPA Rank (Dense)
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
          if (i > 0 && s.sgpa < group[i - 1].sgpa) dr = i + 1; // leave dept as is or update it?
          s.deptRank = dr;
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
