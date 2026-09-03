# GradeFlow — Project Brain

> Official Architectural, Functional, and Developer Context Document  
> **Source of Truth**: Current GradeFlow Codebase (`frontend/` & `backend/`)

---

## 1. Project Overview

**GradeFlow** is an enterprise-grade Academic Analytics and Intelligence Platform designed for Centurion University of Technology and Management (CUTM). It streamlines the academic journey for students and faculty by unifying exam results, 160-credit degree framework tracking, predictive CGPA planning, and institutional placement eligibility into an interactive and modern web experience.

### Core Objectives:
- **Instant Result Intelligence**: Provide zero-friction, semester-wise examination result lookups with SGPA, CGPA, credit breakdowns, and backlog tracking.
- **Academic Progress Transparency**: Track compliance with the 160-credit curriculum across 5 distinct credit baskets (Core, Domain, Ability Enhancement, Skill, and Value-Added courses).
- **Career & Placement Readiness**: Automatically calculate student eligibility for dream, super-dream, and mass recruitment company criteria based on live academic metrics.
- **Institutional Governance**: Offer administration tools for result uploading, timetable management, user feedback review, audit logging, and role-based delegation.

---

## 2. User Types

| User Type | Role & Description | Primary Capabilities |
|---|---|---|
| **Student** | Primary consumer of academic records | Authenticate via University Email OTP, view semester results, analyze credit progress across 5 baskets, simulate future CGPA, review placement eligibility, check class timetables, submit verified feedback, and download official grade sheets. |
| **Main Admin** | Institutional Master Administrator | Full administrative authority. Upload and publish semester results (Excel/CSV), manage branch timetables, configure university settings, toggle system-wide Maintenance Mode, create and manage Sub-Admins, review student feedback, and monitor audit logs. |
| **Sub-Admin** | Delegated Administrative Faculty / Staff | Departmental staff with scoped permissions granted by the Main Admin (e.g., student record management, timetable editing, or feedback review). Restricted strictly to authorized modules. |

---

## 3. Technology Stack

- **Frontend**:
  - **Framework**: React 18 with Vite build tooling
  - **Routing**: React Router DOM (v6/v7)
  - **Styling**: Tailwind CSS, Lucide React Icons
  - **PDF & Canvas Export**: `html2canvas`, `jspdf`, `jspdf-autotable`
  - **State Management**: React Context API (`AppContext.jsx`) with `sessionStorage` caching
- **Backend & Serverless API**:
  - **Runtime**: Node.js (Express.js for standalone server, Vercel Serverless Functions for cloud edge)
  - **Database Engine**: MongoDB Atlas via Mongoose ODM
  - **Authentication**: Passwordless 2FA cryptographic OTP via University Email, JSON Web Tokens (HS256)
  - **Email Infrastructure**: Brevo SMTP (Primary Relay) with Gmail SMTP (Automatic Failover)
  - **Security & Utilities**: `bcryptjs`, `jsonwebtoken`, `helmet`, `cors`, `nodemailer`

---

## 4. High-Level Architecture

```
                       ┌───────────────────────────────┐
                       │        Student / Admin        │
                       │     (Web & Mobile Browser)    │
                       └───────────────┬───────────────┘
                                       │ HTTPS
                                       ▼
                       ┌───────────────────────────────┐
                       │     Vercel Edge Network /     │
                       │       React SPA Frontend      │
                       └───────────────┬───────────────┘
                                       │ REST API Requests
                                       ▼
                       ┌───────────────────────────────┐
                       │    Express.js Backend /       │
                       │   Vercel Serverless APIs      │
                       ├───────────────────────────────┤
                       │  • Rate Limiting & Wi-Fi NAT  │
                       │  • Auth Guards & RBAC Checks  │
                       │  • Maintenance Mode Filter    │
                       │  • Concurrency Semaphore      │
                       └───────┬───────────────┬───────┘
                               │               │
                 Mongoose ODM  │               │ SMTP (TLS)
                               ▼               ▼
                     ┌───────────────┐   ┌───────────────┐
                     │ MongoDB Atlas │   │ Brevo / Gmail │
                     │   Database    │   │ Email Service │
                     └───────────────┘   └───────────────┘
```

---

## 5. Repository Structure

```
GradeFlow/
├── frontend/                     # React Single-Page Application & Serverless APIs
│   ├── api/                      # Vercel Serverless Server Endpoints
│   │   ├── _lib/                 # Shared database, email, protection & session helpers
│   │   ├── admin/                # Serverless admin routing
│   │   ├── auth.js               # Serverless authentication dispatcher
│   │   ├── rankings.js           # Serverless rankings & leaderboard
│   │   ├── student.js            # Serverless student records & analytics
│   │   └── timetable.js          # Serverless timetable schedule
│   ├── public/                   # Static icons, favicons, logos, manifest
│   ├── src/
│   │   ├── components/           # Reusable UI widgets, modals, charts, degree baskets
│   │   │   ├── system/           # Global maintenance, offline, & network listeners
│   │   ├── context/              # AppContext (global user state, caching, theme)
│   │   ├── pages/                # Top-level view routes (Dashboard, Landing, Admin, etc.)
│   │   └── services/             # API client services (api.js, timetableService.js)
│   ├── package.json              # Frontend dependencies and build scripts
│   └── vite.config.js            # Vite configuration & build optimization
├── backend/                      # Standalone Node.js & Express API Server
│   ├── config/                   # Database connection pooling & server configuration
│   ├── middleware/               # Auth guards, RBAC, rate limiting, maintenance, error handler
│   ├── models/                   # Mongoose schemas (Student, Result, Session, Otp, Config)
│   ├── routes/                   # Express routes (auth, student, admin, rankings, timetable)
│   ├── scripts/                  # Automated integration, load & penetration test suites
│   ├── utils/                    # Semaphore queue, session manager, email provider failover
│   ├── package.json              # Backend dependencies and runtime scripts
│   └── server.js                 # Express server bootstrap & middleware wiring
└── BRAIN.md                      # Master developer and architectural memory (this file)
```

---

## 6. Frontend Architecture

- **Root & Entry**: `frontend/src/main.jsx` bootstraps React into `#root`, wrapping the application in `AppContextProvider` and `BrowserRouter`.
- **State Management (`AppContext.jsx`)**:
  - Manages `studentData`, `currentStudent`, `sessionToken`, `maintenanceMode`, and `theme`.
  - Implements an **in-memory and `sessionStorage` cache** to ensure that switching tabs or viewing different degree baskets triggers **0 duplicate backend database queries**.
- **Routing (`App.jsx`)**:
  - Declarative client-side routing via React Router DOM.
  - Route guards protect `/dashboard`, `/admin`, and departmental views against unauthenticated access.
- **System Listeners**:
  - `GlobalMaintenanceBanner.jsx`: Mounts globally to intercept and render full-screen maintenance screens when active.
  - `NetworkStatusListener.jsx`: Detects browser connectivity drops and displays actionable reconnect prompts.

---

## 7. Backend Architecture

- **Server Initialization (`backend/server.js`)**:
  - Configures security headers via Helmet, whitelists CORS origins via `FRONTEND_URL`, configures JSON payload limits (10MB for result uploads), and mounts API routers.
- **Middleware Pipeline**:
  1. `rateLimiters.js`: Endpoint-specific rate limiting with composite IP + identity keys for shared college Wi-Fi.
  2. `maintenance.js`: Authoritative server-side filter that allows Main Admin access while blocking student endpoints with HTTP 503 during maintenance.
  3. `auth.js`: Verifies JWT tokens, validates active database sessions, and enforces 7-day inactivity expirations.
  4. `rbac.js`: Evaluates Sub-Admin permissions against requested administrative actions.
  5. `dbProtection.js`: Wraps database queries in a bounded async semaphore queue (40 concurrent active slots) to prevent connection pool exhaustion.
  6. `errorHandler.js`: Catches errors, strips sensitive stack traces, and sends user-friendly error responses.

---

## 8. Student Features

| Feature | Purpose | Key File Reference |
|---|---|---|
| **Semester Result Viewer** | Displays semester-wise SGPA, CGPA, subject grades, and backlog flags | [`Dashboard.jsx`](file:///d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Dashboard.jsx) |
| **160-Credit Degree Framework** | Tracks credit completion across Core, Domain, Ability, Skill, and Value-Added baskets | [`BasketDashboard.jsx`](file:///d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/components/BasketDashboard.jsx) |
| **What-If SGPA / CGPA Predictor** | Client-side simulation of expected future semester grades (zero backend requests) | [`TargetPredictor.jsx`](file:///d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/components/TargetPredictor.jsx) |
| **Placement Readiness Matrix** | Evaluates student CGPA and backlog metrics against tier-based recruitment criteria | [`PlacementReadiness.jsx`](file:///d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/components/PlacementReadiness.jsx) |
| **Timetable Schedule Viewer** | View daily batch, branch, and section schedules with local cache support | [`Timetable.jsx`](file:///d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Timetable.jsx) |
| **Batch PDF Result Exporter** | Generates institutional grade sheets via HTML2Canvas and jsPDF | [`Dashboard.jsx`](file:///d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/pages/Dashboard.jsx) |
| **Student Feedback System** | Authenticated feedback submission with university identity verification | [`FeedbackModal.jsx`](file:///d:/Important/Development_Projects/Advanced/Gradeflow/frontend/src/components/FeedbackModal.jsx) |

---

## 9. Main Admin Features

- **Master Dashboard**: Real-time institutional overview of active students, branch CGPA averages, pass percentages, and backlog distributions.
- **Bulk Result Publishing**: Upload Excel/CSV spreadsheets containing semester marks with automatic schema transformation.
- **Timetable Management**: Create, update, and publish branch schedules and room allocations.
- **Maintenance Mode Toggle**: Real-time switch to put student-facing portals into maintenance while preserving full administrative access.
- **Sub-Admin Delegation**: Create Sub-Admins, assign module-specific permissions, and inspect activity via `AdminAuditLog`.
- **Feedback Center**: Review, filter, and resolve student-submitted feedback and rating submissions.

---

## 10. Sub-Admin Features

- **Concept**: Delegated accounts created by the Main Admin to distribute administrative workload without sharing Master Admin credentials.
- **Module Permissions**:
  - `STUDENT_DATA`: View and search student academic records.
  - `TIMETABLE`: Edit and publish branch schedules.
  - `ANALYTICS`: View departmental performance charts and statistics.
  - `FEEDBACK`: Inspect student feedback submissions.
  - `SETTINGS`: Departmental configurations (Maintenance mode restricted to Main Admin).
- **Governance**: All Sub-Admin actions are logged in `AdminAuditLog` with actor ID, target module, action type, IP, and timestamp.

---

## 11. Maintenance Mode

- **Behavior**:
  - **Main Admin**: Retains **FULL ACCESS** to all dashboards, tools, and maintenance toggles.
  - **Students / Public**: **100% BLOCKED**. Frontend displays a full-screen maintenance banner; backend student APIs return HTTP 503 (`code: "MAINTENANCE_MODE"`).
- **Enforcement**: Server-authoritative in `maintenance.js` backed by MongoDB `SystemConfig`. Direct URL entry, browser refresh, Ctrl+R, or curl requests cannot bypass maintenance.

---

## 12. Authentication & Account Lockout Security

- **Student Authentication**: Hybrid secure authentication:
  - **Passwordless OTP (2FA)**: Students enter their registration number, receive a 6-digit cryptographic OTP on their verified `@centurionuniv.edu.in` email, and verify to obtain a signed session JWT.
  - **Password Login**: Optional password login with **strict brute-force defense**:
    - Evaluates `lockedUntil` timestamp *before* executing password hashes.
    - 3 consecutive failed password attempts trigger a **15-minute temporary lockout** (`lockedUntil = Date.now() + 15min`).
    - Attempting passwords while locked returns HTTP 429 (`ACCOUNT_TEMPORARILY_LOCKED`).
    - Successful OTP authentication resets `failedPasswordAttempts = 0` and clears `lockedUntil`.
- **Admin Authentication**: Multi-step verification. Main Admin submits email and password, followed by an administrative 2FA OTP sent to the authorized institutional email.
- **Sub-Admin Authentication & CPU DoS Protection**:
  - Sub-Admins log in with assigned credentials + 2FA email OTP, receiving an RBAC-scoped session token.
  - Mandatory email validation prevents unbounded CPU DoS: the system never loops over active accounts to evaluate bcrypt hashes without a matching email address.

---

## 13. Device & Session Experience & Data Isolation

- **Single-Device Policy (Normal Students)**: Students are permitted **1 active device**. Attempting to sign in on a second device requires in-website authorization or session transfer.
- **Lost Cookie Deadlock Resolution (Session Handover)**:
  - When students clear browser cookies or open Incognito windows while an existing session is registered, the approval modal provides an actionable **"Lost access to old device? Transfer via Email OTP"** pathway.
  - Verifying the 6-digit email OTP revokes the orphan device session and establishes an active session on the current device without admin intervention.
- **Superuser Policy (`230301120327`)**: Permitted up to **2 concurrent active devices** for cross-device development/testing.
- **Strict Academic Data Isolation (Zero IDOR)**:
  - Every student endpoint (`/api/student`, `/api/student/records`, etc.) authoritatively enforces `decodedStudent.regNo.toUpperCase() === cleanRegNo`.
  - No student token can query another student's exam results, marks, or attendance under any condition.
  - Administrative inspections of student records are strictly restricted to authenticated Admin routes with active admin sessions.
- **Admin Device Policy**: Maximum 2 active administrative sessions.
- **Database Session Invalidation (Express & Serverless)**:
  - Both Express and Vercel Serverless layers query MongoDB `AdminSession` and `StudentSession` on every protected request.
  - Explicit logout or remote session revocation terminates JWT authorization immediately across all environments.

---

## 14. OTP & Email Relay Architecture

- **Cryptographic Generation**: 6-digit numerical codes generated via `crypto.randomInt(100000, 999999)` and stored exclusively as salted `bcrypt` hashes.
- **Dual-Provider Failover**:
  - **Primary**: Brevo SMTP (`smtp-relay.brevo.com:587`).
  - **Fallback**: Gmail SMTP (`smtp.gmail.com:465/587`).
  - **Failover Invariance**: Seamless failover to Gmail using the **exact same OTP code** without generating conflicting duplicates.
- **Limits & Cooldown**:
  - **Cooldown**: 180-second (3-minute) atomic cooldown between OTP requests.
  - **Daily Limit**: Strictly **2 OTP attempts per calendar day** per student.
  - **TTL**: Codes expire automatically after 3 minutes (180 seconds).
- **Authenticated Email Relay Guard**:
  - Transactional academic update emails (topper recognitions, backlog alerts via `/api/emails.js`) require **active Admin authentication**.
  - Arbitrary open email relaying is strictly prohibited; recipient addresses default to official student emails (`@centurionuniv.edu.in`) and any admin-specified custom address is sanitized and validated.

---

## 15. Database Architecture

| Model / Collection | File Location | Core Responsibility |
|---|---|---|
| `Student` | `models/Student.js` | Core student profile, registration number, branch, batch, personal email |
| `SemesterResult` | `models/SemesterResult.js` | Subject-wise marks, credits, SGPA, CGPA, backlogs, academic health score |
| `StudentSession` | `models/StudentSession.js` | Active student devices, session IDs, user-agent details, login/activity timestamps |
| `OtpVerification` | `models/OtpVerification.js` | Salted bcrypt hashes of OTPs, expiration timestamps, attempt counters (TTL index) |
| `StudentDailyLimit`| `models/StudentDailyLimit.js`| Daily calendar OTP counters and cooldown timestamps (Asia/Kolkata date key) |
| `Admin` / `AdminSession` | `models/Admin.js` | Master admin credentials (bcrypt) and single-device admin session tracking |
| `SubAdmin` / `SubAdminSession` | `models/SubAdmin.js` | Delegated sub-admin profiles, module permission arrays, and session states |
| `AdminAuditLog` | `models/AdminAuditLog.js` | Immutable ledger of administrative actions, actor emails, and target modules |
| `SystemConfig` | `models/SystemConfig.js` | Global system configurations including maintenance mode status |
| `Timetable` | `models/Timetable.js` | Batch, branch, section schedules, subject codes, and room numbers |
| `Feedback` | `models/Feedback.js` | Student ratings, reviews, verification status, and admin resolution flags |

---

## 16. Business Data Flow

```
1. Student Enters RegNo  ──► Check Active Devices & Daily Limit ──► Generate Single Cryptographic OTP
                                                                             │
2. Brevo Primary Dispatch (or Gmail Fallback on quota limit) ◄───────────────┘
         │
         ▼
3. Student Submits OTP   ──► Verify Salted Hash ──► Issue Signed JWT & Store Active Session in DB
         │
         ▼
4. Open Dashboard        ──► Fetch Semester Results (via Concurrency Queue) ──► Cache in SessionStorage
         │
         ▼
5. Navigate 5 Baskets    ──► Render from In-Memory Cache (0 Additional Database Hits)
```

---

## 17. API Architecture

- `/api/auth/*`: Student check-status, send-otp, verify-otp, login-password (with 15m lockout), logout, admin login, 2FA verify, and sub-admin auth.
- `/api/student/*`: Student academic profile, semester results, 5-basket credit progress, and backlog analytics (strictly isolated to authenticated owner).
- `/api/emails.js`: Authenticated transactional email relay for toppers and backlog notices (Admin session required).
- `/api/attendance/ocr` & `/api/attendance-ocr.js`: Authenticated Gemini Vision OCR parser for ERP attendance screenshots.
- `/api/timetable/*`: Public/student schedule lookup, branch schedules, and active batch listings.
- `/api/rankings/*`: University leaderboards, top CGPA performers, and branch statistics.
- `/api/admin/*`: Result spreadsheet upload, student management, timetable editor, feedback moderation, and maintenance mode controls.

---

## 18. Frontend Routes

| Path | Component / Page | Access Control | Purpose |
|---|---|---|---|
| `/` | `Landing.jsx` | Public | Hero landing, feature showcase, quick result search, basket overview |
| `/dashboard` | `Dashboard.jsx` | Authenticated Student | Semester results, SGPA/CGPA, backlogs, grade sheet PDF export |
| `/timetable` | `Timetable.jsx` | Public / Student | Class timetables by batch, branch, and section |
| `/leaderboard`| `Leaderboard.jsx` | Public / Student | Academic top-rankings and branch performance |
| `/admin` | `AdminDashboard.jsx` | Authenticated Admin | Master administrative console and institutional analytics |
| `*` | `NotFound.jsx` | Public | Clean 404 handler with return home navigation |

---

## 19. Major Components

- `BasketDashboard.jsx`: Renders the 160-credit degree framework across 5 academic baskets with progress rings.
- `TargetPredictor.jsx`: Client-side simulator for target CGPA planning.
- `PlacementReadiness.jsx`: Visual eligibility matrix for campus recruitment tiers.
- `UpgradeModal.jsx`: Interactive guidance modal with mobile body-scroll lock.
- `FeedbackModal.jsx`: Modal for submitting authenticated student feedback.
- `GlobalMaintenanceBanner.jsx`: Full-screen system maintenance takeover component.
- `NetworkStatusListener.jsx`: Offline and slow-network monitoring widget.

---

## 20. Performance Architecture

- **In-Memory & Session Storage Caching**: Initial student result fetch is cached in `sessionStorage` and `AppContext`, eliminating redundant database lookups during navigation.
- **Edge CDN Caching**: Public routes (Timetable, Rankings) provide `Cache-Control: public, s-maxage=120-300, stale-while-revalidate=300-600`.
- **Database Bounded Concurrency Semaphore**: Caps simultaneous active parallel queries to 40 slots with a 200-request queue and 2,500ms timeout, protecting MongoDB Atlas Free M0 socket limits.
- **Database Indexing**: Unique and compound indexes on `regNo`, `sessionId`, `dateKey`, `(batch, branch, semester)`.
- **Tested Throughput**: Capable of processing 1,000 concurrent queries in $< 400\text{ms}$ (~2,500 RPS) with 0% error rate.

---

## 21. Error & Network Experience

- **Slow Network**: After 4 seconds of pending requests, displays a non-blocking `"Taking longer than expected..."` indicator.
- **Offline Disconnection**: `NetworkStatusListener.jsx` detects offline status and displays a reconnection banner.
- **High Concurrency Queue Saturation**: Returns clean HTTP 429 with automated retry advice (`code: "HIGH_TRAFFIC_QUEUE"`).
- **Maintenance Active**: Returns clean HTTP 503 and presents `GlobalMaintenanceBanner.jsx`.
- **Sanitized Errors**: Internal database paths, stack traces, and SMTP details are stripped by `errorHandler.js`.

---

## 22. Important Architectural Decisions

1. **Client-Side Academic Calculations**: CGPA prediction, credit deficit math, and placement eligibility run entirely in the browser using loaded result data, offloading heavy CPU computation from the server.
2. **Passwordless Student Auth**: Eliminates student password management and credential stuffing attacks by relying on institutional email 2FA OTPs.
3. **Dual-Provider Email Strategy**: Protects against third-party email provider outages by maintaining an automated failover circuit to Gmail SMTP.
4. **Session-Level Device Locking**: Authoritatively tracks physical device sessions in MongoDB, preventing unauthorized account sharing across multiple concurrent users.
5. **Separation of Public vs Private Caching**: Edge CDN caching is strictly reserved for public static data; private student academic records are enforced with `no-store, private` headers.

---

## 23. Existing Features That Must Not Break

- [x] Student registration number validation & 2FA OTP verification
- [x] Single-device restriction for standard students (and 2-device for superuser `230301120327`)
- [x] 180-second (3-minute) OTP cooldown and 2 OTPs/day limit (deducted only upon successful email delivery)
- [x] Single-OTP code invariance during Brevo $\rightarrow$ Gmail failover
- [x] 7-day continuous inactivity session revocation
- [x] Master Admin login, 2FA OTP, single-device admin policy, and full maintenance access
- [x] Sub-Admin creation, RBAC module enforcement, and audit logging
- [x] System Maintenance Mode (Admin full access, student total block)
- [x] 160-Credit 5-Basket Degree Framework calculations
- [x] What-If Target CGPA Predictor
- [x] Placement Readiness Tier Matrix
- [x] Timetable schedule viewing and Edge CDN caching
- [x] In-memory result caching (zero database hits on tab switch)
- [x] Shared college Wi-Fi composite rate-limiting
- [x] Strict student academic data isolation (Zero IDOR: students can only access their own records)
- [x] Password brute-force defense (3 failed attempts trigger 15m lockout with `lockedUntil`)
- [x] Main Admin and Sub-Admin database-backed session validation across Express and Serverless
- [x] Protected email dispatch relay (/api/emails.js restricted to authenticated administrators)
- [x] Authenticated Attendance OCR API with payload memory caps
- [x] Sub-Admin mandatory email check preventing CPU DoS bcrypt loops
- [x] Rankings NoSQL & TypeError protection with type-guarded regex escaping
- [x] Compound database indexing on `Ranking` ({ regNo: 1, semester: 1 }, { semester: 1, batch: 1 })
- [x] Centralized CORS dynamic origin reflection complying with Fetch/CORS credentials standard
- [x] Global Vercel production security headers (nosniff, SAMEORIGIN, strict-origin, Permissions-Policy)
- [x] Lost Cookie deadlock resolution with in-website Email OTP session handover

---

## 24. Development Guidelines

1. **Inspect Before Modifying**: Always read existing implementations in `backend/` and `frontend/` before introducing changes.
2. **Preserve User Flows**: Do not break the passwordless OTP login, multi-device security, or degree framework visualization.
3. **Maintain Security Hygiene**: Never commit passwords, API keys, JWT secrets, or connection strings to source files or documentation.
4. **Keep Concerns Separated**: UI presentation belongs in `frontend/src/`, serverless endpoints in `frontend/api/`, and core server routes in `backend/routes/`.
5. **Test Thoroughly**: Run `node backend/scripts/penetration_test_suite.js` and `node backend/scripts/comprehensive_audit_suite.js` after backend modifications.

---

## 25. External Services

| Service | Purpose | Integration Location |
|---|---|---|
| **MongoDB Atlas** | Primary cloud database (student records, results, sessions, configs) | `backend/config/db.js` & `frontend/api/_lib/db.js` |
| **Brevo SMTP** | Primary transactional email relay for 6-digit OTP dispatch | `backend/utils/emailProviderManager.js` |
| **Gmail SMTP** | Secondary automated fallback email relay for OTP dispatch | `backend/utils/emailProviderManager.js` |
| **Vercel** | Edge hosting, static asset distribution, and serverless compute | `frontend/api/` & `vercel.json` |

---

## 26. Deployment Overview

- **Frontend**: Hosted on Vercel Edge Network, compiling via Vite to static HTML/JS/CSS in `frontend/dist/`.
- **Serverless API**: Vercel Serverless Functions (`frontend/api/*.js`) routing API requests dynamically.
- **Dedicated Backend**: Express.js server (`backend/server.js`) configured for traditional Node.js container or VPS environments.
- **Database**: Cloud MongoDB Atlas replica set with connection pooling.

---

## 27. Environment Configuration (Categories)

- **Database Configuration**: MongoDB Atlas connection URI (`MONGO_URI`).
- **Security & JWT Configuration**: Signing key for HS256 tokens (`JWT_SECRET`).
- **Master Admin Credentials**: Seed email (`ADMIN_EMAIL`) and initial credential (`ADMIN_PASSWORD`).
- **Primary Email Configuration**: Host (`EMAIL_HOST`), port (`EMAIL_PORT`), user (`EMAIL_USER`), key (`EMAIL_PASS`), sender address (`EMAIL_FROM`).
- **Fallback Email Configuration**: Gmail account (`GMAIL_SMTP_USER`), Google App Password (`GMAIL_SMTP_PASS`).
- **Application Settings**: Production frontend origin (`FRONTEND_URL`), daily OTP limit (`STUDENT_DAILY_OTP_MAX`), DB throttle (`DB_MAX_PARALLEL_QUERIES`).

---

## 28. Instructions for AI Agents

1. **Read BRAIN.md first** to understand GradeFlow's architecture, user types, and core workflows.
2. **Inspect actual repository code** before making assumptions.
3. **Reuse existing models, utilities, and components** (`sessionManager`, `dbProtection`, `emailProviderManager`, `AppContext`).
4. **Never remove or bypass existing security mechanisms** (such as device limits, OTP cooldowns, maintenance mode, or IDOR checks).
5. **Never expose or hardcode secrets** in source code, scripts, or markdown artifacts.
6. **Execute test suites and builds** (`npm run build`, `penetration_test_suite.js`) after making code edits.
7. **Update BRAIN.md** whenever major architectural components are added or modified.

---

## 29. Documentation Boundary

> **Notice**: This document provides safe architectural, functional, and developer context for GradeFlow. Sensitive security implementation internals, cryptographic secrets, private credentials, authentication bypass instructions, and private infrastructure details are intentionally excluded to maintain system security.
