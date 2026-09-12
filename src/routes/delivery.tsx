import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { useSession } from "@/hooks/use-session";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";
import { Truck, Package, MapPin, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/delivery")({ component: DeliveryDash });

type DeliveryOrder = {
  id: string;
  status: string;
  delivery_status: string | null;
  currency: string;
  created_at: string;
  shipping_address: unknown;
};

function DeliveryDash() {
  const { user, loading } = useSession();
  const qc = useQueryClient();

  const { data: agent } = useQuery({
    queryKey: ["delivery-agent", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("delivery_agents").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: orders, refetch } = useQuery({
    queryKey: ["delivery-orders", agent?.id],
    enabled: !!agent,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, delivery_status, currency, created_at, shipping_address")
        .eq("delivery_agent_id", agent!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DeliveryOrder[];
    },
  });

  async function advanceStatus(orderId: string, next: string) {
    const { error } = await supabase.from("orders").update({ delivery_status: next }).eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${next.replace("_", " ")}`);
    qc.invalidateQueries({ queryKey: ["delivery-orders"] });
    refetch();
  }

  if (loading) return <div className="min-h-screen"><SiteHeader /></div>;
  if (!user) return (
    <div className="min-h-screen"><SiteHeader />
      <div className="mx-auto max-w-md px-4 pt-16 text-center">
        <div className="glass rounded-3xl p-8">
          <Truck className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-display text-xl">Sign in to see your deliveries</p>
          <Link to="/auth" className="mt-4 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Sign in</Link>
        </div>
      </div>
    </div>
  );

  if (!agent) return (
    <div className="min-h-screen"><SiteHeader />
      <div className="mx-auto max-w-md px-4 pt-16 text-center">
        <div className="glass rounded-3xl p-8">
          <Truck className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-display text-xl">Become a delivery partner</p>
          <p className="text-sm text-muted-foreground mt-1">Sign up to start delivering and earning.</p>
          <Link to="/auth/signup" search={{ intent: "deliver" }} className="mt-4 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Get started</Link>
        </div>
      </div>
    </div>
  );

  const active = orders?.filter((o) => o.delivery_status !== "delivered") ?? [];
  const completed = orders?.filter((o) => o.delivery_status === "delivered") ?? [];

  return (
    <div className="min-h-screen pb-32">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-10">
        <div className="glass rounded-3xl p-6 md:p-8 mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold">Your deliveries</h1>
            <p className="text-sm text-muted-foreground mt-1">Orders auto-assign to you when sellers mark them shipped.</p>
          </div>
          <div className="glass rounded-2xl px-4 py-3 text-center">
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="font-display text-2xl font-semibold">{completed.length}</div>
          </div>
        </div>

        <h2 className="font-display text-xl font-semibold mb-3">Active</h2>
        {active.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center text-muted-foreground mb-8">
            <Package className="mx-auto h-8 w-8 mb-2" />
            No active deliveries right now.
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {active.map((o) => <DeliveryRow key={o.id} order={o} onAdvance={advanceStatus} />)}
          </div>
        )}

        {completed.length > 0 && (
          <>
            <h2 className="font-display text-xl font-semibold mb-3">Completed</h2>
            <div className="space-y-3">
              {completed.map((o) => <DeliveryRow key={o.id} order={o} onAdvance={advanceStatus} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DeliveryRow({ order, onAdvance }: { order: DeliveryOrder; onAdvance: (id: string, next: string) => void }) {
  const step = order.delivery_status ?? "assigned";
  const address = order.shipping_address as { line1?: string; city?: string; country?: string } | null;

  const nextStep: Record<string, string | null> = {
    assigned: "picked_up",
    picked_up: "in_transit",
    in_transit: "delivered",
    delivered: null,
  };
  const labels: Record<string, string> = {
    assigned: "Mark picked up",
    picked_up: "Mark in transit",
    in_transit: "Mark delivered",
  };

  const next = nextStep[step];

  return (
    <div className="glass rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
      <div>
        <div className="font-semibold">Order #{order.id.slice(0, 8)}</div>
        {address && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" /> {[address.line1, address.city, address.country].filter(Boolean).join(", ")}
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleDateString()}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] uppercase font-bold rounded-full px-3 py-1 ${
          step === "delivered" ? "bg-primary/15 text-primary" : "bg-white/50 text-plum/70"
        }`}>
          {step.replace("_", " ")}
        </span>
        {next && (
          <button
            onClick={() => onAdvance(order.id, next)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> {labels[step]}
          </button>
        )}
      </div>
    </div>
  );
}
