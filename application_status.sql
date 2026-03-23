-- Backend functions for application status transitions.

create or replace function is_valid_application_status_transition(
  p_from_status text,
  p_to_status text
)
returns boolean
language sql
as $$
  select case
    when p_from_status = 'lead' and p_to_status = 'started' then true
    when p_from_status = 'started' and p_to_status = 'in_progress' then true
    when p_from_status = 'in_progress' and p_to_status = 'submitted' then true
    when p_from_status = 'submitted' and p_to_status = 'ai_review' then true
    when p_from_status = 'ai_review' and p_to_status = 'admin_review' then true
    when p_from_status = 'admin_review' and p_to_status in ('conditions', 'ready_for_lender') then true
    when p_from_status = 'conditions' and p_to_status = 'in_progress' then true
    else false
  end;
$$;

create or replace function change_application_status(
  p_application_id uuid,
  p_new_status text,
  p_user_id uuid
)
returns loan_applications
language plpgsql
as $$
declare
  v_current_status text;
  v_updated_application loan_applications%rowtype;
begin
  -- Fetch and lock current application row for a safe status transition.
  select status
    into v_current_status
  from loan_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found: %', p_application_id
      using errcode = 'P0002';
  end if;

  if not is_valid_application_status_transition(v_current_status, p_new_status) then
    raise exception 'Invalid status transition: % -> %', v_current_status, p_new_status
      using errcode = '22023';
  end if;

  update loan_applications
  set status = p_new_status
  where id = p_application_id
  returning *
    into v_updated_application;

  insert into application_events (
    application_id,
    from_status,
    to_status,
    changed_by
  ) values (
    p_application_id,
    v_current_status,
    p_new_status,
    p_user_id
  );

  return v_updated_application;
end;
$$;
