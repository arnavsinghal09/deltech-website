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
      <FadeUp className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {t("brand.name")}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">The Team</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          The heart and soul of the society — the people who make the conference happen.
        </p>
      </FadeUp>

      {members.length === 0 ? (
        <p className="text-center text-muted-foreground">Team roster coming soon.</p>
      ) : (
        <StaggerList className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {members.map((m) => {
            const socials = (m.socials as { instagram?: string; linkedin?: string } | null) ?? {}
            return (
              <StaggerItem key={m.id}>
                <div className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  {/* soft glow accent on hover */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {m.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.imageUrl}
                      alt={m.name}
                      className="size-24 rounded-full object-cover ring-2 ring-border transition-all duration-300 group-hover:ring-primary/60"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ring-border">
                      {m.name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")}
                    </div>
                  )}
                  <p className="mt-4 font-semibold leading-tight">{m.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {m.designation}
                  </p>
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
