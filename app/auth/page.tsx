"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function AuthPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    authClient.getSession().then(({ data }) => setUserEmail(data?.user.email ?? null));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const result = mode === "sign-up"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message ?? "Authentication failed.");
      setUserEmail(result.data?.user.email ?? email);
      setMessage(mode === "sign-up" ? "Your SecScan account is ready." : "You are signed in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    const result = await authClient.signOut();
    if (result.error) setMessage(result.error.message ?? "Could not sign out.");
    else {
      setUserEmail(null);
      setMessage("You are signed out.");
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-5 px-3 py-10 text-white sm:px-6">
      <div>
        <h1 className="text-3xl font-bold">SecScan account</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to sync scan history and save reports to Neon Storage.</p>
      </div>
      {userEmail ? (
        <div className="rounded-xl border border-violet-400/20 bg-slate-900/70 p-5">
          <p className="text-slate-300">Signed in as <strong className="text-white">{userEmail}</strong></p>
          <button onClick={signOut} className="mt-4 min-h-10 rounded-lg border border-violet-400/30 px-4 text-sm text-violet-200 hover:bg-violet-500/15">Sign out</button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-violet-400/20 bg-slate-900/70 p-5">
          {mode === "sign-up" && <label className="flex flex-col gap-1 text-sm">Name<input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>}
          <label className="flex flex-col gap-1 text-sm">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
          <label className="flex flex-col gap-1 text-sm">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
          <button disabled={pending} className="mt-2 min-h-11 rounded-lg bg-violet-500 px-4 font-medium hover:bg-violet-600 disabled:opacity-60">{pending ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}</button>
          <button type="button" onClick={() => { setMode(mode === "sign-up" ? "sign-in" : "sign-up"); setMessage(""); }} className="min-h-10 text-sm text-violet-200 underline underline-offset-4">{mode === "sign-up" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
        </form>
      )}
      {message && <p role="status" className="text-sm text-slate-300">{message}</p>}
      <Link href="/" className="text-sm text-violet-200 underline underline-offset-4">Back to scanner</Link>
    </section>
  );
}
