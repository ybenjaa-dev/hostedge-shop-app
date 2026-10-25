import type { ReactNode } from "react";

export type TableHead = ReactNode | { label: ReactNode; end?: boolean; center?: boolean; narrow?: boolean; className?: string };
const isCfg = (h: TableHead): h is { label: ReactNode; end?: boolean; center?: boolean; narrow?: boolean; className?: string } => !!h && typeof h === "object" && "label" in (h as object) && !("props" in (h as object));

/**
 * The one table every admin page uses: a card that clips its corners, scrolls sideways *inside* itself on narrow screens
 * (the page never does) and shares header / row / hover styling (`.dt` in globals.css).
 */
export function DataTable({ head, children, empty, minWidth = "36rem", caption }: { head: TableHead[]; children: ReactNode; empty?: ReactNode; minWidth?: string; caption?: string }) {
  return (
    <div className="dt-card">
      <div className="dt-scroll">
        <table className="dt" style={{ minWidth }}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead><tr>{head.map((h, i) => {
            const c = isCfg(h) ? h : { label: h };
            return <th key={i} scope="col" className={[c.end && "is-end", c.center && "is-center", c.narrow && "is-narrow", "className" in c ? c.className : ""].filter(Boolean).join(" ")}>{c.label}</th>;
          })}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {empty}
    </div>
  );
}
export const Td = ({ children, className = "", end, colSpan }: { children?: ReactNode; className?: string; end?: boolean; colSpan?: number }) => <td colSpan={colSpan} className={`${end ? "is-end" : ""} ${className}`.trim() || undefined}>{children}</td>;
