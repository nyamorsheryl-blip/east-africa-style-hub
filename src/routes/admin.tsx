import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { ShieldCheck, Users, Store, Package, Receipt, RotateCcw, BarChart3, Check, X, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/admin")({ component: AdminDash });

type Tab = "overview" | "sellers" | "products" | "orders" | "customers" | "returns";

async function logAction(actorId: string, action: string, targetTable: string, targetId: string, details?: object) {
  await supabase.from("audit_log").insert({ actor_id: actorId, action, target_table: targetTable, target_id: targetId, details: details ?? null });
}

function AdminDash() {
  const { user, loading } = useSession();
  const [tab, setTab] = useState<Tab>("overview");

  const { data: isAdmin, isLoading: checkingRole } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  if (loading || checkingRole) return <div className="min-h-screen"><SiteHeader /></div>;

  if (!user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 pt-16 text-center">
          <div className="glass rounded-3xl p-8">
            <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 font-display text-xl">Admin sign in required</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">This area is for MaeLove admins only.</p>
            <a href="/admin/login" className="btn-base btn-primary inline-flex px-6 py-2.5">Sign in</a>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 pt-16 text-center">
          <div className="glass rounded-3xl p-8">
            <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 font-display text-xl">Restricted</p>
            <p className="text-sm text-muted-foreground mt-1">This account doesn't have admin access.</p>
          </div>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "sellers", label: "Sellers", icon: Store },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: Receipt },
    { id: "customers", label: "Customers", icon: Users },
    { id: "returns", label: "Returns", icon: RotateCcw },
  ];

  return (
    <div className="min-h-screen pb-32">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-10">
        <h1 className="font-display text-3xl font-semibold mb-6">Admin</h1>
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`press flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${tab === t.id ? "bg-primary text-primary-foreground" : "glass"}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab />}
        {tab === "sellers" && <SellersTab adminId={user.id} />}
        {tab === "products" && <ProductsTab adminId={user.id} />}
        {tab === "orders" && <OrdersTab />}
        {tab === "customers" && <CustomersTab />}
        {tab === "returns" && <ReturnsTab adminId={user.id} />}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl px-5 py-4 min-w-[120px]">
      <div className="text-xs text-muted-foreground font-semibold">{label}</div>
      <div className="text-xl font-black mt-1">{value}</div>
    </div>
  );
}

function OverviewTab() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [users, sellers, products, orders, revenue, dailyOrders] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("boutiques").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("order_items").select("unit_price_cents, quantity"),
        supabase.from("orders").select("created_at").order("created_at", { ascending: false }).limit(200),
      ]);
      const totalRevenueCents = (revenue.data ?? []).reduce((s, r) => s + r.unit_price_cents * r.quantity, 0);
      const byDay: Record<string, number> = {};
      (dailyOrders.data ?? []).forEach((o) => {
        const day = new Date(o.created_at).toISOString().slice(0, 10);
        byDay[day] = (byDay[day] ?? 0) + 1;
      });
      const chartData = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([day, count]) => ({ day: day.slice(5), orders: count }));
      return {
        users: users.count ?? 0,
        sellers: sellers.count ?? 0,
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        totalRevenueCents,
        chartData,
      };
    },
  });

  return (
    <div>
      <div className="flex gap-3 flex-wrap mb-8">
        <Stat label="Customers" value={data?.users ?? 0} />
        <Stat label="Sellers" value={data?.sellers ?? 0} />
        <Stat label="Products" value={data?.products ?? 0} />
        <Stat label="Orders" value={data?.orders ?? 0} />
        <Stat label="Gross revenue" value={formatMoney(data?.totalRevenueCents ?? 0)} />
      </div>
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Orders, last 14 days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data?.chartData ?? []}>
            <XAxis dataKey="day" fontSize={11} />
            <YAxis fontSize={11} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="orders" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SellersTab({ adminId }: { adminId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("boutiques").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function setVerified(id: string, verified: boolean) {
    const { error } = await supabase.from("boutiques").update({ verified, verified_at: verified ? new Date().toISOString() : null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await logAction(adminId, verified ? "verify_seller" : "unverify_seller", "boutiques", id);
    toast.success(verified ? "Seller verified" : "Verification removed");
    qc.invalidateQueries({ queryKey: ["admin-sellers"] });
  }

  if (isLoading) return <Loading />;
  const pending = (data ?? []).filter((b: any) => !b.verified);
  const verified = (data ?? []).filter((b: any) => b.verified);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg font-semibold mb-3">Review queue ({pending.length})</h2>
        {pending.length === 0 ? <Empty text="No sellers waiting for review." /> : (
          <div className="grid gap-3 md:grid-cols-2">
            {pending.map((b: any) => (
              <div key={b.id} className="glass rounded-2xl p-4">
                <div className="font-bold">{b.name}</div>
                <div className="text-xs text-muted-foreground">{b.city ?? b.country}</div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setVerified(b.id, true)} className="press flex-1 rounded-full bg-primary text-primary-foreground text-sm font-bold py-2 flex items-center justify-center gap-1"><Check className="h-3.5 w-3.5" /> Verify</button>
                  <button onClick={() => setVerified(b.id, false)} className="press flex-1 rounded-full glass text-sm font-bold py-2 flex items-center justify-center gap-1"><X className="h-3.5 w-3.5" /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold mb-3">Verified sellers ({verified.length})</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {verified.map((b: any) => (
            <div key={b.id} className="glass rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold">{b.name}</div>
                <div className="text-xs text-muted-foreground">{b.city ?? b.country}</div>
              </div>
              <button onClick={() => setVerified(b.id, false)} className="press rounded-full glass text-xs font-bold px-3 py-1.5">Revoke</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsTab({ adminId }: { adminId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  async function toggle(id: string, published: boolean) {
    const { error } = await supabase.from("products").update({ published }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await logAction(adminId, published ? "publish_product" : "unpublish_product", "products", id);
    toast.success(published ? "Product published" : "Product unpublished");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  if (isLoading) return <Loading />;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {(data ?? []).map((p: any) => (
        <div key={p.id} className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold line-clamp-1">{p.title}</div>
            <div className="text-xs text-muted-foreground">{formatMoney(p.price_cents)} · stock {p.stock}</div>
          </div>
          <button onClick={() => toggle(p.id, !p.published)} className={`press shrink-0 rounded-full text-xs font-bold px-3 py-1.5 ${p.published ? "glass" : "bg-primary text-primary-foreground"}`}>
            {p.published ? "Unpublish" : "Publish"}
          </button>
        </div>
      ))}
    </div>
  );
}

function OrdersTab() {
  const [status, setStatus] = useState<string>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Loading />;
  const filtered = status === "all" ? (data ?? []) : (data ?? []).filter((o: any) => o.status === status);
  const statuses = ["all", ...Array.from(new Set((data ?? []).map((o: any) => o.status)))];

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`press rounded-full px-3 py-1.5 text-xs font-bold capitalize ${status === s ? "bg-primary text-primary-foreground" : "glass"}`}>{s}</button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((o: any) => (
          <div key={o.id} className="glass rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</div>
              <div className="text-sm font-bold">{formatMoney(o.total_cents, o.currency)}</div>
            </div>
            <span className="rounded-full glass px-3 py-1 text-xs font-bold capitalize">{o.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <Loading />;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {(data ?? []).map((p: any) => (
        <div key={p.id} className="glass rounded-2xl p-4">
          <div className="font-bold">{p.full_name ?? p.username ?? "Unnamed"}</div>
          <div className="text-xs text-muted-foreground">{p.country ?? "—"} · {p.role ?? "buyer"}</div>
        </div>
      ))}
    </div>
  );
}

function ReturnsTab({ adminId }: { adminId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-returns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("returns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function resolve(id: string, status: string) {
    const { error } = await supabase.from("returns").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await logAction(adminId, `return_${status}`, "returns", id);
    toast.success(`Return ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-returns"] });
  }

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return <Empty text="No return requests." />;
  return (
    <div className="space-y-2">
      {data.map((r: any) => (
        <div key={r.id} className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-sm capitalize">{r.status}</div>
            <div className="text-xs text-muted-foreground">{r.reason ?? "No reason given"}</div>
          </div>
          {r.status === "pending" && (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => resolve(r.id, "approved")} className="press rounded-full bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5">Approve</button>
              <button onClick={() => resolve(r.id, "rejected")} className="press rounded-full glass text-xs font-bold px-3 py-1.5">Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Loading() {
  return <div className="glass rounded-3xl p-12 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
}
function Empty({ text }: { text: string }) {
  return <div className="glass rounded-3xl p-12 text-center text-muted-foreground">{text}</div>;
}