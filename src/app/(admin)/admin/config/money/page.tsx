import { prisma } from "@/lib/prisma"
import { getContent } from "@/lib/settings"
import { requireStaff } from "@/lib/authz"
import { TabFees } from "../_components/tab-fees"
import { TabPayments } from "../_components/tab-payments"

export default async function MoneySettingsPage() {
  const session = await requireStaff()
  const isAdmin = (session.user as { role?: string }).role === "ADMIN"

  const [content, fees] = await Promise.all([
    getContent(),
    prisma.fee.findMany({ orderBy: [{ committeeType: "asc" }, { isDtu: "asc" }] }),
  ])

  const serializedFees = fees.map((f) => ({
    id: f.id,
    label: f.label,
    committeeType: f.committeeType,
    isDtu: f.isDtu,
    amountInr: f.amountInr,
  }))

  return (
    <div className="space-y-6">
      <div className="editorial-card p-6">
        <h2 className="font-heading text-lg">Fees</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Amounts by committee type — allotments always read from this table.
        </p>
        <div className="rule my-5" />
        <TabFees fees={serializedFees} />
      </div>

      {isAdmin ? (
        <div className="editorial-card p-6">
          <h2 className="font-heading text-lg">Payments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Provider, static link, and the Google Sheet mirror. Admin only.
          </p>
          <div className="rule my-5" />
          <TabPayments
            paymentProvider={content.paymentProvider}
            staticPaymentLink={content.staticPaymentLink}
            sheetSyncUrl={content.sheetSyncUrl}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Payment provider settings are admin-only.
        </p>
      )}
    </div>
  )
}
