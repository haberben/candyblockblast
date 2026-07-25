import React from "react";
import { Candy } from "./Candy";
import { type CandyId } from "@/lib/game";

type HudProps = {
  score: number;
  targetCandy: CandyId;
  collected: number;
  targetCount: number;
  moves: number;
  level: number;
  gameMode: "levels" | "endless";
  best: number;
  combo: number;
};

export function Hud({
  score,
  targetCandy,
  collected,
  targetCount,
  moves,
  level,
  gameMode,
  best,
  combo,
}: HudProps) {
  if (gameMode === "endless") {
    return (
      <div className="flex flex-col items-center w-full gap-2">
        {/* Three stat boxes */}
        <div className="grid grid-cols-3 w-full gap-2">
          {/* Score */}
          <div
            className="flex flex-col items-center justify-center p-3 rounded-2xl text-panel-foreground"
            style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85 font-display">PUAN</span>
            <span className="text-xl font-black font-display text-outline" style={{ color: "var(--gold)" }}>
              {score.toLocaleString("tr-TR")}
            </span>
          </div>

          {/* Endless Best */}
          <div
            className="flex flex-col items-center justify-center p-3 rounded-2xl text-panel-foreground"
            style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85 font-display">REKOR</span>
            <span className="text-xl font-black font-display text-outline" style={{ color: "var(--gold)" }}>
              {best.toLocaleString("tr-TR")}
            </span>
          </div>

          {/* Combo */}
          <div
            className="flex flex-col items-center justify-center p-3 rounded-2xl text-panel-foreground"
            style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85 font-display">KOMBO</span>
            <span className="text-xl font-black font-display text-outline" style={{ color: "var(--gold)" }}>
              {combo > 0 ? `${combo}x` : "—"}
            </span>
          </div>
        </div>

        {/* Endless badge */}
        <div
          className="rounded-full px-5 py-1 text-xs font-black font-display text-outline tracking-wider"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-candy)", color: "var(--primary-foreground)" }}
        >
          SINIRSIZ MOD
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full gap-2">
      {/* Three stat boxes */}
      <div className="grid grid-cols-3 w-full gap-2">
        {/* Score */}
        <div
          className="flex flex-col items-center justify-center p-3 rounded-2xl text-panel-foreground"
          style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85 font-display">PUAN</span>
          <span className="text-xl font-black font-display text-outline" style={{ color: "var(--gold)" }}>
            {score.toLocaleString("tr-TR")}
          </span>
        </div>

        {/* Target */}
        <div
          className="flex flex-col items-center justify-center p-2 rounded-2xl text-panel-foreground relative min-w-0"
          style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85 font-display mb-1">HEDEF</span>
          <div className="flex items-center gap-1.5 justify-center w-full">
            <div className="size-6 shrink-0 relative">
              <Candy id={targetCandy} />
            </div>
            <span className="text-base font-black font-display text-outline" style={{ color: "var(--gold)" }}>
              {collected}/{targetCount}
            </span>
          </div>
        </div>

        {/* Moves */}
        <div
          className="flex flex-col items-center justify-center p-3 rounded-2xl text-panel-foreground"
          style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85 font-display">HAMLE</span>
          <span className="text-xl font-black font-display text-outline" style={{ color: "var(--gold)" }}>
            {moves}
          </span>
        </div>
      </div>

      {/* Level Badge */}
      <div
        className="rounded-full px-5 py-1 text-xs font-black font-display text-outline tracking-wider"
        style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-candy)", color: "var(--primary-foreground)" }}
      >
        SEVİYE {level}
      </div>
    </div>
  );
}
