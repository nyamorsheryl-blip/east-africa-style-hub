import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { CATEGORIES } from "@/lib/format";
import { z } from "zod";
import { Search, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import prodBlazer from "@/assets/prod-blazer.jpg";
import prodPendant from "@/assets/prod-pendant.jpg";
import prodStreet from "@/assets/prod-streetset.jpg";
import prodMandala from "@/assets/prod-mandala.jpg";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
});

export const Route = createFileRoute("/shop")({
  component: Shop,
  validateSearch: searchSchema,
});

const DEMO: ProductCardData[] = [
  { id: "demo-3", title: "Street Colour Block Set", boutique: "GRID SUPPLY", price_cents: 13200, image: prodStreet, swatches: ["#e85d3a", "#2d5a9e", "#1a1a1a"] },
  { id: "demo-2", title: "Gold Teardrop Pendant", boutique: "LUMIÈRE FINE", price_cents: 22000, image: prodPendant, badge: "BESTSELLER", swatches: ["#c9a84c", "#e8c07a"] },
  { id: "demo-1", title: "Noir Satin Blazer Dress", boutique: "MAELOVE STUDIO", price_cents: 24000, sale_price_cents: 18900, image: prodBlazer, badge: "SALE", discountPct: 21, swatches: ["#1a1a2e", "#6B003E"] },
  { id: "demo-4", title: "Silver Mandala Necklace", boutique: "LUMIÈRE FINE", price_cents: 19500, image: prodMandala, badge: "LUXURY", swatches: ["#c0c0c0"] },
];

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

  const items: ProductCardData[] = (data && data.length > 0)
    ? data.map((p) => ({
        id: p.id,
        title: p.title,
        price_cents: p.price_cents,
        sale_price_cents: p.sale_price_cents,
        currency: p.currency,
        image: p.images?.[0] ?? prodBlazer,
        boutique: "MAELOVE",
      }))
    : DEMO;

  return (
    <div className="min-h-screen pb-28">
      {/* Top bar */}
      <div className="px-5 pt-6 flex items-center gap-3">
        <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 backdrop-blur">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-plum">Discover</h1>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); navigate({ to: "/shop", search: { ...params, q: q || undefined } }); }}
        className="mx-5 mt-4 flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-4 py-3 border border-white"
      >
        <Search className="h-4 w-4 text-plum/60" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search boutiques, styles…" className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-plum/50" />
      </form>

      {/* Category chips */}
      <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [&::-webkit-scrollbar]:hidden">
        <Link to="/shop" search={{}} className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold ${!params.category ? "bg-berry text-white" : "bg-white/70 text-plum"}`}>All</Link>
        {CATEGORIES.map((c) => (
          <Link key={c} to="/shop" search={{ ...params, category: c }}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold ${params.category === c ? "bg-berry text-white" : "bg-white/70 text-plum"}`}>{c}</Link>
        ))}
      </div>

      {/* Grid */}
      <div className="px-5 mt-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass rounded-3xl aspect-[3/4] animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>

      <MobileTabBar />
    </div>
  );
}
