/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { THEMES, ThemeConfig, ThemeKey } from "./themes";

const THEME_STORAGE_KEY = 'dotfluence_influencer_theme';

export const useInfluencerTheme = () => {
  const [themeKey, setThemeKey] = useState<ThemeKey>("default");
  const [theme, setTheme] = useState<ThemeConfig>(THEMES.default);
  const [loading, setLoading] = useState(true);

  /* -----------------------------
     LOAD THEME (ONCE)
  ----------------------------- */
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // 1️⃣ FIRST: Check localStorage (instant, no DB call)
        const cachedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (cachedTheme && THEMES[cachedTheme as ThemeKey]) {
          const selectedTheme = cachedTheme as ThemeKey;
          setThemeKey(selectedTheme);
          setTheme(THEMES[selectedTheme]);
          setLoading(false);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // 2️⃣ Try user preference from DB
        const { data: pref } = await supabase
          .from("user_preferences")
          .select("ui_theme")
          .eq("user_id", user.id)
          .maybeSingle<{ ui_theme: string | null }>();

        if (pref && pref.ui_theme && THEMES[pref.ui_theme as ThemeKey]) {
          const selectedTheme = pref.ui_theme as ThemeKey;
          setThemeKey(selectedTheme);
          setTheme(THEMES[selectedTheme]);
          // Cache in localStorage
          localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
          setLoading(false);
          return;
        }

        // 3️⃣ Fallback → infer from niche (soft)
        const { data: profile } = await supabase
          .from("influencer_profiles")
          .select("niches")
          .eq("user_id", user.id)
          .maybeSingle<{ niches: string[] | null }>();

        let inferred: ThemeKey = "default";
        
        if (profile && profile.niches && Array.isArray(profile.niches) && profile.niches.length > 0) {
          const primary = profile.niches[0]?.toLowerCase();
          
          if (primary?.includes("fashion")) {
            inferred = "fashion";
          } else if (primary?.includes("tech")) {
            inferred = "tech";
          } else if (primary?.includes("fitness")) {
            inferred = "fitness";
          }
        }

        setThemeKey(inferred);
        setTheme(THEMES[inferred]);
        // Cache in localStorage
        localStorage.setItem(THEME_STORAGE_KEY, inferred);
      } catch (error) {
        console.error("Error loading theme:", error);
        // Fallback to default theme on error
        setThemeKey("default");
        setTheme(THEMES.default);
        localStorage.setItem(THEME_STORAGE_KEY, "default");
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  /* -----------------------------
     CHANGE THEME (USER ACTION)
  ----------------------------- */
  const changeTheme = async (key: ThemeKey) => {
    try {
      // Update UI immediately for instant feedback
      setThemeKey(key);
      setTheme(THEMES[key]);
      // Cache in localStorage immediately
      localStorage.setItem(THEME_STORAGE_KEY, key);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) return;

      // UPSERT preference in background (non-blocking)
      Promise.resolve(
        supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            ui_theme: key,
            updated_at: new Date().toISOString(),
          } as any)
      )
        .then(() => {
          console.log('Theme saved to database');
        })
        .catch((error) => {
          console.error("Error saving theme to DB:", error);
        });
    } catch (error) {
      console.error("Error changing theme:", error);
    }
  };

  return {
    theme,
    themeKey,
    loading,
    setTheme: changeTheme,
  };
};