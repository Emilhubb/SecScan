import type { Metadata } from "next";

export const metadata: Metadata = { title: "About | SecScan" };

export default function AboutPage() {
  return (
    <article className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 px-6 py-12 text-white">
      <h1 className="text-3xl font-bold">About SecScan</h1>
      <p className="text-slate-300">
        SecScan performs a limited, read-only check of a public website’s HTTPS response headers. It checks for Content Security Policy, HSTS, clickjacking protection, MIME sniffing protection, Referrer Policy, and Permissions Policy.
      </p>
      <p className="text-slate-400">
        This is a basic configuration check, not a penetration test or a guarantee that a site is secure. Only scan domains you own or have permission to assess.
      </p>
    </article>
  );
}
