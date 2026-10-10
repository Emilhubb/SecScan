import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";
import Navbar from "../components/Navbar Components/Navbar";

export const metadata: Metadata = {
  title: "SecScan - Security Scanner",
  description: "A lightweight HTTPS security header scanner.",
};

export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950">
        <div className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 px-4 py-2 backdrop-blur-xl sm:px-8">
          <Navbar />
        </div>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
