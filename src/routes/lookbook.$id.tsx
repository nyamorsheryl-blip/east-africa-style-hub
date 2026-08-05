import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Heart, Share2, ShoppingBag, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/ml/bottom-nav";
import { Section, Rail } from "@/components/ml/section";
import { ProductCard } from "@/components/ml/product-card";
import { LOOKBOOKS, type Lookbook } from "@/lib/social-data";
import { DEMO_PRODUCTS } from "@/lib/demo-data";

export const Route = createFileRoute("/lookbook/$id")({
  loader: ({ params }) => {
    const book = LOOKBOOKS.find((l) => l.id === params.id);
    if (!book) throw notFound();
    return { book };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Lookbook not found — MaeLove" }, { name: "robots", content: "noindex" }] };
    }
    const { book } = loaderData;
    return {
      meta: [
        { title: `${book.title} — MaeLove Lookbook` },
        { name: "description", content: book.subtitle },
        { property: "og:title", content: `${book.title} — MaeLove Lookbook` },
        { property: "og:description", content: book.subtitle },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: LookbookPage,
});

function LookbookPage() {
  const { book } = Route.useLoaderData() as { book: Lookbook };
  const scroller = useRef<HTMLDivElement | null>(null);
  const [spread, setSpread] = useState(0);
  const products = book.productIds
    .map((id) => DEMO_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is (typeof DEMO_PRODUCTS)[number] => !!p);

  const accessories = DEMO_PRODUCTS.filter((p) => /pendant|necklace|cuff/i.test(p.title));
  const shoes = DEMO_PRODUCTS.filter((p) => /heel|shoe/i.test(p.title));

  return (
    <div className="page-enter min-h-screen pb-32">
      <div className="relative">
        <div
          ref={scroller}
          onScroll={(e) => setSpread(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-label={`${book.title} editorial spreads`}
        >
          {book.spreads.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${book.title} spread ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              className="aspect-[3/4] w-full shrink-0 snap-center object-cover sm:aspect-[16/9]"
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5">
          <Link to="/lookbooks" aria-label="Back to lookbooks" className="press pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-card/85 backdrop-blur-md">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="pointer-events-auto flex gap-2">
            <button aria-label="Save lookbook" className="press grid h-11 w-11 place-items-center rounded-full bg-card/85 backdrop-blur-md"><Heart className="h-4 w-4" /></button>
            <button aria-label="Share lookbook" className="press grid h-11 w-11 place-items-center rounded-full bg-card/85 backdrop-blur-md"><Share2 className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center gap-1.5">
          {book.spreads.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === spread ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
          ))}
        </div>
      </div>

      <header className="rise px-5 pt-7">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{book.season}</div>
        <h1 className="mt-2 text-[32px] font-black leading-[1.05] tracking-tight">{book.title}</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{book.story}</p>
      </header>

      <Section title="Shop the look" subtitle="Every piece in this story">
        <div className="grid grid-cols-2 gap-3 px-5">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
        <div className="mt-4 px-5">
          <button className="btn-base btn-primary w-full py-4">
            <ShoppingBag className="h-4 w-4" /> Add the whole outfit
          </button>
        </div>
      </Section>

      <Section title="Suggested accessories">
        <Rail>{(accessories.length ? accessories : DEMO_PRODUCTS.slice(1, 5)).map((p) => <ProductCard key={`acc-${p.id}`} p={p} variant="rail" />)}</Rail>
      </Section>
      <Section title="Recommended shoes">
        <Rail>{(shoes.length ? shoes : DEMO_PRODUCTS.slice(4, 8)).map((p) => <ProductCard key={`sh-${p.id}`} p={p} variant="rail" />)}</Rail>
      </Section>
      <Section title="Matching bags & jewellery">
        <Rail>{DEMO_PRODUCTS.slice(1, 6).map((p) => <ProductCard key={`bj-${p.id}`} p={p} variant="rail" />)}</Rail>
      </Section>

      <Section title="More editorials">
        <Rail>
          {LOOKBOOKS.filter((l) => l.id !== book.id).map((l) => (
            <Link key={l.id} to="/lookbook/$id" params={{ id: l.id }} className="press relative w-[240px] shrink-0 snap-start overflow-hidden rounded-3xl">
              <img src={l.cover} alt={l.title} loading="lazy" className="aspect-[4/5] w-full object-cover" />
              <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 45%, color-mix(in oklab, black 72%, transparent))" }} />
              <span className="absolute inset-x-4 bottom-4 text-[18px] font-black text-white">{l.title}</span>
            </Link>
          ))}
        </Rail>
      </Section>

      <div className="mt-12 px-5">
        <div className="glass-honey rounded-3xl p-5">
          <Sparkles className="h-5 w-5" />
          <h2 className="mt-2 text-[16px] font-black tracking-tight">Style this lookbook on you</h2>
          <p className="mt-1 text-[12px] opacity-80">Virtual try-on for full outfits is coming soon to MaeLove.</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
