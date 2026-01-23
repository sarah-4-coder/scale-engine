import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  niches: string[];
  deliverables: string;
  timeline: string;
  base_payout: number;
}

interface Application {
  campaign_id: string;
  status: string;
  requested_payout: number | null;
  final_payout: number | null;
  posted_link?: string[] | null;
}

/* =========================
   HELPER (EXISTING)
========================= */
const getRequiredLinksCount = (deliverables: string): number => {
  const matches = deliverables.match(/\d+/g);
  if (!matches) return 1;
  return matches.map(Number).reduce((a, b) => a + b, 0);
};

const MyCampaigns = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [influencerId, setInfluencerId] = useState<string | null>(null);

  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [requestedPayout, setRequestedPayout] = useState("");
  const [note, setNote] = useState("");

  /* =========================
     CONTENT SUBMISSION STATE
     🔽 ONLY ADDITION
  ========================= */
  const [postedLinks, setPostedLinks] = useState<
    Record<string, { label: string; url: string }[]>
  >({});
  const [submittingCampaignId, setSubmittingCampaignId] = useState<
    string | null
  >(null);

  const fetchData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("influencer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      toast.error("Influencer profile not found");
      return;
    }

    setInfluencerId(profile.id);

    const { data: applicationsData } = await supabase
      .from("campaign_influencers")
      .select(
        "campaign_id, status, requested_payout, final_payout, posted_link",
      )
      .eq("influencer_id", profile.id);

    setApplications(applicationsData || []);

    const campaignIds = applicationsData?.map((a) => a.campaign_id) || [];

    const { data: campaignsData } = await supabase
      .from("campaigns")
      .select("*")
      .in("id", campaignIds);

    setCampaigns(campaignsData || []);

    /* 🔽 INIT LABEL + LINK INPUTS (ONLY ADDITION) */
    const linkMap: Record<string, { label: string; url: string }[]> = {};
    campaignsData?.forEach((c) => {
      const count = getRequiredLinksCount(c.deliverables);
      linkMap[c.id] = Array.from({ length: count }, () => ({
        label: "",
        url: "",
      }));
    });
    setPostedLinks(linkMap);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  /* =========================
     EXISTING NEGOTIATION LOGIC
  ========================= */
  const submitNegotiation = async () => {
    if (!activeCampaignId || !requestedPayout || !influencerId) return;

    const { error } = await supabase
      .from("campaign_influencers")
      .update({
        requested_payout: Number(requestedPayout),
        negotiation_note: note,
        status: "influencer_negotiated",
      })
      .eq("campaign_id", activeCampaignId)
      .eq("influencer_id", influencerId);

    if (error) {
      toast.error("Failed to request negotiation");
      return;
    }

    toast.success("Negotiation request sent");
    setActiveCampaignId(null);
    setRequestedPayout("");
    setNote("");
    fetchData();
  };

  const acceptCounterOffer = async (campaignId: string) => {
    const application = applications.find((a) => a.campaign_id === campaignId);
    if (!application?.requested_payout || !influencerId) return;

    await supabase
      .from("campaign_influencers")
      .update({
        final_payout: application.requested_payout,
        status: "accepted",
      })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    toast.success("Offer accepted");
    fetchData();
  };

  const unregisterFromCampaign = async (campaignId: string) => {
    if (!influencerId) return;

    await supabase
      .from("campaign_influencers")
      .delete()
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    toast.success("You have left the campaign");
    fetchData();
  };

  const acceptBasePayout = async (campaignId: string, basePayout: number) => {
    if (!influencerId) return;

    await supabase
      .from("campaign_influencers")
      .update({
        final_payout: basePayout,
        status: "accepted",
      })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    toast.success("Base payout accepted");
    fetchData();
  };

  /* =========================
     CONTENT SUBMISSION
     🔽 ONLY ADDITION
  ========================= */
  const submitPostedLinks = async (campaignId: string) => {
    const entries = postedLinks[campaignId];

    if (
      !entries ||
      entries.some((e) => !e.label.trim() || !e.url.trim()) ||
      !influencerId
    ) {
      toast.error("Please fill label and link for all deliverables");
      return;
    }

    const formattedLinks = entries.map(
      (e) => `${e.label.trim()} | ${e.url.trim()}`,
    );

    setSubmittingCampaignId(campaignId);

    const { error } = await supabase
      .from("campaign_influencers")
      .update({
        posted_link: formattedLinks,
        posted_at: new Date().toISOString(),
        status: "content_posted",
      })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    setSubmittingCampaignId(null);

    if (error) {
      toast.error("Failed to submit links");
      return;
    }

    toast.success("Content submitted. Waiting for admin response.");
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Campaigns</h1>

      {campaigns.map((campaign) => {
        const application = applications.find(
          (a) => a.campaign_id === campaign.id,
        );
        if (!application) return null;

        return (
          <Card key={campaign.id}>
            <CardHeader>
              <CardTitle>{campaign.name}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <p>
                <strong>Niches:</strong> {campaign.niches.join(", ")}
              </p>
              <p>
                <strong>Deliverables:</strong> {campaign.deliverables}
              </p>
              <p>
                <strong>Timeline:</strong> {campaign.timeline}
              </p>
              <p>
                <strong>Base Payout:</strong> ₹{campaign.base_payout}
              </p>

              {application.status === "applied" && (
                <Button
                  variant="outline"
                  onClick={() => setActiveCampaignId(campaign.id)}
                >
                  Request Different Payout
                </Button>
              )}

              {application.status === "influencer_negotiated" && (
                <p className="text-sm text-muted-foreground">
                  Waiting for admin response
                </p>
              )}

              {application.status === "admin_negotiated" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Admin has proposed a new payout of ₹
                    <span className="text-sm text-red">
                      {application.requested_payout}
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => acceptCounterOffer(campaign.id)}>
                      Accept Offer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveCampaignId(campaign.id)}
                    >
                      Counter Again
                    </Button>
                  </div>
                </>
              )}

              {application.status === "accepted" && (
                <p className="text-green-600 font-medium">
                  Accepted · ₹{application.final_payout}
                </p>
              )}

              {application.status === "rejected" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => unregisterFromCampaign(campaign.id)}
                  >
                    Leave Campaign
                  </Button>
                  <Button
                    onClick={() =>
                      acceptBasePayout(campaign.id, campaign.base_payout)
                    }
                  >
                    Accept Base Payout
                  </Button>
                </div>
              )}

              {(application.status === "accepted" ||
                application.status === "rejected") && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/40">
                  <p className="text-sm text-yellow-500">
                    ⏳ Submit Instagram post links
                  </p>

                  {postedLinks[campaign.id]?.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <Input
                        placeholder="Label (eg: Reel / Story)"
                        value={item.label}
                        onChange={(e) => {
                          const copy = [...postedLinks[campaign.id]];
                          copy[index].label = e.target.value;
                          setPostedLinks({
                            ...postedLinks,
                            [campaign.id]: copy,
                          });
                        }}
                        disabled={submittingCampaignId === campaign.id}
                      />

                      <Input
                        placeholder="Instagram link"
                        value={item.url}
                        onChange={(e) => {
                          const copy = [...postedLinks[campaign.id]];
                          copy[index].url = e.target.value;
                          setPostedLinks({
                            ...postedLinks,
                            [campaign.id]: copy,
                          });
                        }}
                        disabled={submittingCampaignId === campaign.id}
                      />
                    </div>
                  ))}

                  <Button
                    onClick={() => submitPostedLinks(campaign.id)}
                    disabled={
                      submittingCampaignId === campaign.id ||
                      postedLinks[campaign.id]?.some(
                        (l) => !l.label.trim() || !l.url.trim(),
                      )
                    }
                  >
                    Submit Posted Links
                  </Button>

                  {application.status === "rejected" && (
                    <p className="text-xs text-red-500">
                      Admin rejected previous submission. Please submit again.
                    </p>
                  )}
                </div>
              )}

              {application.status === "content_posted" && (
                <p className="text-sm text-muted-foreground">
                  ✅ Content submitted. Waiting for admin response.
                </p>
              )}

              {application.status === "completed" && (
                <p className="text-green-600 font-medium">
                  🎉 Campaign completed
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {activeCampaignId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-96 space-y-4">
            <h3 className="text-lg font-bold">Request Different Payout</h3>

            <Input
              type="number"
              placeholder="Requested amount"
              value={requestedPayout}
              onChange={(e) => setRequestedPayout(e.target.value)}
            />

            <Textarea
              placeholder="Optional note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setActiveCampaignId(null)}
              >
                Cancel
              </Button>
              <Button onClick={submitNegotiation}>Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCampaigns;
