-- Server-side notifications: submission and messages commit or roll back together.
-- Invoker rights: intake already runs as service_role; no new browser privileges.
create function public.notify_website_form_received()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.chat_messages (id, sender_id, recipient_id, content)
  select
    pg_catalog.md5('website-form:' || new.id::text || ':' || recipient.id)::uuid,
    '__system__', recipient.id,
    '系統通知：官網收到新表單' || E'\n' ||
    '收件編號：' || new.id::text || E'\n' ||
    '請至「網站資訊管理」查看並安排處理。'
  from (
    -- Existing owner chat identity, also used by invoice deposit notifications.
    select '__admin__'::text as id
    union
    select value->>'id' from public.app_records
    where collection_key = 'sys_users'
      and value->>'role' = '行政'
      and coalesce(value->>'status', '啟用') <> '停用'
      and nullif(btrim(value->>'id'), '') is not null
      and value->>'id' <> '__system__'
  ) recipient
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.notify_website_form_received() from public, anon, authenticated;
grant execute on function public.notify_website_form_received() to service_role;

-- INSERT only: editing/reading a form never repeats the notification.
-- The intake RPC's receipt ID also deduplicates network retries.
create trigger website_form_received_notification
after insert on public.website_form_submissions
for each row execute function public.notify_website_form_received();
