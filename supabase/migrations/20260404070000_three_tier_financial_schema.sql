-- Phase 17: Three-Tier Financial System Schema Updates

-- 1. Update Campaigns table for scenario differentiation
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS execution_model text CHECK (execution_model IN ('agency', 'brand_self', 'brand_managed', 'internal')) DEFAULT 'brand_self',
ADD COLUMN IF NOT EXISTS is_platform_secured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS platform_fee_percent numeric DEFAULT 5.0;

-- Set reasonable defaults for existing records
UPDATE public.campaigns 
SET 
  execution_model = CASE 
    WHEN managed_by_dotfluence = true THEN 'brand_managed'::text
    ELSE 'brand_self'::text
  END,
  is_platform_secured = CASE 
    WHEN managed_by_dotfluence = true THEN true
    ELSE false
  END;

-- 2. Update Campaign Influencers table for funding tracking and compliance
ALTER TABLE public.campaign_influencers
ADD COLUMN IF NOT EXISTS funding_status text CHECK (funding_status IN ('unfunded', 'funded', 'settled')) DEFAULT 'unfunded',
ADD COLUMN IF NOT EXISTS tds_amount numeric DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS net_payout numeric DEFAULT 0.0;

-- Set net_payout for existing completed records if possible
UPDATE public.campaign_influencers
SET 
  net_payout = COALESCE(final_payout, requested_payout, 0),
  funding_status = CASE 
    WHEN status = 'completed' THEN 'funded'::text
    ELSE 'unfunded'::text
  END
WHERE status IN ('completed', 'content_posted');

-- 3. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_execution_model ON public.campaigns (execution_model);
CREATE INDEX IF NOT EXISTS idx_campaign_influencers_funding_status ON public.campaign_influencers (funding_status);

-- 4. RLS Update Reminder:
-- We will need to ensure Influencers can see 'funding_status' and 'net_payout' in their respective views.
