-- Migration: Admin Signup Notifications
-- 2024-04-05_admin_signup_notifications.sql

-- Table to store admin notifications for new signups
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'brand_profiles' or 'agency_profiles'
    entity_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Allow admins to read/write notifications
CREATE POLICY "Admins can manage notifications" ON public.admin_notifications
    FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_profiles)); -- Assuming admin_profiles table exists

-- Notification function
CREATE OR REPLACE FUNCTION public.handle_new_signup_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.admin_notifications (entity_type, entity_id, message)
    VALUES (
        TG_TABLE_NAME,
        NEW.id,
        '🚀 New ' || TG_TABLE_NAME || ' signup: ' || COALESCE(NEW.company_name, NEW.name, 'Unknown') || '. Please verify account to enable payments.'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for Brand and Agency signups
DROP TRIGGER IF EXISTS on_brand_signup ON public.brand_profiles;
CREATE TRIGGER on_brand_signup
AFTER INSERT ON public.brand_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_signup_notification();

DROP TRIGGER IF EXISTS on_agency_signup ON public.agency_profiles;
CREATE TRIGGER on_agency_signup
AFTER INSERT ON public.agency_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_signup_notification();
