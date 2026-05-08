"use client";

import { CandlestickChart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-primary/15 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/65">
      <div className="mx-auto flex h-14 max-w-350 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-primary/15 text-primary shadow-[0_0_18px_-4px_var(--primary)]">
            <CandlestickChart className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-base font-semibold tracking-tight">
              Trading Journal
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">
              edge · habit · review
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/" active={pathname === "/"}>Dashboard</NavLink>
          <NavLink href="/funds" active={pathname?.startsWith("/funds") ?? false}>Funds</NavLink>
          <NavLink href="/trades" active={pathname?.startsWith("/trades") ?? false}>Trades</NavLink>
          <NavLink href="#" disabled>Insights</NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  active,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="rounded-md px-3 py-1.5 text-muted-foreground/50 cursor-not-allowed">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={[
        "rounded-md px-3 py-1.5 transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
