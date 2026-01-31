import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, LogOut, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { THEMES, ThemeKey } from "@/theme/themes";

type Props = {
  currentTheme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
};

const InfluencerNavbar = ({ currentTheme, onThemeChange }: Props) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LEFT */}
        <h1 className="text-lg font-bold text-white tracking-wide">
          DotFluence
        </h1>

        {/* RIGHT */}
        <div className="flex items-center gap-4 relative">
          <NotificationBell />

          {/* THEME SWITCHER */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen((p) => !p)}
            >
              <Palette className="h-5 w-5 text-white" />
            </Button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-44 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden"
                >
                  {Object.values(THEMES).map((theme) => (
                    <button
                      key={theme.key}
                      onClick={() => {
                        onThemeChange(theme.key);
                        setOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between
                        hover:bg-white/10 transition ${
                          currentTheme === theme.key
                            ? "text-white"
                            : "text-white/70"
                        }`}
                    >
                      {theme.name}
                      {currentTheme === theme.key && (
                        <Check className="h-4 w-4 text-green-400" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LOGOUT */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InfluencerNavbar;
