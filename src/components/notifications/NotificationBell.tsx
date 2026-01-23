import { Bell } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationDrawer } from "./NotificationDrawer";

export const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-full hover:bg-muted"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationDrawer onClose={() => setOpen(false)} />}
    </div>
  );
};
