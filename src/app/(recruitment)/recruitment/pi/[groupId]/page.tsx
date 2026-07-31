import { GroupConsolePage } from "../../_components/group-console-page"

// Next 16: route params are a Promise.
export default async function PiConsoleRoute({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  return <GroupConsolePage groupId={groupId} kind="PI" />
}
