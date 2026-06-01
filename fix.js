const fs = require('fs');
const path = require('path');

const replacements = {
    'â€“': '–',       // en dash
    'â€”': '—',       // em dash
    'Â·': '·',        // middle dot
    'ï¿½?"': '—',      // U+FFFD + ?" (corrupted em-dash)
    '?"': '—',      // another representation of U+FFFD + ?"
    'ï¿½o.': '✅',      // U+FFFD + o.
    'o.': '✅',      // another representation of U+FFFD + o.
    'â€œ': '“',       // left double quote
    'â€': '”',       // right double quote
    'â€™': '’',       // right single quote
    'â€˜': '‘',       // left single quote
};

function scanAndFix(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('dist')) {
                scanAndFix(fullPath);
            }
        } else if (file.endsWith('.jsx') || file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // Apply replacements
            for (const [bad, good] of Object.entries(replacements)) {
                if (content.includes(bad)) {
                    content = content.split(bad).join(good);
                }
            }
            
            // Also handle raw U+FFFD followed by ?"
            const ufffd = String.fromCharCode(65533);
            if (content.includes(ufffd + '?"')) {
                content = content.split(ufffd + '?"').join('—');
            }
            if (content.includes(ufffd + 'o.')) {
                content = content.split(ufffd + 'o.').join('✅');
            }

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed:', fullPath);
            }
        }
    }
}

scanAndFix('d:/Important/Development_Projects/Advanced/Gradeflow/frontend');
scanAndFix('d:/Important/Development_Projects/Advanced/Gradeflow/backend');
