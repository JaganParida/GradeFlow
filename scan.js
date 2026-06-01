const fs = require('fs');
const path = require('path');

function scan(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('dist')) {
                scan(fullPath);
            }
        } else if (file.endsWith('.jsx') || file.endsWith('.html') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('â€') || content.includes('Â·') || content.includes('')) {
                console.log(fullPath);
            }
        }
    }
}
scan('d:/Important/Development_Projects/Advanced/Gradeflow/frontend');
scan('d:/Important/Development_Projects/Advanced/Gradeflow/backend');
