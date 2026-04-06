-- Relax user_id and social constraints to allow private roster influencers (stubs)
ALTER TABLE public.influencer_profiles 
ALTER COLUMN user_id DROP NOT NULL,
ALTER COLUMN instagram_handle DROP NOT NULL,
ALTER COLUMN instagram_profile_url DROP NOT NULL;
