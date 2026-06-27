"use client"

import { useState } from "react"
import { FloatingMenu } from "@tiptap/react/menus"
import type { Editor } from "@tiptap/react"
import { Plus, ImageIcon, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  editor:         Editor
  onImageInsert:  () => void
}

export function FloatingInsert({ editor, onImageInsert }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <FloatingMenu
      editor={editor}
      className="flex items-center gap-2"
    >
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        className={cn(
          "flex size-7 items-center justify-center rounded-full border transition-all",
          open
            ? "border-teal-400 bg-teal-50 text-teal-700 rotate-45"
            : "border-gray-300 bg-white text-gray-400 hover:border-teal-400 hover:text-teal-600",
        )}
        title="Insert"
      >
        <Plus className="size-4 transition-transform" style={{ transform: open ? "rotate(45deg)" : "none" }} />
      </button>

      {open && (
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-1.5 py-1 shadow-lg">
          <InsertBtn
            icon={<ImageIcon className="size-4" />}
            label="Image"
            onClick={() => { setOpen(false); onImageInsert() }}
          />
          <InsertBtn
            icon={<Minus className="size-4" />}
            label="Divider"
            onClick={() => {
              setOpen(false)
              editor.chain().focus().setHorizontalRule().run()
            }}
          />
        </div>
      )}
    </FloatingMenu>
  )
}

function InsertBtn({
  icon,
  label,
  onClick,
}: {
  icon:    React.ReactNode
  label:   string
  onClick: () => void
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    >
      {icon}
      {label}
    </button>
  )
}
