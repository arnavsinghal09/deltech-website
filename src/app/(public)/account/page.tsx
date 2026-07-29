import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { t } from "@/content/strings"
import { roleHome } from "@/lib/nav"
import { PasswordForm } from "./_components/password-form"

export const metadata = { title: "Account · DelTech MUN" }

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/signin?callbackUrl=/account")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, role: true, passwordHash: true },
  })
  if (!user) redirect("/signin")

  const hasPassword = !!user.passwordHash

  return (
    <div className="paper-grid flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link href="/" className="display text-3xl text-foreground">
            {t("brand.name")}
          </Link>
        </div>

        <div className="editorial-card p-6 sm:p-8">
          <h1 className="font-heading text-2xl">{t("account.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <div className="rule my-5" />

          <h2 className="font-heading text-lg">
            {hasPassword ? t("account.changePasswordTitle") : t("account.setPasswordTitle")}
          </h2>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            {hasPassword ? t("account.changePasswordNote") : t("account.setPasswordNote")}
          </p>

          <PasswordForm hasPassword={hasPassword} />
        </div>

        <p className="mt-6 text-center text-sm">
          <Link
            href={roleHome(user.role)}
            className="font-medium text-teal-800 underline underline-offset-2"
          >
            {t("account.backLink")}
          </Link>
        </p>
      </div>
    </div>
  )
}
