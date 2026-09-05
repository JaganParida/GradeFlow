import React from "react";

export function SkeletonBlock({ w = "100%", h = 20, r = "8px", style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width: w,
        maxWidth: "100%",
        height: h,
        borderRadius: r,
        boxSizing: "border-box",
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ h = 100, r = "14px", style = {} }) {
  return <SkeletonBlock h={h} r={r} style={style} />;
}

export function SkeletonGrid({ count = 4, h = 100 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <SkeletonCard key={i} h={h} />
        ))}
    </div>
  );
}

const fullPageStyle = {
  maxWidth: 1240,
  minHeight: "100vh",
  margin: "0 auto",
  padding: "56px 24px 48px",
  display: "flex",
  flexDirection: "column",
  gap: 24,
  boxSizing: "border-box",
  width: "100%",
};

/** ─── 1. Home / Landing Route Skeleton ────────────────────────── */
export function LandingSkeleton() {
  return (
    <div
      className="gf-skeleton-page-bg"
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
      aria-label="Loading home page"
      aria-busy="true"
    >
      <main className="gf-landing-skeleton-wrap" style={fullPageStyle}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, .95fr)", gap: 32, alignItems: "center" }} className="gf-route-skeleton-hero">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SkeletonBlock w="140px" h="28px" r="999px" />
          <SkeletonBlock w="92%" h="52px" r="10px" />
          <SkeletonBlock w="76%" h="52px" r="10px" />
          <SkeletonBlock w="88%" h="18px" r="6px" />
          <SkeletonBlock w="68%" h="18px" r="6px" />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <SkeletonBlock w="150px" h="46px" r="12px" />
            <SkeletonBlock w="130px" h="46px" r="12px" />
          </div>
        </div>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 22,
            padding: 24,
            boxShadow: "0 8px 30px rgba(15,23,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonBlock w="140px" h="22px" r="6px" />
            <SkeletonBlock w="70px" h="24px" r="999px" />
          </div>
          <SkeletonBlock w="100%" h="180px" r="14px" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <SkeletonBlock h="50px" r="10px" />
            <SkeletonBlock h="50px" r="10px" />
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {Array(4).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 16,
              padding: "20px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <SkeletonBlock w="36px" h="36px" r="10px" />
            <SkeletonBlock w="70px" h="26px" r="6px" />
            <SkeletonBlock w="120px" h="13px" r="4px" />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }} className="gf-route-skeleton-cards">
        {Array(3).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 20,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <SkeletonBlock w="42px" h="42px" r="12px" />
            <SkeletonBlock w="160px" h="20px" r="6px" />
            <SkeletonBlock w="100%" h="14px" r="4px" />
            <SkeletonBlock w="85%" h="14px" r="4px" />
            <SkeletonBlock w="100px" h="28px" r="8px" style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
      </main>
    </div>
  );
}

/** ─── 2. Public Policy / About Dev Page Skeleton ──────────────── */
export function PublicPageSkeleton() {
  return (
    <div
      className="gf-skeleton-page-bg"
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
      aria-label="Loading page"
      aria-busy="true"
    >
      <main
        className="gf-public-skeleton-wrap"
        style={{ ...fullPageStyle, maxWidth: 920, padding: "64px 20px 48px" }}
        aria-label="Loading page"
        aria-busy="true"
      >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 20,
          padding: "36px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: "0 2px 12px rgba(15,23,42,0.03)",
        }}
      >
        <SkeletonBlock w="120px" h="24px" r="999px" />
        <SkeletonBlock w="65%" h="42px" r="10px" />
        <SkeletonBlock w="100%" h="16px" r="4px" />
        <SkeletonBlock w="92%" h="16px" r="4px" />
        <SkeletonBlock w="80%" h="16px" r="4px" />
        <SkeletonBlock w="100%" h="220px" r="16px" style={{ margin: "10px 0" }} />
        <SkeletonBlock w="100%" h="16px" r="4px" />
        <SkeletonBlock w="88%" h="16px" r="4px" />
      </div>
      </main>
    </div>
  );
}

/** ─── 3. Academic Resources Page Skeleton ─────────────────────── */
export function ResourcesSkeleton() {
  return (
    <div
      className="gf-skeleton-page-bg"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
      aria-label="Loading resources"
      aria-busy="true"
    >
      <main
        className="gf-resources-skeleton-wrap"
        style={{ ...fullPageStyle, maxWidth: 1280, padding: "32px 24px 64px" }}
        aria-label="Loading resources"
        aria-busy="true"
      >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 18,
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SkeletonBlock w="240px" h="28px" r="8px" />
          <SkeletonBlock w="160px" h="14px" r="4px" />
        </div>
        <SkeletonBlock w="280px" h="44px" r="10px" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0, 1fr)", gap: 22 }} className="gf-route-skeleton-resources">
        {/* Sidebar Categories */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <SkeletonBlock w="100px" h="14px" r="4px" style={{ marginBottom: 4 }} />
          {Array(6).fill(0).map((_, i) => (
            <SkeletonBlock key={i} w="100%" h="40px" r="8px" />
          ))}
        </div>

        {/* Resources Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 16,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SkeletonBlock w="36px" h="36px" r="10px" />
                <SkeletonBlock w="60px" h="22px" r="6px" />
              </div>
              <SkeletonBlock w="85%" h="18px" r="5px" />
              <SkeletonBlock w="60%" h="13px" r="4px" />
              <SkeletonBlock w="100%" h="36px" r="8px" style={{ marginTop: 4 }} />
            </div>
          ))}
        </div>
      </div>
      </main>
    </div>
  );
}

/** ─── 4. Admin Login Split-Screen Skeleton (100% Content Match) ── */
export function AdminLoginSkeleton() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fcfdfe",
        padding: "40px 20px 80px",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', sans-serif",
      }}
      aria-label="Loading admin sign in"
      aria-busy="true"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 40,
          maxWidth: 1120,
          width: "100%",
          alignItems: "center",
        }}
      >
        {/* Left Column: Security Features & Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SkeletonBlock w="160px" h="30px" r="999px" />
          <SkeletonBlock w="92%" h="42px" r="10px" />
          <SkeletonBlock w="76%" h="42px" r="10px" />
          <SkeletonBlock w="88%" h="16px" r="4px" />
          <SkeletonBlock w="68%" h="16px" r="4px" />

          {/* 3 Security Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <SkeletonBlock w="38px" h="38px" r="10px" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    <SkeletonBlock w="160px" h="15px" r="4px" />
                    <SkeletonBlock w="85%" h="12px" r="4px" />
                  </div>
                </div>
              ))}
          </div>

          {/* Bottom Trust Badges */}
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <SkeletonBlock w="160px" h="22px" r="6px" />
            <SkeletonBlock w="160px" h="22px" r="6px" />
          </div>
        </div>

        {/* Right Column: High-Fidelity Auth Card */}
        <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 20,
              padding: "32px 28px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <SkeletonBlock w="44px" h="44px" r="12px" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <SkeletonBlock w="180px" h="20px" r="6px" />
                <SkeletonBlock w="120px" h="12px" r="4px" />
              </div>
            </div>

            {/* Segmented Mode Tab Switcher */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, background: "#f1f5f9", padding: 4, borderRadius: 10 }}>
              <SkeletonBlock h="36px" r="8px" />
              <SkeletonBlock h="36px" r="8px" />
            </div>

            {/* Password Input Placeholder */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <SkeletonBlock w="100px" h="14px" r="4px" />
              <SkeletonBlock w="100%" h="48px" r="10px" />
            </div>

            {/* Submit Button Placeholder */}
            <SkeletonBlock w="100%" h="48px" r="10px" style={{ marginTop: 6 }} />

            {/* Advisory Notice */}
            <SkeletonBlock w="100%" h="40px" r="10px" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** ─── 5. Admin Dashboard Full-Page Skeleton ───────────────────── */
export function AdminDashboardSkeleton() {
  return (
    <div
      className="gf-skeleton-page-bg"
      style={{
        background: "#fcfdfe",
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
      aria-label="Loading admin dashboard"
      aria-busy="true"
    >
      <div
        className="gf-admin-skeleton-wrap"
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          boxSizing: "border-box",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Admin Top Navigation Header Card */}
        <div
          className="gf-admin-skeleton-header-card"
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 18,
            display: "flex",
            justifyContent: "space-between",
            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
            boxSizing: "border-box",
            width: "100%",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
            <SkeletonBlock w="40px" h="40px" r="11px" style={{ flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <SkeletonBlock w="170px" h="20px" r="6px" style={{ maxWidth: "60%" }} />
                <SkeletonBlock w="100px" h="18px" r="999px" />
              </div>
              <SkeletonBlock w="240px" h="12px" r="4px" style={{ maxWidth: "85%" }} />
            </div>
          </div>
          <div className="gf-admin-skeleton-header-btns" style={{ display: "flex", gap: 8 }}>
            <SkeletonBlock w="120px" h="36px" r="10px" className="gf-admin-skel-btn" />
            <SkeletonBlock w="120px" h="36px" r="10px" className="gf-admin-skel-btn" />
          </div>
        </div>

        {/* 4 Metric Stats (Matches 2x2 on Mobile, 4-col on Desktop) */}
        <div
          className="gf-admin-skeleton-stats-grid"
          style={{
            display: "grid",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="gf-admin-skeleton-stat-card"
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
                  boxSizing: "border-box",
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <SkeletonBlock w="30px" h="30px" r="8px" style={{ flexShrink: 0 }} />
                  <SkeletonBlock w="52px" h="16px" r="6px" />
                </div>
                <div style={{ margin: "6px 0" }}>
                  <SkeletonBlock w="60px" h="22px" r="6px" />
                </div>
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                  <SkeletonBlock w="80px" h="11px" r="4px" />
                  <SkeletonBlock w="50px" h="9px" r="3px" />
                </div>
              </div>
            ))}
        </div>

        {/* Navigation Tabs Skeleton: Single modern pill card on Mobile, Horizontal pills on Desktop */}
        <div className="gf-admin-skeleton-mobile-subnav" style={{ width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px 6px 4px" }}>
            <SkeletonBlock w="90px" h="10px" r="3px" />
            <SkeletonBlock w="130px" h="10px" r="3px" />
          </div>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "10px 13px",
              minHeight: 58,
              boxSizing: "border-box",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0 }}>
              <SkeletonBlock w="38px" h="38px" r="10px" style={{ flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
                <SkeletonBlock w="130px" h="14px" r="4px" style={{ maxWidth: "70%" }} />
                <SkeletonBlock w="80px" h="11px" r="4px" style={{ maxWidth: "45%" }} />
              </div>
            </div>
            <SkeletonBlock w="56px" h="32px" r="8px" style={{ flexShrink: 0 }} />
          </div>
        </div>

        <div className="gf-admin-skeleton-desktop-tabs" style={{ display: "flex", gap: 8, overflowX: "hidden", paddingBottom: 2 }}>
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <SkeletonBlock key={i} w="135px" h="38px" r="999px" style={{ flexShrink: 0 }} />
            ))}
        </div>

        {/* Main Action / Dropzone Card */}
        <div
          className="gf-admin-skeleton-content-card"
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 18,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
            boxSizing: "border-box",
            width: "100%",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
              <SkeletonBlock w="200px" h="18px" r="6px" style={{ maxWidth: "60%" }} />
              <SkeletonBlock w="280px" h="12px" r="4px" style={{ maxWidth: "85%" }} />
            </div>
            <SkeletonBlock w="90px" h="30px" r="8px" style={{ flexShrink: 0 }} />
          </div>

          <SkeletonBlock w="100%" h="160px" r="14px" />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 0 }}>
              <SkeletonBlock w="120px" h="36px" r="8px" style={{ maxWidth: "45%" }} />
              <SkeletonBlock w="120px" h="36px" r="8px" style={{ maxWidth: "45%" }} />
            </div>
            <SkeletonBlock w="140px" h="36px" r="10px" style={{ flexShrink: 0 }} />
          </div>
        </div>
      </div>

      <style>{`
        .gf-admin-skeleton-wrap {
          padding: 24px 20px 80px;
        }
        .gf-admin-skeleton-header-card {
          padding: 18px 22px;
          align-items: center;
          flex-direction: row;
          gap: 12px;
        }
        .gf-admin-skeleton-header-btns {
          width: auto;
        }
        .gf-admin-skel-btn {
          width: 120px;
        }
        .gf-admin-skeleton-stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 14px;
        }
        .gf-admin-skeleton-stat-card {
          padding: 18px 20px;
        }
        .gf-admin-skeleton-mobile-subnav {
          display: none;
        }
        .gf-admin-skeleton-desktop-tabs {
          display: flex;
        }
        .gf-admin-skeleton-content-card {
          padding: 24px;
        }

        @media (max-width: 768px) {
          .gf-admin-skeleton-wrap {
            padding: 14px 12px 60px 12px !important;
            gap: 14px !important;
          }
          .gf-admin-skeleton-header-card {
            padding: 14px 14px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .gf-admin-skeleton-header-btns {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .gf-admin-skel-btn {
            width: 100% !important;
          }
          .gf-admin-skeleton-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .gf-admin-skeleton-stat-card {
            padding: 12px 11px !important;
          }
          .gf-admin-skeleton-mobile-subnav {
            display: block !important;
          }
          .gf-admin-skeleton-desktop-tabs {
            display: none !important;
          }
          .gf-admin-skeleton-content-card {
            padding: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}

/** ─── 6. Student Dashboard Full-Page Skeleton (100% Content Match) */
export function DashboardSkeleton() {
  return (
    <div
      className="gf-skeleton-page-bg"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
      aria-label="Loading dashboard"
      aria-busy="true"
    >
      <div
        className="gf-dashboard-skeleton-wrap"
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "24px 32px",
          display: "grid",
          gridTemplateColumns: "280px minmax(0, 1fr)",
          gap: 24,
          alignItems: "start",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
      {/* ── Left Profile Card Sidebar Skeleton ── */}
      <div className="gf-dashboard-skeleton-sidebar">
        {/* Student Avatar + Name + Reg No */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SkeletonBlock w="42px" h="42px" r="12px" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <SkeletonBlock w="60%" h="18px" r="6px" />
            <SkeletonBlock w="40%" h="14px" r="4px" />
          </div>
        </div>

        {/* Branch / Section / Batch 3-Column Pill Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 2 }}>
          <SkeletonBlock h="46px" r="10px" />
          <SkeletonBlock h="46px" r="10px" />
          <SkeletonBlock h="46px" r="10px" />
        </div>

        {/* Semester Selector Grid (6 Pills) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <SkeletonBlock w="80px" h="12px" r="4px" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <SkeletonBlock key={i} h="36px" r="8px" />
              ))}
          </div>
        </div>

        {/* Tools Action Row (3 Buttons) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <SkeletonBlock w="60px" h="12px" r="4px" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            <SkeletonBlock h="50px" r="10px" />
            <SkeletonBlock h="50px" r="10px" />
            <SkeletonBlock h="50px" r="10px" />
          </div>
        </div>
      </div>

      {/* ── Right / Main Content Area Skeleton ── */}
      <div className="gf-dashboard-skeleton-main">
        {/* Top Header Row & Badges */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SkeletonBlock w="160px" h="22px" r="6px" />
            <SkeletonBlock w="60px" h="24px" r="6px" />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <SkeletonBlock w="110px" h="26px" r="999px" />
            <SkeletonBlock w="130px" h="26px" r="999px" />
          </div>
        </div>

        {/* SGPA & CGPA Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {/* Card 1: Semester SGPA */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 16,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SkeletonBlock w="100px" h="14px" r="4px" />
              <SkeletonBlock w="50px" h="20px" r="6px" />
            </div>
            <SkeletonBlock w="80px" h="32px" r="8px" />
            <SkeletonBlock w="140px" h="12px" r="4px" />
          </div>

          {/* Card 2: Cumulative CGPA */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 16,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SkeletonBlock w="110px" h="14px" r="4px" />
              <SkeletonBlock w="55px" h="20px" r="6px" />
            </div>
            <SkeletonBlock w="80px" h="32px" r="8px" />
            <SkeletonBlock w="150px" h="12px" r="4px" />
          </div>
        </div>

        {/* Navigation Tabs Pill Bar */}
        <div style={{ display: "flex", gap: 8, overflowX: "hidden", paddingBottom: 2 }}>
          <SkeletonBlock w="140px" h="38px" r="999px" />
          <SkeletonBlock w="130px" h="38px" r="999px" />
          <SkeletonBlock w="140px" h="38px" r="999px" />
        </div>

        {/* Grade Sheet Table Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonBlock w="180px" h="20px" r="6px" />
            <SkeletonBlock w="100px" h="32px" r="8px" />
          </div>

          {/* Table Header Bar */}
          <SkeletonBlock w="100%" h="40px" r="8px" />

          {/* 6 Subject Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <SkeletonBlock key={i} w="100%" h="48px" r="8px" />
              ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

/** ─── 7. Grade Report Card Skeleton ──────────────────────────── */
export function ReportCardSkeleton() {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: 20,
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBlock w="200px" h="24px" r="6px" />
        <SkeletonBlock w="120px" h="36px" r="10px" />
      </div>

      {/* Table Header */}
      <SkeletonBlock w="100%" h="42px" r="8px" />

      {/* Table Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} w="100%" h="52px" r="8px" />
          ))}
      </div>
    </div>
  );
}

/** ─── 8. Internal Assessment Marks Skeleton ─────────────────── */
export function InternalMarksSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        width: "100%",
        padding: "12px 0",
        boxSizing: "border-box",
      }}
    >
      {/* Search & Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <SkeletonBlock w="240px" h="38px" r="10px" />
        <SkeletonBlock w="110px" h="38px" r="10px" />
      </div>

      {/* Table Header Row */}
      <SkeletonBlock w="100%" h="42px" r="8px" />

      {/* 6 Assessment Subject Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} w="100%" h="48px" r="8px" />
          ))}
      </div>
    </div>
  );
}

/** ─── 9. Analytics Page Skeleton (100% Content Match) ────────── */
export function AnalyticsSkeleton() {
  return (
    <div
      className="gf-skeleton-page-bg"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
      aria-label="Loading analytics"
      aria-busy="true"
    >
      <div
        className="gf-analytics-skeleton-wrap"
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "24px 20px 60px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          width: "100%",
          boxSizing: "border-box",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
      {/* Top Banner Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 18,
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SkeletonBlock w="150px" h="14px" r="4px" />
          <SkeletonBlock w="260px" h="28px" r="8px" />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <SkeletonBlock w="130px" h="40px" r="10px" />
          <SkeletonBlock w="110px" h="40px" r="10px" />
        </div>
      </div>

      {/* Tab Pills */}
      <div style={{ display: "flex", gap: 10, overflowX: "hidden" }}>
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} w="130px" h="38px" r="10px" style={{ flexShrink: 0 }} />
          ))}
      </div>

      {/* 4 Metric KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 16,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SkeletonBlock w="90px" h="12px" r="4px" />
                <SkeletonBlock w="28px" h="28px" r="8px" />
              </div>
              <SkeletonBlock w="70px" h="28px" r="6px" />
              <SkeletonBlock w="120px" h="11px" r="3px" />
            </div>
          ))}
      </div>

      {/* 2 Large Chart Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18 }}>
        {/* Progression Line Chart */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 18,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonBlock w="180px" h="20px" r="6px" />
            <SkeletonBlock w="80px" h="24px" r="6px" />
          </div>
          <SkeletonBlock w="100%" h="260px" r="12px" />
        </div>

        {/* Grade Distribution Bar/Pie Chart */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 18,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonBlock w="190px" h="20px" r="6px" />
            <SkeletonBlock w="70px" h="24px" r="6px" />
          </div>
          <SkeletonBlock w="100%" h="260px" r="12px" />
        </div>
      </div>

      {/* Subject Performance Breakdown Table Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 18,
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SkeletonBlock w="220px" h="20px" r="6px" />
          <SkeletonBlock w="100px" h="30px" r="8px" />
        </div>
        <SkeletonBlock w="100%" h="40px" r="8px" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <SkeletonBlock key={i} w="100%" h="48px" r="8px" />
            ))}
        </div>
      </div>
      </div>
    </div>
  );
}

/** ─── 10. Leaderboard Page Skeleton (100% Content Match) ──────── */
export function LeaderboardSkeleton({ isFullPage = false }) {
  const content = (
    <>
      {isFullPage && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 14px rgba(15,23,42,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Top Row: Title + SGPA/CGPA Switcher */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SkeletonBlock w="18px" h="18px" r="4px" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <SkeletonBlock w="180px" h="22px" r="6px" />
                <SkeletonBlock w="140px" h="12px" r="4px" />
              </div>
            </div>
            {/* Segmented Switcher Pill */}
            <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 10 }}>
              <SkeletonBlock w="75px" h="32px" r="7px" />
              <SkeletonBlock w="75px" h="32px" r="7px" />
            </div>
          </div>

          {/* Search Bar + Branch/Batch Dropdowns */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <SkeletonBlock w="320px" h="40px" r="10px" style={{ flex: 1, minWidth: 200 }} />
            <SkeletonBlock w="120px" h="40px" r="10px" />
            <SkeletonBlock w="120px" h="40px" r="10px" />
            <SkeletonBlock w="80px" h="40px" r="10px" />
          </div>

          {/* Semester Selector Tabs */}
          <div style={{ display: "flex", gap: 8, overflowX: "hidden" }}>
            {Array(8).fill(0).map((_, i) => (
              <SkeletonBlock key={i} w="65px" h="34px" r="8px" style={{ flexShrink: 0 }} />
            ))}
          </div>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {/* Rank 1 (Gold) */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #fde68a",
            borderRadius: 16,
            padding: "16px 18px",
            boxShadow: "0 4px 14px rgba(245, 158, 11, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#fef3c7",
                border: "2px solid #fde68a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SkeletonBlock w="24px" h="24px" r="6px" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
              <SkeletonBlock w="75%" h="16px" r="4px" />
              <SkeletonBlock w="45%" h="12px" r="4px" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <SkeletonBlock w="36px" h="10px" r="3px" />
            <SkeletonBlock w="52px" h="24px" r="6px" />
          </div>
        </div>

        {/* Rank 2 (Silver) */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #cbd5e1",
            borderRadius: 16,
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#f1f5f9",
                border: "1.5px solid #cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SkeletonBlock w="24px" h="24px" r="6px" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
              <SkeletonBlock w="70%" h="15px" r="4px" />
              <SkeletonBlock w="45%" h="12px" r="4px" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <SkeletonBlock w="36px" h="10px" r="3px" />
            <SkeletonBlock w="50px" h="22px" r="6px" />
          </div>
        </div>

        {/* Rank 3 (Bronze) */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #fed7aa",
            borderRadius: 16,
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#ffedd5",
                border: "1.5px solid #fed7aa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SkeletonBlock w="24px" h="24px" r="6px" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
              <SkeletonBlock w="65%" h="15px" r="4px" />
              <SkeletonBlock w="45%" h="12px" r="4px" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <SkeletonBlock w="36px" h="10px" r="3px" />
            <SkeletonBlock w="50px" h="22px" r="6px" />
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          boxSizing: "border-box",
        }}
      >
        {/* Table Header Row */}
        <div
          style={{
            background: "#f8fafc",
            borderBottom: "1px solid #cbd5e1",
            padding: "12px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <SkeletonBlock w="150px" h="14px" r="4px" />
          <SkeletonBlock w="80px" h="14px" r="4px" />
        </div>

        {/* 8 Detailed Student Rows */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {Array(8)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                style={{
                  padding: "12px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  borderBottom: index < 7 ? "1px solid #f1f5f9" : "none",
                }}
              >
                {/* Left: Rank badge + Avatar + Name + Reg No */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                  <SkeletonBlock w="28px" h="28px" r="8px" style={{ flexShrink: 0 }} />
                  <SkeletonBlock w="36px" h="36px" r="50%" style={{ flexShrink: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                    <SkeletonBlock w="140px" h="14px" r="4px" />
                    <SkeletonBlock w="90px" h="11px" r="3px" />
                  </div>
                </div>

                {/* Right: Branch badge + Scores */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <SkeletonBlock w="64px" h="24px" r="6px" />
                  <SkeletonBlock w="48px" h="24px" r="6px" />
                  <SkeletonBlock w="48px" h="24px" r="6px" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );

  if (isFullPage) {
    return (
      <div
        className="gf-skeleton-page-bg"
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
        aria-label="Loading leaderboard"
        aria-busy="true"
      >
        <div
          className="gf-leaderboard-skeleton-wrap"
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "24px 20px 60px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            boxSizing: "border-box",
            width: "100%",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: "100%",
        boxSizing: "border-box",
      }}
      aria-label="Loading leaderboard"
      aria-busy="true"
    >
      {content}
    </div>
  );
}

/** ─── 11. Admin Section Toppers Skeleton ──────────────────────── */
export function SectionToppersSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", boxSizing: "border-box" }}>
      {/* Top 3 Highlights Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SkeletonBlock w="32px" h="32px" r="50%" />
                <SkeletonBlock w="60px" h="20px" r="6px" />
              </div>
              <SkeletonBlock w="140px" h="16px" r="4px" />
              <SkeletonBlock w="90px" h="12px" r="3px" />
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4 }}>
                <SkeletonBlock w="60px" h="24px" r="6px" />
                <SkeletonBlock w="70px" h="24px" r="6px" />
              </div>
            </div>
          ))}
      </div>

      {/* Table Rows Skeleton Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 14,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} w="100%" h="48px" r="8px" />
          ))}
      </div>
    </div>
  );
}

/** ─── 12. Admin Backlog Tracker Skeleton ──────────────────────── */
export function BacklogTrackerSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", boxSizing: "border-box" }}>
      {/* Stats Summary Header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 12,
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <SkeletonBlock w="80px" h="12px" r="4px" />
              <SkeletonBlock w="60px" h="24px" r="6px" />
            </div>
          ))}
      </div>

      {/* Backlog List Rows Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 14,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} w="100%" h="56px" r="10px" />
          ))}
      </div>
    </div>
  );
}

/** ─── 13. Admin Dashboard Stats Cards Skeleton ────────────────── */
export function AdminStatsSkeleton() {
  return (
    <>
      <div className="gf-admin-stats-skeleton-grid" style={{ display: "grid", width: "100%", boxSizing: "border-box" }}>
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="gf-admin-stats-skel-card"
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
                boxSizing: "border-box",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                <SkeletonBlock w="30px" h="30px" r="8px" style={{ flexShrink: 0 }} />
                <SkeletonBlock w="52px" h="16px" r="6px" />
              </div>
              <div style={{ margin: "6px 0" }}>
                <SkeletonBlock w="65px" h="22px" r="6px" />
              </div>
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                <SkeletonBlock w="85px" h="11px" r="4px" />
                <SkeletonBlock w="50px" h="9px" r="3px" />
              </div>
            </div>
          ))}
      </div>
      <style>{`
        .gf-admin-stats-skeleton-grid {
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 14px;
        }
        .gf-admin-stats-skel-card {
          padding: 18px 20px;
        }
        @media (max-width: 768px) {
          .gf-admin-stats-skeleton-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .gf-admin-stats-skel-card {
            padding: 12px 11px !important;
          }
        }
      `}</style>
    </>
  );
}

/** ─── 14. Admin Feedback Skeleton ─────────────────────────────── */
export function AdminFeedbackSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 14,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 16,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SkeletonBlock w="36px" h="36px" r="50%" />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <SkeletonBlock w="110px" h="14px" r="4px" />
                  <SkeletonBlock w="70px" h="10px" r="3px" />
                </div>
              </div>
              <SkeletonBlock w="30px" h="30px" r="8px" />
            </div>

            <div style={{ display: "flex", gap: 3 }}>
              {Array(5)
                .fill(0)
                .map((_, j) => (
                  <SkeletonBlock key={j} w="14px" h="14px" r="3px" />
                ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <SkeletonBlock w="100%" h="12px" r="3px" />
              <SkeletonBlock w="85%" h="12px" r="3px" />
            </div>
          </div>
        ))}
    </div>
  );
}

/** ─── 15. Testimonials Page Skeleton ──────────────────────────── */
export function TestimonialsSkeleton({ isFullPage = false }) {
  const content = (
    <>
      {isFullPage && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 20,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            boxSizing: "border-box",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <SkeletonBlock w="130px" h="24px" r="999px" />
              <SkeletonBlock w="240px" h="28px" r="8px" />
              <SkeletonBlock w="320px" h="14px" r="4px" />
            </div>
            <SkeletonBlock w="140px" h="44px" r="12px" />
          </div>

          {/* Category Filter Pills Bar */}
          <div style={{ display: "flex", gap: 8, overflowX: "hidden" }}>
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <SkeletonBlock key={i} w="110px" h="36px" r="999px" style={{ flexShrink: 0 }} />
              ))}
          </div>
        </div>
      )}

      {/* Reviews Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 16,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              {/* Header: Avatar + Name + Rating */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <SkeletonBlock w="36px" h="36px" r="50%" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <SkeletonBlock w="110px" h="14px" r="4px" />
                    <SkeletonBlock w="80px" h="10px" r="3px" />
                  </div>
                </div>
                <SkeletonBlock w="70px" h="14px" r="4px" />
              </div>

              {/* Comment Lines */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "4px 0" }}>
                <SkeletonBlock w="100%" h="12px" r="3px" />
                <SkeletonBlock w="92%" h="12px" r="3px" />
                <SkeletonBlock w="65%" h="12px" r="3px" />
              </div>

              {/* Footer Pills */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6 }}>
                <SkeletonBlock w="90px" h="22px" r="6px" />
                <SkeletonBlock w="60px" h="22px" r="6px" />
              </div>
            </div>
          ))}
      </div>
    </>
  );

  if (isFullPage) {
    return (
      <div
        className="gf-skeleton-page-bg"
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
        aria-label="Loading testimonials"
        aria-busy="true"
      >
        <div
          className="gf-testimonials-skeleton-wrap"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "32px 20px 80px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            boxSizing: "border-box",
            width: "100%",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 14,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {content}
    </div>
  );
}

/** ─── 16. Attendance Tracker Skeleton (High-Fidelity Responsive Layout) */
export function AttendanceSkeleton() {
  return (
    <div
      className="gf-skeleton-page-bg"
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
      aria-label="Loading attendance tracker"
      aria-busy="true"
    >
      <div className="gf-attendance-skeleton-wrap">
        {/* ── Desktop Left Sidebar Skeleton ── */}
        <aside className="gf-attendance-skeleton-sidebar">
          {/* 1. Student Profile Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 2 }}>
            <SkeletonBlock w="40px" h="40px" r="10px" />
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
              <SkeletonBlock w="75%" h="15px" r="4px" />
              <SkeletonBlock w="50%" h="11px" r="4px" />
            </div>
            <SkeletonBlock w="52px" h="20px" r="6px" />
          </div>

          {/* 2. Enrolled Section Info Pill */}
          <SkeletonBlock w="100%" h="44px" r="8px" />

          {/* 3. Semester Score Box with progress line */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "11px 13px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SkeletonBlock w="85px" h="10px" r="4px" />
              <SkeletonBlock w="48px" h="17px" r="5px" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <SkeletonBlock w="75px" h="24px" r="5px" />
              <SkeletonBlock w="65px" h="11px" r="4px" />
            </div>
            <SkeletonBlock w="100%" h="5px" r="999px" />
          </div>

          <div style={{ height: 1, background: "#f1f5f9", margin: "2px 0" }} />

          {/* 4. Views Navigation Menu (5 Items matching actual tabs) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ paddingLeft: 4, marginBottom: 2 }}>
              <SkeletonBlock w="45px" h="9px" r="3px" />
            </div>

            {/* Active Subject Matrix Tab */}
            <div
              style={{
                width: "100%",
                height: 35,
                borderRadius: 8,
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 10px",
                boxSizing: "border-box",
              }}
            >
              <SkeletonBlock w="16px" h="16px" r="4px" />
              <SkeletonBlock w="115px" h="13px" r="4px" style={{ flex: 1 }} />
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#0f172a", opacity: 0.3 }} />
            </div>

            {/* Other 4 Nav Items */}
            {[
              { w: "130px" },
              { w: "140px" },
              { w: "145px" },
              { w: "115px" },
            ].map((nav, idx) => (
              <div
                key={idx}
                style={{
                  width: "100%",
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "0 10px",
                  boxSizing: "border-box",
                }}
              >
                <SkeletonBlock w="15px" h="15px" r="4px" />
                <SkeletonBlock w={nav.w} h="12px" r="4px" />
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: "#f1f5f9", margin: "2px 0" }} />

          {/* 5. Tools Menu (Auto-Import & Recalculate) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ paddingLeft: 4, marginBottom: 2 }}>
              <SkeletonBlock w="40px" h="9px" r="3px" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 10px", height: 32 }}>
              <SkeletonBlock w="15px" h="15px" r="4px" />
              <SkeletonBlock w="120px" h="12px" r="4px" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 10px", height: 32 }}>
              <SkeletonBlock w="15px" h="15px" r="4px" />
              <SkeletonBlock w="95px" h="12px" r="4px" />
            </div>
          </div>
        </aside>

        {/* ── Main Workspace Area Skeleton ── */}
        <main className="gf-attendance-skeleton-main">
          {/* Mobile Top Auto-Import Screenshot CTA Card (Mobile Only) */}
          <div className="gf-attendance-skeleton-mobile-cta">
            <div
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                borderRadius: 12,
                padding: "11px 13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                boxSizing: "border-box",
                border: "1px solid #334155",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "rgba(255, 255, 255, 0.15)",
                    flexShrink: 0,
                  }}
                />
                <SkeletonBlock w="140px" h="13px" r="4px" style={{ background: "rgba(255, 255, 255, 0.25)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 65,
                    height: 19,
                    borderRadius: 5,
                    background: "rgba(255, 255, 255, 0.15)",
                  }}
                />
                <div style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(255, 255, 255, 0.2)" }} />
              </div>
            </div>
          </div>

          {/* Modern Mobile Sub-Nav Module Switcher (Mobile Only) */}
          <div className="gf-attendance-skeleton-mobile-nav">
            <div
              style={{
                display: "flex",
                gap: 6,
                overflowX: "hidden",
                width: "100%",
                paddingBottom: 2,
              }}
            >
              <div
                style={{
                  width: 125,
                  height: 34,
                  borderRadius: 999,
                  background: "#059669",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 12px",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ width: 70, height: 11, borderRadius: 4, background: "rgba(255, 255, 255, 0.5)" }} />
              </div>
              <SkeletonBlock w="115px" h="34px" r="999px" style={{ flexShrink: 0, background: "#ffffff", border: "1px solid #e2e8f0" }} />
              <SkeletonBlock w="105px" h="34px" r="999px" style={{ flexShrink: 0, background: "#ffffff", border: "1px solid #e2e8f0" }} />
              <SkeletonBlock w="135px" h="34px" r="999px" style={{ flexShrink: 0, background: "#ffffff", border: "1px solid #e2e8f0" }} />
            </div>
          </div>

          {/* Academic Overview Header Card */}
          <div className="gf-attendance-skeleton-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              {/* Title & Section Tag */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <SkeletonBlock w="200px" h="21px" r="5px" />
                <SkeletonBlock w="130px" h="13px" r="4px" />
              </div>

              {/* Desktop Header Controls: Target Switcher + Auto-Import CTA */}
              <div className="gf-attendance-skeleton-desktop-header-right">
                <SkeletonBlock w="235px" h="36px" r="10px" />
                <SkeletonBlock w="185px" h="36px" r="9px" style={{ background: "#0f172a" }} />
              </div>
            </div>

            {/* Mobile Header Controls: Full-width Target Switcher */}
            <div className="gf-attendance-skeleton-mobile-header-target" style={{ marginTop: 10 }}>
              <SkeletonBlock w="100%" h="36px" r="10px" />
            </div>
          </div>

          {/* 4 Hero KPI Stat Cards */}
          <div className="gf-attendance-skeleton-hero-grid">
            {[
              { numW: "85px", subW: "75%" },
              { numW: "110px", subW: "65%" },
              { numW: "75px", subW: "80%" },
              { numW: "95px", subW: "70%" },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="gf-attendance-skeleton-card"
                style={{
                  padding: "14px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <SkeletonBlock w="80px" h="11px" r="4px" />
                  <SkeletonBlock w="42px" h="15px" r="4px" />
                </div>
                <SkeletonBlock w={kpi.numW} h="24px" r="5px" />
                <SkeletonBlock w={kpi.subW} h="11px" r="4px" />
                <SkeletonBlock w="100%" h="5px" r="999px" />
              </div>
            ))}
          </div>

          {/* Check-In / Today's Routine Section */}
          <div className="gf-attendance-skeleton-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <SkeletonBlock w="32px" h="32px" r="8px" />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <SkeletonBlock w="160px" h="16px" r="4px" />
                  <SkeletonBlock w="110px" h="11px" r="4px" />
                </div>
              </div>

              {/* Date Navigation Toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <SkeletonBlock w="28px" h="28px" r="6px" />
                <SkeletonBlock w="115px" h="28px" r="6px" />
                <SkeletonBlock w="28px" h="28px" r="6px" />
                <SkeletonBlock w="100px" h="28px" r="6px" />
              </div>
            </div>

            {/* Routine Period Cards */}
            <div className="gf-attendance-skeleton-routine-grid">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "12px 13px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <SkeletonBlock w="100px" h="11px" r="4px" />
                      <SkeletonBlock w="48px" h="16px" r="4px" />
                    </div>
                    <SkeletonBlock w="70%" h="15px" r="4px" />
                    <SkeletonBlock w="45%" h="11px" r="4px" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 4 }}>
                      <SkeletonBlock h="30px" r="6px" />
                      <SkeletonBlock h="30px" r="6px" />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Subject-Wise Attendance Matrix */}
          <div className="gf-attendance-skeleton-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <SkeletonBlock w="30px" h="30px" r="8px" style={{ background: "#0f172a" }} />
                <SkeletonBlock w="190px" h="17px" r="4px" />
                <SkeletonBlock w="55px" h="18px" r="6px" />
              </div>
              <SkeletonBlock w="130px" h="28px" r="6px" />
            </div>

            {/* Subject Cards Grid */}
            <div className="gf-attendance-skeleton-matrix-grid">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                        <SkeletonBlock w="75px" h="16px" r="5px" />
                        <SkeletonBlock w="85%" h="15px" r="4px" />
                        <SkeletonBlock w="45%" h="11px" r="4px" />
                      </div>
                      <SkeletonBlock w="60px" h="24px" r="6px" />
                    </div>

                    <SkeletonBlock w="100%" h="6px" r="999px" />

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <SkeletonBlock w="65px" h="20px" r="5px" />
                      <SkeletonBlock w="65px" h="20px" r="5px" />
                      <SkeletonBlock w="65px" h="20px" r="5px" />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4, borderTop: "1px solid #f1f5f9" }}>
                      <SkeletonBlock w="85px" h="12px" r="4px" />
                      <SkeletonBlock w="100px" h="26px" r="6px" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/** ─── 17. Timetable Page Skeleton (100% Content Match) ────────── */
export function TimetableSkeleton() {
  return (
    <div
      className="gf-skeleton-page-bg"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
      aria-label="Loading timetable"
      aria-busy="true"
    >
      <div
        className="gf-timetable-skeleton-wrap"
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "24px 24px 90px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
          boxSizing: "border-box",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
      {/* Top Header Card Skeleton */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 20,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <SkeletonBlock w="52px" h="52px" r="14px" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <SkeletonBlock w="200px" h="22px" r="6px" />
              <SkeletonBlock w="130px" h="14px" r="4px" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, overflow: "hidden" }}>
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <SkeletonBlock key={i} w="90px" h="38px" r="10px" />
              ))}
          </div>
        </div>

        {/* Section Pills */}
        <div style={{ display: "flex", gap: 8, overflow: "hidden", marginTop: 4 }}>
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <SkeletonBlock key={i} w="75px" h="34px" r="8px" style={{ flexShrink: 0 }} />
            ))}
        </div>
      </div>

      {/* Day Selector Pills */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} h="64px" r="12px" />
          ))}
      </div>

      {/* Routine Schedule Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                <SkeletonBlock w="36px" h="36px" r="8px" style={{ flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
                  <SkeletonBlock w="50%" h="16px" r="4px" />
                  <SkeletonBlock w="35%" h="12px" r="4px" />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <SkeletonBlock w="110px" h="28px" r="6px" />
                <SkeletonBlock w="60px" h="24px" r="6px" />
              </div>
            </div>
          ))}
      </div>
      </div>
    </div>
  );
}

/** ─── 18. Spinner ────────────────────────────────────────────── */
export function Spinner({ size = 32 }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "30px 0" }}>
      <div
        style={{
          width: size,
          height: size,
          border: `3px solid var(--border)`,
          borderTopColor: "#2563eb",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
