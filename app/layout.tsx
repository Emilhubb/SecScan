import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";
import Navbar from "../components/Navbar Components/Navbar";
import { JetBrains_Mono } from "next/font/google";

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains",
});
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
};

export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();

  return (
    <html lang="en" className={`${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 font-sans">
        <div className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 px-3 py-1.5 backdrop-blur-xl sm:px-6 sm:py-2 lg:px-8">
          <Navbar />
        </div>
        <main className="flex-1">{children}</main>
        <footer className="border-t select-none border-slate-800/80 px-3 py-4 text-center text-xs text-slate-400 sm:px-6 sm:py-5 sm:text-sm">
          © 2026 Emil Kazimov
        </footer>
      </body>
    </html>
  );
}
