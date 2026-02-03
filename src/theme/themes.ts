/* eslint-disable @typescript-eslint/no-explicit-any */
export type ThemeKey = "default" | "fashion" | "tech" | "fitness";

export type ThemeConfig = {
  [x: string]: any;
  key: ThemeKey;
  name: string;
  background: string;
  card: string;
  primary: string;
  accent: string;
  text: string;
  muted: string;
  radius: string;
};

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  default: {
    key: "default",
    name: "Default",
    background:
      "radial-gradient(circle at 20% 20%, #ff7a18, transparent 40%), radial-gradient(circle at 80% 80%, #6366f1, transparent 40%), #020617",
    card: "bg-black/40 backdrop-blur-xl border border-white/10",
    primary: "from-orange-500 to-indigo-500",
    accent: "text-orange-400",
    text: "text-white",
    muted: "text-white/70",
    radius: "rounded-2xl",
  },

  fashion: {
    key: "fashion",
    name: "Fashion",
    // Updated to darker gradient for better text contrast
    background: "radial-gradient(circle at 20% 20%, #ebabf3, transparent 40%), radial-gradient(circle at 80% 80%, #e946b8, transparent 40%), #020617",
    // Updated card with darker background and better borders
    card: "bg-neutral-900/80 backdrop-blur-xl border border-neutral-600/30 text-white shadow-2xl",
    // Updated primary gradient
    primary: "from-neutral-400 to-neutral-600",
    // Updated accent for better visibility
    accent: "text-amber-300",
    // Updated text colors for better contrast
    text: "text-neutral-100",
    muted: "text-neutral-300",
    radius: "rounded-3xl",
  },

  tech: {
    key: "tech",
    name: "Tech",
    background:
      "radial-gradient(circle at 20% 20%, #22d3ee, transparent 40%), radial-gradient(circle at 80% 80%, #818cf8, transparent 40%), #020617",
    card: "bg-black/50 backdrop-blur-xl border border-cyan-400/20",
    primary: "from-cyan-400 to-indigo-500",
    accent: "text-cyan-300",
    text: "text-white",
    muted: "text-white/60",
    radius: "rounded-xl",
  },

  fitness: {
    key: "fitness",
    name: "Fitness",
    background:
      "radial-gradient(circle at 30% 30%, #dc2626, transparent 40%), radial-gradient(circle at 70% 70%, #22c55e, transparent 40%), #020617",
    card: "bg-black/60 backdrop-blur-xl border border-red-500/30",
    primary: "from-red-500 to-green-500",
    accent: "text-red-400",
    text: "text-white",
    muted: "text-white/60",
    radius: "rounded-xl",
  },
};