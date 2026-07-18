import { RadioTower } from "lucide-react";
import { t } from "@/content/strings";

export function DiplomaticOrbit({
  committeeCount,
  openPortfolioCount,
}: {
  committeeCount: number;
  openPortfolioCount: number;
}) {
  return (
    <div
      role="img"
      aria-label={t("marketing.orbitLabel")}
      className="diplomatic-surface noise-wash relative aspect-square w-full max-w-[38rem] overflow-hidden rounded-full"
    >
      <div className="absolute inset-[9%] rounded-full border border-foreground/15" />
      <div className="orbit-spin absolute inset-[17%] rounded-full border border-dashed border-primary/35">
        <span className="signal-pulse absolute left-[8%] top-[22%] size-3 rounded-full bg-primary" />
        <span className="signal-pulse absolute bottom-[8%] right-[30%] size-2.5 rounded-full bg-gold-500 [animation-delay:700ms]" />
      </div>
      <div className="orbit-spin-reverse absolute inset-[29%] rounded-full border border-foreground/20">
        <span className="absolute -right-2 top-1/2 size-4 -translate-y-1/2 rounded-full border-4 border-background bg-[var(--signal)]" />
      </div>
      <div className="absolute inset-[38%] flex items-center justify-center rounded-full border border-primary/45 bg-background/85 backdrop-blur">
        <span className="display text-[clamp(3rem,7vw,6.5rem)] leading-none">D</span>
      </div>

      <div className="absolute left-[9%] top-[48%] h-px w-[24%] -rotate-12 bg-foreground/25" />
      <div className="absolute right-[8%] top-[29%] h-px w-[28%] rotate-[28deg] bg-primary/35" />
      <div className="absolute bottom-[19%] left-[24%] h-px w-[25%] rotate-[58deg] bg-gold-500/40" />

      <div className="absolute left-[8%] top-[11%] rounded-full border border-foreground/20 bg-background/80 px-3 py-2 backdrop-blur">
        <p className="data-label flex items-center gap-2 text-[0.6875rem]">
          <RadioTower className="size-3.5 text-primary" />
          {t("marketing.orbitStatus")}
        </p>
      </div>
      <div className="absolute bottom-[8%] right-[7%] rounded-xl border border-foreground/20 bg-background/88 px-4 py-3 backdrop-blur">
        <p className="font-mono text-2xl font-semibold tabular-nums">{openPortfolioCount}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("marketing.openPortfolios")}
        </p>
      </div>
      <div className="absolute right-[5%] top-[8%] font-mono text-xs tabular-nums text-muted-foreground">
        28.7041° N<br />77.1025° E
      </div>
      <div className="absolute bottom-[9%] left-[9%]">
        <p className="font-mono text-2xl font-semibold tabular-nums">
          {String(committeeCount).padStart(2, "0")}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("marketing.activeCommittees")}
        </p>
      </div>
    </div>
  );
}
