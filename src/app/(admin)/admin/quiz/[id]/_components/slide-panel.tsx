"use client"

import { ChevronUp, ChevronDown, Copy, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { t } from "@/content/strings"
import type { SlideData, SlideType } from "@/lib/quiz-types"

const SLIDE_TYPES: SlideType[] = ["MCQ", "WORDCLOUD", "SCALE", "OPEN_TEXT", "CONTENT"]

const TYPE_COLOUR: Record<SlideType, string> = {
  MCQ:       "bg-teal-500",
  WORDCLOUD: "bg-purple-500",
  SCALE:     "bg-amber-500",
  OPEN_TEXT: "bg-blue-500",
  CONTENT:   "bg-gray-400",
}

interface Props {
  slides: SlideData[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (type: SlideType) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

export function SlidePanel({
  slides, selectedId, onSelect, onAdd, onDelete, onDuplicate, onMoveUp, onMoveDown,
}: Props) {
  return (
    <aside className="flex w-[200px] shrink-0 flex-col border-r bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {slides.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">
            {t("quiz.builder.noSlides")}
          </p>
        ) : (
          <ul className="space-y-1 p-2">
            {slides.map((slide, idx) => (
              <li key={slide.id}>
                <button
                  onClick={() => onSelect(slide.id)}
                  className={cn(
                    "group w-full rounded-lg border px-2.5 py-2 text-left transition-colors",
                    selectedId === slide.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:border-border hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("size-1.5 shrink-0 rounded-full", TYPE_COLOUR[slide.type])} />
                    <span className="flex-1 truncate text-xs font-medium text-foreground">
                      {slide.prompt || t(`quiz.slideType.${slide.type}` as Parameters<typeof t>[0])}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">{idx + 1}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground truncate pl-3.5">
                    {t(`quiz.slideType.${slide.type}` as Parameters<typeof t>[0])}
                  </p>
                </button>

                {/* Actions shown only for the selected slide */}
                {selectedId === slide.id && (
                  <div className="flex items-center justify-end gap-0.5 px-1.5 pb-1">
                    <button
                      onClick={() => onMoveUp(slide.id)}
                      disabled={idx === 0}
                      title={t("quiz.builder.moveUp")}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp className="size-3" />
                    </button>
                    <button
                      onClick={() => onMoveDown(slide.id)}
                      disabled={idx === slides.length - 1}
                      title={t("quiz.builder.moveDown")}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown className="size-3" />
                    </button>
                    <button
                      onClick={() => onDuplicate(slide.id)}
                      title={t("quiz.builder.duplicate")}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Copy className="size-3" />
                    </button>
                    <button
                      onClick={() => onDelete(slide.id)}
                      title={t("common.delete")}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add slide button */}
      <div className="shrink-0 border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-input bg-transparent px-3 h-8 text-xs font-medium hover:bg-muted transition-colors">
            <Plus className="size-3.5" />
            {t("quiz.addSlide")}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {SLIDE_TYPES.map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => onAdd(type)}
                className="gap-2 text-sm"
              >
                <span className={cn("size-2 rounded-full", TYPE_COLOUR[type])} />
                {t(`quiz.slideType.${type}` as Parameters<typeof t>[0])}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
