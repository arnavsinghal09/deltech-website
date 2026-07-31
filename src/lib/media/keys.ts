// Object-key construction and upload validation. Pure: no AWS SDK, no Prisma, so
// scripts/check-media-keys.ts can exercise every hostile filename without network
// or credentials.
//
// The rule that matters: a user-supplied filename NEVER reaches the object key. The
// extension is derived from the validated MIME type and the name from a cuid, so
// path traversal, unicode tricks, absurd lengths and double extensions are all
// structurally impossible rather than filtered.

export type MediaKindName = "POST_IMAGE" | "POST_COVER" | "MEMBER_IMAGE" | "CANDIDATE_DOC"

// MIME → canonical extension. This map is also the allowlist: anything absent is
// refused, so a new type has to be added deliberately.
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
}

const DOC_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
}

export interface KindPolicy {
  mimeTypes: Record<string, string>
  maxBytes: number
  // Public objects get a stable URL; signed ones are fetched through a short-lived
  // signature. Candidate documents are never public.
  visibility: "PUBLIC" | "SIGNED"
  prefix: string
}

export const MEDIA_POLICY: Record<MediaKindName, KindPolicy> = {
  POST_IMAGE: { mimeTypes: IMAGE_TYPES, maxBytes: 8 * 1024 * 1024, visibility: "PUBLIC", prefix: "posts" },
  POST_COVER: { mimeTypes: IMAGE_TYPES, maxBytes: 8 * 1024 * 1024, visibility: "PUBLIC", prefix: "covers" },
  MEMBER_IMAGE: { mimeTypes: IMAGE_TYPES, maxBytes: 4 * 1024 * 1024, visibility: "PUBLIC", prefix: "team" },
  // Applicant material is personal data: signed access only.
  CANDIDATE_DOC: {
    mimeTypes: { ...IMAGE_TYPES, ...DOC_TYPES },
    maxBytes: 10 * 1024 * 1024,
    visibility: "SIGNED",
    prefix: "recruitment",
  },
}

export type UploadRefusal =
  | "unknown-kind"
  | "unsupported-type"
  | "too-large"
  | "empty-file"

export interface UploadValidation {
  ok: boolean
  refusal?: UploadRefusal
  extension?: string
  policy?: KindPolicy
}

export function validateUpload(
  kind: string,
  mimeType: string,
  sizeBytes: number,
): UploadValidation {
  const policy = MEDIA_POLICY[kind as MediaKindName]
  if (!policy) return { ok: false, refusal: "unknown-kind" }

  // Browsers append parameters ("image/jpeg; charset=binary") and vary case.
  const normalized = mimeType.split(";")[0].trim().toLowerCase()
  const extension = policy.mimeTypes[normalized]
  if (!extension) return { ok: false, refusal: "unsupported-type", policy }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, refusal: "empty-file", policy }
  }
  if (sizeBytes > policy.maxBytes) return { ok: false, refusal: "too-large", policy }

  return { ok: true, extension, policy }
}

// A safe object key. Every segment is either a fixed literal, a validated id, or a
// derived extension: no user input is interpolated, so there is nothing to escape.
export function buildObjectKey(args: {
  kind: MediaKindName
  uploaderId: string
  assetId: string
  extension: string
}): string {
  const policy = MEDIA_POLICY[args.kind]
  // Defensive: ids come from cuid() and the session, but a key is security-relevant
  // enough to sanitise rather than trust.
  const uploader = safeSegment(args.uploaderId)
  const asset = safeSegment(args.assetId)
  const ext = args.extension.replace(/[^a-z0-9]/g, "").slice(0, 8)
  return `${policy.prefix}/${uploader}/${asset}.${ext}`
}

// Collapses anything that isn't an unreserved character. Rejects traversal ("..",
// "/"), NUL, unicode direction marks and absurd lengths in one pass.
export function safeSegment(input: string): string {
  const cleaned = input.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64)
  // An id that sanitises to nothing would collapse two objects onto one key.
  return cleaned.length > 0 ? cleaned : "unknown"
}

// The public URL for a PUBLIC object. A configured CDN/base URL wins; otherwise the
// regional S3 endpoint. Never used for SIGNED objects.
export function publicUrlFor(
  key: string,
  { bucket, region, baseUrl }: { bucket: string; region: string; baseUrl?: string },
): string {
  if (baseUrl) return `${baseUrl.replace(/\/+$/, "")}/${key}`
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

export const PRESIGN_TTL_SECONDS = 300

// Uploads left PENDING longer than this are abandoned: the object (if any) and the
// row are swept by /api/cron/media-sweep.
export const ORPHAN_AFTER_MS = 24 * 60 * 60 * 1000
