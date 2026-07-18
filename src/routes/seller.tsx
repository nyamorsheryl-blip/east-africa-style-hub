import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { useSession } from "@/hooks/use-session";
import { CATEGORIES, COUNTRIES, formatMoney, slugify } from "@/lib/format";
import { toast } from "sonner";
import { useState, useRef } from "react";
import {
  Plus, Store, Trash2, ImagePlus, Package, Sparkles, X,
  Boxes, Receipt, RotateCcw, Percent, Pencil, Check, BadgeCheck, ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/seller")({ component: SellerDash });

type Tab = "inventory" | "orders" | "returns";

function SellerDash() {
  const { user, loading } = useSession();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("inventory");

  const { data: boutique } = useQuery({
    queryKey: ["boutique", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("boutiques").select("*").eq("owner_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ["seller-products", boutique?.id],
    enabled: !!boutique,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("boutique_id", boutique!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: unitsSold } = useQuery({
    queryKey: ["seller-units-sold", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("quantity").eq("seller_id", user!.id);
      if (error) throw error;
      return (data ?? []).reduce((s, r) => s + (r.quantity ?? 0), 0);
    },
  });

  if (loading) return <div className="min-h-screen"><SiteHeader /></div>;
  if (!user) return (
    <div className="min-h-screen"><SiteHeader />
      <div className="mx-auto max-w-md px-4 pt-16 text-center">
        <div className="glass rounded-3xl p-8">
          <Store className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-display text-xl">Open your boutique</p>
          <p className="text-sm text-muted-foreground mt-1">Sign in or create an account to get started.</p>
          <Link to="/auth/signup" search={{ intent: "sell" }} className="mt-4 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Get started</Link>
        </div>
      </div>
    </div>
  );

  if (!boutique) return <CreateBoutique userId={user.id} onCreated={() => qc.invalidateQueries({ queryKey: ["boutique"] })} />;

  const stockUnits = products?.reduce((s, p) => s + (p.stock ?? 0), 0) ?? 0;
  const onSale = products?.filter((p) => p.sale_price_cents != null).length ?? 0;

  return (
    <div className="min-h-screen pb-32">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-10">
        {/* Header */}
        <div className="glass rounded-3xl p-6 md:p-8 mb-6 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-3xl font-semibold">{boutique.name}</h1>
              <VerificationPill boutiqueId={boutique.id} verified={boutique.verified} unitsSold={unitsSold ?? 0} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{boutique.tagline || `Boutique in ${boutique.city ?? boutique.country}`}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Stat label="Products" value={products?.length ?? 0} />
            <Stat label="In stock" value={stockUnits} />
            <Stat label="Units sold" value={unitsSold ?? 0} />
            <Stat label="On sale" value={onSale} />
          </div>
        </div>

        {/* Tabs */}
        <div className="glass rounded-full p-1.5 inline-flex gap-1 mb-6">
          <TabBtn active={tab === "inventory"} onClick={() => setTab("inventory")} icon={<Boxes className="h-4 w-4" />} label="Inventory" />
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")} icon={<Receipt className="h-4 w-4" />} label="Orders" />
          <TabBtn active={tab === "returns"} onClick={() => setTab("returns")} icon={<RotateCcw className="h-4 w-4" />} label="Returns" />
        </div>

        {tab === "inventory" && (
          <InventoryTab
            boutiqueId={boutique.id}
            userId={user.id}
            products={products ?? []}
            refetch={refetchProducts}
          />
        )}
        {tab === "orders" && <OrdersTab userId={user.id} />}
        {tab === "returns" && <ReturnsTab userId={user.id} />}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass rounded-2xl px-4 py-3 text-center min-w-[80px]">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function VerificationPill({ boutiqueId, verified, unitsSold }: { boutiqueId: string; verified: boolean; unitsSold: number }) {
  const qc = useQueryClient();
  const storageKey = `maelove:verify-req:${boutiqueId}`;
  const [pending, setPending] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(storageKey) === "1";
  });
  const [busy, setBusy] = useState(false);

  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-plum px-3 py-1 text-[11px] font-extrabold tracking-wider text-cream">
        <BadgeCheck className="h-3.5 w-3.5" /> VERIFIED
      </span>
    );
  }

  async function request() {
    setBusy(true);
    try {
      // Auto-verify once a boutique has proven sales volume; otherwise queue for review.
      if (unitsSold >= 10) {
        const { error } = await supabase.from("boutiques").update({ verified: true }).eq("id", boutiqueId);
        if (error) throw error;
        toast.success("Congrats — your boutique is now verified!");
        qc.invalidateQueries({ queryKey: ["boutique"] });
      } else {
        window.localStorage.setItem(storageKey, "1");
        setPending(true);
        toast.success("Verification requested — our team will review within 48h.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (pending) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/70 px-3 py-1 text-[11px] font-extrabold tracking-wider text-amber-900">
        <ShieldCheck className="h-3.5 w-3.5" /> UNDER REVIEW
      </span>
    );
  }

  return (
    <button
      onClick={request}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-full border border-plum/20 bg-white px-3 py-1 text-[11px] font-extrabold tracking-wider text-plum/70 hover:border-berry hover:text-berry disabled:opacity-60"
    >
      <ShieldCheck className="h-3.5 w-3.5" /> {busy ? "SUBMITTING…" : "GET VERIFIED"}
    </button>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" : "text-plum/70 hover:text-plum"}`}>
      {icon}{label}
    </button>
  );
}

/* ============ INVENTORY ============ */

type Product = {
  id: string;
  title: string;
  category: string;
  currency: string;
  price_cents: number;
  sale_price_cents: number | null;
  stock: number;
  images: string[];
  published: boolean;
};

function InventoryTab({ boutiqueId, userId, products, refetch }: { boutiqueId: string; userId: string; products: Product[]; refetch: () => void }) {
  return (
    <div>
      <ProductForm boutiqueId={boutiqueId} userId={userId} onSaved={refetch} />
      <h2 className="font-display text-2xl font-semibold mt-8 mb-4">Your products</h2>
      {products.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
          <Package className="mx-auto h-8 w-8 mb-2" />
          No products yet. Add your first above ↑
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {products.map((p) => <InventoryRow key={p.id} p={p} refetch={refetch} />)}
        </div>
      )}
    </div>
  );
}

function InventoryRow({ p, refetch }: { p: Product; refetch: () => void }) {
  const [editing, setEditing] = useState(false);
  const [stock, setStock] = useState(String(p.stock));
  const [price, setPrice] = useState(String(p.price_cents / 100));
  const [sale, setSale] = useState(p.sale_price_cents != null ? String(p.sale_price_cents / 100) : "");
  const [published, setPublished] = useState(p.published);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const patch = {
        stock: parseInt(stock, 10),
        price_cents: Math.round(parseFloat(price) * 100),
        sale_price_cents: sale.trim() === "" ? null : Math.round(parseFloat(sale) * 100),
        published,
      };
      const { error } = await supabase.from("products").update(patch).eq("id", p.id);
      if (error) throw error;
      toast.success("Updated");
      setEditing(false);
      refetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  const discount = p.sale_price_cents != null && p.sale_price_cents < p.price_cents
    ? Math.round((1 - p.sale_price_cents / p.price_cents) * 100)
    : 0;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex gap-3">
        <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden shrink-0">
          {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold truncate">{p.title}</div>
              <div className="text-xs text-muted-foreground">{p.category}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditing((v) => !v)} className="p-2 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
              <button
                onClick={async () => {
                  if (!confirm("Delete this product?")) return;
                  await supabase.from("products").delete().eq("id", p.id);
                  toast.success("Deleted"); refetch();
                }}
                className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-primary">{formatMoney(p.sale_price_cents ?? p.price_cents, p.currency)}</span>
            {p.sale_price_cents != null && <span className="text-xs text-muted-foreground line-through">{formatMoney(p.price_cents, p.currency)}</span>}
            {discount > 0 && <span className="text-[10px] font-bold uppercase bg-lime/30 text-plum rounded-full px-2 py-0.5">-{discount}%</span>}
            <span className={`text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 ${p.stock === 0 ? "bg-destructive/15 text-destructive" : "bg-white/50 text-plum/70"}`}>
              {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
            </span>
            {!p.published && <span className="text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 bg-muted text-muted-foreground">Draft</span>}
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/40 pt-4">
          <label className="text-xs">
            <span className="block text-muted-foreground mb-1">Stock</span>
            <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full rounded-xl border border-input bg-white/80 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs">
            <span className="block text-muted-foreground mb-1">Price</span>
            <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-xl border border-input bg-white/80 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs col-span-2">
            <span className="flex items-center gap-1 text-muted-foreground mb-1"><Percent className="h-3 w-3" /> Sale price (blank = no sale)</span>
            <input type="number" step="0.01" min="0" value={sale} onChange={(e) => setSale(e.target.value)} placeholder="e.g. 19.99" className="w-full rounded-xl border border-input bg-white/80 px-3 py-2 text-sm" />
          </label>
          <label className="col-span-2 flex items-center gap-2 text-xs">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="rounded" />
            Published (visible in shop)
          </label>
          <button onClick={save} disabled={saving} className="col-span-2 rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2">
            <Check className="h-4 w-4" />{saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ============ ORDERS ============ */

function OrdersTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["seller-order-items", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*, orders!inner(id, status, created_at, currency, buyer_id, shipping_address)")
        .eq("seller_id", userId)
        .order("id", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function updateStatus(orderId: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${status}`);
    qc.invalidateQueries({ queryKey: ["seller-order-items", userId] });
  }

  if (isLoading) return <div className="glass rounded-3xl p-12 text-center text-muted-foreground">Loading orders…</div>;
  if (!data || data.length === 0) return (
    <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
      <Receipt className="mx-auto h-8 w-8 mb-2" /> No orders yet.
    </div>
  );

  const revenue = data.reduce((s, it) => s + it.unit_price_cents * it.quantity, 0);
  const units = data.reduce((s, it) => s + it.quantity, 0);

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <Stat label="Items sold" value={units} />
        <Stat label="Revenue" value={formatMoney(revenue)} />
      </div>
      <div className="space-y-3">
        {data.map((it) => {
          const order = it.orders as { id: string; status: string; created_at: string; currency: string };
          return (
            <div key={it.id} className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
              <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden shrink-0">
                {it.image_url && <img src={it.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{it.title}</div>
                <div className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString()} · Qty {it.quantity}</div>
                <div className="text-sm font-bold text-primary mt-0.5">{formatMoney(it.unit_price_cents * it.quantity, order.currency)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-semibold glass rounded-full px-3 py-1">{order.status}</span>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="rounded-full border border-input bg-white/80 px-3 py-1.5 text-xs font-semibold"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ RETURNS ============ */

type ReturnRow = {
  id: string;
  order_item_id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  reason: string;
  status: string;
  resolution_note: string | null;
  created_at: string;
};

function ReturnsTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["seller-returns", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("returns")
        .select("*, order_items(title, image_url, quantity, unit_price_cents)")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (ReturnRow & { order_items: { title: string; image_url: string | null; quantity: number; unit_price_cents: number } })[];
    },
  });

  async function resolve(id: string, status: "approved" | "rejected" | "refunded", note?: string) {
    const { error } = await supabase.from("returns").update({ status, resolution_note: note ?? null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Return ${status}`);
    qc.invalidateQueries({ queryKey: ["seller-returns", userId] });
  }

  if (isLoading) return <div className="glass rounded-3xl p-12 text-center text-muted-foreground">Loading returns…</div>;
  if (!data || data.length === 0) return (
    <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
      <RotateCcw className="mx-auto h-8 w-8 mb-2" /> No return requests yet.
    </div>
  );

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <div key={r.id} className="glass rounded-2xl p-4">
          <div className="flex gap-3">
            <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden shrink-0">
              {r.order_items?.image_url && <img src={r.order_items.image_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold truncate">{r.order_items?.title}</div>
                <span className={`text-[10px] uppercase font-bold rounded-full px-2 py-0.5 ${
                  r.status === "requested" ? "bg-amber-200/60 text-amber-900" :
                  r.status === "approved" ? "bg-lime/40 text-plum" :
                  r.status === "refunded" ? "bg-primary/15 text-primary" :
                  "bg-destructive/15 text-destructive"
                }`}>{r.status}</span>
              </div>
              <div className="text-xs text-muted-foreground">Order #{r.order_id.slice(0, 8)} · {new Date(r.created_at).toLocaleDateString()} · Qty {r.order_items?.quantity}</div>
              <p className="text-sm mt-2 whitespace-pre-wrap">{r.reason}</p>
              {r.resolution_note && <p className="text-xs mt-1 text-muted-foreground">Response: {r.resolution_note}</p>}
            </div>
          </div>
          {r.status === "requested" && (
            <ResolveActions onResolve={(status, note) => resolve(r.id, status, note)} />
          )}
          {r.status === "approved" && (
            <button onClick={() => resolve(r.id, "refunded")} className="mt-3 w-full rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground">
              Mark refunded
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function ResolveActions({ onResolve }: { onResolve: (status: "approved" | "rejected", note: string) => void }) {
  const [note, setNote] = useState("");
  return (
    <div className="mt-3 border-t border-white/40 pt-3 space-y-2">
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note to buyer" rows={2} className="w-full rounded-xl border border-input bg-white/80 px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button onClick={() => onResolve("rejected", note)} className="flex-1 rounded-full border border-input bg-white/60 py-2 text-xs font-semibold text-plum">Reject</button>
        <button onClick={() => onResolve("approved", note)} className="flex-1 rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground">Approve return</button>
      </div>
    </div>
  );
}

/* ============ CREATE BOUTIQUE ============ */

function CreateBoutique({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [country, setCountry] = useState<string>("Kenya");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6);
      const { error } = await supabase.from("boutiques").insert({ owner_id: userId, name, tagline, country, city, slug });
      if (error) throw error;
      await supabase.from("profiles").update({ role: "seller" }).eq("id", userId).in("role", ["shopper"]);
      toast.success("Boutique created!");
      onCreated();
      navigate({ to: "/seller" });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-4 pt-10">
        <div className="glass rounded-3xl p-8">
          <Store className="h-8 w-8 text-primary" />
          <h1 className="mt-3 font-display text-3xl font-semibold">Open your boutique</h1>
          <p className="text-sm text-muted-foreground mt-1">Tell us about your brand. You can polish everything later.</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Boutique name" className="w-full rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Tagline (e.g. Handwoven kitenge from Nairobi)" className="w-full rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
            <div className="grid grid-cols-2 gap-3">
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm">
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button disabled={saving} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60">
              {saving ? "Creating…" : "Create boutique"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============ PRODUCT FORM ============ */

function ProductForm({ boutiqueId, userId, onSaved }: { boutiqueId: string; userId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("1");
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const path = `${userId}/${Date.now()}-${slugify(f.name)}`;
        const { error } = await supabase.storage.from("product-images").upload(path, f, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setImages((prev) => [...prev, ...urls]);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (images.length === 0) { toast.error("Add at least one image"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("products").insert({
        boutique_id: boutiqueId, owner_id: userId, title, description, category,
        price_cents: Math.round(parseFloat(price) * 100),
        sale_price_cents: salePrice.trim() === "" ? null : Math.round(parseFloat(salePrice) * 100),
        stock: parseInt(stock, 10),
        sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean),
        colors: colors.split(",").map((s) => s.trim()).filter(Boolean),
        images,
      });
      if (error) throw error;
      toast.success("Product listed!");
      setTitle(""); setDescription(""); setPrice(""); setSalePrice(""); setStock("1"); setSizes(""); setColors(""); setImages([]);
      setOpen(false);
      onSaved();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="glass w-full rounded-3xl p-6 text-left hover:bg-white/70 flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: "var(--gradient-warm)" }}><Plus className="h-5 w-5" /></div>
      <div>
        <div className="font-display text-lg font-semibold">Add a product</div>
        <div className="text-xs text-muted-foreground">Upload photos, set a price, publish in seconds</div>
      </div>
    </button>
  );

  return (
    <form onSubmit={save} className="glass rounded-3xl p-6 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-xl font-semibold">New product</h3>
        <button type="button" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
      </div>

      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Product title" className="w-full rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className="w-full rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm" />

      <div className="grid grid-cols-2 gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input required type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (USD)" className="rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input type="number" step="0.01" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Sale price" className="rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm" />
        <input required type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" className="rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm" />
        <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="Sizes: S,M,L" className="rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm" />
      </div>
      <input value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Colours: Red, Blue" className="w-full rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm" />

      <div>
        <div className="text-xs font-semibold mb-2">Images</div>
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden group">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="h-20 w-20 rounded-xl border-2 border-dashed border-input flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary">
            {uploading ? "…" : <ImagePlus className="h-5 w-5" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)} className="hidden" />
        </div>
      </div>

      <button disabled={saving || uploading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60">
        {saving ? "Publishing…" : "Publish product"}
      </button>
    </form>
  );
}
