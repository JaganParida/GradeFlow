import * as XLSX from "xlsx";
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
        
        const rows = [];
        
        // Add Header
        rows.push([
            "CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT"
        ]);
        rows.push([
            "SCHOOL OF ENGINEERING & TECHNOLOGY, BHUBANESWAR CAMPUS"
        ]);
        rows.push([
            "SUBJECT REGISTRATION AS PER CBCS CURRICULUM"
        ]);
        rows.push([]);
        rows.push([
            `NAME OF STUDENT: ${studentData.studentName || ""}`,
            `REGISTRATION NO- ${studentData.regNo || ""}`,
            `BRANCH: ${studentData.branch || "CSE"}`
        ]);
        rows.push([]);
        
        let cumTotalsObj = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };
        const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

        const buildTable = (semA, semB, cumLabel) => {
            rows.push([`Semester-${roman[semA-1]}`, "", "", "", "", "", "", "", "", `Semester-${roman[semB-1]}`]);
            rows.push([
                'Sl. No', 'Subject Code', 'Subject', 'Basket 1 (Credit)', 'Basket 2 (Credit)', 'Basket 3 (Credit)', 'Basket 4 (Credit)', 'Basket 5 (Credit)', 'Grand Total (Credit)',
                'Sl. No', 'Subject Code', 'Subject', 'Basket 1 (Credit)', 'Basket 2 (Credit)', 'Basket 3 (Credit)', 'Basket 4 (Credit)', 'Basket 5 (Credit)', 'Grand Total (Credit)'
            ]);

            const subsA = semSubjects[semA];
            const subsB = semSubjects[semB];
            const maxRows = Math.max(subsA.length, subsB.length, 10);
    
            let totA = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };
            let totB = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };
    
            const showCreditA = isCSE || semA <= 2;
            const showCreditB = isCSE || semB <= 2;

            for (let i = 0; i < maxRows; i++) {
                const row = [];
                // Left
                if (i < subsA.length) {
                    const s = subsA[i];
                    const basket = getSubjectBasket(s);
                    const cr = Number(s.credit) || 0;
                    row.push(i + 1, s.subCode || "", s.subName || "", 
                        showCreditA && basket === "B1" ? cr : "", 
                        showCreditA && basket === "B2" ? cr : "", 
                        showCreditA && basket === "B3" ? cr : "", 
                        showCreditA && basket === "B4" ? cr : "", 
                        showCreditA && (basket === "B5" || basket === "EX") ? cr : "", 
                        showCreditA ? cr : "");
                    
                    if (showCreditA && basket === "B1") totA.b1 += cr;
                    else if (showCreditA && basket === "B2") totA.b2 += cr;
                    else if (showCreditA && basket === "B3") totA.b3 += cr;
                    else if (showCreditA && basket === "B4") totA.b4 += cr;
                    else if (showCreditA && (basket === "B5" || basket === "EX")) totA.b5 += cr;
                    if (showCreditA) totA.gt += cr;
                } else {
                    row.push(i + 1, "", "", "", "", "", "", "", "");
                }
                
                // Right
                if (i < subsB.length) {
                    const s = subsB[i];
                    const basket = getSubjectBasket(s);
                    const cr = Number(s.credit) || 0;
                    row.push(i + 1, s.subCode || "", s.subName || "", 
                        showCreditB && basket === "B1" ? cr : "", 
                        showCreditB && basket === "B2" ? cr : "", 
                        showCreditB && basket === "B3" ? cr : "", 
                        showCreditB && basket === "B4" ? cr : "", 
                        showCreditB && (basket === "B5" || basket === "EX") ? cr : "", 
                        showCreditB ? cr : "");
                    
                    if (showCreditB && basket === "B1") totB.b1 += cr;
                    else if (showCreditB && basket === "B2") totB.b2 += cr;
                    else if (showCreditB && basket === "B3") totB.b3 += cr;
                    else if (showCreditB && basket === "B4") totB.b4 += cr;
                    else if (showCreditB && (basket === "B5" || basket === "EX")) totB.b5 += cr;
                    if (showCreditB) totB.gt += cr;
                } else {
                    row.push(i + 1, "", "", "", "", "", "", "", "");
                }
                rows.push(row);
            }
    
            const isYearEmpty = subsA.length === 0 && subsB.length === 0;

            const tA = (subsA.length === 0 || !showCreditA) ? ["", "", "", "", "", ""] : [totA.b1, totA.b2, totA.b3, totA.b4, totA.b5, totA.gt];
            const tB = (subsB.length === 0 || !showCreditB) ? ["", "", "", "", "", ""] : [totB.b1, totB.b2, totB.b3, totB.b4, totB.b5, totB.gt];

            rows.push([
                "", "", (!showCreditA ? "" : "Total"), ...tA,
                "", "", (!showCreditB ? "" : "Total"), ...tB
            ]);
    
            if (showCreditA) {
                cumTotalsObj.b1 += totA.b1;
                cumTotalsObj.b2 += totA.b2;
                cumTotalsObj.b3 += totA.b3;
                cumTotalsObj.b4 += totA.b4;
                cumTotalsObj.b5 += totA.b5;
                cumTotalsObj.gt += totA.gt;
            }
            if (showCreditB) {
                cumTotalsObj.b1 += totB.b1;
                cumTotalsObj.b2 += totB.b2;
                cumTotalsObj.b3 += totB.b3;
                cumTotalsObj.b4 += totB.b4;
                cumTotalsObj.b5 += totB.b5;
                cumTotalsObj.gt += totB.gt;
            }

            const showCum = isCSE || (semA <= 2 && semB <= 2);
            if (isYearEmpty || !showCum) {
                rows.push([
                    "", "", "", "", "", "", "", "", "", // Left side blank
                    (!showCum ? "" : cumLabel), "", "", "", "", "", "", "", ""
                ]);
            } else {
                rows.push([
                    "", "", "", "", "", "", "", "", "", // Left side blank
                    cumLabel, "", "", cumTotalsObj.b1, cumTotalsObj.b2, cumTotalsObj.b3, cumTotalsObj.b4, cumTotalsObj.b5, cumTotalsObj.gt
                ]);
            }
            
            rows.push([]);
        };

        buildTable(1, 2, "1st Year Total Credits");
        buildTable(3, 4, "1st & 2nd Year Total Credits");
        buildTable(5, 6, "1st, 2nd & 3rd year Total Credits");
        buildTable(7, 8, "1st, 2nd, 3rd & 4th year Total Credits");
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Credit Track Sheet");
        
        XLSX.writeFile(wb, `${studentData.studentName}_Credit_Grade_Sheet.xlsx`);
    } catch (e) {
        console.error("Error generating Excel:", e);
        alert("Failed to generate Excel. Check console for details.");
    }
};
