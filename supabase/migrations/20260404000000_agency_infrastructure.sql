-- 1. Add 'agency' to app_role enum (Supabase doesn't support easy ALTER TYPE ENUM in transactions, so we use a safe block)
DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agency';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create agency_profiles table
CREATE TABLE IF NOT EXISTS public.agency_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    agency_name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Add agency_id to brand_profiles
DO $$ BEGIN
    ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agency_profiles(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 4. Add brand_id to campaigns
DO $$ BEGIN
    ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brand_profiles(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 5. Data Migration: Populate brand_id from brand_user_id (legacy mapping)
UPDATE public.campaigns c
SET brand_id = bp.id
FROM public.brand_profiles bp
WHERE c.brand_user_id = bp.user_id
AND c.brand_id IS NULL;

-- 6. Remove dependent foreign key constraint first
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS fk_campaigns_brand_profile_v2;

-- 7. Remove unique constraint on user_id in brand_profiles to allow multi-tenancy
ALTER TABLE public.brand_profiles DROP CONSTRAINT IF EXISTS brand_profiles_user_id_key;

-- 8. Add a new explicit foreign key using the new brand_id column for PostgREST joins
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_campaigns_brand_id_v1'
    ) THEN
        ALTER TABLE public.campaigns
        ADD CONSTRAINT fk_campaigns_brand_id_v1
        FOREIGN KEY (brand_id)
        REFERENCES public.brand_profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 9. Enable RLS on agency_profiles
ALTER TABLE public.agency_profiles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for agency_profiles
CREATE POLICY "Agencies can view their own profile"
ON public.agency_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Agencies can update their own profile"
ON public.agency_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Agencies can insert their own profile"
ON public.agency_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all agencies"
ON public.agency_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Update Brand RLS to allow Agency access
-- agencies should be able to view brands they manage
CREATE POLICY "Agencies can view brands they manage"
ON public.brand_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.agency_profiles
        WHERE user_id = auth.uid()
        AND id = public.brand_profiles.agency_id
    )
);

CREATE POLICY "Agencies can update brands they manage"
ON public.brand_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.agency_profiles
        WHERE user_id = auth.uid()
        AND id = public.brand_profiles.agency_id
    )
);

-- 7. Add Trigger for agency updated_at
CREATE TRIGGER update_agency_profiles_updated_at
    BEFORE UPDATE ON public.agency_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
