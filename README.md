# 🎓 GradeFlow

**GradeFlow** is a modern, high-performance Academic Analytics Platform built on the MERN stack. It empowers university students to track their academic journeys, predict future performance, and generate official grade sheets, while providing administrators with a powerful, secure dashboard for bulk result uploads.

---

## ✨ Features

### 👨‍🎓 For Students
* **Advanced Analytics Dashboard:** Experience a premium, interactive interface that dynamically visualizes your entire academic journey, displaying semester-by-semester SGPA and CGPA trends with beautiful, responsive charts.
* **Categorized Credit Baskets & Domain Tracker:** Intelligently categorizes completed subjects into distinct professional buckets (Foundation in Sciences, Humanities & Management, Smart Stack, Core Engineering, and Domain Skills). It automatically infers your specialization track and tracks your progress in internships, minor projects, and NPTEL certifications.
* **Lateral Entry Degree Tracker:** Dedicated 120-credit requirement tracking mode for lateral entry admissions with custom basket distribution rules (B1: 6, B2: 9, B3: 25, B4: 48, B5: 32) and automatic exemption mapping.
* **Placement Eligibility Engine:** A robust, branch-specific tool that instantly cross-references your current CGPA against real-world recruitment criteria of top-tier product and service-based companies (e.g., Microsoft, Amazon, L&T, TCS), giving you a clear picture of your placement readiness.
* **Grade Predictor & What-If Analysis:** Powerful target-prediction algorithms that allow you to simulate future semester performances. Understand exactly what SGPA you need to achieve your ultimate CGPA goals, enabling strategic academic planning.
* **University Leaderboards:** Real-time, transparent academic rankings. See where you stand not just within your specific branch, but across your entire batch through beautifully crafted, gamified leaderboards.
* **Official Grade Sheets (PDF Generation):** Seamless, one-click generation of formatted, print-ready grade sheets featuring embedded university branding, meticulously aligned data grids, and tamper-proof layouts.
* **Attendance Tracking & OCR Integration:** Smart attendance analytics with camera/screenshot OCR scanner integration, target percentage forecasting, and daily quota monitoring.
* **Dynamic Timetable & Academic Calendar:** Real-time schedule visualization with instant emergency class suspension alerts and synchronized holiday calendar overrides.
* **Real-time Notifications & Device Access:** In-app notification bell with instant campus broadcast announcements, 2-button interactive action routing, and multi-device login approval safeguards powered by Ably Realtime.

### 👨‍💻 For Administrators
* **Bulk Excel Uploads:** Effortlessly publish thousands of student results instantly using standard CSV/Excel formats.
* **Data Validation Engine:** Built-in safeguards against duplicate entries or malformed data files.
* **Timetable & Suspension Management:** Broadcast urgent class cancellations, manage suspension tags, and configure holiday schedule overrides in real time.
* **Session & Security Monitoring:** Device authorization controls, active student session management, and granular sub-admin role permissions.

### 🎨 UI / UX
* **Glassmorphism & Neumorphism:** A premium, "crazy but clean" aesthetic featuring responsive grid layouts, blurred translucent panels, and micro-animations.
* **Fully Responsive:** Perfectly optimized for both desktop widescreen and mobile devices (including dynamically scaling charts, responsive notification popovers, and smart-wrapping layout engines).
* **High-DPI Branding:** Crisp, pixel-perfect 1:1 multi-resolution application icons and SVG favicons engineered for sharp rendering across all viewport scales.
* **Native-like Feel:** Mobile pinch-zooming is disabled to mimic a true native app experience.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Lucide-React (Icons), Recharts (Data Viz), Framer Motion (Animations), jsPDF (Document Generation)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose ORM)
* **Realtime & Cloud:** Ably Realtime Pub/Sub, Vercel Serverless Functions
* **Security:** JSON Web Tokens (JWT), Express Rate Limit, bcrypt

---

## 🔒 License & Usage

**Proprietary Software**  
All rights reserved. This repository is provided for showcase and portfolio purposes only. 

⚠️ **Cloning, distribution, modification, and third-party contributions are strictly prohibited.**
