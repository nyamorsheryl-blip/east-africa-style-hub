import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { useSession } from "@/hooks/use-session";
import { CATEGORIES, COUNTRIES, formatMoney, slugify } from "@/lib/format";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { Plus, Store, Trash2, ImagePlus, Package, Sparkles, X } from "lucide-react";

export const Route = createFileRoute("/seller")({ component: SellerDash });

function SellerDash() {
  const { user, loading } = useSession();
  const qc = useQueryClient();

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

  if (loading) return <div className="min-h-screen"><SiteHeader /></div>;
  if (!user) return (
    <div className="min-h-screen"><SiteHeader />
      <div className="mx-auto max-w-md px-4 pt-16 text-center">
        <div className="glass rounded-3xl p-8">
          <Store className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-display text-xl">Open your boutique</p>
          <p className="text-sm text-muted-foreground mt-1">Sign in or create an account to get started.</p>
          <Link to="/auth" search={{ mode: "sell" }} className="mt-4 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Get started</Link>
        </div>
      </div>
    </div>
  );

  if (!boutique) return <CreateBoutique userId={user.id} onCreated={() => qc.invalidateQueries({ queryKey: ["boutique"] })} />;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-10">
        <div className="glass rounded-3xl p-6 md:p-8 mb-6 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-semibold">{boutique.name}</h1>
              {boutique.verified && <Sparkles className="h-5 w-5 text-primary" />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{boutique.tagline || `Boutique in ${boutique.city ?? boutique.country}`}</p>
          </div>
          <div className="flex gap-3">
            <div className="glass rounded-2xl px-4 py-3 text-center">
              <div className="text-xs text-muted-foreground">Products</div>
              <div className="font-display text-2xl font-semibold">{products?.length ?? 0}</div>
            </div>
            <div className="glass rounded-2xl px-4 py-3 text-center">
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="font-display text-sm font-semibold text-primary">{boutique.verified ? "Verified" : "Pending"}</div>
            </div>
          </div>
        </div>

        <ProductForm boutiqueId={boutique.id} userId={user.id} onSaved={refetchProducts} />

        <div className="mt-8">
          <h2 className="font-display text-2xl font-semibold mb-4">Your products</h2>
          {!products || products.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
              <Package className="mx-auto h-8 w-8 mb-2" />
              No products yet. Add your first above ↑
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {products.map((p) => (
                <div key={p.id} className="glass rounded-2xl p-4 flex gap-3">
                  <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden shrink-0">
                    {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.category} · Stock: {p.stock}</div>
                    <div className="text-sm font-bold text-primary">{formatMoney(p.price_cents, p.currency)}</div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this product?")) return;
                      await supabase.from("products").delete().eq("id", p.id);
                      toast.success("Deleted");
                      refetchProducts();
                    }}
                    className="text-muted-foreground hover:text-destructive self-start p-2"
                  ><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
      await supabase.from("user_roles").upsert({ user_id: userId, role: "seller" }, { onConflict: "user_id,role" });
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

function ProductForm({ boutiqueId, userId, onSaved }: { boutiqueId: string; userId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [price, setPrice] = useState("");
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
        stock: parseInt(stock, 10),
        sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean),
        colors: colors.split(",").map((s) => s.trim()).filter(Boolean),
        images,
      });
      if (error) throw error;
      toast.success("Product listed!");
      setTitle(""); setDescription(""); setPrice(""); setStock("1"); setSizes(""); setColors(""); setImages([]);
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
        <input required type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" className="rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm" />
        <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="Sizes: S, M, L" className="rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm" />
        <input value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Colours: Red, Blue" className="rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm" />
      </div>

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
