import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Search, SlidersHorizontal, LayoutGrid, List, Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/ml/bottom-nav";
import { Chip, ChipRow } from "@/components/ml/chips";
import { ProductCard, type ProductCardData } from "@/components/ml/product-card";
import { ProductSkeletonGrid, EmptyState } from "@/components/ml/states";
import { SearchBar } from "@/components/ml/search-bar";
import { TopBar } from "@/components/ml/top-bar";
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

// Extends the card's display type with the raw fields we need for filtering,
// without changing what ProductCard itself expects.
type ExploreProduct = ProductCardData & {
  colors: string[];
  sizes: string[];
  category: string;
  stock: number;
  createdAt: string;
};

const PRICE_BUCKETS: Record<string, [number, number]> = {
  "Under $50": [0, 5000],
  "$50–$150": [5000, 15000],
  "$150–$300": [15000, 30000],
  "$300+": [30000, Infinity],
};

const SORTS = ["Recommended", "Newest", "Price: low to high", "Price: high to low", "Top rated"];

function Explore() {
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q ?? "");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState(SORTS[0]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["explore-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, boutiques(name)")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  const catalog: ExploreProduct[] = useMemo(() => {
    if (data && data.length > 0) {
      return data.map((r, i) => {
        const row = r as Record<string, unknown>;
        const imgs = (row.images as string[] | null) ?? [];
        const reviewCount = (row.review_count as number | null) ?? 0;
        return {
          id: row.id as string,
          title: row.title as string,
          store: (row.boutiques as { name?: string } | null)?.name,
          price_cents: row.price_cents as number,
          sale_price_cents: (row.sale_price_cents as number | null) ?? null,
          currency: (row.currency as string) ?? "USD",
          image: imgs[0] ?? DEMO_PRODUCTS[i % DEMO_PRODUCTS.length].image,
          rating: reviewCount > 0 ? (row.avg_rating as number) : undefined,
          reviews: reviewCount > 0 ? reviewCount : undefined,
          colors: (row.colors as string[] | null) ?? [],
          sizes: (row.sizes as string[] | null) ?? [],
          category: (row.category as string) ?? "All",
          stock: (row.stock as number | null) ?? 0,
          createdAt: (row.created_at as string) ?? new Date().toISOString(),
        } satisfies ExploreProduct;
      });
    }
    // Fallback to demo data if the catalog hasn't been seeded yet
    return DEMO_PRODUCTS.map((p) => ({
      ...p,
      colors: [],
      sizes: [],
      category: "All",
      stock: 10,
      createdAt: new Date().toISOString(),
    })) as ExploreProduct[];
  }, [data]);

  // Build filter option lists from what's actually in the catalog, so every
  // filter shown is guaranteed to return results.
  const dynamicOptions = useMemo(() => {
    const colours = new Set<string>();
    const sizes = new Set<string>();
    const brands = new Set<string>();
    catalog.forEach((p) => {
      p.colors.forEach((c) => colours.add(c));
      p.sizes.forEach((s) => sizes.add(s));
      if (p.store) brands.add(p.store);
    });
    return {
      colour: Array.from(colours).sort(),
      size: Array.from(sizes).sort(),
      brand: Array.from(brands).sort(),
    };
  }, [catalog]);

  const FILTERS = useMemo(() => {
    const groups: { label: string; options: string[] }[] = [
      { label: "Price", options: Object.keys(PRICE_BUCKETS) },
    ];
    if (dynamicOptions.brand.length > 0) groups.push({ label: "Brand", options: dynamicOptions.brand });
    if (dynamicOptions.colour.length > 0) groups.push({ label: "Colour", options: dynamicOptions.colour });
    if (dynamicOptions.size.length > 0) groups.push({ label: "Size", options: dynamicOptions.size });
    groups.push({ label: "Seller rating", options: ["4.5+", "4.0+", "Any"] });
    groups.push({ label: "Availability", options: ["In stock"] });
    return groups;
  }, [dynamicOptions]);

  const results = useMemo(() => {
    let out = catalog;

    if (cat !== "All") {
      out = out.filter((p) => p.category.toLowerCase() === cat.toLowerCase());
    }

    const t = term.trim().toLowerCase();
    if (t) out = out.filter((p) => p.title.toLowerCase().includes(t) || (p.store ?? "").toLowerCase().includes(t));

    const priceSel = selected["Price"];
    if (priceSel) {
      const [min, max] = PRICE_BUCKETS[priceSel] ?? [0, Infinity];
      out = out.filter((p) => {
        const price = p.sale_price_cents ?? p.price_cents;
        return price >= min && price < max;
      });
    }

    const brandSel = selected["Brand"];
    if (brandSel) out = out.filter((p) => p.store === brandSel);

    const colourSel = selected["Colour"];
    if (colourSel) out = out.filter((p) => p.colors.includes(colourSel));

    const sizeSel = selected["Size"];
    if (sizeSel) out = out.filter((p) => p.sizes.includes(sizeSel));

    const ratingSel = selected["Seller rating"];
    if (ratingSel && ratingSel !== "Any") {
      const min = parseFloat(ratingSel);
      out = out.filter((p) => (p.rating ?? 0) >= min);
    }

    if (selected["Availability"] === "In stock") out = out.filter((p) => p.stock > 0);

    if (sort === "Newest") out = [...out].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === "Price: low to high") out = [...out].sort((a, b) => (a.sale_price_cents ?? a.price_cents) - (b.sale_price_cents ?? b.price_cents));
    if (sort === "Price: high to low") out = [...out].sort((a, b) => (b.sale_price_cents ?? b.price_cents) - (a.sale_price_cents ?? a.price_cents));
    if (sort === "Top rated") out = [...out].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    return out;
  }, [catalog, term, cat, selected, sort]);

  const activeCount = Object.keys(selected).length;

  return (
    <div className="page-enter min-h-screen pb-32">
      <TopBar title="Categories" />
      <div className="px-5 pt-1">
        <SearchBar value={term} onChange={setTerm} placeholder="Search MaeLove" />
      </div>

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
        {results.length} results {term && <>for "{term}"</>}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <ProductSkeletonGrid count={6} />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="Nothing matched that"
            copy="Try a different word, or clear filters to see more boutiques."
            action={
              <button onClick={() => { setTerm(""); setSelected({}); setCat("All"); }} className="press glass-cherry rounded-full px-6 py-3 text-sm font-extrabold">
                Clear search & filters
              </button>
            }
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
