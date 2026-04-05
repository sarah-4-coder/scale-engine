import { motion } from "framer-motion";
import { Clock, CheckCircle, Rocket, User, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GlobalActivityFeedProps {
  activities: any[];
}

const GlobalActivityFeed = ({ activities }: GlobalActivityFeedProps) => {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <Clock className="h-8 w-8 opacity-20 mb-3" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  const getIcon = (status: string) => {
    switch (status) {
      case "accepted": return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case "pending": return <Clock className="h-4 w-4 text-slate-400" />;
      case "influencer_negotiated": return <Rocket className="h-4 w-4 text-orange-400" />;
      case "content_submitted": return <Rocket className="h-4 w-4 text-blue-400" />;
      default: return <User className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5" />

      <div className="space-y-6 relative">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-4 group"
          >
            {/* Icon Bubble */}
            <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center relative z-10 group-hover:border-purple-500/50 transition-colors">
              {getIcon(activity.status)}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {activity.brandName}
                </span>
                <span className="text-[10px] text-slate-600 uppercase tracking-tighter">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-slate-300">
                <span className="text-white font-bold">{activity.influencerName}</span>
                {" applied to "}
                <span className="text-purple-400 font-medium">{activity.campaignName}</span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={activity.status} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Internal Badge helper
const Badge = ({ variant }: { variant: string }) => {
    const styles: any = {
        accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        pending: "bg-slate-500/10 text-slate-400 border-white/5",
        influencer_negotiated: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        rejected: "bg-red-500/10 text-red-400 border-red-500/20"
    };

    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${styles[variant] || styles.pending}`}>
            {variant.replace("_", " ")}
        </span>
    );
};

export default GlobalActivityFeed;
