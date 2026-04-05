-- Add negotiation_requested flag to track intent during application
ALTER TABLE IF EXISTS public.campaign_influencers
ADD COLUMN IF NOT EXISTS negotiation_requested BOOLEAN DEFAULT FALSE;
