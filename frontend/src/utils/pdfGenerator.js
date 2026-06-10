import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  BASKET_1_SYLLABUS,
  BASKET_2_SYLLABUS,
  BASKET_3_SYLLABUS,
  BASKET_4_SYLLABUS,
  BASKET_5_DOMAINS_DATA,
  COMMON_BASKET_5_SYLLABUS,
  ADDITIONAL_BASKET_5_SUBJECTS,
  BASKET_5_SKILL_COURSES,
  isMatch
} from "./basketLogic";

export const getSubjectBasket = (s) => {
    if (BASKET_1_SYLLABUS.some(bs => isMatch(s, bs))) return "B1";
    if (BASKET_2_SYLLABUS.some(bs => isMatch(s, bs))) return "B2";
    if (BASKET_3_SYLLABUS.some(bs => isMatch(s, bs))) return "B3";
    if (BASKET_4_SYLLABUS.some(bs => isMatch(s, bs))) return "B4";
    if (COMMON_BASKET_5_SYLLABUS.some(bs => isMatch(s, bs))) return "B5";
    if (ADDITIONAL_BASKET_5_SUBJECTS?.some(bs => isMatch(s, bs))) return "B5";
    if (BASKET_5_SKILL_COURSES.some(bs => isMatch(s, bs))) return "B5";
    for (const domain of BASKET_5_DOMAINS_DATA) {
      if (domain.subjects.some(bs => isMatch(s, bs))) return "B5";
    }
    const name = (s.subName || "").toLowerCase();
    if (name.includes("internship") || name.includes("project") || name.includes("skill")) return "B5";
    return "EX";
};

const getBase64ImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var dataURL = canvas.toDataURL("image/jpeg");
        resolve(dataURL);
      };
      img.onerror = error => reject(error);
      img.src = url;
    });
};

export const generateBasketPDF = async (studentData) => {
    try {
        const doc = new jsPDF("landscape", "mm", "a4");
        
        let logoBase64 = null;
        try {
            logoBase64 = await getBase64ImageFromURL("https://cnv-resources.s3.ap-south-1.amazonaws.com/images/cutm_text.jpg");
        } catch (e) {
            console.warn("Could not load logo image");
        }
        
        // Group subjects by semester
        const semSubjects = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
        
        if (studentData && studentData.results) {
            studentData.results.forEach(semData => {
                semData.subjects.forEach(sub => {
                    let targetSem = Number(semData.semester);
                    // Rule: sem 5 project which have 6 credit it is only add in sem 6
                    if (targetSem === 5 && Number(sub.credit) === 6 && (sub.subName || "").toLowerCase().includes("project")) {
                        targetSem = 6;
                    }
                    if (targetSem >= 1 && targetSem <= 8) {
                       semSubjects[targetSem].push(sub);
                    }
                });
            });
        }
    
        const drawPageHeader = (pageDoc) => {
            if (logoBase64) {
                pageDoc.addImage(logoBase64, "JPEG", 14, 8, 25, 25);
            }
            
            pageDoc.setFontSize(11);
            pageDoc.setFont("helvetica", "bold");
            pageDoc.text("CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT", 148, 14, { align: "center" });
            
            pageDoc.setFontSize(10);
            pageDoc.text("SCHOOL OF ENGINEERING & TECHNOLOGY", 148, 19, { align: "center" });
            pageDoc.text("BHUBANESWAR CAMPUS", 148, 24, { align: "center" });
            
            pageDoc.text("SUBJECT REGISTRATION AS PER CBCS CURRICULUM", 80, 32);
            
            pageDoc.setFontSize(9);
            pageDoc.text(`SESSION   2020 - 2024`, 220, 32); // Hardcoded session for now as per image
            
            pageDoc.text(`NAME OF STUDENT: ${studentData.studentName || ""}`, 14, 40);
            pageDoc.text(`REGISTRATION NO- ${studentData.regNo || ""}`, 148, 40, { align: "center" });
            pageDoc.text(`BRANCH: ${studentData.branch || "CSE"}`, 280, 40, { align: "right" });
            
            // Light blue background behind student details
            pageDoc.setFillColor(210, 230, 250);
            pageDoc.rect(14, 42, 268, 6, "F");
        };
    
        let cumTotalsObj = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };
        
        const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
        
        const buildTable = (semA, semB, startY, cumLabel) => {
            const head = [
                [
                    { content: `Semester-${roman[semA-1]}`, colSpan: 9, styles: { fillColor: [210, 230, 250], textColor: 0, halign: 'left', fontStyle: 'bold' } },
                    { content: `Semester-${roman[semB-1]}`, colSpan: 9, styles: { fillColor: [210, 230, 250], textColor: 0, halign: 'left', fontStyle: 'bold' } }
                ],
                [
                    'Sl.\nNo', 'Subject Code', 'Subject', 'Basket\n1\n(Credit)', 'Basket 2\n(Credit)', 'Basket\n3\n(Credit)', 'Basket\n4\n(Credit)', 'Basket\n5\n(Credit)', 'Grand\nTotal\n(Credit)',
                    'Sl.\nNo', 'Subject Code', 'Subject', 'Basket\n1\n(Credit)', 'Basket 2\n(Credit)', 'Basket\n3\n(Credit)', 'Basket\n4\n(Credit)', 'Basket\n5\n(Credit)', 'Grand\nTotal\n(Credit)'
                ]
            ];
    
            const rows = [];
            const subsA = semSubjects[semA];
            const subsB = semSubjects[semB];
            const maxRows = Math.max(subsA.length, subsB.length, 10);
    
            let totA = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };
            let totB = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, gt: 0 };
    
            for (let i = 0; i < maxRows; i++) {
                const row = [];
                // Left
                if (i < subsA.length) {
                    const s = subsA[i];
                    const basket = getSubjectBasket(s);
                    const cr = Number(s.credit) || 0;
                    row.push(i + 1, s.subCode || "", s.subName || "", 
                        basket === "B1" ? cr : "", basket === "B2" ? cr : "", 
                        basket === "B3" ? cr : "", basket === "B4" ? cr : "", 
                        (basket === "B5" || basket === "EX") ? cr : "", cr);
                    
                    if (basket === "B1") totA.b1 += cr;
                    else if (basket === "B2") totA.b2 += cr;
                    else if (basket === "B3") totA.b3 += cr;
                    else if (basket === "B4") totA.b4 += cr;
                    else if (basket === "B5" || basket === "EX") totA.b5 += cr;
                    totA.gt += cr;
                } else {
                    row.push(i + 1, "", "", "", "", "", "", "", "");
                }
                
                // Right
                if (i < subsB.length) {
                    const s = subsB[i];
                    const basket = getSubjectBasket(s);
                    const cr = Number(s.credit) || 0;
                    row.push(i + 1, s.subCode || "", s.subName || "", 
                        basket === "B1" ? cr : "", basket === "B2" ? cr : "", 
                        basket === "B3" ? cr : "", basket === "B4" ? cr : "", 
                        (basket === "B5" || basket === "EX") ? cr : "", cr);
                    
                    if (basket === "B1") totB.b1 += cr;
                    else if (basket === "B2") totB.b2 += cr;
                    else if (basket === "B3") totB.b3 += cr;
                    else if (basket === "B4") totB.b4 += cr;
                    else if (basket === "B5" || basket === "EX") totB.b5 += cr;
                    totB.gt += cr;
                } else {
                    row.push(i + 1, "", "", "", "", "", "", "", "");
                }
                rows.push(row);
            }
    
            rows.push([
                "", "", { content: "Total", styles: { fontStyle: 'bold' } }, totA.b1, totA.b2, totA.b3, totA.b4, totA.b5, totA.gt,
                "", "", { content: "Total", styles: { fontStyle: 'bold' } }, totB.b1, totB.b2, totB.b3, totB.b4, totB.b5, totB.gt
            ]);
    
            cumTotalsObj.b1 += totA.b1 + totB.b1;
            cumTotalsObj.b2 += totA.b2 + totB.b2;
            cumTotalsObj.b3 += totA.b3 + totB.b3;
            cumTotalsObj.b4 += totA.b4 + totB.b4;
            cumTotalsObj.b5 += totA.b5 + totB.b5;
            cumTotalsObj.gt += totA.gt + totB.gt;
    
            rows.push([
                "", "", "", "", "", "", "", "", "", // Left side blank
                { content: cumLabel, colSpan: 3, styles: { fontStyle: 'bold' } },
                cumTotalsObj.b1, cumTotalsObj.b2, cumTotalsObj.b3, cumTotalsObj.b4, cumTotalsObj.b5, cumTotalsObj.gt
            ]);
    
            doc.autoTable({
                startY: startY,
                head: head,
                body: rows,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: 0 },
                headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [0,0,0] },
                columnStyles: {
                    0: { cellWidth: 7, halign: 'center' },
                    1: { cellWidth: 18 },
                    2: { cellWidth: 38 }, // roughly auto
                    3: { cellWidth: 11, halign: 'center' },
                    4: { cellWidth: 11, halign: 'center' },
                    5: { cellWidth: 11, halign: 'center' },
                    6: { cellWidth: 11, halign: 'center' },
                    7: { cellWidth: 11, halign: 'center' },
                    8: { cellWidth: 11, halign: 'center' },
                    9: { cellWidth: 7, halign: 'center' },
                    10: { cellWidth: 18 },
                    11: { cellWidth: 38 },
                    12: { cellWidth: 11, halign: 'center' },
                    13: { cellWidth: 11, halign: 'center' },
                    14: { cellWidth: 11, halign: 'center' },
                    15: { cellWidth: 11, halign: 'center' },
                    16: { cellWidth: 11, halign: 'center' },
                    17: { cellWidth: 11, halign: 'center' }
                },
                margin: { left: 14, right: 14 }
            });
        };
    
        // PAGE 1
        drawPageHeader(doc);
        buildTable(1, 2, 48, "1st Year Total Credits");
        buildTable(3, 4, doc.lastAutoTable.finalY + 5, "1st & 2nd Year Total Credits");
        
        // PAGE 2
        doc.addPage();
        drawPageHeader(doc);
        buildTable(5, 6, 48, "1st, 2nd & 3rd year Total Credits");
        buildTable(7, 8, doc.lastAutoTable.finalY + 5, "1st, 2nd, 3rd & 4th year Total Credits");
        
        doc.save(`${studentData.studentName}_Credit_Grade_Sheet.pdf`);
    } catch (e) {
        console.error("Error generating PDF:", e);
        alert("Failed to generate PDF. Check console for details.");
    }
};
