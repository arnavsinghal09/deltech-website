import type { ReactNode } from "react"

type Mark = {
  type: string
  attrs?: Record<string, unknown>
}

type TNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: TNode[]
  text?: string
  marks?: Mark[]
}

function safeSrc(src: unknown): string | null {
  if (typeof src !== "string") return null
  const s = src.trim()
  if (s.startsWith("https://") || s.startsWith("http://")) return s
  return null
}

function safeHref(href: unknown): string {
  if (typeof href !== "string") return "#"
  const s = href.trim().toLowerCase()
  if (s.startsWith("javascript:") || s.startsWith("data:")) return "#"
  return href.trim()
}

function applyMarks(text: string, marks: Mark[] | undefined): ReactNode {
  if (!marks?.length) return text
  return marks.reduce<ReactNode>((node, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong>{node}</strong>
      case "italic":
        return <em>{node}</em>
      case "strike":
        return <s>{node}</s>
      case "code":
        return <code>{node}</code>
      case "link": {
        const href = safeHref(mark.attrs?.href)
        return (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {node}
          </a>
        )
      }
      default:
        return node
    }
  }, text as ReactNode)
}

function renderNode(node: TNode, key: string): ReactNode {
  switch (node.type) {
    case "doc":
      return node.content?.map((n, i) => renderNode(n, `${key}.${i}`)) ?? null

    case "paragraph": {
      const children = node.content?.map((n, i) => renderNode(n, `${key}.${i}`))
      return <p key={key}>{children?.length ? children : <br />}</p>
    }

    case "text":
      return applyMarks(node.text ?? "", node.marks)

    case "heading": {
      const level = (node.attrs?.level as number) ?? 1
      const children = node.content?.map((n, i) => renderNode(n, `${key}.${i}`))
      if (level === 1) return <h1 key={key}>{children}</h1>
      if (level === 2) return <h2 key={key}>{children}</h2>
      if (level === 3) return <h3 key={key}>{children}</h3>
      return <h4 key={key}>{children}</h4>
    }

    case "blockquote":
      return <blockquote key={key}>{node.content?.map((n, i) => renderNode(n, `${key}.${i}`))}</blockquote>

    case "bulletList":
      return <ul key={key}>{node.content?.map((n, i) => renderNode(n, `${key}.${i}`))}</ul>

    case "orderedList":
      return <ol key={key}>{node.content?.map((n, i) => renderNode(n, `${key}.${i}`))}</ol>

    case "listItem":
      return <li key={key}>{node.content?.map((n, i) => renderNode(n, `${key}.${i}`))}</li>

    case "codeBlock":
      return (
        <pre key={key}>
          <code>{node.content?.map((n, i) => renderNode(n, `${key}.${i}`))}</code>
        </pre>
      )

    case "hardBreak":
      return <br key={key} />

    case "horizontalRule":
      return <hr key={key} />

    case "image": {
      const src = safeSrc(node.attrs?.src)
      if (!src) return null
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : ""
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={key} src={src} alt={alt} />
    }

    default:
      return node.content?.map((n, i) => renderNode(n, `${key}.${i}`)) ?? null
  }
}

export function TiptapContent({ json, className }: { json: unknown; className?: string }) {
  if (!json || typeof json !== "object") return null
  const root = json as TNode
  return <div className={className}>{renderNode(root, "root")}</div>
}
