/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, memo } from "react";
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
  RefreshCw,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";
import {
  useCampaign,
  useCampaignApplication,
  useInfluencerProfile,
} from "@/hooks/useCampaigns";
import { ContractGenerator } from "@/components/influencer/ContractGenerator";
import { useContract } from "@/hooks/useContracts";

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

const getRequiredLinksCount = (deliverables: string): number => {
  const matches = deliverables.match(/\d+/g);
  if (!matches) return 1;
  return matches.map(Number).reduce((a, b) => a + b, 0);
};

const CampaignDetail = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    theme,
    themeKey,
    setTheme,
    loading: themeLoading,
  } = useInfluencerTheme();

  /* -------------------------------
     REACT QUERY HOOKS - Automatic caching & real-time updates
  ------------------------------- */
  const { data: profile } = useInfluencerProfile(user?.id || "");
  //@ts-ignore
  const influencerId = profile?.id;

  // Campaign data (cached for 5 min)
  const { data: campaign, isLoading: campaignLoading } = useCampaign(
    campaignId || "",
  ) as { data: Campaign | undefined; isLoading: boolean };

  // Application data (auto-refetches every 10 sec for status updates)
  const { data: application, isLoading: appLoading } = useCampaignApplication(
    campaignId || "",
    influencerId || "",
  ) as { data: Application | undefined; isLoading: boolean };

  interface Contract {
    id: string;
    status: string;
    // Add other fields as needed
  }

  const { data: contract } = useContract(
    campaignId || "",
    influencerId || "",
  ) as { data: Contract | undefined };

  const loading = campaignLoading || appLoading;

  /* -------------------------------
     LOCAL STATE
  ------------------------------- */
  // Negotiation state
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [requestedPayout, setRequestedPayout] = useState("");
  const [note, setNote] = useState("");

  // Content submission state
  const [postedLinks, setPostedLinks] = useState<
    { label: string; url: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  /* -------------------------------
     INITIALIZE CONTENT FIELDS
  ------------------------------- */
  useEffect(() => {
    if (campaign) {
      //@ts-ignore
      const count = getRequiredLinksCount(campaign.deliverables);
      setPostedLinks(
        Array.from({ length: count }, () => ({ label: "", url: "" })),
      );
    }
  }, [campaign]);

  /* -------------------------------
     REAL-TIME SUBSCRIPTION
  ------------------------------- */
  useEffect(() => {
    if (!influencerId || !campaignId) return;

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
          // Invalidate query cache to trigger refetch
          queryClient.invalidateQueries({
            queryKey: ["campaign-application", campaignId, influencerId],
          });
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [influencerId, campaignId, queryClient]);

  /* -------------------------------
     REDIRECT IF NO DATA
  ------------------------------- */
  useEffect(() => {
    if (!loading && !campaign) {
      toast.error("Campaign not found");
      navigate("/dashboard/campaigns/my");
    }
    if (!loading && campaign && !application) {
      toast.error("Application not found");
      navigate("/dashboard/campaigns/my");
    }
  }, [loading, campaign, application, navigate]);

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
      //@ts-ignore
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

    // Invalidate cache to trigger refetch
    queryClient.invalidateQueries({
      queryKey: ["campaign-application", campaignId, influencerId],
    });
  };

  const acceptCounterOffer = async () => {
    if (!campaignId || !influencerId || !campaign) return;

    const { error } = await supabase
      .from("campaign_influencers")
      //@ts-ignore
      .update({
      status: "accepted",
      final_payout: application.requested_payout || campaign.base_payout,
      })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    if (error) {
      toast.error("Failed to accept offer");
      return;
    }

    // Send notification to admin
    sendNotification({
      //@ts-ignore
      user_id: campaign.admin_user_id,
      role: "admin",
      type: "campaign_accepted",
      title: "Campaign accepted",
      message: `Influencer accepted the offer`,
      metadata: {
        campaign_id: campaignId,
        influencer_id: influencerId,
      },
    }).catch(console.error);

    toast.success("Offer accepted!");
    queryClient.invalidateQueries({
      queryKey: ["campaign-application", campaignId, influencerId],
    });
  };

  const acceptBaseOffer = async () => {
    if (!campaignId || !influencerId || !campaign) return;

    const { error } = await supabase
      .from("campaign_influencers")
      //@ts-ignore
      .update({
      status: "accepted",
      final_payout: campaign.base_payout,
      })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    if (error) {
      toast.error("Failed to accept offer");
      return;
    }

    // Send notification to admin
    sendNotification({
      //@ts-ignore
      user_id: campaign.admin_user_id,
      role: "admin",
      type: "campaign_accepted",
      title: "Campaign accepted",
      message: `Influencer accepted the offer`,
      metadata: {
        campaign_id: campaignId,
        influencer_id: influencerId,
      },
    }).catch(console.error);

    toast.success("Offer accepted!");
    queryClient.invalidateQueries({
      queryKey: ["campaign-application", campaignId, influencerId],
    });
  };

  const leaveCampaign = async () => {
    if (!campaignId || !influencerId) return;

    setLeaving(true);

    try {
      const { error } = await supabase
        .from("campaign_influencers")
        .delete()
        .eq("campaign_id", campaignId)
        .eq("influencer_id", influencerId);

      if (error) throw error;

      // Send notification to admin
      if (campaign) {
        sendNotification({
          //@ts-ignore
          user_id: campaign.admin_user_id,
          role: "admin",
          type: "campaign_left",
          title: "Influencer left campaign",
          message: `Influencer decided to leave the campaign`,
          metadata: {
            campaign_id: campaignId,
            influencer_id: influencerId,
          },
        }).catch(console.error);
      }

      toast.success("You have left the campaign");
      navigate("/dashboard/campaigns/my");
    } catch (error) {
      console.error("Error leaving campaign:", error);
      toast.error("Failed to leave campaign");
    } finally {
      setLeaving(false);
      setShowLeaveModal(false);
    }
  };

  /* -------------------------------
     CONTENT SUBMISSION
  ------------------------------- */
  const submitContent = async () => {
    if (!campaignId || !influencerId) return;

    // Validate that all fields are filled
    const hasEmptyFields = postedLinks.some(
      (link) => !link.label.trim() || !link.url.trim()
    );

    if (hasEmptyFields) {
      toast.error("Please fill in all content labels and links");
      return;
    }

    setSubmitting(true);

    try {
      // Format links as "Label: URL"
      const formattedLinks = postedLinks.map(
        (link) => `${link.label}: ${link.url}`
      );

      const { error } = await supabase
        .from("campaign_influencers")
        //@ts-ignore
        .update({
          posted_link: formattedLinks,
          status: "content_posted",
        })
        .eq("campaign_id", campaignId)
        .eq("influencer_id", influencerId);

      if (error) throw error;

      // Send notification to admin
      if (campaign) {
        sendNotification({
          //@ts-ignore
          user_id: campaign.admin_user_id,
          role: "admin",
          type: "content_posted",
          title: "Content submitted",
          message: `Influencer submitted content for review`,
          metadata: {
            campaign_id: campaignId,
            influencer_id: influencerId,
          },
        }).catch(console.error);
      }

      toast.success("Content submitted successfully!");

      // Invalidate cache
      queryClient.invalidateQueries({
        queryKey: ["campaign-application", campaignId, influencerId],
      });
    } catch (error) {
      console.error("Error submitting content:", error);
      toast.error("Failed to submit content");
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------
     STATUS HELPERS
  ------------------------------- */
  const getStatusInfo = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        color: string;
        icon: any;
        bg: string;
        description: string;
      }
    > = {
      applied: {
        label: "Applied",
        color: "text-blue-400",
        icon: Clock,
        bg: "bg-blue-500/20",
        description: "Your application is under review",
      },
      shortlisted: {
        label: "Shortlisted",
        color: "text-green-400",
        icon: CheckCircle2,
        bg: "bg-green-500/20",
        description: "Congratulations! You've been shortlisted",
      },
      influencer_negotiated: {
        label: "Negotiating",
        color: "text-yellow-400",
        icon: MessageSquare,
        bg: "bg-yellow-500/20",
        description: "Waiting for brand response on your counter offer",
      },
      admin_negotiated: {
        label: "Counter Offer",
        color: "text-orange-400",
        icon: AlertCircle,
        bg: "bg-orange-500/20",
        description: "Brand has made a counter offer",
      },
      rejected: {
        label: "Offer Rejected",
        color: "text-red-400",
        icon: XCircle,
        bg: "bg-red-500/20",
        description: "Your negotiation was rejected",
      },
      accepted: {
        label: "Accepted",
        color: "text-green-400",
        icon: CheckCircle2,
        bg: "bg-green-500/20",
        description: "Campaign accepted! Time to create content",
      },
      content_posted: {
        label: "Content Submitted",
        color: "text-purple-400",
        icon: CheckCircle2,
        bg: "bg-purple-500/20",
        description: "Your content is under review",
      },
      content_rejected: {
        label: "Content Rejected",
        color: "text-red-400",
        icon: XCircle,
        bg: "bg-red-500/20",
        description: "Your content needs revision",
      },
      completed: {
        label: "Completed",
        color: "text-emerald-400",
        icon: CheckCircle2,
        bg: "bg-emerald-500/20",
        description: "Campaign completed successfully!",
      },
      not_shortlisted: {
        label: "Not Shortlisted",
        color: "text-red-400",
        icon: XCircle,
        bg: "bg-red-500/20",
        description: "Unfortunately, you were not selected this time",
      },
    };

    return (
      statusMap[status] || {
        label: status,
        color: "text-gray-400",
        icon: Clock,
        bg: "bg-gray-500/20",
        description: "Status pending",
      }
    );
  };

  /* -------------------------------
     RENDER
  ------------------------------- */
  if (loading || !campaign || !application) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ background: theme.background }}
        />
        <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />
        <main className="relative z-10 px-3 md:px-6 py-4 md:py-10 max-w-4xl mx-auto">
          <DetailSkeleton theme={theme} />
        </main>
      </div>
    );
  }

  const statusInfo = getStatusInfo(application.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ background: theme.background }}
      />

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      <main className="relative z-10 px-3 md:px-6 py-4 md:py-10 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/campaigns/my")}
          className="mb-4 md:mb-6 text-sm"
          size="sm"
        >
          <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
          Back
        </Button>

        {/* Campaign Header Card */}
        <Card className={`${theme.card} ${theme.radius} mb-4 md:mb-6`}>
          <CardHeader className="p-3 md:p-6">
            <div className="flex flex-col gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className={`text-lg md:text-lg md:text-2xl ${theme.text} mb-1 md:mb-2`}>
                  {campaign.name}
                </CardTitle>
                {campaign.description && (
                    <div>
                    <CardDescription className={`text-xs md:text-base ${!showFullDescription ? 'line-clamp-2' : ''}`}>
                      {campaign.description}
                    </CardDescription>
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className={`text-xs md:text-sm font-semibold mt-1 ${theme.accent} hover:underline`}
                    >
                      {showFullDescription ? 'Show Less' : 'View More'}
                    </button>
                    </div>
                )}
              </div>

              <div
                className={`px-3 py-2 md:px-3 md:py-1.5 md:px-4 md:py-2 rounded-full ${statusInfo.bg} flex items-center gap-2 self-start`}
              >
                <StatusIcon className={`h-3 w-3 md:h-4 md:w-4 ${statusInfo.color}`} />
                <span className={`text-xs md:text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 md:p-6 pt-0">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="flex items-center gap-3 md:gap-2">
                <DollarSign className={`h-4 w-4 md:h-5 md:w-5 ${theme.accent} flex-shrink-0`} />
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs opacity-60">Payout</p>
                  <p className={`font-bold ${theme.text} text-xs md:text-base truncate`}>
                    ₹{application.final_payout || campaign.base_payout}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-2">
                <Calendar className={`h-4 w-4 md:h-5 md:w-5 ${theme.accent} flex-shrink-0`} />
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs opacity-60">Timeline</p>
                  <p className={`${theme.text} text-xs md:text-base `}>
                    {campaign.timeline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-2 col-span-2">
                <Target className={`h-4 w-4 md:h-5 md:w-5 ${theme.accent} flex-shrink-0`} />
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs opacity-60">Deliverables</p>
                  <p className={`${theme.text} text-xs md:text-base`}>
                    {campaign.deliverables}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-2 col-span-2">
                <Target className={`h-4 w-4 md:h-5 md:w-5 ${theme.accent} flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] md:text-xs opacity-60 mb-1">Niches</p>
                  <div className="flex flex-wrap gap-1">
                    {campaign.niches.map((niche) => (
                      <span
                        key={niche}
                        className="px-2 py-0.5 rounded bg-white/10 text-[10px] md:text-xs"
                      >
                        {niche}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CONTRACT SECTION */}
        {/* {application.status === "accepted" &&
          application.final_payout &&
          contract?.status !== "signed" && (
            <div className="mb-4 md:mb-6">
              <ContractGenerator
                campaignId={campaignId!}
                influencerId={influencerId}
                campaignName={campaign.name}
                finalPayout={application.final_payout}
                deliverables={campaign.deliverables}
                timeline={campaign.timeline}
              />
            </div>
          )} */}

        {/* Action Section */}
        {campaign && application && (
          <>
            <Card className={`${theme.card} ${theme.radius}`}>
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="text-base md:text-xl">Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0 space-y-3 md:space-y-4">
                {/* SHORTLISTED - CAN NEGOTIATE */}
                {application.status === "shortlisted" && (
                  <div className="space-y-3 md:space-y-4">
                    <div
                      className={`p-3 md:p-4 rounded-lg bg-green-500/10 border border-green-500/30`}
                    >
                      <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                        <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-green-400 font-semibold text-sm md:text-base mb-1 md:mb-2">
                            🎉 Congratulations! You've Been Shortlisted
                          </h3>
                          <p className={`text-xs md:text-sm ${theme.text}`}>
                            The brand has reviewed your profile and selected you!
                          </p>
                        </div>
                      </div>

                      <div
                        className={`p-2 md:p-3 rounded-lg bg-white/5 border border-white/10 space-y-1 md:space-y-2 mb-2 md:mb-3`}
                      >
                        <p className={`text-xs md:text-sm ${theme.text} font-medium`}>
                          Base Payout: ₹{campaign.base_payout}
                        </p>
                        <p className={`text-[10px] md:text-xs ${theme.muted}`}>
                          Standard rate. Accept directly if comfortable.
                        </p>
                      </div>

                      <div
                        className={`p-2 md:p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30`}
                      >
                        <p className={`text-[10px] md:text-xs ${theme.text} font-medium mb-1 md:mb-2`}>
                          💡 About Negotiation:
                        </p>
                        <ul
                          className={`text-[10px] md:text-xs ${theme.muted} space-y-0.5 md:space-y-1 ml-3 md:ml-4 list-disc`}
                        >
                          <li>Only if engagement genuinely justifies higher pay</li>
                          <li>Consider past performance & demographics</li>
                          <li>Provide specific reasons</li>
                          <li>
                            ⚠️{" "}
                            <strong className="text-yellow-400">Important:</strong>{" "}
                            Spam = restrictions
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                      <Button
                        onClick={acceptCounterOffer}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-xs md:text-sm h-9 md:h-10 py-2 md:py-0"
                        size="sm"
                      >
                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Accept Base Payout
                      </Button>
                      <Button
                        onClick={() => setShowNegotiationModal(true)}
                        variant="outline"
                        className="flex-1 text-xs md:text-sm h-9 md:h-10 py-2  md:py-0"
                        size="sm"
                      >
                        <MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 " />
                        Negotiate Payout
                      </Button>
                    </div>
                  </div>
                )}

                {/* ADMIN COUNTER OFFER */}
                {application.status === "admin_negotiated" && (
                  <div className="space-y-3 md:space-y-4">
                    <div
                      className={`p-3 md:p-4 rounded-lg bg-orange-500/10 border border-orange-500/30`}
                    >
                      <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                        <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-orange-400 font-semibold text-sm md:text-base mb-1 md:mb-2">
                            Brand Counter Offer
                          </h3>
                          <p className={`text-xs md:text-sm ${theme.text} mb-2 md:mb-3`}>
                            The brand reviewed your request and made a counter offer.
                          </p>
                        </div>
                      </div>

                      <div
                        className={`p-2 md:p-3 rounded-lg bg-white/5 border border-white/10 space-y-1 md:space-y-2`}
                      >
                        <p className={`text-xs md:text-sm ${theme.text} font-medium`}>
                          Counter Offer: ₹{application.requested_payout}
                        </p>
                        {application.negotiation_note && (
                          <p className={`text-[10px] md:text-xs ${theme.muted}`}>
                            Note: {application.negotiation_note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                      <Button
                        onClick={acceptCounterOffer}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-xs md:text-sm h-9 md:h-10"
                      >
                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Accept Counter Offer
                      </Button>
                      <Button
                        onClick={() => setShowNegotiationModal(true)}
                        variant="outline"
                        className="flex-1 text-xs md:text-sm h-9 md:h-10"
                      >
                        <MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Counter Again
                      </Button>
                    </div>
                  </div>
                )}

                {/* REJECTED - ACCEPT BASE OR LEAVE */}
                {application.status === "rejected" && (
                  <div className="space-y-3 md:space-y-4">
                    <div
                      className={`p-3 md:p-4 rounded-lg bg-red-500/10 border border-red-500/30`}
                    >
                      <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                        <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-red-400 font-semibold text-sm md:text-base mb-1 md:mb-2">
                            Negotiation Rejected
                          </h3>
                          <p className={`text-xs md:text-sm ${theme.text} mb-2`}>
                            The brand rejected your negotiation request of ₹
                            {application.requested_payout}.
                          </p>
                          <p className={`text-xs md:text-sm ${theme.text}`}>
                            You have two options:
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div
                          className={`p-2 md:p-3 rounded-lg bg-white/5 border border-white/10`}
                        >
                          <p className={`text-xs md:text-sm ${theme.text} font-medium mb-1`}>
                            Option 1: Accept Base Payout
                          </p>
                          <p className={`text-[10px] md:text-xs ${theme.muted}`}>
                            Proceed with ₹{campaign.base_payout} and start creating
                            content
                          </p>
                        </div>

                        <div
                          className={`p-2 md:p-3 rounded-lg bg-white/5 border border-white/10`}
                        >
                          <p className={`text-xs md:text-sm ${theme.text} font-medium mb-1`}>
                            Option 2: Leave Campaign
                          </p>
                          <p className={`text-[10px] md:text-xs ${theme.muted}`}>
                            Withdraw from this campaign opportunity
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                      <Button
                        onClick={acceptBaseOffer}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-xs md:text-sm h-9 md:h-10"
                        // size="sm"
                      >
                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Accept Base (₹{campaign.base_payout})
                      </Button>
                      <Button
                        onClick={() => setShowLeaveModal(true)}
                        variant="outline"
                        className="flex-1 text-red-400 border-red-400/30 hover:bg-red-500/10 text-xs md:text-sm h-9 md:h-10"
                        // size="sm"
                      >
                        <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Leave Campaign
                      </Button>
                    </div>
                  </div>
                )}

                {/* ACCEPTED - SUBMIT CONTENT */}
                {application.status === "accepted" &&
                  (!contract || contract?.status === "signed") && (
                    <div className="space-y-3 md:space-y-4">
                      <p className={`${theme.muted} text-xs md:text-sm`}>
                        Campaign accepted! Create your content and submit the links
                        below:
                      </p>
                      <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                        <div
                          className={`p-3 md:p-4 rounded-lg ${theme.card} border border-white/10`}
                        >
                          <h3 className={`font-semibold ${theme.text} mb-2 md:mb-3 text-xs md:text-base`}>
                            Content Submission Process
                          </h3>
                          <div className="space-y-2 md:space-y-3">
                            {[
                              {
                                num: 1,
                                title: "Prepare Your Content",
                                desc: "Create according to deliverables",
                              },
                              {
                                num: 2,
                                title: "Submit for Approval",
                                desc: "Send links for admin review",
                              },
                              {
                                num: 3,
                                title: "Await Approval",
                                desc: "Admin will review content",
                              },
                              {
                                num: 4,
                                title: "Make Content Live",
                                desc: "Publish after approval",
                              },
                              {
                                num: 5,
                                title: "Submit Live Link",
                                desc: "Final verification",
                              },
                            ].map((step) => (
                              <div key={step.num} className="flex gap-3 md:gap-2 md:gap-3">
                                <div
                                  className={`flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full ${theme.accent} bg-white/10 text-[10px] md:text-sm font-semibold flex-shrink-0`}
                                >
                                  {step.num}
                                </div>
                                <div>
                                  <p
                                    className={`text-xs md:text-sm font-medium ${theme.text}`}
                                  >
                                    {step.title}
                                  </p>
                                  <p
                                    className={`text-[10px] md:text-xs ${theme.muted} mt-0.5`}
                                  >
                                    {step.desc}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Content submission with labels */}
                      {postedLinks.map((link, index) => (
                        <div key={index} className="space-y-2">
                          <label
                            className={`text-xs md:text-sm ${theme.text} font-medium`}
                          >
                            Content {index + 1}
                          </label>
                          <div className="grid grid-cols-1 gap-2 md:gap-3">
                            <div>
                              <label
                                className={`text-[10px] md:text-xs ${theme.muted} mb-1 block`}
                              >
                                Label (e.g., Reel, Story, Post)
                              </label>
                              <Input className="h-12 md:h-11 text-base h-9 md:h-10 text-xs md:text-sm"
                                placeholder="Reel"
                                value={link.label}
                                onChange={(e) => {
                                  const updated = [...postedLinks];
                                  updated[index].label = e.target.value;
                                  setPostedLinks(updated);
                                }}
                                // className=""
                              />
                            </div>
                            <div>
                              <label
                                className={`text-[10px] md:text-xs ${theme.muted} mb-1 block`}
                              >
                                Link
                              </label>
                              <Input className="h-12 md:h-11 text-base h-9 md:h-10 text-xs md:text-sm"
                                placeholder="https://instagram.com/..."
                                value={link.url}
                                onChange={(e) => {
                                  const updated = [...postedLinks];
                                  updated[index].url = e.target.value;
                                  setPostedLinks(updated);
                                }}
                                // className=""
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        onClick={submitContent}
                        disabled={submitting}
                        className="w-full text-xs md:text-sm h-9 md:h-10"
                        size="sm"
                      >
                        {submitting ? (
                          "Submitting..."
                        ) : (
                          <>
                            <Send className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            Submit Content
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                {/* CONTENT REJECTED - RESUBMIT */}
                {application?.status === "content_rejected" && (
                  <div className="space-y-3 md:space-y-4">
                    <div
                      className={`p-3 md:p-4 rounded-lg bg-red-500/10 border border-red-500/30`}
                    >
                      <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                        <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-red-400 font-semibold text-sm md:text-base mb-1 md:mb-2">
                            Content Not Approved
                          </h3>
                          <p className={`text-xs md:text-sm ${theme.text} mb-2`}>
                            The brand has rejected your submitted content. Please
                            review the feedback and resubmit.
                          </p>
                          {application.negotiation_note && (
                            <div
                              className={`p-2 md:p-3 rounded-lg bg-white/5 border border-white/10 mt-2`}
                            >
                              <p className={`text-[10px] md:text-xs ${theme.text} font-medium mb-1`}>
                                Feedback:
                              </p>
                              <p className={`text-[10px] md:text-xs ${theme.muted}`}>
                                {application.negotiation_note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Show previously submitted content */}
                    {application.posted_link && (
                      <div className="space-y-2">
                        <p className={`text-xs md:text-sm ${theme.text} font-medium`}>
                          Previously Submitted:
                        </p>
                        {application.posted_link.map((item, i) => (
                          <div
                            key={i}
                            className={`p-2 md:p-3 rounded-lg bg-white/5 border border-white/10`}
                          >
                            <p className={`text-[10px] md:text-xs ${theme.muted} mb-1`}>
                              {item.split(":")[0]}
                            </p>
                            <a
                              href={item.split(": ")[1]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 text-xs md:text-sm ${theme.accent} hover:underline break-all`}
                            >
                              <LinkIcon className="h-3 w-3 flex-shrink-0" />
                              {item.split(": ")[1]}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resubmit form */}
                    <div className="space-y-3">
                      <p className={`text-xs md:text-sm ${theme.text} font-medium`}>
                        Resubmit Corrected Content:
                      </p>

                      {postedLinks.map((link, index) => (
                        <div key={index} className="space-y-2">
                          <label
                            className={`text-xs md:text-sm ${theme.text} font-medium`}
                          >
                            Content {index + 1}
                          </label>
                          <div className="grid grid-cols-1 gap-2 md:gap-3">
                            <div>
                              <label
                                className={`text-[10px] md:text-xs ${theme.muted} mb-1 block`}
                              >
                                Label
                              </label>
                              <Input className="h-12 md:h-11 text-base h-9 md:h-10 text-xs md:text-sm"
                                placeholder="Reel"
                                value={link.label}
                                onChange={(e) => {
                                  const updated = [...postedLinks];
                                  updated[index].label = e.target.value;
                                  setPostedLinks(updated);
                                }}
                                
                              />
                            </div>
                            <div>
                              <label
                                className={`text-[10px] md:text-xs ${theme.muted} mb-1 block`}
                              >
                                Link
                              </label>
                              <Input className="h-12 md:h-11 text-base h-9 md:h-10 text-xs md:text-sm"
                                placeholder="https://instagram.com/..."
                                value={link.url}
                                onChange={(e) => {
                                  const updated = [...postedLinks];
                                  updated[index].url = e.target.value;
                                  setPostedLinks(updated);
                                }}
                                
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        onClick={submitContent}
                        disabled={submitting}
                        className="w-full text-xs md:text-sm h-9 md:h-10"
                        size="sm"
                      >
                        {submitting ? (
                          "Resubmitting..."
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            Resubmit Content
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* CONTENT POSTED */}
                {application?.status === "content_posted" && (
                  <div className="space-y-2 md:space-y-3">
                    <p className={`${theme.muted} text-xs md:text-sm`}>
                      Your content has been submitted and is under review.
                    </p>
                    {application.posted_link && (
                      <div className="space-y-2">
                        <p className={`text-xs md:text-sm ${theme.text} font-medium`}>
                          Submitted Links:
                        </p>
                        {application.posted_link.map((item, i) => (
                          <div
                            key={i}
                            className={`p-2 md:p-3 rounded-lg bg-white/5 border border-white/10`}
                          >
                            <p className={`text-[10px] md:text-xs ${theme.muted} mb-1`}>
                              {item.split(":")[0]}
                            </p>
                            <a
                              href={item.split(": ")[1]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 text-xs md:text-sm ${theme.accent} hover:underline break-all`}
                            >
                              <LinkIcon className="h-3 w-3 flex-shrink-0" />
                              {item.split(": ")[1]}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* COMPLETED */}
                {application?.status === "completed" && (
                  <div className="text-center py-6 md:py-8">
                    <CheckCircle2
                      className={`h-12 w-12 md:h-16 md:w-16 ${theme.accent} mx-auto mb-3 md:mb-4`}
                    />
                    <p className={`text-base md:text-lg font-medium ${theme.text} mb-1 md:mb-2`}>
                      Campaign Completed! 🎉
                    </p>
                    <p className={`${theme.muted} text-xs md:text-sm`}>
                      Final payout: ₹{application.final_payout}
                    </p>
                  </div>
                )}

                {/* OTHER STATUSES */}
                {application &&
                  ["applied", "influencer_negotiated", "not_shortlisted"].includes(
                    application.status
                  ) &&
                  statusInfo && (
                    <p className={`${theme.muted} text-xs md:text-sm`}>
                      {statusInfo.description}
                    </p>
                  )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* NEGOTIATION MODAL */}
      <AnimatePresence>
        {showNegotiationModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowNegotiationModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-6 md:p-4"
            >
              <Card
                className={`${theme.card} ${theme.radius} w-full max-w-md`}
              >
                <CardHeader className="p-3 md:p-6">
                  <CardTitle className="text-base md:text-xl">
                    Negotiate Payout
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Request a different payout amount
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 space-y-3 md:space-y-4">
                  <div>
                    <label className={`text-xs md:text-sm ${theme.text} mb-1 md:mb-2 block`}>
                      Requested Amount (₹)
                    </label>
                    <Input className="h-12 md:h-11 text-base"
                      type="number" 
                      placeholder="Enter amount"
                      value={requestedPayout}
                      onChange={(e) => setRequestedPayout(e.target.value)}
                      // className="h-9 md:h-10 text-xs md:text-sm"
                    />
                  </div>

                  <div>
                    <label className={`text-xs md:text-sm ${theme.text} mb-1 md:mb-2 block`}>
                      Note (Optional)
                    </label>
                    <Textarea className="min-h-[120px] md:min-h-[100px] text-base text-xs md:text-sm"
                      placeholder="Explain your request..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3 ">
                    <Button
                      onClick={submitNegotiation}
                      className="flex-1 text-xs md:text-sm h-9 md:h-10 py-2 md:py-0"
                      size="sm"
                    >
                      Submit Request
                    </Button>
                    <Button
                      onClick={() => setShowNegotiationModal(false)}
                      className="flex-1 text-xs md:text-sm h-9 md:h-10 py-2 md:py-0"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* LEAVE CAMPAIGN MODAL */}
      <AnimatePresence>
        {showLeaveModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowLeaveModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-3 md:p-4"
            >
              <Card
                className={`${theme.card} ${theme.radius} w-full max-w-md border-2 border-red-500/30`}
              >
                <CardHeader className="p-3 md:p-6">
                  <div className="flex items-center gap-3 md:gap-2 md:gap-3">
                    <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-red-400" />
                    <CardTitle className="text-base md:text-xl text-red-400">
                      Leave Campaign?
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs md:text-sm mt-2">
                    This action cannot be undone
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 space-y-3 md:space-y-4">
                  <p className={`text-xs md:text-sm ${theme.text}`}>
                    Are you sure you want to leave this campaign? You will be
                    removed from the campaign and cannot reapply.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowLeaveModal(false)}
                      className="flex-1 text-xs md:text-sm h-9 md:h-10"
                      // size="sm"
                      disabled={leaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={leaveCampaign}
                      disabled={leaving}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-xs md:text-sm h-9 md:h-10 "
                      // size="sm"
                    >
                      {leaving ? (
                        "Leaving..."
                      ) : (
                        <>
                          <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          Leave Campaign
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(CampaignDetail);