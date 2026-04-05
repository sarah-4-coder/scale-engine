-- Support Dynamic Role Assignment during Signup
-- This allows roles like 'brand' or 'agency' to be set directly via raw_user_meta_data

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Create entry in profiles
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- 2. Assign role based on metadata, defaulting to 'influencer'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'influencer'::public.app_role)
  );

  RETURN NEW;
END;
$$;
