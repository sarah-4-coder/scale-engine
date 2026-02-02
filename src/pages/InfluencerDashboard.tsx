/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { memo, useState, useEffect } from "react";
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
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";
import { useDashboardStats } from "@/hooks/useCampaigns";

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
      <CardHeader className="flex flex-row justify-between items-center pb-2 px-3 pt-3 md:px-6 md:pt-6">
        <CardTitle className="text-sm opacity-70">{stat.title}</CardTitle>
        <stat.icon className="h-4 w-4 opacity-70" />
      </CardHeader>

      <CardContent className="px-3 md:px-6">
        <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
        <p className="text-xs opacity-60 mt-1">{stat.note}</p>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = "StatCard";

/* --------------------------------
   WELCOME MODAL
-------------------------------- */
const WelcomeModal = ({
  show,
  onClose,
  fullName,
}: {
  show: boolean;
  onClose: () => void;
  fullName: string;
}) => {
  const { theme } = useInfluencerTheme();

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
          >
            <Card
              className={`${theme.card} ${theme.radius} border-2 border-purple-500/30`}
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
                  <CardDescription className={`${theme.muted} text-sm`}>
                    Your personalized influencer dashboard is ready
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-4 md:px-6 md:pb-6 space-y-3 md:space-y-4">
                <p className={`${theme.text} text-sm`}>
                  Start exploring campaigns that match your niche and grow your
                  brand partnerships.
                </p>

                <div className="flex gap-2 md:gap-3 flex-col sm:flex-row">
                  <Button
                    onClick={onClose}
                    className={`flex-1 bg-gradient-to-r ${theme.primary}`}
                  >
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const InfluencerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    theme,
    themeKey,
    setTheme,
    loading: themeLoading,
  } = useInfluencerTheme();

  const [showWelcome, setShowWelcome] = useState(false);

  // ⚡ USE REACT QUERY HOOK - Automatic caching & refetching
  const { data: stats, isLoading } = useDashboardStats(user?.id || '');

  // Extract data from hook (with defaults)
  const fullName = stats?.fullName || "Creator";
  const followers = stats?.followers;
  const activeCampaigns = stats?.activeCampaigns || 0;
  const earnings = stats?.earnings || 0;
  const recentCampaigns = stats?.recentCampaigns || [];

  /* -------------------------------
     CHECK IF FIRST VISIT
  ------------------------------- */
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("dotfluence_welcome_seen");
    if (!hasSeenWelcome && !themeLoading && !isLoading) {
      setTimeout(() => {
        setShowWelcome(true);
        localStorage.setItem("dotfluence_welcome_seen", "true");
      }, 1000);
    }
  }, [themeLoading, isLoading]);

  /* -------------------------------
     STATS CONFIG
  ------------------------------- */
  const statsConfig = [
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
     LOADING STATE
  ------------------------------- */
  // if (themeLoading) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
  //     </div>
  //   );
  // }

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

      {/* Themed Studio Background */}
      <ThemedStudioBackground themeKey={themeKey} />

      {/* Ambient Background */}
      <div className="hidden md:block">
        <AmbientLayer themeKey={themeKey} />
      </div>

      {/* Welcome Modal */}
      <WelcomeModal
        show={showWelcome}
        onClose={() => setShowWelcome(false)}
        fullName={fullName}
      />

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* CONTENT */}
      <main className="relative z-10 px-4 md:px-6 py-6 md:py-10 max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-6 md:mb-10">
          <h2 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>
            Welcome {fullName} 👋
          </h2>
          <p className={theme.muted}>Your personalized creator dashboard</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)
          ) : (
            statsConfig.map((s) => <StatCard key={s.title} stat={s} />)
          )}
        </div>

        {/* RECENT + ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* RECENT CAMPAIGNS */}
          <Card className={`${theme.card} ${theme.radius}`}>
            <CardHeader className="px-4 pt-4 md:px-6 md:pt-6">
              <CardTitle className="text-lg md:text-xl">
                Recent Campaigns
              </CardTitle>
              <CardDescription>Your latest activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6">
              {isLoading ? (
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
                      className="flex justify-between items-center p-3 md:p-4 rounded-lg bg-white/10"
                    >
                      <span className={`${theme.text} text-sm md:text-base`}>
                        {c.name}
                      </span>
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
            <CardHeader className="px-4 pt-4 md:px-6 md:pt-6">
              <CardTitle className="text-lg md:text-xl">
                Quick Actions
              </CardTitle>
              <CardDescription>Move faster</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6">
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

export default memo(InfluencerDashboard);