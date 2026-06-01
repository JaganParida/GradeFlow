const fs = require('fs');
let content = fs.readFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Dashboard.jsx', 'utf-8');

const old_headers = <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>MID SEMESTER</th>
                        <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>PRESENTATION</th>
                        <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>ASSIGNMENT</th>
                        <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>LEARNING RECORD</th>
                        <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>INTERNAL PRACTICAL</th>
                        <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>PROJECT INTERNAL</th>;

const new_headers = {internalMarks.semester === 1 ? (
                          <>
                            <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>CLASS TEST I</th>
                            <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>CLASS TEST II</th>
                            <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>CLASS TEST III</th>
                            <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>CLASS TEST IV</th>
                            <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>ASSIGNMENT</th>
                          </>
                        ) : (
                          <>
                            <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>MID SEMESTER</th>
                            <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>PRESENTATION</th>
                            <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>ASSIGNMENT</th>
                            <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>LEARNING RECORD</th>
                            <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>INTERNAL PRACTICAL</th>
                            <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: 10, color: "var(--secondary)" }}>PROJECT INTERNAL</th>
                          </>
                        )};

content = content.replace(old_headers, new_headers);

const old_loop = '{[...Array(6)].map((_, i) => (';
const new_loop = '{[...Array(internalMarks.semester === 1 ? 5 : 6)].map((_, i) => (';
content = content.replace(old_loop, new_loop);

const old_mapping = [s.midSemObtained, s.midSemMax, s.midSemRoundOff],
                            [s.presentationObtained, s.presentationMax, s.presentationRoundOff],
                            [s.assignmentObtained, s.assignmentMax, s.assignmentRoundOff],
                            [s.learningRecordObtained, s.learningRecordMax, s.learningRecordRoundOff],
                            [s.internalPracticalObtained, s.internalPracticalMax, s.internalPracticalRoundOff],
                            [s.projectInternalObtained, s.projectInternalMax, s.projectInternalRoundOff],;

const new_mapping = ...(internalMarks.semester === 1 ? [
                              [s.classTest1Obtained, s.classTest1Max, s.classTest1RoundOff],
                              [s.classTest2Obtained, s.classTest2Max, s.classTest2RoundOff],
                              [s.classTest3Obtained, s.classTest3Max, s.classTest3RoundOff],
                              [s.classTest4Obtained, s.classTest4Max, s.classTest4RoundOff],
                              [s.assignmentObtained, s.assignmentMax, s.assignmentRoundOff],
                            ] : [
                              [s.midSemObtained, s.midSemMax, s.midSemRoundOff],
                              [s.presentationObtained, s.presentationMax, s.presentationRoundOff],
                              [s.assignmentObtained, s.assignmentMax, s.assignmentRoundOff],
                              [s.learningRecordObtained, s.learningRecordMax, s.learningRecordRoundOff],
                              [s.internalPracticalObtained, s.internalPracticalMax, s.internalPracticalRoundOff],
                              [s.projectInternalObtained, s.projectInternalMax, s.projectInternalRoundOff],
                            ]),;
                            
content = content.replace(old_mapping, new_mapping);

const old_mobile_mapping = const mobileAssessments = [
                        { label: "Mid Sem", obt: s.midSemObtained, max: s.midSemMax, rnd: s.midSemRoundOff },
                        { label: "Presentation", obt: s.presentationObtained, max: s.presentationMax, rnd: s.presentationRoundOff },
                        { label: "Assignment", obt: s.assignmentObtained, max: s.assignmentMax, rnd: s.assignmentRoundOff },
                        { label: "Learning Record", obt: s.learningRecordObtained, max: s.learningRecordMax, rnd: s.learningRecordRoundOff },
                        { label: "Internal Prac", obt: s.internalPracticalObtained, max: s.internalPracticalMax, rnd: s.internalPracticalRoundOff },
                        { label: "Project Internal", obt: s.projectInternalObtained, max: s.projectInternalMax, rnd: s.projectInternalRoundOff },
                      ];;

const new_mobile_mapping = const mobileAssessments = internalMarks.semester === 1 ? [
                        { label: "Class Test I", obt: s.classTest1Obtained, max: s.classTest1Max, rnd: s.classTest1RoundOff },
                        { label: "Class Test II", obt: s.classTest2Obtained, max: s.classTest2Max, rnd: s.classTest2RoundOff },
                        { label: "Class Test III", obt: s.classTest3Obtained, max: s.classTest3Max, rnd: s.classTest3RoundOff },
                        { label: "Class Test IV", obt: s.classTest4Obtained, max: s.classTest4Max, rnd: s.classTest4RoundOff },
                        { label: "Assignment", obt: s.assignmentObtained, max: s.assignmentMax, rnd: s.assignmentRoundOff },
                      ] : [
                        { label: "Mid Sem", obt: s.midSemObtained, max: s.midSemMax, rnd: s.midSemRoundOff },
                        { label: "Presentation", obt: s.presentationObtained, max: s.presentationMax, rnd: s.presentationRoundOff },
                        { label: "Assignment", obt: s.assignmentObtained, max: s.assignmentMax, rnd: s.assignmentRoundOff },
                        { label: "Learning Record", obt: s.learningRecordObtained, max: s.learningRecordMax, rnd: s.learningRecordRoundOff },
                        { label: "Internal Prac", obt: s.internalPracticalObtained, max: s.internalPracticalMax, rnd: s.internalPracticalRoundOff },
                        { label: "Project Internal", obt: s.projectInternalObtained, max: s.projectInternalMax, rnd: s.projectInternalRoundOff },
                      ];;

content = content.replace(old_mobile_mapping, new_mobile_mapping);

fs.writeFileSync('d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Dashboard.jsx', content, 'utf-8');
console.log("Replacement Complete");
