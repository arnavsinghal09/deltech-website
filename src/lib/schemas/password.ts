import { z } from "zod"

// The single source of truth for password rules. Before this the "at least 8"
// rule lived inline in signup/actions.ts and was duplicated by a comment in
// scripts/set-password.ts, with nothing keeping them in step.
export const PASSWORD_MIN = 8

// Upper bound because scrypt hashes whatever it is handed, so an unbounded
// field is a free CPU-burn vector on an endpoint that has no rate limit yet.
export const PASSWORD_MAX = 200

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, "passwordTooShort")
  .max(PASSWORD_MAX, "passwordTooLong")

export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  })

// Returns an error *code* (a key under STRINGS.auth) or null. Codes rather
// than sentences so the server never has to know how the client phrases them.
export function validatePassword(password: unknown, confirm?: unknown): string | null {
  // Input comes from FormData, where a missing field is null and a duplicated
  // one is an array. Zod reports those as a type error rather than as the
  // length message, so collapse them to the same "too short" code the user
  // would expect from an empty box.
  if (typeof password !== "string") return "passwordTooShort"

  const parsed = passwordSchema.safeParse(password)
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "passwordTooShort"
  if (confirm !== undefined && password !== confirm) return "passwordMismatch"
  return null
}
