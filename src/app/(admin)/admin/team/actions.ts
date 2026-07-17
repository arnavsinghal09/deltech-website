"use server"

import { prisma } from "@/lib/prisma"
import { supabase } from "@/lib/supabase"
import { requireStaff, requireAdmin } from "@/lib/authz"
import { audit } from "@/lib/audit"

export interface MemberData {
  name: string
  designation: string
  order: number
  imageUrl?: string
  socials?: { instagram?: string; linkedin?: string }
  isActive: boolean
}

export async function createMember(data: MemberData): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  if (!data.name.trim() || !data.designation.trim()) {
    return { success: false, error: "Name and designation are required." }
  }
  try {
    const member = await prisma.member.create({
      data: {
        name: data.name.trim(),
        designation: data.designation.trim(),
        order: data.order,
        imageUrl: data.imageUrl || null,
        socials: data.socials ?? undefined,
        isActive: data.isActive,
      },
    })
    await audit(session.user?.email ?? "unknown", "member.create", "Member", member.id, { name: data.name })
    return { success: true }
  } catch {
    return { success: false, error: "Failed to create member." }
  }
}

export async function updateMember(
  id: string,
  data: MemberData,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  try {
    await prisma.member.update({
      where: { id },
      data: {
        name: data.name.trim(),
        designation: data.designation.trim(),
        order: data.order,
        imageUrl: data.imageUrl || null,
        socials: data.socials ?? undefined,
        isActive: data.isActive,
      },
    })
    await audit(session.user?.email ?? "unknown", "member.update", "Member", id)
    return { success: true }
  } catch {
    return { success: false, error: "Failed to update member." }
  }
}

export async function deleteMember(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin()
  try {
    await prisma.member.delete({ where: { id } })
    await audit(session.user?.email ?? "unknown", "member.delete", "Member", id)
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete member." }
  }
}

// Reuses the existing blog-images bucket under a team/ prefix — zero new infra.
export async function uploadMemberImage(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  await requireStaff()
  try {
    const file = formData.get("file") as File | null
    if (!file) return { error: "No file provided." }
    if (file.size > 4 * 1024 * 1024) return { error: "Image must be under 4 MB." }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const path = `team/${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from("blog-images")
      .upload(path, file, { contentType: file.type, upsert: false })
    if (error) return { error: error.message }

    const { data: { publicUrl } } = supabase.storage.from("blog-images").getPublicUrl(data.path)
    return { url: publicUrl }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." }
  }
}
