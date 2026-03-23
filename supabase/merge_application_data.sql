create or replace function public.merge_application_data(
  p_application_id uuid,
  p_new_data jsonb
)
returns setof public.loan_applications
language sql
as $$
  update public.loan_applications
  set
    application_data = coalesce(application_data, '{}'::jsonb) || coalesce(p_new_data, '{}'::jsonb),
    updated_at = now()
  where id = p_application_id
  returning *;
$$;
