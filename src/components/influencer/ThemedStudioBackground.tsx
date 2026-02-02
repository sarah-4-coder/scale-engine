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

  switch (themeKey) {
    case "tech":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Static background - NO animation for better performance */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Circuit Board Pattern - Static SVG */}
          <svg className="absolute inset-0 w-full h-full opacity-8" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuit-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="#22d3ee"/>
                <circle cx="90" cy="90" r="2" fill="#818cf8"/>
                <line x1="10" y1="10" x2="50" y2="10" stroke="#22d3ee" strokeWidth="1"/>
                <line x1="50" y1="10" x2="50" y2="50" stroke="#22d3ee" strokeWidth="1"/>
                <line x1="50" y1="50" x2="90" y2="90" stroke="#818cf8" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
          </svg>

          {/* Only 3 animated orbs instead of 20+ */}
          {[...Array(animatedCount)].map((_, i) => (
            <motion.div
              key={`tech-orb-${i}`}
              className="absolute rounded-full blur-3xl"
              style={{
                width: 200,
                height: 200,
                background: i % 2 === 0 
                  ? 'radial-gradient(circle, rgba(34, 211, 238, 0.1), transparent)'
                  : 'radial-gradient(circle, rgba(129, 140, 248, 0.1), transparent)',
                top: `${20 + i * 30}%`,
                left: `${10 + i * 35}%`,
                willChange: 'transform', // GPU acceleration
              }}
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 15 + i * 5, // Slower = smoother
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      );

    case "fashion":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
          {/* Minimal static pattern - No heavy animations */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <line x1="10%" y1="0" x2="10%" y2="100%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="90%" y1="0" x2="90%" y2="100%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
          </svg>

          {/* Minimal geometric shapes - only 2 animated */}
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={`fashion-shape-${i}`}
              className="absolute border border-neutral-700/10 rounded"
              style={{
                width: `${80 + i * 40}px`,
                height: `${80 + i * 40}px`,
                top: `${30 + i * 35}%`,
                left: `${15 + i * 55}%`,
                willChange: 'transform',
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 40 + i * 10,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      );

    case "fitness":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Energy Grid - Static */}
          <div 
            className="absolute inset-0 opacity-8"
            style={{
              backgroundImage: `
                linear-gradient(rgba(220, 38, 38, 0.3) 2px, transparent 2px),
                linear-gradient(90deg, rgba(34, 197, 94, 0.3) 2px, transparent 2px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Minimal energy glows - only 2 */}
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={`fitness-glow-${i}`}
              className="absolute rounded-full blur-3xl"
              style={{
                width: 300,
                height: 300,
                background: i === 0 
                  ? 'radial-gradient(circle, rgba(220, 38, 38, 0.15), transparent)'
                  : 'radial-gradient(circle, rgba(34, 197, 94, 0.15), transparent)',
                top: i === 0 ? '20%' : '60%',
                left: i === 0 ? '20%' : '70%',
                willChange: 'transform',
              }}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Heartbeat line - simplified */}
          <svg className="absolute bottom-20 left-0 w-full opacity-5" height="100" viewBox="0 0 1000 100">
            <motion.path
              d="M 0 50 L 200 50 L 220 20 L 240 80 L 260 50 L 1000 50"
              stroke="#10b981"
              strokeWidth="3"
              fill="none"
              animate={{ strokeDashoffset: [0, -100] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ strokeDasharray: "100 100", willChange: 'stroke-dashoffset' }}
            />
          </svg>
        </div>
      );

    default:
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Default minimal pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(124, 58, 237, 0.4) 1px, transparent 1px)`,
              backgroundSize: '30px 30px',
            }}
          />

          {/* Minimal animated orbs */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`default-orb-${i}`}
              className="absolute rounded-full blur-3xl"
              style={{
                width: `${120 + i * 60}px`,
                height: `${120 + i * 60}px`,
                background: i % 2 === 0 
                  ? 'radial-gradient(circle, rgba(251, 146, 60, 0.1), transparent)'
                  : 'radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent)',
                top: `${Math.random() * 70}%`,
                left: `${Math.random() * 70}%`,
                willChange: 'transform',
              }}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
              }}
              transition={{
                duration: 10 + i * 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      );
  }
});

ThemedStudioBackground.displayName = 'ThemedStudioBackground';

export default ThemedStudioBackground;