"use client"

import { createUploadIntent, finalizeUpload } from "./actions"
import { MEDIA_POLICY, validateUpload, type MediaKindName } from "./keys"

// Browser side of the two-phase upload. Kept tiny on purpose: the file goes straight
// from the browser to S3 with a presigned PUT, so it never passes through a server
// action body (which would be subject to the request-size limit and would double the
// bandwidth).

export interface UploadOutcome {
  url?: string
  assetId?: string
  error?: string
}

export async function uploadToS3(
  file: File,
  kind: MediaKindName,
  owner?: { ownerType: string; ownerId: string },
): Promise<UploadOutcome> {
  // A courtesy pre-check so an obviously-wrong file fails instantly. The server
  // repeats it, and HeadObject verifies the real object afterwards.
  const local = validateUpload(kind, file.type, file.size)
  if (!local.ok) {
    const limitMb = Math.round((MEDIA_POLICY[kind]?.maxBytes ?? 0) / (1024 * 1024))
    return {
      error:
        local.refusal === "too-large"
          ? `File must be under ${limitMb} MB.`
          : local.refusal === "unsupported-type"
            ? "That file type is not allowed."
            : "That file was refused.",
    }
  }

  const intent = await createUploadIntent({
    kind,
    mimeType: file.type,
    sizeBytes: file.size,
    ownerType: owner?.ownerType,
    ownerId: owner?.ownerId,
  })
  if (!intent.ok) return { error: intent.error }

  try {
    // The Content-Type must match what was signed, or S3 rejects the PUT.
    const response = await fetch(intent.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": intent.contentType },
      body: file,
    })
    if (!response.ok) {
      return { error: "The upload was rejected by storage. Try again." }
    }
  } catch {
    // The asset stays PENDING and is swept later; nothing is left half-published.
    return { error: "The upload failed. Check your connection and try again." }
  }

  const finalized = await finalizeUpload(intent.assetId)
  if (!finalized.ok) return { error: finalized.error }

  return { url: finalized.url, assetId: finalized.assetId }
}
