-- Allow Admins to see all campaigns
CREATE POLICY "Admins can view all campaigns"
ON public.campaigns
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow Admins to update campaigns (to accept handovers)
CREATE POLICY "Admins can update all campaigns"
ON public.campaigns
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow Admins to see all campaign_influencers
CREATE POLICY "Admins can view all campaign influencers"
ON public.campaign_influencers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow Admins to update all campaign_influencers
CREATE POLICY "Admins can update all campaign influencers"
ON public.campaign_influencers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
