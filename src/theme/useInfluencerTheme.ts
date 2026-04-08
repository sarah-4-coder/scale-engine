import { useInfluencerThemeContext } from "@/contexts/InfluencerThemeContext";

/**
 * Convenience hook that wraps the global InfluencerThemeContext.
 * Ensures consistent theme state across all pages.
 */
export const useInfluencerTheme = () => {
  const { theme, themeKey, setTheme, loading } = useInfluencerThemeContext();
  
  return {
    theme,
    themeKey,
    setTheme,
    loading
  };
};