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
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
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
    <header className="flex h-20 shrink-0 items-center gap-5 border-b border-white/10 bg-foreground px-5 text-background">
      {/* Title */}
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t("quiz.builder.titlePlaceholder")}
        className="h-12 w-64 rounded-none border-0 border-b border-white/20 bg-transparent px-0 font-heading text-xl text-background shadow-none focus-visible:border-primary focus-visible:ring-0"
      />

      <div className="h-8 w-px bg-white/15" />

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <Label htmlFor="mode-switch" className="cursor-pointer select-none text-sm text-background/55">
          {t("quiz.modes.POLL")}
        </Label>
        <Switch
          id="mode-switch"
          size="sm"
          checked={mode === "QUIZ"}
          onCheckedChange={(v) => onModeChange(v ? "QUIZ" : "POLL")}
        />
        <Label htmlFor="mode-switch" className="cursor-pointer select-none text-sm text-background/55">
          {t("quiz.modes.QUIZ")}
        </Label>
      </div>

      <div className="h-8 w-px bg-white/15" />

      {/* Theme picker */}
      <DropdownMenu open={themeOpen} onOpenChange={setThemeOpen}>
        <DropdownMenuTrigger className="flex h-10 items-center gap-2 border border-white/20 px-3 text-sm transition-colors hover:bg-white/10">
          <span
            className="inline-block size-3 rounded-sm border border-border/50"
            style={{ background: theme.accentColor }}
          />
          {t("quiz.builder.themes.classic")}
          <ChevronDown className="size-4 text-background/55" />
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
        className="flex h-11 items-center gap-2 bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Play className="size-4" />
        {t("quiz.presentButton")}
      </Link>

      {/* Save status */}
      <div className="flex min-w-24 items-center gap-1.5 text-sm text-background/55">
        {saveStatus === "saving" && <><Loader2 className="size-3 animate-spin" />{t("quiz.builder.saving")}</>}
        {saveStatus === "saved"  && <><Check className="size-3 text-teal-300" /><span className="text-teal-300">{t("quiz.builder.saved")}</span></>}
        {saveStatus === "dirty"  && <span className="text-muted-foreground/60">{t("quiz.builder.unsaved")}</span>}
      </div>
    </header>
  )
}
