-- Infrastructure Stabilization: PostgREST Ambiguity & RLS Recovery

-- 1. Resolve PostgREST Relationship Ambiguity (PGRST201)
-- Remove redundant foreign key constraints that cause multiple relationships for 'campaigns' -> 'brand_profiles'
DO $$ 
BEGIN
    -- This is the automatic constraint created by 'brand_id UUID REFERENCES ...' in the earlier migration
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_brand_id_fkey') THEN
        ALTER TABLE public.campaigns DROP CONSTRAINT campaigns_brand_id_fkey;
    END IF;
END $$;

-- 2. Consolidate Campaign Ownership Data
-- Ensure ALL campaigns have a valid brand_id linked to the source brand_user_id
UPDATE public.campaigns c
SET brand_id = bp.id
FROM public.brand_profiles bp
WHERE c.brand_user_id = bp.user_id
AND c.brand_id IS NULL;

-- 3. Overhaul Row Level Security (RLS) for Multi-Tenant Workspaces

-- CAMPAIGNS table
DROP POLICY IF EXISTS "Brands can view their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Brands can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Brands can update their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can view all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can update all campaigns" ON public.campaigns;

-- New Workspace-Aware Policies for Campaigns
CREATE POLICY "Campaigns are visible to authorized roles"
ON public.campaigns FOR SELECT
USING (
    -- Brands/Agencies who own the workspace
    EXISTS (
        SELECT 1 FROM public.brand_profiles bp
        WHERE bp.id = public.campaigns.brand_id
        AND bp.user_id = auth.uid()
    )
    OR
    -- Influencers (Public list of available campaigns)
    public.has_role(auth.uid(), 'influencer')
    OR
    -- Admins
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Agencies can manage campaigns for their brands"
ON public.campaigns FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.brand_profiles bp
        WHERE bp.id = public.campaigns.brand_id
        AND bp.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.brand_profiles bp
        WHERE bp.id = public.campaigns.brand_id
        AND bp.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
);

-- CAMPAIGN_INFLUENCERS table
DROP POLICY IF EXISTS "Brands can update campaign influencers" ON public.campaign_influencers;

CREATE POLICY "Brands can manage their campaign participants"
ON public.campaign_influencers FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.campaigns c
        JOIN public.brand_profiles bp ON c.brand_id = bp.id
        WHERE c.id = public.campaign_influencers.campaign_id
        AND bp.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.campaigns c
        JOIN public.brand_profiles bp ON c.brand_id = bp.id
        WHERE c.id = public.campaign_influencers.campaign_id
        AND bp.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
);

-- CONTRACTS table
DROP POLICY IF EXISTS "Brands can create contracts for their campaigns" ON public.contracts;

CREATE POLICY "Brands can manage contracts for their workspaces"
ON public.contracts FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.campaigns c
        JOIN public.brand_profiles bp ON c.brand_id = bp.id
        WHERE c.id = public.contracts.campaign_id
        AND bp.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.campaigns c
        JOIN public.brand_profiles bp ON c.brand_id = bp.id
        WHERE c.id = public.contracts.campaign_id
        AND bp.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
);
