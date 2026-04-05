-- Allow Brands to update campaign_influencers for campaigns they own
CREATE POLICY "Brands can update campaign influencers"
ON public.campaign_influencers
FOR UPDATE
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE brand_user_id = auth.uid()
  )
)
WITH CHECK (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE brand_user_id = auth.uid()
  )
);
