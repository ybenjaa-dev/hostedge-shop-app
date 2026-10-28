import { notFound } from "next/navigation";
import { getOrderFull } from "@/features/orders/queries";
import { getSettings } from "@/lib/settings";
import { OrderDocument } from "@/features/orders/components/document";
import { PrintButton } from "@/features/orders/components/print-button";

export const metadata = { title: "Print" };

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const d = await getOrderFull(id);
  if (!d) notFound();
  return (<><PrintButton /><OrderDocument o={d.o} items={d.items} s={await getSettings()} kind={sp.type === "slip" ? "slip" : "invoice"} /></>);
}
