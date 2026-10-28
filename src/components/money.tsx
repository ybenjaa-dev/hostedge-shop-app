import { formatMoney } from "@/lib/money";

/** Price with direction-safe rendering (LTR number inside RTL text). */
export function Money({ amount, currency, lang, className }: { amount: number; currency: string; lang: string; className?: string }) {
  return (
    <bdi dir="ltr" className={`num ${className ?? ""}`}>
      {formatMoney(amount, currency, lang)}
    </bdi>
  );
}
