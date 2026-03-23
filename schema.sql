-- PostgreSQL schema for a lending workflow system

-- Optional extension for gen_random_uuid() if not already enabled.
create extension if not exists pgcrypto;

create table if not exists loan_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  status text not null default 'lead',
  application_data jsonb default '{}'::jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references loan_applications(id) on delete cascade,
  from_status text,
  to_status text,
  changed_by uuid,
  notes text,
  created_at timestamp default now()
);

create table if not exists conditions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references loan_applications(id) on delete cascade,
  title text,
  description text,
  status text default 'open',
  assigned_to uuid,
  created_at timestamp default now()
);

-- Indexes
create index if not exists idx_loan_applications_user_id
  on loan_applications(user_id);

create index if not exists idx_application_events_application_id
  on application_events(application_id);

create index if not exists idx_conditions_application_id
  on conditions(application_id);

-- Trigger function to auto-update updated_at on row updates.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_loan_applications_set_updated_at on loan_applications;

create trigger trg_loan_applications_set_updated_at
before update on loan_applications
for each row
execute function set_updated_at();
