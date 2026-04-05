import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export const useAgencyStats = () => {
  const { user } = useAuth();
  const { brands, isLoading: workspaceLoading } = useWorkspace();
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalInfluencers: 0,
    activeCampaigns: 0,
    pendingApplications: 0,
  });
  const [inbox, setInbox] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgencySummary = async () => {
    if (!user || brands.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const brandIds = brands.map((b) => b.id);

      // 1. Fetch Campaigns across all brands
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, status, brand_id")
        .in("brand_id", brandIds) as { data: any[] | null };

      const campaignIds = campaigns?.map((c) => c.id) || [];
      const activeCount = campaigns?.filter((c) => c.status === "active").length || 0;

      // 2. Fetch Applications across those campaigns
      let influencers: any[] = [];
      if (campaignIds.length > 0) {
        const { data } = await supabase
          .from("campaign_influencers")
          .select("*, campaigns(name, brand_id), influencer_profiles(full_name, profile_image_url)")
          .in("campaign_id", campaignIds)
          .order("created_at", { ascending: false }) as { data: any[] | null };
        influencers = data || [];
      }

      const pendingCount = influencers.filter((i) => 
        ["pending", "influencer_negotiated", "content_posted"].includes(i.status)
      ).length;

      // 3. Set Inbox (Filtered for Pending/Negotiating/Content Posted)
      const pendingInbox = influencers.filter((i) => 
        ["pending", "influencer_negotiated", "content_posted"].includes(i.status)
      );

      // 4. Set Activities (Recent 10 status changes)
      const recentActivities = influencers.slice(0, 10).map(i => ({
        id: i.id,
        type: "application",
        brandName: brands.find(b => b.id === i.campaigns.brand_id)?.company_name,
        campaignName: i.campaigns.name,
        influencerName: i.influencer_profiles.full_name,
        avatar_url: i.influencer_profiles.profile_image_url,
        status: i.status,
        timestamp: i.created_at
      }));

      setStats({
        totalCampaigns: campaigns?.length || 0,
        totalInfluencers: influencers.length,
        activeCampaigns: activeCount,
        pendingApplications: pendingCount,
      });

      setInbox(pendingInbox);
      setActivities(recentActivities);
    } catch (error) {
      console.error("Error in useAgencyStats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!workspaceLoading) {
      fetchAgencySummary();

      // 1. Automatic background refresh every 30 seconds
      const pollInterval = setInterval(() => {
        console.log("Automatic background refresh...");
        fetchAgencySummary();
      }, 30000);

      // 2. Real-time subscription for campaign_influencers
      const channel = supabase
        .channel('agency-realtime-v2')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'campaign_influencers' },
          (payload) => {
            console.log("Real-time event received:", payload);
            fetchAgencySummary();
          }
        )
        .subscribe();

      return () => {
        clearInterval(pollInterval);
        supabase.removeChannel(channel);
      };
    }
  }, [user, brands, workspaceLoading]);

  return {
    ...stats,
    inbox,
    activities,
    isLoading,
    refetch: fetchAgencySummary
  };
};
