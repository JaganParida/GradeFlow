export function SkeletonBlock({ w = "100%", h = 20, r = "8px", style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  );
}

export function SkeletonCard({ h = 100 }) {
  return <SkeletonBlock h={h} r="var(--radius)" />;
}

export function SkeletonGrid({ count = 4, h = 100 }) {
  return (
    <div className="grid-4">
      {Array(count).fill(0).map((_, i) => (
        <SkeletonCard key={i} h={h} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <SkeletonBlock w="120px" h="16px" style={{ marginBottom: '8px' }} />
          <SkeletonBlock w="240px" h="32px" style={{ marginBottom: '8px' }} />
          <SkeletonBlock w="180px" h="16px" />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <SkeletonBlock w="140px" h="40px" r="6px" />
          <SkeletonBlock w="100px" h="40px" r="6px" />
          <SkeletonBlock w="160px" h="40px" r="6px" />
        </div>
      </div>
      <SkeletonGrid count={4} h={110} />
      <SkeletonBlock w="100%" h="160px" r="var(--radius)" />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {Array(4).fill(0).map((_, i) => (
          <SkeletonBlock key={i} w="120px" h="36px" r="20px" />
        ))}
      </div>
      <ReportCardSkeleton />
    </div>
  );
}

export function ReportCardSkeleton() {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <SkeletonBlock w="150px" h="24px" />
        <SkeletonBlock w="100px" h="36px" r="6px" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonBlock w="100%" h="40px" r="4px" />
        {Array(6).fill(0).map((_, i) => (
          <SkeletonBlock key={i} w="100%" h="60px" r="4px" />
        ))}
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <SkeletonBlock w="140px" h="16px" style={{ marginBottom: '8px' }} />
          <SkeletonBlock w="280px" h="32px" />
        </div>
        <SkeletonBlock w="120px" h="40px" r="6px" />
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        {Array(3).fill(0).map((_, i) => (
          <SkeletonBlock key={i} w="100px" h="36px" r="20px" />
        ))}
      </div>
      <SkeletonGrid count={4} h={110} />
      <div className="grid-2">
        <SkeletonBlock w="100%" h="300px" r="var(--radius)" />
        <SkeletonBlock w="100%" h="300px" r="var(--radius)" />
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <SkeletonBlock w="200px" h="36px" />
        <SkeletonBlock w="300px" h="16px" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <SkeletonBlock w="200px" h="40px" r="8px" />
        <SkeletonBlock w="200px" h="40px" r="8px" />
        <SkeletonBlock w="140px" h="40px" r="8px" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        {Array(10).fill(0).map((_, i) => (
          <SkeletonBlock key={i} w="100%" h="64px" r="8px" />
        ))}
      </div>
    </div>
  );
}

export function Spinner({ size = 32 }) {
  // Keeping this just in case Admin sections still use it
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <div
        style={{ width: size, height: size, border: `3px solid var(--border)`, borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
