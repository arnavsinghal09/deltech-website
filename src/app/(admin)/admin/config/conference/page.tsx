import { getContent } from "@/lib/settings"
import { requireStaff } from "@/lib/authz"
import { TabContent } from "../_components/tab-content"

export default async function ConferenceSettingsPage() {
  await requireStaff()
  const content = await getContent()

  return (
    <div className="editorial-card p-6">
      <h2 className="font-heading text-lg">Conference & content</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Hero, dates, venue, public copy, awards, and contacts.
      </p>
      <div className="rule my-5" />
      <TabContent content={content} />
    </div>
  )
}
