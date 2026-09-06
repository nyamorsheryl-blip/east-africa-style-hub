-- Add delivery role support (reuses existing role column/check on profiles)
-- Adjust this if your profiles.role is an enum type rather than text
alter table profiles
  drop constraint if exists profiles_role_check;

alter table profiles
  add constraint profiles_role_check
  check (role in ('shopper', 'seller', 'delivery', 'admin'));

-- Delivery agent details (extra fields beyond profiles)
create table if not exists delivery_agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  vehicle_type text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table delivery_agents enable row level security;

create policy "Delivery agents can view own record"
  on delivery_agents for select
  using (auth.uid() = user_id);

create policy "Delivery agents can update own record"
  on delivery_agents for update
  using (auth.uid() = user_id);

create policy "Delivery agents can insert own record"
  on delivery_agents for insert
  with check (auth.uid() = user_id);

-- Assign a delivery agent to an order
alter table orders
  add column if not exists delivery_agent_id uuid references delivery_agents(id);

-- Notifications table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- e.g. 'new_order', 'order_status', 'low_stock', 'return_submitted', 'return_resolved', 'delivery_assigned'
  title text not null,
  body text,
  related_order_id uuid references orders(id),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can mark own notifications read"
  on notifications for update
  using (auth.uid() = user_id);

-- Trigger: new order_item insert -> notify seller
create or replace function notify_seller_new_order()
returns trigger as $$
begin
  insert into notifications (user_id, type, title, body, related_order_id)
  values (
    new.seller_id,
    'new_order',
    'New order received',
    'You have a new order for ' || new.title,
    new.order_id
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_seller_new_order on order_items;
create trigger trg_notify_seller_new_order
  after insert on order_items
  for each row execute function notify_seller_new_order();

-- Trigger: order status change -> notify buyer (and delivery agent if assigned)
create or replace function notify_order_status_change()
returns trigger as $$
begin
  if new.status is distinct from old.status then
    insert into notifications (user_id, type, title, body, related_order_id)
    values (
      new.buyer_id,
      'order_status',
      'Order ' || new.status,
      'Your order is now ' || new.status,
      new.id
    );

    if new.delivery_agent_id is not null then
      insert into notifications (user_id, type, title, body, related_order_id)
      select da.user_id, 'delivery_assigned', 'Order status update',
             'Order ' || new.id || ' is now ' || new.status, new.id
      from delivery_agents da where da.id = new.delivery_agent_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_order_status on orders;
create trigger trg_notify_order_status
  after update on orders
  for each row execute function notify_order_status_change();

-- Trigger: return request -> notify seller
create or replace function notify_return_submitted()
returns trigger as $$
begin
  insert into notifications (user_id, type, title, body, related_order_id)
  values (
    new.seller_id,
    'return_submitted',
    'Return requested',
    'A buyer requested a return: ' || new.reason,
    new.order_id
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_return_submitted on returns;
create trigger trg_notify_return_submitted
  after insert on returns
  for each row execute function notify_return_submitted();

-- Trigger: return resolved -> notify buyer
create or replace function notify_return_resolved()
returns trigger as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected', 'refunded') then
    insert into notifications (user_id, type, title, body, related_order_id)
    values (
      new.buyer_id,
      'return_resolved',
      'Return ' || new.status,
      coalesce(new.resolution_note, 'Your return has been ' || new.status),
      new.order_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_return_resolved on returns;
create trigger trg_notify_return_resolved
  after update on returns
  for each row execute function notify_return_resolved();
  