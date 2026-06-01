const fs = require('fs');
let content = fs.readFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Home.jsx', 'utf8');

// Fix the corrupted em-dash
content = content.replace(/insights.*?all in one place/g, 'insights — all in one place');

// Change parent maxWidth from 600 to 800
content = content.replace(/maxWidth: 600,/g, 'maxWidth: 800,');

fs.writeFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Home.jsx', content, 'utf8');
