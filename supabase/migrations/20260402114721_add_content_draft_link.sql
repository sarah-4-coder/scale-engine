-- Add content draft link for zero-storage sharing workflow
ALTER TABLE campaign_influencers
ADD COLUMN IF NOT EXISTS content_draft_link text;
