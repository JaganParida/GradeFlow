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

/* ─── Dashboard Full-Page Skeleton ─────────────────────────────── */
export function DashboardSkeleton() {
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
      {/* Top Banner Card Skeleton */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <SkeletonBlock w="54px" h="54px" r="16px" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <SkeletonBlock w="180px" h="22px" r="6px" />
              <SkeletonBlock w="120px" h="14px" r="4px" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <SkeletonBlock w="110px" h="38px" r="10px" />
            <SkeletonBlock w="100px" h="38px" r="10px" />
          </div>
        </div>

        {/* 4 Metadata Badges */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 4 }}>
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <SkeletonBlock key={i} h="44px" r="10px" />
            ))}
        </div>
      </div>

      {/* GPA & Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        {Array(4)
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
                gap: 10,
              }}
            >
              <SkeletonBlock w="90px" h="14px" r="4px" />
              <SkeletonBlock w="130px" h="32px" r="8px" />
              <SkeletonBlock w="70%" h="12px" r="4px" />
            </div>
          ))}
      </div>

      {/* Semester Tab Switcher */}
      <div style={{ display: "flex", gap: 8, overflowX: "hidden", paddingBottom: 4 }}>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} w="100px" h="38px" r="10px" />
          ))}
      </div>

      {/* Grade Report Card Skeleton */}
      <ReportCardSkeleton />
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

/* ─── Attendance Tracker Page Skeleton ────────────────────────── */
export function AttendanceSkeleton() {
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
              <SkeletonBlock w="220px" h="22px" r="6px" />
              <SkeletonBlock w="140px" h="14px" r="4px" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <SkeletonBlock w="150px" h="40px" r="10px" />
            <SkeletonBlock w="110px" h="40px" r="10px" />
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Metric Cards Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SkeletonBlock w="100px" h="14px" r="4px" />
                <SkeletonBlock w="28px" h="28px" r="8px" />
              </div>
              <SkeletonBlock w="120px" h="32px" r="6px" />
              <SkeletonBlock w="100%" h="12px" r="4px" />
            </div>
          ))}
      </div>

      {/* Today's Class Check-in Skeleton */}
      <div
        style={{
          background: "#ffffff",
          border: "1.5px solid #e2e8f0",
          borderRadius: 18,
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SkeletonBlock w="200px" h="20px" r="6px" />
          <SkeletonBlock w="120px" h="24px" r="6px" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <SkeletonBlock key={i} h="76px" r="12px" />
            ))}
        </div>
      </div>

      {/* Navigation Tab Switcher Skeleton */}
      <div style={{ display: "flex", gap: 10 }}>
        <SkeletonBlock w="180px" h="44px" r="12px" />
        <SkeletonBlock w="180px" h="44px" r="12px" />
      </div>

      {/* Horizontal Subject Pills Skeleton */}
      <div style={{ display: "flex", gap: 8, overflow: "hidden" }}>
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <SkeletonBlock key={i} w="150px" h="42px" r="10px" style={{ flexShrink: 0 }} />
          ))}
      </div>

      {/* Subject Studio & Simulator Grid Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <SkeletonBlock h="360px" r="18px" />
        <SkeletonBlock h="360px" r="18px" />
      </div>
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
