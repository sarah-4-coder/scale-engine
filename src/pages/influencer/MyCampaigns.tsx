/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import MobileBottomNav from "@/components/influencer/MobileBottomNav";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import { Button } from "@/components/ui/button";
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
import { useInfluencerProfile, useMyCampaigns } from "@/hooks/useCampaigns";
import { supabase } from "@/integrations/supabase/client";
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  niches: string[];
  deliverables: string;
  timeline: string;
  base_payout: number;
  admin_user_id: string;
    brand_profiles?: {
      company_name: string;
      is_verified: boolean;
      industry: string;
      description: string;
      city: string;
      state: string;
      company_website: string;
      company_size: string;
    };
  }

interface Application {
  campaign_id: string;
  status: string;
  requested_payout: number | null;
  final_payout: number | null;
  posted_link?: string[] | null;
}

const MyCampaigns = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    theme,
    themeKey,
    setTheme,
    loading: themeLoading,
  } = useInfluencerTheme();

  // ⚡ REACT QUERY HOOKS - Automatic caching & refetching with real-time
  const { data: profile, isLoading: profileLoading } = useInfluencerProfile(user?.id || '');
  //@ts-ignore
  const influencerId = profile?.id;
  
  // My campaigns - auto-refetches + real-time subscription built-in
  const { data: applications = [], isLoading: applicationsLoading } = useMyCampaigns(influencerId || '') as { data: Application[]; isLoading: boolean };

  const loading = authLoading || profileLoading || applicationsLoading || (!!user && !profile);

  // Get campaign IDs
  //@ts-ignore
  const campaignIds = useMemo(() => applications.map((a) => a.campaign_id), [applications]);

  const getStatusInfo = (status: string) => {
    const isLight = themeKey === 'light';
    
    const statusMap: Record<
      string,
      { label: string; color: string; icon: any; bg: string }
    > = {
      applied: {
        label: "Applied",
        color: isLight ? "text-blue-600" : "text-blue-400",
        icon: Clock,
        bg: isLight ? "bg-blue-500/10" : "bg-blue-500/20",
      },
      shortlisted: {
        label: "Shortlisted",
        color: isLight ? "text-blue-600" : "text-blue-600",
        icon: CheckCircle2,
        bg: isLight ? "bg-blue-500/10" : "bg-blue-500/10",
      },
      influencer_negotiated: {
        label: "Negotiating",
        color: "text-amber-600",
        icon: AlertCircle,
        bg: "bg-amber-500/10",
      },
      admin_negotiated: {
        label: "Counter Offer",
        color: "text-orange-600",
        icon: AlertCircle,
        bg: "bg-orange-500/10",
      },
      accepted: {
        label: "Accepted",
        color: isLight ? "text-blue-600" : "text-blue-600",
        icon: CheckCircle2,
        bg: isLight ? "bg-blue-500/10" : "bg-blue-500/10",
      },
      not_shortlisted: {
        label: "Not Shortlisted",
        color: "text-rose-600",
        icon: XCircle,
        bg: "bg-rose-500/10",
      },
      rejected: {
        label: "Rejected",
        color: "text-rose-600",
        icon: XCircle,
        bg: "bg-rose-500/10",
      },
      content_posted: {
        label: "Content Submitted",
        color: isLight ? "text-blue-600" : "text-blue-600",
        icon: CheckCircle2,
        bg: isLight ? "bg-blue-500/10" : "bg-blue-500/10",
      },
      content_rejected: {
        label: "Content Rejected",
        color: "text-rose-600",
        icon: XCircle,
        bg: "bg-rose-500/10",
      },
      completed: {
        label: "Completed",
        color: isLight ? "text-blue-700" : "text-blue-700",
        icon: CheckCircle2,
        bg: isLight ? "bg-blue-500/20" : "bg-blue-500/20",
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

  // Get campaigns from the joined application data
  const campaignsWithDetails = useMemo(() => {
    return (applications as any[]).map(app => app.campaigns).filter(Boolean);
  }, [applications]);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-500"
        style={{ background: theme.background }}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-primary" />
          <p className={`text-sm font-black tracking-widest uppercase opacity-50 ${themeKey === 'dark' ? 'text-white' : 'text-gray-900'}`}>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden pb-20 md:pb-0 transition-colors duration-500"
      style={{ background: theme.background }}
    >
      {/* Animated Theme Background */}
      <ThemedStudioBackground themeKey={themeKey} />

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* CONTENT */}
      <main className="relative z-10 px-4 md:px-8 py-6 md:py-12 max-w-7xl mx-auto">
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
              <div className={`${theme.card} ${theme.radius} p-12 text-center shadow-xl border border-white/5`}>
                <p className={`${theme.muted} font-medium`}>
                  You haven't applied to any campaigns yet.
                </p>
                <Button
                  onClick={() => navigate("/dashboard/campaigns/all")}
                  className="mt-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black px-10 h-14 shadow-xl shadow-primary/20"
                >
                  Browse Campaigns <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
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
                        className={`${theme.card} ${theme.radius} overflow-hidden transition-all duration-500 hover:shadow-2xl ${themeKey === 'light' ? 'hover:shadow-blue-500/10' : 'hover:shadow-blue-500/10'} border border-white/5 group`}
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

                           {/* Brand Info */}
                           {campaign.brand_profiles && (
                            <div className="flex items-center gap-2 mb-3">
                              <p className={`text-[11px] font-black uppercase tracking-widest ${theme.muted}`}>
                                {campaign.brand_profiles.company_name}
                              </p>
                              {campaign.brand_profiles.is_verified && (
                                <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full border ${themeKey === 'light' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                  <CheckCircle2 className={`h-2.5 w-2.5 ${themeKey === 'light' ? 'text-blue-600' : 'text-blue-500'}`} />
                                  <span className={`text-[8px] font-black tracking-tighter uppercase ${themeKey === 'light' ? 'text-blue-600' : 'text-blue-500'}`}>Verified</span>
                                </div>
                              )}
                            </div>
                          )}

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
                                  ? `₹${application.final_payout} (Agreed)`
                                  : application.requested_payout
                                    ? `₹${application.requested_payout} (Negotiating)`
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
                           <div className={`pt-4 border-t ${themeKey === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
                            <p
                              className={`text-xs font-black uppercase tracking-widest ${themeKey === 'dark' ? 'text-primary' : 'text-primary'} flex items-center gap-2 group-hover:gap-3 transition-all`}
                            >
                              View Campaign Details
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