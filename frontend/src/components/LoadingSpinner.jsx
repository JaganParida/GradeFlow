export function Spinner({ size = 32 }) {
  return (
    <div
      style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: `3px solid var(--border)`,
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function SkeletonCard({ h = 100 }) {
  return (
    <div
      className="skeleton"
      style={{ height: h, borderRadius: "var(--radius)" }}
    />
  );
}

export function SkeletonGrid({ count = 4, h = 100 }) {
  return (
    <div className="grid-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <SkeletonCard key={i} h={h} />
        ))}
    </div>
  );
}
