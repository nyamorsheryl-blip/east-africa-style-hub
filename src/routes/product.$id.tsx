import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Heart, Share2, Flag, Star, BadgeCheck, Truck, RotateCcw, ShieldCheck,
  ChevronRight, MessageCircle, Zap, ShoppingBag, Ruler, X, Store, PackageCheck,
  MapPin, FileText, Info, HelpCircle, Sparkles, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist-hook";
import { Section, Rail } from "@/components/ml/section";
import { ProductCard } from "@/components/ml/product-card";
import { Skeleton } from "@/components/ml/states";
import { ProductGallery } from "@/components/ml/gallery";
import { Expandable } from "@/components/ml/expandable";
import { ReviewsPanel, Stars } from "@/components/ml/reviews";
import { ComingSoonCard } from "@/components/ml/coming-soon";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { SWATCHES, SIZES, SIZE_GUIDE, SPECS, PRODUCT_FAQ, AI_PLACEHOLDERS } from "@/lib/social-data";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product — MaeLove" },
      { name: "description", content: "Full product details, seller trust score, reviews, shipping, returns and warranty on MaeLove." },
      { property: "og:title", content: "Product — MaeLove" },
      { property: "og:description", content: "Boutique fashion with verified sellers and worldwide delivery." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const cart = useCart();
  const { isSaved, toggle } = useWishlist();
  const [colour, setColour] = useState(SWATCHES[0].name);
  const [size, setSize] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, boutiques(name, slug, city, country, verified)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 1400);
    return () => window.clearTimeout(t);
  }, [added]);

  const demo = DEMO_PRODUCTS.find((p) => id.startsWith(p.id)) ?? DEMO_PRODUCTS[0];

  if (isLoading) {
    return (
      <div className="min-h-screen px-5 pt-8">
        <Skeleton className="aspect-[4/5] w-full rounded-[2rem]" />
        <div className="mt-4 flex gap-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-14 rounded-2xl" />)}</div>
        <Skeleton className="mt-6 h-7 w-2/3" />
        <Skeleton className="mt-3 h-9 w-1/3" />
        <Skeleton className="mt-6 h-24 w-full rounded-3xl" />
      </div>
    );
  }

  const row = data as Record<string, unknown> | null;
  const boutique = (row?.boutiques as { name: string; slug: string; city: string | null; country: string; verified: boolean } | null) ?? null;
  const images = ((row?.images as string[] | null) ?? []).filter(Boolean);
  const base = images.length ? images : [demo.image, demo.image, demo.image];
  const slides = [
    ...base.map((src) => ({ src, kind: "image" as const })),
    { src: base[0], kind: "video" as const },
    { src: base[base.length - 1], kind: "360" as const },
  ];
  const title = (row?.title as string) ?? demo.title;
  const currency = (row?.currency as string) ?? "USD";
  const listPrice = (row?.price_cents as number) ?? demo.price_cents;
  const salePrice = (row?.sale_price_cents as number | null) ?? demo.sale_price_cents ?? null;
  const price = salePrice ?? listPrice;
  const savings = salePrice ? listPrice - salePrice : 0;
  const off = savings ? Math.round((savings / listPrice) * 100) : 0;
  const storeName = boutique?.name ?? demo.store;
  const storeSlug = boutique?.slug ?? "maelove-studio";
  const stock = (row?.stock as number | null) ?? 7;
  const description = (row?.description as string) ??
    "A considered piece, cut and finished by hand in a small-batch atelier. Designed to last seasons, not weeks.";
  const saved = isSaved(id);
  const sales = 1240 + demo.reviews * 3;
  const trust = 98;

  return (
    <div className="page-enter min-h-screen pb-36">
      {/* Gallery */}
      <div className="relative">
        <ProductGallery slides={slides} title={title} />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5">
          <Link to="/" aria-label="Back" className="press pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-card/85 backdrop-blur-md">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="pointer-events-auto flex gap-2">
            <button
              onClick={() => void toggle(id)}
              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              className={`press grid h-11 w-11 place-items-center rounded-full backdrop-blur-md ${saved ? "bg-primary text-primary-foreground pop-in" : "bg-card/85"}`}
            >
              <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
            </button>
            <button onClick={() => toast.success("Link copied")} aria-label="Share" className="press grid h-11 w-11 place-items-center rounded-full bg-card/85 backdrop-blur-md">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Title + trust */}
      <div className="rise mx-auto max-w-3xl px-5 pt-7">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/store/$slug" params={{ slug: storeSlug }} className="press inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">
            {storeName}
            {(boutique?.verified ?? true) && <BadgeCheck className="h-3.5 w-3.5" />}
          </Link>
          <span className="glass-honey rounded-full px-2.5 py-0.5 text-[10px] font-black">Trust {trust}</span>
        </div>
        <h1 className="mt-2 text-[27px] font-black leading-[1.1] tracking-tight sm:text-[34px]">{title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          <span className="flex items-center gap-1.5">
            <Stars n={demo.rating} />
            <span className="font-black">{demo.rating.toFixed(1)}</span>
          </span>
          <span className="text-muted-foreground">{demo.reviews} reviews</span>
          <span className="text-muted-foreground">·</span>
          <span className="flex items-center gap-1 font-bold text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> {sales.toLocaleString()} sold
          </span>
        </div>

        {/* Pricing */}
        <div className="card-ml mt-5">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-[34px] font-black leading-none tracking-tight">{formatMoney(price, currency)}</span>
            {savings > 0 && (
              <>
                <span className="text-[14px] text-muted-foreground line-through">{formatMoney(listPrice, currency)}</span>
                <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-primary-foreground">−{off}%</span>
              </>
            )}
          </div>
          {savings > 0 && (
            <p className="mt-2 text-[12px] font-bold text-primary">You save {formatMoney(savings, currency)}</p>
          )}
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-2.5">
            <Zap className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-[12px] font-bold">
              Or 3 interest-free payments of {formatMoney(Math.round(price / 3), currency)}
              <span className="ml-1 font-medium text-muted-foreground">— eligible at checkout</span>
            </p>
          </div>
        </div>

        {/* Colour */}
        <div className="mt-7">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[14px] font-black tracking-tight">Colour</h2>
            <span className="text-[12px] text-muted-foreground">{colour}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {SWATCHES.map((s) => (
              <button
                key={s.name}
                onClick={() => setColour(s.name)}
                aria-label={s.name}
                aria-pressed={colour === s.name}
                className={`press grid h-11 w-11 place-items-center rounded-full transition-all duration-300 ${colour === s.name ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "ring-1 ring-border"}`}
              >
                <span className="h-7 w-7 rounded-full" style={{ background: s.hex }} />
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="mt-7">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[14px] font-black tracking-tight">Size</h2>
            <button onClick={() => setGuideOpen(true)} className="press inline-flex items-center gap-1 text-[12px] font-extrabold text-primary">
              <Ruler className="h-3.5 w-3.5" /> Size guide
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={`press min-h-11 min-w-11 rounded-2xl px-4 text-[13px] font-extrabold transition-colors ${size === s ? "bg-foreground text-background" : "glass"}`}
              >
                {s}
              </button>
            ))}
          </div>
          {!size && <p className="mt-2 text-[11px] text-muted-foreground">Select a size to see delivery dates for your area.</p>}
        </div>

        {/* Stock */}
        <div className="mt-6 card-ml">
          <div className="flex items-center justify-between text-[12px] font-bold">
            <span className={stock <= 10 ? "text-primary" : ""}>
              {stock > 0 ? `Only ${stock} left in stock` : "Out of stock"}
            </span>
            <span className="text-muted-foreground">{Math.max(0, 20 - stock)} sold this week</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${Math.min(100, (stock / 20) * 100)}%` }}
            />
          </div>
        </div>

        {/* Delivery / pickup */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="glass flex items-start gap-3 rounded-3xl p-4">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <div className="text-[13px] font-black">Delivery 12–18 Aug</div>
              <div className="text-[11px] text-muted-foreground">Free over {formatMoney(15000, currency)} · duties included</div>
            </div>
          </div>
          <div className="glass flex items-start gap-3 rounded-3xl p-4">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <div className="text-[13px] font-black">Boutique pickup</div>
              <div className="text-[11px] text-muted-foreground">Ready today in {boutique?.city ?? "Nairobi"}</div>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { icon: Truck, t: "Shipping", c: "5–14 days" },
            { icon: RotateCcw, t: "Returns", c: "30 days" },
            { icon: ShieldCheck, t: "Warranty", c: "1 year" },
          ].map(({ icon: Icon, t, c }) => (
            <div key={t} className="glass rounded-3xl p-4">
              <Icon className="h-4 w-4 text-primary" />
              <div className="mt-2 text-[12px] font-black">{t}</div>
              <div className="text-[11px] text-muted-foreground">{c}</div>
            </div>
          ))}
        </div>

        {/* Expandable details */}
        <div className="mt-8 space-y-3">
          <Expandable title="Description" icon={<FileText className="h-4 w-4" />} defaultOpen>
            <p>{description}</p>
            <p className="mt-3">Styled here in {colour.toLowerCase()}. Model is 176 cm and wears a size M.</p>
          </Expandable>
          <Expandable title="Specifications, materials & care" icon={<Info className="h-4 w-4" />}>
            <dl className="grid gap-3 sm:grid-cols-2">
              {SPECS.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 font-bold text-foreground">{v}</dd>
                </div>
              ))}
              <div>
                <dt className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">SKU</dt>
                <dd className="mt-0.5 font-bold text-foreground">{id.slice(0, 8).toUpperCase()}</dd>
              </div>
            </dl>
          </Expandable>
          <Expandable title="Shipping" icon={<Truck className="h-4 w-4" />}>
            Dispatched within 1–3 working days. Express delivery 1–3 days, standard 5–14 days.
            Tracked door-to-door with duties calculated at checkout. Boutique pickup available in {boutique?.city ?? "Nairobi"}.
          </Expandable>
          <Expandable title="Returns & warranty" icon={<RotateCcw className="h-4 w-4" />}>
            30-day returns on unworn items with tags attached. Refunds are issued within 5 working days of inspection.
            All pieces carry a 12-month craftsmanship warranty.
          </Expandable>
          <Expandable title="Seller information" icon={<Store className="h-4 w-4" />}>
            <span className="font-bold text-foreground">{storeName}</span> · {boutique?.city ?? "Nairobi"}, {boutique?.country ?? "Kenya"}
            <br />Trust score {trust} · {sales.toLocaleString()} lifetime sales · typically replies in under 2 hours.
          </Expandable>
          <Expandable title="Frequently asked questions" icon={<HelpCircle className="h-4 w-4" />}>
            <div className="space-y-3">
              {PRODUCT_FAQ.map(([q, a]) => (
                <div key={q}>
                  <p className="font-bold text-foreground">{q}</p>
                  <p className="mt-0.5">{a}</p>
                </div>
              ))}
            </div>
          </Expandable>
        </div>

        {/* Seller card */}
        <Link to="/store/$slug" params={{ slug: storeSlug }} className="press glass mt-4 flex items-center gap-4 rounded-3xl p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl glass-blush text-lg font-black">{storeName?.charAt(0)}</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-black">
              <span className="truncate">{storeName}</span>
              {(boutique?.verified ?? true) && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              <PackageCheck className="mr-1 inline h-3 w-3" />{sales.toLocaleString()} sold · Trust score {trust}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>

        <button
          onClick={() => toast.success("Message sent to the boutique")}
          className="press glass-blush mt-3 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[12px] font-extrabold"
        >
          <MessageCircle className="h-3.5 w-3.5" /> Ask the seller
        </button>
      </div>

      {/* Reviews */}
      <Section title="Reviews" subtitle={`${demo.reviews} verified shoppers`}>
        <div className="mx-auto max-w-3xl px-5">
          <ReviewsPanel rating={demo.rating} total={demo.reviews} />
        </div>
      </Section>

      {/* Smart shopping */}
      <Section title="Complete the look" subtitle="Styled by the boutique">
        <Rail>{DEMO_PRODUCTS.slice(1, 6).map((p) => <ProductCard key={`ctl-${p.id}`} p={p} variant="rail" />)}</Rail>
      </Section>
      <Section title="Customers also bought">
        <Rail>{[...DEMO_PRODUCTS].reverse().slice(0, 5).map((p) => <ProductCard key={`cab-${p.id}`} p={p} variant="rail" />)}</Rail>
      </Section>
      <Section title="Similar products">
        <Rail>{DEMO_PRODUCTS.slice(2, 7).map((p) => <ProductCard key={`sim-${p.id}`} p={p} variant="rail" />)}</Rail>
      </Section>
      <Section title="Recommended for you">
        <Rail>{DEMO_PRODUCTS.slice(0, 5).map((p) => <ProductCard key={`rec-${p.id}`} p={p} variant="rail" />)}</Rail>
      </Section>
      <Section title={`More from ${storeName}`} action="Visit store" actionTo="/store/$slug">
        <Rail>{DEMO_PRODUCTS.filter((p) => p.store === storeName).concat(DEMO_PRODUCTS.slice(0, 3)).slice(0, 5).map((p, i) => <ProductCard key={`sel-${p.id}-${i}`} p={p} variant="rail" />)}</Rail>
      </Section>
      <Section title="Trending in your area" subtitle={boutique?.city ?? "Nairobi"}>
        <Rail>{[...DEMO_PRODUCTS].reverse().slice(2, 7).map((p) => <ProductCard key={`tia-${p.id}`} p={p} variant="rail" />)}</Rail>
      </Section>
      <Section title="Recently viewed">
        <Rail>{DEMO_PRODUCTS.slice(3, 8).map((p) => <ProductCard key={`rv-${p.id}`} p={{ ...p, badge: null }} variant="rail" />)}</Rail>
      </Section>
      <Section title="Smart shopping, coming soon" subtitle="AI styling built for MaeLove">
        <Rail>{AI_PLACEHOLDERS.map((f) => <ComingSoonCard key={f.title} {...f} />)}</Rail>
      </Section>

      <div className="mt-10 flex items-center justify-between gap-4 px-5">
        <button onClick={() => toast.success("Report submitted")} className="press inline-flex min-h-11 items-center gap-2 text-[12px] font-bold text-muted-foreground">
          <Flag className="h-3.5 w-3.5" /> Report this listing
        </button>
        <Link to="/explore" className="press inline-flex min-h-11 items-center gap-1 text-[12px] font-extrabold text-primary">
          Continue shopping <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-5 pt-6" style={{ background: "linear-gradient(0deg, var(--background) 60%, transparent)" }}>
        <div className="glass-strong mx-auto flex max-w-lg items-center gap-2 rounded-full p-2 shadow-[var(--shadow-soft)]">
          <button
            onClick={() => void toggle(id)}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            className={`press grid h-12 w-12 shrink-0 place-items-center rounded-full ${saved ? "bg-primary text-primary-foreground" : "glass"}`}
          >
            <Heart className="h-[18px] w-[18px]" fill={saved ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => {
              cart.add({ productId: id, title, priceCents: price, imageUrl: base[0], sellerId: (row?.owner_id as string) ?? "demo" });
              setAdded(true);
              toast.success(size ? `Added — size ${size}` : "Added to bag");
            }}
            className={`press glass flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-[13px] font-extrabold ${added ? "pop-in" : ""}`}
          >
            <ShoppingBag className="h-4 w-4" /> {added ? "Added" : "Add to bag"}
          </button>
          <Link
            to="/cart"
            className="press glass-cherry flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-[13px] font-extrabold"
          >
            <Zap className="h-4 w-4" /> Buy now
          </Link>
        </div>
      </div>

      {/* Size guide */}
      {guideOpen && (
        <div
          className="fade-in fixed inset-0 z-[90] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Size guide"
          onClick={() => setGuideOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="slide-up glass-strong max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] p-6 sm:rounded-[2rem]">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-black tracking-tight">Size guide</h2>
              <button onClick={() => setGuideOpen(false)} aria-label="Close size guide" className="press grid h-11 w-11 place-items-center rounded-full glass">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">All measurements in centimetres. Between sizes? Size up for a relaxed fit.</p>
            <table className="mt-4 w-full text-left text-[13px]">
              <thead>
                <tr className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="py-2">Size</th><th>Bust</th><th>Waist</th><th>Hip</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE.map((r) => (
                  <tr key={r.size} className="border-t border-border">
                    <td className="py-2.5 font-black">{r.size}</td>
                    <td>{r.bust}</td><td>{r.waist}</td><td>{r.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="glass-honey mt-5 flex items-center gap-2 rounded-2xl p-4">
              <Sparkles className="h-4 w-4 shrink-0" />
              <p className="text-[12px] font-bold">Perfect size prediction is coming soon — we'll remember your measurements.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
