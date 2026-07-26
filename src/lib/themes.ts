/** Selectable visual themes (offline, stored in localStorage). */

export type ThemeId = "candy" | "bonanza" | "neon" | "plain";

export type Theme = {
  id: ThemeId;
  name: string;
  desc: string;
  /** class applied to the game root */
  className: string;
  /** small preview swatches */
  swatch: string[];
};

export const THEMES: Theme[] = [
  {
    id: "candy",
    name: "Şeker Diyarı",
    desc: "Pastel şeker dünyası",
    className: "theme-candy",
    swatch: ["#ff5d8f", "#ffd166", "#43d17a"],
  },
  {
    id: "bonanza",
    name: "Meyve Bahçesi",
    desc: "Canlı mor & pembe",
    className: "theme-bonanza",
    swatch: ["#b14aff", "#ff3d7f", "#ffe14d"],
  },
  {
    id: "neon",
    name: "Neon Gece",
    desc: "Karanlıkta parlayan",
    className: "theme-neon",
    swatch: ["#00f5d4", "#ff006e", "#fee440"],
  },
  {
    id: "plain",
    name: "Klasik Sade",
    desc: "Şekersiz, düz bloklar",
    className: "theme-plain",
    swatch: ["#3b82f6", "#64748b", "#0f172a"],
  },
];

export const THEME_KEY = "cbb_theme";

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
