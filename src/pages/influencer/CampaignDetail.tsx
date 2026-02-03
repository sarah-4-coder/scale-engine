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
import { useCampaign, useCampaignApplication, useInfluencerProfile } from "@/hooks/useCampaigns";

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
  const { data: profile } = useInfluencerProfile(user?.id || '');
  //@ts-ignore
  const influencerId = profile?.id;
  
  // Campaign data (cached for 5 min)
  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId || '') as { data: Campaign | undefined; isLoading: boolean };
  
  // Application data (auto-refetches every 10 sec for status updates)
  const { data: application, isLoading: appLoading } = useCampaignApplication(
    campaignId || '',
    influencerId || ''
  ) as { data: Application | undefined; isLoading: boolean };

  const loading = campaignLoading || appLoading;

  /* -------------------------------
     LOCAL STATE
  ------------------------------- */
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
     INITIALIZE CONTENT FIELDS
  ------------------------------- */
  useEffect(() => {
    if (campaign) {
      //@ts-ignore
      const count = getRequiredLinksCount(campaign.deliverables);
      setPostedLinks(
        Array.from({ length: count }, () => ({ label: "", url: "" }))
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
            queryKey: ['campaign-application', campaignId, influencerId] 
          });
        }
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
      queryKey: ['campaign-application', campaignId, influencerId] 
    });
  };

  const acceptCounterOffer = async () => {
    if (!campaignId || !influencerId || !campaign) return;

    const { error } = await supabase
      .from("campaign_influencers")
      //@ts-ignore
      .update({ status: "accepted" })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    if (error) {
      toast.error("Failed to accept offer");
      return;
    }

    // Send notification
    sendNotification({
      //@ts-ignore
      user_id: campaign.admin_user_id,
      role: "admin",
      type: "offer_accepted",
      title: "Offer accepted",
      message: "Influencer accepted your counter offer",
      metadata: {
        campaign_id: campaignId,
        influencer_id: influencerId,
      },
    }).catch(console.error);

    toast.success("Counter offer accepted! Campaign started.");

    // Invalidate cache
    queryClient.invalidateQueries({ 
      queryKey: ['campaign-application', campaignId, influencerId] 
    });
  };

  /* -------------------------------
     CONTENT SUBMISSION
  ------------------------------- */
  const submitContent = async () => {
    if (!campaignId || !influencerId || !campaign) return;

    // Validate all links are filled
    const allFilled = postedLinks.every((link) => link.url.trim() !== "");
    if (!allFilled) {
      toast.error("Please fill in all content links");
      return;
    }

    setSubmitting(true);

    // Convert to array of URLs
    const urls = postedLinks.map((link) => link.url.trim());

    const { error } = await supabase
      .from("campaign_influencers")
      //@ts-ignore
      .update({
        posted_link: urls,
        status: "content_posted",
      })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    if (error) {
      toast.error("Failed to submit content");
      setSubmitting(false);
      return;
    }

    // Send notification
    sendNotification({
      //@ts-ignore
      user_id: campaign.admin_user_id,
      role: "admin",
      type: "content_submitted",
      title: "Content submitted",
      message: `Content submitted for review`,
      metadata: {
        campaign_id: campaignId,
        influencer_id: influencerId,
      },
    }).catch(console.error);

    toast.success("Content submitted for review!");
    setSubmitting(false);

    // Invalidate cache
    queryClient.invalidateQueries({ 
      queryKey: ['campaign-application', campaignId, influencerId] 
    });
  };

  /* -------------------------------
     STATUS INFO
  ------------------------------- */
  const getStatusInfo = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: string; icon: any; description: string }
    > = {
      applied: {
        label: "Application Submitted",
        color: "text-blue-400",
        icon: Clock,
        description: "Waiting for admin review",
      },
      shortlisted: {
        label: "Shortlisted",
        color: "text-green-400",
        icon: CheckCircle2,
        description: "You've been shortlisted! You can start negotiation.",
      },
      influencer_negotiated: {
        label: "Negotiation Pending",
        color: "text-yellow-400",
        icon: AlertCircle,
        description: "Waiting for admin response on your offer",
      },
      admin_negotiated: {
        label: "Counter Offer Received",
        color: "text-orange-400",
        icon: AlertCircle,
        description: "Admin sent a counter offer. Review and accept/reject.",
      },
      accepted: {
        label: "Campaign Active",
        color: "text-green-400",
        icon: CheckCircle2,
        description: "Campaign accepted! Create and submit your content.",
      },
      not_shortlisted: {
        label: "Not Shortlisted",
        color: "text-red-400",
        icon: XCircle,
        description: "Unfortunately, you weren't selected this time.",
      },
      rejected: {
        label: "Application Rejected",
        color: "text-red-400",
        icon: XCircle,
        description: "Your application was rejected.",
      },
      content_posted: {
        label: "Content Under Review",
        color: "text-purple-400",
        icon: Clock,
        description: "Your content is being reviewed by the admin.",
      },
      content_rejected: {
        label: "Content Rejected",
        color: "text-red-400",
        icon: XCircle,
        description: "Content needs revision. Please resubmit.",
      },
      completed: {
        label: "Campaign Completed",
        color: "text-emerald-400",
        icon: CheckCircle2,
        description: "Campaign successfully completed! 🎉",
      },
    };

    return (
      statusMap[status] || {
        label: status,
        color: "text-gray-400",
        icon: Clock,
        description: "",
      }
    );
  };

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

  if (!campaign || !application) {
    return null; // Will redirect in useEffect
  }
  //@ts-ignore
  const statusInfo = getStatusInfo(application.status);
  const StatusIcon = statusInfo.icon;

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
      {/* <ThemedStudioBackground themeKey={themeKey} /> */}

      {/* Ambient Background */}
      {/* <div className="hidden md:block">
        <AmbientLayer themeKey={themeKey} />
      </div> */}

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* CONTENT */}
      <main className="relative z-10 px-4 md:px-6 py-6 md:py-10 max-w-4xl mx-auto">
        {/* BACK BUTTON */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/campaigns/my")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Campaigns
        </Button>

        {loading ? (
          <DetailSkeleton theme={theme} />
        ) : (
          <>
            {/* CAMPAIGN HEADER */}
            <Card className={`${theme.card} ${theme.radius} mb-6`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-grow">
                    <CardTitle className={`text-2xl md:text-3xl ${theme.text} mb-2`}>
                      {campaign.name}
                    </CardTitle>
                    {campaign.description && (
                      <CardDescription className={`${theme.muted} text-base`}>
                        {campaign.description}
                      </CardDescription>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      statusInfo.color.includes("blue")
                        ? "bg-blue-500/20"
                        : statusInfo.color.includes("green")
                          ? "bg-green-500/20"
                          : statusInfo.color.includes("yellow")
                            ? "bg-yellow-500/20"
                            : statusInfo.color.includes("orange")
                              ? "bg-orange-500/20"
                              : statusInfo.color.includes("red")
                                ? "bg-red-500/20"
                                : statusInfo.color.includes("purple")
                                  ? "bg-purple-500/20"
                                  : statusInfo.color.includes("emerald")
                                    ? "bg-emerald-500/20"
                                    : "bg-gray-500/20"
                    } shrink-0`}
                  >
                    <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                    <span className={`text-sm font-medium ${statusInfo.color} whitespace-nowrap`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className={`${theme.muted} text-sm mb-4`}>
                  {statusInfo.description}
                </p>

                {/* Campaign Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/10`}>
                      <Calendar className={`h-5 w-5 ${theme.accent}`} />
                    </div>
                    <div>
                      <p className={`text-xs ${theme.muted}`}>Timeline</p>
                      <p className={`text-sm font-medium ${theme.text}`}>
                        {campaign.timeline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/10`}>
                      <DollarSign className={`h-5 w-5 ${theme.accent}`} />
                    </div>
                    <div>
                      <p className={`text-xs ${theme.muted}`}>Payout</p>
                      <p className={`text-sm font-medium ${theme.text}`}>
                        {application.final_payout
                          ? `₹${application.final_payout} (Final)`
                          : `₹${campaign.base_payout} (Base)`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/10`}>
                      <Target className={`h-5 w-5 ${theme.accent}`} />
                    </div>
                    <div>
                      <p className={`text-xs ${theme.muted}`}>Deliverables</p>
                      <p className={`text-sm font-medium ${theme.text}`}>
                        {campaign.deliverables}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/10`}>
                      <MessageSquare className={`h-5 w-5 ${theme.accent}`} />
                    </div>
                    <div>
                      <p className={`text-xs ${theme.muted}`}>Niches</p>
                      <p className={`text-sm font-medium ${theme.text}`}>
                        {campaign.niches.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ACTION SECTION */}
            <Card className={`${theme.card} ${theme.radius}`}>
              <CardHeader>
                <CardTitle className="text-xl">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* SHORTLISTED - CAN NEGOTIATE */}
                {application.status === "shortlisted" && (
                  <div className="space-y-3">
                    <p className={theme.muted}>
                      You've been shortlisted! Negotiate payout or accept the
                      base offer.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowNegotiationModal(true)}
                        className="flex-1"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Negotiate Payout
                      </Button>
                      <Button
                        onClick={acceptCounterOffer}
                        variant="outline"
                        className="flex-1"
                      >
                        Accept Base (₹{campaign.base_payout})
                      </Button>
                    </div>
                  </div>
                )}

                {/* ADMIN COUNTER OFFER */}
                {application.status === "admin_negotiated" && (
                  <div className="space-y-3">
                    <div className={`p-4 rounded-lg bg-white/5 border border-white/10`}>
                      <p className={`text-sm ${theme.text} font-medium mb-2`}>
                        Counter Offer: ₹{application.final_payout}
                      </p>
                      {application.negotiation_note && (
                        <p className={`text-xs ${theme.muted}`}>
                          Note: {application.negotiation_note}
                        </p>
                      )}
                    </div>
                    <Button onClick={acceptCounterOffer} className="w-full">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Accept Counter Offer
                    </Button>
                  </div>
                )}

                {/* ACCEPTED - SUBMIT CONTENT */}
                {application.status === "accepted" && (
                  <div className="space-y-4">
                    <p className={theme.muted}>
                      Campaign accepted! Create your content and submit the links
                      below:
                    </p>

                    {postedLinks.map((link, index) => (
                      <div key={index} className="space-y-2">
                        <label className={`text-sm ${theme.text}`}>
                          Content Link {index + 1}
                        </label>
                        <Input
                          placeholder="https://..."
                          value={link.url}
                          onChange={(e) => {
                            const updated = [...postedLinks];
                            updated[index].url = e.target.value;
                            setPostedLinks(updated);
                          }}
                        />
                      </div>
                    ))}

                    <Button
                      onClick={submitContent}
                      disabled={submitting}
                      className="w-full"
                    >
                      {submitting ? (
                        "Submitting..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Content
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* CONTENT POSTED */}
                {application.status === "content_posted" && (
                  <div className="space-y-3">
                    <p className={theme.muted}>
                      Your content has been submitted and is under review.
                    </p>
                    {application.posted_link && (
                      <div className="space-y-2">
                        <p className={`text-sm ${theme.text} font-medium`}>
                          Submitted Links:
                        </p>
                        {application.posted_link.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 text-sm ${theme.accent} hover:underline`}
                          >
                            <LinkIcon className="h-3 w-3" />
                            {url}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* COMPLETED */}
                {application.status === "completed" && (
                  <div className="text-center py-8">
                    <CheckCircle2 className={`h-16 w-16 ${theme.accent} mx-auto mb-4`} />
                    <p className={`text-lg font-medium ${theme.text} mb-2`}>
                      Campaign Completed! 🎉
                    </p>
                    <p className={theme.muted}>
                      Final payout: ₹{application.final_payout}
                    </p>
                  </div>
                )}

                {/* OTHER STATUSES */}
                {["applied", "influencer_negotiated", "not_shortlisted", "rejected", "content_rejected"].includes(
                  application.status
                ) && (
                  <p className={theme.muted}>
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
            >
              <Card className={`${theme.card} ${theme.radius}`}>
                <CardHeader>
                  <CardTitle>Negotiate Payout</CardTitle>
                  <CardDescription>
                    Request a different payout amount
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className={`text-sm ${theme.text} mb-2 block`}>
                      Requested Amount (₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={requestedPayout}
                      onChange={(e) => setRequestedPayout(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={`text-sm ${theme.text} mb-2 block`}>
                      Note (Optional)
                    </label>
                    <Textarea
                      placeholder="Explain your request..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowNegotiationModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button onClick={submitNegotiation} className="flex-1">
                      Submit Request
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