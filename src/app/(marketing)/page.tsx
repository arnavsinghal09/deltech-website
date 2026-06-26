import Link from "next/link";
import { CalendarDays, MapPin, Trophy, Phone } from "lucide-react";
import { getContent } from "@/lib/settings";
import { t } from "@/content/strings";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FadeUp, StaggerList, StaggerItem } from "./_components/motion";

export default async function LandingPage() {
  const content = await getContent();
  const { landingHero, conferenceDates, venue, agendasBlurb, awards, queryContacts } = content;

  const ctaHref = content.registrationOpen ? "/register" : "/register/closed";

  return (
    <div className="flex flex-col">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section
        aria-label={t("landing.sectionDetails")}
        className="relative flex min-h-[88svh] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center"
      >
        {/* Teal radial gradient backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,var(--teal-100),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,oklch(0.22_0.04_196),transparent)]"
        />

        <FadeUp>
          <h1 className="mx-auto max-w-3xl text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1.08] tracking-tight text-foreground">
            {landingHero.title}
          </h1>
        </FadeUp>

        {landingHero.subtitle && (
          <FadeUp delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {landingHero.subtitle}
            </p>
          </FadeUp>
        )}

        <FadeUp delay={0.2} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ctaHref}
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-8 text-base font-semibold shadow-sm")}
          >
            {landingHero.ctaLabel}
          </Link>
          <Link
            href="/blog"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-8 text-base")}
          >
            {t("nav.blog")}
          </Link>
        </FadeUp>

        {(conferenceDates || venue) && (
          <FadeUp delay={0.3} className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {conferenceDates && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4 text-primary" aria-hidden />
                {conferenceDates}
              </span>
            )}
            {venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" aria-hidden />
                {venue}
              </span>
            )}
          </FadeUp>
        )}
      </section>

      {/* ── Conference Details ────────────────────────────────── */}
      {(conferenceDates || venue) && (
        <section
          aria-labelledby="details-heading"
          className="border-y border-border/60 bg-muted/40 py-16"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <FadeUp>
              <h2
                id="details-heading"
                className="mb-8 text-center text-2xl font-semibold tracking-tight"
              >
                {t("landing.sectionDetails")}
              </h2>
            </FadeUp>
            <div className="flex flex-wrap justify-center gap-12">
              {conferenceDates && (
                <FadeUp delay={0.05} className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("landing.dateLabel")}
                    </p>
                    <p className="mt-0.5 text-base font-medium">{conferenceDates}</p>
                  </div>
                </FadeUp>
              )}
              {venue && (
                <FadeUp delay={0.1} className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("landing.venueLabel")}
                    </p>
                    <p className="mt-0.5 text-base font-medium">{venue}</p>
                  </div>
                </FadeUp>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Agendas ──────────────────────────────────────────── */}
      {agendasBlurb && (
        <section aria-labelledby="agendas-heading" className="py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <FadeUp>
              <h2 id="agendas-heading" className="mb-6 text-2xl font-semibold tracking-tight">
                {t("landing.sectionAgendas")}
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">{agendasBlurb}</p>
            </FadeUp>
          </div>
        </section>
      )}

      {/* ── Awards ───────────────────────────────────────────── */}
      {awards.length > 0 && (
        <section
          aria-labelledby="awards-heading"
          className="border-t border-border/60 bg-muted/40 py-20"
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <FadeUp>
              <div className="mb-10 flex items-center justify-center gap-2">
                <Trophy className="size-5 text-primary" aria-hidden />
                <h2 id="awards-heading" className="text-2xl font-semibold tracking-tight">
                  {t("landing.sectionAwards")}
                </h2>
              </div>
            </FadeUp>
            <StaggerList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {awards.map((award) => (
                <StaggerItem
                  key={award}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-sm"
                >
                  {award}
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </section>
      )}

      {/* ── Contacts ─────────────────────────────────────────── */}
      {queryContacts.length > 0 && (
        <section aria-labelledby="contacts-heading" className="border-t border-border/60 py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <FadeUp>
              <div className="mb-10 flex items-center justify-center gap-2">
                <Phone className="size-5 text-primary" aria-hidden />
                <h2 id="contacts-heading" className="text-2xl font-semibold tracking-tight">
                  {t("landing.sectionContacts")}
                </h2>
              </div>
            </FadeUp>
            <StaggerList className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {queryContacts.map((contact) => (
                <StaggerItem
                  key={contact.phone}
                  className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
                >
                  <p className="font-semibold text-card-foreground">{contact.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{contact.role}</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="mt-2 block text-sm font-medium text-primary hover:underline"
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
      <section className="border-t border-border/60 py-20">
        <FadeUp className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">{landingHero.title}</h2>
          <p className="mt-3 text-muted-foreground">{t("brand.tagline")}</p>
          <Link
            href={ctaHref}
            className={cn(buttonVariants({ size: "lg" }), "mt-8 h-11 px-8 text-base font-semibold")}
          >
            {landingHero.ctaLabel}
          </Link>
        </FadeUp>
      </section>
    </div>
  );
}
