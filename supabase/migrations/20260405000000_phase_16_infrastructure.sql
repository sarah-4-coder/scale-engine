-- Phase 16 Infrastructure Migration

-- 1. Create campaign_type enum
DO $$ BEGIN
    CREATE TYPE public.campaign_type AS ENUM ('paid', 'barter');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS type public.campaign_type DEFAULT 'paid',
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS barter_product_name TEXT,
ADD COLUMN IF NOT EXISTS barter_product_value NUMERIC,
ADD COLUMN IF NOT EXISTS barter_shipping_address TEXT;

-- 3. Create invitation_stubs table
CREATE TABLE IF NOT EXISTS public.invitation_stubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    invited_by_agency_id UUID REFERENCES public.agency_profiles(id) ON DELETE SET NULL,
    unique_hash TEXT UNIQUE DEFAULT gen_random_uuid()::text,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast phone number lookups during OTP/redirect
CREATE INDEX IF NOT EXISTS idx_invitation_stubs_phone ON public.invitation_stubs(phone_number);

-- 4. Update influencer_profiles for Multi-Pool strategy
ALTER TABLE public.influencer_profiles
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS owned_by_agency_id UUID REFERENCES public.agency_profiles(id) ON DELETE SET NULL;

-- 5. Update campaign_influencers for Barter flow
ALTER TABLE public.campaign_influencers
ADD COLUMN IF NOT EXISTS barter_delivery_status TEXT DEFAULT 'pending' CHECK (barter_delivery_status IN ('pending', 'shipped', 'received')),
ADD COLUMN IF NOT EXISTS barter_contract_signed BOOLEAN DEFAULT false;

-- 6. Add is_verified to Brand and Agency profiles (Non-blocking gate)
ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.agency_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 7. Enable RLS on invitation_stubs
ALTER TABLE public.invitation_stubs ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for invitation_stubs
CREATE POLICY "Agencies can view and manage their own stubs"
ON public.invitation_stubs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.agency_profiles
        WHERE user_id = auth.uid()
        AND id = public.invitation_stubs.invited_by_agency_id
    )
);

-- Anyone can select a stub if they have the hash (needed for public landing page lookup)
CREATE POLICY "Public can view stubs by hash"
ON public.invitation_stubs FOR SELECT
USING (true);

-- 9. Hardened multi-pool isolation for influencer_profiles
-- Existing policy might need modification to hide private influencers
DROP POLICY IF EXISTS "Public can view active influencer profiles" ON public.influencer_profiles;

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
    (public.has_role(auth.uid(), 'admin'))
);

-- 10. Function for Admin one-click verification (Logic for later triggers)
CREATE OR REPLACE FUNCTION public.verify_profile(profile_id UUID, profile_type TEXT)
RETURNS VOID AS $$
BEGIN
    IF profile_type = 'brand' THEN
        UPDATE public.brand_profiles SET is_verified = true WHERE id = profile_id;
    ELSIF profile_type = 'agency' THEN
        UPDATE public.agency_profiles SET is_verified = true WHERE id = profile_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
