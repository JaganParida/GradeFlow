const https = require('https');
const fs = require('fs');
const XLSX = require('xlsx');

const url = "https://docs.google.com/spreadsheets/d/1IGRUqm1fUqvWCGAyoiUR_1uTvgbGg5CI/export?format=xlsx";

https.get(url, (res) => {
    // Handle redirects (Google Sheets usually responds with a 307 redirect)
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
            const file = fs.createWriteStream("temp_sheet.xlsx");
            redirectRes.pipe(file);
            file.on('finish', () => {
                file.close(() => analyzeSheet());
            });
        });
    } else {
        const file = fs.createWriteStream("temp_sheet.xlsx");
        res.pipe(file);
        file.on('finish', () => {
            file.close(() => analyzeSheet());
        });
    }
});

function analyzeSheet() {
    try {
        const workbook = XLSX.readFile("temp_sheet.xlsx", { cellFormula: true });
        let foundFormulas = [];
        
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            for (const cellAddress in sheet) {
                if (cellAddress.startsWith('!')) continue;
                const cell = sheet[cellAddress];
                if (cell && cell.f) {
                    foundFormulas.push({ sheet: sheetName, cell: cellAddress, formula: cell.f });
                }
            }
        }
        
        if (foundFormulas.length > 0) {
            console.log("Formulas found:");
            foundFormulas.forEach(f => console.log(`Sheet: ${f.sheet}, Cell: ${f.cell}, Formula: ${f.formula}`));
        } else {
            console.log("No formulas found in the document.");
        }
    } catch (e) {
        console.error("Error parsing the sheet:", e.message);
    }
}
