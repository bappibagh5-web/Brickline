-- Conditions system enhancements.

alter table if exists public.conditions
  add column if not exists condition_type text,
  add column if not exists related_key text,
  add column if not exists updated_at timestamp default now();

create index if not exists idx_conditions_application_status
  on public.conditions(application_id, status);

create index if not exists idx_conditions_related_key
  on public.conditions(related_key);

create or replace function public.set_conditions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_conditions_set_updated_at on public.conditions;

create trigger trg_conditions_set_updated_at
before update on public.conditions
for each row
execute function public.set_conditions_updated_at();
