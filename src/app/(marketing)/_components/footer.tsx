import Link from "next/link";
import { t } from "@/content/strings";
import type { Content } from "@/content/contentSchema";

type Props = { contacts: Content["queryContacts"] };

export function Footer({ contacts }: Props) {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="text-sm font-semibold text-primary">{t("brand.name")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("brand.tagline")}</p>
          </div>

          {/* Quick links */}
          <nav aria-label={t("nav.home")}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("nav.home")}
            </p>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("nav.blog")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("nav.register")}
                </Link>
              </li>
              <li>
                <Link href="/quiz/join" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("nav.quizJoin")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contacts */}
          {contacts.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("landing.sectionContacts")}
              </p>
              <ul className="space-y-2 text-sm">
                {contacts.map((c) => (
                  <li key={c.phone}>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.role}</p>
                    <a
                      href={`tel:${c.phone}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {c.phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          {t("brand.name")}
        </div>
      </div>
    </footer>
  );
}
