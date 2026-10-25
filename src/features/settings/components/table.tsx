import type { ReactNode } from "react";

/** Responsive table wrapper: scrolls horizontally inside the card on small screens. */
export function DataTable({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[34rem] text-start text-sm">
        <thead><tr className="border-b border-line bg-sunken/60 text-xs uppercase tracking-wider text-muted">{head.map((h, i) => <th key={i} scope="col" className="px-4 py-3 text-start font-bold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}
export const Td = ({ children, className = "" }: { children?: ReactNode; className?: string }) => <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
