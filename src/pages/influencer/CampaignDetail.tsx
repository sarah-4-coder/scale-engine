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

    queryClient.invalidateQueries({
      queryKey: ["campaign-application", campaignId, influencerId],
    });
  };

  const acceptCounterOffer = async () => {
    if (!campaignId || !influencerId || !application || !campaign) return;

    const { error } = await supabase
      .from("campaign_influencers")
      //@ts-ignore
      .update({
        status: "accepted",
        final_payout:
          application.requested_payout || campaign.base_payout,
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
      type: "negotiation_accepted",
      title: "Offer accepted",
      message: `Influencer accepted the offer`,
      metadata: {
        campaign_id: campaignId,
        influencer_id: influencerId,
      },
    }).catch(console.error);

    toast.success("Offer accepted! 🎉");

    queryClient.invalidateQueries({
      queryKey: ["campaign-application", campaignId, influencerId],
    });
  };

  /* -------------------------------
     CONTENT SUBMISSION
  ------------------------------- */
  const submitContent = async () => {
    if (!campaignId || !influencerId || !campaign) return;

    const validLinks = postedLinks.filter((l) => l.url.trim() !== "");
    if (validLinks.length === 0) {
      toast.error("Please add at least one content link");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("campaign_influencers")
      //@ts-ignore
      .update({
        posted_link: validLinks.map((l) => l.url),
        posted_at: new Date().toISOString(),
        status: "content_posted",
      })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit content");
      return;
    }

    // Send notification to admin
    sendNotification({
      //@ts-ignore
      user_id: campaign.admin_user_id,
      role: "admin",
      type: "content_posted",
      title: "Content submitted",
      message: `Influencer has submitted content`,
      metadata: {
        campaign_id: campaignId,
        influencer_id: influencerId,
      },
    }).catch(console.error);

    toast.success("Content submitted successfully! 🎉");

    queryClient.invalidateQueries({
      queryKey: ["campaign-application", campaignId, influencerId],
    });
  };

  /* -------------------------------
     STATUS INFO
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
        label: "Application Submitted",
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
        description:
          "Congratulations! You've been shortlisted. Negotiate your payout below.",
      },
      influencer_negotiated: {
        label: "Negotiation In Progress",
        color: "text-yellow-400",
        icon: AlertCircle,
        bg: "bg-yellow-500/20",
        description: "Waiting for admin response on your counter offer",
      },
      admin_negotiated: {
        label: "Counter Offer Received",
        color: "text-orange-400",
        icon: AlertCircle,
        bg: "bg-orange-500/20",
        description: "Admin has sent a counter offer. Review below.",
      },
      accepted: {
        label: "Campaign Accepted",
        color: "text-green-400",
        icon: CheckCircle2,
        bg: "bg-green-500/20",
        description: "Start creating content and submit links when ready",
      },
      not_shortlisted: {
        label: "Not Shortlisted",
        color: "text-red-400",
        icon: XCircle,
        bg: "bg-red-500/20",
        description:
          "Unfortunately, you weren't shortlisted for this campaign",
      },
      rejected: {
        label: "Application Rejected",
        color: "text-red-400",
        icon: XCircle,
        bg: "bg-red-500/20",
        description: "Your application was not accepted",
      },
      content_posted: {
        label: "Content Under Review",
        color: "text-purple-400",
        icon: CheckCircle2,
        bg: "bg-purple-500/20",
        description: "Your content is being reviewed by the admin",
      },
      content_rejected: {
        label: "Content Needs Revision",
        color: "text-red-400",
        icon: XCircle,
        bg: "bg-red-500/20",
        description: "Content rejected. Please revise and resubmit.",
      },
      completed: {
        label: "Campaign Completed",
        color: "text-emerald-400",
        icon: CheckCircle2,
        bg: "bg-emerald-500/20",
        description: "Campaign completed successfully!",
      },
    };

    return (
      statusMap[status] || {
        label: status,
        color: "text-gray-400",
        icon: Clock,
        bg: "bg-gray-500/20",
        description: "",
      }
    );
  };

  const statusInfo = application ? getStatusInfo(application.status) : null;
  const StatusIcon = statusInfo?.icon;

  /* -------------------------------
     LOADING STATE - PREVENT FLASH
  ------------------------------- */
  if (themeLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: theme.background }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/50" />
          <p className="text-white/70 text-sm">Loading campaign...</p>
        </div>
      </div>
    );
  }

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

        {/* LOADING STATE */}
        {loading ? (
          <DetailSkeleton theme={theme} />
        ) : (
          <>
            {/* CAMPAIGN DETAILS */}
            <Card className={`${theme.card} ${theme.radius} mb-6`}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className={`text-2xl ${theme.text} mb-2`}>
                      {campaign?.name}
                    </CardTitle>
                    {campaign?.description && (
                      <CardDescription className={theme.muted}>
                        {campaign.description}
                      </CardDescription>
                    )}
                  </div>

                  {/* Status Badge */}
                  {statusInfo && (
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.bg}`}
                    >
                      {StatusIcon && (
                        <StatusIcon
                          className={`h-4 w-4 ${statusInfo.color}`}
                        />
                      )}
                      <span
                        className={`text-sm font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Campaign Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className={`h-5 w-5 ${theme.accent}`} />
                      <div>
                        <p className={`text-sm ${theme.muted}`}>Timeline</p>
                        <p className={`font-medium ${theme.text}`}>
                          {campaign?.timeline}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className={`h-5 w-5 ${theme.accent}`} />
                      <div>
                        <p className={`text-sm ${theme.muted}`}>
                          {application?.final_payout
                            ? "Final Payout"
                            : "Base Payout"}
                        </p>
                        <p className={`font-medium ${theme.text}`}>
                          ₹
                          {application?.final_payout ||
                            campaign?.base_payout}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-start gap-2">
                      <Target className={`h-5 w-5 ${theme.accent} mt-1`} />
                      <div>
                        <p className={`text-sm ${theme.muted}`}>Deliverables</p>
                        <p className={`${theme.text}`}>
                          {campaign?.deliverables}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Niches */}
                {campaign && campaign.niches && campaign.niches.length > 0 && (
                  <div>
                    <p className={`text-sm ${theme.muted} mb-2`}>Niches</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.niches.map((niche) => (
                        <span
                          key={niche}
                          className={`px-3 py-1 rounded-lg bg-white/10 text-sm ${theme.text}`}
                        >
                          {niche}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ACTIONS CARD */}
            <Card className={`${theme.card} ${theme.radius}`}>
              <CardHeader>
                <CardTitle>Campaign Actions</CardTitle>
                {statusInfo && (
                  <CardDescription>{statusInfo.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent>
                {/* SHORTLISTED - NEGOTIATE */}
                {application?.status === "shortlisted" && (
                  <div className="space-y-3">
                    <p className={theme.muted}>
                      You've been shortlisted! Negotiate your payout below:
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowNegotiationModal(true)}
                        className="flex-1"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Request Different Payout
                      </Button>
                      <Button
                        onClick={acceptCounterOffer}
                        variant="outline"
                        className="flex-1"
                      >
                        Accept Base (₹{campaign?.base_payout})
                      </Button>
                    </div>
                  </div>
                )}

                {/* ADMIN COUNTER OFFER */}
                {application?.status === "admin_negotiated" && (
                  <div className="space-y-3">
                    <div
                      className={`p-4 rounded-lg bg-white/5 border border-white/10`}
                    >
                      <p className={`text-sm ${theme.text} font-medium mb-2`}>
                        Counter Offer: ₹{application.requested_payout}
                      </p>
                      {application.negotiation_note && (
                        <p className={`text-xs ${theme.muted}`}>
                          Note: {application.negotiation_note}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={acceptCounterOffer} className="flex-1">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Accept Counter Offer
                      </Button>
                      <Button 
                      onClick={() => setShowNegotiationModal(true)}
                      variant="outline"
                      className="flex-1"
                      >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Counter Again
                      </Button>
                    </div>
                  </div>
                )}
                {/* CONTRACT GENERATOR - NEW ✅ */}
                {/* {application?.status === "accepted" &&
                  application.final_payout && campaign && (
                    <div className="mb-4">
                      <ContractGenerator
                        campaignId={campaignId!}
                        influencerId={influencerId}
                        campaignName={campaign.name}
                        finalPayout={application.final_payout}
                        deliverables={campaign.deliverables}
                        timeline={campaign.timeline}
                        contract && contract.status === "signed" && campaign &&
                      />
                    </div>
                  )}  */}
                {/* // ACCEPTED - SUBMIT CONTENT */}
                {application?.status === "accepted" &&  (
                  <div className="space-y-4">
                    <p className={theme.muted}>
                      Campaign accepted! Create your content and submit the
                      links below:
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
                {application?.status === "content_posted" && (
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
                {application?.status === "completed" && (
                  <div className="text-center py-8">
                    <CheckCircle2
                      className={`h-16 w-16 ${theme.accent} mx-auto mb-4`}
                    />
                    <p className={`text-lg font-medium ${theme.text} mb-2`}>
                      Campaign Completed! 🎉
                    </p>
                    <p className={theme.muted}>
                      Final payout: ₹{application.final_payout}
                    </p>
                  </div>
                )}

                {/* OTHER STATUSES */}
                {application && [
                  "applied",
                  "influencer_negotiated",
                  "not_shortlisted",
                  "rejected",
                  "content_rejected",
                ].includes(application.status) && statusInfo && (
                  <p className={theme.muted}>{statusInfo.description}</p>
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
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <Card className={`${theme.card} ${theme.radius} w-full max-w-md`}>
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