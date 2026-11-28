import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/order-qr/$id")({
  head: () => ({ meta: [{ title: "Delivery code - MaeLove" }] }),
  component: OrderQrPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
type State = { payment_status: string | null; delivery_status: string | null; code: string | null; used: boolean };

function OrderQrPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/auth/login" }); return; }
      const [o, c] = await Promise.all([
        db.from("orders").select("payment_status, delivery_status").eq("id", id).maybeSingle(),
        db.from("order_delivery_codes").select("code, used_at").eq("order_id", id).maybeSingle(),
      ]);
      if (!alive) return;
      setState(o.data ? {
        payment_status: o.data.payment_status,
        delivery_status: o.data.delivery_status,
        code: c.data?.code ?? null,
        used: !!c.data?.used_at,
      } : null);
      setLoading(false);
    }
    void load();
    const t = setInterval(load, 6000);
    return () => { alive = false; clearInterval(t); };
  }, [id, navigate]);

  const delivered = state?.used || state?.delivery_status === "delivered";

  return (
    <div className="min-h-screen px-5 pt-8 pb-16">
      <div className="mx-auto max-w-sm text-center">
        <Link to="/orders" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-plum">
          <ArrowLeft className="h-3 w-3" /> My orders
        </Link>
        <h1 className="mt-3 font-display text-2xl font-black">Delivery code</h1>

        {loading && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-berry" />}
        {!loading && !state && <p className="mt-8 text-sm text-muted-foreground">We could not find this order.</p>}

        {!loading && state && delivered && (
          <div className="glass mt-6 rounded-3xl p-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-berry" />
            <p className="mt-3 font-display text-lg font-black">Delivered</p>
            <p className="mt-1 text-sm text-muted-foreground">Thank you for shopping on MaeLove.</p>
          </div>
        )}

        {!loading && state && !delivered && state.payment_status !== "paid" && (
          <p className="glass mt-6 rounded-3xl p-6 text-sm text-muted-foreground">Your delivery code appears here once this order is paid.</p>
        )}

        {!loading && state && !delivered && state.payment_status === "paid" && state.code && (
          <div className="glass mt-6 rounded-3xl p-6">
            <div className="mx-auto inline-block rounded-2xl bg-white p-4">
              <QRCodeSVG value={`MLV:${state.code}`} size={220} level="M" fgColor="#35001C" bgColor="#FFFFFF" />
            </div>
            <p className="mt-4 font-mono text-xl font-black tracking-[0.25em]">{state.code}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Show this to your rider only when your order is in your hands. They scan it to confirm delivery.
              Do not share it with anyone else or send it in a message.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}