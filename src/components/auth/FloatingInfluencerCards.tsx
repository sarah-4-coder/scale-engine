import { motion } from "framer-motion";
import { Instagram, Heart, MessageCircle, CheckCircle, Star, Sparkles } from "lucide-react";

interface InfluencerCard {
  id: number;
  name: string;
  handle: string;
  followers: string;
  niche: string;
  avatar: string;
  gradient: string;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  delay: number;
  size: "sm" | "md" | "lg";
  duration: number;
  xRange: number[];
  yRange: number[];
  rotateRange: number[];
}

const influencerCards: InfluencerCard[] = [
  {
    id: 1,
    name: "Priya Sharma",
    handle: "@priyacreates",
    followers: "2.5M",
    niche: "Fashion",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    gradient: "from-pink-500 to-rose-500",
    position: { top: "8%", left: "3%" },
    delay: 0,
    size: "md",
    duration: 12,
    xRange: [0, 40, -20, 30, 0],
    yRange: [0, -30, -60, -20, 0],
    rotateRange: [-12, -5, -15, -8, -12],
  },
  {
    id: 2,
    name: "Arjun Kapoor",
    handle: "@arjunfitness",
    followers: "1.8M",
    niche: "Fitness",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    gradient: "from-blue-500 to-cyan-500",
    position: { top: "15%", right: "5%" },
    delay: 1,
    size: "lg",
    duration: 15,
    xRange: [0, -50, -20, -40, 0],
    yRange: [0, -40, -80, -30, 0],
    rotateRange: [8, 15, 5, 12, 8],
  },
  {
    id: 3,
    name: "Sneha Reddy",
    handle: "@snehacooks",
    followers: "890K",
    niche: "Food",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    gradient: "from-orange-500 to-amber-500",
    position: { bottom: "20%", left: "2%" },
    delay: 2,
    size: "sm",
    duration: 10,
    xRange: [0, 30, 60, 20, 0],
    yRange: [0, -50, -30, -70, 0],
    rotateRange: [-5, 3, -8, 0, -5],
  },
  {
    id: 4,
    name: "Raj Malhotra",
    handle: "@rajtech",
    followers: "3.2M",
    niche: "Tech",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    gradient: "from-purple-500 to-indigo-500",
    position: { bottom: "12%", right: "3%" },
    delay: 0.5,
    size: "md",
    duration: 14,
    xRange: [0, -40, -70, -30, 0],
    yRange: [0, -60, -40, -80, 0],
    rotateRange: [15, 8, 20, 12, 15],
  },
  {
    id: 5,
    name: "Ananya Patel",
    handle: "@ananyabeauty",
    followers: "1.2M",
    niche: "Beauty",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    gradient: "from-rose-400 to-pink-500",
    position: { top: "40%", left: "5%" },
    delay: 1.5,
    size: "sm",
    duration: 11,
    xRange: [0, 50, 20, 40, 0],
    yRange: [0, -40, -70, -30, 0],
    rotateRange: [-8, -15, -3, -10, -8],
  },
  {
    id: 6,
    name: "Vikram Singh",
    handle: "@vikramtravels",
    followers: "950K",
    niche: "Travel",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    gradient: "from-emerald-500 to-teal-500",
    position: { top: "55%", right: "6%" },
    delay: 2.5,
    size: "md",
    duration: 13,
    xRange: [0, -30, -60, -20, 0],
    yRange: [0, -50, -30, -60, 0],
    rotateRange: [10, 18, 6, 14, 10],
  },
  {
    id: 7,
    name: "Meera Joshi",
    handle: "@meeralifestyle",
    followers: "750K",
    niche: "Lifestyle",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    gradient: "from-violet-500 to-purple-500",
    position: { top: "75%", left: "8%" },
    delay: 3,
    size: "sm",
    duration: 9,
    xRange: [0, 35, -15, 25, 0],
    yRange: [0, -35, -55, -25, 0],
    rotateRange: [-6, 2, -10, -4, -6],
  },
  {
    id: 8,
    name: "Karan Mehta",
    handle: "@karanmusic",
    followers: "2.1M",
    niche: "Music",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    gradient: "from-indigo-500 to-blue-500",
    position: { top: "70%", right: "10%" },
    delay: 0.8,
    size: "lg",
    duration: 16,
    xRange: [0, -45, -25, -55, 0],
    yRange: [0, -45, -75, -35, 0],
    rotateRange: [12, 6, 18, 10, 12],
  },
];

const sizeClasses = {
  sm: "w-36 h-44",
  md: "w-44 h-52",
  lg: "w-52 h-60",
};

const FloatingInfluencerCards = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Orbs */}
      <motion.div
        className="gradient-orb w-96 h-96 bg-gradient-to-r from-orange-500/30 to-transparent"
        style={{ top: "10%", left: "-10%" }}
        animate={{
          x: [0, 100, 50, 120, 0],
          y: [0, -50, -30, -70, 0],
          scale: [1, 1.2, 1.1, 1.3, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="gradient-orb w-80 h-80 bg-gradient-to-l from-indigo-500/30 to-transparent"
        style={{ bottom: "10%", right: "-5%" }}
        animate={{
          x: [0, -80, -40, -100, 0],
          y: [0, 30, -20, 50, 0],
          scale: [1, 1.3, 1.1, 1.4, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="gradient-orb w-64 h-64 bg-gradient-to-t from-pink-500/20 to-transparent"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        animate={{
          scale: [1, 1.5, 1.2, 1.6, 1],
          opacity: [0.3, 0.5, 0.4, 0.6, 0.3],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            background: i % 2 === 0 ? "#ff7a18" : "#6366f1",
            boxShadow: `0 0 15px ${i % 2 === 0 ? "#ff7a18" : "#6366f1"}`,
          }}
          animate={{
            y: [window.innerHeight + 100, -100],
            x: [0, Math.random() * 150 - 75, Math.random() * 100 - 50],
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1, 1.2, 0.8],
          }}
          transition={{
            duration: 12 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: "linear",
          }}
        />
      ))}

      {/* Influencer Cards - Now with continuous movement */}
      {influencerCards.map((card) => (
        <motion.div
          key={card.id}
          className={`influencer-card ${sizeClasses[card.size]} hidden md:block`}
          style={{
            ...card.position,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 40px rgba(255, 122, 24, 0.15)",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: card.xRange,
            y: card.yRange,
            rotate: card.rotateRange,
          }}
          transition={{
            opacity: { delay: card.delay, duration: 0.8 },
            scale: { delay: card.delay, duration: 0.8, type: "spring", stiffness: 100 },
            x: { duration: card.duration, repeat: Infinity, ease: "easeInOut", delay: card.delay },
            y: { duration: card.duration, repeat: Infinity, ease: "easeInOut", delay: card.delay },
            rotate: { duration: card.duration, repeat: Infinity, ease: "easeInOut", delay: card.delay },
          }}
        >
          {/* Glow effect */}
          <motion.div 
            className="absolute inset-0 rounded-2xl"
            animate={{
              boxShadow: [
                "0 0 20px rgba(255, 122, 24, 0.2)",
                "0 0 40px rgba(255, 122, 24, 0.4), 0 0 60px rgba(99, 102, 241, 0.2)",
                "0 0 20px rgba(255, 122, 24, 0.2)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="shimmer-overlay" />
          <div className="relative h-full p-3 flex flex-col">
            {/* Avatar with Instagram border */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="instagram-border w-10 h-10 flex items-center justify-center">
                  <img
                    src={card.avatar}
                    alt={card.name}
                    className="w-8 h-8 rounded-full object-cover relative z-10"
                  />
                </div>
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                  animate={{
                    scale: [1, 1.2, 1],
                    boxShadow: ["0 0 0 0 rgba(59, 130, 246, 0.5)", "0 0 0 8px rgba(59, 130, 246, 0)", "0 0 0 0 rgba(59, 130, 246, 0.5)"],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircle className="w-3 h-3 text-white" />
                </motion.div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{card.name}</p>
                <p className="text-[10px] text-white/60 truncate">{card.handle}</p>
              </div>
            </div>

            {/* Followers */}
            <div className="mt-3 flex items-center gap-1">
              <Instagram className="w-3 h-3 text-pink-400" />
              <motion.span 
                className="text-sm font-bold text-white"
                animate={{
                  textShadow: ["0 0 10px rgba(255, 122, 24, 0.5)", "0 0 20px rgba(255, 122, 24, 0.8)", "0 0 10px rgba(255, 122, 24, 0.5)"],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {card.followers}
              </motion.span>
            </div>

            {/* Niche Badge */}
            <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${card.gradient} w-fit`}>
              <Sparkles className="w-2.5 h-2.5 text-white" />
              <span className="text-[10px] font-medium text-white">{card.niche}</span>
            </div>

            {/* Engagement Stats */}
            <div className="mt-auto flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                <span className="text-[10px] text-white/70">25K</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] text-white/70">1.2K</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] text-white/70">4.9</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Mobile: Enhanced floating elements */}
      <div className="md:hidden">
        {/* Mobile Gradient Orbs - Large glowing backgrounds */}
        <motion.div
          className="absolute w-48 h-48 rounded-full"
          style={{
            top: "5%",
            left: "-15%",
            background: "radial-gradient(circle, rgba(255, 122, 24, 0.4) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
          animate={{
            x: [0, 60, 30, 80, 0],
            y: [0, 40, 80, 30, 0],
            scale: [1, 1.3, 1.1, 1.4, 1],
            opacity: [0.5, 0.8, 0.6, 0.9, 0.5],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-40 h-40 rounded-full"
          style={{
            bottom: "10%",
            right: "-10%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)",
            filter: "blur(25px)",
          }}
          animate={{
            x: [0, -50, -20, -60, 0],
            y: [0, -30, -50, -20, 0],
            scale: [1, 1.2, 1.4, 1.1, 1],
            opacity: [0.5, 0.7, 0.9, 0.6, 0.5],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute w-32 h-32 rounded-full"
          style={{
            top: "45%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
          animate={{
            scale: [1, 1.5, 1.2, 1.6, 1],
            opacity: [0.3, 0.6, 0.4, 0.7, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Mobile Mini Influencer Cards */}
        {[
          { top: "8%", left: "5%", delay: 0, gradient: "from-pink-500 to-rose-500", icon: "fashion" },
          { top: "12%", right: "8%", delay: 0.5, gradient: "from-blue-500 to-cyan-500", icon: "fitness" },
          { bottom: "25%", left: "3%", delay: 1, gradient: "from-orange-500 to-amber-500", icon: "food" },
          { bottom: "15%", right: "5%", delay: 1.5, gradient: "from-purple-500 to-indigo-500", icon: "tech" },
          { top: "45%", left: "2%", delay: 2, gradient: "from-emerald-500 to-teal-500", icon: "travel" },
          { top: "55%", right: "3%", delay: 2.5, gradient: "from-rose-400 to-pink-500", icon: "beauty" },
        ].map((card, i) => (
          <motion.div
            key={`mobile-card-${i}`}
            className="absolute w-20 h-24 rounded-xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20"
            style={{
              ...card,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3), 0 0 30px rgba(255, 122, 24, 0.15)",
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: [0, 15 + i * 3, -10 - i * 2, 20 + i * 2, 0],
              y: [0, -20 - i * 5, -40 + i * 3, -15 - i * 4, 0],
              rotate: [i % 2 === 0 ? -8 : 8, i % 2 === 0 ? 5 : -5, i % 2 === 0 ? -12 : 12, i % 2 === 0 ? 3 : -3, i % 2 === 0 ? -8 : 8],
            }}
            transition={{
              opacity: { delay: card.delay, duration: 0.6 },
              scale: { delay: card.delay, duration: 0.6, type: "spring" },
              x: { duration: 8 + i, repeat: Infinity, ease: "easeInOut", delay: card.delay },
              y: { duration: 8 + i, repeat: Infinity, ease: "easeInOut", delay: card.delay },
              rotate: { duration: 8 + i, repeat: Infinity, ease: "easeInOut", delay: card.delay },
            }}
          >
            {/* Card glow effect */}
            <motion.div
              className="absolute inset-0 rounded-xl"
              animate={{
                boxShadow: [
                  "0 0 10px rgba(255, 122, 24, 0.2)",
                  "0 0 25px rgba(255, 122, 24, 0.4), 0 0 40px rgba(99, 102, 241, 0.2)",
                  "0 0 10px rgba(255, 122, 24, 0.2)",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="shimmer-overlay rounded-xl" />
            <div className="relative h-full p-2 flex flex-col items-center justify-center gap-1">
              {/* Mini avatar */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r p-[2px]" style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}>
                  <div className={`w-full h-full rounded-full bg-gradient-to-r ${card.gradient} flex items-center justify-center`}>
                    {card.icon === "fashion" && <Sparkles className="w-3.5 h-3.5 text-white" />}
                    {card.icon === "fitness" && <Star className="w-3.5 h-3.5 text-white" />}
                    {card.icon === "food" && <Heart className="w-3.5 h-3.5 text-white" />}
                    {card.icon === "tech" && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    {card.icon === "travel" && <Instagram className="w-3.5 h-3.5 text-white" />}
                    {card.icon === "beauty" && <MessageCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <motion.div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"
                  animate={{
                    scale: [1, 1.3, 1],
                    boxShadow: ["0 0 0 0 rgba(59, 130, 246, 0.5)", "0 0 0 6px rgba(59, 130, 246, 0)", "0 0 0 0 rgba(59, 130, 246, 0.5)"],
                  }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  <CheckCircle className="w-2 h-2 text-white" />
                </motion.div>
              </div>
              {/* Follower count */}
              <motion.span
                className="text-[9px] font-bold text-white"
                animate={{
                  textShadow: ["0 0 5px rgba(255, 122, 24, 0.5)", "0 0 15px rgba(255, 122, 24, 0.8)", "0 0 5px rgba(255, 122, 24, 0.5)"],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {["2.5M", "1.8M", "890K", "3.2M", "950K", "1.2M"][i]}
              </motion.span>
              {/* Niche badge */}
              <div className={`px-1.5 py-0.5 rounded-full bg-gradient-to-r ${card.gradient}`}>
                <span className="text-[7px] font-medium text-white capitalize">{card.icon}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Enhanced Mobile Particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`mobile-particle-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${5 + Math.random() * 90}%`,
              width: `${3 + Math.random() * 4}px`,
              height: `${3 + Math.random() * 4}px`,
              background: i % 3 === 0 ? "#ff7a18" : i % 3 === 1 ? "#6366f1" : "#ec4899",
              boxShadow: `0 0 ${10 + Math.random() * 15}px ${i % 3 === 0 ? "#ff7a18" : i % 3 === 1 ? "#6366f1" : "#ec4899"}`,
            }}
            animate={{
              y: [window.innerHeight + 50, -50],
              x: [0, Math.random() * 80 - 40, Math.random() * 60 - 30],
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.2, 1, 0.8],
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 6,
              ease: "linear",
            }}
          />
        ))}

        {/* Floating engagement icons */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`mobile-icon-${i}`}
            className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/15 flex items-center justify-center"
            style={{
              top: `${10 + Math.random() * 75}%`,
              left: `${5 + Math.random() * 85}%`,
            }}
            animate={{
              y: [0, -25, -10, -30, 0],
              x: [0, 15, -10, 20, 0],
              rotate: [0, 15, -10, 20, 0],
              scale: [1, 1.15, 0.9, 1.1, 1],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          >
            {i % 4 === 0 ? (
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            ) : i % 4 === 1 ? (
              <Instagram className="w-4 h-4 text-pink-400" />
            ) : i % 4 === 2 ? (
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ) : (
              <MessageCircle className="w-4 h-4 text-blue-400" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Noise texture */}
      <div className="noise-overlay" />
    </div>
  );
};

export default FloatingInfluencerCards;
