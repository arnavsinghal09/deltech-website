import { requireStaff } from "@/lib/authz"
import { PageHeader } from "@/app/(admin)/_components/page-header"
import { SettingsNav } from "./_components/settings-nav"

export default async function ConfigLayout({ children }: { children: React.ReactNode }) {
  await requireStaff()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Conference configuration. Changes apply immediately."
      />
      <div className="flex flex-col gap-8 lg:flex-row">
        <SettingsNav />
        <div className="min-w-0 max-w-3xl flex-1">{children}</div>
      </div>
    </div>
  )
}
