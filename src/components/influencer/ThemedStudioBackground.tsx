import { memo } from 'react';
import { motion } from 'framer-motion';
import { ThemeKey } from '@/theme/themes';

/**
 * Optimized Themed Studio Background
 * - Memoized to prevent re-creation on every render
 * - Reduced animations from 50+ to 3-5 elements
 * - GPU accelerated with willChange
 * - Disabled on mobile and reduced-motion preference
 */
const ThemedStudioBackground = memo(({ themeKey }: { themeKey: ThemeKey }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Skip rendering on mobile or if user prefers reduced motion
  if (isMobile || prefersReducedMotion) return null;

  // ⚡ CRITICAL: Reduce animated elements from 50+ to 3-5
  const animatedCount = 3;

  switch (themeKey) {    case "dark":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#0A0A0B]">
          {/* Static Studio Grid */}
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.15) 1.5px, transparent 1.5px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.15) 1.5px, transparent 1.5px)
              `,
              backgroundSize: '100px 100px',
            }}
          />

          {/* Elite animated flares - Blue/Indigo */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`studio-orb-dark-${i}`}
              className="absolute rounded-full blur-[120px]"
              style={{
                width: i === 0 ? 700 : 500,
                height: i === 0 ? 700 : 500,
                background: i % 2 === 0 
                  ? 'radial-gradient(circle, rgba(59, 130, 246, 0.05), transparent)'
                  : 'radial-gradient(circle, rgba(99, 102, 241, 0.04), transparent)',
                top: i === 0 ? '-15%' : i === 1 ? '35%' : '75%',
                left: i === 0 ? '65%' : i === 1 ? '-15%' : '25%',
                willChange: 'transform',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
                x: i % 2 === 0 ? [0, 30, 0] : [0, -30, 0],
              }}
              transition={{
                duration: 25 + i * 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      );

    case "light":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#FFFFFF]">
          {/* Subtle Studio Grid */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(37, 99, 235, 0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(37, 99, 235, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
            }}
          />

          {/* Elegant soft blue glows */}
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={`studio-orb-light-${i}`}
              className="absolute rounded-full blur-[140px]"
              style={{
                width: 600,
                height: 600,
                background: i === 0 
                  ? 'radial-gradient(circle, rgba(37, 99, 235, 0.04), transparent)'
                  : 'radial-gradient(circle, rgba(79, 70, 229, 0.03), transparent)',
                top: i === 0 ? '-10%' : '55%',
                left: i === 0 ? '5%' : '60%',
                willChange: 'transform',
              }}
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{
                duration: 30 + i * 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      );

    default:
      return null;

  }
});

ThemedStudioBackground.displayName = 'ThemedStudioBackground';

export default ThemedStudioBackground;