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

  -- Cancelled / failed orders: void any pending commission records
  if v_order.status in ('cancelled', 'failed') then
    update commission_records set status = 'void'
    where order_id = p_order_id and status = 'pending';
    return;
  end if;

  -- 1) Paid order: create one commission record per order line (idempotent)
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

  -- 2) Completed order: finalize records and write ledger entries (idempotent)
  if v_order.status in ('delivered', 'completed') then
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

create or replace function public.trg_process_order_commissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.process_order_commissions(new.id);
  return new;
end;
$$;

revoke all on function public.process_order_commissions(uuid) from public, anon, authenticated;
revoke all on function public.trg_process_order_commissions() from public, anon, authenticated;

drop trigger if exists trg_orders_commissions on public.orders;
create trigger trg_orders_commissions
after insert or update of payment_status, status on public.orders
for each row
execute function public.trg_process_order_commissions();

create or replace view public.boutique_balances
with (security_invoker = true) as
with earned as (
  select boutique_id,
         sum(seller_net_cents)  filter (where status = 'finalized') as finalized_cents,
         sum(seller_net_cents)  filter (where status = 'pending')   as pending_cents,
         sum(commission_cents)  filter (where status = 'finalized') as commission_cents
  from commission_records
  group by boutique_id
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
       round(coalesce(e.finalized_cents, 0) / 100.0, 2) - coalesce(p.paid_kes, 0) as owed_kes
from earned e
full join paid p on p.boutique_id = e.boutique_id;

revoke all on public.boutique_balances from anon;
grant select on public.boutique_balances to authenticated;