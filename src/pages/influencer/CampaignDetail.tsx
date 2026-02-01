/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const { theme, themeKey, setTheme, loading: themeLoading } = useInfluencerTheme();

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
  const [postedLinks, setPostedLinks] = useState<{ label: string; url: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  /* -------------------------------
     FETCH DATA
  ------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !campaignId) return;

      try {
        setLoading(true);

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
          .select("campaign_id, status, requested_payout, final_payout, posted_link, negotiation_note")
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
        setPostedLinks(Array.from({ length: count }, () => ({ label: "", url: "" })));

        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load campaign details");
        navigate("/dashboard/campaigns/my");
      }
    };

    fetchData();
  }, [user, campaignId, navigate]);

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

    // Refresh data
    window.location.reload();
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
    window.location.reload();
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
    window.location.reload();
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

    const formattedLinks = postedLinks.map((e) => `${e.label.trim()} | ${e.url.trim()}`);

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
    window.location.reload();
  };

  /* -------------------------------
     STATUS INFO
  ------------------------------- */
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any; bg: string }> = {
      applied: { 
        label: "Applied", 
        color: "text-blue-400", 
        icon: Clock,
        bg: "bg-blue-500/20"
      },
      shortlisted: { 
        label: "Shortlisted", 
        color: "text-green-400", 
        icon: CheckCircle2,
        bg: "bg-green-500/20"
      },
      influencer_negotiated: { 
        label: "Negotiating", 
        color: "text-yellow-400", 
        icon: AlertCircle,
        bg: "bg-yellow-500/20"
      },
      admin_negotiated: { 
        label: "Counter Offer", 
        color: "text-orange-400", 
        icon: AlertCircle,
        bg: "bg-orange-500/20"
      },
      accepted: { 
        label: "Accepted", 
        color: "text-green-400", 
        icon: CheckCircle2,
        bg: "bg-green-500/20"
      },
      not_shortlisted: { 
        label: "Not Shortlisted", 
        color: "text-red-400", 
        icon: XCircle,
        bg: "bg-red-500/20"
      },
      rejected: { 
        label: "Rejected", 
        color: "text-red-400", 
        icon: XCircle,
        bg: "bg-red-500/20"
      },
      content_posted: { 
        label: "Content Submitted", 
        color: "text-purple-400", 
        icon: CheckCircle2,
        bg: "bg-purple-500/20"
      },
      content_rejected: { 
        label: "Content Rejected", 
        color: "text-red-400", 
        icon: XCircle,
        bg: "bg-red-500/20"
      },
      completed: { 
        label: "Completed", 
        color: "text-emerald-400", 
        icon: CheckCircle2,
        bg: "bg-emerald-500/20"
      },
    };

    return statusMap[status] || { 
      label: status, 
      color: "text-gray-400", 
      icon: Clock,
      bg: "bg-gray-500/20"
    };
  };

  /* -------------------------------
     LOADING STATE
  ------------------------------- */
  if (loading || themeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!campaign || !application) {
    return null;
  }

  const statusInfo = getStatusInfo(application.status);
  const StatusIcon = statusInfo.icon;

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

      {/* Ambient Background */}
      <AmbientLayer themeKey={themeKey} />

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* CONTENT */}
      <main className="relative z-10 px-6 py-10 max-w-5xl mx-auto">
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
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusInfo.bg} flex-shrink-0`}>
              <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
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
                <p className={`${theme.text} font-medium`}>{campaign.deliverables}</p>
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
                <p className={`${theme.text} font-medium`}>{campaign.timeline}</p>
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
                    : `₹${campaign.base_payout} (Base)`
                  }
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
              <CardDescription>Manage your campaign participation</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* APPLIED */}
              {application.status === "applied" && (
                <div className={`p-4 rounded-lg bg-blue-500/10 border border-blue-500/20`}>
                  <p className={`${theme.text} mb-2`}>
                    ⏳ Application submitted. Waiting for brand approval.
                  </p>
                </div>
              )}

              {/* SHORTLISTED */}
              {application.status === "shortlisted" && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg bg-green-500/10 border border-green-500/20`}>
                    <p className={`${theme.text} font-medium mb-2`}>
                      🎉 Congratulations! You've been shortlisted!
                    </p>
                    <p className={`${theme.muted} text-sm`}>
                      You can accept the base payout or negotiate for a different amount.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={acceptBasePayout}
                      className="flex-1"
                    >
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
                <div className={`p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20`}>
                  <p className={`${theme.text} mb-2`}>
                    💬 Your negotiation request (₹{application.requested_payout}) has been sent.
                  </p>
                  <p className={`${theme.muted} text-sm`}>
                    Waiting for brand response...
                  </p>
                  {application.negotiation_note && (
                    <div className="mt-3 p-3 rounded bg-white/5">
                      <p className={`${theme.muted} text-xs mb-1`}>Your note:</p>
                      <p className={`${theme.text} text-sm`}>{application.negotiation_note}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN COUNTER OFFER */}
              {application.status === "admin_negotiated" && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg bg-orange-500/10 border border-orange-500/20`}>
                    <p className={`${theme.text} mb-2`}>
                      💰 Brand has proposed a counter offer: ₹{application.requested_payout}
                    </p>
                    <p className={`${theme.muted} text-sm`}>
                      You can accept this offer or make another counter proposal.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={acceptCounterOffer}
                      className="flex-1"
                    >
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
                  <div className={`p-4 rounded-lg bg-red-500/10 border border-red-500/20`}>
                    <p className={`${theme.text} mb-2`}>
                      Negotiation rejected by brand.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={acceptBasePayout}
                      className="flex-1"
                    >
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
                  <div className={`p-4 rounded-lg bg-red-500/10 border border-red-500/20`}>
                    <p className={`${theme.text} mb-2`}>
                      Unfortunately, you were not shortlisted for this campaign.
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
              {(application.status === "accepted" || application.status === "content_rejected") && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg bg-green-500/10 border border-green-500/20`}>
                    <p className={`${theme.text} font-medium mb-2`}>
                      ✅ Campaign Accepted! Final Payout: ₹{application.final_payout}
                    </p>
                    <p className={`${theme.muted} text-sm`}>
                      Please submit your content links below to complete the campaign.
                    </p>
                  </div>

                  {application.status === "content_rejected" && (
                    <div className={`p-3 rounded-lg bg-red-500/10 border border-red-500/20`}>
                      <p className={`text-red-400 text-sm`}>
                        ⚠️ Previous content was rejected. Please submit again.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className={`${theme.text} font-medium flex items-center gap-2`}>
                      <LinkIcon className="h-4 w-4" />
                      Submit Content Links
                    </p>

                    {postedLinks.map((item, index) => (
                      <div key={index} className="space-y-2 p-4 rounded-lg bg-white/5">
                        <p className={`${theme.muted} text-xs`}>Deliverable #{index + 1}</p>
                        <Input
                          placeholder="Label (e.g., Reel, Story, Post)"
                          value={item.label}
                          onChange={(e) => {
                            const copy = [...postedLinks];
                            copy[index].label = e.target.value;
                            setPostedLinks(copy);
                          }}
                          disabled={submitting}
                          className="bg-white/10 border-white/20"
                        />
                        <Input
                          placeholder="Instagram link"
                          value={item.url}
                          onChange={(e) => {
                            const copy = [...postedLinks];
                            copy[index].url = e.target.value;
                            setPostedLinks(copy);
                          }}
                          disabled={submitting}
                          className="bg-white/10 border-white/20"
                        />
                      </div>
                    ))}

                    <Button
                      onClick={submitPostedLinks}
                      disabled={
                        submitting ||
                        postedLinks.some((l) => !l.label.trim() || !l.url.trim())
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
                <div className={`p-4 rounded-lg bg-purple-500/10 border border-purple-500/20`}>
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
                <div className={`p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20`}>
                  <p className={`${theme.text} font-medium mb-2`}>
                    🎉 Campaign Completed!
                  </p>
                  <p className={`${theme.muted} text-sm`}>
                    Congratulations on successfully completing this campaign. Earnings: ₹{application.final_payout}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
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
                    type="number"
                    placeholder="Enter your requested payout"
                    value={requestedPayout}
                    onChange={(e) => setRequestedPayout(e.target.value)}
                    className="bg-white/10 border-white/20"
                  />
                </div>

                <div>
                  <label className={`block text-sm ${theme.muted} mb-2`}>
                    Note (Optional)
                  </label>
                  <Textarea
                    placeholder="Explain why you deserve this payout..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    className="bg-white/10 border-white/20"
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