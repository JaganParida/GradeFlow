export function SkeletonBlock({ w = "100%", h = 20, r = "8px", style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width: w,
        height: h,
        borderRadius: r,
        boxSizing: "border-box",
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ h = 100, r = "14px" }) {
  return <SkeletonBlock h={h} r={r} />;
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

/* ─── Dashboard Full-Page Skeleton (100% Pixel Match to Dashboard Page Layout) ─── */
export function DashboardSkeleton() {
  return (
    <div className="gf-dashboard-skeleton-wrap">
      {/* ── Left / Mobile-Top Profile Card Skeleton ── */}
      <div className="gf-dashboard-skeleton-sidebar">
        {/* Student Avatar + Name + Reg No */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SkeletonBlock w="40px" h="40px" r="12px" />
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
          <SkeletonBlock w="70px" h="12px" r="4px" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <SkeletonBlock key={i} h="34px" r="8px" />
              ))}
          </div>
        </div>

        {/* Tools Action Row (3 Buttons) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <SkeletonBlock w="50px" h="12px" r="4px" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            <SkeletonBlock h="50px" r="8px" />
            <SkeletonBlock h="50px" r="8px" />
            <SkeletonBlock h="50px" r="8px" />
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
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
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
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
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
            padding: "16px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonBlock w="180px" h="20px" r="6px" />
            <SkeletonBlock w="90px" h="30px" r="8px" />
          </div>

          {/* Table Header Bar */}
          <SkeletonBlock w="100%" h="38px" r="8px" />

          {/* 6 Subject Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <SkeletonBlock key={i} w="100%" h="44px" r="8px" />
              ))}
          </div>
        </div>
      </div>

      <style>{`
        .gf-dashboard-skeleton-wrap {
          max-width: 1440px;
          margin: 0 auto;
          padding: 24px 32px;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
          box-sizing: border-box;
          width: 100%;
        }
        .gf-dashboard-skeleton-sidebar {
          background: "#ffffff";
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-sizing: border-box;
          width: 100%;
        }
        .gf-dashboard-skeleton-main {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .gf-dashboard-skeleton-wrap {
            padding: 12px 10px !important;
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .gf-dashboard-skeleton-sidebar {
            padding: 14px 14px !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Grade Report Card Skeleton ──────────────────────────────── */
export function ReportCardSkeleton() {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 20,
        padding: 20,
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

/* ─── Internal Assessment Marks Skeleton ─────────────────────── */
export function InternalMarksSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: "100%",
        padding: "12px 0",
        boxSizing: "border-box",
      }}
    >
      {/* Search & Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <SkeletonBlock w="240px" h="38px" r="10px" />
        <SkeletonBlock w="100px" h="38px" r="10px" />
      </div>

      {/* Table Header Row */}
      <SkeletonBlock w="100%" h="40px" r="8px" />

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

/* ─── Analytics Page Skeleton ─────────────────────────────────── */
export function AnalyticsSkeleton() {
  return (
    <div
      style={{
        maxWidth: 1320,
        margin: "0 auto",
        padding: "24px 16px 60px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Top Banner Skeleton */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          padding: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SkeletonBlock w="140px" h="14px" r="4px" />
          <SkeletonBlock w="240px" h="28px" r="6px" />
        </div>
        <SkeletonBlock w="140px" h="40px" r="10px" />
      </div>

      {/* Tab Pills */}
      <div style={{ display: "flex", gap: 10 }}>
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} w="120px" h="38px" r="10px" />
          ))}
      </div>

      {/* 4 Metric Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <SkeletonCard key={i} h={110} r="16px" />
          ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18 }}>
        <SkeletonBlock h="320px" r="20px" />
        <SkeletonBlock h="320px" r="20px" />
      </div>
    </div>
  );
}

/* ─── Leaderboard Page Skeleton ───────────────────────────────── */
export function LeaderboardSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Podium Top 3 Cards Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} h="140px" r="16px" />
          ))}
      </div>

      {/* Leaderboard Table Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} w="100%" h="58px" r="12px" />
          ))}
      </div>
    </div>
  );
}

/* ─── Admin Section Toppers Skeleton ─────────────────────────── */
export function SectionToppersSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", boxSizing: "border-box" }}>
      {/* Top 3 Highlights Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
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

      {/* Table Rows Skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} w="100%" h="52px" r="10px" />
          ))}
      </div>
    </div>
  );
}

/* ─── Admin Backlog Tracker Skeleton ─────────────────────────── */
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
                border: "1px solid #e2e8f0",
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

      {/* Backlog List Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} w="100%" h="60px" r="10px" />
          ))}
      </div>
    </div>
  );
}

/* ─── Admin Dashboard Stats Cards Skeleton ───────────────────── */
export function AdminStatsSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, width: "100%", boxSizing: "border-box" }}>
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
            }}
          >
            <SkeletonBlock w="44px" h="44px" r="12px" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <SkeletonBlock w="110px" h="11px" r="4px" />
              <SkeletonBlock w="70px" h="24px" r="6px" />
            </div>
          </div>
        ))}
    </div>
  );
}

/* ─── Admin Feedback Skeleton ────────────────────────────────── */
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
              border: "1px solid #e2e8f0",
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

/* ─── Testimonials Page Skeleton ──────────────────────────────── */
export function TestimonialsSkeleton() {
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
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            {/* Header: Avatar + Name + Stars */}
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
  );
}

/* ─── Attendance Tracker Page Skeleton (100% Content & Layout Match) ─── */
export function AttendanceSkeleton() {
  return (
    <div className="gf-attendance-skeleton-wrap">
      {/* ── Left / Mobile-Hidden Sidebar Skeleton ── */}
      <div className="gf-attendance-skeleton-sidebar">
        {/* Student Profile Info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SkeletonBlock w="42px" h="42px" r="10px" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <SkeletonBlock w="70%" h="16px" r="4px" />
            <SkeletonBlock w="45%" h="12px" r="4px" />
          </div>
        </div>

        {/* Enrolled Section Card */}
        <SkeletonBlock w="100%" h="48px" r="8px" />

        {/* Semester Score Box */}
        <SkeletonBlock w="100%" h="68px" r="8px" />

        {/* 4-Tab Vertical Switcher */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SkeletonBlock w="100%" h="42px" r="8px" />
          <SkeletonBlock w="100%" h="42px" r="8px" />
          <SkeletonBlock w="100%" h="42px" r="8px" />
          <SkeletonBlock w="100%" h="42px" r="8px" />
        </div>

        {/* Quick Reset Action */}
        <SkeletonBlock w="100%" h="36px" r="8px" />
      </div>

      {/* ── Right / Main Workspace Area Skeleton ── */}
      <div className="gf-attendance-skeleton-main">
        {/* Mobile Top Bar (Mobile Only) */}
        <div className="gf-attendance-skeleton-mobile-top">
          <SkeletonBlock w="100%" h="40px" r="8px" />
          <SkeletonBlock w="100%" h="40px" r="8px" />
        </div>

        {/* Academic Overview Header Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SkeletonBlock w="38px" h="38px" r="10px" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <SkeletonBlock w="180px" h="18px" r="4px" />
              <SkeletonBlock w="120px" h="12px" r="4px" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SkeletonBlock w="90px" h="28px" r="8px" />
            <SkeletonBlock w="110px" h="28px" r="8px" />
          </div>
        </div>

        {/* 4 Hero KPI Stat Cards (2x2 Grid on Mobile, 4-col on Desktop) */}
        <div className="gf-attendance-skeleton-hero-grid">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <SkeletonBlock w="90px" h="12px" r="4px" />
                  <SkeletonBlock w="45px" h="18px" r="6px" />
                </div>
                <SkeletonBlock w="80px" h="26px" r="6px" />
                <SkeletonBlock w="100%" h="8px" r="4px" />
              </div>
            ))}
        </div>

        {/* Check-In Hub Card Skeleton */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Header Toolbar with Stepper */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SkeletonBlock w="36px" h="36px" r="8px" />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <SkeletonBlock w="160px" h="16px" r="4px" />
                <SkeletonBlock w="120px" h="12px" r="4px" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <SkeletonBlock w="70px" h="30px" r="8px" />
              <SkeletonBlock w="110px" h="30px" r="8px" />
              <SkeletonBlock w="70px" h="30px" r="8px" />
            </div>
          </div>

          {/* 3 Period Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <SkeletonBlock w="110px" h="12px" r="4px" />
                    <SkeletonBlock w="40px" h="18px" r="4px" />
                  </div>
                  <SkeletonBlock w="150px" h="15px" r="4px" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <SkeletonBlock h="32px" r="6px" />
                    <SkeletonBlock h="32px" r="6px" />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Subjects Matrix Skeleton */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <SkeletonBlock w="240px" h="18px" r="4px" />
            <SkeletonBlock w="140px" h="30px" r="8px" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                      <SkeletonBlock w="70%" h="16px" r="4px" />
                      <SkeletonBlock w="40%" h="12px" r="4px" />
                    </div>
                    <SkeletonBlock w="50px" h="24px" r="6px" />
                  </div>
                  <SkeletonBlock w="100%" h="6px" r="999px" />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <SkeletonBlock w="80px" h="20px" r="6px" />
                    <SkeletonBlock w="110px" h="20px" r="6px" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <style>{`
        .gf-attendance-skeleton-wrap {
          max-width: 1440px;
          margin: 0 auto;
          padding: 24px 32px 90px 32px;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
          box-sizing: border-box;
          width: 100%;
        }
        .gf-attendance-skeleton-sidebar {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-sizing: border-box;
          width: 100%;
        }
        .gf-attendance-skeleton-main {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }
        .gf-attendance-skeleton-mobile-top {
          display: none;
        }
        .gf-attendance-skeleton-hero-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        @media (max-width: 768px) {
          .gf-attendance-skeleton-wrap {
            padding: 8px 8px 80px 8px !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .gf-attendance-skeleton-sidebar {
            display: none !important;
          }
          .gf-attendance-skeleton-mobile-top {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .gf-attendance-skeleton-hero-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Timetable Page Skeleton ─────────────────────────────────── */
export function TimetableSkeleton() {
  return (
    <div
      style={{
        maxWidth: 1320,
        margin: "0 auto",
        padding: "24px 16px 60px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Top Header Card Skeleton */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
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

      {/* Routine Cards Skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} h="80px" r="14px" />
          ))}
      </div>
    </div>
  );
}

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
