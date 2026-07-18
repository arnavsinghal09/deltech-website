import { getContent } from "@/lib/settings"
import { requireStaff } from "@/lib/authz"
import { EventControl } from "./_components/event-control"

export default async function EventControlPage() {
  const session = await requireStaff()
  const canManagePayments = (session.user as { role?: string }).role === "ADMIN"
  return <EventControl content={await getContent()} canManagePayments={canManagePayments} />
}
