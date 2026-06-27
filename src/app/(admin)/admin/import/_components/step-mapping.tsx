"use client"

import { useState, useTransition } from "react"
import { Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  IMPORT_FIELDS,
  type ColumnMapping,
  type ValidatedRow,
  validateRow,
} from "@/lib/schemas/import"
import type { ImportPresetRecord } from "../actions"
import { saveImportPreset, deleteImportPreset } from "../actions"

const NONE_SENTINEL = "__none__"

interface Props {
  headers:         string[]
  rawRows:         Record<string, string>[]
  mapping:         ColumnMapping
  presets:         ImportPresetRecord[]
  onMappingChange: (m: ColumnMapping) => void
  onPresetsChange: (p: ImportPresetRecord[]) => void
  onBack:          () => void
  onNext:          (mapping: ColumnMapping, validated: ValidatedRow[]) => void
}

export function StepMapping({
  headers,
  rawRows,
  mapping,
  presets,
  onMappingChange,
  onPresetsChange,
  onBack,
  onNext,
}: Props) {
  const [presetName,    setPresetName]    = useState("")
  const [presetPartner, setPresetPartner] = useState("")
  const [saving,        startSave]        = useTransition()
  const [deleting,      startDelete]      = useTransition()

  const setField = (key: keyof ColumnMapping, col: string) => {
    onMappingChange({ ...mapping, [key]: col === NONE_SENTINEL ? undefined : col })
  }

  const requiredMapped = IMPORT_FIELDS
    .filter((f) => f.required)
    .every((f) => !!mapping[f.key])

  const handleNext = () => {
    const validated = rawRows.map((r, i) => validateRow(i, r, mapping))
    onNext(mapping, validated)
  }

  const handleLoadPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id)
    if (preset) {
      onMappingChange(preset.mapping)
      setPresetName(preset.name)
      setPresetPartner(preset.partner ?? "")
      toast.success(`Loaded preset "${preset.name}"`)
    }
  }

  const handleSavePreset = () => {
    if (!presetName.trim()) { toast.error("Enter a preset name."); return }
    startSave(async () => {
      const result = await saveImportPreset(presetName.trim(), presetPartner.trim(), mapping)
      if (!result.success || !result.preset) {
        toast.error(result.error ?? "Save failed.")
        return
      }
      const saved = result.preset!
      onPresetsChange([...presets.filter((p) => p.id !== saved.id), saved])
      toast.success(`Preset "${result.preset.name}" saved.`)
    })
  }

  const handleDeletePreset = (id: string, name: string) => {
    startDelete(async () => {
      await deleteImportPreset(id)
      onPresetsChange(presets.filter((p) => p.id !== id))
      toast.success(`Preset "${name}" deleted.`)
    })
  }

  // Preview of first row with current mapping
  const firstRow = rawRows[0]

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      {/* Presets */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Saved presets
          </p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1 rounded-md border border-border bg-muted/40 pl-3 pr-1 py-1"
              >
                <button
                  className="text-xs font-medium text-foreground hover:text-primary"
                  onClick={() => handleLoadPreset(p.id)}
                >
                  {p.name}
                  {p.partner && (
                    <span className="ml-1 text-muted-foreground">({p.partner})</span>
                  )}
                </button>
                <button
                  className="ml-1 rounded p-0.5 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeletePreset(p.id, p.name)}
                  disabled={deleting}
                  title="Delete preset"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
          <Separator />
        </div>
      )}

      {/* Mapping table */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Column mapping
        </p>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="py-2 pl-4 pr-2 text-left text-xs font-medium text-muted-foreground">
                  Our field
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                  Their column
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  Preview (row 1)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {IMPORT_FIELDS.map((field) => {
                const selected   = mapping[field.key]
                const previewVal = selected && firstRow ? firstRow[selected] : null
                return (
                  <tr key={field.key} className="bg-card">
                    <td className="py-2.5 pl-4 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{field.label}</span>
                        {field.required && (
                          <Badge variant="secondary" className="text-[10px]">required</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <Select
                        value={selected ?? NONE_SENTINEL}
                        onValueChange={(v) => { if (v !== null) setField(field.key, v) }}
                      >
                        <SelectTrigger className="h-8 w-48 text-xs">
                          <SelectValue placeholder="— skip —" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_SENTINEL} className="text-xs text-muted-foreground">
                            — skip —
                          </SelectItem>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2">
                      {previewVal != null ? (
                        <span className="text-xs text-foreground">{previewVal || <span className="text-muted-foreground">(empty)</span>}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save as preset */}
      <div className="space-y-2 rounded-lg border border-dashed border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Save as preset
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Preset name (e.g. NITI Aayog MUN)"
            className="h-8 text-xs"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
          <Input
            placeholder="Partner (optional)"
            className="h-8 w-36 text-xs"
            value={presetPartner}
            onChange={(e) => setPresetPartner(e.target.value)}
          />
          <Button size="sm" variant="outline" onClick={handleSavePreset} disabled={saving}>
            <Save className="mr-1.5 size-3.5" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={handleNext} disabled={!requiredMapped}>
          Preview {rawRows.length} rows →
        </Button>
      </div>
    </div>
  )
}
