-- Add unique constraints to roster_sessions to support upsert
alter table public.roster_sessions
add constraint roster_sessions_agency_id_key unique (agency_id);

alter table public.roster_sessions
add constraint roster_sessions_brand_id_key unique (brand_id);
