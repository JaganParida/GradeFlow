# Security Policy — GradeFlow

## 1. Responsible Disclosure
If you discover a security vulnerability within GradeFlow, please send an email to **jaganparida9154@gmail.com** with:
- Description of the vulnerability and its potential impact.
- Steps or proof-of-concept to reproduce the issue.
- Please do not publicly disclose the vulnerability until a patch has been released.

We commit to acknowledging your report within 48 hours and deploying a fix as quickly as possible.

---

## 2. Core Security Controls & Architecture

- **Strict Data Isolation**: Students can exclusively query and view their own verified academic records. Access to other student records is rejected with `403 Forbidden` at the database middleware layer.
- **Single-Device Session Enforcement**: Each student account is bound to a single active session in MongoDB with a 7-day rolling inactivity timeout. Logging in on a new device invalidates prior sessions.
- **Email OTP Authentication**: Authenticated via Centurion University official email addresses (`regNo@centurionuniv.edu.in`) with 3-minute TTL, bcrypt hashed codes, and daily limits.
- **Secure Transport & Cookies**: Cross-origin JWT tokens are stored exclusively in `HttpOnly; Secure; SameSite=None` cookies.
- **Content Security Policy & HSTS**: Enforced via Helmet HTTP security headers.
- **NoSQL & Formula Injection Prevention**: Queries are sanitized via `express-mongo-sanitize`, and spreadsheet uploads neutralize formula injection characters (`=`, `+`, `-`, `@`).

---

## 3. Known Accepted Risks & Mitigations

- **`xlsx@0.18.5`**: The `xlsx` package has known prototype-pollution/ReDoS advisories on npm. In GradeFlow, spreadsheet parsing is restricted strictly to authenticated administrators (`protect` middleware), rate-limited (`adminLimiter`), and validated via magic-byte buffer inspection before parsing. Migration to the SheetJS CDN build is tracked for a future release.

---

## 4. Secrets & Credentials Rotation Policy

If any developer with access departs or a credential is suspected of compromise:
1. `JWT_SECRET`: Rotate immediately on hosting platforms (invalidates existing sessions).
2. `MONGO_URI`: Rotate MongoDB Atlas database user password and update environment variables.
3. `ADMIN_PASSWORD`: Update `ADMIN_PASSWORD` in the environment; automatic synchronization will update the database on startup.
4. `EMAIL_PASS`: Rotate SMTP Brevo API credentials and update the environment.
