"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCircle2, XCircle, Globe2 } from "lucide-react";
import { CARS, fitsCar } from "@/lib/fitment";

const KEY = "mycar";
type Car = { make: string; model: string };

function load(): Car {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as Car | null;
    if (v && CARS[v.make]) return { make: v.make, model: CARS[v.make]!.includes(v.model) ? v.model : "" };
  } catch {}
  return { make: "", model: "" };
}
function save(c: Car) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} }

function useCar() {
  const [car, setCar] = useState<Car>({ make: "", model: "" });
  useEffect(() => { setCar(load()); }, []);
  return [car, (c: Car) => { setCar(c); save(c); }] as const;
}

function Selects({ car, set, makeLabel, modelLabel, allLabel, dark }: { car: Car; set: (c: Car) => void; makeLabel: string; modelLabel: string; allLabel: string; dark?: boolean }) {
  const cls = `field !min-h-12 w-full ${dark ? "!border-white/25 !bg-white/10 !text-white" : ""}`;
  return (
    <>
      <label className="block"><span className="sr-only">{makeLabel}</span>
        <select aria-label={makeLabel} className={cls} value={car.make} onChange={(e) => set({ make: e.target.value, model: "" })}>
          <option value="" className="text-black">{makeLabel}</option>
          {Object.keys(CARS).map((m) => <option key={m} value={m} className="text-black">{m}</option>)}
        </select></label>
      <label className="block"><span className="sr-only">{modelLabel}</span>
        <select aria-label={modelLabel} className={cls} value={car.model} disabled={!car.make} onChange={(e) => set({ ...car, model: e.target.value })}>
          <option value="" className="text-black">{car.make ? allLabel : modelLabel}</option>
          {(CARS[car.make] ?? []).map((m) => <option key={m} value={m} className="text-black">{m}</option>)}
        </select></label>
    </>
  );
}

/** Home-page finder: pick make and model, remember them on this device and open a search for that car. */
export function CarFinder({ labels }: { labels: { make: string; model: string; all: string; go: string } }) {
  const router = useRouter();
  const [car, setCar] = useCar();
  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); if (!car.make) return; save(car); router.push(`/shop?q=${encodeURIComponent(`${car.make} ${car.model}`.trim())}`); }}>
      <Selects car={car} set={setCar} makeLabel={labels.make} modelLabel={labels.model} allLabel={labels.all} dark />
      <button type="submit" disabled={!car.make} className="btn btn-primary btn-lg"><Search className="size-5" />{labels.go}</button>
    </form>
  );
}

/** Product-page checker: compares the chosen car with the product's compatibility text. */
export function FitCheck({ text, labels }: { text: string; labels: { title: string; make: string; model: string; all: string; pick: string; yes: string; no: string; universal: string; saved: string } }) {
  const [car, setCar] = useCar();
  const fit = car.make ? fitsCar(text, car.make, car.model) : "unknown";
  const name = `${car.make} ${car.model}`.trim();
  const state = fit === "universal" ? { Icon: Globe2, msg: labels.universal, tone: "text-ok" } : fit === "yes" ? { Icon: CheckCircle2, msg: labels.yes.replace("{car}", name), tone: "text-ok" } : fit === "no" ? { Icon: XCircle, msg: labels.no.replace("{car}", name), tone: "text-danger" } : null;
  return (
    <div className="rounded-2xl border border-line bg-sunken p-4">
      <p className="heading text-lg">{labels.title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2"><Selects car={car} set={setCar} makeLabel={labels.make} modelLabel={labels.model} allLabel={labels.all} /></div>
      <p role="status" className={`mt-3 flex items-center gap-2 text-sm font-bold ${state?.tone ?? "text-muted"}`}>{state ? <><state.Icon className="size-5 shrink-0" />{state.msg}</> : labels.pick}</p>
      {car.make && <p className="mt-1 text-xs text-muted">{labels.saved}</p>}
    </div>
  );
}
