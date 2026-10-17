-- Rollback-only integration checks: no test submissions survive this script.
begin;
update public.website_form_settings set intake_enabled = true where id;
set local role service_role;
select public.receive_website_form('00000000-0000-4000-8000-000000000101','{"contactName":"整合測試（回滾）","requestType":"詢價","service":"清潔維護"}',repeat('a',64),repeat('b',64));
select public.receive_website_form('00000000-0000-4000-8000-000000000101','{"contactName":"整合測試（回滾）","requestType":"詢價","service":"清潔維護"}',repeat('a',64),repeat('b',64));
do $$ begin
  if (select count(*) from public.website_form_submissions where id='00000000-0000-4000-8000-000000000101') <> 1 then raise exception 'duplicate insert'; end if;
  begin
    perform public.receive_website_form('00000000-0000-4000-8000-000000000101','{}',repeat('c',64),repeat('b',64));
    raise exception 'conflict was accepted';
  exception when raise_exception then if sqlerrm <> 'REQUEST_CONFLICT' then raise; end if; end;
end $$;
select public.receive_website_form('00000000-0000-4000-8000-000000000102','{}',repeat('a',64),repeat('b',64));
select public.receive_website_form('00000000-0000-4000-8000-000000000103','{}',repeat('a',64),repeat('b',64));
do $$ begin
  begin
    perform public.receive_website_form('00000000-0000-4000-8000-000000000104','{}',repeat('a',64),repeat('b',64));
    raise exception 'rate limit was bypassed';
  exception when raise_exception then if sqlerrm <> 'RATE_LIMITED' then raise; end if; end;
end $$;
reset role;
do $$ begin
  if has_table_privilege('anon','public.website_form_submissions','select') then raise exception 'anonymous read'; end if;
  if has_table_privilege('anon','public.website_form_submissions','insert') then raise exception 'anonymous direct insert'; end if;
  if has_function_privilege('anon','public.receive_website_form(uuid,jsonb,text,text)','execute') then raise exception 'anonymous rpc'; end if;
  if has_column_privilege('authenticated','public.website_form_submissions','payload','update') then raise exception 'client payload update'; end if;
end $$;
select set_config('request.jwt.claim.sub',(select user_id::text from public.website_form_members limit 1),true);
set local role authenticated;
do $$ begin
  update public.website_form_submissions set status='處理中' where id='00000000-0000-4000-8000-000000000101' and version=1;
  if not found then raise exception 'member update failed'; end if;
  update public.website_form_submissions set status='已完成' where id='00000000-0000-4000-8000-000000000101' and version=1;
  if found then raise exception 'stale overwrite accepted'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000999',true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.website_form_submissions) then raise exception 'non-member read'; end if;
end $$;
reset role;
select 'PASS: receipt, idempotency, RLS, status and optimistic version checks' as result;
rollback;
