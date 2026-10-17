-- Standalone website intake. No changes to accounting/app_records/app_storage.
create table public.website_form_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.website_form_members enable row level security;
revoke all on public.website_form_members from public, anon, authenticated;
grant select on public.website_form_members to authenticated;
grant all on public.website_form_members to service_role;
create policy website_member_self on public.website_form_members for select to authenticated
  using (user_id = (select auth.uid()));

create table public.website_form_settings (
  id boolean primary key default true check (id),
  intake_enabled boolean not null default false
);
insert into public.website_form_settings default values;
alter table public.website_form_settings enable row level security;
revoke all on public.website_form_settings from public, anon, authenticated;
grant select on public.website_form_settings to authenticated;
grant all on public.website_form_settings to service_role;
create policy website_settings_read on public.website_form_settings for select to authenticated
  using (exists (select 1 from public.website_form_members where user_id = (select auth.uid())));

create table public.website_form_submissions (
  id uuid primary key,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 12000),
  status text not null default '待處理' check (status in ('待處理','處理中','已完成')),
  version integer not null default 1,
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
create index website_forms_received_idx on public.website_form_submissions (received_at desc, id);
create index website_forms_updated_by_idx on public.website_form_submissions (updated_by) where updated_by is not null;
alter table public.website_form_submissions enable row level security;
revoke all on public.website_form_submissions from public, anon, authenticated;
grant select on public.website_form_submissions to authenticated;
grant update (status) on public.website_form_submissions to authenticated;
grant all on public.website_form_submissions to service_role;
create policy website_forms_read on public.website_form_submissions for select to authenticated
  using (exists (select 1 from public.website_form_members where user_id = (select auth.uid())));
create policy website_forms_update on public.website_form_submissions for update to authenticated
  using (exists (select 1 from public.website_form_members where user_id = (select auth.uid())))
  with check (exists (select 1 from public.website_form_members where user_id = (select auth.uid())));

create function public.website_form_stamp() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
revoke all on function public.website_form_stamp() from public, anon, authenticated;
create trigger website_form_status_stamp before update on public.website_form_submissions
  for each row execute function public.website_form_stamp();

-- Only the intake function's server credential can access request hashes.
create table public.website_form_receipts (
  id uuid primary key references public.website_form_submissions(id) on delete cascade,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  phone_hash text not null check (phone_hash ~ '^[0-9a-f]{64}$'),
  received_at timestamptz not null default now()
);
create index website_receipts_time_idx on public.website_form_receipts(received_at);
create index website_receipts_phone_time_idx on public.website_form_receipts(phone_hash, received_at);
alter table public.website_form_receipts enable row level security;
revoke all on public.website_form_receipts from public, anon, authenticated;
grant all on public.website_form_receipts to service_role;

-- Invoker rights, service-role-only. Never grant this RPC to browser roles.
create function public.receive_website_form(p_id uuid, p_payload jsonb, p_request_hash text, p_phone_hash text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare previous_hash text;
begin
  perform pg_catalog.pg_advisory_xact_lock(617204, 1);
  if not exists (select 1 from public.website_form_settings where id and intake_enabled) then
    raise exception 'INTAKE_DISABLED' using errcode = 'P0001';
  end if;
  select request_hash into previous_hash from public.website_form_receipts where id = p_id;
  if found then
    if previous_hash <> p_request_hash then raise exception 'REQUEST_CONFLICT' using errcode = 'P0001'; end if;
    return p_id;
  end if;
  if (select count(*) from public.website_form_receipts where received_at > now() - interval '1 minute') >= 20
    or (select count(*) from public.website_form_receipts where received_at > now() - interval '1 day') >= 200
    or (select count(*) from public.website_form_receipts where phone_hash = p_phone_hash and received_at > now() - interval '10 minutes') >= 3 then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;
  insert into public.website_form_submissions(id,payload) values(p_id,p_payload);
  insert into public.website_form_receipts(id,request_hash,phone_hash) values(p_id,p_request_hash,p_phone_hash);
  return p_id;
end $$;
revoke all on function public.receive_website_form(uuid,jsonb,text,text) from public, anon, authenticated;
grant execute on function public.receive_website_form(uuid,jsonb,text,text) to service_role;
