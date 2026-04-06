-- Relax constraints on influencer_profiles to support Email signup
-- Migration: 20260406220000_relax_influencer_constraints.sql

-- 1. Relax NOT NULL constraints
ALTER TABLE public.influencer_profiles 
ALTER COLUMN phone_number DROP NOT NULL,
ALTER COLUMN full_name DROP NOT NULL;

-- 2. Update handle_new_user to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role public.app_role;
BEGIN
    -- Determine role, default to 'influencer'
    user_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::public.app_role, 
        'influencer'::public.app_role
    );

    -- Create profile in public.profiles
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User ' || substr(NEW.id::text, 1, 8))
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Assign role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Create influencer_profile if role is influencer
    IF user_role = 'influencer'::public.app_role THEN
        INSERT INTO public.influencer_profiles (
            user_id, 
            phone_number, 
            full_name
        )
        VALUES (
            NEW.id, 
            NEW.phone, -- Will be NULL for email signup, which is now allowed
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User ' || substr(NEW.id::text, 1, 8))
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;
