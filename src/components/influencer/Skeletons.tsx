/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";

export const CardSkeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`${className} space-y-3`}>
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-white/10 rounded w-3/4"></div>
        <div className="h-4 bg-white/10 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded"></div>
          <div className="h-3 bg-white/10 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
};

export const StatCardSkeleton = () => {
  return (
    <div className="animate-pulse space-y-2 p-6 rounded-2xl bg-white/5">
      <div className="h-4 bg-white/10 rounded w-2/3"></div>
      <div className="h-8 bg-white/10 rounded w-1/2"></div>
      <div className="h-3 bg-white/10 rounded w-3/4"></div>
    </div>
  );
};

export const CampaignCardSkeleton = ({ theme }: { theme: any }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${theme.card} ${theme.radius} overflow-hidden`}
    >
      <div className="p-6 space-y-4 animate-pulse">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-6 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-full"></div>
        </div>

        {/* Niches */}
        <div className="flex gap-2">
          <div className="h-6 bg-white/10 rounded-full w-16"></div>
          <div className="h-6 bg-white/10 rounded-full w-20"></div>
          <div className="h-6 bg-white/10 rounded-full w-16"></div>
        </div>

        {/* Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded w-32"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded w-24"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded w-28"></div>
          </div>
        </div>

        {/* Button */}
        <div className="h-10 bg-white/10 rounded-lg w-full"></div>
      </div>
    </motion.div>
  );
};

export const DetailSkeleton = ({ theme }: { theme: any }) => {
  return (
    <div className={`${theme.card} ${theme.radius} p-6 space-y-6 animate-pulse`}>
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 bg-white/10 rounded w-2/3"></div>
        <div className="h-4 bg-white/10 rounded w-full"></div>
        <div className="h-4 bg-white/10 rounded w-4/5"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-20"></div>
            <div className="h-6 bg-white/10 rounded w-32"></div>
          </div>
        ))}
      </div>

      {/* Action Area */}
      <div className="space-y-3">
        <div className="h-4 bg-white/10 rounded w-40"></div>
        <div className="h-32 bg-white/10 rounded"></div>
        <div className="h-10 bg-white/10 rounded w-full"></div>
      </div>
    </div>
  );
};