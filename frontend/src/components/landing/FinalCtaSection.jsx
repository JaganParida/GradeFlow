import React from "react";
import { ArrowRight, ShieldCheck, GraduationCap, CheckCircle2, Loader2 } from "lucide-react";

export default function FinalCtaSection({
  hasActiveSession,
  currentRegNo,
  authChecking = false,
  onOpenApp,
  onLogin,
}) {
  return (
    <section
      className="gf-landing-final-cta"
      style={{
        maxWidth: 1240,
        margin: "60px auto 40px",
        padding: "0 24px",
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          border: "1px solid #e2e8f0",
          padding: "64px 32px",
          textAlign: "center",
          color: "#0f172a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Overline */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 750,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#2563eb",
              marginBottom: 16,
            }}
          >
            <GraduationCap size={15} />
            <span>Ready to Elevate Your Academics</span>
          </div>

          {/* Main Headline */}
          <h2
            style={{
              fontSize: "clamp(32px, 4.5vw, 48px)",
              fontWeight: 850,
              lineHeight: 1.12,
              letterSpacing: "-0.035em",
              color: "#0f172a",
              margin: "0 0 16px 0",
            }}
          >
            Know your grades
            <br />
            Understand your progress
            <br />
            <span style={{ color: "#2563eb" }}>
              Plan what's next
            </span>
          </h2>

          {/* Clean Subtitle */}
          <p
            style={{
              fontSize: "clamp(15px, 1.8vw, 17.5px)",
              lineHeight: 1.6,
              color: "#64748b",
              margin: "0 auto 32px",
              maxWidth: 560,
              textWrap: "balance",
            }}
          >
            Your academic journey deserves more than a plain marks table. Take strategic control of your GPA trajectory, degree progression, and placement eligibility today.
          </p>

          {/* Action Buttons */}
          <div
            className="gf-hero-btn-container"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 32,
            }}
          >
            {authChecking && !hasActiveSession ? (
              <div
                style={{
                  height: 48,
                  width: 220,
                  borderRadius: 10,
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  fontSize: 13,
                  fontWeight: 600,
                  gap: 8,
                }}
              >
                <div
                  className="gf-spin"
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid #cbd5e1",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                  }}
                />
                <span>Loading portal...</span>
              </div>
            ) : hasActiveSession ? (
              <button
                className="gf-mobile-full-btn"
                onClick={onOpenApp}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "13px 22px",
                  borderRadius: 10,
                  background: "#2563eb",
                  color: "#ffffff",
                  fontSize: "clamp(13px, 3.2vw, 15px)",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  flexWrap: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1d4ed8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#2563eb";
                }}
              >
                <span>Continue to Dashboard</span>
                {currentRegNo && (
                  <span
                    style={{
                      fontSize: "clamp(11px, 2.7vw, 12px)",
                      fontFamily: "'Space Mono', monospace",
                      fontWeight: 700,
                      background: "rgba(255, 255, 255, 0.22)",
                      color: "#ffffff",
                      padding: "2px 7px",
                      borderRadius: 6,
                      letterSpacing: "0.02em",
                      flexShrink: 0,
                    }}
                  >
                    {currentRegNo}
                  </span>
                )}
                <ArrowRight size={15} style={{ flexShrink: 0 }} />
              </button>
            ) : (
              <>
                <button
                  className="gf-mobile-full-btn"
                  onClick={onOpenApp}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 28px",
                    borderRadius: 10,
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 10px rgba(37, 99, 235, 0.25)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                >
                  <span>Open GradeFlow</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  className="gf-mobile-full-btn"
                  onClick={onLogin}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "14px 24px",
                    borderRadius: 10,
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: 15,
                    fontWeight: 650,
                    border: "1px solid #cbd5e1",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#94a3b8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                >
                  <span>Student Login</span>
                </button>
              </>
            )}
          </div>

          {/* Clean Trust Indicators (Always 1 Line on All Devices) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(8px, 2.5vw, 20px)",
              whiteSpace: "nowrap",
              fontSize: "clamp(10px, 2.6vw, 12px)",
              color: "#64748b",
              borderTop: "1px solid #f1f5f9",
              paddingTop: 18,
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
              <span>160 Credits</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
              <span>Zero ERP Downtime</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
              <span>Verified Engine</span>
            </div>
            <div className="gf-desktop-only" style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
              <span>50+ Cutoffs</span>
            </div>
            <div className="gf-desktop-only" style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
              <span>100% Private</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
