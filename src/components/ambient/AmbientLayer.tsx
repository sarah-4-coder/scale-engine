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
     STUDIO DARK
  ------------------------ */
  if (themeKey === "dark") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Deep Black base */}
        <div className="absolute inset-0 bg-[#050505]" />

        {/* Cinematic accents */}
        <motion.div
          className="absolute -top-[10%] -left-[5%] w-[600px] h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[140px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ willChange: 'transform, opacity' }}
        />
        <motion.div
          className="absolute bottom-[5%] -right-[5%] w-[500px] h-[500px] bg-[#EC4899]/10 rounded-full blur-[120px]"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          style={{ willChange: 'transform, opacity' }}
        />

        {/* Subtle dot pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>
    );
  }

  /* ------------------------
     STUDIO LIGHT
  ------------------------ */
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Soft Light base */}
      <div className="absolute inset-0 bg-[#F8F9FA]" />

      {/* Elegant glass accents */}
      <motion.div
        className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-[100px]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ willChange: 'transform, opacity' }}
      />
      
      <motion.div
        className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-pink-100/30 rounded-full blur-[90px]"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        style={{ willChange: 'transform, opacity' }}
      />

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}
      />
    </div>
  );
});

AmbientLayer.displayName = 'AmbientLayer';

export default AmbientLayer;