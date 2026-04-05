-- Fix Relationship between campaign_influencers and contracts
-- This allows PostgREST to perform joins like campaign_influencers?select=*,contracts(*)

ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS campaign_influencer_id UUID REFERENCES public.campaign_influencers(id) ON DELETE CASCADE;

-- Backfill existing contracts
UPDATE public.contracts c
SET campaign_influencer_id = ci.id
FROM public.campaign_influencers ci
WHERE c.campaign_id = ci.campaign_id 
AND c.influencer_id = ci.influencer_id;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_contracts_campaign_influencer_id ON public.contracts(campaign_influencer_id);

-- Update RLS for the new column (optional but good practice)
-- Existing policies are already sufficient as they use campaign_id and influencer_id
