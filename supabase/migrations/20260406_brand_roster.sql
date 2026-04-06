-- Alter roster_sessions to add brand_id and make agency_id nullable
alter table public.roster_sessions 
add column brand_id uuid references public.brand_profiles(id) on delete cascade;

alter table public.roster_sessions
alter column agency_id drop not null;

-- Alter saved_rosters to add brand_id and make agency_id nullable
alter table public.saved_rosters
add column brand_id uuid references public.brand_profiles(id) on delete cascade;

alter table public.saved_rosters
alter column agency_id drop not null;

-- Update RLS Policies for roster_sessions
drop policy "Agencies can manage their own roster sessions" on public.roster_sessions;

create policy "Users can manage their own roster sessions"
  on public.roster_sessions
  
  for all
  to authenticated
  using (
    (agency_id in (select id from public.agency_profiles where user_id = auth.uid())) OR
    (brand_id in (select id from public.brand_profiles where user_id = auth.uid()))
  )
  with check (
    (agency_id in (select id from public.agency_profiles where user_id = auth.uid())) OR
    (brand_id in (select id from public.brand_profiles where user_id = auth.uid()))
  );

-- Update RLS Policies for saved_rosters
drop policy "Agencies can manage their own saved rosters" on public.saved_rosters;

create policy "Users can manage their own saved rosters"
  on public.saved_rosters
  for all
  to authenticated
  using (
    (agency_id in (select id from public.agency_profiles where user_id = auth.uid())) OR
    (brand_id in (select id from public.brand_profiles where user_id = auth.uid()))
  )
  with check (
    (agency_id in (select id from public.agency_profiles where user_id = auth.uid())) OR
    (brand_id in (select id from public.brand_profiles where user_id = auth.uid()))
  );
