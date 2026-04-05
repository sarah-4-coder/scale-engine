-- Add managed_by_dotfluence toggle to campaigns
ALTER TABLE public.campaigns
ADD COLUMN managed_by_dotfluence BOOLEAN NOT NULL DEFAULT false;

-- Add index to quickly filter campaigns that admins need to manage
CREATE INDEX idx_campaigns_managed_by_dotfluence ON public.campaigns(managed_by_dotfluence);
