export default function PerformanceLoading() {
  return (
    <div aria-busy aria-label="Loading team performance" className="space-y-5">
      <div className="skeleton h-9 w-64" />
      <div className="skeleton h-16" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>
      <div className="grid gap-5 lg:grid-cols-2"><div className="skeleton h-72" /><div className="skeleton h-72" /></div>
      <div className="skeleton h-64" />
    </div>
  );
}
