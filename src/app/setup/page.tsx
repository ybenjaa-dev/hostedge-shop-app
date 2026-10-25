import { redirect } from "next/navigation";
import { hasAnyUser } from "@/lib/auth";
import { SetupForm } from "./setup-form";

export const metadata = { title: "Set up your store" };

export default async function SetupPage() {
  if (await hasAnyUser()) redirect("/admin");
  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:py-16">
      <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand">Welcome</p>
      <h1 className="display mb-2 text-4xl font-extrabold leading-tight sm:text-5xl">Let’s set up your store</h1>
      <p className="mb-10 text-muted">Takes about a minute. Everything here can be changed later in Settings.</p>
      <SetupForm />
    </main>
  );
}
