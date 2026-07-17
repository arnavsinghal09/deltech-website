import Link from "next/link";
import { getContent } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { t } from "@/content/strings";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FadeUp, StaggerList, StaggerItem } from "./_components/motion";

export default async function LandingPage() {
  const [content, committeeCount, portfolioCount] = await Promise.all([
    getContent(),
    prisma.committee.count({ where: { isActive: true } }),
    prisma.portfolio.count(),
  ]);
  const { landingHero, conferenceDates, venue, agendasBlurb, awards, queryContacts } = content;

  const ctaHref = content.registrationOpen ? "/register" : "/register/closed";
  const eyebrowLine = [conferenceDates, venue].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section
        aria-label={t("landing.sectionDetails")}
        className="paper-grid relative flex min-h-[86svh] flex-col items-center justify-center px-4 py-24 text-center"
      >
        {/* fade the grid toward the bottom */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"
        />

        <div className="relative">
          {eyebrowLine && (
            <FadeUp>
              <p className="eyebrow">{eyebrowLine}</p>
            </FadeUp>
          )}

          <FadeUp delay={0.05}>
            <h1 className="display mx-auto mt-6 max-w-4xl text-[clamp(3rem,8vw,6.5rem)] leading-[1.02] text-foreground">
              {landingHero.title}
            </h1>
          </FadeUp>

          {landingHero.subtitle && (
            <FadeUp delay={0.12}>
              <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                {landingHero.subtitle}
              </p>
            </FadeUp>
          )}

          {/* ornament */}
          <FadeUp delay={0.18} className="mx-auto mt-10 flex w-40 items-center gap-3">
            <div className="rule-gold flex-1" />
            <span aria-hidden className="text-[10px] text-gold-500">
              ◆
            </span>
            <div className="rule-gold flex-1" />
          </FadeUp>

          <FadeUp delay={0.24} className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <Link
              href={ctaHref}
              className={cn(buttonVariants({ size: "lg" }), "h-12 px-9 text-base font-semibold")}
            >
              {landingHero.ctaLabel}
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t("nav.blog")} →
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────── */}
      <section aria-label="Conference at a glance" className="border-y border-border/70">
        <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { value: String(committeeCount).padStart(2, "0"), label: "Committees" },
            { value: String(portfolioCount).padStart(2, "0"), label: "Portfolios" },
            { value: conferenceDates || "TBA", label: t("landing.dateLabel") },
          ].map((stat) => (
            <div key={stat.label} className="px-6 py-8 text-center">
              <p className="font-mono text-3xl tabular-nums text-foreground">{stat.value}</p>
              <p className="eyebrow mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Agendas ──────────────────────────────────────────── */}
      {agendasBlurb && (
        <section aria-labelledby="agendas-heading" className="py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <FadeUp>
              <p className="eyebrow">{t("landing.sectionAgendas")}</p>
              <h2 id="agendas-heading" className="display mt-3 text-3xl md:text-4xl">
                The floor is yours.
              </h2>
              <div className="rule mt-6" />
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{agendasBlurb}</p>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-medium">
                <Link
                  href="/availability"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Live portfolio matrix →
                </Link>
                <Link
                  href="/team"
                  className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  Meet the team →
                </Link>
              </div>
            </FadeUp>
          </div>
        </section>
      )}

      {/* ── Awards ───────────────────────────────────────────── */}
      {awards.length > 0 && (
        <section aria-labelledby="awards-heading" className="border-t border-border/70 py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <FadeUp>
              <p className="eyebrow">{t("landing.sectionAwards")}</p>
              <h2 id="awards-heading" className="display mt-3 text-3xl md:text-4xl">
                Recognition worth arguing for.
              </h2>
              <div className="rule mt-6" />
            </FadeUp>
            <StaggerList className="mt-4 grid gap-x-12 sm:grid-cols-2">
              {awards.map((award) => (
                <StaggerItem
                  key={award}
                  className="flex items-baseline gap-3 border-b border-border/60 py-4"
                >
                  <span aria-hidden className="text-[9px] text-gold-500">
                    ◆
                  </span>
                  <span className="font-heading text-lg">{award}</span>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </section>
      )}

      {/* ── Contacts ─────────────────────────────────────────── */}
      {queryContacts.length > 0 && (
        <section aria-labelledby="contacts-heading" className="border-t border-border/70 py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <FadeUp>
              <p className="eyebrow">{t("landing.sectionContacts")}</p>
              <h2 id="contacts-heading" className="display mt-3 text-3xl md:text-4xl">
                Questions? Ask the secretariat.
              </h2>
              <div className="rule mt-6" />
            </FadeUp>
            <StaggerList className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {queryContacts.map((contact) => (
                <StaggerItem key={contact.phone} className="editorial-card p-6">
                  <p className="font-heading text-xl">{contact.name}</p>
                  <p className="eyebrow mt-1.5">{contact.role}</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="mt-4 block font-mono text-sm tabular-nums text-primary hover:underline"
                  >
                    {contact.phone}
                  </a>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </section>
      )}

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section className="border-t border-border/70 py-24">
        <FadeUp className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <p className="eyebrow">{t("brand.tagline")}</p>
          <h2 className="display mt-4 text-4xl md:text-5xl">{landingHero.title}</h2>
          <Link
            href={ctaHref}
            className={cn(buttonVariants({ size: "lg" }), "mt-10 h-12 px-9 text-base font-semibold")}
          >
            {landingHero.ctaLabel}
          </Link>
        </FadeUp>
      </section>
    </div>
  );
}
