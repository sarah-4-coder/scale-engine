-- Agency Multi-Tenant Hardening
-- This script enables agencies to manage multiple brand workspaces

-- 1. DROP 1:1 CONSTRAINT
-- This allows a single user (the agent) to be associated with multiple brand profiles
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brand_profiles_user_id_key') THEN
        ALTER TABLE public.brand_profiles DROP CONSTRAINT brand_profiles_user_id_key;
    END IF;
END $$;

-- 2. UPDATE BRAND_PROFILES RLS FOR MULTI-TENANCY
DROP POLICY IF EXISTS "Users can manage own brand profiles" ON public.brand_profiles;
DROP POLICY IF EXISTS "Agencies can manage their brands" ON public.brand_profiles;

-- Policy for Agents and Brand Owners
CREATE POLICY "Agencies and Owners can manage brand profiles"
ON public.brand_profiles FOR ALL
TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    agency_id IN (SELECT id FROM public.agency_profiles WHERE user_id = auth.uid())
)
WITH CHECK (
    user_id = auth.uid() 
    OR 
    agency_id IN (SELECT id FROM public.agency_profiles WHERE user_id = auth.uid())
);

-- 3. ENSURE CAMPAIGNS ARE VISIBLE TO AGENTS
-- Update the existing Campaign Select policy to include agency check via agency_id on brand_profiles
DROP POLICY IF EXISTS "Unified Campaign Select Policy" ON public.campaigns;

CREATE POLICY "Unified Campaign Select Policy"
ON public.campaigns FOR SELECT
USING (
    -- 1. Admins see everything
    public.has_role(auth.uid(), 'admin')
    OR
    -- 2. Owners/Agents see their brand's campaigns
    EXISTS (
        SELECT 1 FROM public.brand_profiles bp
        WHERE bp.id = public.campaigns.brand_id
        AND (
            bp.user_id = auth.uid()
            OR
            bp.agency_id IN (SELECT id FROM public.agency_profiles WHERE user_id = auth.uid())
        )
    )
    OR
    -- 3. Influencers see ACTIVE campaigns
    (
        public.has_role(auth.uid(), 'influencer')
        AND status = 'active'
    )
    OR
    -- 4. Influencers see campaigns they are part of
    public.is_campaign_participant(id, auth.uid())
);

-- 4. AGENCY PROFILES RLS
ALTER TABLE public.agency_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agencies can manage own profile" ON public.agency_profiles;
CREATE POLICY "Agencies can manage own profile"
ON public.agency_profiles FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Agency profiles are readable by authenticated" ON public.agency_profiles;
CREATE POLICY "Agency profiles are readable by authenticated"
ON public.agency_profiles FOR SELECT
TO authenticated
USING (true);

COMMIT;
