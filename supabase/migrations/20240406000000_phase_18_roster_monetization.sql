-- Phase 18: Private Roster & Monetization Infrastructure

-- 1. Extend influencer_profiles for CRM capabilities
ALTER TABLE public.influencer_profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS followers_count INTEGER,
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;

-- 2. Add subscription capabilities to Brand and Agency profiles
ALTER TABLE public.brand_profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'silver', 'gold')),
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

ALTER TABLE public.agency_profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'silver', 'gold')),
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- 3. Policy update: Ensure owners can see their private roster details including custom_data
-- Note: 'Viewable influencer profiles' policy already handles base visibility. 
-- We ensure that only the owner can see the sensitive contact/custom data if desired, 
-- but for simplicity now we allow the 'Viewable' logic to suffice as it filters by owned_by_agency_id.

-- 4. Set profile_completed for existing profiles (Legacy support)
UPDATE public.brand_profiles SET profile_completed = true WHERE company_name IS NOT NULL;
UPDATE public.agency_profiles SET profile_completed = true WHERE agency_name IS NOT NULL;
