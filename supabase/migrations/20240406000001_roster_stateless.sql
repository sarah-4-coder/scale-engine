-- Create roster_sessions table
create table if not exists public.roster_sessions (
  id uuid not null default gen_random_uuid (),
  agency_id uuid not null,
  session_name text null,
  encrypted_blob bytea not null,
  row_count integer not null default 0,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null,
  constraint roster_sessions_pkey primary key (id),
  constraint roster_sessions_agency_id_fkey foreign key (agency_id) references public.agency_profiles (id) on delete cascade
);

-- Create saved_rosters table
create table if not exists public.saved_rosters (
  id uuid not null default gen_random_uuid (),
  agency_id uuid not null,
  roster_name text not null,
  encrypted_blob bytea not null,
  row_count integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint saved_rosters_pkey primary key (id),
  constraint saved_rosters_agency_id_fkey foreign key (agency_id) references public.agency_profiles (id) on delete cascade
);

-- Enable RLS
alter table public.roster_sessions enable row level security;
alter table public.saved_rosters enable row level security;

-- Policies for roster_sessions
create policy "Agencies can manage their own roster sessions"
  on public.roster_sessions
  for all
  to authenticated
  using (agency_id in (
    select id from public.agency_profiles where user_id = auth.uid()
  ))
  with check (agency_id in (
    select id from public.agency_profiles where user_id = auth.uid()
  ));

-- Policies for saved_rosters
create policy "Agencies can manage their own saved rosters"
  on public.saved_rosters
  for all
  to authenticated
  using (agency_id in (
    select id from public.agency_profiles where user_id = auth.uid()
  ))
  with check (agency_id in (
    select id from public.agency_profiles where user_id = auth.uid()
  ));

-- Create indexes
create index if not exists idx_roster_sessions_agency_id on public.roster_sessions(agency_id);
create index if not exists idx_saved_rosters_agency_id on public.saved_rosters(agency_id);
create index if not exists idx_roster_sessions_expires_at on public.roster_sessions(expires_at);
