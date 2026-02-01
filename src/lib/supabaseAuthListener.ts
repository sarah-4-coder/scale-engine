import { supabase } from "@/integrations/supabase/client";  

let initialized = false;

export const initSupabaseAuthListener = () => {
  if (initialized) return;
  initialized = true;

  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      window.location.replace("https://dotfluence.in");
    }
  });
};
