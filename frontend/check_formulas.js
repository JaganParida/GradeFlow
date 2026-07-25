const ExcelJS = require('exceljs');
const https = require('https');
const fs = require('fs');

const url = 'https://docs.google.com/spreadsheets/d/1IGRUqm1fUqvWCGAyoiUR_1uTvgbGg5CI/export?format=xlsx';

https.get(url, (res) => {
    const targetUrl = res.statusCode >= 300 && res.statusCode < 400 ? res.headers.location : url;
    https.get(targetUrl, (res2) => {
        const file = fs.createWriteStream("teacher_sheet.xlsx");
        res2.pipe(file);
        file.on('finish', async () => {
            try {
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile('teacher_sheet.xlsx');
                const sheet = workbook.worksheets[0];
                console.log("D19 (Sem 1 Total Basket 1):", sheet.getCell('D19').formula || sheet.getCell('D19').value);
                console.log("I19 (Sem 1 Grand Total):", sheet.getCell('I19').formula || sheet.getCell('I19').value);
                console.log("M19 (Sem 2 Total Basket 1):", sheet.getCell('M19').formula || sheet.getCell('M19').value);
                console.log("R19 (Sem 2 Grand Total):", sheet.getCell('R19').formula || sheet.getCell('R19').value);
                
                console.log("M20 (1st Year Cumulative Basket 1):", sheet.getCell('M20').formula || sheet.getCell('M20').value);
                console.log("R20 (1st Year Cumulative Grand Total):", sheet.getCell('R20').formula || sheet.getCell('R20').value);
                
                console.log("M33 (1st & 2nd Year Cumulative):", sheet.getCell('M33').formula || sheet.getCell('M33').value);
            } catch (err) {
                console.error(err);
            }
        });
    });
});
