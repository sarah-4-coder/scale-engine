import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const AllCampaigns = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [appliedCampaignIds, setAppliedCampaignIds] = useState<string[]>([]);
  const [influencerId, setInfluencerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Influencer profile
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
        .eq("influencer_id", profile.id);

      setAppliedCampaignIds(
        applications?.map((a) => a.campaign_id) || []
      );

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const applyToCampaign = async (campaignId: string) => {
    if (!influencerId) return;

    const { error } = await supabase
      .from("campaign_influencers")
      .insert({
        campaign_id: campaignId,
        influencer_id: influencerId,
        status: "applied",
      });

    if (error) {
      toast.error("Already applied or not allowed");
      return;
    }

    toast.success("Applied successfully");
    setAppliedCampaignIds((prev) => [...prev, campaignId]);
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
      <h1 className="text-2xl font-bold">All Campaigns</h1>

      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader>
            <CardTitle>{campaign.name}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {campaign.description && (
              <p className="text-sm text-muted-foreground">
                {campaign.description}
              </p>
            )}

            <p><strong>Niches:</strong> {campaign.niches.join(", ")}</p>
            <p><strong>Deliverables:</strong> {campaign.deliverables}</p>
            <p><strong>Timeline:</strong> {campaign.timeline}</p>
            <p><strong>Base Payout:</strong> ₹{campaign.base_payout}</p>

            {appliedCampaignIds.includes(campaign.id) ? (
              <Button disabled variant="outline">
                Already Applied
              </Button>
            ) : (
              <Button onClick={() => applyToCampaign(campaign.id)}>
                Apply
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AllCampaigns;
