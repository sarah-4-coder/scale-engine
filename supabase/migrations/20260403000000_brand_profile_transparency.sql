-- Enable RLS on brand_profiles if not already
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- 1. Explicitly allow ALL authenticated users (Influencers and Brands) to VIEW brand profiles
-- This is necessary for building trust and allowing influencers to see who posted the campaign.
DROP POLICY IF EXISTS "Anyone can view brand profiles" ON public.brand_profiles;
CREATE POLICY "Anyone can view brand profiles"
ON public.brand_profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Allow brands to update only their own profile
DROP POLICY IF EXISTS "Brands can update their own profile" ON public.brand_profiles;
CREATE POLICY "Brands can update their own profile"
ON public.brand_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Allow brands to insert their own profile
DROP POLICY IF EXISTS "Brands can insert their own profile" ON public.brand_profiles;
CREATE POLICY "Brands can insert their own profile"
ON public.brand_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
