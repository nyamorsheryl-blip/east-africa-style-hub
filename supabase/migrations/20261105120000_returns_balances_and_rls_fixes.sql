-- Final state of this week's changes (consolidated from four applied migrations).

-- Commission processing: create records for paid orders, finalize on delivery (paid only)
create or replace function public.process_order_commissions(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_kes numeric;
  v_from numeric;
  v_fx numeric;
begin
  select * into v_order from orders where id = p_order_id;
  if not found then
    return;
  end if;

  if v_order.status in ('cancelled', 'failed') then
    update commission_records set status = 'void'
    where order_id = p_order_id and status = 'pending';
    return;
  end if;

  if v_order.payment_status = 'paid' then
    select rate_per_usd into v_kes from exchange_rates where currency_code = 'KES';
    select rate_per_usd into v_from from exchange_rates
      where currency_code = coalesce(v_order.currency, 'USD');
    if v_kes is null or v_from is null or v_from = 0 then
      raise warning 'process_order_commissions: missing FX rate, using fallback 130 KES per USD';
      v_fx := 130;
    else
      v_fx := v_kes / v_from;
    end if;

    insert into commission_records
      (order_id, order_item_id, boutique_id, seller_id, category_id, promotion_id,
       rate_bps, gross_cents, commission_cents, seller_net_cents)
    select oi.order_id, oi.id, p.boutique_id, oi.seller_id, p.commission_category_id,
           q.promotion_id, q.rate_bps, g.gross, q.commission_cents, q.seller_net_cents
    from order_items oi
    join products p on p.id = oi.product_id
    cross join lateral (
      select round(oi.unit_price_cents::numeric * oi.quantity * v_fx)::bigint as gross
    ) g
    cross join lateral quote_commission(g.gross, p.boutique_id, p.commission_category_id, now()) q
    where oi.order_id = p_order_id
    on conflict (order_item_id) do nothing;
  end if;

  if v_order.status in ('delivered', 'completed') and v_order.payment_status = 'paid' then
    with fin as (
      update commission_records
         set status = 'finalized', finalized_at = now()
       where order_id = p_order_id and status = 'pending'
      returning *
    )
    insert into ledger_entries
      (idempotency_key, entry_type, account, amount_cents, order_id, order_item_id,
       commission_record_id, boutique_id, seller_id, note)
    select 'finalize:' || id || ':seller_payable', 'sale_finalized', 'seller_payable',
           seller_net_cents, order_id, order_item_id, id, boutique_id, seller_id,
           'Seller earnings after commission'
      from fin
    union all
    select 'finalize:' || id || ':platform_commission', 'sale_finalized', 'platform_commission',
           commission_cents, order_id, order_item_id, id, boutique_id, seller_id,
           'Platform commission'
      from fin
    on conflict (idempotency_key) do nothing;
  end if;
end;
$$;

revoke all on function public.process_order_commissions(uuid) from public, anon, authenticated;

-- Approved or refunded return reverses the commission record and writes ledger entries
create or replace function public.reverse_commission_for_return()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r commission_records%rowtype;
begin
  if new.status not in ('approved', 'refunded') or old.status is not distinct from new.status then
    return new;
  end if;

  select * into r from commission_records where order_item_id = new.order_item_id for update;
  if not found or r.status not in ('pending', 'finalized') then
    return new;
  end if;

  update commission_records
     set status = 'reversed', refunded_gross_cents = r.gross_cents
   where id = r.id;

  if r.status = 'finalized' then
    insert into ledger_entries
      (idempotency_key, entry_type, account, amount_cents, order_id, order_item_id,
       commission_record_id, boutique_id, seller_id, note)
    values
      ('return:' || new.id || ':seller_payable', 'return_reversal', 'seller_payable',
       -r.seller_net_cents, r.order_id, r.order_item_id, r.id, r.boutique_id, r.seller_id,
       'Return processed: seller earnings reversed'),
      ('return:' || new.id || ':platform_commission', 'return_reversal', 'platform_commission',
       -r.commission_cents, r.order_id, r.order_item_id, r.id, r.boutique_id, r.seller_id,
       'Return processed: commission reversed'),
      ('return:' || new.id || ':customer_refund', 'return_reversal', 'customer_refund',
       r.gross_cents, r.order_id, r.order_item_id, r.id, r.boutique_id, r.seller_id,
       'Return processed: amount to refund customer')
    on conflict (idempotency_key) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.reverse_commission_for_return() from public, anon, authenticated;

drop trigger if exists trg_returns_reverse_commission on public.returns;
create trigger trg_returns_reverse_commission
after update of status on public.returns
for each row
execute function public.reverse_commission_for_return();

-- Helper: sellers cannot read orders, so the balances view asks this instead
create or replace function public.order_is_paid(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select payment_status = 'paid' from orders where id = p_order_id), false);
$$;

revoke all on function public.order_is_paid(uuid) from public, anon;
grant execute on function public.order_is_paid(uuid) to authenticated;

-- Per-boutique balances
create or replace view public.boutique_balances
with (security_invoker = true) as
with earned as (
  select cr.boutique_id,
         sum(cr.seller_net_cents) filter (where cr.status = 'finalized') as finalized_cents,
         sum(cr.seller_net_cents) filter (where cr.status = 'pending' and public.order_is_paid(cr.order_id)) as pending_cents,
         sum(cr.commission_cents) filter (where cr.status = 'finalized') as commission_cents,
         sum(cr.seller_net_cents) filter (where cr.status = 'reversed') as reversed_cents
  from commission_records cr
  group by cr.boutique_id
),
paid as (
  select boutique_id, sum(amount_kes) as paid_kes
  from payouts
  where status in ('pending', 'processing', 'completed')
  group by boutique_id
)
select coalesce(e.boutique_id, p.boutique_id)               as boutique_id,
       round(coalesce(e.finalized_cents, 0) / 100.0, 2)     as earned_kes,
       round(coalesce(e.pending_cents, 0) / 100.0, 2)       as awaiting_delivery_kes,
       round(coalesce(e.commission_cents, 0) / 100.0, 2)    as commission_kes,
       coalesce(p.paid_kes, 0)                              as paid_out_kes,
       round(coalesce(e.finalized_cents, 0) / 100.0, 2) - coalesce(p.paid_kes, 0) as owed_kes,
       round(coalesce(e.reversed_cents, 0) / 100.0, 2)      as reversed_kes
from earned e
full join paid p on p.boutique_id = e.boutique_id;

revoke all on public.boutique_balances from anon;
grant select on public.boutique_balances to authenticated;

-- Fix infinite recursion between orders and order_items policies
create or replace function public.seller_has_item_in_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from order_items
    where order_id = p_order_id and seller_id = auth.uid()
  );
$$;

create or replace function public.buyer_owns_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from orders
    where id = p_order_id and buyer_id = auth.uid()
  );
$$;

revoke all on function public.seller_has_item_in_order(uuid) from public, anon;
revoke all on function public.buyer_owns_order(uuid) from public, anon;
grant execute on function public.seller_has_item_in_order(uuid) to authenticated;
grant execute on function public.buyer_owns_order(uuid) to authenticated;

drop policy if exists "Seller update order status for own items" on public.orders;
create policy "Seller update order status for own items"
  on public.orders for update to authenticated
  using (public.seller_has_item_in_order(id))
  with check (public.seller_has_item_in_order(id));

drop policy if exists "Order items readable by buyer or seller" on public.order_items;
create policy "Order items readable by buyer or seller"
  on public.order_items for select to authenticated
  using (auth.uid() = seller_id or public.buyer_owns_order(order_id));

drop policy if exists "Buyer can create own order items" on public.order_items;
create policy "Buyer can create own order items"
  on public.order_items for insert to authenticated
  with check (public.buyer_owns_order(order_id));