import { saveAs } from "file-saver";
import { getSubjectBasket } from "./pdfGenerator";

export const generateBasketExcel = async (studentData) => {
    try {
        const { default: ExcelJS } = await import("exceljs");
        const semSubjects = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
        const addedSubCodes = new Set();
        
        const isCSE = studentData ? (!studentData.branch || studentData.branch.toUpperCase() === "CSE") : true;

        if (studentData && studentData.results) {
            studentData.results.forEach(semData => {
                semData.subjects.forEach(sub => {
                    let targetSem = Number(semData.semester);
                    const isProject = (sub.type && sub.type.trim().toLowerCase() === "project");
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
        const sheet = workbook.addWorksheet("Credit Track Sheet", {
            pageSetup: { paperSize: 9, orientation: 'landscape', margins: { left: 0.25, right: 0.25, top: 0.25, bottom: 0.25, header: 0.1, footer: 0.1 } }
        });
        
        // Define standard styles
        const fontTitle = { name: "Arial", bold: true, size: 12 };
        const fontSubTitle = { name: "Arial", bold: true, size: 11 };
        const fontBold = { name: "Arial", bold: true, size: 9 };
        const fontNormal = { name: "Arial", size: 9 };
        const alignCenter = { vertical: "middle", horizontal: "center", wrapText: true };
        const alignLeft = { vertical: "middle", horizontal: "left", wrapText: true };
        const alignRight = { vertical: "middle", horizontal: "right", wrapText: true };
        const borderThin = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        // Light blue background matching the teacher's template
        const bgBlue = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
        
        // Column widths
        // Left side: A:4, B:14, C:35, D:7, E:7, F:7, G:7, H:7, I:7
        // Right side: J:4, K:14, L:35, M:7, N:7, O:7, P:7, Q:7, R:7
        const colWidths = [
            4, 14, 35, 7, 7, 7, 7, 7, 7,
            4, 14, 35, 7, 7, 7, 7, 7, 7
        ];
        colWidths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
        
        const mergeAndStyle = (rowIdx, colStart, colEnd, value, font, alignment, fill, border) => {
            if (colStart !== colEnd) {
                sheet.mergeCells(rowIdx, colStart, rowIdx, colEnd);
            }
            const cell = sheet.getCell(rowIdx, colStart);
            if (value !== undefined) cell.value = value;
            if (font) cell.font = font;
            if (alignment) cell.alignment = alignment;
            if (fill) cell.fill = fill;
            if (border) {
                for (let c = colStart; c <= colEnd; c++) {
                    sheet.getCell(rowIdx, c).border = border;
                }
            }
        };

        // Logo Logic
        let logoId = null;
        try {
            const response = await fetch("/cutm_text.jpg");
            const arrayBuffer = await response.arrayBuffer();
            logoId = workbook.addImage({
                buffer: arrayBuffer,
                extension: 'jpeg',
            });
        } catch (e) {
            console.warn("Could not load logo image for Excel", e);
        }

        if (logoId !== null) {
            // Placing logo covering top left area (A1:B4) without overlapping the text
            sheet.addImage(logoId, {
                tl: { col: 0, row: 0 },
                ext: { width: 90, height: 75 } // slightly wider to fit correctly
            });
        }

        // Header Section (Start text from column C to avoid logo overlap)
        mergeAndStyle(1, 3, 18, "CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT", fontTitle, alignCenter);
        mergeAndStyle(2, 3, 18, "SCHOOL OF ENGINEERING & TECHNOLOGY", fontSubTitle, alignCenter);
        mergeAndStyle(3, 3, 18, "BHUBANESWAR CAMPUS", fontSubTitle, alignCenter);
        
        mergeAndStyle(4, 3, 12, "SUBJECT REGISTRATION AS PER CBCS CURRICULUM", fontSubTitle, alignCenter);
        mergeAndStyle(4, 13, 18, "SESSION  2023 - 2027", fontSubTitle, alignCenter); // You can make session dynamic if needed
        
        sheet.getRow(6).height = 18;
        mergeAndStyle(6, 1, 6, `NAME OF STUDENT: ${studentData.studentName ? studentData.studentName.toUpperCase() : ""}`, fontBold, alignLeft);
        mergeAndStyle(6, 7, 12, `REGISTRATION NO- ${studentData.regNo || ""}`, fontBold, alignCenter);
        mergeAndStyle(6, 13, 18, `BRANCH: ${studentData.branch || "CSE"}`, fontBold, alignRight);
        
        // Blank blue separator row (Row 7)
        sheet.getRow(7).height = 10;
        for (let i = 1; i <= 18; i++) {
            sheet.getCell(7, i).fill = bgBlue;
        }
        
        let currentRow = 8;
        const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
        
        let cumTotalsObj = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };
        let prevCumRow = null;

        const buildYearBlock = (semA, semB, cumLabel) => {
            // Add Sem Header
            sheet.getRow(currentRow).height = 20;
            mergeAndStyle(currentRow, 1, 9, `Semester-${roman[semA-1]}`, fontBold, alignLeft, bgBlue, borderThin);
            mergeAndStyle(currentRow, 10, 18, `Semester-${roman[semB-1]}`, fontBold, alignLeft, bgBlue, borderThin);
            currentRow++;
            
            // Add Columns Header
            const headers = [
                'Sl.\nNo', 'Subject\nCode', 'Subject', 'Basket\n1\n(Credit)', 'Basket\n2\n(Credit)', 'Basket\n3\n(Credit)', 'Basket\n4\n(Credit)', 'Basket\n5\n(Credit)', 'Grand\nTotal\n(Credit)'
            ];
            const colHeaderRow = sheet.getRow(currentRow);
            colHeaderRow.height = 45;
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
            const maxRows = 10; // Fixed at 10 to exactly match PDF layout
            const startDataRow = currentRow;
            
            const showCreditA = isCSE || semA <= 2;
            const showCreditB = isCSE || semB <= 2;

            let totA = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };
            let totB = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };

            for (let i = 0; i < maxRows; i++) {
                // Remove fixed row height so text wrapping automatically expands row
                sheet.getRow(currentRow).height = undefined; 
                
                for (let c = 1; c <= 18; c++) {
                    const cell = sheet.getCell(currentRow, c);
                    cell.border = borderThin;
                    cell.alignment = (c === 3 || c === 12) ? alignLeft : alignCenter;
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
                        let rowTot = 0;
                        if (basket === "B1") { sheet.getCell(currentRow, 4).value = cr; totA.b1 += cr; rowTot += cr; }
                        else if (basket === "B2") { sheet.getCell(currentRow, 5).value = cr; totA.b2 += cr; rowTot += cr; }
                        else if (basket === "B3") { sheet.getCell(currentRow, 6).value = cr; totA.b3 += cr; rowTot += cr; }
                        else if (basket === "B4") { sheet.getCell(currentRow, 7).value = cr; totA.b4 += cr; rowTot += cr; }
                        else if (basket === "B5" || basket === "EX") { sheet.getCell(currentRow, 8).value = cr; totA.b5 += cr; rowTot += cr; }
                        
                        sheet.getCell(currentRow, 9).value = { formula: `SUM(D${currentRow}:H${currentRow})`, result: rowTot };
                        totA.gt += rowTot;
                    }
                } else {
                    sheet.getCell(currentRow, 1).value = i + 1;
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
                        let rowTot = 0;
                        if (basket === "B1") { sheet.getCell(currentRow, 13).value = cr; totB.b1 += cr; rowTot += cr; }
                        else if (basket === "B2") { sheet.getCell(currentRow, 14).value = cr; totB.b2 += cr; rowTot += cr; }
                        else if (basket === "B3") { sheet.getCell(currentRow, 15).value = cr; totB.b3 += cr; rowTot += cr; }
                        else if (basket === "B4") { sheet.getCell(currentRow, 16).value = cr; totB.b4 += cr; rowTot += cr; }
                        else if (basket === "B5" || basket === "EX") { sheet.getCell(currentRow, 17).value = cr; totB.b5 += cr; rowTot += cr; }
                        
                        sheet.getCell(currentRow, 18).value = { formula: `SUM(M${currentRow}:Q${currentRow})`, result: rowTot };
                        totB.gt += rowTot;
                    }
                } else {
                    sheet.getCell(currentRow, 10).value = i + 1;
                }
                
                currentRow++;
            }
            
            const endDataRow = currentRow - 1;
            
            // Total Row
            sheet.getRow(currentRow).height = 15;
            for (let c = 1; c <= 18; c++) {
                const cell = sheet.getCell(currentRow, c);
                cell.border = borderThin;
                cell.font = fontBold;
                cell.alignment = alignCenter;
            }
            
            mergeAndStyle(currentRow, 1, 3, "Total", fontBold, alignLeft, null, borderThin);
            if (showCreditA && subsA.length > 0) {
                sheet.getCell(currentRow, 4).value = { formula: `SUM(D${startDataRow}:D${endDataRow})`, result: totA.b1 };
                sheet.getCell(currentRow, 5).value = { formula: `SUM(E${startDataRow}:E${endDataRow})`, result: totA.b2 };
                sheet.getCell(currentRow, 6).value = { formula: `SUM(F${startDataRow}:F${endDataRow})`, result: totA.b3 };
                sheet.getCell(currentRow, 7).value = { formula: `SUM(G${startDataRow}:G${endDataRow})`, result: totA.b4 };
                sheet.getCell(currentRow, 8).value = { formula: `SUM(H${startDataRow}:H${endDataRow})`, result: totA.b5 };
                sheet.getCell(currentRow, 9).value = { formula: `SUM(D${currentRow}:H${currentRow})`, result: totA.gt };
            }
            
            mergeAndStyle(currentRow, 10, 12, "Total", fontBold, alignLeft, null, borderThin);
            if (showCreditB && subsB.length > 0) {
                sheet.getCell(currentRow, 13).value = { formula: `SUM(M${startDataRow}:M${endDataRow})`, result: totB.b1 };
                sheet.getCell(currentRow, 14).value = { formula: `SUM(N${startDataRow}:N${endDataRow})`, result: totB.b2 };
                sheet.getCell(currentRow, 15).value = { formula: `SUM(O${startDataRow}:O${endDataRow})`, result: totB.b3 };
                sheet.getCell(currentRow, 16).value = { formula: `SUM(P${startDataRow}:P${endDataRow})`, result: totB.b4 };
                sheet.getCell(currentRow, 17).value = { formula: `SUM(Q${startDataRow}:Q${endDataRow})`, result: totB.b5 };
                sheet.getCell(currentRow, 18).value = { formula: `SUM(M${currentRow}:Q${currentRow})`, result: totB.gt };
            }
            const totalRow = currentRow;
            currentRow++;
            
            // Cumulative Row
            sheet.getRow(currentRow).height = 15;
            for (let c = 10; c <= 18; c++) {
                const cell = sheet.getCell(currentRow, c);
                cell.border = borderThin;
                cell.font = fontBold;
                cell.alignment = alignCenter;
            }
            
            const showCum = isCSE || (semA <= 2 && semB <= 2);
            const isYearEmpty = subsA.length === 0 && subsB.length === 0;

            if (showCum) {
                mergeAndStyle(currentRow, 10, 12, cumLabel, fontBold, alignCenter, null, borderThin);
                
                if (!isYearEmpty) {
                    cumTotalsObj.b1 += (totA.b1 + totB.b1);
                    cumTotalsObj.b2 += (totA.b2 + totB.b2);
                    cumTotalsObj.b3 += (totA.b3 + totB.b3);
                    cumTotalsObj.b4 += (totA.b4 + totB.b4);
                    cumTotalsObj.b5 += (totA.b5 + totB.b5);
                    cumTotalsObj.gt += (totA.gt + totB.gt);

                    const getCumFormula = (colLeft, colRight) => {
                        const parts = [];
                        parts.push(`${colRight}${totalRow}`); // Sem B total
                        parts.push(`${colLeft}${totalRow}`);  // Sem A total
                        if (prevCumRow) parts.push(`${colRight}${prevCumRow}`); // Prev Cum total
                        return `SUM(${parts.join(",")})`;
                    };
                    
                    sheet.getCell(currentRow, 13).value = { formula: getCumFormula("D", "M"), result: cumTotalsObj.b1 };
                    sheet.getCell(currentRow, 14).value = { formula: getCumFormula("E", "N"), result: cumTotalsObj.b2 };
                    sheet.getCell(currentRow, 15).value = { formula: getCumFormula("F", "O"), result: cumTotalsObj.b3 };
                    sheet.getCell(currentRow, 16).value = { formula: getCumFormula("G", "P"), result: cumTotalsObj.b4 };
                    sheet.getCell(currentRow, 17).value = { formula: getCumFormula("H", "Q"), result: cumTotalsObj.b5 };
                    sheet.getCell(currentRow, 18).value = { formula: `SUM(M${currentRow}:Q${currentRow})`, result: cumTotalsObj.gt };
                }
                
                prevCumRow = currentRow;
                currentRow++;
            }
            
            // Add a white gap row
            sheet.getRow(currentRow).height = 10;
            currentRow++;

            // Add a blue separator between years (like Row 21 in Image 2)
            sheet.getRow(currentRow).height = 10;
            for (let i = 1; i <= 18; i++) {
                sheet.getCell(currentRow, i).fill = bgBlue;
            }
            currentRow++;
            
            // Add another white gap row to make the spacing perfect
            sheet.getRow(currentRow).height = 10;
            currentRow++;
        };

        buildYearBlock(1, 2, "1st Year Total Credits");
        buildYearBlock(3, 4, "1st & 2nd Year Total Credits");
        buildYearBlock(5, 6, "1st, 2nd & 3rd year Total Credits");
        buildYearBlock(7, 8, "1st, 2nd, 3rd & 4th year Total Credits");
        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `${studentData.studentName || "Student"}_Credit_Grade_Sheet.xlsx`);
    } catch (e) {
        console.error("Error generating Excel:", e);
        alert("Failed to generate Excel. Check console for details.");
    }
};
