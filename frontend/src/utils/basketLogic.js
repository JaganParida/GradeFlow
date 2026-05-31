export const BASKET_TARGETS = {
  B1: 17,
  B2: 12,
  B3: 25,
  B4: 58,
  B5: 48,
  Total: 160
};

// Returns { b1: [], b2: [], b3: [], b4: [], b5: [] }

export const isMatch = (sub, syllabusSub) => {
  const norm1 = (sub.subName || "").toLowerCase().replace(/and/g, '').replace(/[^a-z0-9]/g, '');
  const norm2 = (syllabusSub.subName || "").toLowerCase().replace(/and/g, '').replace(/[^a-z0-9]/g, '');

  const isMinorProject = norm1.includes("minorproject") || norm2.includes("minorproject");
  
  if (isMinorProject) {
     const hasII_1 = norm1.includes("ii") || norm1.includes("2");
     const hasII_2 = norm2.includes("ii") || norm2.includes("2");
     if (hasII_1 !== hasII_2) return false; // Force distinction between I and II
  }

  if (sub.subCode && syllabusSub.subCode && sub.subCode.toLowerCase() === syllabusSub.subCode.toLowerCase()) return true;
  if (!sub.subName || !syllabusSub.subName) return false;
  
  return norm1.includes(norm2) || norm2.includes(norm1);
};

// Returns { b1: [], b2: [], b3: [], b4: [], b5: [] }
export function categorizeBaskets(results) {
  const baskets = {
    B1: { credits: 0, subjects: [], target: BASKET_TARGETS.B1 },
    B2: { credits: 0, subjects: [], target: BASKET_TARGETS.B2 },
    B3: { credits: 0, subjects: [], target: BASKET_TARGETS.B3 },
    B4: { credits: 0, subjects: [], target: BASKET_TARGETS.B4 },
    B5: { credits: 0, subjects: [], target: BASKET_TARGETS.B5 },
    EX: { credits: 0, subjects: [], target: 0 },
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
      
      let key = sub.subCode;
      if (sub.subName && sub.subName.toLowerCase().includes("minor project")) {
         key = `${sub.subCode}_${sub.subName.toLowerCase().trim()}`;
      }
      allSubjectsMap.set(key, { ...sub, semester: sem.semester });
    });
  });

  const allSubjects = Array.from(allSubjectsMap.values());

  allSubjects.forEach(s => {
    const cr = Number(s.credit) || 0;
    const isPassing = !['F', 'R', 'M', 'S', 'I'].includes(s.grade);
    const earnedCredits = isPassing ? cr : 0;
    const subjectData = { ...s, earnedCredits };

    if (BASKET_1_SYLLABUS.some(bs => isMatch(s, bs))) {
      baskets.B1.subjects.push(subjectData);
      baskets.B1.credits += earnedCredits;
      return;
    }
    if (BASKET_2_SYLLABUS.some(bs => isMatch(s, bs))) {
      baskets.B2.subjects.push(subjectData);
      baskets.B2.credits += earnedCredits;
      return;
    }
    if (BASKET_3_SYLLABUS.some(bs => isMatch(s, bs))) {
      baskets.B3.subjects.push(subjectData);
      baskets.B3.credits += earnedCredits;
      return;
    }
    if (BASKET_4_SYLLABUS.some(bs => isMatch(s, bs))) {
      baskets.B4.subjects.push(subjectData);
      baskets.B4.credits += earnedCredits;
      return;
    }
    if (COMMON_BASKET_5_SYLLABUS.some(bs => isMatch(s, bs))) {
      baskets.B5.subjects.push(subjectData);
      baskets.B5.credits += earnedCredits;
      return;
    }
    if (BASKET_5_SKILL_COURSES.some(bs => isMatch(s, bs))) {
      baskets.B5.subjects.push(subjectData);
      baskets.B5.credits += earnedCredits;
      return;
    }
    
    let matchedDomain = false;
    for (const domain of BASKET_5_DOMAINS_DATA) {
      if (domain.subjects.some(bs => isMatch(s, bs))) {
        matchedDomain = true;
        break;
      }
    }
    
    if (matchedDomain) {
      baskets.B5.subjects.push(subjectData);
      baskets.B5.credits += earnedCredits;
      return;
    }

    const name = (s.subName || "").toLowerCase();
    if (name.includes("internship") || name.includes("project") || name.includes("skill")) {
      baskets.B5.subjects.push(subjectData);
      baskets.B5.credits += earnedCredits;
    } else {
      baskets.EX.subjects.push(subjectData);
      baskets.EX.credits += earnedCredits;
    }
  });

  return baskets;
}


export const BASKET_4_SYLLABUS = [
  {
    "subCode": "CUCS1001",
    "subName": "Programming in C",
    "credits": 6
  },
  {
    "subCode": "CUCS1002",
    "subName": "Data Structures with Competitive Coding",
    "credits": 6
  },
  {
    "subCode": "CUCS1003",
    "subName": "Design and Analysis of Algorithms",
    "credits": 6
  },
  {
    "subCode": "CUCS1004",
    "subName": "Java Programming",
    "credits": 6
  },
  {
    "subCode": "CUCS1005",
    "subName": "Relational and Distributed Databases",
    "credits": 4
  },
  {
    "subCode": "CUCS1006",
    "subName": "Network and Protocols for IoT",
    "credits": 3
  },
  {
    "subCode": "CUCS1007",
    "subName": "Information Security (CISCO)",
    "credits": 3
  },
  {
    "subCode": "CUCS1008",
    "subName": "Theory of Computation and Compiler Design",
    "credits": 4
  },
  {
    "subCode": "CUCS1009",
    "subName": "System Administrator (RedHat)",
    "credits": 3
  },
  {
    "subCode": "CUCS1010",
    "subName": "Cloud Practitioner (AWS)",
    "credits": 2
  },
  {
    "subCode": "CUCS1011",
    "subName": "Software Engineering and Testing",
    "credits": 3
  },
  {
    "subCode": "CUCS1012",
    "subName": "Customer Experience Design and Programming",
    "credits": 4
  },
  {
    "subCode": "CUCS1013",
    "subName": "Android Development with Kotlin",
    "credits": 6
  },
  {
    "subCode": "CUCS1014",
    "subName": "Prompt Engineering using ChatGPT",
    "credits": 2
  },
  {
    "subCode": "CUCS1015",
    "subName": "Cloud Fundamentals (Azure)",
    "credits": 2
  }
];
export const COMMON_BASKET_5_SYLLABUS = [
  { subCode: "CUTM1577", subName: "MINOR PROJECT II", credits: 2 },
  { subCode: "CUTM1905", subName: "INTERNSHIP", credits: 2 },
  { subCode: "CUTM1906", subName: "MINOR PROJECT", credits: 2 }
];

export const BASKET_5_SKILL_COURSES = [
  {
    "subCode": "CUTM3081",
    "subName": "Organic Farming",
    "credits": 4
  },
  {
    "subCode": "CUTM3082",
    "subName": "Mushroom Grower",
    "credits": 4
  },
  {
    "subCode": "CUTM3083",
    "subName": "Hydroponics Technology",
    "credits": 4
  },
  {
    "subCode": "CUTM3084",
    "subName": "Poultry Farming",
    "credits": 4
  },
  {
    "subCode": "CUTM3085",
    "subName": "Dairy Farming",
    "credits": 4
  },
  {
    "subCode": "CUTM3086",
    "subName": "Vermicomposting Farming",
    "credits": 4
  },
  {
    "subCode": "CUTM3087",
    "subName": "Transformer Manufacturing, Repairing and Maintenance",
    "credits": 4
  },
  {
    "subCode": "CUTM3089",
    "subName": "Electrical Installation",
    "credits": 4
  },
  {
    "subCode": "CUTM3090",
    "subName": "Repair and Maintenance of Home Appliances",
    "credits": 4
  },
  {
    "subCode": "CUTM3091",
    "subName": "Refrigeration and Air Conditioning",
    "credits": 4
  },
  {
    "subCode": "CUTM3092",
    "subName": "Super Critical Co2 Plant Operation",
    "credits": 4
  },
  {
    "subCode": "CUTM3095",
    "subName": "Business Plan Preparation",
    "credits": 4
  },
  {
    "subCode": "CUTM3098",
    "subName": "Composite Fabrication Practice",
    "credits": 4
  },
  {
    "subCode": "CUTM3100",
    "subName": "Farm Appliances Operation",
    "credits": 4
  },
  {
    "subCode": "CUTM3102",
    "subName": "Solid Waste Management",
    "credits": 4
  },
  {
    "subCode": "CUTM3103",
    "subName": "Bio Fertilisers Preparation",
    "credits": 4
  },
  {
    "subCode": "CUTM3104",
    "subName": "PCB Designing & Fabrication",
    "credits": 4
  },
  {
    "subCode": "CUTM3105",
    "subName": "Introduction to Block Chain Technology",
    "credits": 4
  },
  {
    "subCode": "CUTM3106",
    "subName": "Introduction to Nutraceuticals",
    "credits": 4
  },
  {
    "subCode": "CUTM3108",
    "subName": "Introduction to Computational Biology",
    "credits": 4
  },
  {
    "subCode": "CUTM3109",
    "subName": "Product Life Cycle Management through Gate process",
    "credits": 4
  },
  {
    "subCode": "CUTM3110",
    "subName": "New Material Development with Biovia",
    "credits": 4
  },
  {
    "subCode": "CUTM3111",
    "subName": "Spectral Image Processing Using Python",
    "credits": 4
  },
  {
    "subCode": "CUTM3112",
    "subName": "Satellite Data Processing",
    "credits": 4
  },
  {
    "subCode": "CUTM3113",
    "subName": "Working with Graphene and carbon fibre",
    "credits": 4
  },
  {
    "subCode": "CUTM3114",
    "subName": "Adobe Tools and Illustrations",
    "credits": 4
  },
  {
    "subCode": "CUTM3115",
    "subName": "Digital Painting",
    "credits": 4
  },
  {
    "subCode": "CUTM3120",
    "subName": "Computer Installation and Maintenance",
    "credits": 4
  },
  {
    "subCode": "CUTM3121",
    "subName": "3D Game Art",
    "credits": 4
  },
  {
    "subCode": "CUTM3122",
    "subName": "Drug Design using Biovia Discovery Studio",
    "credits": 4
  },
  {
    "subCode": "CUTM3123",
    "subName": "Opthalmic Lens and Spectacle Manufacturing Techniques",
    "credits": 4
  },
  {
    "subCode": "CUTM3124",
    "subName": "Medical Diagnostic Techniques",
    "credits": 4
  },
  {
    "subCode": "CUTM3125",
    "subName": "Introduction to Aquaponics",
    "credits": 4
  },
  {
    "subCode": "CUTM3126",
    "subName": "Polyhouse Automation",
    "credits": 4
  },
  {
    "subCode": "CUTM3127",
    "subName": "Development of Processor (Shakti)",
    "credits": 4
  },
  {
    "subCode": "CUTM3128",
    "subName": "Spectroscopy",
    "credits": 4
  },
  {
    "subCode": "CUTM3129",
    "subName": "Extraction Technologies",
    "credits": 4
  },
  {
    "subCode": "CUTM3130",
    "subName": "Gamified DIY Kits Using Lasers",
    "credits": 4
  },
  {
    "subCode": "CUTM3131",
    "subName": "VR Assets Development",
    "credits": 4
  },
  {
    "subCode": "CUTM3134",
    "subName": "GIS and Remote Sensing",
    "credits": 4
  }
];

export const BASKET_1_SYLLABUS = [
  {
    "subCode": "CUTM1001",
    "subName": "Differential Equations and Linear Algebra",
    "credits": 3
  },
  {
    "subCode": "CUTM1002",
    "subName": "Laplace & Fourier Transforms",
    "credits": 3
  },
  {
    "subCode": "CUTM1003",
    "subName": "Complex Analysis & Numerical Methods",
    "credits": 3
  },
  {
    "subCode": "CUTM1004",
    "subName": "Discrete Mathematics",
    "credits": 3
  },
  {
    "subCode": "CUTM1005",
    "subName": "Probability & Statistics",
    "credits": 3
  },
  {
    "subCode": "CUTM1925",
    "subName": "Calculus",
    "credits": 3
  },
  {
    "subCode": "CUTM1006",
    "subName": "Mechanics for Engineers",
    "credits": 3
  },
  {
    "subCode": "CUTM1007",
    "subName": "Optics and Optical Fibres",
    "credits": 3
  },
  {
    "subCode": "CUTM1008",
    "subName": "Applied Analytical Chemistry",
    "credits": 3
  },
  {
    "subCode": "CUTM1009",
    "subName": "Applied Engineering Materials",
    "credits": 3
  },
  {
    "subCode": "CUTM1674",
    "subName": "Environmental Science",
    "credits": 4
  }
];

export const BASKET_2_SYLLABUS = [
  {
    "subCode": "CUTM1011",
    "subName": "Optimisation Techniques",
    "credits": 2
  },
  {
    "subCode": "CUTM1012",
    "subName": "Engineering Economics and Costing",
    "credits": 3
  },
  {
    "subCode": "CUTM1013",
    "subName": "Project Management",
    "credits": 3
  },
  {
    "subCode": "CUTM1014",
    "subName": "Gender, Human Rights and Ethics",
    "credits": 3
  },
  {
    "subCode": "CUTM1015",
    "subName": "Climate Change, Sustainability and Organisation",
    "credits": 3
  },
  {
    "subCode": "CUTM1016",
    "subName": "Job Readiness",
    "credits": 6
  }
];

export const BASKET_3_SYLLABUS = [
  {
    "subCode": "CUTM1017",
    "subName": "Industrial IOT and Automation",
    "credits": 6
  },
  {
    "subCode": "CUTM1018",
    "subName": "Data Analysis and Visualisation using Python",
    "credits": 4
  },
  {
    "subCode": "CUTM1019",
    "subName": "Machine Learning using Python",
    "credits": 4
  },
  {
    "subCode": "CUTM1020",
    "subName": "Robotic automation with ROS and C++",
    "credits": 4
  },
  {
    "subCode": "CUTM1021",
    "subName": "Basics of Design Thinking",
    "credits": 2
  },
  {
    "subCode": "CUTM1022",
    "subName": "System Integration with DYMOLA",
    "credits": 2
  },
  {
    "subCode": "CUTM1023",
    "subName": "Smart Engineering Project (G2M)",
    "credits": 3
  }
];



export const BASKET_5_DOMAINS_DATA = [
  {
    "name": "Full-Stack Development with MERN",
    "subjects": [
      {
        "subCode": "CUFD1001",
        "subName": "MongoDB for Developers",
        "credits": 3
      },
      {
        "subCode": "CUFD1002",
        "subName": "Node.js and Express.js Development",
        "credits": 3
      },
      {
        "subCode": "CUFD1003",
        "subName": "Front-End Development with React",
        "credits": 3
      },
      {
        "subCode": "CUFD1004",
        "subName": "Full Stack Integration and Deployment",
        "credits": 3
      },
      {
        "subCode": "CUFD1005",
        "subName": "Product Development",
        "credits": 6
      }
    ]
  },
  {
    "name": "Generative AI",
    "subjects": [
      {
        "subCode": "CUGA1011",
        "subName": "Fundamentals of Generative AI",
        "credits": 1
      },
      {
        "subCode": "CUGA1012",
        "subName": "Advanced Techniques in Generative AI",
        "credits": 2
      },
      {
        "subCode": "CUGA1013",
        "subName": "Real-Time Generative AI",
        "credits": 3
      },
      {
        "subCode": "CUGA1014",
        "subName": "Research and Development in Generative AI",
        "credits": 2
      },
      {
        "subCode": "CUGA1015",
        "subName": "Capstone Project in Generative AI",
        "credits": 4
      }
    ]
  },
  {
    "name": "Data Analytics and Machine Learning",
    "subjects": [
      {
        "subCode": "CUML1021",
        "subName": "Machine Learning for Predictive Analytics",
        "credits": 4
      },
      {
        "subCode": "CUML1022",
        "subName": "Deep Learning for Image Analytics",
        "credits": 4
      },
      {
        "subCode": "CUML1023",
        "subName": "Data Analytics using Tableau",
        "credits": 4
      },
      {
        "subCode": "CUML1024",
        "subName": "ML for Spectral Imaging (Optional)",
        "credits": 4
      },
      {
        "subCode": "CUML1025",
        "subName": "Project",
        "credits": 6
      }
    ]
  },
  {
    "name": "Cloud Technology",
    "subjects": [
      {
        "subCode": "CUCT1031",
        "subName": "Advanced Cloud Architecture and Design",
        "credits": 3
      },
      {
        "subCode": "CUCT1032",
        "subName": "Cloud Development and DevOps",
        "credits": 3
      },
      {
        "subCode": "CUCT1033",
        "subName": "Cloud Security and Compliance",
        "credits": 3
      },
      {
        "subCode": "CUCT1034",
        "subName": "Capstone Project",
        "credits": 3
      }
    ]
  },
  {
    "name": "Drone Imaging and Spectral Analysis",
    "subjects": [
      {
        "subCode": "CUDS1041",
        "subName": "Drone Image Processing using Pix4D",
        "credits": 3
      },
      {
        "subCode": "CUDS1042",
        "subName": "Multispectral Image Analytics for Agriculture",
        "credits": 3
      },
      {
        "subCode": "CUDS1043",
        "subName": "Drone Imaging Applications",
        "credits": 2
      },
      {
        "subCode": "CUDS1044",
        "subName": "Domain Project",
        "credits": 4
      }
    ]
  },
  {
    "name": "Software Technology",
    "subjects": [
      {
        "subCode": "CUST1051",
        "subName": "Advanced Java",
        "credits": 4
      },
      {
        "subCode": "CUST1052",
        "subName": "Angular",
        "credits": 4
      },
      {
        "subCode": "CUST1053",
        "subName": "Spring Boot",
        "credits": 4
      },
      {
        "subCode": "CUST1054",
        "subName": "Product Development",
        "credits": 6
      }
    ]
  },
  {
    "name": "Mobile App Development",
    "subjects": [
      {
        "subCode": "CUMA1071",
        "subName": "Introduction to Mobile App Development",
        "credits": 3
      },
      {
        "subCode": "CUMA1072",
        "subName": "React Native Development",
        "credits": 3
      },
      {
        "subCode": "CUMA1073",
        "subName": "Flutter Development",
        "credits": 3
      },
      {
        "subCode": "CUMA1074",
        "subName": "Advanced Mobile App Development Project",
        "credits": 3
      }
    ]
  },
  {
    "name": "Gaming and Immersive Learning-AR/VR",
    "subjects": [
      {
        "subCode": "CUGI1081",
        "subName": "Introduction to Gaming & Simulation",
        "credits": 2
      },
      {
        "subCode": "CUGI1082",
        "subName": "Game Assets and Objects",
        "credits": 3
      },
      {
        "subCode": "CUGI1083",
        "subName": "Building Game Environment",
        "credits": 3
      },
      {
        "subCode": "CUGI1084",
        "subName": "Game Animation, Scripting & UI",
        "credits": 3
      },
      {
        "subCode": "CUGI1085",
        "subName": "Binary Deployment and Cross-Platform Controls",
        "credits": 3
      },
      {
        "subCode": "CUGI1086",
        "subName": "Project",
        "credits": 6
      }
    ]
  },
  {
    "name": "Blockchain Development",
    "subjects": [
      {
        "subCode": "CUBD1091",
        "subName": "Introduction to Blockchain",
        "credits": 2
      },
      {
        "subCode": "CUBD1092",
        "subName": "Cryptocurrencies and Smart Contracts",
        "credits": 3
      },
      {
        "subCode": "CUBD1093",
        "subName": "Blockchain Development",
        "credits": 3
      },
      {
        "subCode": "CUBD1094",
        "subName": "Web3 and Decentralized Technologies",
        "credits": 3
      },
      {
        "subCode": "CUBD1095",
        "subName": "Advanced Blockchain Concepts and Development",
        "credits": 3
      },
      {
        "subCode": "CUBD1096",
        "subName": "Capstone Project in Blockchain Development",
        "credits": 4
      }
    ]
  },
  {
    "name": "Cyber Security",
    "subjects": [
      {
        "subCode": "CUCS1101",
        "subName": "Linux Server Management and Security",
        "credits": 4
      },
      {
        "subCode": "CUCS1102",
        "subName": "Offensive Security",
        "credits": 4
      },
      {
        "subCode": "CUCS1103",
        "subName": "Defensive Security",
        "credits": 4
      },
      {
        "subCode": "CUCS1104",
        "subName": "Security Analytics",
        "credits": 4
      },
      {
        "subCode": "CUCS1105",
        "subName": "Project",
        "credits": 4
      }
    ]
  },
  {
    "name": "Construction Planning, Monitoring and Project Management",
    "subjects": [
      {
        "subCode": "CUCP3001",
        "subName": "Site Study & Structural Drawings",
        "credits": 4
      },
      {
        "subCode": "CUCP3002",
        "subName": "Computational Techniques in Construction",
        "credits": 2
      },
      {
        "subCode": "CUCP3003",
        "subName": "Contract Laws & Equipment Management",
        "credits": 2
      },
      {
        "subCode": "CUCP3004",
        "subName": "Project Quality Control & Safety Management",
        "credits": 2
      },
      {
        "subCode": "CUCP3005",
        "subName": "Modern Construction and Material Supervision",
        "credits": 4
      },
      {
        "subCode": "CUCP3006",
        "subName": "Sustainability in Construction & Green Structures",
        "credits": 6
      }
    ]
  },
  {
    "name": "Aerial Surveying and Remote Sensing Applications",
    "subjects": [
      {
        "subCode": "CUAS2020",
        "subName": "Digital Image Remote Sensing & Processing",
        "credits": 4
      },
      {
        "subCode": "CUAS2021",
        "subName": "Geospatial Technology and Its Application",
        "credits": 4
      },
      {
        "subCode": "CUAS2026",
        "subName": "Photogrammetry and Its Application",
        "credits": 4
      },
      {
        "subCode": "CUAS2023",
        "subName": "Lidar Remote Sensing and Its Applications",
        "credits": 2
      },
      {
        "subCode": "CUAS2024",
        "subName": "Hyperspectral Remote Sensing and Its Application",
        "credits": 2
      },
      {
        "subCode": "CUAS2025",
        "subName": "Project",
        "credits": 4
      }
    ]
  },
  {
    "name": "Go To Market",
    "subjects": [
      {
        "subCode": "CUGM2140",
        "subName": "Design Thinking & Managing Innovation",
        "credits": 3
      },
      {
        "subCode": "CUGM2141",
        "subName": "PLM Tools on Dassault Platform",
        "credits": 8
      },
      {
        "subCode": "CUGM2142",
        "subName": "Process Management using ENOVIA",
        "credits": 3
      },
      {
        "subCode": "CUGM2143",
        "subName": "Product Development",
        "credits": 8
      }
    ]
  },
  {
    "name": "Automobile Engineering",
    "subjects": [
      {
        "subCode": "CUAE2170",
        "subName": "Introduction to Automobile Engineering",
        "credits": 3
      },
      {
        "subCode": "CUAE2171",
        "subName": "Subsystems of Automobile",
        "credits": 5
      },
      {
        "subCode": "CUAE2172",
        "subName": "Electric Vehicles",
        "credits": 3
      },
      {
        "subCode": "CUAE2176",
        "subName": "Maintenance of Automobile (2W & 4W)",
        "credits": 5
      },
      {
        "subCode": "CUAE2177",
        "subName": "Project",
        "credits": 4
      },
      {
        "subCode": "CUAE2175",
        "subName": "Internship",
        "credits": 4
      }
    ]
  },
  {
    "name": "Manufacturing (Conventional, CNC and Additive)",
    "subjects": [
      {
        "subCode": "CUCM2150",
        "subName": "Manufacturing Requirements and Planning",
        "credits": 2
      },
      {
        "subCode": "CUCM2151",
        "subName": "Conventional Machining for Components",
        "credits": 6
      },
      {
        "subCode": "CUCM2152",
        "subName": "CNC Machining",
        "credits": 8
      },
      {
        "subCode": "CUCM2153",
        "subName": "Non-Traditional Machining and 3D Printing",
        "credits": 4
      },
      {
        "subCode": "CUCM2154",
        "subName": "Wood Engineering",
        "credits": 2
      },
      {
        "subCode": "CUCM2155",
        "subName": "Internship",
        "credits": 4
      }
    ]
  },
  {
    "name": "Computational Fluid Dynamics",
    "subjects": [
      {
        "subCode": "CUCF2180",
        "subName": "Introduction to CFD",
        "credits": 3
      },
      {
        "subCode": "CUCF2181",
        "subName": "Grid Generation",
        "credits": 2
      },
      {
        "subCode": "CUCF2182",
        "subName": "Flow Solver Techniques-Simulia",
        "credits": 4
      },
      {
        "subCode": "CUCF2183",
        "subName": "Simulation and Validation",
        "credits": 5
      },
      {
        "subCode": "CUCF2184",
        "subName": "Industry Specific Project and/or Internship",
        "credits": 6
      }
    ]
  },
  {
    "name": "Composite Design and Manufacturing",
    "subjects": [
      {
        "subCode": "CUCD2130",
        "subName": "Introduction to Composite",
        "credits": 2
      },
      {
        "subCode": "CUCD2131",
        "subName": "Biovia - Materials & Characterization Techniques",
        "credits": 2
      },
      {
        "subCode": "CUCD2132",
        "subName": "Catia - Composite Design",
        "credits": 4
      },
      {
        "subCode": "CUCD2133",
        "subName": "Composite Product Validation Simulia Abaqus FEA",
        "credits": 4
      },
      {
        "subCode": "CUCD2134",
        "subName": "Machineries and Technologies for Manufacturing",
        "credits": 2
      },
      {
        "subCode": "CUCD2135",
        "subName": "Quality Control and Fabrication of Structure",
        "credits": 4
      },
      {
        "subCode": "CUCD2136",
        "subName": "Project",
        "credits": 6
      }
    ]
  },
  {
    "name": "Electronics Hardware Design and Automation",
    "subjects": [
      {
        "subCode": "CUEH2090",
        "subName": "Electronics Circuit and PCB Design",
        "credits": 3
      },
      {
        "subCode": "CUEH2091",
        "subName": "FPGA Systems: Verilog Design and Application",
        "credits": 3
      },
      {
        "subCode": "CUEH2092",
        "subName": "Embedded Programming",
        "credits": 3
      },
      {
        "subCode": "CUEH2093",
        "subName": "Product Electronic Design Engineering (Project)",
        "credits": 9
      }
    ]
  }
];

export function inferStudentDomainTrack(studentSubjects, allDomains) {
  if (!studentSubjects || !allDomains) return null;

  const trackScores = {};

  studentSubjects.forEach(sub => {
    const subNameLower = (sub.subName || "").toLowerCase();
    const subCodeLower = (sub.subCode || "").toLowerCase();

    allDomains.forEach(domain => {
      domain.subjects.forEach(ds => {
        if (
           (subCodeLower && ds.subCode && subCodeLower === ds.subCode.toLowerCase()) || 
           (subNameLower && ds.subName && subNameLower.includes(ds.subName.toLowerCase()) && ds.subName.length > 3)
        ) {
          if (!trackScores[domain.name]) trackScores[domain.name] = 0;
          trackScores[domain.name] += (Number(sub.credit) || 4); // weight by credit
        }
      });
    });
  });

  let bestTrack = null;
  let maxScore = 0;

  for (const [track, score] of Object.entries(trackScores)) {
    if (score > maxScore) {
      maxScore = score;
      bestTrack = allDomains.find(d => d.name === track);
    }
  }

  return bestTrack;
}
