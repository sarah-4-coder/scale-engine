-- Add payment details to influencer_profiles
ALTER TABLE IF EXISTS public.influencer_profiles 
ADD COLUMN IF NOT EXISTS upi_id TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS ifsc_code TEXT;

-- Add fee tracking to campaign_influencers
ALTER TABLE IF EXISTS public.campaign_influencers
ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS agency_fee_amount DECIMAL DEFAULT 0;

-- Create ledger table for transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES public.campaign_influencers(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    amount DECIMAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    type TEXT NOT NULL, -- 'inflow', 'payout', 'fee'
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    provider_tx_id TEXT, -- Razorpay Payment/Payout ID
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
