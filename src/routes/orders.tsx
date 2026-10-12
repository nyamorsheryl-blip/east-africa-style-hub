import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Package, RotateCcw, Clock, CheckCircle2, XCircle, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { formatMoney } from "@/lib/format";
import { TopBar } from "@/components/ml/top-bar";
import { BottomNav } from "@/components/ml/bottom-nav";
import { EmptyState } from "@/components/ml/states";

export const Route = createFileRoute("/orders")({ component: Orders });

const STATUS_META: Record<string, { label: string; icon: typeof Clock }> = {
  pending: { label: "Pending", icon: Clock },
  processing: { label: "Processing", icon: Package },
  shipped: { label: "Shipped", icon: Truck },
  delivered: { label: "Delivered", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", icon: XCircle },
};

const PAYMENT_META: Record<string, { label: string; className: string }> = {
  paid: { label: "Paid", className: "glass-blush text-primary" },
  unpaid: { label: "Unpaid", className: "glass text-muted-foreground" },
  failed: { label: "Payment failed", className: "bg-destructive/10 text-destructive" },
};

function Orders() {
  const { user, loading } = useSession();
  const { data } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen pb-24">
        <TopBar title="Your orders" />
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pb-24">
        <TopBar title="Your orders" />
        <div className="mt-10">
          <EmptyState
            icon={<Package className="h-5 w-5" />}
            title="Sign in to view orders"
            copy="Your order history and returns live here once you're signed in."
            action={<Link to="/auth/login" className="btn-base btn-primary">Sign in</Link>}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-enter min-h-screen pb-36">
      <TopBar title="Your orders" />

      {!data || data.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<Package className="h-5 w-5" />}
            title="No orders yet"
            copy="Pieces you buy will show up here, with tracking and returns."
            action={<Link to="/explore" className="btn-base btn-primary">Start shopping</Link>}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4 px-5">
          {data.map((o) => {
            const statusMeta = STATUS_META[o.status as string] ?? STATUS_META.pending;
            const StatusIcon = statusMeta.icon;
            const paymentMeta = PAYMENT_META[(o.payment_status as string) ?? "unpaid"] ?? PAYMENT_META.unpaid;

            return (
              <div key={o.id} className="card-ml p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold text-muted-foreground">Order #{o.id.slice(0, 8)}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(o.created_at as string).toLocaleDateString()}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold">
                      <StatusIcon className="h-3.5 w-3.5" /> {statusMeta.label}
                    </span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${paymentMeta.className}`}>
                      {paymentMeta.label}
                    </span>
                  </div>
                </div>

                <div className="my-4 border-t border-border" />

                <div className="space-y-3">
                  {(o.order_items as OrderItem[]).map((it) => (
                    <OrderItemRow key={it.id} it={it} orderId={o.id as string} buyerId={user.id} currency={o.currency as string} />
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[12px] font-bold text-muted-foreground">Total</span>
                  <span className="text-[16px] font-black">{formatMoney(o.total_cents as number, o.currency as string)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

type OrderItem = {
  id: string;
  product_id: string;
  seller_id: string;
  title: string;
  quantity: number;
  unit_price_cents: number;
  image_url: string | null;
};

function OrderItemRow({ it, orderId, buyerId, currency }: { it: OrderItem; orderId: string; buyerId: string; currency: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [requested, setRequested] = useState(false);

  async function submit() {
    if (!reason.trim()) {
      toast.error("Add a reason for the return");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("returns").insert({
      order_item_id: it.id,
      order_id: orderId,
      buyer_id: buyerId,
      seller_id: it.seller_id,
      reason,
      status: "requested",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Return requested");
    setRequested(true);
    setOpen(false);
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
          {it.image_url && <img src={it.image_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold">{it.title}</div>
          <div className="text-[11px] text-muted-foreground">Qty {it.quantity}</div>
        </div>
        <div className="shrink-0 text-[13px] font-bold">{formatMoney(it.unit_price_cents * it.quantity, currency)}</div>
        {!requested ? (
          <button onClick={() => setOpen((v) => !v)} className="press glass flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[11px] font-extrabold">
            <RotateCcw className="h-3 w-3" /> {open ? "Cancel" : "Return"}
          </button>
        ) : (
          <span className="shrink-0 text-[11px] font-bold text-muted-foreground">Requested</span>
        )}
      </div>
      {open && (
        <div className="mt-2 flex gap-2 pl-[60px]">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for return"
            className="glass flex-1 rounded-2xl px-4 py-2.5 text-[12px] outline-none placeholder:text-muted-foreground"
          />
          <button onClick={submit} disabled={saving} className="press rounded-full bg-foreground px-4 text-[11px] font-extrabold text-background disabled:opacity-60">
            {saving ? "…" : "Send"}
          </button>
        </div>
      )}
    </div>
  );
}