-- Definitive Infrastructure Stabilization (FIXED RECURSION)
-- This script resolves PGRST201, data visibility issues, and Infinite Recursion for Influencers

-- 1. SECURITY DEFINER FUNCTIONS (To bypass RLS recursion)
-- This function checks if an influencer is part of a campaign without triggering RLS loops
CREATE OR REPLACE FUNCTION public.is_campaign_participant(_campaign_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.campaign_influencers ci
        WHERE ci.campaign_id = _campaign_id
        AND ci.influencer_id = (SELECT id FROM public.influencer_profiles WHERE user_id = _user_id)
    );
$$;

-- 2. DROP REDUNDANT CONSTRAINTS (Resolves PGRST201 Join Ambiguity)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_brand_id_fkey') THEN
        ALTER TABLE public.campaigns DROP CONSTRAINT campaigns_brand_id_fkey;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_brand_profiles_id_fkey') THEN
        ALTER TABLE public.campaigns DROP CONSTRAINT campaigns_brand_profiles_id_fkey;
    END IF;
END $$;

-- 3. ENSURE BRAND_ID IS ENFORCED
ALTER TABLE public.campaigns 
ALTER COLUMN brand_id SET NOT NULL;

-- 4. UNIFY RLS POLICIES FOR CAMPAIGNS (Recursion-Safe)
DROP POLICY IF EXISTS "Unified Campaign Select Policy" ON public.campaigns;
DROP POLICY IF EXISTS "Campaigns are visible to everyone" ON public.campaigns;
DROP POLICY IF EXISTS "Campaigns are visible to authorized roles" ON public.campaigns;
DROP POLICY IF EXISTS "Brands can view own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;

CREATE POLICY "Unified Campaign Select Policy"
ON public.campaigns FOR SELECT
USING (
    -- 1. Admins see everything
    public.has_role(auth.uid(), 'admin')
    OR
    -- 2. Owners/Agents see their brand's campaigns (Direct check on brand_profiles)
    EXISTS (
        SELECT 1 FROM public.brand_profiles bp
        WHERE bp.id = public.campaigns.brand_id
        AND bp.user_id = auth.uid()
    )
    OR
    -- 3. Influencers see ACTIVE campaigns
    (
        public.has_role(auth.uid(), 'influencer')
        AND status = 'active'
    )
    OR
    -- 4. Influencers see campaigns they are part of (Via Security Definer to avoid recursion)
    public.is_campaign_participant(id, auth.uid())
);

-- 5. BRAND PROFILE TRANSPARENCY
DROP POLICY IF EXISTS "Brand profiles are readable by everyone" ON public.brand_profiles;
DROP POLICY IF EXISTS "Brand profiles are readable by authenticated users" ON public.brand_profiles;

CREATE POLICY "Brand profiles are readable by authenticated users"
ON public.brand_profiles FOR SELECT
TO authenticated
USING (true);

-- 6. RE-ENFORCE UNIQUE CONSTRAINTS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_campaign_influencer_application') THEN
        ALTER TABLE public.campaign_influencers 
        ADD CONSTRAINT unique_campaign_influencer_application UNIQUE (campaign_id, influencer_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_campaign_influencer_contract') THEN
        ALTER TABLE public.contracts 
        ADD CONSTRAINT unique_campaign_influencer_contract UNIQUE (campaign_id, influencer_id);
    END IF;
END $$;

-- 7. UPDATE CAMPAIGN_INFLUENCERS RLS (Simplified)
DROP POLICY IF EXISTS "Influencers can view own applications" ON public.campaign_influencers;
CREATE POLICY "Influencers can view own applications"
ON public.campaign_influencers FOR SELECT
USING (
    influencer_id IN (SELECT id FROM public.influencer_profiles WHERE user_id = auth.uid())
);

-- 8. UPDATE CONTRACTS RLS
DROP POLICY IF EXISTS "Influencers can view own contracts" ON public.contracts;
CREATE POLICY "Influencers can view own contracts"
ON public.contracts FOR SELECT
USING (
    influencer_id IN (SELECT id FROM public.influencer_profiles WHERE user_id = auth.uid())
);

COMMIT;
