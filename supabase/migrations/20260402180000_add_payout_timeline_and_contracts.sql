-- Phase 5: Add payout timeline to campaigns
ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS payout_delay_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS payout_terms_manual TEXT;

-- Phase 6: Create contracts table (Matching existing frontend hooks)
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    influencer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_text TEXT NOT NULL,
    payout_amount DECIMAL,
    deliverables TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'signed', 'rejected'
    signed_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can see all contracts
CREATE POLICY "Admins can view all contracts"
ON public.contracts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS: Brands can see contracts for their campaigns
CREATE POLICY "Brands can view their campaign contracts"
ON public.contracts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE id = contracts.campaign_id
    AND brand_user_id = auth.uid()
  )
);

-- RLS: Influencers can see and update their own contracts
CREATE POLICY "Influencers can view their own contracts"
ON public.contracts
FOR SELECT
USING (influencer_id = auth.uid());

CREATE POLICY "Influencers can accept their own contracts"
ON public.contracts
FOR UPDATE
USING (influencer_id = auth.uid())
WITH CHECK (influencer_id = auth.uid());

-- RLS: Allow creation
CREATE POLICY "Authorized users can create contracts"
ON public.contracts
FOR INSERT
WITH CHECK (true);
