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
    
    // Fetch ALL semester results at once (bulk load)
    console.log("Loading all semester results...");
    const allResults = await SemesterResult.find({}).lean();
    console.log(`Loaded ${allResults.length} semester records`);
    
    // Group by regNo for fast CGPA calculation
    const byRegNo = {};
    allResults.forEach(r => {
      if (!byRegNo[r.regNo]) byRegNo[r.regNo] = [];
      byRegNo[r.regNo].push(r);
    });
    
    // Sort each student's results by semester
    Object.values(byRegNo).forEach(records => {
      records.sort((a, b) => a.semester - b.semester);
    });
    
    // Get all distinct semesters
    const semesters = [...new Set(allResults.map(r => r.semester))].sort((a, b) => a - b);
    console.log("Semesters:", semesters);
    
    for (const semester of semesters) {
      console.log(`Processing semester ${semester}...`);
      
      // Get all results for this semester
      const semResults = allResults.filter(r => r.semester === semester);
      
      const studentData = [];
      
      for (const r of semResults) {
        const studentAllResults = byRegNo[r.regNo] || [];
        
        const cgpa = calculateCGPA(studentAllResults, semester);
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
        s.universityRank = s.sgpaRank;
        s.totalStudents = studentData.length;
        s.percentile = parseFloat(((1 - (s.sgpaRank - 1) / studentData.length) * 100).toFixed(1));
      });
      
      // Dept/branch rank
      const byBranch = {};
      studentData.forEach(s => {
        if (!byBranch[s.branch]) byBranch[s.branch] = [];
        byBranch[s.branch].push(s);
      });
      Object.values(byBranch).forEach(group => {
        sortByScore(group, "sgpa", "cgpa");
        assignCompetitionRanks(group, "sgpa", "deptRank");
        group.forEach((s) => {
          s.deptStudents = group.length;
        });
      });
      
      // Bulk upsert rankings
      if (studentData.length > 0) {
        const bulkOps = studentData.map(s => ({
          updateOne: {
            filter: { regNo: s.regNo, semester: Number(semester) },
            update: { $set: s },
            upsert: true,
          },
        }));
        await Ranking.bulkWrite(bulkOps);
      }
      
      console.log(`  Semester ${semester}: processed ${studentData.length} students. Sample CGPA range: ${studentData.slice(-1)[0]?.cgpa} - ${studentData[0]?.cgpa}`);
    }
    
    console.log("\nAll done! Rankings regenerated with official formula.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

regenerate();
