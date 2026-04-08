/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, LogOut, Check, Bell, Landmark, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { THEMES, ThemeKey } from "@/theme/themes";
import { useUserProfile } from "@/hooks/useCampaigns";
import { useLeadsBadge } from "@/hooks/useLeads";
import { useDashboardStats } from "@/hooks/useCampaigns";

type Props = {
  currentTheme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
};

/**
 * Optimized InfluencerNavbar
 * Mobile: Compact design with only essentials (brand, bell, theme, logout)
 * Desktop: Full features with user greeting
 */
const InfluencerNavbar = ({ currentTheme, onThemeChange }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // ⚡ Cache user profile data (name, avatar, etc.) for 15 minutes
  const { data: userProfile } = useUserProfile(user?.id || '');
  //@ts-ignore
  const userName = userProfile && userProfile.full_name
  //@ts-ignore
    ? userProfile.full_name.split(' ')[0]
    : 'Creator';

  // @ts-ignore
  const { data: stats } = useDashboardStats(user?.id || '');
  // @ts-ignore
  const influencerId = stats?.influencerId || null;
  const leadsBadge = useLeadsBadge(influencerId);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace("https://dotfluence.in");
  };

  return (    <div className={`sticky top-0 z-40 backdrop-blur-[20px] border-b transition-colors duration-300 ${
      currentTheme === "dark" 
        ? "bg-[#050505]/80 border-[rgba(255,255,255,0.1)]" 
        : "bg-white/80 border-black/5"
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-5 flex items-center justify-between">
        {/* LEFT - Logo/Brand */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 md:gap-4"
        >
          <h1
            className={`text-xl md:text-2xl font-black tracking-tighter cursor-pointer hover:opacity-80 transition-all duration-300 bg-gradient-to-r bg-clip-text text-transparent ${
              currentTheme === 'dark' 
                ? 'from-white via-blue-200 to-blue-300' 
                : 'from-blue-600 via-blue-700 to-blue-900'
            }`}
            onClick={() => navigate("/dashboard")}
          >
            DotFluence
          </h1>
          
          {/* User greeting - only on desktop */}
          <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300 ${
            currentTheme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-blue-50 border border-blue-100 shadow-sm'
          }`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              {userName}
            </span>
          </div>
        </motion.div>

        {/* RIGHT - Actions */}
        <div className="flex items-center gap-1 md:gap-2 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="hidden md:block"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/settings/payment")}
              title="Payout Settings"
              className={`h-8 w-8 md:h-10 md:w-10 ${
                currentTheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
            >
              <Landmark className={`h-4 w-4 md:h-5 md:w-5 ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`} />
            </Button>
          </motion.div>

          {/* LEADS INBOX */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="hidden md:block"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/leads")}
              title="Brand Leads"
              className={`relative h-8 w-8 md:h-10 md:w-10 ${
                currentTheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
            >
              <Inbox className={`h-4 w-4 md:h-5 md:w-5 ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`} />
              {leadsBadge > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(37,99,235,0.8)]">
                  {leadsBadge > 9 ? '9+' : leadsBadge}
                </span>
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="hidden md:block"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              title="Home"
              className={`h-8 w-8 md:h-10 md:w-10 ${
                currentTheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 md:h-5 md:w-5 ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6"
                />
              </svg>
            </Button>
          </motion.div>
          {/* NOTIFICATIONS */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <NotificationBell />
          </motion.div>

          {/* THEME SWITCHER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen((p) => !p)}
              title="Change Theme"
              className={`h-8 w-8 md:h-10 md:w-10 ${
                currentTheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
            >
              <Palette className={`h-4 w-4 md:h-5 md:w-5 ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`} />
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

                  {/* Dropdown - GPU accelerated */}
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={{ willChange: 'transform, opacity' }}
                    className={`absolute right-0 mt-2 w-48 rounded-xl backdrop-blur-xl border shadow-2xl overflow-hidden z-50 transition-colors duration-300 ${
                      currentTheme === 'dark' 
                        ? 'bg-black/90 border-white/20' 
                        : 'bg-white/90 border-gray-200'
                    }`}
                  >
                    <div className="p-2">
                      <p className={`px-3 py-2 text-xs font-medium uppercase tracking-wider ${
                        currentTheme === 'dark' ? 'text-white/50' : 'text-gray-500'
                      }`}>
                        Choose Theme
                      </p>

                      {Object.values(THEMES).map((theme, index) => (
                        <motion.button
                          key={theme.key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03, ease: "easeOut" }}
                          onClick={() => {
                            onThemeChange(theme.key);
                            setOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-sm flex items-center justify-between rounded-lg
                            transition-all duration-150 ${
                              currentTheme === theme.key
                                ? (currentTheme === 'dark' ? "bg-white/10 text-white" : "bg-blue-50 text-blue-600")
                                : (currentTheme === 'dark' ? "text-white/70 hover:bg-white/5" : "text-gray-600 hover:bg-blue-50/50")
                            }`}
                        >
                          <span className="flex items-center gap-3">
                            {/* Theme color indicator */}
                            <div
                              className={`w-3 h-3 rounded-full bg-gradient-to-r ${theme.primary} flex-shrink-0`}
                            />
                            <span className={`truncate font-medium ${
                              currentTheme === 'dark' ? 'text-white' : 'text-black'
                            }`}>{theme.name}</span>
                          </span>

                          {currentTheme === theme.key && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <Check className={`h-4 w-4 flex-shrink-0 ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
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
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
              className={`hover:text-red-400 transition-colors h-8 w-8 md:h-10 md:w-10 ${
                currentTheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
            >
              <LogOut className={`h-4 w-4 md:h-5 md:w-5 ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`} />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent re-renders when parent updates
export default memo(InfluencerNavbar);