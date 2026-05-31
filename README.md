# 🎓 GradeFlow

**GradeFlow** is a modern, high-performance Academic Analytics Platform built on the MERN stack. It empowers university students to track their academic journeys, predict future performance, and generate official grade sheets, while providing administrators with a powerful, secure dashboard for bulk result uploads.

---

## ✨ Features

### 👨‍🎓 For Students
* **Advanced Analytics Dashboard:** Beautiful, interactive graphs displaying semester-by-semester SGPA and CGPA trends.
* **Grade Predictor & What-If Analysis:** Intelligent mathematical tools allowing students to simulate future semester grades to see how they impact their final CGPA.
* **Placement Readiness:** Instant evaluation of academic standing against standard campus placement criteria.
* **Official Grade Sheets:** One-click PDF generation of formatted, printable grade sheets with embedded university branding and tamper-proof layouts.
* **University Leaderboards:** Real-time branch-wise and batch-wise academic rankings.

### 👨‍💻 For Administrators
* **Bulk Excel Uploads:** Effortlessly publish thousands of student results instantly using standard CSV/Excel formats.
* **Data Validation Engine:** Built-in safeguards against duplicate entries or malformed data files.
* **Secure Access:** JWT-protected admin routes with rate-limiting.

### 🎨 UI / UX
* **Glassmorphism & Neumorphism:** A premium, "crazy but clean" aesthetic featuring responsive grid layouts, blurred translucent panels, and micro-animations.
* **Fully Responsive:** Perfectly optimized for both desktop widescreen and mobile devices (including dynamically scaling charts and smart-wrapping layout engines).
* **Native-like Feel:** Mobile pinch-zooming is disabled to mimic a true native app experience.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Lucide-React (Icons), Recharts (Data Viz), Framer Motion (Animations), jsPDF (Document Generation)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose ORM)
* **Security:** JSON Web Tokens (JWT), Express Rate Limit, bcrypt

---

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/JaganParida/GradeFlow.git
cd GradeFlow
```

### 2. Setup the Backend
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/gradeflow
JWT_SECRET=your_super_secret_jwt_key
ADMIN_EMAIL=admin@gradeflow.com
ADMIN_PASSWORD=admin123
```
Start the backend server:
```bash
npm start
```

### 3. Setup the Frontend
```bash
cd ../frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```

---

## ☁️ Deployment

GradeFlow is designed to be easily deployed to modern cloud providers:
* **Frontend:** Deploy the `/frontend` directory directly to **Vercel** as a Vite project.
* **Backend:** Deploy the `/backend` directory to **Render** as a Node Web Service.
* **Database:** Connect your deployed backend to a free **MongoDB Atlas** sandbox instance.
