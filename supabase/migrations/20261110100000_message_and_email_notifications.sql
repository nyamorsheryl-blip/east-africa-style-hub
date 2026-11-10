-- New-message notifications
create or replace function public.notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c conversations%rowtype;
  v_recipient uuid;
  v_sender_name text;
  v_preview text;
begin
  select * into c from conversations where id = new.conversation_id;
  if not found then
    return new;
  end if;

  if new.sender_id = c.buyer_id then
    v_recipient := c.seller_id;
    select coalesce(nullif(full_name, ''), nullif(username, ''), 'A customer')
      into v_sender_name from profiles where id = c.buyer_id;
  else
    v_recipient := c.buyer_id;
    select name into v_sender_name from boutiques where id = c.boutique_id;
  end if;

  if v_recipient is null or v_recipient = new.sender_id then
    return new;
  end if;

  v_preview := left(
    case new.kind
      when 'image' then 'Sent a photo'
      when 'voice' then 'Sent a voice message'
      when 'product' then 'Shared a product'
      when 'order' then 'Shared an order'
      else coalesce(nullif(new.body, ''), 'New message')
    end, 140);

  insert into notifications (user_id, type, title, body)
  values (v_recipient, 'message', 'New message from ' || coalesce(v_sender_name, 'MaeLove'), v_preview);

  return new;
end;
$$;

revoke all on function public.notify_on_new_message() from public, anon, authenticated;

drop trigger if exists trg_notify_on_new_message on public.messages;
create trigger trg_notify_on_new_message
after insert on public.messages
for each row
execute function public.notify_on_new_message();

-- Notification emails
alter table public.notifications
  add column if not exists email_status text,
  add column if not exists emailed_at timestamptz;

drop trigger if exists "notify-on-new-notification" on public.notifications;

drop trigger if exists notify_email_on_notification on public.notifications;
create trigger notify_email_on_notification
after insert on public.notifications
for each row
execute function supabase_functions.http_request(
  'https://qxaymlnoqmpixlbuzyla.supabase.co/functions/v1/send-notification-email',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);