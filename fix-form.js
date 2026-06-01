const fs = require('fs');
let content = fs.readFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Home.jsx', 'utf8');

// safely replace form
content = content.replace('<form onSubmit={handleSearch}>', '<form onSubmit={handleSearch} style={{ width: \"100%\" }}>');

fs.writeFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Home.jsx', content, 'utf8');
