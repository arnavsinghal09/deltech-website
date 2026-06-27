"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { addPortfolio, bulkAddPortfolios, deletePortfolio } from "../actions"
import type { ClientCommittee } from "./config-tabs"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  AVAILABLE: "secondary",
  ON_HOLD: "outline",
  ALLOTTED: "default",
  BLOCKED: "destructive",
}

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Free",
  ON_HOLD: "On hold",
  ALLOTTED: "Allotted",
  BLOCKED: "Blocked",
}

interface Props {
  committees: ClientCommittee[]
}

export function TabPortfolios({ committees }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(committees[0]?.id ?? "")
  const [newName, setNewName] = useState("")
  const [bulkText, setBulkText] = useState("")
  const [isPending, startTransition] = useTransition()

  const selected = committees.find((c) => c.id === selectedId)

  const handleAdd = () => {
    if (!selectedId || !newName.trim()) return
    startTransition(async () => {
      const result = await addPortfolio(selectedId, newName.trim())
      if (result.success) {
        toast.success("Portfolio added.")
        setNewName("")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed.")
      }
    })
  }

  const handleBulk = () => {
    if (!selectedId || !bulkText.trim()) return
    const names = bulkText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (names.length === 0) return
    startTransition(async () => {
      const result = await bulkAddPortfolios(selectedId, names)
      toast.success(
        `Added ${result.added}${result.skipped ? `, skipped ${result.skipped} duplicate${result.skipped > 1 ? "s" : ""}` : ""}.`,
      )
      setBulkText("")
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deletePortfolio(id)
      if (result.success) {
        toast.success("Portfolio removed.")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed.")
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Committee selector */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Committee</Label>
        <Select value={selectedId} onValueChange={(v) => setSelectedId(v ?? "")}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select a committee" />
          </SelectTrigger>
          <SelectContent>
            {committees.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} ({c.portfolios.length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <>
          {/* Add single */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Add portfolio</Label>
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Country, figure, or journalist role…"
                className="max-w-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
              />
              <Button
                onClick={handleAdd}
                disabled={isPending || !newName.trim()}
                size="sm"
                className="gap-1.5"
              >
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
          </div>

          <Separator />

          {/* Bulk paste */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Bulk add — one per line or comma-separated
            </Label>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"India\nUnited States\nChina"}
              rows={5}
              className="max-w-sm"
            />
            <Button
              onClick={handleBulk}
              disabled={isPending || !bulkText.trim()}
              size="sm"
              variant="secondary"
              className="gap-1.5"
            >
              <Plus className="size-3.5" /> Bulk add
            </Button>
          </div>

          <Separator />

          {/* Portfolio list */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {selected.portfolios.length} portfolio{selected.portfolios.length !== 1 ? "s" : ""} in{" "}
              {selected.name}
            </p>
            {selected.portfolios.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No portfolios yet.
              </p>
            ) : (
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {selected.portfolios.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium">{p.name}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        variant={STATUS_VARIANT[p.status] ?? "secondary"}
                        className="text-xs"
                      >
                        {STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                      {p.status === "AVAILABLE" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(p.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {committees.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Add committees first before managing portfolios.
        </p>
      )}
    </div>
  )
}
