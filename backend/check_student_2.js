require('dotenv').config();
const mongoose = require('mongoose');
const SemesterResult = require('./models/SemesterResult');
const Ranking = require('./models/Ranking');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const regNo = "230301230002";

    const semResults = await SemesterResult.find({ regNo });
    console.log(`Found ${semResults.length} total SemesterResult documents for this student.`);
    
    for (const res of semResults) {
      console.log(`\nSemester: ${res.semester}, ResultType: ${res.resultType || 'N/A'}`);
      console.log(`  SGPA: ${res.sgpa}, Credits Cleared: ${res.creditsCleared}/${res.totalCredits}`);
      for (const sub of res.subjects) {
        if (sub.subCode === "CUTM1578" || sub.grade === "S" || sub.grade === "F" || sub.grade === "M") {
          console.log(`  Subject: ${sub.subName} (${sub.subCode}) - Grade: ${sub.grade} (Points: ${sub.gradePoint})`);
        }
      }
    }

    const rankings = await Ranking.find({ regNo });
    console.log(`\nFound ${rankings.length} Ranking documents:`);
    for (const r of rankings) {
      console.log(`Semester: ${r.semester}, SGPA: ${r.sgpa}, CGPA: ${r.cgpa}`);
    }

  } catch (e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}
main();
