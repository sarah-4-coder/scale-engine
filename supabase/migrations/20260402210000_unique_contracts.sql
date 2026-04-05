-- Ensure only one contract exists per campaign/influencer pair
ALTER TABLE public.contracts 
ADD CONSTRAINT unique_campaign_influencer_contract UNIQUE (campaign_id, influencer_id);
