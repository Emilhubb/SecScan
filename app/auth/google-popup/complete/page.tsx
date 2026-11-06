"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function GooglePopupCompletePage() {
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let active = true;

    authClient.getSession().then(({ data }) => {
      if (!active) return;
      if (!data?.user) {
        setMessage("Sign-in did not complete. Close this window and try again.");
        return;
      }

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "secscan:google-sign-in-complete" }, window.location.origin);
        window.close();
        return;
      }

      setMessage("You are signed in. You can close this window.");
    }).catch(() => {
      if (active) setMessage("Could not finish sign-in. Close this window and try again.");
    });

    return () => { active = false; };
  }, []);

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-3 px-6 text-center text-white">
      <h1 className="text-xl font-semibold">Google sign-in</h1>
      <p role="status" className="text-sm text-slate-400">{message}</p>
    </section>
  );
}
