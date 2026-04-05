-- Add transfer_request_status column to campaigns to track Brand -> Admin handover requests
ALTER TABLE public.campaigns
ADD COLUMN transfer_request_status TEXT;

-- Restrict to null, 'pending', 'accepted', 'rejected'
ALTER TABLE public.campaigns
ADD CONSTRAINT check_transfer_request_status
CHECK (transfer_request_status IN ('pending', 'accepted', 'rejected') OR transfer_request_status IS NULL);
