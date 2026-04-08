import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { THEMES, ThemeConfig, ThemeKey } from "@/theme/themes";

const THEME_STORAGE_KEY = 'dotfluence_influencer_theme';

interface InfluencerThemeContextType {
  theme: ThemeConfig;
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => Promise<void>;
  loading: boolean;
}

const InfluencerThemeContext = createContext<InfluencerThemeContextType | undefined>(undefined);

export const InfluencerThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ⚡ Synchronous initialization from localStorage to prevent "flicker"
  const getInitialTheme = (): ThemeKey => {
    if (typeof window === 'undefined') return "dark";
    const cached = localStorage.getItem(THEME_STORAGE_KEY);
    if (cached && THEMES[cached as ThemeKey]) return cached as ThemeKey;
    return "dark";
  };

  const [themeKey, setThemeKey] = useState<ThemeKey>(getInitialTheme());
  const [theme, setTheme] = useState<ThemeConfig>(THEMES[getInitialTheme()]);
  const [loading, setLoading] = useState(true);

  // Apply theme class to root element
  useEffect(() => {
    if (themeKey === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeKey]);

  // Initial load
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // 1. Check localStorage (Synchronous-ish)
        const cachedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (cachedTheme && THEMES[cachedTheme as ThemeKey]) {
          const key = cachedTheme as ThemeKey;
          setThemeKey(key);
          setTheme(THEMES[key]);
          setLoading(false);
        }

        // 2. Check DB (Asynchronous)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: pref } = await supabase
            .from("user_preferences")
            .select("ui_theme")
            .eq("user_id", user.id)
            .maybeSingle<{ ui_theme: string | null }>();

          if (pref && pref.ui_theme && THEMES[pref.ui_theme as ThemeKey]) {
            const key = pref.ui_theme as ThemeKey;
            if (key !== cachedTheme) {
              setThemeKey(key);
              setTheme(THEMES[key]);
              localStorage.setItem(THEME_STORAGE_KEY, key);
            }
          }
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  const changeTheme = async (key: ThemeKey) => {
    try {
      // Update UI immediately
      setThemeKey(key);
      setTheme(THEMES[key]);
      localStorage.setItem(THEME_STORAGE_KEY, key);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Persistence in background
      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        ui_theme: key,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error changing theme:", error);
    }
  };

  return (
    <InfluencerThemeContext.Provider value={{ theme, themeKey, setTheme: changeTheme, loading }}>
      {children}
    </InfluencerThemeContext.Provider>
  );
};

export const useInfluencerThemeContext = () => {
  const context = useContext(InfluencerThemeContext);
  if (context === undefined) {
    throw new Error("useInfluencerThemeContext must be used within an InfluencerThemeProvider");
  }
  return context;
};
