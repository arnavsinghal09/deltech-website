"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/content/strings";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { href: "/", label: () => t("nav.home") },
  { href: "/blog", label: () => t("nav.blog") },
  { href: "/register", label: () => t("nav.register") },
  { href: "/quiz/join", label: () => t("nav.quizJoin") },
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-primary"
        >
          {t("brand.name")}
        </Link>

        {/* Desktop nav */}
        <nav aria-label={t("nav.home")} className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {label()}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? t("common.close") : t("nav.home")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {open && (
        <nav
          aria-label={t("nav.home")}
          className="border-t border-border/60 bg-background px-4 pb-4 md:hidden"
        >
          <ul className="mt-2 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {label()}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
