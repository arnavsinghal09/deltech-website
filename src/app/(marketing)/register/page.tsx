import { redirect } from "next/navigation"
import { getContent } from "@/lib/settings"
import { prisma } from "@/lib/prisma"
import { t } from "@/content/strings"
import { RegistrationForm } from "./_components/registration-form"
import { deriveEventState } from "@/lib/event-state"

export default async function RegisterPage() {
  const content = await getContent()

  if (!deriveEventState(content).acceptsRegistrations) {
    redirect("/register/closed")
  }

  const committees = await prisma.committee.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, doubleDelegation: true },
  })

  return (
    <div className="section-shell grid gap-12 py-16 lg:grid-cols-[0.62fr_1fr] lg:gap-20 lg:py-24">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="eyebrow">{t("marketing.registrationEyebrow")}</p>
        <h1 className="display-section mt-6 max-w-[8ch]">{t("register.pageTitle")}</h1>
        <p className="body-large mt-7 text-muted-foreground">{t("register.pageSubtitle")}</p>
        <div className="mt-10 border-y border-foreground/20 py-6">
          <p className="data-label text-primary">{t("marketing.registrationBriefLabel")}</p>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{t("marketing.registrationBrief")}</p>
        </div>
      </aside>
      <div className="diplomatic-surface border border-border/80 p-5 sm:p-9 lg:p-12">
        <RegistrationForm committees={committees} />
      </div>
    </div>
  )
}
