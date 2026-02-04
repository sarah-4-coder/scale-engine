import { memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, FileText, User } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Mobile Bottom Navigation - Always visible on mobile devices
 * Premium, modern design with smooth animations
 */
const MobileBottomNav = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-safe"
    >
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all duration-200 ${
                active
                  ? "bg-gradient-to-br from-purple-500/20 to-indigo-500/20"
                  : "hover:bg-white/5"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    active ? "text-white" : "text-white/60"
                  }`}
                />
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-white" : "text-white/60"
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";

export default MobileBottomNav;