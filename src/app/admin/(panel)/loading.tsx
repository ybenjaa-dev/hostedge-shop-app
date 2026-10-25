export default function AdminLoading() {
  return (
    <div aria-busy aria-label="Loading">
      <div className="skeleton mb-6 h-9 w-56" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)}</div>
      <div className="skeleton mt-5 h-72" />
    </div>
  );
}
