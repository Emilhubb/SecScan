"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const links = [
  { label: "Scan", href: "/" },
  { label: "History", href: "/history" },
  { label: "About", href: "/about" },
];

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="flex min-h-16 w-full  items-center gap-6 select-none"
    >
      <Link
        href="/"
        aria-label="SecScan home"
        className="group inline-flex shrink-0  gap-2.5"
      >
        <span className="text-2xl font-bold tracking-tight text-white sm:text-5xl">
          sec<span className="text-violet-400">scan</span>
        </span>
      </Link>

      <div className="ml-auto flex gap-1 p-1 sm:gap-1.5">
        {links.map(({ label, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              href={href}
              key={href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-tr-2xl rounded-bl-2xl px-3 py-2 text-lg font-medium transition-colors sm:px-4 ${
                isActive
                  ? "bg-violet-500/15 text-violet-200 shadow-sm shadow-black/10"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
