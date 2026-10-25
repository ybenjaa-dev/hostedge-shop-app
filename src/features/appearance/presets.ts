import type { Settings } from "@/lib/settings";

type Branding = Settings["branding"];
export type StylePreset = { name: string; primary: string; secondary: string; accent: string; buttonStyle?: Branding["buttonStyle"] };

/** One-click colour palettes for Appearance → Branding. Every primary is dark enough for white text. */
export const PALETTES: StylePreset[] = [
  { name: "Ocean", primary: "#0e7490", secondary: "#0f172a", accent: "#f59e0b" },
  { name: "Forest", primary: "#166534", secondary: "#14231a", accent: "#eab308" },
  { name: "Terracotta", primary: "#b4532a", secondary: "#2f3a2a", accent: "#6b7f56" },
  { name: "Midnight", primary: "#1d4ed8", secondary: "#0b1220", accent: "#22d3ee" },
  { name: "Plum", primary: "#6b2a5a", secondary: "#1d1418", accent: "#b58a4e" },
  { name: "Rose", primary: "#be185d", secondary: "#3b0a1f", accent: "#fbbf24" },
  { name: "Charcoal", primary: "#111111", secondary: "#0d0d0d", accent: "#c6ff3d", buttonStyle: "square" },
  { name: "Coral", primary: "#e0483b", secondary: "#1e2a4a", accent: "#ffc933", buttonStyle: "pill" },
];

export type FontPair = { name: string; latin: string; arabic: string };
export const FONT_PAIRS: FontPair[] = [
  { name: "Clean", latin: "Inter", arabic: "Cairo" },
  { name: "Friendly", latin: "Poppins", arabic: "Tajawal" },
  { name: "Modern", latin: "DM Sans", arabic: "IBM Plex Sans Arabic" },
  { name: "Rounded", latin: "Outfit", arabic: "Almarai" },
  { name: "Editorial", latin: "Jost", arabic: "Readex Pro" },
];
