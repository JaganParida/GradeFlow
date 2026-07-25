import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getSubjectBasket } from "./pdfGenerator";

export const generateBasketExcel = async (studentData) => {
    try {
        const semSubjects = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
        const addedSubCodes = new Set();
        
        const isCSE = studentData ? (!studentData.branch || studentData.branch.toUpperCase() === "CSE") : true;

        if (studentData && studentData.results) {
            studentData.results.forEach(semData => {
                semData.subjects.forEach(sub => {
                    let targetSem = Number(semData.semester);
                    const isProject = (sub.subName || "").toLowerCase().includes("project") || (sub.type && sub.type.toLowerCase() === "project");
                    if (targetSem === 5 && Number(sub.credit) === 6 && isProject) {
                        targetSem = 6;
                    }
                    
                    if (targetSem >= 1 && targetSem <= 8) {
                       const code = sub.subCode || sub.subName;
                       if (!addedSubCodes.has(code)) {
                           semSubjects[targetSem].push(sub);
                           addedSubCodes.add(code);
                       }
                    }
                });
            });
        }
        
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Credit Track Sheet");
        
        // Define standard styles
        const fontBold = { name: "Arial", bold: true, size: 10 };
        const fontNormal = { name: "Arial", size: 10 };
        const alignCenter = { vertical: "middle", horizontal: "center", wrapText: true };
        const alignLeft = { vertical: "middle", horizontal: "left", wrapText: true };
        const borderThin = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        const bgBlue = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDEBF7" } };
        const bgBlueLight = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDEBF7" } };
        
        // Set column widths based on typical layout
        // Left side: A to I (9 cols) -> A: Sl.No, B: Code, C: Subject, D: B1, E: B2, F: B3, G: B4, H: B5, I: Total
        sheet.getColumn(1).width = 5;
        sheet.getColumn(2).width = 12;
        sheet.getColumn(3).width = 30;
        for (let i = 4; i <= 9; i++) sheet.getColumn(i).width = 10;
        
        // Right side: J to R (9 cols) -> J: Sl.No, K: Code, L: Subject, M: B1, N: B2, O: B3, P: B4, Q: B5, R: Total
        sheet.getColumn(10).width = 5;
        sheet.getColumn(11).width = 12;
        sheet.getColumn(12).width = 30;
        for (let i = 13; i <= 18; i++) sheet.getColumn(i).width = 10;
        
        const mergeAndStyle = (rowIdx, colStart, colEnd, value, font, alignment, fill) => {
            if (colStart !== colEnd) {
                sheet.mergeCells(rowIdx, colStart, rowIdx, colEnd);
            }
            const cell = sheet.getCell(rowIdx, colStart);
            cell.value = value;
            if (font) cell.font = font;
            if (alignment) cell.alignment = alignment;
            if (fill) cell.fill = fill;
        };

        // Header Section
        mergeAndStyle(1, 1, 18, "CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT", { name: "Arial", bold: true, size: 18 }, alignCenter);
        mergeAndStyle(2, 1, 18, "SCHOOL OF ENGINEERING & TECHNOLOGY", { name: "Arial", bold: true, size: 14 }, alignCenter);
        mergeAndStyle(3, 1, 18, "BHUBANESWAR CAMPUS", { name: "Arial", bold: true, size: 14 }, alignCenter);
        mergeAndStyle(4, 1, 18, "SUBJECT REGISTRATION AS PER CBCS CURRICULUM", { name: "Arial", bold: true, size: 14 }, alignCenter);
        
        sheet.getRow(6).height = 20;
        mergeAndStyle(6, 1, 4, `NAME OF STUDENT: ${studentData.studentName || ""}`, fontBold, alignLeft, bgBlue);
        mergeAndStyle(6, 5, 12, `REGISTRATION NO- ${studentData.regNo || ""}`, fontBold, alignCenter, bgBlue);
        mergeAndStyle(6, 13, 18, `BRANCH: ${studentData.branch || "CSE"}`, fontBold, alignCenter, bgBlue);
        
        let currentRow = 8;
        const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
        let prevCumRow = null;

        const buildYearBlock = (semA, semB, cumLabel) => {
            // Add Sem Header
            mergeAndStyle(currentRow, 1, 9, `Semester-${roman[semA-1]}`, fontBold, alignLeft, bgBlue);
            mergeAndStyle(currentRow, 10, 18, `Semester-${roman[semB-1]}`, fontBold, alignLeft, bgBlue);
            
            // Apply borders to sem header
            for (let i = 1; i <= 18; i++) {
                sheet.getCell(currentRow, i).border = borderThin;
            }

            currentRow++;
            
            // Add Columns Header
            const headers = [
                'Sl. No', 'Subject Code', 'Subject Name', 'Basket 1\n(Credit)', 'Basket 2\n(Credit)', 'Basket 3\n(Credit)', 'Basket 4\n(Credit)', 'Basket 5\n(Credit)', 'Grand Total\n(Credit)'
            ];
            const colHeaderRow = sheet.getRow(currentRow);
            colHeaderRow.height = 30;
            for (let i = 0; i < 9; i++) {
                const cellA = sheet.getCell(currentRow, i + 1);
                cellA.value = headers[i];
                cellA.font = fontBold;
                cellA.alignment = alignCenter;
                cellA.border = borderThin;
                
                const cellB = sheet.getCell(currentRow, i + 10);
                cellB.value = headers[i];
                cellB.font = fontBold;
                cellB.alignment = alignCenter;
                cellB.border = borderThin;
            }
            currentRow++;

            const subsA = semSubjects[semA];
            const subsB = semSubjects[semB];
            const maxRows = Math.max(subsA.length, subsB.length, 10);
            const startDataRow = currentRow;
            
            const showCreditA = isCSE || semA <= 2;
            const showCreditB = isCSE || semB <= 2;

            for (let i = 0; i < maxRows; i++) {
                // Formatting borders for empty cells as well
                for (let c = 1; c <= 18; c++) {
                    const cell = sheet.getCell(currentRow, c);
                    cell.border = borderThin;
                    cell.alignment = c === 3 || c === 12 ? alignLeft : alignCenter;
                    cell.font = fontNormal;
                }

                // Left Side (Sem A)
                if (i < subsA.length) {
                    const s = subsA[i];
                    const basket = getSubjectBasket(s);
                    const cr = Number(s.credit) || 0;
                    
                    sheet.getCell(currentRow, 1).value = i + 1;
                    sheet.getCell(currentRow, 2).value = s.subCode || "";
                    sheet.getCell(currentRow, 3).value = s.subName || "";
                    
                    if (showCreditA) {
                        if (basket === "B1") sheet.getCell(currentRow, 4).value = cr;
                        else if (basket === "B2") sheet.getCell(currentRow, 5).value = cr;
                        else if (basket === "B3") sheet.getCell(currentRow, 6).value = cr;
                        else if (basket === "B4") sheet.getCell(currentRow, 7).value = cr;
                        else if (basket === "B5" || basket === "EX") sheet.getCell(currentRow, 8).value = cr;
                        
                        sheet.getCell(currentRow, 9).value = { formula: `SUM(D${currentRow}:H${currentRow})` };
                    }
                }
                
                // Right Side (Sem B)
                if (i < subsB.length) {
                    const s = subsB[i];
                    const basket = getSubjectBasket(s);
                    const cr = Number(s.credit) || 0;
                    
                    sheet.getCell(currentRow, 10).value = i + 1;
                    sheet.getCell(currentRow, 11).value = s.subCode || "";
                    sheet.getCell(currentRow, 12).value = s.subName || "";
                    
                    if (showCreditB) {
                        if (basket === "B1") sheet.getCell(currentRow, 13).value = cr;
                        else if (basket === "B2") sheet.getCell(currentRow, 14).value = cr;
                        else if (basket === "B3") sheet.getCell(currentRow, 15).value = cr;
                        else if (basket === "B4") sheet.getCell(currentRow, 16).value = cr;
                        else if (basket === "B5" || basket === "EX") sheet.getCell(currentRow, 17).value = cr;
                        
                        sheet.getCell(currentRow, 18).value = { formula: `SUM(M${currentRow}:Q${currentRow})` };
                    }
                }
                
                currentRow++;
            }
            
            const endDataRow = currentRow - 1;
            
            // Total Row
            for (let c = 1; c <= 18; c++) {
                const cell = sheet.getCell(currentRow, c);
                cell.border = borderThin;
                cell.font = fontBold;
                cell.alignment = alignCenter;
            }
            
            if (showCreditA) {
                mergeAndStyle(currentRow, 1, 3, "Total", fontBold, alignCenter);
                sheet.getCell(currentRow, 4).value = { formula: `SUM(D${startDataRow}:D${endDataRow})` };
                sheet.getCell(currentRow, 5).value = { formula: `SUM(E${startDataRow}:E${endDataRow})` };
                sheet.getCell(currentRow, 6).value = { formula: `SUM(F${startDataRow}:F${endDataRow})` };
                sheet.getCell(currentRow, 7).value = { formula: `SUM(G${startDataRow}:G${endDataRow})` };
                sheet.getCell(currentRow, 8).value = { formula: `SUM(H${startDataRow}:H${endDataRow})` };
                sheet.getCell(currentRow, 9).value = { formula: `SUM(D${currentRow}:H${currentRow})` };
            }
            
            if (showCreditB) {
                mergeAndStyle(currentRow, 10, 12, "Total", fontBold, alignCenter);
                sheet.getCell(currentRow, 13).value = { formula: `SUM(M${startDataRow}:M${endDataRow})` };
                sheet.getCell(currentRow, 14).value = { formula: `SUM(N${startDataRow}:N${endDataRow})` };
                sheet.getCell(currentRow, 15).value = { formula: `SUM(O${startDataRow}:O${endDataRow})` };
                sheet.getCell(currentRow, 16).value = { formula: `SUM(P${startDataRow}:P${endDataRow})` };
                sheet.getCell(currentRow, 17).value = { formula: `SUM(Q${startDataRow}:Q${endDataRow})` };
                sheet.getCell(currentRow, 18).value = { formula: `SUM(M${currentRow}:Q${currentRow})` };
            }
            const totalRow = currentRow;
            currentRow++;
            
            // Cumulative Row
            for (let c = 1; c <= 18; c++) {
                const cell = sheet.getCell(currentRow, c);
                cell.border = c > 9 ? borderThin : null;
                cell.font = fontBold;
                cell.alignment = alignCenter;
            }
            
            const showCum = isCSE || (semA <= 2 && semB <= 2);
            if (showCum) {
                mergeAndStyle(currentRow, 10, 12, cumLabel, fontBold, alignLeft);
                sheet.getCell(currentRow, 10).border = borderThin;
                sheet.getCell(currentRow, 11).border = borderThin;
                sheet.getCell(currentRow, 12).border = borderThin;
                
                const getCumFormula = (colLeft, colRight) => {
                    const parts = [];
                    parts.push(`${colRight}${totalRow}`); // Sem B total
                    parts.push(`${colLeft}${totalRow}`);  // Sem A total
                    if (prevCumRow) parts.push(`${colRight}${prevCumRow}`); // Prev Cum total
                    return `SUM(${parts.join(",")})`;
                };
                
                sheet.getCell(currentRow, 13).value = { formula: getCumFormula("D", "M") };
                sheet.getCell(currentRow, 14).value = { formula: getCumFormula("E", "N") };
                sheet.getCell(currentRow, 15).value = { formula: getCumFormula("F", "O") };
                sheet.getCell(currentRow, 16).value = { formula: getCumFormula("G", "P") };
                sheet.getCell(currentRow, 17).value = { formula: getCumFormula("H", "Q") };
                sheet.getCell(currentRow, 18).value = { formula: `SUM(M${currentRow}:Q${currentRow})` };
                
                prevCumRow = currentRow;
            }
            currentRow += 2;
        };

        buildYearBlock(1, 2, "1st Year Total Credits");
        buildYearBlock(3, 4, "1st & 2nd Year Total Credits");
        buildYearBlock(5, 6, "1st, 2nd & 3rd year Total Credits");
        buildYearBlock(7, 8, "1st, 2nd, 3rd & 4th year Total Credits");
        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `${studentData.studentName}_Credit_Grade_Sheet.xlsx`);
    } catch (e) {
        console.error("Error generating Excel:", e);
        alert("Failed to generate Excel. Check console for details.");
    }
};
