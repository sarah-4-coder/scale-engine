-- Add missing columns to transactions ledger
ALTER TABLE IF EXISTS public.transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Backfill description from metadata if any records exist
UPDATE public.transactions 
SET description = metadata->>'description'
WHERE description IS NULL AND metadata->>'description' IS NOT NULL;

-- Enable RLS (already enabled but good to ensure)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Admins
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Also allow Brands to see their own transactions (inflow entries for their campaigns)
DROP POLICY IF EXISTS "Brands can view their campaign transactions" ON public.transactions;
CREATE POLICY "Brands can view their campaign transactions"
ON public.transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE id = transactions.campaign_id
    AND brand_user_id = auth.uid()
  )
);

-- Allow system and authorized users to insert transactions (handled by client-side code for now)
DROP POLICY IF EXISTS "Authorized users can log transactions" ON public.transactions;
CREATE POLICY "Authorized users can log transactions"
ON public.transactions
FOR INSERT
WITH CHECK (true); -- Simple policy for now, as logging happens across dashboard roles
