import { z } from "zod";

export const ContentSchema = z.object({
  registrationOpen: z.boolean().default(false),
  registrationClosedMessage: z
    .string()
    .default("Registrations are currently closed. Check back soon."),
  conferenceDates: z.string().default(""),
  venue: z.string().default(""),
  landingHero: z
    .object({
      title: z.string().default("DelTech MUN"),
      subtitle: z.string().default(""),
      ctaLabel: z.string().default("Register Now"),
    })
    .default({ title: "DelTech MUN", subtitle: "", ctaLabel: "Register Now" }),
  agendasBlurb: z.string().default(""),
  awards: z.array(z.string()).default([]),
  queryContacts: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        phone: z.string(),
      }),
    )
    .default([]),
  paymentProvider: z.enum(["upi_qr", "razorpay"]).default("upi_qr"),
  accommodationNote: z.string().default(""),
  blogIntro: z.string().default(""),
});

export type Content = z.infer<typeof ContentSchema>;

export const DEFAULTS: Content = ContentSchema.parse({});
