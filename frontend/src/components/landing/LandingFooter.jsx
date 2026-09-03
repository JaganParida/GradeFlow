import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowUpRight } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function LandingFooter({ onNavigateSection }) {
  const navigate = useNavigate();
  const { adminToken, adminProfile, adminButtonConfig, isAdminButtonVisible, studentSession } = useApp();
  const loggedInRegNo = studentSession?.regNo || "";
  const isSpecialAdminPortalViewer = loggedInRegNo === "230301120327";
  const isSubAdminViewer = Boolean(adminProfile?.isSubAdmin);
  const isMainAdminViewer = Boolean(adminToken && !isSubAdminViewer);

  let canSeeAdmin = false;
  if (adminButtonConfig && adminButtonConfig.mode === "MANUAL") {
    const roles = adminButtonConfig.allowedRoles || {};
    if (isMainAdminViewer) {
      canSeeAdmin = roles.mainAdmin !== false;
    } else if (isSubAdminViewer) {
      canSeeAdmin = roles.subAdmin !== false;
    } else if (isSpecialAdminPortalViewer) {
      canSeeAdmin = roles.specialStudent !== false;
    } else if (loggedInRegNo) {
      canSeeAdmin = Boolean(roles.allStudents);
    } else {
      canSeeAdmin = Boolean(roles.guests);
    }
  } else {
    // Exact original automatic logic (Preserved untouched)
    canSeeAdmin = Boolean(adminToken || isSpecialAdminPortalViewer || isAdminButtonVisible);
  }

  return (
    <footer
      className="gf-landing-footer"
      style={{
        background: "#ffffff",
        borderTop: "1px solid #e2e8f0",
        padding: "64px 20px 36px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* Top Grid */}
        <div
          className="gf-footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Col 1: Brand (Spans 2 columns on Mobile, 1 on Desktop) */}
          <div className="gf-footer-brand-col" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img
                src="/webisteLogo.png"
                alt="GradeFlow Logo"
                style={{ height: 42, width: "auto", objectFit: "contain" }}
              />
              <span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                GradeFlow
              </span>
            </div>

            <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: 0, maxWidth: 300 }}>
              Academic Analytics &bull; GPA Intelligence &bull; Degree Planning
              <br />
              Engineered for university students to track, predict, and optimize academic trajectories.
            </p>

            {/* System Status Pill */}
            <div style={{ marginTop: 6 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#166534",
                  background: "#dcfce7",
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid #bbf7d0",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Col 2: Product Intelligence */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 14 }}>
              Product
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5 }}>
              <li>
                <Link
                  to="/about"
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  About GradeFlow
                </Link>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection("features");
                  }}
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Core Features
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection("features");
                  }}
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Academic Analytics
                </a>
              </li>
              <li>
                <a
                  href="#predictor"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection("predictor");
                  }}
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Grade Predictor
                </a>
              </li>
              <li>
                <a
                  href="#placement"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection("placement");
                  }}
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Placement Readiness
                </a>
              </li>
              <li>
                <a
                  href="#domains"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection("domains");
                  }}
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  5-Basket Intelligence
                </a>
              </li>
              <li>
                <a
                  href="#leaderboard"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection("leaderboard");
                  }}
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Cohort Rankings
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Academic Resources */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 14 }}>
              Academic Tools
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5 }}>
              <li>
                <a
                  href="#gradesheet"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection("gradesheet");
                  }}
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Grade Sheet Generator
                </a>
              </li>
              <li>
                <Link
                  to="/resources"
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Curriculum &amp; Syllabi
                </Link>
              </li>
              <li>
                <Link
                  to="/timetable"
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Class Timetable
                </Link>
              </li>
              <li>
                <Link
                  to="/attendance"
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Attendance Intelligence
                </Link>
              </li>
              <li>
                <Link
                  to="/testimonials"
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Student Reviews
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Support, legal, and administrative access */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 14 }}>
              Support &amp; Legal
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5 }}>
              <li>
                <Link
                  to="/help"
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Help &amp; Support
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  Cookie Policy
                </Link>
              </li>
              {canSeeAdmin && (
                <li>
                  <Link
                    to="/admin"
                    style={{
                      color: "#0f172a",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#2563eb")}
                    onMouseLeave={(e) => (e.target.style.color = "#0f172a")}
                  >
                    <span>Admin Portal</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: "1px solid #f1f5f9",
            paddingTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 12.5,
            color: "#94a3b8",
          }}
        >
          <div>
            &copy; 2026 GradeFlow. Designed &amp; engineered for Centurion University students.
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span>Centurion University Framework</span>
            <span>&bull;</span>
            <span>160 Credits Graduation Path</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
