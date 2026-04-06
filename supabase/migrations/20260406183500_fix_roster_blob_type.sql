-- 2026-04-06 18:35:00: Fix roster storage by converting bytea to text
-- This prevents Postgres from mangling Base64 strings into hex-encoded binary.

-- 1. Purge all existing corrupted data (hex-encoded text strings)
truncate table public.roster_sessions;
truncate table public.saved_rosters;

-- 2. Change column type from bytea to text
alter table public.roster_sessions 
  alter column encrypted_blob type text;

alter table public.saved_rosters 
  alter column encrypted_blob type text;

-- 3. Success message
comment on table public.roster_sessions is 'Roster sessions with text-based Base64 blobs for maximum fidelity';
comment on table public.saved_rosters is 'Saved rosters with text-based Base64 blobs for maximum fidelity';
