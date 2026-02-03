/* eslint-disable @typescript-eslint/ban-ts-comment */
import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Easing } from 'framer-motion';
import { ThemeKey } from '@/theme/themes';

/**
 * Highly Optimized Ambient Layer v2
 * 
 * Optimizations:
 * - Memoized component prevents re-renders
 * - Memoized calculations for mobile/reduced-motion detection
 * - GPU-accelerated animations with willChange
 * - Minimal DOM nodes (2-3 elements max)
 * - Disabled on mobile for battery saving
 * - Respects user's motion preferences
 * - Slower animations (25-30s) for smoothness
 * - Reduced blur values for better performance
 */
const AmbientLayer = memo(({ themeKey }: { themeKey: ThemeKey }) => {
  // ⚡ Memoize environment checks to avoid recalculation
  const { isMobile, prefersReducedMotion } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, prefersReducedMotion: false };
    }
    
    return {
      isMobile: window.innerWidth < 768,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  }, []);
  
  // Disable on mobile or if user prefers reduced motion
  if (isMobile || prefersReducedMotion) return null;

  // ⚡ Shared animation config for consistency
  const animationConfig = {
    scale: [1, 1.15, 1]
  };

  const transitionConfig = {
    duration: 28,
    repeat: Infinity,
    ease: "easeInOut" as Easing
  };

  /* ------------------------
     FASHION (LUXURY / EDITORIAL)
  ------------------------ */
  if (themeKey === "fashion") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {/* Static gradient - no animation for performance */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#4a4439] via-[#8b7d6b] to-[#f1f1ee]" />
        
        {/* Single animated element */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 32, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          style={{ willChange: 'transform, opacity' }}
        />
      </div>
    );
  }

  /* ------------------------
     TECH (FUTURISTIC / BUILDER)
  ------------------------ */
  if (themeKey === "tech") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dark base */}
        <div className="absolute inset-0 bg-[#020617]" />

        {/* 2 optimized glow layers */}
        <motion.div
          className="absolute -top-40 -left-40 w-[450px] h-[450px] bg-cyan-500/12 rounded-full blur-[90px]"
          animate={animationConfig}
          transition={transitionConfig}
          style={{ willChange: 'transform' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-indigo-500/12 rounded-full blur-[90px]"
          animate={{ 
            scale: [1, 1.12, 1],
            transition: { 
              duration: 32, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }
          }}
          style={{ willChange: 'transform' }}
        />
        
        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
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
        {/* Dark base */}
        <div className="absolute inset-0 bg-[#020617]" />

        {/* 2 energy glows */}
        <motion.div
          className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-red-500/15 rounded-full blur-[90px]"
          animate={{ 
            scale: [1, 1.18, 1],
            transition: { 
              duration: 25, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }
          }}
          style={{ willChange: 'transform' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-green-500/12 rounded-full blur-[90px]"
          animate={animationConfig}
          transition={transitionConfig}
          style={{ willChange: 'transform' }}
        />
        
        {/* Subtle radial gradient for depth */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
      </div>
    );
  }

  /* ------------------------
     DEFAULT (MINIMAL)
  ------------------------ */
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dark base */}
      <div className="absolute inset-0 bg-[#020617]" />

      {/* 2 minimal glows */}
      <motion.div
        className="absolute -top-40 -left-40 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[90px]"
        animate={animationConfig}
        transition={transitionConfig}
        style={{ willChange: 'transform' }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[90px]"
        animate={{ 
          scale: [1, 1.1, 1],
          transition: { 
            duration: 30, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }
        }}
        style={{ willChange: 'transform' }}
      />
    </div>
  );
});

AmbientLayer.displayName = 'AmbientLayer';

export default AmbientLayer;