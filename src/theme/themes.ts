/* eslint-disable @typescript-eslint/no-explicit-any */
export type ThemeKey = "light" | "dark";

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
  dark: {
    key: "dark",
    name: "Studio Dark",
    background: "#0A0A0B",
    card: "bg-[rgba(255,255,255,0.03)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.06)] shadow-2xl",
    primary: "from-[#3B82F6] to-[#1D4ED8]", // Professional Blue/Indigo
    accent: "text-[#3B82F6]",
    text: "text-white",
    muted: "text-[#71717A]",
    radius: "rounded-[24px]",
  },
  light: {
    key: "light",
    name: "Studio Light",
    background: "#FFFFFF", // Pure White
    card: "bg-white border border-slate-200/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)]",
    primary: "from-[#2563eb] to-[#3b82f6]", // Professional Blue
    accent: "text-blue-600",
    text: "text-[#0F172A]", // Dark Navy/Slate for better contrast than pure black
    muted: "text-[#64748B]",
    radius: "rounded-[40px]",
  },
};