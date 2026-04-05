-- HOTFIX: Establish explicit relationships for PostgREST joins

-- 1. Ensure brand_profiles user_id is the primary key or unique for FK reference
-- (Assuming it's already set up, but let's be safe)

-- 2. Add explicit FK from campaigns to brand_profiles
-- This allows the select='*,brand_profiles(*)' join to work automatically in PostgREST
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_campaigns_brand_profile_v2'
    ) THEN
        ALTER TABLE public.campaigns
        ADD CONSTRAINT fk_campaigns_brand_profile_v2
        FOREIGN KEY (brand_user_id)
        REFERENCES public.brand_profiles(user_id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Fix Contracts RLS (Ensure transparency for authorized roles)
-- Sometimes 'WITH CHECK (true)' is too broad or causes issues in some Supabase versions
DROP POLICY IF EXISTS "Authorized users can create contracts" ON public.contracts;
CREATE POLICY "Influencers can create their own contract drafts"
ON public.contracts
FOR INSERT
WITH CHECK (auth.uid() = influencer_id);

CREATE POLICY "Brands can create contracts for their campaigns"
ON public.contracts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE id = campaign_id
    AND brand_user_id = auth.uid()
  )
);
