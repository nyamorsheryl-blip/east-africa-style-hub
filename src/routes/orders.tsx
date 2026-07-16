import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { useSession } from "@/hooks/use-session";
import { formatMoney } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/orders")({ component: Orders });


function Orders() {
  const { user, loading } = useSession();
  const { data } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("buyer_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <div className="min-h-screen"><SiteHeader /></div>;
  if (!user) return (
    <div className="min-h-screen"><SiteHeader />
      <div className="mx-auto max-w-md px-4 pt-16 text-center">
        <div className="glass rounded-3xl p-8"><p className="font-display text-xl">Sign in to view orders</p>
          <Link to="/auth" className="mt-4 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Sign in</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-10">
        <h1 className="font-display text-4xl font-semibold mb-6">Your orders</h1>
        {!data || data.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center text-muted-foreground">No orders yet.</div>
        ) : (
          <div className="space-y-4">
            {data.map((o) => (
              <div key={o.id} className="glass rounded-2xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8)}</div>
                    <div className="text-xs">{new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase glass rounded-full px-3 py-1 inline-block">{o.status}</div>
                    <div className="mt-1 font-display font-semibold text-primary">{formatMoney(o.total_cents, o.currency)}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {(o.order_items as { id: string; product_id: string; seller_id: string; title: string; quantity: number; unit_price_cents: number; image_url: string | null }[]).map((it) => (
                    <OrderItemRow key={it.id} it={it} orderId={o.id} buyerId={user.id} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderItemRow({ it, orderId, buyerId }: {
  it: { id: string; product_id: string; seller_id: string; title: string; quantity: number; unit_price_cents: number; image_url: string | null };
  orderId: string;
  buyerId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [requested, setRequested] = useState(false);

  async function submit() {
    if (!reason.trim()) { toast.error("Add a reason"); return; }
    setSaving(true);
    const { error } = await supabase.from("returns").insert({
      order_item_id: it.id, order_id: orderId, buyer_id: buyerId,
      seller_id: it.seller_id, reason, status: "requested",
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Return requested");
    setRequested(true); setOpen(false);
  }

  return (
    <div className="text-sm">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">{it.image_url && <img src={it.image_url} alt="" className="h-full w-full object-cover" />}</div>
        <div className="flex-1">{it.title} × {it.quantity}</div>
        <div className="text-muted-foreground">{formatMoney(it.unit_price_cents * it.quantity)}</div>
        {!requested && (
          <button onClick={() => setOpen((v) => !v)} className="text-xs font-semibold text-primary hover:underline">
            {open ? "Cancel" : "Return"}
          </button>
        )}
        {requested && <span className="text-xs text-muted-foreground">Requested</span>}
      </div>
      {open && (
        <div className="mt-2 flex gap-2">
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for return" className="flex-1 rounded-xl border border-input bg-white/80 px-3 py-2 text-xs" />
          <button onClick={submit} disabled={saving} className="rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-60">
            {saving ? "…" : "Send"}
          </button>
        </div>
      )}
    </div>
  );
}

