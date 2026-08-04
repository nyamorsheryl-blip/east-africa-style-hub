import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Search, SlidersHorizontal, LayoutGrid, List, X, Star, ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/ml/bottom-nav";
import { Chip, ChipRow } from "@/components/ml/chips";
import { ProductCard, type ProductCardData } from "@/components/ml/product-card";
import { ProductSkeletonGrid, EmptyState } from "@/components/ml/states";
import { SearchBar } from "@/components/ml/search-bar";
import { DEMO_PRODUCTS, CATEGORY_CHIPS } from "@/lib/demo-data";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type ExploreSearch = { q?: string };

export const Route = createFileRoute("/explore")({
  validateSearch: (s: Record<string, unknown>): ExploreSearch => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explore — MaeLove Marketplace" },
      { name: "description", content: "Search and filter thousands of boutique fashion pieces by price, size, colour, seller rating and delivery time." },
      { property: "og:title", content: "Explore — MaeLove Marketplace" },
      { property: "og:description", content: "Instant search across MaeLove boutiques with premium filters and sorting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explore,
});

const FILTERS = [
  { label: "Price", options: ["Under $50", "$50–$150", "$150–$300", "$300+"] },
  { label: "Distance", options: ["< 5 km", "< 25 km", "Nationwide", "Worldwide"] },
  { label: "Condition", options: ["New", "Pre-loved", "Vintage"] },
  { label: "Brand", options: ["MaeLove Studio", "Lumière Fine", "Grid Supply", "Zanzi Craft"] },
  { label: "Colour", options: ["Black", "Cherry", "Blush", "Vanilla", "Gold"] },
  { label: "Size", options: ["XS", "S", "M", "L", "XL"] },
  { label: "Seller rating", options: ["4.5+", "4.0+", "Any"] },
  { label: "Delivery time", options: ["1–3 days", "3–7 days", "7–14 days"] },
  { label: "Availability", options: ["In stock", "Pre-order"] },
];

const SORTS = ["Recommended", "Newest", "Price: low to high", "Price: high to low", "Top rated"];

function Explore() {
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q ?? "");
  const [cat, setCat] = useState(q ?? "All");
  const [sort, setSort] = useState(SORTS[0]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["explore-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, boutiques(name)").eq("published", true).limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  const catalog: ProductCardData[] = useMemo(() => {
    if (data && data.length > 0) {
      return data.map((r, i) => {
        const row = r as Record<string, unknown>;
        const imgs = (row.images as string[] | null) ?? [];
        return {
          id: row.id as string,
          title: row.title as string,
          store: (row.boutiques as { name?: string } | null)?.name,
          price_cents: row.price_cents as number,
          sale_price_cents: (row.sale_price_cents as number | null) ?? null,
          currency: (row.currency as string) ?? "USD",
          image: imgs[0] ?? DEMO_PRODUCTS[i % DEMO_PRODUCTS.length].image,
        } satisfies ProductCardData;
      });
    }
    return DEMO_PRODUCTS.map((p) => ({ ...p }));
  }, [data]);

  const results = useMemo(() => {
    let out = catalog;
    const t = term.trim().toLowerCase();
    if (t) out = out.filter((p) => p.title.toLowerCase().includes(t) || (p.store ?? "").toLowerCase().includes(t));
    if (sort === "Price: low to high") out = [...out].sort((a, b) => (a.sale_price_cents ?? a.price_cents) - (b.sale_price_cents ?? b.price_cents));
    if (sort === "Price: high to low") out = [...out].sort((a, b) => (b.sale_price_cents ?? b.price_cents) - (a.sale_price_cents ?? a.price_cents));
    if (sort === "Top rated") out = [...out].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return out;
  }, [catalog, term, sort]);

  const activeCount = Object.keys(selected).length;

  return (
    <div className="page-enter min-h-screen pb-32">
      <header className="sticky top-0 z-40 px-5 pb-4 pt-6 backdrop-blur-xl" style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--background) 94%, transparent), transparent)" }}>
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Back" className="press glass flex h-11 w-11 items-center justify-center rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <SearchBar value={term} onChange={setTerm} placeholder="Search MaeLove" className="flex-1" />
        </div>
      </header>

      <ChipRow>
        {CATEGORY_CHIPS.map((c) => (
          <Chip key={c} active={c === cat} onClick={() => setCat(c)}>{c}</Chip>
        ))}
      </ChipRow>

      <div className="mt-4 flex items-center gap-2 px-5">
        <Sheet>
          <SheetTrigger asChild>
            <button className="press glass flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold">
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {activeCount > 0 && (
                <span className="rounded-full bg-primary px-2 text-[10px] font-black text-primary-foreground">{activeCount}</span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[2rem] border-0 glass-strong">
            <SheetHeader className="text-left">
              <SheetTitle className="text-2xl font-black tracking-tight">Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 pb-8">
              {FILTERS.map((f) => (
                <div key={f.label}>
                  <div className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">{f.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {f.options.map((o) => (
                      <Chip
                        key={o}
                        active={selected[f.label] === o}
                        onClick={() =>
                          setSelected((s) => {
                            const next = { ...s };
                            if (next[f.label] === o) delete next[f.label];
                            else next[f.label] = o;
                            return next;
                          })
                        }
                      >
                        {o}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelected({})} className="btn-base btn-secondary flex-1">Clear all</button>
                <button className="btn-base btn-primary flex-1">Show {results.length} results</button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort results"
          className="press glass rounded-full px-4 py-2.5 text-[13px] font-bold outline-none"
        >
          {SORTS.map((s) => <option key={s}>{s}</option>)}
        </select>

        <div className="glass ml-auto flex items-center rounded-full p-1">
          <button onClick={() => setView("grid")} aria-label="Grid view" className={`press rounded-full p-2 ${view === "grid" ? "bg-foreground text-background" : "text-muted-foreground"}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setView("list")} aria-label="List view" className={`press rounded-full p-2 ${view === "list" ? "bg-foreground text-background" : "text-muted-foreground"}`}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 px-5 text-[12px] text-muted-foreground">
        {results.length} results {term && <>for “{term}”</>}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <ProductSkeletonGrid count={6} />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="Nothing matched that"
            copy="Try a different word, or browse trending boutiques on the home feed."
            action={<Link to="/" className="press glass-cherry rounded-full px-6 py-3 text-sm font-extrabold">Back to home</Link>}
          />
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 gap-3 px-5">
            {results.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="space-y-3 px-5">
            {results.map((p) => <ProductCard key={p.id} p={p} variant="list" />)}
          </div>
        )}
      </div>

      <div className="mt-10 px-5">
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 text-sm font-black">
            <Star className="h-4 w-4 fill-current text-primary" /> Top rated sellers only
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">Every MaeLove boutique is vetted, rated and trust-scored before listing.</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
