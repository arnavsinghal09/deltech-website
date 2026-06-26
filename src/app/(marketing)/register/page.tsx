import { redirect } from "next/navigation"
import { getContent } from "@/lib/settings"
import { prisma } from "@/lib/prisma"
import { t } from "@/content/strings"
import { RegistrationForm } from "./_components/registration-form"

export default async function RegisterPage() {
  const content = await getContent()

  if (!content.registrationOpen) {
    redirect("/register/closed")
  }

  const committees = await prisma.committee.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, doubleDelegation: true },
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("register.pageTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("register.pageSubtitle")}</p>
      </div>
      <RegistrationForm committees={committees} />
    </div>
  )
}
