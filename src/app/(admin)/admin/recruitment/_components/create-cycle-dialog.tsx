"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { t } from "@/content/strings"
import { createRecruitmentCycle } from "../actions"

export function CreateCycleDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [pending, startTransition] = useTransition()

  // Derive the slug from the name until the operator overrides it, so the common
  // case needs one field.
  function onName(value: string) {
    setName(value)
    if (!slugEdited) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      )
    }
  }

  function submit() {
    startTransition(async () => {
      const result = await createRecruitmentCycle({ name, slug })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t("recruitment.control.create"))
      setOpen(false)
      setName("")
      setSlug("")
      setSlugEdited(false)
      if (result.id) router.push(`/admin/recruitment/${result.id}`)
      else router.refresh()
    })
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        {t("recruitment.control.newCycle")}
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("recruitment.control.newCycle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cycle-name">{t("recruitment.control.nameLabel")}</Label>
              <Input
                id="cycle-name"
                value={name}
                onChange={(e) => onName(e.target.value)}
                placeholder={t("recruitment.control.namePlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cycle-slug">{t("recruitment.control.slugLabel")}</Label>
              <Input
                id="cycle-slug"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true)
                  setSlug(e.target.value)
                }}
                placeholder={t("recruitment.control.slugPlaceholder")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submit} disabled={pending || name.trim().length < 3 || slug.length < 3}>
              {t("recruitment.control.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
