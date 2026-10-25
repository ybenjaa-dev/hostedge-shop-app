import { getOrderFull } from "@/features/orders/queries";
import { getSettings } from "@/lib/settings";
import { OrderDocument } from "@/features/orders/components/document";
import { PrintButton } from "@/features/orders/components/print-button";

export const metadata = { title: "Print" };

export default async function BulkPrint({ searchParams }: { searchParams: Promise<{ ids?: string; type?: string }> }) {
  const sp = await searchParams;
  const ids = (sp.ids ?? "").split(",").filter(Boolean).slice(0, 100);
  const s = await getSettings();
  const docs = (await Promise.all(ids.map((i) => getOrderFull(i)))).filter(Boolean);
  return (<><PrintButton />{docs.map((d) => <OrderDocument key={d!.o.id as string} o={d!.o} items={d!.items} s={s} kind={sp.type === "invoice" ? "invoice" : "slip"} />)}</>);
}
