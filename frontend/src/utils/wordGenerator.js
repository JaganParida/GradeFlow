import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, PageOrientation, ShadingType, ImageRun, BorderStyle } from "docx";
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
        
        let logoImage = null;
        try {
            const res = await fetch("/cutm_text.jpg");
            if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("image")) {
                    logoImage = await res.arrayBuffer();
                } else {
                    console.warn("Logo URL did not return an image. Type:", contentType);
                }
            } else {
                console.warn("Failed to fetch logo. Status:", res.status);
            }
        } catch(e) {
            console.warn("Could not load logo for Word.", e);
        }

        const children = [];

        // Header Table for Logo and Text
        const headerCells = [];
        if (logoImage) {
            headerCells.push(new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                children: [
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: logoImage,
                                transformation: { width: 120, height: 100 },
                                type: "jpg"
                            })
                        ]
                    })
                ]
            }));
        }

        headerCells.push(new TableCell({
            width: { size: logoImage ? 85 : 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT", bold: true, size: 20, font: "Arial" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SCHOOL OF ENGINEERING & TECHNOLOGY", bold: true, size: 18, font: "Arial" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BHUBANESWAR CAMPUS", bold: true, size: 18, font: "Arial" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SUBJECT REGISTRATION AS PER CBCS CURRICULUM", bold: true, size: 18, font: "Arial" })] })
            ]
        }));

        children.push(new Table({
            rows: [new TableRow({ children: headerCells })],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } }
        }));
        
        children.push(new Paragraph({ text: "", spacing: { after: 100 } }));

        // Student Details Row
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            shading: { type: ShadingType.CLEAR, color: "auto", fill: "D9E1F2" },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                            children: [new Paragraph({ children: [new TextRun({ text: `NAME OF STUDENT: ${studentData.studentName ? studentData.studentName.toUpperCase() : ""}`, bold: true, size: 16, font: "Arial" })] })],
                        }),
                        new TableCell({
                            shading: { type: ShadingType.CLEAR, color: "auto", fill: "D9E1F2" },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `REGISTRATION NO- ${studentData.regNo || ""}`, bold: true, size: 16, font: "Arial" })] })],
                        }),
                        new TableCell({
                            shading: { type: ShadingType.CLEAR, color: "auto", fill: "D9E1F2" },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `BRANCH: ${studentData.branch || "CSE"}`, bold: true, size: 16, font: "Arial" })] })],
                        })
                    ]
                })
            ]
        }));
        
        children.push(new Paragraph({ text: "", spacing: { after: 150 } }));

        let cumTotalsObj = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };
        const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

        const createCell = (text, isHeader = false, colSpan = 1, isBlue = false, align = AlignmentType.CENTER) => {
            const cellOpts = {
                children: [new Paragraph({ alignment: align, children: [new TextRun({ text: text !== undefined && text !== null ? text.toString() : "", bold: isHeader, size: 14, font: "Arial" })] })],
                verticalAlign: "center",
                borders: { 
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" } 
                }
            };
            if (colSpan > 1) {
                cellOpts.columnSpan = colSpan;
            }
            if (isBlue) {
                cellOpts.shading = { type: ShadingType.CLEAR, color: "auto", fill: "D9E1F2" };
            }
            return new TableCell(cellOpts);
        };

        const buildTable = (semA, semB, cumLabel) => {
            const tableRows = [];

            // Semester Header
            tableRows.push(
                new TableRow({
                    children: [
                        createCell(`Semester-${roman[semA-1]}`, true, 9, true, AlignmentType.LEFT),
                        createCell(`Semester-${roman[semB-1]}`, true, 9, true, AlignmentType.LEFT)
                    ]
                })
            );

            // Columns Header
            tableRows.push(
                new TableRow({
                    children: [
                        createCell('Sl.\nNo', true, 1, false), createCell('Subject\nCode', true, 1, false), createCell('Subject', true, 1, false),
                        createCell('Basket\n1', true, 1, false), createCell('Basket\n2', true, 1, false), createCell('Basket\n3', true, 1, false), createCell('Basket\n4', true, 1, false), createCell('Basket\n5', true, 1, false), createCell('Total', true, 1, false),
                        createCell('Sl.\nNo', true, 1, false), createCell('Subject\nCode', true, 1, false), createCell('Subject', true, 1, false),
                        createCell('Basket\n1', true, 1, false), createCell('Basket\n2', true, 1, false), createCell('Basket\n3', true, 1, false), createCell('Basket\n4', true, 1, false), createCell('Basket\n5', true, 1, false), createCell('Total', true, 1, false)
                    ]
                })
            );

            const subsA = semSubjects[semA];
            const subsB = semSubjects[semB];
            const maxRows = 10; 
    
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
                    
                    rowCells.push(createCell(i + 1), createCell(s.subCode, false, 1, false, AlignmentType.LEFT), createCell(s.subName, false, 1, false, AlignmentType.LEFT),
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
                    rowCells.push(createCell(i + 1));
                    for(let c = 0; c < 8; c++) rowCells.push(createCell(""));
                }
                
                // Right
                if (i < subsB.length) {
                    const s = subsB[i];
                    const basket = getSubjectBasket(s);
                    const cr = Number(s.credit) || 0;

                    rowCells.push(createCell(i + 1), createCell(s.subCode, false, 1, false, AlignmentType.LEFT), createCell(s.subName, false, 1, false, AlignmentType.LEFT),
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
                    rowCells.push(createCell(i + 1));
                    for(let c = 0; c < 8; c++) rowCells.push(createCell(""));
                }
                tableRows.push(new TableRow({ children: rowCells }));
            }
    
            const isYearEmpty = subsA.length === 0 && subsB.length === 0;

            const tA = (subsA.length === 0 || !showCreditA) ? ["", "", "", "", "", ""] : [totA.b1, totA.b2, totA.b3, totA.b4, totA.b5, totA.gt];
            const tB = (subsB.length === 0 || !showCreditB) ? ["", "", "", "", "", ""] : [totB.b1, totB.b2, totB.b3, totB.b4, totB.b5, totB.gt];

            tableRows.push(
                new TableRow({
                    children: [
                        createCell(!showCreditA ? "" : "Total", true, 3, false, AlignmentType.LEFT),
                        createCell(tA[0], true), createCell(tA[1], true), createCell(tA[2], true), createCell(tA[3], true), createCell(tA[4], true), createCell(tA[5], true),
                        createCell(!showCreditB ? "" : "Total", true, 3, false, AlignmentType.LEFT),
                        createCell(tB[0], true), createCell(tB[1], true), createCell(tB[2], true), createCell(tB[3], true), createCell(tB[4], true), createCell(tB[5], true)
                    ]
                })
            );
    
            if (showCreditA && subsA.length > 0) {
                cumTotalsObj.b1 += totA.b1;
                cumTotalsObj.b2 += totA.b2;
                cumTotalsObj.b3 += totA.b3;
                cumTotalsObj.b4 += totA.b4;
                cumTotalsObj.b5 += totA.b5;
                cumTotalsObj.gt += totA.gt;
            }
            if (showCreditB && subsB.length > 0) {
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
                            createCell("", false, 9), 
                            createCell(!showCum ? "" : cumLabel, true, 3), 
                            createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")
                        ]
                    })
                );
            } else {
                tableRows.push(
                    new TableRow({
                        children: [
                            createCell("", false, 9),
                            createCell(cumLabel, true, 3), 
                            createCell(cumTotalsObj.b1, true), createCell(cumTotalsObj.b2, true), createCell(cumTotalsObj.b3, true), createCell(cumTotalsObj.b4, true), createCell(cumTotalsObj.b5, true), createCell(cumTotalsObj.gt, true)
                        ]
                    })
                );
            }

            children.push(
                new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE }
                }),
                new Paragraph({ text: "", spacing: { after: 200 } })
            );
        };

        buildTable(1, 2, "1st Year Total Credits");
        buildTable(3, 4, "1st & 2nd Year Total Credits");
        
        children.push(new Paragraph({ text: "", pageBreakBefore: true }));

        buildTable(5, 6, "1st, 2nd & 3rd year Total Credits");
        buildTable(7, 8, "1st, 2nd, 3rd & 4th year Total Credits");

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: {
                            orientation: PageOrientation.LANDSCAPE
                        },
                        margin: {
                            top: 500, right: 500, bottom: 500, left: 500
                        }
                    }
                },
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
