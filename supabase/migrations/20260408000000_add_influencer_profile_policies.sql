-- Security hardened migration for influencer_profiles RLS
-- Migration: 20260408000000_add_influencer_profile_policies.sql

-- 1. Ensure RLS is enabled
ALTER TABLE public.influencer_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if any to avoid conflicts
DROP POLICY IF EXISTS "Viewable influencer profiles" ON public.influencer_profiles;
DROP POLICY IF EXISTS "Influencers can view own profile" ON public.influencer_profiles;
DROP POLICY IF EXISTS "Influencers can update own profile" ON public.influencer_profiles;
DROP POLICY IF EXISTS "Influencers can insert own profile" ON public.influencer_profiles;

-- 3. SELECT Policy: Detailed visibility logic
CREATE POLICY "Viewable influencer profiles"
ON public.influencer_profiles FOR SELECT
USING (
    (is_private IS FALSE) OR 
    (auth.uid() = user_id) OR
    (EXISTS (
        SELECT 1 FROM public.agency_profiles
        WHERE user_id = auth.uid()
        AND id = public.influencer_profiles.owned_by_agency_id
    )) OR
    (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ))
);

-- 4. INSERT Policy: Allow influencers to create their own profile
CREATE POLICY "Influencers can insert own profile"
ON public.influencer_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. UPDATE Policy: Allow influencers to manage their own profile
CREATE POLICY "Influencers can update own profile"
ON public.influencer_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Ensure ALL influencers have profile_completed column (it should already be there but if not)
-- DO $$ BEGIN
--     ALTER TABLE public.influencer_profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
-- EXCEPTION
--     WHEN duplicate_column THEN null;
-- END $$;
