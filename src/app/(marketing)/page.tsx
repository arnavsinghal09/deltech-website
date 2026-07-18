import Link from "next/link";
import { ArrowDown, ArrowRight, RadioTower } from "lucide-react";
import { getContent } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { t } from "@/content/strings";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FadeUp } from "./_components/motion";
import { DiplomaticOrbit } from "./_components/diplomatic-orbit";

const TYPE_LABEL: Record<string, string> = {
  STANDARD: t("marketing.committeeTypes.standard"),
  CRISIS: t("marketing.committeeTypes.crisis"),
  PRESS: t("marketing.committeeTypes.press"),
};

export default async function LandingPage() {
  const [content, committees] = await Promise.all([
    getContent(),
    prisma.committee.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        agenda: true,
        type: true,
        doubleDelegation: true,
        portfolios: { select: { status: true } },
      },
    }),
  ]);

  const openPortfolioCount = committees.reduce(
    (total, committee) =>
      total + committee.portfolios.filter((portfolio) => portfolio.status === "AVAILABLE").length,
    0,
  );
  const portfolioCount = committees.reduce(
    (total, committee) => total + committee.portfolios.length,
    0,
  );
  const ctaHref = content.registrationOpen ? "/register" : "/register/closed";
  const statusLabel = content.registrationOpen
    ? t("marketing.applicationsOpen")
    : t("marketing.applicationsClosed");

  return (
    <div className="overflow-hidden">
      <section aria-label={t("landing.sectionDetails")} className="relative border-b border-border/70">
        <div className="paper-grid absolute inset-0 opacity-70" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/15 to-background" aria-hidden />
        <div className="section-shell relative grid min-h-[calc(100svh-5rem)] items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <p className="eyebrow flex items-center gap-3">
                <span className="signal-dot signal-pulse" />
                {statusLabel}
              </p>
              <span className="hidden h-4 w-px bg-border sm:block" />
              <p className="data-label text-muted-foreground">{t("marketing.liveBriefing")}</p>
            </div>

            <h1 className="display-hero mt-10 max-w-[8ch]">
              {content.landingHero.title}
            </h1>

            <p className="body-large mt-8 max-w-2xl text-muted-foreground">
              {content.landingHero.subtitle || t("marketing.heroFallback")}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={ctaHref} className={cn(buttonVariants({ size: "lg" }), "min-w-44")}>
                {content.landingHero.ctaLabel}
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link
                href="/availability"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-w-44")}
              >
                {t("marketing.viewMatrix")}
              </Link>
            </div>

            <dl className="mt-12 grid max-w-2xl grid-cols-2 border-y border-border/70 sm:grid-cols-4">
              {[
                [content.conferenceDates || t("marketing.datesPending"), t("landing.dateLabel")],
                [content.venue || t("marketing.venuePending"), t("landing.venueLabel")],
                [String(committees.length).padStart(2, "0"), t("marketing.activeCommittees")],
                [String(portfolioCount).padStart(2, "0"), t("marketing.listedPortfolios")],
              ].map(([value, label]) => (
                <div key={label} className="border-border/70 px-3 py-4 first:pl-0 sm:border-r sm:last:border-r-0">
                  <dt className="data-label text-[0.6875rem] text-muted-foreground">{label}</dt>
                  <dd className="mt-2 text-base font-semibold leading-snug">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <DiplomaticOrbit
              committeeCount={committees.length}
              openPortfolioCount={openPortfolioCount}
            />
          </div>

          <a
            href="#delegate-journey"
            className="absolute bottom-6 left-0 hidden items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground lg:flex"
          >
            <ArrowDown className="size-4" />
            {t("marketing.continueBriefing")}
          </a>
        </div>
      </section>

      <div className="overflow-hidden border-b border-border/70 bg-foreground py-3 text-background">
        <p className="w-max whitespace-nowrap font-mono text-sm font-semibold uppercase tracking-[0.16em]">
          {t("marketing.principles")} · {t("marketing.principles")}
        </p>
      </div>

      <section id="delegate-journey" className="border-b border-border/70 py-24 sm:py-32">
        <div className="section-shell">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="eyebrow">{t("marketing.processEyebrow")}</p>
              <h2 className="display-section mt-5 max-w-[10ch]">{t("marketing.processTitle")}</h2>
              <p className="body-large mt-7 max-w-xl text-muted-foreground">
                {t("marketing.processBody")}
              </p>
            </div>
            <ol className="border-t border-foreground/20">
              {[
                [t("marketing.processOneTitle"), t("marketing.processOneBody")],
                [t("marketing.processTwoTitle"), t("marketing.processTwoBody")],
                [t("marketing.processThreeTitle"), t("marketing.processThreeBody")],
              ].map(([title, body], index) => (
                <li key={title} className="grid gap-4 border-b border-foreground/20 py-7 sm:grid-cols-[4rem_1fr] sm:py-9">
                  <span className="font-mono text-sm font-semibold text-primary">0{index + 1}</span>
                  <div>
                    <h3 className="font-heading text-2xl">{title}</h3>
                    <p className="mt-2 max-w-xl text-base leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="section-shell">
          <div className="grid gap-8 border-b border-foreground/20 pb-12 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="eyebrow">{t("marketing.committeesEyebrow")}</p>
              <h2 className="display-section mt-5 max-w-[11ch]">{t("marketing.committeesTitle")}</h2>
            </div>
            <p className="body-large self-end text-muted-foreground">
              {content.agendasBlurb || t("marketing.committeesBody")}
            </p>
          </div>

          <div>
            {committees.map((committee, index) => {
              const open = committee.portfolios.filter((portfolio) => portfolio.status === "AVAILABLE").length;
              return (
                <Link
                  key={committee.id}
                  href="/availability"
                  className="group grid gap-5 border-b border-foreground/20 py-8 transition-colors hover:bg-primary/[0.045] sm:grid-cols-[4rem_0.9fr_1.2fr_auto] sm:items-center sm:px-3"
                >
                  <span className="font-mono text-sm font-semibold text-muted-foreground">0{index + 1}</span>
                  <div>
                    <h3 className="font-heading text-3xl transition-transform duration-300 group-hover:translate-x-1 md:text-4xl">
                      {committee.name}
                    </h3>
                    <p className="data-label mt-2 text-[0.6875rem] text-muted-foreground">
                      {TYPE_LABEL[committee.type]}
                      {committee.doubleDelegation ? " · " + t("marketing.doubleDelegation") : ""}
                    </p>
                  </div>
                  <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                    {committee.agenda || t("marketing.committeeBriefPending")}
                  </p>
                  <div className="flex items-center gap-3 sm:justify-end">
                    <span className={open > 0 ? "signal-dot" : "size-2 rounded-full bg-destructive"} />
                    <span className="font-mono text-sm font-semibold tabular-nums">
                      {open} {t("marketing.openLabel")}
                    </span>
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-primary py-24 text-primary-foreground sm:py-32">
        <div className="paper-grid absolute inset-0 opacity-15" aria-hidden />
        <div className="section-shell relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="data-label flex items-center gap-3 text-gold-300">
              <RadioTower className="size-4" />
              {t("marketing.matrixEyebrow")}
            </p>
            <h2 className="display-section mt-6 max-w-[10ch]">{t("marketing.matrixTitle")}</h2>
          </div>
          <div>
            <p className="body-large text-primary-foreground/75">{t("marketing.matrixBody")}</p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link
                href="/availability"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "bg-background text-foreground hover:bg-background/90",
                )}
              >
                {t("marketing.matrixCta")}
              </Link>
              <p className="font-mono text-3xl font-semibold tabular-nums">
                {String(openPortfolioCount).padStart(2, "0")}
                <span className="ml-2 text-sm uppercase tracking-[0.12em] text-primary-foreground/60">
                  {t("marketing.openLabel")}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {content.awards.length > 0 && (
        <section className="border-b border-border/70 py-24 sm:py-32">
          <div className="section-shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow">{t("landing.sectionAwards")}</p>
              <h2 className="display-section mt-5 max-w-[9ch]">{t("marketing.awardsTitle")}</h2>
            </div>
            <div className="border-t border-foreground/20">
              {content.awards.map((award, index) => (
                <div key={award} className="flex items-center gap-5 border-b border-foreground/20 py-6">
                  <span className="font-mono text-sm text-gold-700">0{index + 1}</span>
                  <p className="font-heading text-2xl">{award}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.queryContacts.length > 0 && (
        <section className="border-b border-border/70 py-24 sm:py-32">
          <div className="section-shell">
            <FadeUp className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
              <div>
                <p className="eyebrow">{t("landing.sectionContacts")}</p>
                <h2 className="display-section mt-5 max-w-[10ch]">{t("marketing.contactsTitle")}</h2>
              </div>
              <p className="body-large self-end text-muted-foreground">{t("marketing.contactsBody")}</p>
            </FadeUp>
            <div className="mt-12 grid border-t border-foreground/20 sm:grid-cols-2 lg:grid-cols-3">
              {content.queryContacts.map((contact) => (
                <a
                  key={contact.phone}
                  href={"tel:" + contact.phone}
                  className="group border-b border-foreground/20 py-7 sm:border-r sm:px-6 sm:first:pl-0"
                >
                  <p className="data-label text-muted-foreground">{contact.role}</p>
                  <p className="mt-3 font-heading text-2xl">{contact.name}</p>
                  <p className="mt-2 font-mono text-sm text-primary transition-transform group-hover:translate-x-1">
                    {contact.phone} ↗
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="noise-wash py-24 text-center sm:py-36">
        <div className="section-shell">
          <p className="eyebrow">{t("marketing.finalEyebrow")}</p>
          <h2 className="display-section mx-auto mt-6 max-w-[12ch]">{t("marketing.finalTitle")}</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href={ctaHref} className={buttonVariants({ size: "lg" })}>
              {content.landingHero.ctaLabel}
            </Link>
            <Link href="/blog" className={buttonVariants({ variant: "outline", size: "lg" })}>
              {t("marketing.readDispatch")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
