import Link from "next/link";
import { t } from "@/content/strings";
import type { Content } from "@/content/contentSchema";

type Props = { contacts: Content["queryContacts"] };

export function Footer({ contacts }: Props) {
  return (
    <footer className="mt-auto border-t border-border/70 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="display text-2xl text-foreground">{t("brand.name")}</p>
            <p className="mt-2 max-w-56 text-sm leading-relaxed text-muted-foreground">
              {t("brand.tagline")}
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label={t("nav.home")}>
            <p className="eyebrow mb-4">{t("nav.home")}</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/availability" className="text-muted-foreground transition-colors hover:text-foreground">
                  {t("nav.availability")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground transition-colors hover:text-foreground">
                  {t("nav.blog")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-muted-foreground transition-colors hover:text-foreground">
                  {t("nav.register")}
                </Link>
              </li>
              <li>
                <Link href="/quiz/join" className="text-muted-foreground transition-colors hover:text-foreground">
                  {t("nav.quizJoin")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contacts */}
          {contacts.length > 0 && (
            <div>
              <p className="eyebrow mb-4">{t("landing.sectionContacts")}</p>
              <ul className="space-y-3 text-sm">
                {contacts.map((c) => (
                  <li key={c.phone}>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <a
                      href={`tel:${c.phone}`}
                      className="font-mono text-xs tabular-nums text-muted-foreground hover:text-primary"
                    >
                      {c.phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <span>{t("brand.name")}</span>
          <Link
            href="/signin/staff"
            className="transition-colors hover:text-foreground"
          >
            Organiser sign-in
          </Link>
        </div>
      </div>
    </footer>
  );
}
