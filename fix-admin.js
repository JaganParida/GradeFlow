const fs = require('fs');
let content = fs.readFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/backend/routes/admin.js', 'utf8');
content = content.replace(/.*?o\. Successfully uploaded/g, '✅ Successfully uploaded');
content = content.replace(/.*?o\. Uploaded internal/g, '✅ Uploaded internal');
content = content.replace(/.*?o\. Subject created/g, '✅ Subject created');
fs.writeFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/backend/routes/admin.js', content, 'utf8');
