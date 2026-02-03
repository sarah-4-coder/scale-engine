/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { THEMES, ThemeConfig, ThemeKey } from "./themes";

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
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // 1️⃣ Try user preference FIRST
        const { data: pref } = await supabase
          .from("user_preferences")
          .select("ui_theme")
          .eq("user_id", user.id)
          .maybeSingle<{ ui_theme: string | null }>();

        if (pref && pref.ui_theme && THEMES[pref.ui_theme as ThemeKey]) {
          const selectedTheme = pref.ui_theme as ThemeKey;
          setThemeKey(selectedTheme);
          setTheme(THEMES[selectedTheme]);
          setLoading(false);
          return;
        }

        // 2️⃣ Fallback → infer from niche (soft)
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
      } catch (error) {
        console.error("Error loading theme:", error);
        // Fallback to default theme on error
        setThemeKey("default");
        setTheme(THEMES.default);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) return;

      // Update UI immediately for instant feedback
      setThemeKey(key);
      setTheme(THEMES[key]);

      // UPSERT preference in background
      await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          ui_theme: key,
          updated_at: new Date().toISOString(),
        } as any);
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