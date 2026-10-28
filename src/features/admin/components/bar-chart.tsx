/** Dependency-free SVG column chart (server-rendered, theme-aware, with an accessible summary). */
export function BarChart({ data, label, format }: { data: { label: string; value: number }[]; label: string; format: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 640, h = 180, pad = 24;
  const bw = (w - pad * 2) / Math.max(1, data.length);
  const total = data.reduce((a, d) => a + d.value, 0);
  const step = Math.ceil(data.length / 8);
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h + 24}`} role="img" aria-label={`${label}: total ${format(total)}`} className="w-full">
        {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={pad} x2={w - pad} y1={h - f * (h - 10)} y2={h - f * (h - 10)} stroke="var(--line)" strokeDasharray="3 4" />)}
        {data.map((d, i) => {
          const bh = (d.value / max) * (h - 10);
          return (
            <g key={d.label}>
              <rect x={pad + i * bw + bw * 0.15} y={h - bh} width={bw * 0.7} height={Math.max(bh, d.value ? 2 : 0)} rx={Math.min(4, bw * 0.2)} fill="var(--brand)" opacity={d.value ? 1 : 0.25}><title>{`${d.label}: ${format(d.value)}`}</title></rect>
              {i % step === 0 && <text x={pad + i * bw + bw / 2} y={h + 16} textAnchor="middle" fontSize="10" fill="var(--muted)">{d.label.slice(5)}</text>}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
