const fs = require('fs');
const path = require('path');

const docPath = 'C:\\Users\\jagan\\.gemini\\antigravity\\brain\\6962db33-3a21-44dd-ba6b-315e44d407a6\\.system_generated\\steps\\140\\content.md';
const logicPath = 'd:\\Important\\Development_Projects\\Advanced\\Gradeflow\\frontend\\src\\utils\\basketLogic.js';

const docContent = fs.readFileSync(docPath, 'utf8');
const logicContent = fs.readFileSync(logicPath, 'utf8');

const docLines = docContent.split('\n').map(l => l.trim()).filter(l => l);
const newCourses = [];

for (let i = 0; i < docLines.length; i++) {
    if (docLines[i].startsWith('CUTM')) {
        const code = docLines[i];
        const name = docLines[i+1];
        const credits = parseInt(docLines[i+2], 10) || 4;
        newCourses.push({
            subCode: code,
            subName: name,
            credits: credits
        });
    }
}

console.log(`Found ${newCourses.length} courses in doc.`);

// Find existing courses
let existingCodes = new Set();
const existingMatches = logicContent.match(/"subCode":\s*"([^"]+)"/g);
if (existingMatches) {
    existingMatches.forEach(m => {
        const code = m.match(/"subCode":\s*"([^"]+)"/)[1];
        existingCodes.add(code);
    });
}

const toAdd = newCourses.filter(c => !existingCodes.has(c.subCode));
console.log(`Adding ${toAdd.length} new courses.`);

if (toAdd.length > 0) {
    const coursesStr = toAdd.map(c => `  {
    "subCode": "${c.subCode}",
    "subName": "${c.subName}",
    "credits": ${c.credits}
  }`).join(',\n') + ',\n';

    // find the start of BASKET_5_SKILL_COURSES
    const marker = 'export const BASKET_5_SKILL_COURSES = [\\n';
    const markerIndex = logicContent.indexOf('export const BASKET_5_SKILL_COURSES = [');
    
    if (markerIndex !== -1) {
        const insertIndex = logicContent.indexOf('[', markerIndex) + 2;
        const newLogicContent = logicContent.slice(0, insertIndex) + coursesStr + logicContent.slice(insertIndex);
        fs.writeFileSync(logicPath, newLogicContent);
        console.log('Successfully updated basketLogic.js');
    } else {
        console.log('Could not find BASKET_5_SKILL_COURSES array.');
    }
} else {
    console.log('No new courses to add.');
}
