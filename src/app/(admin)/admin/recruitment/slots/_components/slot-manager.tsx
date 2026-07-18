"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createSlot, updateSlot, deleteSlot } from "../../actions"

export interface SlotRow {
  id: string
  round: "GD" | "PI"
  startsAt: string
  venue: string | null
  capacity: number
  panel: string[]
  filled: number
}

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SlotManager({ slots, isAdmin }: { slots: SlotRow[]; isAdmin: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SlotRow | null>(null)
  const [round, setRound] = useState<"GD" | "PI">("GD")
  const [startsAt, setStartsAt] = useState("")
  const [venue, setVenue] = useState("")
  const [capacity, setCapacity] = useState(8)
  const [panelText, setPanelText] = useState("")

  const openAdd = () => {
    setEditing(null)
    setRound("GD")
    setStartsAt("")
    setVenue("")
    setCapacity(8)
    setPanelText("")
    setOpen(true)
  }

  const openEdit = (s: SlotRow) => {
    setEditing(s)
    setRound(s.round)
    setStartsAt(toLocalInput(s.startsAt))
    setVenue(s.venue ?? "")
    setCapacity(s.capacity)
    setPanelText(s.panel.join(", "))
    setOpen(true)
  }

  const save = () => {
    if (!startsAt) {
      toast.error("Pick a date and time.")
      return
    }
    const panel = panelText.split(",").map((s) => s.trim()).filter(Boolean)
    startTransition(async () => {
      const result = editing
        ? await updateSlot(editing.id, { startsAt, venue, capacity, panel })
        : await createSlot({ round, startsAt, venue, capacity, panel })
      if (result.success) {
        toast.success(editing ? "Slot updated." : "Slot created.")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed.")
      }
    })
  }

  const remove = (s: SlotRow) => {
    if (!window.confirm(`Delete this ${s.round} slot?`)) return
    startTransition(async () => {
      const result = await deleteSlot(s.id)
      if (result.success) {
        toast.success("Slot deleted.")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed.")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="size-3.5" /> New slot
        </Button>
      </div>

      {slots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          No slots yet — create GD slots first, PI slots once shortlists are out.
        </div>
      ) : (
        <div className="editorial-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-4 py-3">Round</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Venue / link</th>
                <th className="px-4 py-3">Panel</th>
                <th className="px-4 py-3">Filled</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <Badge variant={s.round === "GD" ? "secondary" : "outline"}>{s.round}</Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(s.startsAt).toLocaleString("en-IN", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="max-w-48 truncate px-4 py-3 text-muted-foreground">{s.venue ?? "—"}</td>
                  <td className="max-w-48 truncate px-4 py-3 text-muted-foreground">
                    {s.panel.length ? s.panel.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={s.filled >= s.capacity ? "font-medium text-destructive" : ""}>
                      {s.filled}/{s.capacity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/admin/recruitment/slots/${s.id}`}
                        className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
                        title="Open panel view / scoring"
                      >
                        <Users className="size-3.5" />
                      </Link>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(s)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          disabled={isPending}
                          onClick={() => remove(s)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit slot" : "New slot"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div className="space-y-1.5">
                <Label className="text-xs">Round</Label>
                <Select value={round} onValueChange={(v) => setRound(v as "GD" | "PI")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GD">Group Discussion</SelectItem>
                    <SelectItem value="PI">Personal Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Date & time</Label>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Venue or meet link</Label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Room 204 / https://meet.google.com/…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Capacity</Label>
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value) || 1)}
                className="w-24"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Panel (comma-separated names)</Label>
              <Input value={panelText} onChange={(e) => setPanelText(e.target.value)} placeholder="Arnav, Priya" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={isPending}>
              {isPending ? "Saving…" : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
