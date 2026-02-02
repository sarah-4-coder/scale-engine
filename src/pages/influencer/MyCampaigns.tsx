/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, memo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import AmbientLayer from "@/components/ambient/AmbientLayer";
import {
  ArrowRight,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { CampaignCardSkeleton } from "@/components/influencer/Skeletons";
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";
import { useInfluencerProfile, useMyCampaigns } from "@/hooks/useCampaigns";
import { supabase } from "@/integrations/supabase/client";

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
}

const MyCampaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    theme,
    themeKey,
    setTheme,
    loading: themeLoading,
  } = useInfluencerTheme();

  // ⚡ REACT QUERY HOOKS - Automatic caching & refetching
  const { data: profile, isLoading: profileLoading } = useInfluencerProfile(user?.id || '');
  const influencerId = profile?.id;
  
  // My campaigns - auto-refetches every 30 seconds for real-time feel
  const { data: applications = [], isLoading: applicationsLoading } = useMyCampaigns(influencerId || '');

  const loading = profileLoading || applicationsLoading;

  // Get campaign IDs
  //@ts-ignore
  const campaignIds = applications.map((a) => a.campaign_id) || [];

  // Fetch full campaign details for the applications
  const { data: campaigns = [] } = useInfluencerProfile(user?.id || '');

  // ⚡ REAL-TIME SUBSCRIPTION - Invalidate cache instead of manual refetch
  useEffect(() => {
    if (!influencerId) return;

    const subscription = supabase
      .channel(`my_campaigns_${influencerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "campaign_influencers",
          filter: `influencer_id=eq.${influencerId}`,
        },
        (payload) => {
          console.log("Real-time update:", payload);
          // Just invalidate cache - React Query handles the refetch
          queryClient.invalidateQueries({ 
            queryKey: ['my-campaigns', influencerId] 
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [influencerId, queryClient]);

  // Fetch campaign details when we have campaign IDs
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (campaignIds.length === 0) return;

      const { data: campaignsData } = await supabase
        .from("campaigns")
        .select("*")
        .in("id", campaignIds);

      // Store in cache for future use
      campaignsData?.forEach(campaign => {
        queryClient.setQueryData(['campaign', campaign.id], campaign);
      });
    };

    fetchCampaigns();
  }, [campaignIds.length, queryClient]);

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

  // Get campaigns from cache
  const campaignsWithDetails = applications.map(app => {
    //@ts-ignore
    const campaign = queryClient.getQueryData(['campaign', app.campaign_id]);
    return campaign;
  }).filter(Boolean);

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
      <main className="relative z-10 px-4 md:px-6 py-6 md:py-10 max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-6 md:mb-10">
          <h2 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>
            My Campaigns
          </h2>
          <p className={theme.muted}>
            Track and manage your campaign applications
          </p>
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
            {campaignsWithDetails.length === 0 ? (
              <div className={`${theme.card} ${theme.radius} p-12 text-center`}>
                <p className={theme.muted}>
                  You haven't applied to any campaigns yet.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/dashboard/campaigns/all")}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium"
                >
                  Browse Campaigns
                </motion.button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {campaignsWithDetails.map((campaign: Campaign, index) => {
                  const application = applications.find(
                    //@ts-ignore
                    (a) => a.campaign_id === campaign.id,
                  );
                  if (!application) return null;

                  const statusInfo = getStatusInfo(application.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -4 }}
                      onClick={() =>
                        navigate(`/dashboard/campaigns/my/${campaign.id}`)
                      }
                      className="cursor-pointer"
                    >
                      <Card
                        className={`${theme.card} ${theme.radius} overflow-hidden transition-all duration-300 hover:shadow-2xl`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <CardTitle className={`text-lg ${theme.text}`}>
                              {campaign.name}
                            </CardTitle>
                            <ArrowRight
                              className={`h-5 w-5 ${theme.accent} flex-shrink-0 mt-1`}
                            />
                          </div>

                          {/* Status Badge */}
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusInfo.bg} w-fit`}
                          >
                            <StatusIcon
                              className={`h-3.5 w-3.5 ${statusInfo.color}`}
                            />
                            <span
                              className={`text-xs font-medium ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Description */}
                          {campaign.description && (
                            <p
                              className={`${theme.muted} text-sm line-clamp-2`}
                            >
                              {campaign.description}
                            </p>
                          )}

                          {/* Quick Info */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className={`h-4 w-4 ${theme.accent}`} />
                              <span
                                className={`text-xs md:text-sm ${theme.muted}`}
                              >
                                {campaign.timeline}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <DollarSign
                                className={`h-4 w-4 ${theme.accent}`}
                              />
                              <span
                                className={`text-xs md:text-sm ${theme.text} font-medium`}
                              >
                                {application.final_payout
                                  ? `₹${application.final_payout} (Final)`
                                  : `₹${campaign.base_payout} (Base)`}
                              </span>
                            </div>
                          </div>

                          {/* Niches */}
                          <div className="flex flex-wrap gap-2">
                            {campaign.niches.slice(0, 3).map((niche) => (
                              <span
                                key={niche}
                                className={`px-2 py-1 rounded-lg bg-white/10 text-xs ${theme.muted}`}
                              >
                                {niche}
                              </span>
                            ))}
                            {campaign.niches.length > 3 && (
                              <span
                                className={`px-2 py-1 rounded-lg bg-white/10 text-xs ${theme.muted}`}
                              >
                                +{campaign.niches.length - 3} more
                              </span>
                            )}
                          </div>

                          {/* Click to view */}
                          <div className={`pt-2 border-t border-white/10`}>
                            <p
                              className={`text-xs ${theme.accent} flex items-center gap-1`}
                            >
                              Click to view details
                              <ArrowRight className="h-3 w-3" />
                            </p>
                          </div>
                        </CardContent>
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

export default memo(MyCampaigns);