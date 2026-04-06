-- Add missing application_deadline column to campaigns
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.campaigns.application_deadline IS 'The date after which influencers can no longer apply to this campaign';
