import { memo } from 'react';
import { motion } from 'framer-motion';
import { ThemeKey } from '@/theme/themes';

/**
 * Optimized Ambient Layer
 * - Memoized to prevent unnecessary re-renders
 * - Reduced to minimal animations
 * - Disabled on mobile and reduced-motion preference
 * - GPU accelerated with willChange
 */
const AmbientLayer = memo(({ themeKey }: { themeKey: ThemeKey }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Disable on mobile or if user prefers reduced motion
  if (isMobile || prefersReducedMotion) return null;

  /* ------------------------
     FASHION (LUXURY / EDITORIAL)
  ------------------------ */
  if (themeKey === "fashion") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#4a4439] to-[#f1f1ee]" />
      </div>
    );
  }

  /* ------------------------
     TECH (FUTURISTIC / BUILDER)
  ------------------------ */
  if (themeKey === "tech") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#020617]" />

        {/* Only 2 glow layers - GPU accelerated */}
        <motion.div
          className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          style={{ willChange: 'transform' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          style={{ willChange: 'transform' }}
        />
      </div>
    );
  }

  /* ------------------------
     FITNESS (ENERGY / DISCIPLINE)
  ------------------------ */
  if (themeKey === "fitness") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#020617]" />

        {/* Only 2 energy glows - GPU accelerated */}
        <motion.div
          className="absolute top-0 left-1/3 w-[350px] h-[350px] bg-red-500/20 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          style={{ willChange: 'transform' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/3 w-[350px] h-[350px] bg-green-500/15 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          style={{ willChange: 'transform' }}
        />
      </div>
    );
  }

  /* ------------------------
     DEFAULT
  ------------------------ */
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#020617]" />

      {/* Minimal default glows */}
      <motion.div
        className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-orange-500/15 rounded-full blur-[100px]"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: 'transform' }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[100px]"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: 'transform' }}
      />
    </div>
  );
});

AmbientLayer.displayName = 'AmbientLayer';

export default AmbientLayer;