const fs = require('fs');
const path = require('path');

function scanAndUndo(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('dist')) {
                scanAndUndo(fullPath);
            }
        } else if (file.endsWith('.jsx') || file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            if (content.includes('✅')) {
                // If it's ✅ Successfully uploaded leave it, otherwise it's o.
                // Actually, let's just replace all ✅ with o. globally, and then I will manually fix admin.js 
                content = content.split('✅').join('o.');
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

scanAndUndo('d:/Important/Development_Projects/Advanced/Gradeflow/frontend');
scanAndUndo('d:/Important/Development_Projects/Advanced/Gradeflow/backend');
