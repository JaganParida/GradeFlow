const fs = require('fs');
let content = fs.readFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Dashboard.jsx', 'utf8');

content = content.replace(/â€”/g, '—');
content = content.replace(/â€"/g, '—');
content = content.replace(/Â·/g, '•');

content = content.replace(/â† /g, '←');
// Fix any remaining double-encoded junk by replacing specific strings
content = content.replace(/A,\?\?/g, '—');
content = content.replace(/A\?A\?/g, '←');
content = content.replace(/A,A/g, '•');

fs.writeFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Dashboard.jsx', content, 'utf8');
console.log('Fixed characters in Dashboard.jsx');
