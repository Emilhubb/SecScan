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
  const [userName, setUserName] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const googlePopup = useRef<Window | null>(null);
  const googlePopupWatch = useRef<number | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "code" | "password">(
    "email",
  );
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const forgotPassword = () => {
    setResetEmail(email);
    setResetStep("email");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetMessage("");
    setForgotOpen(true);
  };

  const sendResetCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setResetMessage("");

    try {
      const result = await authClient.emailOtp.requestPasswordReset({
        email: resetEmail,
      });
      if (result.error) throw new Error(result.error.message);
      setResetStep("password");
      setResetMessage(
        "If an account related to this email exists, a code was sent",
      );
    } catch (error) {
      setResetMessage(
        error instanceof Error ? error.message : "Couldn't send the code",
      );
    } finally {
      setPending(false);
    }
  };

  const submitNewPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setResetMessage("The password do not match.");
      return;
    }
    setPending(true);
    setResetMessage("");

    try {
      const result = await authClient.emailOtp.resetPassword({
        email: resetEmail,
        otp: resetOtp,
        password: newPassword,
      });
      if (result.error) throw new Error(result.error.message);
      setForgotOpen(false);
      setPassword(" ");
      setMessage("Password updated successfully.");
    } catch (error) {
      setResetMessage(
        error instanceof Error ? error.message : "Could not reset password",
      );
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    let active = true;
    authClient
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setUserEmail(data?.user.email ?? null);
        setUserName(data?.user.name ?? "");
      })
      .catch(() => {
        if (active)
          setMessage("Could not load your session. Please try again.");
      })
      .finally(() => {
        if (active) setSessionLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleGooglePopupMessage(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== googlePopup.current
      )
        return;
      if (
        event.data?.type !== "secscan:google-sign-in-complete" &&
        event.data?.type !== "secscan:google-sign-in-error"
      )
        return;

      if (googlePopupWatch.current !== null)
        window.clearInterval(googlePopupWatch.current);
      googlePopupWatch.current = null;
      googlePopup.current?.close();
      googlePopup.current = null;
      if (event.data.type === "secscan:google-sign-in-error") {
        setMessage(
          typeof event.data.message === "string"
            ? event.data.message
            : "Google sign-in failed. Please try again.",
        );
        setPending(false);
        return;
      }

      window.location.reload();
    }

    window.addEventListener("message", handleGooglePopupMessage);
    return () =>
      window.removeEventListener("message", handleGooglePopupMessage);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({ name, email, password })
          : await authClient.signIn.email({ email, password });
      if (result.error)
        throw new Error(result.error.message ?? "Authentication failed.");
      setUserEmail(result.data?.user.email ?? email);
      setUserName(result.data?.user.name ?? (mode === "sign-up" ? name : ""));
      setMessage(
        mode === "sign-up"
          ? "Your SecScan account is ready."
          : "You are signed in.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setPending(false);
    }
  }

  async function reloadWhenPopupSessionIsReady() {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      try {
        const response = await fetch(
          "/api/auth/get-session?disableCookieCache=true",
          { cache: "no-store", credentials: "same-origin" },
        );
        if (response.ok) {
          const result = (await response.json()) as {
            user?: { email?: unknown } | null;
          } | null;
          if (typeof result?.user?.email === "string") {
            window.location.reload();
            return;
          }
        }
      } catch {}
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }
    setMessage("The sign-in window closed before sign-in finished.");
    setPending(false);
  }

  function signInWithGoogle() {
    const popup = window.open(
      "about:blank",
      "secscan-google-sign-in",
      "popup,width=500,height=650,resizable=yes,scrollbars=yes",
    );
    if (!popup) {
      setMessage(
        "Your browser blocked the sign-in popup. Allow popups for this site and try again.",
      );
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

      if (googlePopupWatch.current !== null)
        window.clearInterval(googlePopupWatch.current);
      googlePopupWatch.current = null;
      googlePopup.current = null;
      void reloadWhenPopupSessionIsReady();
    }, 500);
  }

  async function signOut() {
    try {
      const result = await authClient.signOut();
      if (result.error)
        throw new Error(result.error.message ?? "Could not sign out.");
      setUserEmail(null);
      setUserName("");
      setMessage("You are signed out.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not sign out.",
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-9 my-8 drop-shadow-lg drop-shadow-violet-500/20  shadow-[0_0_500px_5px_rgba(168,85,247,0.04)] text-white sm:px-6 sm:py-14">
      <header className="mx-auto mb-8 w-full max-w-2xl text-center sm:mb-10">
        <h1 className="text-xl font-bold tracking-tight sm:text-4xl">
          {userEmail ? "Profile details" : "Sign in to SecScan"}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
          {!userEmail &&
            "Save reports and keep your scan history available when you return."}
        </p>
      </header>

      <div className="mx-auto w-full max-w-2xl">
        <section
          aria-label={
            userEmail
              ? "Profile details and actions"
              : "Sign in or create an account"
          }
          className="w-full"
        >
          {sessionLoading ? (
            <p
              className="py-8 text-center text-sm text-slate-400"
              role="status"
            >
              Checking your account…
            </p>
          ) : userEmail ? (
            <>
              <div className="flex flex-col  text-center shadow-[0_0_500px_5px_rgba(168,85,247,0.04)] p-10">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-violet-400/10 text-2xl font-semibold text-violet-200 sm:size-14">
                    {(userName || userEmail).trim().charAt(0).toUpperCase()}
                  </div>
                  <h2 className=" max-w-full wrap-break-word text-xl font-semibold text-white sm:text-4xl">
                    {userName || userEmail.split("@")[0]}
                  </h2>
                </div>
                <div className="flex gap-1 mt-5">
                  <p className="flex items-center gap-2 text-xs text-slate-500 sm:mx-5 sm:text-lg">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Signed in with {userEmail}
                  </p>
                </div>
                <div className="mt-6 flex flex-col items-center justify-center gap-4">
                  <div className="mt-8 flex items-center justify-center border-2 rounded-lg bg-slate-900/20 border-slate-800 w-full">
                    <Link
                      href="/history"
                      className="flex min-h-14 items-center sm:text-xl justify-between gap-4 px-1 text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      <span>Scan History</span>
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="mx-auto mt-6 flex cursor-pointer min-h-10 items-center justify-center px-4 text-sm sm:text-xl text-red-400  transition-colors hover:text-slate-200"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex justify-center gap-7 border-b border-slate-800">
                <button
                  type="button"
                  aria-pressed={mode === "sign-in"}
                  onClick={() => {
                    setMode("sign-in");
                    setMessage("");
                  }}
                  className={`min-h-11 border-b-2 px-1 text-sm sm:text-2xl transition-colors ${mode === "sign-in" ? "border-violet-400 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "sign-up"}
                  onClick={() => {
                    setMode("sign-up");
                    setMessage("");
                  }}
                  className={`min-h-11 border-b-2 px-1 text-sm sm:text-2xl transition-colors ${mode === "sign-up" ? "border-violet-400 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                >
                  Create account
                </button>
              </div>

              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={pending}
                className="flex min-h-11 w-50% items-center mx-auto font-bold justify-center gap-2 rounded-lg px-4 text-sm font-medium text-slate-200 hover:scale-105 hover:duration-100 border-b-2 border-slate-950 disabled:cursor-wait disabled:opacity-60"
              >
                {pending ? "Please wait…" : "Continue with Google"}
              </button>

              <div
                className="my-5 flex items-center gap-3 text-xs text-slate-500"
                aria-hidden="true"
              >
                <span className="h-px flex-1 bg-slate-800" />
                <span>or use email</span>
                <span className="h-px flex-1 bg-slate-800" />
              </div>

              <form onSubmit={submit} className="flex flex-col gap-4">
                {mode === "sign-up" && (
                  <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                    Name
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      autoComplete="name"
                      className="min-h-11 w-full rounded-md border-b border-slate-700 px-3 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-violet-400"
                    />
                  </label>
                )}
                <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    className="min-h-11 w-full rounded-md border-b border-slate-700 px-3 text-white outline-none transition-colors focus:border-violet-400"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete={
                      mode === "sign-up" ? "new-password" : "current-password"
                    }
                    className="min-h-11 w-full rounded-md border-b border-slate-700 px-3 text-white outline-none transition-colors focus:border-violet-400"
                  />
                </label>
                {mode === "sign-in" && (
                  <button
                    type="button"
                    onClick={forgotPassword}
                    className="min-h-10 self-end px-1 text-sm text-violet-300 transition-colors hover:text-violet-200"
                  >
                    Forgot password?
                  </button>
                )}
                <button
                  disabled={pending}
                  className="mt-1 min-h-11 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60"
                >
                  {pending
                    ? "Please wait…"
                    : mode === "sign-up"
                      ? "Create account"
                      : "Sign in"}
                </button>
              </form>
              <p className="mt-6 text-center text-xs leading-5 text-slate-500">
                Accounts include synced scan history and saved PDF reports.
              </p>
            </>
          )}

          {message && (
            <p
              role="status"
              aria-live="polite"
              className="mt-5 text-center text-sm leading-6 text-slate-300"
            >
              {message}
            </p>
          )}
        </section>
      </div>

      {!userEmail && forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center  bg-black/70 pt-10"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) {
              setForgotOpen(false);
            }
          }}
        >
          <section className="animate-result-in w-full max-w-md rounded-xl border border-slate-700 bg-slate-950 p-6 text-white shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="forgot-password-title" className="text-xl font-semibold">
                Reset your password
              </h2>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                disabled={pending}
                aria-label="Close"
                className="text-slate-400 hover:text-white disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {resetStep === "email" ? (
              <form onSubmit={sendResetCode} className="flex flex-col gap-4">
                <p className="text-sm text-slate-400">
                  Enter your account email and we’ll send you a reset code.
                </p>

                <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                  Email
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    required
                    autoComplete="email"
                    className="min-h-11 rounded-md border border-slate-700 bg-slate-900 px-3 outline-none focus:border-violet-400"
                  />
                </label>

                <button
                  disabled={pending}
                  className="min-h-11 rounded-lg bg-violet-500 px-4 font-semibold disabled:opacity-60"
                >
                  {pending ? "Sending…" : "Send code"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={submitNewPassword}
                className="flex flex-col gap-4"
              >
                <p className="text-sm text-slate-400">
                  Enter the code sent to <strong>{resetEmail}</strong>, then
                  choose a new password.
                </p>

                <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                  Email code
                  <input
                    value={resetOtp}
                    onChange={(event) => setResetOtp(event.target.value)}
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="min-h-11 rounded-md border border-slate-700 bg-slate-900 px-3 outline-none focus:border-violet-400"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                  New password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="min-h-11 rounded-md border border-slate-700 bg-slate-900 px-3 outline-none focus:border-violet-400"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                  Confirm new password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="min-h-11 rounded-md border border-slate-700 bg-slate-900 px-3 outline-none focus:border-violet-400"
                  />
                </label>

                <button
                  disabled={pending}
                  className="min-h-11 rounded-lg bg-violet-500 px-4 font-semibold disabled:opacity-60"
                >
                  {pending ? "Updating…" : "Reset password"}
                </button>

                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setResetMessage("");
                    void sendResetCode(
                      new Event(
                        "submit",
                      ) as unknown as React.FormEvent<HTMLFormElement>,
                    );
                  }}
                  className="text-sm text-violet-300 hover:text-violet-200 disabled:opacity-50"
                >
                  Resend code
                </button>
              </form>
            )}

            {resetMessage && (
              <p
                role="status"
                aria-live="polite"
                className="mt-4 text-sm text-slate-300"
              >
                {resetMessage}
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
