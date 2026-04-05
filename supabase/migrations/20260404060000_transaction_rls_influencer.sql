-- Add RLS for influencers to see their own payout transactions
CREATE POLICY "Influencers can see their own transactions" ON public.transactions
FOR SELECT TO authenticated
USING (
    influencer_id IN (
        SELECT id FROM public.influencer_profiles
        WHERE user_id = auth.uid()
    )
);

-- Add RLS for brands to see transactions related to their campaigns
CREATE POLICY "Brands can see transactions for their campaigns" ON public.transactions
FOR SELECT TO authenticated
USING (
    campaign_id IN (
        SELECT id FROM public.campaigns
        WHERE admin_user_id = auth.uid()
    )
);
