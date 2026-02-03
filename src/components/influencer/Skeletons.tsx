/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo } from "react";
import { motion } from "framer-motion";

/**
 * Optimized Skeleton Components
 * 
 * Optimizations:
 * - Memoized to prevent unnecessary re-renders
 * - GPU-accelerated animations
 * - Minimal DOM nodes
 * - Accessible (aria-label for screen readers)
 */

// ⚡ Base skeleton with pulse animation
const SkeletonPulse = memo(({ 
  className = "", 
  width = "w-full" 
}: { 
  className?: string; 
  width?: string;
}) => (
  <div 
    className={`${width} h-4 bg-white/10 rounded animate-pulse ${className}`}
    aria-label="Loading..."
    role="status"
  />
));
SkeletonPulse.displayName = "SkeletonPulse";

// ⚡ Card skeleton - memoized for performance
export const CardSkeleton = memo(({ className = "" }: { className?: string }) => {
  return (
    <div className={`${className} space-y-3`} role="status" aria-label="Loading content">
      <div className="space-y-3">
        <SkeletonPulse width="w-3/4" className="h-6" />
        <SkeletonPulse width="w-1/2" />
        <div className="space-y-2">
          <SkeletonPulse width="w-full" className="h-3" />
          <SkeletonPulse width="w-5/6" className="h-3" />
        </div>
      </div>
    </div>
  );
});
CardSkeleton.displayName = "CardSkeleton";

// ⚡ Stat card skeleton - memoized
export const StatCardSkeleton = memo(() => {
  return (
    <div 
      className="space-y-2 p-4 md:p-6 rounded-2xl bg-white/5" 
      role="status" 
      aria-label="Loading statistics"
    >
      <div className="space-y-2 animate-pulse">
        <SkeletonPulse width="w-2/3" />
        <SkeletonPulse width="w-1/2" className="h-8" />
        <SkeletonPulse width="w-3/4" className="h-3" />
      </div>
    </div>
  );
});
StatCardSkeleton.displayName = "StatCardSkeleton";

// ⚡ Campaign card skeleton - memoized with motion
export const CampaignCardSkeleton = memo(({ theme }: { theme: any }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`${theme.card} ${theme.radius} overflow-hidden`}
      role="status"
      aria-label="Loading campaign"
    >
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="space-y-2 animate-pulse">
          <SkeletonPulse width="w-3/4" className="h-6" />
          <SkeletonPulse width="w-full" />
        </div>

        {/* Niches */}
        <div className="flex gap-2 animate-pulse">
          <div className="h-6 bg-white/10 rounded-full w-16" />
          <div className="h-6 bg-white/10 rounded-full w-20" />
          <div className="h-6 bg-white/10 rounded-full w-16" />
        </div>

        {/* Info */}
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 bg-white/10 rounded flex-shrink-0" />
              <SkeletonPulse width={i === 1 ? "w-32" : i === 2 ? "w-24" : "w-28"} />
            </div>
          ))}
        </div>

        {/* Button */}
        <div className="h-10 bg-white/10 rounded-lg w-full animate-pulse" />
      </div>
    </motion.div>
  );
});
CampaignCardSkeleton.displayName = "CampaignCardSkeleton";

// ⚡ Detail skeleton - memoized
export const DetailSkeleton = memo(({ theme }: { theme: any }) => {
  return (
    <div 
      className={`${theme.card} ${theme.radius} p-4 md:p-6 space-y-6`}
      role="status"
      aria-label="Loading campaign details"
    >
      <div className="animate-pulse space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <SkeletonPulse width="w-2/3" className="h-8" />
          <SkeletonPulse width="w-full" />
          <SkeletonPulse width="w-4/5" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <SkeletonPulse width="w-20" />
              <SkeletonPulse width="w-32" className="h-6" />
            </div>
          ))}
        </div>

        {/* Action Area */}
        <div className="space-y-3">
          <SkeletonPulse width="w-40" />
          <div className="h-32 bg-white/10 rounded" />
          <div className="h-10 bg-white/10 rounded w-full" />
        </div>
      </div>
    </div>
  );
});
DetailSkeleton.displayName = "DetailSkeleton";

// ⚡ List skeleton - for loading multiple items
export const ListSkeleton = memo(({ 
  count = 3, 
  theme 
}: { 
  count?: number; 
  theme: any;
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CampaignCardSkeleton key={i} theme={theme} />
      ))}
    </div>
  );
});
ListSkeleton.displayName = "ListSkeleton";

// ⚡ Table skeleton - for data tables
export const TableSkeleton = memo(({ 
  rows = 5, 
  cols = 4 
}: { 
  rows?: number; 
  cols?: number;
}) => {
  return (
    <div className="space-y-3" role="status" aria-label="Loading table">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-white/10 animate-pulse">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonPulse key={i} width="flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 animate-pulse">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <SkeletonPulse key={colIndex} width="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
});
TableSkeleton.displayName = "TableSkeleton";

// ⚡ Avatar skeleton
export const AvatarSkeleton = memo(({ 
  size = "md" 
}: { 
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };
  
  return (
    <div 
      className={`${sizeClasses[size]} bg-white/10 rounded-full animate-pulse`}
      role="status"
      aria-label="Loading avatar"
    />
  );
});
AvatarSkeleton.displayName = "AvatarSkeleton";