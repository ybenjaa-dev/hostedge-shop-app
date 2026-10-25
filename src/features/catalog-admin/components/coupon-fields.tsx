"use client";
import { useState } from "react";
import { Field } from "@/features/admin/components/fields";

/** Coupon type + value; the value input adapts to the type. */
export function CouponTypeValue({ idp, type: t0 = "percent", value, currency }: { idp: string; type?: "percent" | "fixed" | "free_shipping"; value: string; currency: string }) {
  const [type, setType] = useState(t0);
  return (
    <>
      <Field label="Type" htmlFor={`${idp}-type`}>
        <select id={`${idp}-type`} name="type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className="field">
          <option value="percent">Percent off</option><option value="fixed">Fixed amount off</option><option value="free_shipping">Free shipping</option>
        </select>
      </Field>
      <Field label={type === "percent" ? "Percent (1–100)" : type === "fixed" ? `Amount (${currency})` : "Value"} htmlFor={`${idp}-val`}>
        <input id={`${idp}-val`} name="value" inputMode="decimal" defaultValue={type === t0 ? value : ""} disabled={type === "free_shipping"} required={type !== "free_shipping"} placeholder={type === "free_shipping" ? "—" : ""} className="field num" />
      </Field>
    </>
  );
}
