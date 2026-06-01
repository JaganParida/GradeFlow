const fs = require('fs');
let content = fs.readFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/index.html', 'utf8');
content = content.replace(/<title>.*?<\/title>/, '<title>GradeFlow — Academic Analytics</title>');
fs.writeFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/index.html', content, 'utf8');
