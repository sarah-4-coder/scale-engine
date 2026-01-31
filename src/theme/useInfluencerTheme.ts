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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // 1️⃣ Try user preference
      const { data: pref } = await supabase
        .from("user_preferences")
        .select("ui_theme")
        .eq("user_id", user.id)
        .single<{ ui_theme?: string }>();

      if (pref && pref.ui_theme && THEMES[pref.ui_theme as ThemeKey]) {
        setThemeKey(pref.ui_theme as ThemeKey);
        setTheme(THEMES[pref.ui_theme as ThemeKey]);
        setLoading(false);
        return;
      }

      // 2️⃣ Fallback → infer from niche (soft)
      const { data: profile } = await supabase
        .from("influencer_profiles")
        .select("niches")
        .eq("user_id", user.id)
        .single<{ niches?: string[] }>();

      let primary: string | undefined = undefined;
      if (profile && profile.niches && Array.isArray(profile.niches) && profile.niches.length > 0) {
        primary = profile.niches[0]?.toLowerCase();
      }

      let inferred: ThemeKey = "default";
      if (primary?.includes("fashion")) inferred = "fashion";
      else if (primary?.includes("tech")) inferred = "tech";
      else if (primary?.includes("fitness")) inferred = "fitness";

      setThemeKey(inferred);
      setTheme(THEMES[inferred]);
      setLoading(false);
    };

    loadTheme();
  }, []);

  /* -----------------------------
     CHANGE THEME (USER ACTION)
  ----------------------------- */
  const changeTheme = async (key: ThemeKey) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setThemeKey(key);
    setTheme(THEMES[key]);

    // UPSERT preference
    await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        ui_theme: key,
        updated_at: new Date().toISOString(),
      } as any);
  };

  return {
    theme,
    themeKey,
    loading,
    setTheme: changeTheme,
  };
};
