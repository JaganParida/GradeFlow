const fs = require('fs');
let content = fs.readFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Dashboard.jsx', 'utf8');

const lines = content.split('\n');

for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('return fallbackBranch ||')) {
    lines[i] = '  return fallbackBranch || "—";';
  } else if (lines[i].includes('Back to Search')) {
    lines[i] = '          ← Back to Search';
  } else if (lines[i].includes('{dynamicBranch}')) {
    lines[i] = '              {regNo} • {dynamicBranch} • Batch {batch}';
  } else if (lines[i].includes('ALL CLEAR')) {
    lines[i] = '            <CheckCircle size={18} /> ALL CLEAR — No Active Backlogs';
  } else if (lines[i].includes('cgpaRankNum')) {
    lines[i] = '                  {semesterRanking ? # : "—"}';
  } else if (lines[i].includes('sgpaRankNum')) {
    lines[i] = '                  {semesterRanking ? # : "—"}';
  } else if (lines[i].includes('deptRank')) {
    lines[i] = '                  {semesterRanking && semesterRanking.deptRank ? # : "—"}';
  } else if (lines[i].includes('percentile')) {
    lines[i] = '            {semesterRanking ? ${semesterRanking.percentile}% : "—"}';
  } else if (lines[i].includes('r.session ||')) {
    lines[i] = '                        {r.session || "—"}';
  }
}

fs.writeFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Dashboard.jsx', lines.join('\n'), 'utf8');
console.log('Fixed remaining mojibake');
