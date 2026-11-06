"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function AuthPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const googlePopup = useRef<Window | null>(null);
  const googlePopupWatch = useRef<number | null>(null);

  useEffect(() => {
    authClient.getSession().then(({ data }) => setUserEmail(data?.user.email ?? null));
  }, []);

  useEffect(() => {
    function handleGooglePopupMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== googlePopup.current) return;
      if (event.data?.type !== "secscan:google-sign-in-complete" && event.data?.type !== "secscan:google-sign-in-error") return;

      if (googlePopupWatch.current !== null) window.clearInterval(googlePopupWatch.current);
      googlePopupWatch.current = null;
      googlePopup.current?.close();
      googlePopup.current = null;
      if (event.data.type === "secscan:google-sign-in-error") {
        setMessage(typeof event.data.message === "string" ? event.data.message : "Google sign-in failed. Please try again.");
        setPending(false);
        return;
      }

      authClient.getSession().then(({ data }) => {
        setUserEmail(data?.user.email ?? null);
        setMessage(data?.user.email ? "You are signed in." : "Google sign-in did not create a session. Please try again.");
        setPending(false);
      }).catch(() => {
        setMessage("Could not load your session. Please try again.");
        setPending(false);
      });
    }

    window.addEventListener("message", handleGooglePopupMessage);
    return () => window.removeEventListener("message", handleGooglePopupMessage);
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

  function signInWithGoogle() {
    const popup = window.open("about:blank", "secscan-google-sign-in", "popup,width=500,height=650,resizable=yes,scrollbars=yes");
    if (!popup) {
      setMessage("Your browser blocked the sign-in popup. Allow popups for this site and try again.");
      return;
    }

    googlePopup.current = popup;
    setPending(true);
    setMessage("");
    popup.location.href = `${window.location.origin}/auth/google-popup`;

    let closedAt: number | null = null;
    googlePopupWatch.current = window.setInterval(() => {
      if (!googlePopup.current?.closed) {
        closedAt = null;
        return;
      }
      closedAt ??= Date.now();
      if (Date.now() - closedAt < 1500) return;

      if (googlePopupWatch.current !== null) window.clearInterval(googlePopupWatch.current);
      googlePopupWatch.current = null;
      googlePopup.current = null;
      setMessage("The sign-in window was closed before sign-in finished.");
      setPending(false);
    }, 500);
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
        <div className="flex flex-col gap-3 rounded-xl border border-violet-400/20 bg-slate-900/70 p-5">
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={pending}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            <GoogleIcon />
            {pending ? "Please wait…" : "Continue with Google"}
          </button>
          <div className="flex items-center gap-3 text-xs text-slate-500" aria-hidden="true">
            <span className="h-px flex-1 bg-slate-700" />
            <span>or use email</span>
            <span className="h-px flex-1 bg-slate-700" />
          </div>
          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === "sign-up" && <label className="flex flex-col gap-1 text-sm">Name<input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>}
            <label className="flex flex-col gap-1 text-sm">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
            <label className="flex flex-col gap-1 text-sm">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
            <button disabled={pending} className="mt-2 min-h-11 rounded-lg bg-violet-500 px-4 font-medium hover:bg-violet-600 disabled:opacity-60">{pending ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}</button>
            <button type="button" disabled={pending} onClick={() => { setMode(mode === "sign-up" ? "sign-in" : "sign-up"); setMessage(""); }} className="min-h-10 text-sm text-violet-200 underline underline-offset-4 disabled:opacity-60">{mode === "sign-up" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
          </form>
        </div>
      )}
      {message && <p role="status" className="text-sm text-slate-300">{message}</p>}
      <Link href="/" className="text-sm text-violet-200 underline underline-offset-4">Back to scanner</Link>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.72 5.99c4.51-4.16 7.06-10.29 7.06-17.64Z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" transform="translate(0 4)" />
      <path fill="#34A853" d="M24 48c6.47 0 11.91-2.13 15.88-5.81l-7.72-5.99c-2.14 1.44-4.89 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -4)" />
    </svg>
  );
}
