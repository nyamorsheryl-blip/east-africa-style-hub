import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin, ChevronDown, Zap, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/ml/bottom-nav";
import { Section, Rail } from "@/components/ml/section";
import { Chip, ChipRow } from "@/components/ml/chips";
import { ProductCard, type ProductCardData } from "@/components/ml/product-card";
import { StoreCard } from "@/components/ml/store-card";
import { ProductSkeletonGrid } from "@/components/ml/states";
import {
  DEMO_PRODUCTS, DEMO_STORES, CATEGORY_CHIPS, POPULAR_CATEGORIES,
  FUTURE_LANES, AI_FEATURES, IMAGES,
} from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MaeLove — Luxury Boutique Marketplace" },
      { name: "description", content: "Shop luxury boutique fashion, jewellery and shoes from independent East African designers. Trusted sellers, worldwide delivery." },
      { property: "og:title", content: "MaeLove — Luxury Boutique Marketplace" },
      { property: "og:description", content: "Discover trending pieces, flash deals and featured boutiques on MaeLove." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function toCard(row: Record<string, unknown>, i: number): ProductCardData {
  const images = (row.images as string[] | null) ?? [];
  return {
    id: row.id as string,
    title: row.title as string,
    store: (row.boutiques as { name?: string } | null)?.name,
    price_cents: row.price_cents as number,
    sale_price_cents: (row.sale_price_cents as number | null) ?? null,
    currency: (row.currency as string) ?? "USD",
    image: images[0] ?? DEMO_PRODUCTS[i % DEMO_PRODUCTS.length].image,
    badge: row.sale_price_cents ? "SALE" : null,
  };
}

function Home() {
  const [category, setCategory] = useState("All");
  const [visible, setVisible] = useState(6);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["home-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, boutiques(name)")
        .eq("published", true)
        .limit(24);
      if (error) throw error;
      return data ?? [];
    },
  });

  const catalog: ProductCardData[] = useMemo(() => {
    if (products && products.length > 0) return products.map((r, i) => toCard(r as Record<string, unknown>, i));
    return DEMO_PRODUCTS.map((p) => ({ ...p }));
  }, [products]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + 4, 48));
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const feed = useMemo(
    () => Array.from({ length: visible }, (_, i) => {
      const base = catalog[i % catalog.length];
      return { ...base, id: i < catalog.length ? base.id : `${base.id}-${i}` };
    }),
    [catalog, visible],
  );

  return (
    <div className="min-h-screen pb-32">
      {/* Top bar */}
      <header className="sticky top-0 z-40 px-5 pb-3 pt-6 backdrop-blur-xl" style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--background) 92%, transparent), transparent)" }}>
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-[-0.05em]">
            Mae<span className="text-primary">Love</span>
          </Link>
          <button className="press glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold">
            <MapPin className="h-3.5 w-3.5 text-primary" /> Nairobi
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <Link
          to="/explore"
          className="press glass mt-4 flex items-center gap-3 rounded-full px-5 py-3.5"
        >
          <Search className="h-[18px] w-[18px] text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search boutiques, pieces, designers…</span>
        </Link>
      </header>

      <ChipRow>
        {CATEGORY_CHIPS.map((c) => (
          <Chip key={c} active={c === category} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </ChipRow>

      {/* Hero */}
      <section className="rise mt-6 px-5">
        <div className="relative overflow-hidden rounded-[2rem] shadow-[var(--shadow-soft)]">
          <img src={IMAGES.hero} alt="Editorial look from the MaeLove women's edit" className="h-[420px] w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, color-mix(in oklab, black 62%, transparent))" }} />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <span className="glass-blush inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em]">
              New season
            </span>
            <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tight text-white">
              The Women's<br />Edit
            </h1>
            <p className="mt-2 max-w-[16rem] text-sm text-white/80">
              Handmade luxury from 240+ independent boutiques.
            </p>
            <Link to="/explore" className="press glass-cherry mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold">
              Shop now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trending */}
      <Section title="Trending now" subtitle="What everyone is saving this week" action="See all" actionTo="/explore">
        {isLoading ? <ProductSkeletonGrid count={2} /> : (
          <Rail>{catalog.slice(0, 6).map((p) => <ProductCard key={`t-${p.id}`} p={p} variant="rail" />)}</Rail>
        )}
      </Section>

      {/* Flash deals */}
      <Section title="Flash deals" subtitle="Ends in 04 : 12 : 55" action="All deals" actionTo="/explore">
        <div className="px-5">
          <div className="glass-cherry mb-3 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold">
            <Zap className="h-4 w-4" /> Up to 40% off selected boutiques
          </div>
        </div>
        <Rail>
          {catalog.filter((p) => p.sale_price_cents).concat(catalog).slice(0, 6).map((p, i) => (
            <ProductCard key={`f-${p.id}-${i}`} p={{ ...p, badge: "FLASH" }} variant="rail" />
          ))}
        </Rail>
      </Section>

      {/* Popular categories */}
      <Section title="Popular categories">
        <div className="grid grid-cols-2 gap-3 px-5">
          {POPULAR_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/explore"
              search={{ q: c.label }}
              className="press relative block aspect-[5/4] overflow-hidden rounded-3xl"
            >
              <img src={c.image} alt={c.label} loading="lazy" className="h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, color-mix(in oklab, black 55%, transparent))" }} />
              <span className="absolute bottom-4 left-4 text-lg font-black text-white">{c.label}</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Featured stores */}
      <Section title="Featured stores" subtitle="Verified boutiques with top trust scores" action="Explore" actionTo="/explore">
        <Rail>{DEMO_STORES.map((s) => <StoreCard key={s.slug} s={s} />)}</Rail>
      </Section>

      {/* New arrivals */}
      <Section title="New arrivals" action="See all" actionTo="/explore">
        <Rail>{[...catalog].reverse().slice(0, 6).map((p) => <ProductCard key={`n-${p.id}`} p={{ ...p, badge: "NEW" }} variant="rail" />)}</Rail>
      </Section>

      {/* Nearby sellers */}
      <Section title="Nearby sellers" subtitle="Within 12 km of Nairobi CBD">
        <div className="space-y-3 px-5">
          {DEMO_STORES.slice(0, 3).map((s, i) => (
            <Link key={s.slug} to="/store/$slug" params={{ slug: s.slug }} className="press glass flex items-center gap-4 rounded-3xl p-3">
              <img src={s.image} alt="" className="h-14 w-14 rounded-2xl object-cover" loading="lazy" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black">{s.name}</div>
                <div className="text-[11px] text-muted-foreground">{s.city} · {(i + 2) * 1.4} km away</div>
              </div>
              <span className="rounded-full glass-blush px-3 py-1.5 text-[11px] font-extrabold">Visit</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Recently viewed */}
      <Section title="Recently viewed">
        <Rail>{catalog.slice(2, 8).map((p) => <ProductCard key={`r-${p.id}`} p={{ ...p, badge: null }} variant="rail" />)}</Rail>
      </Section>

      {/* Future lanes */}
      <Section title="More ways to shop" subtitle="Live, rentals, auctions, digital & services">
        <Rail>
          {FUTURE_LANES.map((l) => (
            <div key={l.key} className="glass w-[200px] shrink-0 snap-start rounded-3xl p-5">
              <div className="text-2xl">{l.emoji}</div>
              <div className="mt-3 text-sm font-black">{l.title}</div>
              <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{l.copy}</p>
              <span className="mt-4 inline-flex rounded-full bg-muted px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
                Coming soon
              </span>
            </div>
          ))}
        </Rail>
      </Section>

      {/* AI */}
      <Section title="AI at MaeLove" subtitle="Personal styling, powered by you">
        <div className="grid grid-cols-2 gap-3 px-5">
          {AI_FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-3xl p-4">
              <div className="text-xl">{f.emoji}</div>
              <div className="mt-2 text-[13px] font-black leading-tight">{f.title}</div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{f.copy}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Suggested / infinite feed */}
      <Section title="Suggested for you" subtitle="Refined as you browse">
        <div className="mb-3 flex items-center gap-2 px-5 text-[12px] font-bold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI recommendations
        </div>
        <div className="grid grid-cols-2 gap-3 px-5">
          {feed.map((p) => <ProductCard key={`s-${p.id}`} p={p} />)}
        </div>
        <div ref={sentinel} className="h-16" />
        <div className="px-5"><ProductSkeletonGrid count={2} /></div>
      </Section>

      <BottomNav />
    </div>
  );
}
