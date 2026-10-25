"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLang } from "@/lib/i18n-core";

export async function setLang(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: false });
  revalidatePath("/", "layout");
}
