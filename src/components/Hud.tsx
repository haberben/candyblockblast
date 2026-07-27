import { Candy } from "./Candy";
import type { CandyId } from "@/lib/game";
import type { Mode } from "@/lib/modes";

export function Hud({
  mode,
  score,
  best,
  targetCandy,
  collected,
  targetCount,
  moves,
  level,
  timeLeft,
  combo,
}: {
  mode: Mode;
  score: number;
  best: number;
  targetCandy: CandyId;
  collected: number;
  targetCount: number;
  moves: number;
  level: number;
  timeLeft: number;
  combo: number;
}) {
  const pct = Math.min(100, (collected / targetCount) * 100);
  const mm = Math.floor(timeLeft / 60);
  const ss = String(timeLeft % 60).padStart(2, "0");
  const low = mode === "time" && timeLeft <= 10;

  return (
    <div
      className="relative flex items-stretch gap-2 rounded-3xl px-3 py-2 text-panel-foreground"
      style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-panel)" }}
    >
      <div className="flex-1 text-center">
        <div className="font-display text-[11px] font-extrabold tracking-wider uppercase opacity-80">
          Puan
        </div>
        <div className="font-display text-2xl leading-tight font-extrabold tabular-nums">
          {score.toLocaleString("tr-TR")}
        </div>
        <div className="font-display text-[10px] font-bold opacity-70 tabular-nums">
          rekor {best.toLocaleString("tr-TR")}
        </div>
      </div>

      {mode === "level" ? (
        <div className="flex-[1.3] text-center">
          <div className="font-display text-[11px] font-extrabold tracking-wider uppercase opacity-80">
            Hedef
          </div>
          <div className="mt-0.5 flex items-center justify-center gap-1.5 rounded-full bg-secondary/70 px-2 py-1">
            <Candy id={targetCandy} size={20} />
            <span className="font-display text-base leading-none font-extrabold tabular-nums">
              {Math.min(collected, targetCount)}/{targetCount}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary/70">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: "var(--gradient-gold)" }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-[1.3] text-center">
          <div className="font-display text-[11px] font-extrabold tracking-wider uppercase opacity-80">
            {mode === "time" ? "Süre" : "Kombo"}
          </div>
          <div
            className={`font-display text-3xl leading-tight font-extrabold tabular-nums ${low ? "anim-pulse" : ""}`}
            style={low ? { color: "var(--destructive)" } : undefined}
          >
            {mode === "time" ? `${mm}:${ss}` : `x${combo}`}
          </div>
        </div>
      )}

      <div className="flex-1 text-center">
        <div className="font-display text-[11px] font-extrabold tracking-wider uppercase opacity-80">
          {mode === "level" ? "Hamle" : "Zincir"}
        </div>
        <div className="font-display text-2xl leading-tight font-extrabold tabular-nums">
          {mode === "level" ? moves : `x${combo}`}
        </div>
      </div>

      <div
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 font-display text-[11px] font-extrabold whitespace-nowrap text-accent-foreground"
        style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-candy)" }}
      >
        {mode === "level" ? `SEVİYE ${level}` : mode === "time" ? "ZAMANA KARŞI" : "SINIRSIZ"}
      </div>
    </div>
  );
}
