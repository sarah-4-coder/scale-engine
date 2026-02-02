/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import AmbientLayer from "@/components/ambient/AmbientLayer";
import { ThemeKey } from "@/theme/themes";
import {
  Calendar,
  DollarSign,
  Target,
  CheckCircle2,
  Users,
  Sparkles,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { CampaignCardSkeleton } from "@/components/influencer/Skeletons";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  niches: string[];
  deliverables: string;
  timeline: string;
  base_payout: number;
  eligibility?: {
    min_followers?: number;
    allowed_niches?: string[];
    allowed_cities?: string[];
  };
}

interface InfluencerProfile {
  id: string;
  niches: string[] | null;
  followers_count: number | null;
  city: string | null;
}

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

const AllCampaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    theme,
    themeKey,
    setTheme,
    loading: themeLoading,
  } = useInfluencerTheme();

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [appliedCampaignIds, setAppliedCampaignIds] = useState<string[]>([]);
  const [influencerId, setInfluencerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Influencer profile (FULL — needed for eligibility)
      const { data: profileData } = await supabase
        .from("influencer_profiles")
        .select("id, niches, followers_count, city")
        .eq("user_id", user.id)
        .single();

      if (!profileData) {
        toast.error("Influencer profile not found");
        return;
      }
      //@ts-ignore
      setInfluencerId(profileData.id);
      setProfile(profileData);

      // All campaigns
      const { data: campaignsData } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      setCampaigns(campaignsData || []);

      // Applied campaigns
      const { data: applications } = await supabase
        .from("campaign_influencers")
        .select("campaign_id")
        //@ts-ignore
        .eq("influencer_id", profileData.id);
      //@ts-ignore
      setAppliedCampaignIds(applications?.map((a) => a.campaign_id) || []);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  /* -----------------------
     ELIGIBILITY CHECK
  ----------------------- */
  const isEligible = (campaign: Campaign) => {
    if (!profile) return false;

    const e = campaign.eligibility || {};

    // Min followers
    if (
      e.min_followers &&
      (!profile.followers_count || profile.followers_count < e.min_followers)
    ) {
      return false;
    }

    // Allowed cities
    if (
      e.allowed_cities?.length &&
      (!profile.city || !e.allowed_cities.includes(profile.city))
    ) {
      return false;
    }

    // Allowed niches
    if (
      e.allowed_niches?.length &&
      (!profile.niches ||
        !profile.niches.some((n) => e.allowed_niches!.includes(n)))
    ) {
      return false;
    }

    return true;
  };

  const applyToCampaign = async (campaignId: string) => {
    if (!influencerId) return;
    //@ts-ignore
    const { error } = await supabase.from("campaign_influencers").insert({
      campaign_id: campaignId,
      influencer_id: influencerId,
      status: "applied",
    });

    if (error) {
      toast.error("Already applied or not allowed");
      return;
    }

    toast.success(
      "Applied successfully! Check My Campaigns to track progress.",
    );
    setAppliedCampaignIds((prev) => [...prev, campaignId]);
  };

  const eligibleCampaigns = campaigns.filter(isEligible);

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

      {/* Ambient Background */}
      <div className="hidden md:block">
        <AmbientLayer themeKey={themeKey} />
      </div>

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* CONTENT */}
      <main className="relative z-10 px-4 md:px-6 py-6 md:py-10 max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-6 md:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-3"
          >
            <Sparkles className={`h-6 w-6 md:h-8 md:w-8 ${theme.accent}`} />
            <h2 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>
              Discover Campaigns
            </h2>
          </motion.div>
          <p className={theme.muted}>
            Find campaigns that match your profile and start earning
          </p>

          {/* Stats Bar */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`mt-4 md:mt-6 ${theme.card} ${theme.radius} p-4`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-r ${theme.primary} bg-opacity-20`}
                  >
                    <Target className={`h-5 w-5 ${theme.accent}`} />
                  </div>
                  <div>
                    <p className={`text-xs md:text-sm ${theme.muted}`}>Available</p>
                    <p className={`text-lg md:text-xl font-bold ${theme.text}`}>
                      {eligibleCampaigns.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-r ${theme.primary} bg-opacity-20`}
                  >
                    <CheckCircle2 className={`h-5 w-5 ${theme.accent}`} />
                  </div>
                  <div>
                    <p className={`text-xs md:text-sm ${theme.muted}`}>Applied</p>
                    <p className={`text-lg md:text-xl font-bold ${theme.text}`}>
                      {appliedCampaignIds.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-r ${theme.primary} bg-opacity-20`}
                  >
                    <TrendingUp className={`h-5 w-5 ${theme.accent}`} />
                  </div>
                  <div>
                    <p className={`text-xs md:text-sm ${theme.muted}`}>Your Niche</p>
                    <p className={`text-sm font-medium ${theme.text}`}>
                      {profile?.niches?.[0] || "Not set"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <CampaignCardSkeleton key={i} theme={theme} />
            ))}
          </div>
        ) : (
          <>
            {/* CAMPAIGNS GRID */}
            {eligibleCampaigns.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${theme.card} ${theme.radius} p-12 text-center`}
              >
                <div className="max-w-md mx-auto">
                  <div
                    className={`inline-flex p-4 rounded-full bg-gradient-to-r ${theme.primary} bg-opacity-20 mb-4`}
                  >
                    <Target className={`h-12 w-12 ${theme.accent}`} />
                  </div>
                  <h3 className={`text-xl font-bold ${theme.text} mb-2`}>
                    No Campaigns Available
                  </h3>
                  <p className={`${theme.muted} mb-6`}>
                    There are no campaigns matching your profile at the moment.
                    Check back soon for new opportunities!
                  </p>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {eligibleCampaigns.map((campaign, index) => {
                  const isApplied = appliedCampaignIds.includes(campaign.id);

                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -4 }}
                      className="h-full"
                    >
                      <Card
                        className={`${theme.card} ${theme.radius} overflow-hidden transition-all duration-300 hover:shadow-2xl h-full flex flex-col`}
                      >
                        {/* Header with gradient overlay */}
                        <div
                          className={`relative p-4 md:p-6 bg-gradient-to-br ${theme.primary} bg-opacity-10`}
                        >
                          <CardHeader className="p-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <CardTitle className={`text-lg md:text-xl ${theme.text}`}>
                                {campaign.name}
                              </CardTitle>
                              {isApplied && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20">
                                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                                  <span className="text-xs text-green-400 font-medium">
                                    Applied
                                  </span>
                                </div>
                              )}
                            </div>

                            {campaign.description && (
                              <CardDescription
                                className={`${theme.muted} line-clamp-2`}
                              >
                                {campaign.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                        </div>

                        {/* Content */}
                        <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4 flex-grow">
                          {/* Niches */}
                          <div>
                            <p className={`text-xs ${theme.muted} mb-2`}>
                              Niches
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {campaign.niches.map((niche) => (
                                <span
                                  key={niche}
                                  className={`px-2 py-1 rounded-lg bg-white/10 text-xs ${theme.text}`}
                                >
                                  {niche}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Info Grid */}
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Target
                                className={`h-4 w-4 ${theme.accent} mt-0.5 flex-shrink-0`}
                              />
                              <div className="flex-grow min-w-0">
                                <p className={`text-xs ${theme.muted}`}>
                                  Deliverables
                                </p>
                                <p
                                  className={`text-sm ${theme.text} font-medium`}
                                >
                                  {campaign.deliverables}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Calendar
                                className={`h-4 w-4 ${theme.accent} mt-0.5 flex-shrink-0`}
                              />
                              <div className="flex-grow">
                                <p className={`text-xs ${theme.muted}`}>
                                  Timeline
                                </p>
                                <p
                                  className={`text-sm ${theme.text} font-medium`}
                                >
                                  {campaign.timeline}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <DollarSign
                                className={`h-4 w-4 ${theme.accent} mt-0.5 flex-shrink-0`}
                              />
                              <div className="flex-grow">
                                <p className={`text-xs ${theme.muted}`}>
                                  Base Payout
                                </p>
                                <p
                                  className={`text-base md:text-lg ${theme.text} font-bold`}
                                >
                                  ₹{campaign.base_payout.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Eligibility Info (if available) */}
                          {campaign.eligibility && (
                            <div className="pt-3 border-t border-white/10">
                              <p className={`text-xs ${theme.muted} mb-2`}>
                                Requirements
                              </p>
                              <div className="space-y-1">
                                {campaign.eligibility.min_followers && (
                                  <div className="flex items-center gap-2">
                                    <Users
                                      className={`h-3 w-3 ${theme.accent}`}
                                    />
                                    <span className={`text-xs ${theme.text}`}>
                                      {campaign.eligibility.min_followers.toLocaleString()}
                                      + followers
                                    </span>
                                  </div>
                                )}
                                {campaign.eligibility.allowed_cities &&
                                  campaign.eligibility.allowed_cities.length >
                                    0 && (
                                    <div className="flex items-center gap-2">
                                      <MapPin
                                        className={`h-3 w-3 ${theme.accent}`}
                                      />
                                      <span className={`text-xs ${theme.text}`}>
                                        {campaign.eligibility.allowed_cities.join(
                                          ", ",
                                        )}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
                        </CardContent>

                        {/* Footer Action */}
                        <div className="p-4 pt-0 md:p-6 md:pt-0">
                          {isApplied ? (
                            <Button
                              disabled
                              variant="outline"
                              className="w-full h-11 text-sm md:text-base"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Already Applied
                            </Button>
                          ) : (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                onClick={() => applyToCampaign(campaign.id)}
                                className={`w-full h-11 text-sm md:text-base bg-gradient-to-r ${theme.primary}`}
                              >
                                Apply Now
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AllCampaigns;