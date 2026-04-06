import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useInfluencerProfile, useApplyToCampaign, useMyCampaigns } from './useCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * useMagicLinkApplication
 * 
 * Automatically applies a user to a campaign if they signed in via a magic link.
 * Logic:
 * 1. Checks for 'invited_via' and 'campaign_context_id' in session storage or user metadata.
 * 2. Verifies if the user is an influencer and has a profile.
 * 3. Checks if an application already exists for this influencer/campaign.
 * 4. If not, performs the application and clears the metadata.
 */
export const useMagicLinkApplication = () => {
    const { user, role } = useAuth();
    const { data: profile } = useInfluencerProfile(user?.id ?? '');
    const { mutate: apply } = useApplyToCampaign();
    const { data: myApps } = useMyCampaigns(profile?.id ?? '');

    useEffect(() => {
        const syncApplication = async () => {
            if (!user || role !== 'influencer' || !profile?.id || !myApps) return;

            // 1. Get Context from Metadata or Session
            const invitedVia = user.user_metadata?.invited_via || sessionStorage.getItem('invited_via');
            const campaignId = user.user_metadata?.campaign_context_id || sessionStorage.getItem('campaign_context_id');

            if (invitedVia === 'campaign' && campaignId) {
                // 2. Check for existing application
                const alreadyApplied = myApps.some(app => app.campaign_id === campaignId);

                if (!alreadyApplied) {
                    console.log(`[MagicLink] Applying influencer ${profile.id} to campaign ${campaignId}`);
                    
                    apply({
                        campaignId,
                        influencerId: profile.id,
                        negotiationRequested: false
                    }, {
                        onSuccess: () => {
                            toast.success("Applied to campaign automatically! 🎉");
                        }
                    });
                }

                // 3. Clear context from metadata and session to prevent re-triggering
                await supabase.auth.updateUser({
                    data: {
                        invited_via: null,
                        campaign_context_id: null
                    }
                });
                sessionStorage.removeItem('invited_via');
                sessionStorage.removeItem('campaign_context_id');
            }
        };

        syncApplication();
    }, [user, role, profile?.id, myApps, apply]);
};
