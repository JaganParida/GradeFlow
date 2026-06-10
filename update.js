const fs = require('fs');
const csv = fs.readFileSync('update_skills.csv', 'utf8');
const lines = csv.trim().split('\n');
const newSkills = [];
for(const line of lines) {
    if(!line.trim() || line.startsWith('Sl No')) continue;
    let parts = line.split(',');
    
    // Simple CSV parser for quoted strings
    let row = [];
    let cur = '';
    let inQuotes = false;
    for(let i=0; i<line.length; i++) {
        const char = line[i];
        if(char === '"' && inQuotes) inQuotes = false;
        else if(char === '"' && !inQuotes) inQuotes = true;
        else if(char === ',' && !inQuotes) {
            row.push(cur);
            cur = '';
        } else {
            cur += char;
        }
    }
    row.push(cur);
    
    if(row.length >= 5) {
        const code = row[2].trim();
        const subName = row[3].trim();
        const credits = parseInt(row[4].trim()) || 4;
        if(code) {
            newSkills.push({ subCode: code, subName, credits });
        }
    }
}
let content = fs.readFileSync('frontend/src/utils/basketLogic.js', 'utf8');
const start = content.indexOf('export const BASKET_5_SKILL_COURSES = [');
const end = content.indexOf('];', start) + 2;
const newStr = 'export const BASKET_5_SKILL_COURSES = ' + JSON.stringify(newSkills, null, 2) + ';';
content = content.substring(0, start) + newStr + content.substring(end);
fs.writeFileSync('frontend/src/utils/basketLogic.js', content);
console.log('Replaced with ' + newSkills.length + ' skills');
