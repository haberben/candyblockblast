/** Game modes + offline record storage. */

export type Mode = "time" | "endless" | "level";

export const MODES: { id: Mode; name: string; desc: string }[] = [
  { id: "time", name: "Zamana Karşı", desc: "Süre bitmeden en yüksek puan" },
  { id: "endless", name: "Sınırsız", desc: "Yer kalmayana kadar oyna" },
  { id: "level", name: "Seviye", desc: "Hedefi topla, hamleni kolla" },
];

export const TIME_OPTIONS = [30, 60, 120, 180, 300];

export function bestKey(mode: Mode, seconds: number) {
  return mode === "time" ? `cbb_best_time_${seconds}` : `cbb_best_${mode}`;
}

export function readBest(mode: Mode, seconds: number): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(bestKey(mode, seconds)) ?? 0) || 0;
}

export function writeBest(mode: Mode, seconds: number, score: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(bestKey(mode, seconds), String(score));
}
