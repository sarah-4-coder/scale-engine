/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * React Query hooks for contract management
 */

// ============================================
// CONTRACTS
// ============================================

export const useContract = (campaignId: string, influencerId: string) => {
  return useQuery({
    queryKey: ['contract', campaignId, influencerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('influencer_id', influencerId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!campaignId && !!influencerId,
  });
};

export const useGenerateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      influencerId,
      contractText 
    }: { 
      campaignId: string; 
      influencerId: string;
      contractText: string;
    }) => {
      const { data, error } = await supabase
        .from('contracts')
        .insert([{
          campaign_id: campaignId,
          influencer_id: influencerId,
          contract_text: contractText,
          status: 'pending_signature',
        }] as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['contract', variables.campaignId, variables.influencerId] 
      });
      toast.success('Contract generated successfully!');
    },
    onError: () => {
      toast.error('Failed to generate contract');
    },
  });
};

export const useSignContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      influencerId 
    }: { 
      campaignId: string; 
      influencerId: string;
    }) => {
      // Update contract status
      const { data, error } = await supabase
        .from('contracts')
        //@ts-ignore
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
        })
        .eq('campaign_id', campaignId)
        .eq('influencer_id', influencerId)
        .select()
        .single();

      if (error) throw error;

      // Update campaign_influencers
      await supabase
        .from('campaign_influencers')
        //@ts-ignore
        .update({ contract_signed: true })
        .eq('campaign_id', campaignId)
        .eq('influencer_id', influencerId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['contract', variables.campaignId, variables.influencerId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['campaign-application', variables.campaignId, variables.influencerId] 
      });
      toast.success('Contract signed successfully! 🎉');
    },
    onError: () => {
      toast.error('Failed to sign contract');
    },
  });
};