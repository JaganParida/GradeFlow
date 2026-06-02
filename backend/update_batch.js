const fs = require('fs');

function updateFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  const isRegenFast = path.includes('regen_fast.js');
  if (isRegenFast) {
    content = content.replace(
      /const studentData = \[\];\s*for \(const r of semResults\) \{[\s\S]*?await Ranking\.bulkWrite\(bulkOps\);\s*\}/,
      `const batches = [...new Set(semResults.map(r => r.batch || ""))];
      for (const batch of batches) {
        const batchResults = semResults.filter(r => (r.batch || "") === batch);
        const studentData = [];
        for (const r of batchResults) {
          const studentAllResults = byRegNo[r.regNo] || [];
          const cgpa = calculateCGPA(studentAllResults, semester);
          const liveSGPA = calculateSGPA(r.subjects, r.semester);
          studentData.push({
            regNo: r.regNo, studentName: r.studentName, branch: r.branch,
            batch: r.batch, semester: Number(semester), sgpa: liveSGPA, cgpa,
          });
        }
        
        sortByScore(studentData, "cgpa", "sgpa");
        assignCompetitionRanks(studentData, "cgpa", "cgpaRank");
        sortByScore(studentData, "sgpa", "cgpa");
        assignCompetitionRanks(studentData, "sgpa", "sgpaRank");
        
        studentData.forEach((s) => {
          s.universityRank = s.sgpaRank; s.totalStudents = studentData.length;
          s.percentile = parseFloat(((1 - (s.sgpaRank - 1) / studentData.length) * 100).toFixed(1));
        });
        
        const byBranch = {};
        studentData.forEach(s => {
          if (!byBranch[s.branch]) byBranch[s.branch] = [];
          byBranch[s.branch].push(s);
        });
        Object.values(byBranch).forEach(group => {
          sortByScore(group, "sgpa", "cgpa");
          assignCompetitionRanks(group, "sgpa", "deptRank");
          group.forEach(s => s.deptStudents = group.length);
        });
        
        if (studentData.length > 0) {
          const bulkOps = studentData.map(s => ({
            updateOne: { filter: { regNo: s.regNo, semester: Number(semester) }, update: { $set: s }, upsert: true }
          }));
          await Ranking.bulkWrite(bulkOps);
        }
      }`
    );
  }

  const isAdmin = path.includes('admin.js');
  if (isAdmin) {
    content = content.replace(
      /const studentData = \[\];\s*for \(const r of results\) \{[\s\S]*?await Ranking\.bulkWrite\(bulkOps\);\s*\}/,
      `const batches = [...new Set(results.map(r => r.batch || ""))];
  for (const batch of batches) {
    const batchResults = results.filter(r => (r.batch || "") === batch);
    const studentData = [];
    for (const r of batchResults) {
      const allResults = await SemesterResult.find({ regNo: r.regNo }).sort({ semester: 1 });
      const cgpa = calculateCGPA(allResults, Number(semester));
      const liveSGPA = calculateSGPA(r.subjects, Number(semester));
      studentData.push({
        regNo: r.regNo, studentName: r.studentName, branch: r.branch,
        batch: r.batch, semester: Number(semester), sgpa: liveSGPA, cgpa,
      });
    }
    
    sortByScore(studentData, "cgpa", "sgpa");
    assignCompetitionRanks(studentData, "cgpa", "cgpaRank");
    sortByScore(studentData, "sgpa", "cgpa");
    assignCompetitionRanks(studentData, "sgpa", "sgpaRank");
    
    studentData.forEach((s) => {
      s.universityRank = s.sgpaRank; s.totalStudents = studentData.length;
      s.percentile = parseFloat(((1 - (s.sgpaRank - 1) / studentData.length) * 100).toFixed(1));
    });
    
    const byBranch = {};
    studentData.forEach(s => {
      if (!byBranch[s.branch]) byBranch[s.branch] = [];
      byBranch[s.branch].push(s);
    });
    Object.values(byBranch).forEach(group => {
      sortByScore(group, "sgpa", "cgpa");
      assignCompetitionRanks(group, "sgpa", "deptRank");
      group.forEach(s => s.deptStudents = group.length);
    });
    
    if (studentData.length > 0) {
      const bulkOps = studentData.map(s => ({
        updateOne: { filter: { regNo: s.regNo, semester: Number(semester) }, update: { $set: s }, upsert: true }
      }));
      await Ranking.bulkWrite(bulkOps);
    }
  }`
    );
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log('Updated ' + path);
}

updateFile('./routes/admin.js');
updateFile('./regen_fast.js');
