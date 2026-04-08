export type PortfolioThemeKey = "cyberpunk" | "minimal_studio" | "editorial_vogue" | "default";

export interface PortfolioThemeConfig {
  key: PortfolioThemeKey;
  name: string;
  uiThemeKey: "dark" | "light"; // maps to LiveMediaKit's base light/dark mode for default lucide icons
  background: string;
  text: string;
  muted: string;
  border: string;
  card: string;
  cardHover: string;
  input: string;
  inputFocus: string;
  radius: string;
  accent: string;
  activeTab: string;
  inactiveTab: string;
  fontFamily: string; // custom font family class
  heroGlow?: string;
  buttonClass: string;
}

export const PORTFOLIO_THEMES: Record<PortfolioThemeKey, PortfolioThemeConfig> = {
  default: {
    key: "default",
    name: "Dotfluence Default",
    uiThemeKey: "dark",
    background: "#050505",
    text: "text-white",
    muted: "text-white/60",
    border: "border-white/10",
    card: "bg-white/5 border-white/10",
    cardHover: "hover:bg-white/10",
    input: "bg-white/5 border-white/10 text-white placeholder:text-white/40",
    inputFocus: "focus:border-blue-500 focus:bg-white/10",
    radius: "rounded-2xl",
    accent: "text-blue-500",
    activeTab: "bg-white/10 text-white",
    inactiveTab: "text-white/60 hover:text-white hover:bg-white/5",
    fontFamily: "font-sans",
    buttonClass: "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]",
  },
  cyberpunk: {
    key: "cyberpunk",
    name: "Cyberpunk",
    uiThemeKey: "dark",
    background: "#05000a",
    text: "text-white",
    muted: "text-fuchsia-200/60",
    border: "border-fuchsia-500/20",
    card: "bg-black/40 border-fuchsia-500/20 backdrop-blur-xl shadow-[inset_0_0_20px_rgba(217,70,239,0.05)]",
    cardHover: "hover:bg-fuchsia-950/20 hover:border-fuchsia-500/40",
    input: "bg-black/50 border-fuchsia-500/20 text-white placeholder:text-fuchsia-200/40",
    inputFocus: "focus:border-fuchsia-500 focus:bg-fuchsia-950/30",
    radius: "rounded-xl",
    accent: "text-fuchsia-500",
    activeTab: "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30",
    inactiveTab: "text-fuchsia-200/60 hover:text-fuchsia-300 hover:bg-fuchsia-500/10",
    fontFamily: "font-['Outfit']",
    heroGlow: "shadow-[0_0_80px_rgba(217,70,239,0.3)]",
    buttonClass: "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-[0_0_30px_rgba(217,70,239,0.6)] font-black uppercase tracking-widest",
  },
  minimal_studio: {
    key: "minimal_studio",
    name: "Minimal Studio",
    uiThemeKey: "light",
    background: "#ffffff",
    text: "text-black",
    muted: "text-black/50",
    border: "border-black/5",
    card: "bg-white border-black/10 shadow-sm",
    cardHover: "hover:border-black/20 hover:shadow-md",
    input: "bg-transparent border-black/10 text-black placeholder:text-black/30",
    inputFocus: "focus:border-amber-500 focus:ring-1 focus:ring-amber-500",
    radius: "rounded-none",
    accent: "text-amber-500",
    activeTab: "bg-black text-white",
    inactiveTab: "text-black/50 hover:text-black hover:bg-black/5",
    fontFamily: "font-sans font-light tracking-wide",
    heroGlow: "shadow-2xl",
    buttonClass: "bg-amber-500 hover:bg-amber-400 text-black shadow-lg uppercase tracking-widest font-black",
  },
  editorial_vogue: {
    key: "editorial_vogue",
    name: "Editorial Vogue",
    uiThemeKey: "dark",
    background: "#1c1c1c",
    text: "text-[#FAF9F6]",
    muted: "text-[#FAF9F6]/60",
    border: "border-[#D4AF37]/20",
    card: "bg-[#252525] border border-[#D4AF37]/10",
    cardHover: "hover:border-[#D4AF37]/30",
    input: "bg-transparent border-[#D4AF37]/30 text-[#FAF9F6] placeholder:text-[#FAF9F6]/40",
    inputFocus: "focus:border-[#D4AF37]",
    radius: "rounded-sm",
    accent: "text-[#D4AF37]",
    activeTab: "bg-[#D4AF37] text-black",
    inactiveTab: "text-[#FAF9F6]/60 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10",
    fontFamily: "font-['Playfair_Display']",
    heroGlow: "shadow-[0_0_40px_rgba(212,175,55,0.15)]",
    buttonClass: "bg-[#D4AF37] hover:bg-[#C5A017] text-black font-semibold tracking-[0.2em] uppercase",
  }
};
