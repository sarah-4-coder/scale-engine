/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Link as LinkIcon,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendNotification } from "@/lib/notifications";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import AmbientLayer from "@/components/ambient/AmbientLayer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DetailSkeleton } from "@/components/influencer/Skeletons";
import { ThemeKey } from "@/theme/themes";

/* --------------------------------
   TYPES
-------------------------------- */
interface Campaign {
  id: string;
  name: string;
  description: string | null;
  niches: string[];
  deliverables: string;
  timeline: string;
  base_payout: number;
  admin_user_id: string;
}

interface Application {
  campaign_id: string;
  status: string;
  requested_payout: number | null;
  final_payout: number | null;
  posted_link?: string[] | null;
  negotiation_note?: string | null;
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

const getRequiredLinksCount = (deliverables: string): number => {
  const matches = deliverables.match(/\d+/g);
  if (!matches) return 1;
  return matches.map(Number).reduce((a, b) => a + b, 0);
};

const CampaignDetail = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [influencerId, setInfluencerId] = useState<string | null>(null);

  // Negotiation state
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [requestedPayout, setRequestedPayout] = useState("");
  const [note, setNote] = useState("");

  // Content submission state
  const [postedLinks, setPostedLinks] = useState<
    { label: string; url: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  /* -------------------------------
     FETCH DATA (with real-time updates)
  ------------------------------- */
  const fetchData = useCallback(async () => {
    if (!user || !campaignId) return;

    try {
      // Get influencer profile
      const { data: profile } = await supabase
        .from("influencer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        toast.error("Influencer profile not found");
        navigate("/dashboard/campaigns/my");
        return;
      }
      //@ts-ignore
      setInfluencerId(profile.id);

      // Get campaign
      const { data: campaignData } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (!campaignData) {
        toast.error("Campaign not found");
        navigate("/dashboard/campaigns/my");
        return;
      }

      setCampaign(campaignData);

      // Get application
      const { data: applicationData } = await supabase
        .from("campaign_influencers")
        .select(
          "campaign_id, status, requested_payout, final_payout, posted_link, negotiation_note",
        )
        //@ts-ignore
        .eq("influencer_id", profile.id)
        .eq("campaign_id", campaignId)
        .single();

      if (!applicationData) {
        toast.error("Application not found");
        navigate("/dashboard/campaigns/my");
        return;
      }

      setApplication(applicationData);

      // Initialize content submission fields
      //@ts-ignore
      const count = getRequiredLinksCount(campaignData.deliverables);
      setPostedLinks(
        Array.from({ length: count }, () => ({ label: "", url: "" })),
      );

      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load campaign details");
      navigate("/dashboard/campaigns/my");
    }
  }, [user, campaignId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* -------------------------------
     REAL-TIME SUBSCRIPTION
  ------------------------------- */
  useEffect(() => {
    if (!influencerId || !campaignId) return;

    // Subscribe to changes in campaign_influencers table
    const subscription = supabase
      .channel(`campaign_${campaignId}_influencer_${influencerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "campaign_influencers",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log("Real-time update:", payload);
          // Refetch data when changes occur
          fetchData();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [influencerId, campaignId, fetchData]);

  /* -------------------------------
     NEGOTIATION ACTIONS
  ------------------------------- */
  const submitNegotiation = async () => {
    if (!campaignId || !requestedPayout || !influencerId || !campaign) return;

    const { error } = await supabase
      .from("campaign_influencers")
      //@ts-ignore
      .update({
        requested_payout: Number(requestedPayout),
        negotiation_note: note,
        status: "influencer_negotiated",
      })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    if (error) {
      toast.error("Failed to submit negotiation");
      return;
    }

    // Send notification to admin
    sendNotification({
      user_id: campaign.admin_user_id,
      role: "admin",
      type: "negotiation_started",
      title: "New negotiation request",
      message: `Influencer requested ₹${requestedPayout}`,
      metadata: {
        campaign_id: campaignId,
        influencer_id: influencerId,
      },
    }).catch(console.error);

    toast.success("Negotiation request sent");
    setShowNegotiationModal(false);
    setRequestedPayout("");
    setNote("");

    // Data will be refreshed by real-time subscription
  };

  const acceptCounterOffer = async () => {
    if (!application?.requested_payout || !influencerId || !campaignId) return;

    await supabase
      .from("campaign_influencers")
      //@ts-ignore
      .update({
        final_payout: application.requested_payout,
        status: "accepted",
      })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    toast.success("Offer accepted");
    // Data will be refreshed by real-time subscription
  };

  const acceptBasePayout = async () => {
    if (!influencerId || !campaign || !campaignId) return;

    await supabase
      .from("campaign_influencers")
      //@ts-ignore
      .update({
        final_payout: campaign.base_payout,
        status: "accepted",
      })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    toast.success("Base payout accepted");
    // Data will be refreshed by real-time subscription
  };

  const unregisterFromCampaign = async () => {
    if (!influencerId || !campaignId) return;

    await supabase
      .from("campaign_influencers")
      .delete()
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    toast.success("You have left the campaign");
    navigate("/dashboard/campaigns/my");
  };

  /* -------------------------------
     CONTENT SUBMISSION
  ------------------------------- */
  const submitPostedLinks = async () => {
    if (!campaignId || !influencerId) return;

    if (postedLinks.some((e) => !e.label.trim() || !e.url.trim())) {
      toast.error("Please fill label and link for all deliverables");
      return;
    }

    const formattedLinks = postedLinks.map(
      (e) => `${e.label.trim()} | ${e.url.trim()}`,
    );

    setSubmitting(true);

    const { error } = await supabase
      .from("campaign_influencers")
      //@ts-ignore
      .update({
        posted_link: formattedLinks,
        status: "content_posted",
      })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit links");
      return;
    }

    if (campaign?.admin_user_id) {
      sendNotification({
        user_id: campaign.admin_user_id,
        role: "admin",
        type: "content_submitted",
        title: "Content submitted",
        message: `Influencer submitted content for ${campaign.name}`,
        metadata: {
          campaign_id: campaignId,
          influencer_id: influencerId,
        },
      }).catch(console.error);
    }

    toast.success("Content submitted successfully");
    // Data will be refreshed by real-time subscription
  };

  /* -------------------------------
     STATUS INFO
  ------------------------------- */
  const getStatusInfo = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: string; icon: any; bg: string }
    > = {
      applied: {
        label: "Applied",
        color: "text-blue-400",
        icon: Clock,
        bg: "bg-blue-500/20",
      },
      shortlisted: {
        label: "Shortlisted",
        color: "text-green-400",
        icon: CheckCircle2,
        bg: "bg-green-500/20",
      },
      influencer_negotiated: {
        label: "Negotiating",
        color: "text-yellow-400",
        icon: AlertCircle,
        bg: "bg-yellow-500/20",
      },
      admin_negotiated: {
        label: "Counter Offer",
        color: "text-orange-400",
        icon: AlertCircle,
        bg: "bg-orange-500/20",
      },
      accepted: {
        label: "Accepted",
        color: "text-green-400",
        icon: CheckCircle2,
        bg: "bg-green-500/20",
      },
      not_shortlisted: {
        label: "Not Shortlisted",
        color: "text-red-400",
        icon: XCircle,
        bg: "bg-red-500/20",
      },
      rejected: {
        label: "Rejected",
        color: "text-red-400",
        icon: XCircle,
        bg: "bg-red-500/20",
      },
      content_posted: {
        label: "Content Submitted",
        color: "text-purple-400",
        icon: CheckCircle2,
        bg: "bg-purple-500/20",
      },
      content_rejected: {
        label: "Content Rejected",
        color: "text-red-400",
        icon: XCircle,
        bg: "bg-red-500/20",
      },
      completed: {
        label: "Completed",
        color: "text-emerald-400",
        icon: CheckCircle2,
        bg: "bg-emerald-500/20",
      },
    };

    return (
      statusMap[status] || {
        label: status,
        color: "text-gray-400",
        icon: Clock,
        bg: "bg-gray-500/20",
      }
    );
  };

  const statusInfo = application ? getStatusInfo(application.status) : null;
  const StatusIcon = statusInfo?.icon;

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

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* CONTENT */}
      <main className="relative z-10 px-4 md:px-6 py-6 md:py-10 max-w-5xl mx-auto">
        {/* BACK BUTTON */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/dashboard/campaigns/my")}
          className={`flex items-center gap-2 mb-6 ${theme.muted} hover:${theme.text} transition-colors`}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to My Campaigns</span>
        </motion.button>

        {loading || !campaign || !application ? (
          <DetailSkeleton theme={theme} />
        ) : (
          <>
            {/* CAMPAIGN HEADER */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className={`text-4xl font-bold ${theme.text} mb-2`}>
                    {campaign.name}
                  </h1>
                  {campaign.description && (
                    <p className={`${theme.muted} text-lg`}>
                      {campaign.description}
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                {statusInfo && StatusIcon && (
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusInfo.bg} flex-shrink-0`}
                  >
                    <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                    <span className={`text-sm font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Niches */}
              <div className="flex flex-wrap gap-2">
                {campaign.niches.map((niche) => (
                  <span
                    key={niche}
                    className={`px-3 py-1.5 rounded-lg bg-white/10 text-sm ${theme.muted}`}
                  >
                    {niche}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* CAMPAIGN DETAILS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className={`${theme.card} ${theme.radius}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Target className={`h-5 w-5 ${theme.accent}`} />
                      <CardTitle className="text-sm">Deliverables</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={`${theme.text} font-medium`}>
                      {campaign.deliverables}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className={`${theme.card} ${theme.radius}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className={`h-5 w-5 ${theme.accent}`} />
                      <CardTitle className="text-sm">Timeline</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={`${theme.text} font-medium`}>
                      {campaign.timeline}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className={`${theme.card} ${theme.radius}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className={`h-5 w-5 ${theme.accent}`} />
                      <CardTitle className="text-sm">Payout</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={`${theme.text} font-medium text-xl`}>
                      {application.final_payout
                        ? `₹${application.final_payout}`
                        : `₹${campaign.base_payout} (Base)`}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* STATUS-BASED ACTIONS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className={`${theme.card} ${theme.radius}`}>
                <CardHeader>
                  <CardTitle>Campaign Actions</CardTitle>
                  <CardDescription>
                    Manage your campaign participation
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* APPLIED */}
                  {application.status === "applied" && (
                    <div
                      className={`p-4 rounded-lg bg-blue-500/10 border border-blue-500/20`}
                    >
                      <p className={`${theme.text} mb-2`}>
                        ⏳ Application submitted. Waiting for brand approval.
                      </p>
                    </div>
                  )}

                  {/* SHORTLISTED */}
                  {application.status === "shortlisted" && (
                    <div className="space-y-4">
                      <div
                        className={`p-4 rounded-lg bg-green-500/10 border border-green-500/20`}
                      >
                        <p className={`${theme.text} font-medium mb-2`}>
                          🎉 Congratulations! You've been shortlisted!
                        </p>
                        <p className={`${theme.muted} text-sm`}>
                          You can accept the base payout or negotiate for a
                          different amount.
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row gap-3">
                        <Button onClick={acceptBasePayout} className="flex-1">
                          Accept Base Payout (₹{campaign.base_payout})
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowNegotiationModal(true)}
                          className="flex-1"
                        >
                          Negotiate Payout
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* INFLUENCER NEGOTIATED */}
                  {application.status === "influencer_negotiated" && (
                    <div
                      className={`p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20`}
                    >
                      <p className={`${theme.text} mb-2`}>
                        💬 Your negotiation request (₹
                        {application.requested_payout}) has been sent.
                      </p>
                      <p className={`${theme.muted} text-sm`}>
                        Waiting for brand response...
                      </p>
                      {application.negotiation_note && (
                        <div className="mt-3 p-3 rounded bg-white/5">
                          <p className={`${theme.muted} text-xs mb-1`}>
                            Your note:
                          </p>
                          <p className={`${theme.text} text-sm`}>
                            {application.negotiation_note}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ADMIN COUNTER OFFER */}
                  {application.status === "admin_negotiated" && (
                    <div className="space-y-4">
                      <div
                        className={`p-4 rounded-lg bg-orange-500/10 border border-orange-500/20`}
                      >
                        <p className={`${theme.text} mb-2`}>
                          💰 Brand has proposed a counter offer: ₹
                          {application.requested_payout}
                        </p>
                        <p className={`${theme.muted} text-sm`}>
                          You can accept this offer or make another counter
                          proposal.
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row gap-3">
                        <Button onClick={acceptCounterOffer} className="flex-1">
                          Accept Counter Offer
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowNegotiationModal(true)}
                          className="flex-1"
                        >
                          Counter Again
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* REJECTED */}
                  {application.status === "rejected" && (
                    <div className="space-y-4">
                      <div
                        className={`p-4 rounded-lg bg-red-500/10 border border-red-500/20`}
                      >
                        <p className={`${theme.text} mb-2`}>
                          Negotiation rejected by brand.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={acceptBasePayout} className="flex-1">
                          Accept Base Payout (₹{campaign.base_payout})
                        </Button>
                        <Button
                          variant="outline"
                          onClick={unregisterFromCampaign}
                          className="flex-1"
                        >
                          Leave Campaign
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* NOT SHORTLISTED */}
                  {application.status === "not_shortlisted" && (
                    <div className="space-y-4">
                      <div
                        className={`p-4 rounded-lg bg-red-500/10 border border-red-500/20`}
                      >
                        <p className={`${theme.text} mb-2`}>
                          Unfortunately, you were not shortlisted for this
                          campaign.
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        onClick={unregisterFromCampaign}
                        className="w-full"
                      >
                        Leave Campaign
                      </Button>
                    </div>
                  )}

                  {/* ACCEPTED - CONTENT SUBMISSION */}
                  {(application.status === "accepted" ||
                    application.status === "content_rejected") && (
                    <div className="space-y-4">
                      <div
                        className={`p-4 rounded-lg bg-green-500/10 border border-green-500/20`}
                      >
                        <p className={`${theme.text} font-medium mb-2`}>
                          ✅ Campaign Accepted! Final Payout: ₹
                          {application.final_payout}
                        </p>
                        <p className={`${theme.muted} text-sm`}>
                          Please submit your content links below to complete the
                          campaign.
                        </p>
                        <div
                          className={`p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mt-4`}
                        >
                          <p className={`${theme.text} font-medium mb-2`}>
                            📋 Submission Process:
                          </p>
                          <ol
                            className={`${theme.muted} text-sm space-y-2 list-decimal list-inside`}
                          >
                            <li>
                              First, submit your content to{" "}
                              <span className={`${theme.text} font-semibold`}>
                                +91 8546023170
                              </span>{" "}
                              for approval on WhatsApp
                            </li>
                            <li>
                              After approval, post it on
                              Instagram/YouTube/Twitter, etc.
                            </li>
                            <li>Submit the posted links below</li>
                          </ol>
                        </div>
                      </div>

                      {application.status === "content_rejected" && (
                        <div
                          className={`p-3 rounded-lg bg-red-500/10 border border-red-500/20`}
                        >
                          <p className={`text-red-400 text-sm`}>
                            ⚠️ Previous content was rejected. Please submit
                            again.
                          </p>
                        </div>
                      )}

                      <div className="space-y-3">
                        <p
                          className={`${theme.text} font-medium flex items-center gap-2`}
                        >
                          <LinkIcon className="h-4 w-4" />
                          Submit Content Links
                        </p>

                        {postedLinks.map((item, index) => (
                          <div
                            key={index}
                            className="space-y-2 p-4 rounded-lg bg-white/5"
                          >
                            <p className={`${theme.muted} text-xs`}>
                              Deliverable #{index + 1}
                            </p>
                            <Input
                              className="h-11 bg-white/10 border-white/20"
                              placeholder="Label (e.g., Reel, Story, Post)"
                              value={item.label}
                              onChange={(e) => {
                                const copy = [...postedLinks];
                                copy[index].label = e.target.value;
                                setPostedLinks(copy);
                              }}
                              disabled={submitting}
                            />
                            <Input
                              className="h-11 bg-white/10 border-white/20"
                              placeholder="Instagram link"
                              value={item.url}
                              onChange={(e) => {
                                const copy = [...postedLinks];
                                copy[index].url = e.target.value;
                                setPostedLinks(copy);
                              }}
                              disabled={submitting}
                            />
                          </div>
                        ))}

                        <Button
                          onClick={submitPostedLinks}
                          disabled={
                            submitting ||
                            postedLinks.some(
                              (l) => !l.label.trim() || !l.url.trim(),
                            )
                          }
                          className="w-full"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Submit Content
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* CONTENT POSTED */}
                  {application.status === "content_posted" && (
                    <div
                      className={`p-4 rounded-lg bg-purple-500/10 border border-purple-500/20`}
                    >
                      <p className={`${theme.text} mb-2`}>
                        ✅ Content submitted successfully!
                      </p>
                      <p className={`${theme.muted} text-sm`}>
                        Waiting for brand approval...
                      </p>
                    </div>
                  )}

                  {/* COMPLETED */}
                  {application.status === "completed" && (
                    <div
                      className={`p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20`}
                    >
                      <p className={`${theme.text} font-medium mb-2`}>
                        🎉 Campaign Completed!
                      </p>
                      <p className={`${theme.muted} text-sm`}>
                        Congratulations on successfully completing this
                        campaign. Earnings: ₹{application.final_payout}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </main>

      {/* NEGOTIATION MODAL */}
      <AnimatePresence>
        {showNegotiationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowNegotiationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${theme.card} ${theme.radius} p-6 w-full max-w-md space-y-4`}
            >
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className={`h-6 w-6 ${theme.accent}`} />
                <h3 className={`text-xl font-bold ${theme.text}`}>
                  Negotiate Payout
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm ${theme.muted} mb-2`}>
                    Requested Amount (₹)
                  </label>
                  <Input
                    className="h-11 bg-white/10 border-white/20"
                    type="number"
                    placeholder="Enter your requested payout"
                    value={requestedPayout}
                    onChange={(e) => setRequestedPayout(e.target.value)}
                  />
                </div>

                <div>
                  <label className={`block text-sm ${theme.muted} mb-2`}>
                    Note (Optional)
                  </label>
                  <Textarea
                    className="min-h-[100px] bg-white/10 border-white/20"
                    placeholder="Explain why you deserve this payout..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNegotiationModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitNegotiation}
                  disabled={!requestedPayout}
                  className="flex-1"
                >
                  Submit Request
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignDetail;
