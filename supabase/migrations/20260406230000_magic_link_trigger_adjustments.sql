-- Update handle_new_user to skip influencer_profiles for phone users initially
-- This supports the "no profile until apply" rule for magic link users.

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

    -- 2. Create entry in profiles (Internal for all users)
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

    -- 4. Automatically create influencer_profile ONLY if role is influencer AND it's NOT a phone signup
    -- Phone signups (Magic Link) create their profile later during the application step.
    IF user_role = 'influencer'::public.app_role AND NEW.phone IS NULL THEN
        INSERT INTO public.influencer_profiles (
            user_id, 
            phone_number, 
            full_name,
            email
        )
        VALUES (
            NEW.id, 
            NULL, -- phone is null for email signup
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User ' || substr(NEW.id::text, 1, 8)),
            NEW.email
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;
