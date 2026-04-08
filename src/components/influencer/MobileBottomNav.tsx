import { memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, FileText, User } from "lucide-react";
import { motion } from "framer-motion";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";

/**
 * Mobile Bottom Navigation - Always visible on mobile devices
 * Premium, modern design with smooth animations
 */
const MobileBottomNav = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { themeKey } = useInfluencerTheme();

  const navItems = [
    {
      icon: Home,
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: Search,
      label: "Browse",
      path: "/dashboard/campaigns/all",
    },
    {
      icon: FileText,
      label: "My Campaigns",
      path: "/dashboard/campaigns/my",
    },
    {
      icon: User,
      label: "Media Kit",
      path: "/dashboard/media-kit/setup",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
    >
      <div className={`backdrop-blur-[20px] transition-colors duration-300 border rounded-[20px] h-16 flex items-center justify-around shadow-2xl ${
        themeKey === 'dark' 
          ? 'bg-[#050505]/80 border-[rgba(255,255,255,0.1)]' 
          : 'bg-white/90 border-black/5 shadow-gray-200'
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-col items-center justify-center w-12 h-12"
            >
              <Icon
                className={`h-6 w-6 transition-all duration-300 ${
                  active 
                    ? "text-blue-600 scale-110" 
                    : (themeKey === 'dark' ? "text-slate-500" : "text-slate-400")
                }`}
              />
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-600 shadow-[0_0_8px_#2563eb]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";

export default MobileBottomNav;