"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/content/strings";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { href: "/", label: () => t("nav.home") },
  { href: "/availability", label: () => t("nav.availability") },
  { href: "/team", label: () => "Team" },
  { href: "/blog", label: () => t("nav.blog") },
  { href: "/quiz/join", label: () => t("nav.quizJoin") },
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link href="/" className="display text-xl text-foreground">
          {t("brand.name")}
        </Link>

        {/* Desktop nav */}
        <nav aria-label={t("nav.home")} className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "border-b-2 pb-0.5 text-[13px] font-medium tracking-wide transition-colors",
                pathname === href
                  ? "border-gold-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label()}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "sm" }), "hidden h-9 px-5 font-semibold md:inline-flex")}
          >
            {t("nav.register")}
          </Link>

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
          className="border-t border-border/70 bg-background px-4 pb-5 md:hidden"
        >
          <ul className="mt-3 flex flex-col">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block border-b border-border/50 px-1 py-3 text-sm font-medium transition-colors",
                    pathname === href ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label()}
                </Link>
              </li>
            ))}
            <li className="pt-4">
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ size: "sm" }), "w-full font-semibold")}
              >
                {t("nav.register")}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
