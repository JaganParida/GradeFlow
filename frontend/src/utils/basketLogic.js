export const BASKET_TARGETS = {
  B1: 17,
  B2: 12,
  B3: 25,
  B4: 58,
  B5: 48,
  Total: 160
};

export const SYLLABUS = {
  B1: [
    { subName: "Differential Equations & Linear Algebra", target: 3 },
    { subName: "Laplace & Fourier Transforms", target: 3 },
    { subName: "Complex Analysis & Numerical Methods", target: 3 },
    { subName: "Discrete Mathematics", target: 3 },
    { subName: "Probability & Statistics", target: 3 },
    { subName: "Mechanics for Engineers", target: 3 },
    { subName: "Optics and Optical Fibres", target: 3 },
    { subName: "Applied Analytical Chemistry", target: 3 },
    { subName: "Applied Engineering Materials", target: 3 },
    { subName: "Environmental Studies", target: 2 }
  ],
  B2: [
    { subName: "Job Readiness", target: 6 },
    { subName: "Engineering Economics & Costing", target: 3 },
    { subName: "Project Management", target: 3 },
    { subName: "Gender, Human Rights, and Ethics", target: 3 },
    { subName: "Climate Change & Sustainability", target: 3 },
    { subName: "Optimization Techniques", target: 3 }
  ],
  B3: [
    { subName: "Industrial IoT and Automation", target: 4 },
    { subName: "Data Analysis & Visualization using Python", target: 4 },
    { subName: "Machine Learning using Python", target: 4 },
    { subName: "Robotic Automation (ROS & C++)", target: 4 },
    { subName: "Basics of Design Thinking", target: 2 },
    { subName: "System Integration with DYMOLA", target: 2 },
    { subName: "Smart Engineering Project (G2M)", target: 3 }
  ]
};

export const DOMAINS = {
  CUST: { name: "Software Technology", target: 18, subjects: [{ subName: "PRODUCT DEVELOPMENT", subCode: "CUST1054", target: 6 }] },
  CUCS: { name: "Cyber Security", target: 20, subjects: [{ subName: "PROJECT", subCode: "CUCS1105", target: 4 }] },
  CUES: { name: "Embedded System Design", target: 20, subjects: [{ subName: "PROJECT", subCode: "CUES2053", target: 6 }] },
  CUML: { name: "Data Analytics and Machine Learning", target: 22, subjects: [{ subName: "PROJECT", subCode: "CUML1025", target: 6 }] },
  CUGI: { name: "Gaming and Immersive Learning-AR/VR", target: 20, subjects: [{ subName: "BINARY DEPLOYMENT AND CROSS-PLATFORM CONTROLS", subCode: "CUGI1085", target: 3 }, { subName: "PROJECT", subCode: "CUGI1086", target: 6 }] },
  CUBD: { name: "Blockchain Development", target: 18, subjects: [{ subName: "ADVANCED BLOCKCHAIN CONCEPTS AND DEVELOPMENT", subCode: "CUBD1095", target: 3 }, { subName: "CAPSTONE PROJECT IN BLOCKCHAIN DEVELOPMENT", subCode: "CUBD1096", target: 4 }] }
};

// Returns { b1: [], b2: [], b3: [], b4: [], b5: [], domain: null }
export function categorizeBaskets(results) {
  const baskets = {
    B1: { credits: 0, subjects: [], target: BASKET_TARGETS.B1 },
    B2: { credits: 0, subjects: [], target: BASKET_TARGETS.B2 },
    B3: { credits: 0, subjects: [], target: BASKET_TARGETS.B3 },
    B4: { credits: 0, subjects: [], target: BASKET_TARGETS.B4 },
    B5: { credits: 0, subjects: [], target: BASKET_TARGETS.B5 },
    domain: null
  };

  if (!results) return baskets;

  // Flatten all subjects and only keep the latest grade if repeated
  const allSubjectsMap = new Map();
  
  results.forEach(sem => {
    sem.subjects.forEach(sub => {
      // Always overwrite with the latest occurrence of the subject (for backlogs)
      // Except if it's the specific "Ignore Sem 5 Project" rule
      if (Number(sem.semester) === 5 && sub.grade === 'R' && (Number(sub.credit) === 6 || (sub.subName && sub.subName.toLowerCase().includes('project')))) {
         return; // Ignore this specific dropped R grade
      }
      allSubjectsMap.set(sub.subCode, { ...sub, semester: sem.semester });
    });
  });

  const allSubjects = Array.from(allSubjectsMap.values());

  allSubjects.forEach(s => {
    const name = (s.subName || "").toLowerCase();
    const cr = Number(s.credit) || 0;
    
    // Only count credits if the grade is passing (not F, R, M, S, I)
    const isPassing = !['F', 'R', 'M', 'S', 'I'].includes(s.grade);
    const earnedCredits = isPassing ? cr : 0;

    const subjectData = { ...s, earnedCredits };

    // Identify Domain
    if (!baskets.domain) {
      const codePrefix = s.subCode?.substring(0, 4)?.toUpperCase();
      if (DOMAINS[codePrefix]) {
        baskets.domain = DOMAINS[codePrefix];
      }
    }

    // --- BASKET I: Sciences ---
    if (
      name.includes("differential equation") || name.includes("linear algebra") ||
      name.includes("laplace") || name.includes("fourier") ||
      name.includes("complex analysis") || name.includes("numerical methods") ||
      name.includes("discrete mathematics") || name.includes("probability") || name.includes("statistics") ||
      name.includes("mechanics for engineers") || name.includes("optics") || name.includes("optical fibres") ||
      name.includes("applied analytical chemistry") || name.includes("applied engineering materials") ||
      name.includes("environmental studies") || name.includes("physics") || name.includes("chemistry") || name.includes("mathematics")
    ) {
      baskets.B1.subjects.push(subjectData);
      baskets.B1.credits += earnedCredits;
    }
    // --- BASKET II: Humanities & Management ---
    else if (
      name.includes("job readiness") || name.includes("economics") || name.includes("costing") ||
      name.includes("project management") || name.includes("gender") || name.includes("human rights") ||
      name.includes("ethics") || name.includes("climate change") || name.includes("sustainability") ||
      name.includes("optimization") || name.includes("management") || name.includes("communication") || name.includes("english")
    ) {
      baskets.B2.subjects.push(subjectData);
      baskets.B2.credits += earnedCredits;
    }
    // --- BASKET III: Smart Stack ---
    else if (
      name.includes("iot") || name.includes("automation") || name.includes("data analysis") ||
      name.includes("visualization") || name.includes("machine learning") || name.includes("robotic") ||
      name.includes("ros") || name.includes("design thinking") || name.includes("dymola") ||
      name.includes("smart engineering") || name.includes("g2m") || name.includes("python") || name.includes("programming in c") || name.includes("c++")
    ) {
      baskets.B3.subjects.push(subjectData);
      baskets.B3.credits += earnedCredits;
    }
    // --- BASKET V: Domain, Skills & Projects ---
    else if (
      name.includes("internship") || name.includes("skill") || name.includes("minor project") ||
      name.includes("major project") || name.includes("domain") || 
      // If it's 4+ credits and not caught above, it might be a domain track subject.
      // We'll also catch typical project keywords
      (name.includes("project") && !name.includes("management") && !name.includes("smart engineering"))
    ) {
      baskets.B5.subjects.push(subjectData);
      baskets.B5.credits += earnedCredits;
    }
    // --- BASKET IV: Core Engineering ---
    // If it doesn't match B1, B2, B3, or explicitly B5, we assume it's a Core Engineering subject (B4).
    else {
      // Examples: Data Structures, OS, Networks, DBMS, Java, Thermodynamics, etc.
      // To prevent everything falling here, we can assume anything left is B4.
      // If a student is taking a Domain subject that isn't named "Project" or "Skill", it might fall here.
      // But we will use B4 as the fallback for standard engineering subjects.
      baskets.B4.subjects.push(subjectData);
      baskets.B4.credits += earnedCredits;
    }
  });

  return baskets;
}
