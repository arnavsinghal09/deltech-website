"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { supabase } from "@/lib/supabase"

async function requireAuthor(postId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/signin")
  const post = await prisma.post.findUnique({
    where:  { id: postId },
    select: { authorId: true, slug: true, status: true },
  })
  if (!post || post.authorId !== session.user.id) {
    throw new Error("Not authorized")
  }
  return { userId: session.user.id, post }
}

function makeSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/-$/, "")
  const suffix = id.slice(-7)
  return base ? `${base}-${suffix}` : `untitled-${suffix}`
}

export async function saveDraft(
  postId: string,
  data: {
    title:       string
    subtitle:    string
    contentJson: Record<string, unknown>
    tags:        string[]
    coverImage?: string
    readMin:     number
  },
): Promise<{ success: boolean; error?: string; slug?: string }> {
  try {
    const { post } = await requireAuthor(postId)
    if (post.status === "PUBLISHED") return { success: false, error: "Cannot edit a published post." }

    // Generate slug from title on first meaningful save
    const isDraftSlug = post.slug.startsWith("draft-")
    const newSlug = isDraftSlug && data.title.trim()
      ? makeSlug(data.title, postId)
      : post.slug

    await prisma.post.update({
      where: { id: postId },
      data: {
        title:       data.title,
        subtitle:    data.subtitle || null,
        contentJson: data.contentJson as Prisma.InputJsonValue,
        tags:        data.tags,
        coverImage:  data.coverImage ?? null,
        readMin:     data.readMin,
        slug:        newSlug,
        status:      "DRAFT",
      },
    })
    return { success: true, slug: newSlug }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Save failed." }
  }
}

export async function submitPost(
  postId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { post } = await requireAuthor(postId)
    if (post.status !== "DRAFT" && post.status !== "CHANGES_REQUESTED") {
      return { success: false, error: "Post is not in a submittable state." }
    }
    await prisma.post.update({
      where: { id: postId },
      data: { status: "PENDING", submittedAt: new Date(), reviewNote: null },
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Submit failed." }
  }
}

// Extension -> content type. The bucket is public via getPublicUrl, so an
// SVG or an HTML file accepted here becomes stored XSS on the Supabase
// origin. Deriving the content type from this table rather than from
// file.type also stops a client mislabelling one thing as another.
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  webp: "image/webp",
  gif:  "image/gif",
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export async function uploadImage(
  postId: string,
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  try {
    const { userId } = await requireAuthor(postId)
    const file = formData.get("file") as File | null
    if (!file) return { error: "No file provided." }

    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: "Image is too large. The limit is 5 MB." }
    }

    // `ext` was taken straight from the filename, so "x.jpg/../../evil" gave
    // an extension containing slashes and traversal inside the bucket. The
    // allowlist lookup makes anything unexpected fail closed.
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    const contentType = ALLOWED_IMAGE_TYPES[ext]
    if (!contentType) {
      return { error: "Only JPG, PNG, WebP and GIF images are allowed." }
    }

    const path = `${userId}/${postId}/${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from("blog-images")
      .upload(path, file, { contentType, upsert: false })

    if (error) return { error: error.message }

    const { data: { publicUrl } } = supabase.storage
      .from("blog-images")
      .getPublicUrl(data.path)

    return { url: publicUrl }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." }
  }
}
