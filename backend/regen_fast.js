const mongoose = require("mongoose");
const SemesterResult = require("./models/SemesterResult");
const Ranking = require("./models/Ranking");
require("dotenv").config();

const GRADE_POINTS = {
  O: 10, E: 9, A: 8, B: 7, C: 6, D: 5, R: 0, F: 2, M: 0, S: 0,
};

// Truncate to 2 decimal places — official university formula uses floor, NOT round
// Example: 93/18 = 5.1666... → 5.16 (correct), Math.round gives 5.17 (wrong)
function trunc2(x) {
  return Math.floor(x * 100) / 100;
}

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
        
        // Calculate CGPA using all semesters up to and including current
        let cgpaNumerator = 0, cgpaDenominator = 0;
        
        studentAllResults
          .filter(sr => sr.semester <= semester)
          .forEach(sr => {
            let semW = 0, semC = 0;
            
            (sr.subjects || []).forEach(s => {
              // Exception: Sem 5 R-grade 6-credit project → fully skip
              if (
                Number(sr.semester) === 5 &&
                s.grade === 'R' &&
                (s.credit === 6 || (s.subName && s.subName.toLowerCase().includes('project')))
              ) return;
              
              if (s.credit && GRADE_POINTS[s.grade] !== undefined) {
                semW += s.credit * GRADE_POINTS[s.grade];
                semC += s.credit;
              }
            });
            
            if (semC > 0) {
              // Official formula: SGPA TRUNCATED (floor) to 2 decimal places per semester
              const semSGPA = trunc2(semW / semC);
              cgpaNumerator += semSGPA * semC;
              cgpaDenominator += semC;
            }
          });
        
        // CGPA = Σ(SGPA_i × Credits_i) / Σ(Credits_i), truncated to 2 decimal places
        const cgpa = cgpaDenominator > 0 ? trunc2(cgpaNumerator / cgpaDenominator) : 0;
        
        // Live-calculate SGPA for THIS semester
        let liveTW = 0, liveTC = 0;
        (r.subjects || []).forEach(s => {
          if (
            Number(r.semester) === 5 &&
            s.grade === 'R' &&
            (s.credit === 6 || (s.subName && s.subName.toLowerCase().includes('project')))
          ) return;
          
          if (s.credit && GRADE_POINTS[s.grade] !== undefined) {
            liveTW += s.credit * GRADE_POINTS[s.grade];
            liveTC += s.credit;
          }
        });
        const liveSGPA = liveTC > 0 ? trunc2(liveTW / liveTC) : 0;
        
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
      
      // Calculate CGPA Rank (Dense ranking)
      studentData.sort((a, b) => b.cgpa - a.cgpa);
      let cgpaRank = 1;
      studentData.forEach((s, i) => {
        if (i > 0 && s.cgpa < studentData[i - 1].cgpa) cgpaRank++;
        s.cgpaRank = cgpaRank;
      });
      
      // Calculate SGPA Rank (Dense ranking)
      studentData.sort((a, b) => b.sgpa - a.sgpa);
      let sgpaRank = 1;
      studentData.forEach((s, i) => {
        if (i > 0 && s.sgpa < studentData[i - 1].sgpa) sgpaRank++;
        s.universityRank = sgpaRank;
        s.sgpaRank = sgpaRank;
        s.totalStudents = studentData.length;
        s.percentile = parseFloat(((1 - (sgpaRank - 1) / studentData.length) * 100).toFixed(1));
      });
      
      // Dept/branch rank
      const byBranch = {};
      studentData.forEach(s => {
        if (!byBranch[s.branch]) byBranch[s.branch] = [];
        byBranch[s.branch].push(s);
      });
      Object.values(byBranch).forEach(group => {
        group.sort((a, b) => b.sgpa - a.sgpa);
        let dr = 1;
        group.forEach((s, i) => {
          if (i > 0 && s.sgpa < group[i - 1].sgpa) dr = i + 1;
          s.deptRank = dr;
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
