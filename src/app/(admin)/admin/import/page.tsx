import { prisma } from "@/lib/prisma"
import { getContent } from "@/lib/settings"
import { getImportPresets, getQuarantine } from "./actions"
import { ImportWizard } from "./_components/import-wizard"
import { QuarantinePanel } from "./_components/quarantine-panel"
import { PartnerSheetsCard } from "./_components/partner-sheets-card"
import { PageHeader } from "@/app/(admin)/_components/page-header"

export default async function ImportPage() {
  const [presets, committees, quarantine, content] = await Promise.all([
    getImportPresets(),
    prisma.committee.findMany({
      where:   { isActive: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getQuarantine(),
    getContent(),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Conference"
        title="Cross-delegation import"
        description="Upload a partner sheet, map their columns to our fields, review, and import. Google Form intake lands here automatically, only broken rows need you."
      />
      {/* id so the import wizard's completion screen can link straight here */}
      <div id="quarantine" className="scroll-mt-20">
        <QuarantinePanel rows={quarantine} />
      </div>
      <ImportWizard presets={presets} committeeNames={committees.map((c) => c.name)} />
      <PartnerSheetsCard
        sources={content.sheetPullSources}
        presetNames={presets.map((p) => p.name)}
      />
    </div>
  )
}
