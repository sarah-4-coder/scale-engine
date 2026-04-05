-- 1. Drop potentially incorrect constraints
ALTER TABLE IF EXISTS public.transactions DROP CONSTRAINT IF EXISTS transactions_influencer_id_fkey;
ALTER TABLE IF EXISTS public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE IF EXISTS public.transactions DROP CONSTRAINT IF EXISTS transactions_campaign_id_fkey;

-- 2. Ensure columns exist
ALTER TABLE IF EXISTS public.transactions 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS influencer_id UUID,
ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- 3. Re-create constraints pointing to the CORRECT tables
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_influencer_id_fkey 
FOREIGN KEY (influencer_id) REFERENCES public.influencer_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_campaign_id_fkey 
FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- 4. Update RLS to ensure admins have full access (backup check)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' AND policyname = 'Admins have full access'
    ) THEN
        CREATE POLICY "Admins have full access" ON public.transactions
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        );
    END IF;
END $$;
