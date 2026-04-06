-- Add logo_url column to brand_profiles
DO $$ BEGIN
    ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Also ensure profile_completed column exists as it's used in some components
DO $$ BEGIN
    ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
