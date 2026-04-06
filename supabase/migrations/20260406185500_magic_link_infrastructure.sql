-- 2026-04-06 18:55:00: Magic Link Distribution Engine Infrastructure
-- This migration adds auto-slug generation for campaigns and tracking for magic link applications.

-- 1. Function to generate a URL-safe slug with a random suffix
CREATE OR REPLACE FUNCTION public.generate_campaign_slug(name TEXT, campaign_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  random_suffix TEXT;
BEGIN
  -- Convert to lowercase, replace non-alphanumeric with hyphens
  base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Trim leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  -- Fallback if name is empty
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'campaign';
  END IF;
  
  -- Generate 6-char random alphanumeric
  random_suffix := substr(md5(random()::text), 1, 6);
  
  final_slug := base_slug || '-' || random_suffix;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger to auto-populate slug if null on insert
CREATE OR REPLACE FUNCTION public.trg_populate_campaign_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_campaign_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_campaign_slug_insert ON public.campaigns;
CREATE TRIGGER trg_campaign_slug_insert
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_populate_campaign_slug();

-- 3. Backfill existing campaigns that don't have a slug
UPDATE public.campaigns SET slug = public.generate_campaign_slug(name, id) WHERE slug IS NULL;

-- 4. Add 'source' column to campaign_influencers to track magic link applications
ALTER TABLE public.campaign_influencers 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual_add' CHECK (source IN ('manual_add', 'magic_link', 'direct_apply'));

-- 5. Add 'campaign_context_id' to invitation_stubs if not already there (it was there in phase 16 but just in case)
-- Actually invitation_stubs already has campaign_id.

COMMENT ON COLUMN public.campaigns.slug IS 'URL-safe slug for public campaign distribution';
COMMENT ON COLUMN public.campaign_influencers.source IS 'Tracks how the influencer was added to the campaign (manual, magic link, etc.)';
