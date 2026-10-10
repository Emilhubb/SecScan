"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
      className="flex min-h-14 w-full min-w-0 items-center gap-2 select-none sm:min-h-16 sm:gap-6"
    >
      <Link
        href="/"
        aria-label="SecScan home"
        className="group inline-flex shrink-0 items-center gap-2 "
      >
        <Image src="/logo.png" alt="SecScan logo" width={128} height={36} priority className="size-8 object-cover sm:size-9" />
        <span className="text-xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
          sec<span className="text-violet-400 italic">scan</span>
        </span>
      </Link>

      <div className="ml-auto flex shrink-0 gap-0.5 p-0.5 sm:gap-1.5 sm:p-1">
        {links.map(({ label, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              href={href}
              key={href}
              aria-current={isActive ? "page" : undefined}
              className={`min-h-10 rounded-tr-xl rounded-bl-xl px-2 py-2 text-xs font-medium transition-colors sm:rounded-tr-2xl sm:rounded-bl-2xl sm:px-3 sm:text-sm lg:px-4 ${
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
