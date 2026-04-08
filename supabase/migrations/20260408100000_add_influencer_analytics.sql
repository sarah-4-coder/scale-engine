-- Add analytics columns to influencer_profiles
ALTER TABLE public.influencer_profiles 
ADD COLUMN IF NOT EXISTS avg_engagement_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_reach INTEGER DEFAULT 0;

-- Correctly comment on columns for clarity
COMMENT ON COLUMN public.influencer_profiles.avg_engagement_rate IS 'Average engagement rate in percentage (e.g. 4.5)';
COMMENT ON COLUMN public.influencer_profiles.avg_reach IS 'Estimated average reach per post based on historical content';
