import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { getSubjectBasket } from "./pdfGenerator";

export const generateBasketWord = async (studentData) => {
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
        
        const children = [];

        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: "CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT", bold: true, size: 24 }),
                ],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: "SCHOOL OF ENGINEERING & TECHNOLOGY", size: 20 }),
                ],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: "BHUBANESWAR CAMPUS", size: 20 }),
                ],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: "SUBJECT REGISTRATION AS PER CBCS CURRICULUM", bold: true, size: 20 }),
                ],
                spacing: { after: 200 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: `NAME OF STUDENT: ${studentData.studentName || ""}\t\tREGISTRATION NO- ${studentData.regNo || ""}\t\tBRANCH: ${studentData.branch || "CSE"}`, bold: true, size: 18 }),
                ],
                spacing: { after: 200 }
            })
        );
        
        let cumTotalsObj = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };
        const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

        const createCell = (text, isHeader = false) => {
            return new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: text !== undefined && text !== null ? text.toString() : "", bold: isHeader, size: 14 })] })],
                width: { size: isHeader ? 15 : 10, type: WidthType.PERCENTAGE }
            });
        };

        const buildTable = (semA, semB, cumLabel) => {
            const tableRows = [];

            tableRows.push(
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: `Semester-${roman[semA-1]}`, bold: true })] })],
                            columnSpan: 9
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: `Semester-${roman[semB-1]}`, bold: true })] })],
                            columnSpan: 9
                        })
                    ]
                })
            );

            tableRows.push(
                new TableRow({
                    children: [
                        createCell('Sl. No', true), createCell('Subject Code', true), createCell('Subject', true),
                        createCell('B1', true), createCell('B2', true), createCell('B3', true), createCell('B4', true), createCell('B5', true), createCell('Total', true),
                        createCell('Sl. No', true), createCell('Subject Code', true), createCell('Subject', true),
                        createCell('B1', true), createCell('B2', true), createCell('B3', true), createCell('B4', true), createCell('B5', true), createCell('Total', true)
                    ]
                })
            );

            const subsA = semSubjects[semA];
            const subsB = semSubjects[semB];
            const maxRows = Math.max(subsA.length, subsB.length, 10);
    
            let totA = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };
            let totB = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };
    
            const showCreditA = isCSE || semA <= 2;
            const showCreditB = isCSE || semB <= 2;

            for (let i = 0; i < maxRows; i++) {
                const rowCells = [];
                // Left
                if (i < subsA.length) {
                    const s = subsA[i];
                    const basket = getSubjectBasket(s);
                    const cr = Number(s.credit) || 0;
                    
                    rowCells.push(createCell(i + 1), createCell(s.subCode), createCell(s.subName),
                        createCell(showCreditA && basket === "B1" ? cr : ""), 
                        createCell(showCreditA && basket === "B2" ? cr : ""), 
                        createCell(showCreditA && basket === "B3" ? cr : ""), 
                        createCell(showCreditA && basket === "B4" ? cr : ""), 
                        createCell(showCreditA && (basket === "B5" || basket === "EX") ? cr : ""), 
                        createCell(showCreditA ? cr : ""));
                    
                    if (showCreditA && basket === "B1") totA.b1 += cr;
                    else if (showCreditA && basket === "B2") totA.b2 += cr;
                    else if (showCreditA && basket === "B3") totA.b3 += cr;
                    else if (showCreditA && basket === "B4") totA.b4 += cr;
                    else if (showCreditA && (basket === "B5" || basket === "EX")) totA.b5 += cr;
                    if (showCreditA) totA.gt += cr;
                } else {
                    for(let c = 0; c < 9; c++) rowCells.push(createCell(""));
                }
                
                // Right
                if (i < subsB.length) {
                    const s = subsB[i];
                    const basket = getSubjectBasket(s);
                    const cr = Number(s.credit) || 0;

                    rowCells.push(createCell(i + 1), createCell(s.subCode), createCell(s.subName),
                        createCell(showCreditB && basket === "B1" ? cr : ""), 
                        createCell(showCreditB && basket === "B2" ? cr : ""), 
                        createCell(showCreditB && basket === "B3" ? cr : ""), 
                        createCell(showCreditB && basket === "B4" ? cr : ""), 
                        createCell(showCreditB && (basket === "B5" || basket === "EX") ? cr : ""), 
                        createCell(showCreditB ? cr : ""));
                    
                    if (showCreditB && basket === "B1") totB.b1 += cr;
                    else if (showCreditB && basket === "B2") totB.b2 += cr;
                    else if (showCreditB && basket === "B3") totB.b3 += cr;
                    else if (showCreditB && basket === "B4") totB.b4 += cr;
                    else if (showCreditB && (basket === "B5" || basket === "EX")) totB.b5 += cr;
                    if (showCreditB) totB.gt += cr;
                } else {
                    for(let c = 0; c < 9; c++) rowCells.push(createCell(""));
                }
                tableRows.push(new TableRow({ children: rowCells }));
            }
    
            const isYearEmpty = subsA.length === 0 && subsB.length === 0;

            const tA = (subsA.length === 0 || !showCreditA) ? ["", "", "", "", "", ""] : [totA.b1, totA.b2, totA.b3, totA.b4, totA.b5, totA.gt];
            const tB = (subsB.length === 0 || !showCreditB) ? ["", "", "", "", "", ""] : [totB.b1, totB.b2, totB.b3, totB.b4, totB.b5, totB.gt];

            tableRows.push(
                new TableRow({
                    children: [
                        createCell(""), createCell(""), createCell(!showCreditA ? "" : "Total", true),
                        createCell(tA[0]), createCell(tA[1]), createCell(tA[2]), createCell(tA[3]), createCell(tA[4]), createCell(tA[5]),
                        createCell(""), createCell(""), createCell(!showCreditB ? "" : "Total", true),
                        createCell(tB[0]), createCell(tB[1]), createCell(tB[2]), createCell(tB[3]), createCell(tB[4]), createCell(tB[5])
                    ]
                })
            );
    
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
                tableRows.push(
                    new TableRow({
                        children: [
                            createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""),
                            createCell(!showCum ? "" : cumLabel, true), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")
                        ]
                    })
                );
            } else {
                tableRows.push(
                    new TableRow({
                        children: [
                            createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""),
                            createCell(cumLabel, true), createCell(""), createCell(""), 
                            createCell(cumTotalsObj.b1), createCell(cumTotalsObj.b2), createCell(cumTotalsObj.b3), createCell(cumTotalsObj.b4), createCell(cumTotalsObj.b5), createCell(cumTotalsObj.gt)
                        ]
                    })
                );
            }
            
            children.push(
                new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE }
                }),
                new Paragraph({ text: "", spacing: { after: 400 } })
            );
        };

        buildTable(1, 2, "1st Year Total Credits");
        buildTable(3, 4, "1st & 2nd Year Total Credits");
        
        children.push(new Paragraph({ text: "", pageBreakBefore: true }));

        buildTable(5, 6, "1st, 2nd & 3rd year Total Credits");
        buildTable(7, 8, "1st, 2nd, 3rd & 4th year Total Credits");

        const doc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${studentData.studentName}_Credit_Grade_Sheet.docx`);
    } catch (e) {
        console.error("Error generating Word doc:", e);
        alert("Failed to generate Word document. Check console for details.");
    }
};
