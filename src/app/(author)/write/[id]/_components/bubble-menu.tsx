"use client"

import { useRef, useState } from "react"
import { BubbleMenu } from "@tiptap/react/menus"
import type { Editor } from "@tiptap/react"
import { Bold, Italic, Link, Link2Off, Heading1, Heading2, Quote } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  editor: Editor
}

export function BubbleToolbar({ editor }: Props) {
  const [linkMode, setLinkMode] = useState(false)
  const [linkUrl,  setLinkUrl]  = useState("")
  const linkInputRef = useRef<HTMLInputElement>(null)

  const applyLink = () => {
    const url = linkUrl.trim()
    if (url) editor.chain().focus().setLink({ href: url.startsWith("http") ? url : `https://${url}` }).run()
    else editor.chain().focus().unsetLink().run()
    setLinkMode(false)
    setLinkUrl("")
  }

  const cancelLink = () => {
    setLinkMode(false)
    setLinkUrl("")
    editor.chain().focus().run()
  }

  const openLink = () => {
    const existing = editor.getAttributes("link").href as string | undefined
    setLinkUrl(existing ?? "")
    setLinkMode(true)
    setTimeout(() => linkInputRef.current?.focus(), 50)
  }

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1.5 py-1 shadow-lg"
    >
      {linkMode ? (
        <div className="flex items-center gap-1">
          <input
            ref={linkInputRef}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
            className="w-48 rounded border border-gray-200 px-2 py-0.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-400 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); applyLink() }
              if (e.key === "Escape") { e.preventDefault(); cancelLink() }
            }}
          />
          <button onClick={applyLink}  className="rounded px-2 py-0.5 text-xs font-medium text-teal-700 hover:bg-teal-50">Apply</button>
          <button onClick={cancelLink} className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100">Cancel</button>
        </div>
      ) : (
        <>
          <ToolBtn
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (⌘B)"
          >
            <Bold className="size-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (⌘I)"
          >
            <Italic className="size-3.5" />
          </ToolBtn>
          <div className="mx-0.5 h-4 w-px bg-gray-200" />
          <ToolBtn
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          >
            <Heading1 className="size-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            <Heading2 className="size-3.5" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          >
            <Quote className="size-3.5" />
          </ToolBtn>
          <div className="mx-0.5 h-4 w-px bg-gray-200" />
          {editor.isActive("link") ? (
            <ToolBtn
              active
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="Remove link"
            >
              <Link2Off className="size-3.5" />
            </ToolBtn>
          ) : (
            <ToolBtn
              active={false}
              onClick={openLink}
              title="Add link"
            >
              <Link className="size-3.5" />
            </ToolBtn>
          )}
        </>
      )}
    </BubbleMenu>
  )
}

function ToolBtn({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  title?: string
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={cn(
        "flex size-7 items-center justify-center rounded transition-colors",
        active
          ? "bg-teal-50 text-teal-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      {children}
    </button>
  )
}
