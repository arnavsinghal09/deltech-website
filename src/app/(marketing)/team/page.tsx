import { prisma } from "@/lib/prisma"
import { FadeUp, StaggerList, StaggerItem } from "../_components/motion"
import { t } from "@/content/strings"

export const metadata = {
  title: "Team — DelTech MUN",
  description: "The people behind DelTech MUN.",
}

// Member edits in /admin/team must show up without a redeploy.
export const revalidate = 0

export default async function TeamPage() {
  const members = await prisma.member.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <FadeUp className="mb-14 text-center">
        <p className="eyebrow">{t("brand.name")}</p>
        <h1 className="display mt-3 text-4xl md:text-5xl">The Team</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          The heart and soul of the society — the people who make the conference happen.
        </p>
        <div className="mx-auto mt-8 flex w-40 items-center gap-3">
          <div className="rule-gold flex-1" />
          <span aria-hidden className="text-[10px] text-gold-500">◆</span>
          <div className="rule-gold flex-1" />
        </div>
      </FadeUp>

      {members.length === 0 ? (
        <p className="text-center text-muted-foreground">Team roster coming soon.</p>
      ) : (
        <StaggerList className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {members.map((m) => {
            const socials = (m.socials as { instagram?: string; linkedin?: string } | null) ?? {}
            return (
              <StaggerItem key={m.id}>
                <div className="editorial-card group flex h-full flex-col items-center p-6 text-center transition-colors hover:border-primary/50">
                  {m.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.imageUrl}
                      alt={m.name}
                      className="aspect-square w-full max-w-40 rounded-sm border border-foreground/15 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex aspect-square w-full max-w-40 items-center justify-center rounded-sm border border-foreground/15 bg-secondary">
                      <span className="display text-3xl text-gold-500">
                        {m.name
                          .split(" ")
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")}
                      </span>
                    </div>
                  )}
                  <p className="mt-5 font-heading text-lg leading-tight">{m.name}</p>
                  <p className="eyebrow mt-1.5 text-[10px]">{m.designation}</p>
                  {(socials.instagram || socials.linkedin) && (
                    <div className="mt-3 flex gap-2">
                      {socials.instagram && (
                        <a
                          href={socials.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${m.name} on Instagram`}
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                        >
                          IG
                        </a>
                      )}
                      {socials.linkedin && (
                        <a
                          href={socials.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${m.name} on LinkedIn`}
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                        >
                          in
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </StaggerItem>
            )
          })}
        </StaggerList>
      )}
    </div>
  )
}
