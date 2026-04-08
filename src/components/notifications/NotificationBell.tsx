import { Bell } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import { NotificationDrawer } from "./NotificationDrawer";

export const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const { themeKey } = useInfluencerTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className={`relative p-2 rounded-full transition-colors flex items-center justify-center ${
          themeKey === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-slate-900 border-none'
        }`}
      >
        <Bell className={`h-5 w-5 ${themeKey === 'light' ? 'text-slate-900' : 'text-white'}`} strokeWidth={2.5} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1 border-2 border-black">
            {unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationDrawer onClose={() => setOpen(false)} />}
    </div>
  );
};
