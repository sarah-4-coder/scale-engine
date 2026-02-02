import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, LogOut, Check, Home } from "lucide-react";
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
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace("https://dotfluence.in");
  };

  return (
    <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LEFT - Logo/Brand */}
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg font-bold text-white tracking-wide cursor-pointer hover:text-white/80 transition-colors"
          onClick={() => navigate("/dashboard")}
        >
          DotFluence
        </motion.h1>

        {/* RIGHT - Actions */}
        <div className="flex items-center gap-2 relative">
          {/* DASHBOARD BUTTON */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              title="Dashboard"
              className="hover:bg-white/10"
            >
              <Home className="h-5 w-5 text-white" />
            </Button>
          </motion.div>

          {/* NOTIFICATIONS */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <NotificationBell />
          </motion.div>

          {/* THEME SWITCHER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen((p) => !p)}
              title="Change Theme"
              className="hover:bg-white/10"
            >
              <Palette className="h-5 w-5 text-white" />
            </Button>

            <AnimatePresence>
              {open && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-40"
                  />

                  {/* Dropdown */}
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-black/90 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs text-white/50 font-medium uppercase tracking-wider">
                        Choose Theme
                      </p>

                      {Object.values(THEMES).map((theme, index) => (
                        <motion.button
                          key={theme.key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => {
                            onThemeChange(theme.key);
                            setOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-sm flex items-center justify-between rounded-lg
                            hover:bg-white/10 transition-all duration-200 ${
                              currentTheme === theme.key
                                ? "bg-white/10 text-white"
                                : "text-white/70"
                            }`}
                        >
                          <span className="flex items-center gap-3">
                            {/* Theme color indicator */}
                            <div
                              className={`w-3 h-3 rounded-full bg-gradient-to-r ${theme.primary}`}
                            />
                            {theme.name}
                          </span>

                          {currentTheme === theme.key && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <Check className="h-4 w-4 text-green-400" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>

          {/* LOGOUT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
              className="hover:bg-white/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-5 w-5 text-white" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default memo(InfluencerNavbar);