/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AmbientLayer from "@/components/ambient/AmbientLayer";
import { ThemeKey } from "@/theme/themes";
import {
  StatCardSkeleton,
  CardSkeleton,
} from "@/components/influencer/Skeletons";

/* --------------------------------
   TYPES
-------------------------------- */
type RecentCampaign = {
  name: string;
  status: "Active" | "Pending" | "Completed";
};

// ⚡ MEMOIZED STAT CARD
const StatCard = memo(({ stat }: { stat: any }) => {
  const { theme } = useInfluencerTheme();

  return (
    <Card className={`${theme.card} ${theme.radius}`}>
      <CardHeader className="flex flex-row justify-between items-center pb-2">
        <CardTitle className="text-sm opacity-70">{stat.title}</CardTitle>
        <stat.icon className="h-4 w-4 opacity-70" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        <p className="text-xs opacity-60 mt-1">{stat.note}</p>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = "StatCard";

/* --------------------------------
   ENHANCED STUDIO BACKGROUNDS WITH CSS
-------------------------------- */
const ThemedStudioBackground = ({ themeKey }: { themeKey: ThemeKey }) => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Don't render on mobile to prevent lag
  if (isMobile) return null;

  switch (themeKey) {
    case "tech":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Tech Grid Pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            }}
          />

          {/* Circuit Board Pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="circuit"
                x="0"
                y="0"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="10" cy="10" r="2" fill="#22d3ee" />
                <circle cx="90" cy="90" r="2" fill="#818cf8" />
                <line
                  x1="10"
                  y1="10"
                  x2="50"
                  y2="10"
                  stroke="#22d3ee"
                  strokeWidth="1"
                />
                <line
                  x1="50"
                  y1="10"
                  x2="50"
                  y2="50"
                  stroke="#22d3ee"
                  strokeWidth="1"
                />
                <line
                  x1="50"
                  y1="50"
                  x2="90"
                  y2="90"
                  stroke="#818cf8"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" />
          </svg>

          {/* Floating Monitor Frame */}
          <motion.div
            className="absolute bottom-10 left-10 w-96 h-64 border-4 border-cyan-500/20 rounded-lg"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-2 bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 rounded" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400/30 text-6xl font-mono">
              {"{ }"}
            </div>
          </motion.div>

          {/* Code Snippets */}
          <motion.div
            className="absolute top-20 right-20 font-mono text-cyan-300/20 text-sm space-y-2"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div>const theme = 'tech';</div>
            <div>function render() {"{"}</div>
            <div>&nbsp;&nbsp;return success;</div>
            <div>{"}"}</div>
          </motion.div>

          {/* Binary Background */}
          <div className="absolute inset-0 opacity-5 text-cyan-400 text-xs font-mono overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="whitespace-nowrap"
                animate={{ x: [0, -1000] }}
                transition={{
                  duration: 20 + i * 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                01010011 01010101 01000011 01000011 01000101 01010011 01010011
              </motion.div>
            ))}
          </div>
        </div>
      );

    case "fashion":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Minimalist Lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-8"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="10%"
              y1="0"
              x2="10%"
              y2="100%"
              stroke="#000"
              strokeWidth="0.5"
              opacity="0.1"
            />
            <line
              x1="30%"
              y1="0"
              x2="30%"
              y2="100%"
              stroke="#000"
              strokeWidth="0.5"
              opacity="0.1"
            />
            <line
              x1="70%"
              y1="0"
              x2="70%"
              y2="100%"
              stroke="#000"
              strokeWidth="0.5"
              opacity="0.1"
            />
            <line
              x1="90%"
              y1="0"
              x2="90%"
              y2="100%"
              stroke="#000"
              strokeWidth="0.5"
              opacity="0.1"
            />
            <line
              x1="0"
              y1="20%"
              x2="100%"
              y2="20%"
              stroke="#000"
              strokeWidth="0.5"
              opacity="0.1"
            />
            <line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke="#000"
              strokeWidth="0.5"
              opacity="0.1"
            />
            <line
              x1="0"
              y1="80%"
              x2="100%"
              y2="80%"
              stroke="#000"
              strokeWidth="0.5"
              opacity="0.1"
            />
          </svg>

          {/* Wardrobe Hangers */}
          <motion.div
            className="absolute top-10 right-20 w-64 h-80"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Hanger 1 */}
            <svg
              width="100"
              height="120"
              className="absolute left-0"
              viewBox="0 0 100 120"
            >
              <path
                d="M 20 20 Q 50 10 80 20 L 75 25 L 50 100 L 25 25 Z"
                fill="none"
                stroke="#404040"
                strokeWidth="2"
                opacity="0.3"
              />
              <circle
                cx="50"
                cy="15"
                r="8"
                fill="none"
                stroke="#404040"
                strokeWidth="2"
                opacity="0.3"
              />
            </svg>

            {/* Hanger 2 */}
            <svg
              width="100"
              height="120"
              className="absolute left-20 top-10"
              viewBox="0 0 100 120"
            >
              <path
                d="M 20 20 Q 50 10 80 20 L 75 25 L 50 100 L 25 25 Z"
                fill="none"
                stroke="#404040"
                strokeWidth="2"
                opacity="0.2"
              />
              <circle
                cx="50"
                cy="15"
                r="8"
                fill="none"
                stroke="#404040"
                strokeWidth="2"
                opacity="0.2"
              />
            </svg>
          </motion.div>

          {/* Geometric Shapes */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute border border-neutral-700/20"
              style={{
                width: `${60 + i * 20}px`,
                height: `${60 + i * 20}px`,
                top: `${20 + i * 10}%`,
                left: `${10 + i * 12}%`,
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 30 + i * 5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}

          {/* Fashion Text Pattern */}
          <div className="absolute bottom-10 left-10 text-neutral-800/10 text-8xl font-serif italic">
            STYLE
          </div>
        </div>
      );

    case "fitness":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Energy Grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(220, 38, 38, 0.3) 2px, transparent 2px),
                linear-gradient(90deg, rgba(34, 197, 94, 0.3) 2px, transparent 2px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Dumbbell Illustration */}
          <svg
            className="absolute bottom-20 left-10 w-96 h-32 opacity-20"
            viewBox="0 0 400 150"
          >
            {/* Left weight */}
            <rect x="10" y="30" width="60" height="90" rx="5" fill="#dc2626" />
            <rect x="30" y="20" width="20" height="110" rx="5" fill="#dc2626" />

            {/* Bar */}
            <rect x="70" y="65" width="260" height="20" rx="10" fill="#666" />

            {/* Right weight */}
            <rect x="330" y="30" width="60" height="90" rx="5" fill="#22c55e" />
            <rect
              x="350"
              y="20"
              width="20"
              height="110"
              rx="5"
              fill="#22c55e"
            />
          </svg>

          {/* Heart Rate Line */}
          <svg
            className="absolute top-1/4 right-20 w-96 h-32 opacity-20"
            viewBox="0 0 400 100"
          >
            <polyline
              points="0,50 50,50 70,20 90,80 110,50 350,50"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
            />
          </svg>

          {/* Pulsing Circles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-4"
              style={{
                borderColor:
                  i % 2 === 0
                    ? "rgba(220, 38, 38, 0.2)"
                    : "rgba(34, 197, 94, 0.2)",
                width: `${100 + i * 40}px`,
                height: `${100 + i * 40}px`,
                top: `${40 + i * 8}%`,
                right: `${10 + i * 5}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}

          {/* Flame Effect */}
          <motion.div
            className="absolute top-20 right-1/3"
            animate={{
              y: [0, -10, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg width="80" height="100" viewBox="0 0 80 100">
              <path
                d="M 40 10 Q 50 30 45 50 Q 55 65 40 90 Q 25 65 35 50 Q 30 30 40 10"
                fill="#dc2626"
                opacity="0.3"
              />
            </svg>
          </motion.div>

          {/* Motivational Text */}
          <div className="absolute bottom-20 right-20 text-red-500/10 text-6xl font-bold transform -rotate-12">
            POWER
          </div>
        </div>
      );

    default:
      // Default creative studio
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Dot Grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(124, 58, 237, 0.4) 1px, transparent 1px)`,
              backgroundSize: "30px 30px",
            }}
          />

          {/* Floating Orbs */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${60 + i * 30}px`,
                height: `${60 + i * 30}px`,
                background:
                  i % 2 === 0
                    ? "radial-gradient(circle, rgba(251, 146, 60, 0.2), transparent)"
                    : "radial-gradient(circle, rgba(99, 102, 241, 0.2), transparent)",
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 80}%`,
              }}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 5 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}

          {/* Sparkle Pattern */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path
                  d="M 10 0 L 12 8 L 20 10 L 12 12 L 10 20 L 8 12 L 0 10 L 8 8 Z"
                  fill={i % 2 === 0 ? "#fb923c" : "#6366f1"}
                  opacity="0.4"
                />
              </svg>
            </motion.div>
          ))}

          {/* Creative Text */}
          <div className="absolute top-1/3 left-10 text-orange-500/10 text-9xl font-bold">
            CREATE
          </div>
        </div>
      );
  }
};

/* --------------------------------
   WELCOME MODAL
-------------------------------- */
const WelcomeModal = ({
  show,
  onClose,
  fullName,
  themeKey,
}: {
  show: boolean;
  onClose: () => void;
  fullName: string;
  themeKey: ThemeKey;
}) => {
  const themeMessages: Record<
    ThemeKey,
    { title: string; message: string; emoji: string }
  > = {
    tech: {
      title: "Tech Studio Activated! 💻",
      message:
        "We've crafted a cyberpunk-inspired workspace just for you, complete with code and circuits.",
      emoji: "⚡",
    },
    fashion: {
      title: "Fashion Studio Ready! 👗",
      message:
        "Your minimalist fashion atelier awaits, designed with elegance and style in mind.",
      emoji: "✨",
    },
    fitness: {
      title: "Fitness Arena Unlocked! 💪",
      message:
        "Your personal training ground is set, powered by energy and determination.",
      emoji: "🔥",
    },
    default: {
      title: "Creator Studio Launched! 🚀",
      message:
        "We've created a vibrant creative space tailored to your influencer journey.",
      emoji: "🎨",
    },
  };

  const currentTheme = themeMessages[themeKey];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", duration: 0.7 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Content */}
            <div className="text-center space-y-6">
              {/* Animated emoji */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-7xl"
              >
                {currentTheme.emoji}
              </motion.div>

              {/* Welcome text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-3xl font-bold text-white mb-3">
                  Welcome, {fullName}! 👋
                </h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 mb-4">
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  <span className="text-sm text-white/90">
                    {currentTheme.title}
                  </span>
                </div>
              </motion.div>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-white/80 text-lg leading-relaxed"
              >
                {currentTheme.message}
              </motion.p>

              {/* Theme switcher hint */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="pt-4 space-y-3"
              >
                <div className="flex items-center justify-center gap-2 text-yellow-300">
                  <Sparkles className="h-5 w-5" />
                  <p className="font-medium">Want to see other themes?</p>
                </div>

                {/* Animated arrow pointing up */}
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-white/60"
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="19" x2="12" y2="5"></line>
                      <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                  </motion.div>
                  <p className="text-sm text-white/60">
                    Click the{" "}
                    <span className="text-purple-300 font-semibold">
                      theme icon
                    </span>{" "}
                    in the navbar above
                  </p>
                </div>
              </motion.div>

              {/* Action button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 }}
              >
                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium py-6 text-lg"
                >
                  Let's Get Started! 🚀
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const InfluencerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* -------------------------------
     THEME
  ------------------------------- */
  const {
    theme,
    themeKey,
    setTheme,
    loading: themeLoading,
  } = useInfluencerTheme();

  /* -------------------------------
     STATE
  ------------------------------- */
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("Creator");
  const [followers, setFollowers] = useState<number | null>(null);
  const [activeCampaigns, setActiveCampaigns] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);

  /* -------------------------------
     CHECK IF FIRST VISIT
  ------------------------------- */
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("dotfluence_welcome_seen");
    if (!hasSeenWelcome && !themeLoading) {
      // Show welcome after a short delay
      setTimeout(() => {
        setShowWelcome(true);
        localStorage.setItem("dotfluence_welcome_seen", "true");
      }, 1000);
    }
  }, [themeLoading]);

  /* -------------------------------
     FETCH DASHBOARD DATA
  ------------------------------- */
  useEffect(() => {
    // REPLACE the entire fetchDashboard function in InfluencerDashboard.tsx (line ~546)
    const fetchDashboard = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // ⚡ PARALLEL QUERIES - Run simultaneously!
        const [profileResult, influencerResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .single<{ full_name: string }>(),
          supabase
            .from("influencer_profiles")
            .select("id, followers_count")
            .eq("user_id", user.id)
            .single<{ id: string; followers_count: number }>(),
        ]);

        const profile = profileResult.data;
        const influencer = influencerResult.data;

        setFullName(profile?.full_name || "Creator");

        if (!influencer) {
          toast.error("Please complete your profile to unlock campaigns");
          navigate("/profile-setup");
          return;
        }

        setFollowers(influencer.followers_count ?? null);

        // ⚡ PARALLEL QUERIES - Fetch campaigns and relations together
        const [relationsResult, allCampaignsResult] = await Promise.all([
          supabase
            .from("campaign_influencers")
            .select("campaign_id, status, final_payout, created_at")
            .eq("influencer_id", influencer.id)
            .order("created_at", { ascending: false }),
          // Prefetch campaign names for faster lookup
          supabase.from("campaigns").select("id, name"),
        ]);

        const relations = relationsResult.data;

        if (!relations || relations.length === 0) {
          setLoading(false);
          return;
        }

        // Filter campaigns we need
        //@ts-ignore
        const campaignIds = relations.map((r) => r.campaign_id);
        const campaigns = allCampaignsResult.data?.filter((c) =>
          //@ts-ignore
          campaignIds.includes(c.id),
        );

        // ⚡ BATCH STATE UPDATES
        const activeCount = relations.filter(
          //@ts-ignore
          (r) => r.status === "accepted",
        ).length;
        const totalEarnings = relations.reduce(
          //@ts-ignore
          (sum, r) => sum + (r.final_payout || 0),
          0,
        );
        //@ts-ignore
        const recent = relations.slice(0, 3).map((r) => {
          //@ts-ignore
          const campaign = campaigns?.find((c) => c.id === r.campaign_id);
          //@ts-ignore
          const status: "Active" | "Completed" | "Pending" =
            //@ts-ignore
            r.status === "accepted"
              ? "Active"
              : //@ts-ignore
                r.status === "completed"
                ? "Completed"
                : "Pending";
          //@ts-ignore
          return { name: campaign?.name || "Campaign", status };
        });

        // Update all state at once
        setActiveCampaigns(activeCount);
        setEarnings(totalEarnings);
        setRecentCampaigns(recent);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, navigate]);

  /* -------------------------------
     STATS CONFIG
  ------------------------------- */
  const stats = [
    {
      title: "Active Campaigns",
      value: activeCampaigns,
      icon: Calendar,
      note: "Currently running",
    },
    {
      title: "Total Reach",
      value: followers ? followers.toLocaleString() : "—",
      icon: TrendingUp,
      note: "Instagram followers",
    },
    {
      title: "Engagement",
      value: "Coming soon",
      icon: BarChart3,
      note: "Auto-calculated",
    },
    {
      title: "Earnings",
      value: `₹${earnings}`,
      icon: DollarSign,
      note: "Lifetime earnings",
    },
  ];

  /* -------------------------------
     RENDER
  ------------------------------- */
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Theme Background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ background: theme.background }}
      />

      {/* Themed Studio Background (CSS-based, hidden on mobile) */}
      <ThemedStudioBackground themeKey={themeKey} />

      {/* Ambient Background (hidden on mobile) */}
      <div className="hidden md:block">
        <AmbientLayer themeKey={themeKey} />
      </div>

      {/* Welcome Modal */}
      <WelcomeModal
        show={showWelcome}
        onClose={() => setShowWelcome(false)}
        fullName={fullName}
        themeKey={themeKey}
      />

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* CONTENT */}
      <main className="relative z-10 px-6 py-10 max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <h2 className={`text-3xl font-bold ${theme.text}`}>
            Welcome {fullName} 👋
          </h2>
          <p className={theme.muted}>Your personalized creator dashboard</p>
        </div>

        {/* STATS */}
        {/* STATS - with memoized cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {loading
            ? [1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)
            : stats.map((s, i) => <StatCard key={s.title} stat={s} />)}
        </div>

        {/* RECENT + ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RECENT CAMPAIGNS */}
          <Card className={`${theme.card} ${theme.radius}`}>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Your latest activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                // Show skeleton while loading
                <div className="space-y-3">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : (
                <>
                  {recentCampaigns.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No campaigns yet — explore new opportunities 🚀
                    </p>
                  )}

                  {recentCampaigns.map((c, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-4 rounded-lg bg-white/10"
                    >
                      <span className={theme.text}>{c.name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          c.status === "Active"
                            ? "bg-green-500/20 text-green-400"
                            : c.status === "Pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* QUICK ACTIONS */}
          <Card className={`${theme.card} ${theme.radius}`}>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Move faster</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={() => navigate("/dashboard/campaigns/all")}
              >
                Browse Campaigns
              </Button>
              <Button
                variant="outline"
                className="w-full text-foreground"
                onClick={() => navigate("/dashboard/campaigns/my")}
              >
                My Campaigns
              </Button>
              <Button
                variant="outline"
                className="w-full text-foreground"
                disabled
              >
                Analytics (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InfluencerDashboard;
