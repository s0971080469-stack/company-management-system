-- Run inside a transaction and ROLLBACK; no test notifications reach Realtime.
-- Prefix this file with BEGIN and the candidate migration when testing pre-release.
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
insert into public.app_records(collection_key,record_id,value) values
 ('sys_users','notice-test-admin','{"id":"notice-test-admin","name":"測試行政","role":"行政","status":"啟用"}'),
 ('sys_users','notice-test-disabled','{"id":"notice-test-disabled","role":"行政","status":"停用"}'),
 ('sys_users','notice-test-finance','{"id":"notice-test-finance","role":"財務","status":"啟用"}');
update public.website_form_settings set intake_enabled=true where id;
set local role service_role;
select public.receive_website_form('00000000-0000-4000-8000-000000000201',
 '{"contactName":"通知測試（不儲存）","phone":"0900000000","details":"不得複製至通知"}',repeat('e',64),repeat('f',64));
select public.receive_website_form('00000000-0000-4000-8000-000000000201',
 '{"contactName":"通知測試（不儲存）","phone":"0900000000","details":"不得複製至通知"}',repeat('e',64),repeat('f',64));
update public.website_form_submissions set status='處理中' where id='00000000-0000-4000-8000-000000000201';
do $$
declare actual text[]; expected text[];
begin
  select array_agg(recipient_id order by recipient_id) into actual from public.chat_messages
    where content like '%00000000-0000-4000-8000-000000000201%';
  select array_agg(id order by id) into expected from (
    select '__admin__'::text id union
    select value->>'id' from public.app_records where collection_key='sys_users'
      and value->>'role'='行政' and coalesce(value->>'status','啟用')<>'停用'
      and nullif(btrim(value->>'id'),'') is not null and value->>'id'<>'__system__'
  ) recipients;
  if actual is distinct from expected then raise exception 'wrong or duplicate recipients: % expected %',actual,expected; end if;
  if not 'notice-test-admin'=any(actual) or not '__admin__'=any(actual)
     or 'notice-test-disabled'=any(actual) or 'notice-test-finance'=any(actual)
     then raise exception 'recipient selection failed'; end if;
  if exists(select 1 from public.chat_messages where content like '%00000000-0000-4000-8000-000000000201%'
    and (sender_id<>'__system__' or read_at is not null or content like '%0900000000%' or content like '%不得複製%'))
    then raise exception 'invalid or excessive message content'; end if;
  if has_function_privilege('anon','public.notify_website_form_received()','execute')
     or has_function_privilege('authenticated','public.notify_website_form_received()','execute')
    then raise exception 'client can invoke notification function'; end if;
end $$;
reset role;
select 'PASS: owner + enabled administrators, retry/update deduplication, unread system sender, no contact details, no client grants' as result;
rollback;
