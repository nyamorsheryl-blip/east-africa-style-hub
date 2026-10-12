import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Shirt, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/ml/bottom-nav";
import { Chip, ChipRow } from "@/components/ml/chips";
import { ProductCard, type ProductCardData } from "@/components/ml/product-card";
import { ProductSkeletonGrid, EmptyState } from "@/components/ml/states";
import { SearchBar } from "@/components/ml/search-bar";
import { TopBar } from "@/components/ml/top-bar";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/thrift")({
  head: () => ({
    meta: [
      { title: "Thrifting — MaeLove" },
      { name: "description", content: "Pre-loved and vintage fashion from MaeLove's boutique sellers — quality secondhand pieces, verified sellers, easy checkout." },
    ],
  }),
  component: Thrifting,
});

type ThriftProduct = ProductCardData & {
  condition: "pre-loved" | "vintage";
  colors: string[];
  sizes: string[];
};

const CONDITIONS = ["All", "Pre-loved", "Vintage"] as const;
const SORTS = ["Recommended", "Newest", "Price: low to high", "Price: high to low"];

function Thrifting() {
  const [term, setTerm] = useState("");
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]>("All");
  const [sort, setSort] = useState(SORTS[0]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["thrift-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, boutiques(name)")
        .eq("published", true)
        .in("condition", ["pre-loved", "vintage"])
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  const catalog: ThriftProduct[] = useMemo(() => {
    if (!data) return [];
    return data.map((r) => {
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
        image: imgs[0] ?? DEMO_PRODUCTS[0].image,
        rating: reviewCount > 0 ? (row.avg_rating as number) : undefined,
        reviews: reviewCount > 0 ? reviewCount : undefined,
        condition: (row.condition as "pre-loved" | "vintage") ?? "pre-loved",
        colors: (row.colors as string[] | null) ?? [],
        sizes: (row.sizes as string[] | null) ?? [],
      } satisfies ThriftProduct;
    });
  }, [data]);

  const dynamicOptions = useMemo(() => {
    const colours = new Set<string>();
    const sizes = new Set<string>();
    catalog.forEach((p) => {
      p.colors.forEach((c) => colours.add(c));
      p.sizes.forEach((s) => sizes.add(s));
    });
    return { colour: Array.from(colours).sort(), size: Array.from(sizes).sort() };
  }, [catalog]);

  const FILTERS = useMemo(() => {
    const groups: { label: string; options: string[] }[] = [
      { label: "Price", options: ["Under $20", "$20–$50", "$50–$100", "$100+"] },
    ];
    if (dynamicOptions.colour.length > 0) groups.push({ label: "Colour", options: dynamicOptions.colour });
    if (dynamicOptions.size.length > 0) groups.push({ label: "Size", options: dynamicOptions.size });
    return groups;
  }, [dynamicOptions]);

  const PRICE_BUCKETS: Record<string, [number, number]> = {
    "Under $20": [0, 2000],
    "$20–$50": [2000, 5000],
    "$50–$100": [5000, 10000],
    "$100+": [10000, Infinity],
  };

  const results = useMemo(() => {
    let out = catalog;

    if (condition !== "All") {
      const target = condition.toLowerCase();
      out = out.filter((p) => p.condition === target);
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

    const colourSel = selected["Colour"];
    if (colourSel) out = out.filter((p) => p.colors.includes(colourSel));

    const sizeSel = selected["Size"];
    if (sizeSel) out = out.filter((p) => p.sizes.includes(sizeSel));

    if (sort === "Price: low to high") out = [...out].sort((a, b) => (a.sale_price_cents ?? a.price_cents) - (b.sale_price_cents ?? b.price_cents));
    if (sort === "Price: high to low") out = [...out].sort((a, b) => (b.sale_price_cents ?? b.price_cents) - (a.sale_price_cents ?? a.price_cents));

    return out;
  }, [catalog, condition, term, selected, sort]);

  const activeCount = Object.keys(selected).length;

  return (
    <div className="page-enter min-h-screen pb-32">
      <TopBar title="Thrifting" />

      <div className="mx-auto max-w-3xl px-5 pt-1">
        <div className="glass-honey flex items-center gap-3 rounded-3xl p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-card/60">
            <Shirt className="h-5 w-5" />
          </span>
          <p className="text-[12px] font-bold leading-snug">
            Pre-loved and vintage pieces from verified boutiques — quality secondhand, still with MaeLove's trust score and buyer protection.
          </p>
        </div>
      </div>

      <div className="px-5 pt-4">
        <SearchBar value={term} onChange={setTerm} placeholder="Search thrifted pieces" />
      </div>

      <ChipRow>
        {CONDITIONS.map((c) => (
          <Chip key={c} active={c === condition} onClick={() => setCondition(c)}>{c}</Chip>
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
        {results.length} thrifted piece{results.length === 1 ? "" : "s"} {term && <>for "{term}"</>}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <ProductSkeletonGrid count={6} />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<Shirt className="h-5 w-5" />}
            title="No thrifted pieces yet"
            copy="Boutiques haven't listed any pre-loved or vintage items just yet — check back soon, or browse the full catalogue."
            action={
              <Link to="/explore" className="press glass-cherry rounded-full px-6 py-3 text-sm font-extrabold">
                Browse everything
              </Link>
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

      <BottomNav />
    </div>
  );
}