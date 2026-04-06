-- Stub Conversion Logic

CREATE OR REPLACE FUNCTION public.handle_stub_conversion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stub_record RECORD;
    inf_id UUID;
BEGIN
    -- Check if there's a pending stub for this phone number
    -- NEW.phone is available on auth.users
    SELECT * INTO stub_record 
    FROM public.invitation_stubs 
    WHERE phone_number = NEW.phone 
      AND status = 'pending'
    ORDER BY created_at DESC 
    LIMIT 1;

    IF stub_record IS NOT NULL THEN
        -- 1. Link the influencer_profile to the agency that invited them
        UPDATE public.influencer_profiles
        SET owned_by_agency_id = stub_record.invited_by_agency_id,
            is_private = true -- Initially private if invited by an agency
        WHERE user_id = NEW.id
        RETURNING id INTO inf_id;

        -- 2. Create the campaign application
        INSERT INTO public.campaign_influencers (
            campaign_id,
            influencer_id,
            status,
            payout_agreed
        ) VALUES (
            stub_record.campaign_id,
            inf_id,
            'applied',
            0 -- Force negotiation/base payout logic
        ) ON CONFLICT DO NOTHING;

        -- 3. Mark stub as claimed
        UPDATE public.invitation_stubs
        SET status = 'claimed'
        WHERE id = stub_record.id;
    END IF;

    RETURN NEW;
END;
$$;

-- Add a new trigger to handle stub conversion after profile creation
-- Note: the 'on_auth_user_created' trigger already runs 'handle_new_user'
-- which creates the profile. We want this to run after that.
DROP TRIGGER IF EXISTS on_auth_user_stub_conversion ON auth.users;
CREATE TRIGGER on_auth_user_stub_conversion
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_stub_conversion();
