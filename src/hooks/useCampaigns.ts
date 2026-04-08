/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

/**
 * Optimized React Query hooks for influencer data
 * - Caches data to prevent unnecessary refetches
 * - Automatic invalidation on mutations
 * - Parallel queries where beneficial
 * - Real-time subscriptions for campaign_influencers
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
        .select(`
          *,
          brand_profiles!fk_campaigns_brand_id_v1 (
            company_name,
            industry,
            description,
            is_verified,
            city,
            state,
            company_size,
            company_website,
            contact_person_name
          )
        `)
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
        .select(`
          *,
          brand_profiles!fk_campaigns_brand_id_v1 (
            company_name,
            description,
            industry,
            city,
            state,
            company_website,
            company_size,
            is_verified,
            contact_person_name
          )
        `)
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
        .select('id, user_id, instagram_handle, full_name, profile_image_url, bio, followers_count, niches, is_blocked, city, state, upi_id, bank_name, account_number, ifsc_code, razorpay_account_id, profile_completed, avg_engagement_rate, avg_reach')
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
// MY CAMPAIGNS (Campaign Influencers) WITH REAL-TIME
// ============================================

export const useMyCampaigns = (influencerId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['my-campaigns', influencerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_influencers')
        .select(`
          *,
          campaigns (
            *,
            brand_profiles!fk_campaigns_brand_id_v1 (
              company_name,
              is_verified,
              industry,
              description,
              city,
              state,
              company_website,
              company_size
            )
          )
        `)
        .eq('influencer_id', influencerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 1 * 60 * 1000, // Cache for 1 minute (updates frequently)
    gcTime: 5 * 60 * 1000,
    enabled: !!influencerId,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // ⚡ REAL-TIME SUBSCRIPTION
  useEffect(() => {
    if (!influencerId) return;

    const subscription = supabase
      .channel(`campaign_influencers_${influencerId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'campaign_influencers',
          filter: `influencer_id=eq.${influencerId}`,
        },
        (payload) => {
          console.log('Real-time update for campaign_influencers:', payload);
          
          // Invalidate and refetch immediately
          queryClient.invalidateQueries({ 
            queryKey: ['my-campaigns', influencerId],
            refetchType: 'active' 
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [influencerId, queryClient]);

  return query;
};

export const useCampaignApplication = (campaignId: string, influencerId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
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
    staleTime: 30 * 1000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000,
    enabled: !!campaignId && !!influencerId,
    refetchOnWindowFocus: true,
  });

  // ⚡ REAL-TIME SUBSCRIPTION for specific application
  useEffect(() => {
    if (!campaignId || !influencerId) return;

    const subscription = supabase
      .channel(`campaign_app_${campaignId}_${influencerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_influencers',
          filter: `campaign_id=eq.${campaignId},influencer_id=eq.${influencerId}`,
        },
        (payload) => {
          console.log('Real-time update for application:', payload);
          
          // Invalidate and refetch immediately
          queryClient.invalidateQueries({ 
            queryKey: ['campaign-application', campaignId, influencerId],
            refetchType: 'active'
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [campaignId, influencerId, queryClient]);

  return query;
};

// ============================================
// DASHBOARD STATS (Combined Query)
// ============================================

export const useDashboardStats = (userId: string) => {
  const queryClient = useQueryClient();
  const { data: profile } = useUserProfile(userId);
  const { data: influencer } = useInfluencerProfile(userId);
  
  const query = useQuery({
    //@ts-ignore
    queryKey: ['dashboard-stats', (influencer as any)?.id],
    queryFn: async () => {
      if (!influencer || (influencer as any).error) {
        console.error('Error fetching influencer for stats:', (influencer as any).error);
        return {
          fullName: profile?.full_name || 'Creator',
          followers: 0,
          avgEngagementRate: 0,
          avgReach: 0,
          activeCampaigns: 0,
          earnings: 0,
          recentCampaigns: [],
        };
      }

      const influencerId = (influencer as any).id;

      // Parallel queries for dashboard data
      const [relationsResult, campaignsResult] = await Promise.all([
        supabase
          .from('campaign_influencers')
          .select('campaign_id, status, final_payout, created_at')
          .eq('influencer_id', influencerId ?? '')
          .order('created_at', { ascending: false }),
        supabase
          .from('campaigns')
          .select('id, name'),
      ]);

      if (relationsResult.error) throw relationsResult.error;
      if (campaignsResult.error) throw campaignsResult.error;

      const relations = (relationsResult.data || []) as Array<{ campaign_id: string; status: string; final_payout: number | null; created_at: string }>;
      const campaigns = (campaignsResult.data || []) as Array<{ id: string; name: string }>;

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
        influencerId,
        fullName: profile?.full_name || 'Creator',
        followers: (influencer as any).followers_count,
        avgEngagementRate: (influencer as any).avg_engagement_rate || 0,
        avgReach: (influencer as any).avg_reach || 0,
        activeCampaigns,
        earnings,
        recentCampaigns,
      };
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000,
    enabled: !!(influencer as any)?.id,
  });

  // ⚡ REAL-TIME DASHBOARD UPDATES
  useEffect(() => {
    //@ts-ignore
    if (!influencer?.id) return;

    //@ts-ignore
    const subscription = supabase
      .channel(`dashboard_stats_${(influencer as any).id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_influencers',
          //@ts-ignore
          filter: `influencer_id=eq.${(influencer as any).id}`,
        },
        () => {
          console.log('Refreshing dashboard stats...');
          //@ts-ignore
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats', (influencer as any).id] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
    //@ts-ignore
  }, [influencer?.id, queryClient]);

  return query;
};

// ============================================
// MUTATIONS
// ============================================

export const useApplyToCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      influencerId, 
      requestedPayout,
      negotiationRequested 
    }: { 
      campaignId: string; 
      influencerId: string; 
      requestedPayout?: number;
      negotiationRequested?: boolean;
    }) => {
      const payload: any = {
        campaign_id: campaignId,
        influencer_id: influencerId,
        status: 'applied',
        negotiation_requested: negotiationRequested ?? false
      };
      
      if (requestedPayout !== undefined) {
        payload.requested_payout = requestedPayout;
      }

      const { data, error } = await supabase
        .from('campaign_influencers')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries - real-time subscription will handle the refetch
      queryClient.invalidateQueries({ queryKey: ['my-campaigns', variables.influencerId] });
      toast.success('Applied successfully! Check My Campaigns to track progress.');
    },
    onError: () => {
      toast.error('Already applied or not allowed');
    },
  });
};

export const usePayoutTransaction = (contractId: string) => {
  return useQuery({
    queryKey: ['payout-transaction', contractId],
    queryFn: async () => {
      if (!contractId) return null;
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('contract_id', contractId)
        .eq('type', 'influencer_payout')
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!contractId,
    staleTime: 30 * 1000,
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
      // Invalidate all related queries - real-time subscription will handle the refetch
      queryClient.invalidateQueries({ queryKey: ['my-campaigns', variables.influencerId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-application', variables.campaignId, variables.influencerId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

// ============================================
// BRAND VELOCITY (Fast Approval Badge)
// ============================================
export const useBrandVelocity = () => {
  return useQuery({
    queryKey: ['brand-velocity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_influencers' as any)
        .select('created_at, approved_at, campaigns!inner(brand_id)')
        .not('approved_at', 'is', null)
        .limit(1000);
      if (error) throw error;
      const brandDeltas: Record<string, number[]> = {};
      ((data as any[]) || []).forEach((row) => {
        const brandId = (row.campaigns as any)?.brand_id;
        if (!brandId || !row.created_at || !row.approved_at) return;
        const ms = new Date(row.approved_at).getTime() - new Date(row.created_at).getTime();
        if (ms > 0) {
          if (!brandDeltas[brandId]) brandDeltas[brandId] = [];
          brandDeltas[brandId].push(ms);
        }
      });
      const fastBrandIds = new Set<string>();
      Object.entries(brandDeltas).forEach(([id, deltas]) => {
        if (!deltas.length) return;
        const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        if (avg < 86400000) fastBrandIds.add(id);
      });
      return fastBrandIds;
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};