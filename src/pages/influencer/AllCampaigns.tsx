import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, User } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Link, useNavigate } from "react-router-dom";
import AdminNavbar from "@/components/adminNavbar";

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

const AllCampaigns = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [appliedCampaignIds, setAppliedCampaignIds] = useState<string[]>([]);
  const [influencerId, setInfluencerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Influencer profile (FULL – needed for eligibility)
      const { data: profileData } = await supabase
        .from("influencer_profiles")
        .select("id, niches, followers_count, city")
        .eq("user_id", user.id)
        .single();

      if (!profileData) {
        toast.error("Influencer profile not found");
        return;
      }

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
        .eq("influencer_id", profileData.id);

      setAppliedCampaignIds(applications?.map((a) => a.campaign_id) || []);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  /* -----------------------
     ELIGIBILITY CHECK (NEW)
  ----------------------- */
  const isEligible = (campaign: Campaign) => {
    if (!profile) return false;

    const e = campaign.eligibility || {};

    // Min followers
    if (
      e.min_followers &&
      (!profile.followers_count ||
        profile.followers_count < e.min_followers)
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

    const { error } = await supabase.from("campaign_influencers").insert({
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <AdminNavbar  />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">All Campaigns</h1>

        {campaigns.filter(isEligible).map((campaign) => (
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

        {campaigns.filter(isEligible).length === 0 && (
          <p className="text-muted-foreground">
            No campaigns available for you at the moment.
          </p>
        )}
      </div>
    </>
  );
};

export default AllCampaigns;
