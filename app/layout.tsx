import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "../components/Navbar Components/Navbar";
export const metadata: Metadata = {
  title: {
    default: "SecScan | Website Security Scanner",
    template: "%s | SecScan",
  },
  description:
    "Scan a website's HTTPS security headers, TLS settings, cookies, and redirects. Get a clear security score and practical recommendations.",
  applicationName: "SecScan",
  category: "technology",
  keywords: [
    "website security scanner",
    "security headers check",
    "HTTPS scanner",
    "CSP checker",
    "TLS certificate checker",
    "HSTS check",
  ],
  authors: [{ name: "Emil Kazimov", url: "https://github.com/Emilhubb" }],
  creator: "Emil Kazimov",
  publisher: "SecScan",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: "SecScan | Website Security Scanner",
    description:
      "Check website security headers, TLS settings, cookies, and HTTPS redirects with clear, actionable results.",
    siteName: "SecScan",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "SecScan | Website Security Scanner",
    description:
      "Check website security headers, TLS settings, cookies, and HTTPS redirects with clear, actionable results.",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
  },
  verification: {
    google: "b3DJB8FNahZzTgYVKlYWstpD_jqeMjEmSK0bt1lMz3g",
  }
};

export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 font-sans">
        <div className="sticky top-0 z-50  bg-slate-950/85 px-3 py-1.5 backdrop-blur-xl sm:px-6 sm:py-2 lg:px-8">
          <Navbar />
        </div>
        <main className="flex-1">{children}</main>
        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-800/80 px-3 py-4 text-center text-xs text-slate-400 sm:px-6 sm:py-5 sm:text-sm">
          <span>© 2026 Emil Kazimov</span>
          <Link
            href="/privacy"
            className="underline decoration-slate-600 underline-offset-4 transition-colors hover:text-slate-200"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="underline decoration-slate-600 underline-offset-4 transition-colors hover:text-slate-200"
          >
            Terms of Service
          </Link>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}
