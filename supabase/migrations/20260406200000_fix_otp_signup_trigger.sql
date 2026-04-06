-- Fix OTP Signup Trigger Logic
-- This migration updates handle_new_user to ensure influencer_profiles are created automatically
-- and handles cases where metadata might be missing during OTP signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role public.app_role;
BEGIN
    -- 1. Determine role, default to 'influencer'
    user_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::public.app_role, 
        'influencer'::public.app_role
    );

    -- 2. Create entry in profiles
    -- We use COALESCE to handle null names during OTP signup
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User ' || substr(NEW.id::text, 1, 8))
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 3. Assign role in user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 4. Automatically create influencer_profile if role is influencer
    -- This ensures subsequent triggers (like stub conversion) find a profile
    IF user_role = 'influencer'::public.app_role THEN
        INSERT INTO public.influencer_profiles (
            user_id, 
            phone_number, 
            full_name
        )
        VALUES (
            NEW.id, 
            NEW.phone,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User ' || substr(NEW.id::text, 1, 8))
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;
