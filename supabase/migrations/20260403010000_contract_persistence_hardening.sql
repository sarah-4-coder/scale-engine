-- Harden contracts table to ensure 1:1 relationship with campaign_influencers
-- This prevents duplicate contracts and fixes the upsert logic in the frontend

-- 1. Ensure campaign_influencer_id has a unique constraint
ALTER TABLE public.contracts 
ADD CONSTRAINT unique_campaign_influencer_contract UNIQUE (campaign_influencer_id);

-- 2. Make campaign_influencer_id NOT NULL (as it is required for proper linking)
-- First, ensure no nulls exist (they shouldn't after the backfill in previous migration)
DELETE FROM public.contracts WHERE campaign_influencer_id IS NULL;

ALTER TABLE public.contracts 
ALTER COLUMN campaign_influencer_id SET NOT NULL;

-- 3. Update Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_lookup_composite ON public.contracts(campaign_id, influencer_id);
