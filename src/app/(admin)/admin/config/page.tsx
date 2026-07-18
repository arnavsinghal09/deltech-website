import { getContent } from "@/lib/settings"
import { requireStaff } from "@/lib/authz"
import { EventControl } from "./_components/event-control"

export default async function EventControlPage() {
  await requireStaff()
  return <EventControl content={await getContent()} />
}
