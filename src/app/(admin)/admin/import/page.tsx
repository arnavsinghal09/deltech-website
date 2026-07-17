import { prisma } from "@/lib/prisma"
import { getImportPresets, getQuarantine } from "./actions"
import { ImportWizard } from "./_components/import-wizard"
import { QuarantinePanel } from "./_components/quarantine-panel"

export default async function ImportPage() {
  const [presets, committees, quarantine] = await Promise.all([
    getImportPresets(),
    prisma.committee.findMany({
      where:   { isActive: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getQuarantine(),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Cross-delegation import</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a partner sheet, map their columns to our fields, review, and import.
          Google Form intake lands here automatically — only broken rows need you.
        </p>
      </div>
      <QuarantinePanel rows={quarantine} />
      <ImportWizard presets={presets} committeeNames={committees.map((c) => c.name)} />
    </div>
  )
}
