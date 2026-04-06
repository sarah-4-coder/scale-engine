create table if not exists public.brand_profiles (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  company_name text not null,
  work_email text not null,
  phone_number text not null,
  company_website text null,
  industry text null,
  company_size text null,
  description text null,
  is_verified boolean null default false,
  profile_completed boolean null default false,
  city text null,
  state text null,
  contact_person_name text not null,
  contact_person_designation text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  agency_id uuid null,
  logo_url text null,
  subscription_tier text null default 'free'::text,
  constraint brand_profiles_pkey primary key (id),
  constraint brand_profiles_work_email_key unique (work_email),
  constraint brand_profiles_agency_id_fkey foreign KEY (agency_id) references agency_profiles (id) on delete set null,
  constraint brand_profiles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint brand_profiles_subscription_tier_check check (
    (
      subscription_tier = any (array['free'::text, 'silver'::text, 'gold'::text])
    )
  )
);

create index IF not exists idx_brand_profiles_user_id on public.brand_profiles using btree (user_id);

create index IF not exists idx_brand_profiles_is_verified on public.brand_profiles using btree (is_verified);

-- Function for updated_at trigger if it doesn't exist
create or replace function update_brand_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger brand_profiles_updated_at 
before update on brand_profiles for EACH row
execute FUNCTION update_brand_profiles_updated_at ();
