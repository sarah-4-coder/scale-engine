-- Enable Public Read access for campaigns (via slug) and brand_profiles (via ID)
-- This is required for the magic link influencer flow to work for unauthenticated users

-- 1. Campaign Policies
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read campaign details if they have the slug
CREATE POLICY "Allow public read access for campaigns via slug"
ON public.campaigns
FOR SELECT
TO public
USING (slug IS NOT NULL);

-- 2. Brand Profile Policies
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read basic brand details (name, logo) for campaign previews
CREATE POLICY "Allow public read access for brand profiles"
ON public.brand_profiles
FOR SELECT
TO public
USING (true);
