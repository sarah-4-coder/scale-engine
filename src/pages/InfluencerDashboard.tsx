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

// ⚡ MEMOIZED STAT CARD (Mobile Optimized)
const StatCard = memo(({ stat }: { stat: any }) => {
  const { theme } = useInfluencerTheme();

  return (
    <Card className={`${theme.card} ${theme.radius}`}>
      <CardHeader className="flex flex-row justify-between items-center pb-2 px-3 pt-3 md:px-6 md:pt-6">
        <CardTitle className="text-xs md:text-sm opacity-70">
          {stat.title}
        </CardTitle>
        <stat.icon className="h-4 w-4 md:h-4 md:w-4 opacity-70" />
      </CardHeader>
      <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
        <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
        <p className="text-[10px] md:text-xs opacity-60 mt-1">{stat.note}</p>
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
            className="absolute top-20 right-32 opacity-10"
            animate={{ rotate: [0, 5, 0, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="80" height="120" viewBox="0 0 80 120">
              <line
                x1="40"
                y1="10"
                x2="40"
                y2="30"
                stroke="#000"
                strokeWidth="2"
              />
              <circle cx="40" cy="10" r="5" fill="#000" />
              <path
                d="M 20 30 Q 40 40, 60 30"
                stroke="#000"
                strokeWidth="3"
                fill="none"
              />
              <rect x="15" y="45" width="50" height="60" fill="#000" />
            </svg>
          </motion.div>

          {/* Magazine Text */}
          <div className="absolute bottom-32 left-10 font-serif text-black/5 text-8xl font-bold italic transform -rotate-12">
            VOGUE
          </div>
        </div>
      );
    //@ts-ignore
    case "music":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Vinyl Record */}
          <motion.div
            className="absolute bottom-10 right-10 w-80 h-80 opacity-10"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <svg viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="95"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1"
              />
              <circle
                cx="100"
                cy="100"
                r="60"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1"
              />
              <circle
                cx="100"
                cy="100"
                r="40"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1"
              />
              <circle cx="100" cy="100" r="20" fill="#8b5cf6" />
            </svg>
          </motion.div>

          {/* Waveform */}
          <svg
            className="absolute top-1/2 left-0 w-full opacity-5"
            height="100"
            viewBox="0 0 1000 100"
          >
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.rect
                key={i}
                x={i * 20}
                y={50 - Math.random() * 40}
                width="10"
                height={Math.random() * 80}
                fill="#ec4899"
                animate={{ height: [Math.random() * 80, Math.random() * 80] }}
                transition={{
                  duration: 1 + Math.random(),
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </svg>

          {/* Music Notes */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-purple-400 text-4xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 10, 0],
                }}
                transition={{
                  duration: 3 + i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                ♪
              </motion.div>
            ))}
          </div>
        </div>
      );
    //@ts-ignore
    case "food":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Chef Hat */}
          <motion.div
            className="absolute top-20 left-20 opacity-5"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="120" height="100" viewBox="0 0 120 100">
              <ellipse cx="60" cy="80" rx="50" ry="15" fill="#ff6b35" />
              <path
                d="M 20 80 Q 20 30, 60 20 Q 100 30, 100 80"
                fill="#ff6b35"
              />
            </svg>
          </motion.div>

          {/* Fork and Knife */}
          <div className="absolute bottom-20 right-20 opacity-10">
            <svg width="100" height="120" viewBox="0 0 100 120">
              <line
                x1="30"
                y1="20"
                x2="30"
                y2="100"
                stroke="#ff6b35"
                strokeWidth="3"
              />
              <line
                x1="20"
                y1="20"
                x2="20"
                y2="50"
                stroke="#ff6b35"
                strokeWidth="3"
              />
              <line
                x1="40"
                y1="20"
                x2="40"
                y2="50"
                stroke="#ff6b35"
                strokeWidth="3"
              />
              <rect x="65" y="20" width="10" height="80" fill="#ff6b35" />
              <path d="M 60 20 L 80 20 L 75 50 L 65 50 Z" fill="#ff6b35" />
            </svg>
          </div>

          {/* Floating Ingredients */}
          {[
            { emoji: "🍕", x: 10, y: 30 },
            { emoji: "🍔", x: 80, y: 50 },
            { emoji: "🍜", x: 20, y: 70 },
            { emoji: "🥗", x: 70, y: 20 },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl opacity-5"
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {item.emoji}
            </motion.div>
          ))}
        </div>
      );
    //@ts-ignore
    case "travel":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* World Map Outline */}
          <svg
            className="absolute inset-0 w-full h-full opacity-5"
            viewBox="0 0 1000 600"
          >
            <path
              d="M 100 200 L 150 180 L 200 190 L 250 170 L 300 180 L 350 160 L 400 170 L 450 150"
              stroke="#14b8a6"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 500 300 Q 550 280, 600 300 Q 650 320, 700 300"
              stroke="#14b8a6"
              strokeWidth="2"
              fill="none"
            />
          </svg>

          {/* Airplane */}
          <motion.div
            className="absolute opacity-10"
            animate={{
              x: [-100, 1200],
              y: [100, 400],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <svg width="60" height="60" viewBox="0 0 60 60">
              <path d="M 30 10 L 50 30 L 30 25 L 10 30 Z" fill="#14b8a6" />
              <rect x="28" y="25" width="4" height="20" fill="#14b8a6" />
              <path d="M 20 40 L 30 45 L 40 40" fill="#14b8a6" />
            </svg>
          </motion.div>

          {/* Location Pins */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-teal-500 opacity-10"
              style={{
                left: `${20 + i * 12}%`,
                top: `${30 + (i % 2) * 30}%`,
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
              }}
            >
              <svg width="30" height="40" viewBox="0 0 30 40">
                <path
                  d="M 15 0 C 7 0, 0 7, 0 15 C 0 25, 15 40, 15 40 C 15 40, 30 25, 30 15 C 30 7, 23 0, 15 0 Z"
                  fill="currentColor"
                />
                <circle cx="15" cy="15" r="5" fill="white" />
              </svg>
            </motion.div>
          ))}
        </div>
      );

    case "fitness":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Dumbbells */}
          <motion.div
            className="absolute top-20 right-20 opacity-10"
            animate={{ rotate: [0, 45, 0, -45, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="120" height="60" viewBox="0 0 120 60">
              <rect x="0" y="20" width="20" height="20" fill="#10b981" />
              <rect x="15" y="27" width="90" height="6" fill="#10b981" />
              <rect x="100" y="20" width="20" height="20" fill="#10b981" />
            </svg>
          </motion.div>

          {/* Heart Rate Line */}
          <svg
            className="absolute bottom-20 left-0 w-full opacity-5"
            height="100"
            viewBox="0 0 1000 100"
          >
            <motion.path
              d="M 0 50 L 200 50 L 220 20 L 240 80 L 260 50 L 460 50 L 480 20 L 500 80 L 520 50 L 720 50 L 740 20 L 760 80 L 780 50 L 1000 50"
              stroke="#10b981"
              strokeWidth="3"
              fill="none"
              animate={{ strokeDashoffset: [0, -100] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ strokeDasharray: "100 100" }}
            />
          </svg>

          {/* Running Silhouette */}
          <motion.div
            className="absolute bottom-40 opacity-5"
            animate={{ x: [-100, 1100] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <svg width="80" height="120" viewBox="0 0 80 120">
              <circle cx="40" cy="20" r="15" fill="#10b981" />
              <path
                d="M 40 35 L 40 70 L 20 110 M 40 70 L 60 110 M 40 45 L 15 55 M 40 45 L 65 35"
                stroke="#10b981"
                strokeWidth="4"
                fill="none"
              />
            </svg>
          </motion.div>
        </div>
      );

    default:
      return null;
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
  const { theme } = useInfluencerTheme();

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
          >
            <Card
              className={`${theme.card} ${theme.radius} border-2 ${theme.primary.includes("cyan") ? "border-cyan-500/30" : theme.primary.includes("purple") ? "border-purple-500/30" : "border-orange-500/30"}`}
            >
              <CardHeader className="relative px-4 pt-4 md:px-6 md:pt-6">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 md:p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <div className="pr-8">
                  <Sparkles
                    className={`h-8 w-8 md:h-10 md:w-10 ${theme.accent} mb-3 md:mb-4`}
                  />
                  <CardTitle
                    className={`text-xl md:text-2xl ${theme.text} mb-1.5 md:mb-2`}
                  >
                    Welcome {fullName}! 🎉
                  </CardTitle>
                  <CardDescription
                    className={`${theme.muted} text-sm md:text-base`}
                  >
                    Your creator dashboard is ready
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 md:space-y-4 px-4 pb-4 md:px-6 md:pb-6">
                <div
                  className={`p-3 md:p-4 rounded-lg ${theme.card} border border-white/10`}
                >
                  <h4
                    className={`font-semibold text-sm md:text-base ${theme.text} mb-1.5 md:mb-2`}
                  >
                    ✨ What's New
                  </h4>
                  <ul
                    className={`space-y-1 md:space-y-1.5 text-xs md:text-sm ${theme.muted}`}
                  >
                    <li>• Browse campaigns matched to your profile</li>
                    <li>• Track your applications in real-time</li>
                    <li>
                      • Personalized theme:{" "}
                      <span className="capitalize">{themeKey}</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={onClose}
                  className={`w-full bg-gradient-to-r ${theme.primary} h-10 md:h-11 text-sm md:text-base`}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* --------------------------------
   MAIN DASHBOARD COMPONENT
-------------------------------- */
const InfluencerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, themeKey, setTheme } = useInfluencerTheme();

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("Creator");
  const [followers, setFollowers] = useState<number | null>(null);
  const [activeCampaigns, setActiveCampaigns] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);

  /* -------------------------------
     FETCH DASHBOARD DATA
  ------------------------------- */
  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);

        // ⚡ PARALLEL QUERIES - Fetch profile and influencer data together
        const [profileResult, influencerResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("influencer_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single(),
        ]);

        const profile = profileResult.data as { full_name: string } | null;
        const influencer = influencerResult.data as {
          followers_count: number | null;
          id: string;
        } | null;

        setFullName(profile ? profile.full_name : "Creator");

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

      {/* CONTENT - Mobile Optimized Padding */}
      <main className="relative z-10 px-4 md:px-6 py-6 md:py-10 max-w-6xl mx-auto">
        {/* HEADER - Mobile Optimized Typography */}
        <div className="mb-6 md:mb-10">
          <h2 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>
            Welcome {fullName} 👋
          </h2>
          <p className={`${theme.muted} text-sm md:text-base mt-1`}>
            Your personalized creator dashboard
          </p>
        </div>

        {/* STATS - Mobile: 2x2 Grid, Desktop: 4 Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
          {loading
            ? [1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)
            : stats.map((s, i) => <StatCard key={s.title} stat={s} />)}
        </div>

        {/* RECENT + ACTIONS - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* RECENT CAMPAIGNS */}
          <Card className={`${theme.card} ${theme.radius}`}>
            <CardHeader className="px-4 pt-4 md:px-6 md:pt-6">
              <CardTitle className="text-lg md:text-xl">
                Recent Campaigns
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Your latest activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 px-4 pb-4 md:px-6 md:pb-6">
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
                    <p className="text-xs md:text-sm text-muted-foreground">
                      No campaigns yet — explore new opportunities 🚀
                    </p>
                  )}

                  {recentCampaigns.map((c, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 md:p-4 rounded-lg bg-white/10"
                    >
                      <span
                        className={`${theme.text} text-sm md:text-base truncate pr-2`}
                      >
                        {c.name}
                      </span>
                      <span
                        className={`text-[10px] md:text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
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
            <CardHeader className="px-4 pt-4 md:px-6 md:pt-6">
              <CardTitle className="text-lg md:text-xl">
                Quick Actions
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Move faster
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 px-4 pb-4 md:px-6 md:pb-6">
              <Button
                className="w-full h-11 text-sm md:text-base"
                onClick={() => navigate("/dashboard/campaigns/all")}
              >
                Browse Campaigns
              </Button>
              <Button
                variant="outline"
                className="w-full text-foreground h-11 text-sm md:text-base"
                onClick={() => navigate("/dashboard/campaigns/my")}
              >
                My Campaigns
              </Button>
              <Button
                variant="outline"
                className="w-full text-foreground h-11 text-sm md:text-base"
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
