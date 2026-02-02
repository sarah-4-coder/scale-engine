/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Optimized React Query hooks for influencer data
 * - Caches data to prevent unnecessary refetches
 * - Automatic invalidation on mutations
 * - Parallel queries where beneficial
 */

// ============================================
// CAMPAIGNS
// ============================================

export const useCampaigns = () => {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const useCampaign = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!campaignId,
  });
};

// ============================================
// INFLUENCER PROFILE
// ============================================

export const useInfluencerProfile = (userId: string) => {
  return useQuery({
    queryKey: ['influencer-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (profile changes rarely)
    gcTime: 30 * 60 * 1000,
    enabled: !!userId,
  });
};

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    gcTime: 30 * 60 * 1000,
    enabled: !!userId,
  });
};

// ============================================
// MY CAMPAIGNS (Campaign Influencers)
// ============================================

export const useMyCampaigns = (influencerId: string) => {
  return useQuery({
    queryKey: ['my-campaigns', influencerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_influencers')
        .select('*')
        .eq('influencer_id', influencerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (updates more frequently)
    gcTime: 5 * 60 * 1000,
    enabled: !!influencerId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time feel
  });
};

export const useCampaignApplication = (campaignId: string, influencerId: string) => {
  return useQuery({
    queryKey: ['campaign-application', campaignId, influencerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_influencers')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('influencer_id', influencerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
    gcTime: 5 * 60 * 1000,
    enabled: !!campaignId && !!influencerId,
    refetchInterval: 10000, // Refetch every 10 seconds for status updates
  });
};

// ============================================
// DASHBOARD STATS (Combined Query)
// ============================================

export const useDashboardStats = (userId: string) => {
  const { data: profile } = useUserProfile(userId);
  const { data: influencer } = useInfluencerProfile(userId);
  
  return useQuery({
    queryKey: ['dashboard-stats', influencer?.id],
    queryFn: async () => {
      if (!influencer?.id) return null;

      // Parallel queries for dashboard data
      const [relationsResult, campaignsResult] = await Promise.all([
        supabase
          .from('campaign_influencers')
          .select('campaign_id, status, final_payout, created_at')
          .eq('influencer_id', influencer.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('campaigns')
          .select('id, name'),
      ]);

      if (relationsResult.error) throw relationsResult.error;
      if (campaignsResult.error) throw campaignsResult.error;

      const relations = relationsResult.data || [];
      const campaigns = campaignsResult.data || [];

      // Calculate stats
      const activeCampaigns = relations.filter(r => r.status === 'accepted').length;
      const earnings = relations.reduce((sum, r) => sum + (r.final_payout || 0), 0);
      const recentCampaigns = relations.slice(0, 3).map(r => {
        const campaign = campaigns.find(c => c.id === r.campaign_id);
        const status = r.status === 'accepted' ? 'Active' :
                      r.status === 'completed' ? 'Completed' : 'Pending';
        return {
          name: campaign?.name || 'Campaign',
          status: status as 'Active' | 'Completed' | 'Pending',
        };
      });

      return {
        fullName: profile?.full_name || 'Creator',
        followers: influencer.followers_count,
        activeCampaigns,
        earnings,
        recentCampaigns,
      };
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000,
    enabled: !!influencer?.id,
  });
};

// ============================================
// MUTATIONS
// ============================================

export const useApplyToCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, influencerId }: { campaignId: string; influencerId: string }) => {
      const { data, error } = await supabase
        .from('campaign_influencers')
        .insert({
          campaign_id: campaignId,
          influencer_id: influencerId,
          status: 'applied',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['my-campaigns', variables.influencerId] });
      toast.success('Applied successfully! Check My Campaigns to track progress.');
    },
    onError: () => {
      toast.error('Already applied or not allowed');
    },
  });
};

export const useUpdateCampaignStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      influencerId, 
      updates 
    }: { 
      campaignId: string; 
      influencerId: string; 
      updates: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('campaign_influencers')
        .update(updates)
        .eq('campaign_id', campaignId)
        .eq('influencer_id', influencerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['my-campaigns', variables.influencerId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-application', variables.campaignId, variables.influencerId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};