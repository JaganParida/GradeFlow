const fs = require('fs');
let content = fs.readFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Home.jsx', 'utf8');

// Replace flex inline styles on input and button
content = content.replace(/flex: "1 1 300px", /g, '');
content = content.replace(/flex: "0 0 160px", /g, '');

// Add className to input
content = content.replace(/className="btn btn-primary"/g, 'className="btn btn-primary search-bar-btn"');
content = content.replace(/<input\s+value=\{regNo\}/g, '<input\n                className="search-bar-input"\n                value={regNo}');

fs.writeFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Home.jsx', content, 'utf8');
