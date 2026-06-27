"use client"

import { useState } from "react"
import { Check, Loader2, ChevronDown, Play } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { t } from "@/content/strings"
import { PRESET_THEMES, type PresentationTheme, type SlideMode } from "@/lib/quiz-types"

interface Props {
  presentationId: string
  title: string
  mode: SlideMode
  theme: PresentationTheme
  saveStatus: "saved" | "saving" | "dirty"
  onTitleChange: (v: string) => void
  onModeChange: (v: SlideMode) => void
  onThemeChange: (v: PresentationTheme) => void
}

// Custom colour inputs for the theme editor
function ColourRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono text-foreground">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-6 cursor-pointer rounded border border-border bg-transparent p-0"
        />
      </div>
    </div>
  )
}

export function BuilderHeader({
  presentationId, title, mode, theme, saveStatus, onTitleChange, onModeChange, onThemeChange,
}: Props) {
  const [themeOpen, setThemeOpen] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4">
      {/* Title */}
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t("quiz.builder.titlePlaceholder")}
        className="h-8 w-52 text-sm font-medium border-0 shadow-none focus-visible:ring-0 px-1"
      />

      <div className="h-5 w-px bg-border" />

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <Label htmlFor="mode-switch" className="text-xs text-muted-foreground cursor-pointer select-none">
          {t("quiz.modes.POLL")}
        </Label>
        <Switch
          id="mode-switch"
          size="sm"
          checked={mode === "QUIZ"}
          onCheckedChange={(v) => onModeChange(v ? "QUIZ" : "POLL")}
        />
        <Label htmlFor="mode-switch" className="text-xs text-muted-foreground cursor-pointer select-none">
          {t("quiz.modes.QUIZ")}
        </Label>
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Theme picker */}
      <DropdownMenu open={themeOpen} onOpenChange={setThemeOpen}>
        <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
          <span
            className="inline-block size-3 rounded-sm border border-border/50"
            style={{ background: theme.accentColor }}
          />
          {t("quiz.builder.themes.classic")}
          <ChevronDown className="size-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel className="text-xs">{t("quiz.builder.themes.classic")} — presets</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(PRESET_THEMES).map(([key, preset]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => { onThemeChange(preset); setThemeOpen(false) }}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className="inline-flex size-5 shrink-0 items-center justify-center rounded border border-border/50"
                style={{ background: preset.background }}
              >
                <span className="size-2.5 rounded-sm" style={{ background: preset.accentColor }} />
              </span>
              {t(`quiz.builder.themes.${key}` as Parameters<typeof t>[0])}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <div className="px-2 py-2 space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{t("quiz.builder.themes.custom")}</p>
            <ColourRow label="Background" value={theme.background} onChange={(v) => onThemeChange({ ...theme, background: v })} />
            <ColourRow label="Text" value={theme.textColor} onChange={(v) => onThemeChange({ ...theme, textColor: v })} />
            <ColourRow label="Accent" value={theme.accentColor} onChange={(v) => onThemeChange({ ...theme, accentColor: v })} />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Present button */}
      <Link
        href={`/admin/quiz/${presentationId}/present`}
        className="flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
      >
        <Play className="size-3" />
        {t("quiz.presentButton")}
      </Link>

      {/* Save status */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {saveStatus === "saving" && <><Loader2 className="size-3 animate-spin" />{t("quiz.builder.saving")}</>}
        {saveStatus === "saved"  && <><Check className="size-3 text-teal-600" /><span className="text-teal-600">{t("quiz.builder.saved")}</span></>}
        {saveStatus === "dirty"  && <span className="text-muted-foreground/60">{t("quiz.builder.unsaved")}</span>}
      </div>
    </header>
  )
}
