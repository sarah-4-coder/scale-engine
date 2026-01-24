/* eslint-disable @typescript-eslint/no-explicit-any */
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";

export const NotificationDrawer = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const { notifications, markAllAsRead } = useNotifications();

  const handleClick = (n: any) => {
    markAllAsRead();
    onClose();

    const campaignId = n.metadata?.campaign_id;
    if (!campaignId) return;

    // 🔑 Role-based navigation
    if (n.role === "admin") {
      navigate(`/admin/campaigns/${campaignId}`);
      return;
    }

    if (n.role === "influencer") {
      navigate(`/dashboard/campaigns/my`);
      return;
    }
  };

  return (
    <div className="fixed right-4 top-16 w-96 bg-card border rounded-lg shadow-xl z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Notifications</h3>
        <button onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            No notifications yet
          </p>
        )}

        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => handleClick(n)}
            className={`p-4 border-b cursor-pointer hover:bg-muted ${
              !n.is_read ? "bg-muted/50" : ""
            }`}
          >
            <p className="font-medium text-sm">{n.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
