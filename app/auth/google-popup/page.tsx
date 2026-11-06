"use client";

import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function GooglePopupPage() {
  const started = useRef(false);
  const [message, setMessage] = useState("Connecting to Google…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    function failSignIn(errorMessage: string) {
      setMessage(errorMessage);
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "secscan:google-sign-in-error", message: errorMessage }, window.location.origin);
      }
    }

    authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/auth/google-popup/complete`,
    }).then(({ error }) => {
      if (error) failSignIn(error.message ?? "Google sign-in could not start. You can close this window and try again.");
    }).catch((error: unknown) => {
      failSignIn(error instanceof Error ? error.message : "Google sign-in could not start. You can close this window and try again.");
    });
  }, []);

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-3 px-6 text-center text-white">
      <h1 className="text-xl font-semibold">Google sign-in</h1>
      <p role="status" className="text-sm text-slate-400">{message}</p>
    </section>
  );
}
