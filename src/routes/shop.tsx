import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CATEGORIES, formatMoney } from "@/lib/format";
import { z } from "zod";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
});

export const Route = createFileRoute("/shop")({
  component: Shop,
  validateSearch: searchSchema,
});

function Shop() {
  const params = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(params.q ?? "");
  useEffect(() => setQ(params.q ?? ""), [params.q]);

  const { data, isLoading } = useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      let query = supabase.from("products").select("id,title,price_cents,sale_price_cents,currency,images,category,boutique_id").eq("published", true).order("created_at", { ascending: false }).limit(60);
      if (params.category) query = query.eq("category", params.category);
      if (params.q) query = query.ilike("title", `%${params.q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-10">
        <div className="glass rounded-3xl p-6 md:p-8 mb-6">
          <h1 className="font-display text-3xl md:text-4xl font-semibold">Discover boutique fashion</h1>
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/shop", search: { ...params, q: q || undefined } }); }}
            className="mt-4 flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 border"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="flex-1 bg-transparent text-sm outline-none" />
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/shop" search={{}} className={`rounded-full px-4 py-1.5 text-xs font-medium ${!params.category ? "bg-primary text-primary-foreground" : "glass"}`}>All</Link>
            {CATEGORIES.map((c) => (
              <Link key={c} to="/shop" search={{ ...params, category: c }}
                className={`rounded-full px-4 py-1.5 text-xs font-medium ${params.category === c ? "bg-primary text-primary-foreground" : "glass"}`}>{c}</Link>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass rounded-2xl aspect-[3/4] animate-pulse" />)}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center">
            <p className="font-display text-xl">No products yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Be the first — <Link to="/seller" className="text-primary underline">open a boutique</Link>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.map((p) => (
              <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="glass group rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform">
                <div className="aspect-[3/4] overflow-hidden bg-muted">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  ) : (
                    <div className="h-full w-full" style={{ background: "var(--gradient-warm)" }} />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-xs text-muted-foreground">{p.category}</div>
                  <div className="text-sm font-semibold truncate">{p.title}</div>
                  <div className="mt-1 text-sm font-bold text-primary">
                    {formatMoney(p.sale_price_cents ?? p.price_cents, p.currency)}
                    {p.sale_price_cents && <span className="ml-2 text-xs line-through text-muted-foreground">{formatMoney(p.price_cents, p.currency)}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
