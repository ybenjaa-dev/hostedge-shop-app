import { redirect } from "next/navigation";
import { getSessionUser, hasAnyUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "./login-form";

export const metadata = { title: "Admin sign in", robots: { index: false } };

export default async function LoginPage() {
  if (!(await hasAnyUser())) redirect("/setup");
  if (await getSessionUser()) redirect("/admin");
  const s = await getSettings();
  return (
    <main className="grid min-h-dvh place-items-center bg-sunken px-4">
      <div className="card w-full max-w-sm p-7 shadow-xl">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">{s.store.name}</p>
        <h1 className="display mb-6 mt-1 text-3xl font-extrabold">Sign in</h1>
        <LoginForm />
      </div>
    </main>
  );
}
