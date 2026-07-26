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
  gameMode: "levels" | "endless" | "timeattack";
  best: number;
  combo: number;
  timeLeft?: number;
  timeLimit?: number;
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export const Hud = React.memo(function Hud({
  score,
  targetCandy,
  collected,
  targetCount,
  moves,
  level,
  gameMode,
  best,
  combo,
  timeLeft = 60,
  timeLimit = 60,
}: HudProps) {
  if (gameMode === "timeattack") {
    const isLowTime = timeLeft <= 10;
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

          {/* Time Left */}
          <div
            className={`flex flex-col items-center justify-center p-3 rounded-2xl text-panel-foreground transition-all duration-300 ${
              isLowTime ? "animate-pulse border-2 border-red-500 bg-red-950/70" : ""
            }`}
            style={{
              background: isLowTime ? undefined : "var(--gradient-hud)",
              boxShadow: "var(--shadow-candy)",
            }}
          >
            <span className={`text-[10px] font-extrabold uppercase tracking-wider opacity-85 font-display ${isLowTime ? "text-red-400" : ""}`}>
              SÜRE
            </span>
            <span
              className="text-xl font-black font-display text-outline"
              style={{ color: isLowTime ? "oklch(0.63 0.23 20)" : "var(--gold)" }}
            >
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Time Attack Best */}
          <div
            className="flex flex-col items-center justify-center p-3 rounded-2xl text-panel-foreground"
            style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85 font-display">REKOR</span>
            <span className="text-xl font-black font-display text-outline" style={{ color: "var(--gold)" }}>
              {best.toLocaleString("tr-TR")}
            </span>
          </div>
        </div>

        {/* Mode badge */}
        <div
          className="rounded-full px-5 py-1 text-xs font-black font-display text-outline tracking-wider"
          style={{
            background: "linear-gradient(135deg, oklch(0.6 0.22 290), oklch(0.45 0.2 280))",
            boxShadow: "var(--shadow-candy)",
            color: "var(--primary-foreground)",
          }}
        >
          ZAMANA KARŞI ({formatTime(timeLimit)})
        </div>
      </div>
    );
  }

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
});
