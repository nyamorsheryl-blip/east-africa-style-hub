import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Heart, Share2, Flag, Star, BadgeCheck, Truck, RotateCcw,
  ShieldCheck, Play, Box, Shirt, ChevronRight, MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist-hook";
import { Section, Rail } from "@/components/ml/section";
import { ProductCard } from "@/components/ml/product-card";
import { Skeleton } from "@/components/ml/states";
import { DEMO_PRODUCTS } from "@/lib/demo-data";

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
  const [imgIndex, setImgIndex] = useState(0);
  const [tab, setTab] = useState<"details" | "reviews" | "questions" | "specs">("details");

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

  const demo = DEMO_PRODUCTS.find((p) => id.startsWith(p.id)) ?? DEMO_PRODUCTS[0];

  if (isLoading) {
    return (
      <div className="min-h-screen px-5 pt-8">
        <Skeleton className="aspect-[4/5] w-full rounded-[2rem]" />
        <Skeleton className="mt-5 h-6 w-2/3" />
        <Skeleton className="mt-3 h-6 w-1/3" />
      </div>
    );
  }

  const row = data as Record<string, unknown> | null;
  const boutique = (row?.boutiques as { name: string; slug: string; city: string | null; country: string; verified: boolean } | null) ?? null;
  const images = ((row?.images as string[] | null) ?? []).filter(Boolean);
  const gallery = images.length ? images : [demo.image, demo.image];
  const title = (row?.title as string) ?? demo.title;
  const currency = (row?.currency as string) ?? "USD";
  const listPrice = (row?.price_cents as number) ?? demo.price_cents;
  const salePrice = (row?.sale_price_cents as number | null) ?? demo.sale_price_cents ?? null;
  const price = salePrice ?? listPrice;
  const storeName = boutique?.name ?? demo.store;
  const storeSlug = boutique?.slug ?? "maelove-studio";
  const description = (row?.description as string) ?? "A considered piece, cut and finished by hand in a small-batch atelier. Designed to last seasons, not weeks.";
  const saved = isSaved(id);

  return (
    <div className="min-h-screen pb-36">
      {/* Gallery */}
      <div className="relative">
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {gallery.map((src, i) => (
            <img key={i} src={src} alt={`${title} view ${i + 1}`} className="aspect-[4/5] w-full shrink-0 snap-center object-cover" onLoad={() => setImgIndex(imgIndex)} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5">
          <Link to="/" aria-label="Back" className="press pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-card/80 backdrop-blur-md">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="pointer-events-auto flex gap-2">
            <button onClick={() => void toggle(id)} aria-label="Save" className={`press flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md ${saved ? "bg-primary text-primary-foreground" : "bg-card/80"}`}>
              <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
            </button>
            <button onClick={() => toast.success("Link copied")} aria-label="Share" className="press flex h-11 w-11 items-center justify-center rounded-full bg-card/80 backdrop-blur-md">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">
          {[{ icon: Play, label: "Video" }, { icon: Box, label: "360°" }, { icon: Shirt, label: "Try-on" }].map(({ icon: Icon, label }) => (
            <button key={label} className="press glass-strong flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-extrabold">
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="rise px-5 pt-6">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">{storeName}</div>
        <h1 className="mt-2 text-[26px] font-black leading-tight tracking-tight">{title}</h1>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-3xl font-black tracking-tight">{formatMoney(price, currency)}</span>
          {salePrice && <span className="text-sm text-muted-foreground line-through">{formatMoney(listPrice, currency)}</span>}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[12px]">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="font-black">{demo.rating.toFixed(1)}</span>
          <span className="text-muted-foreground">· {demo.reviews} reviews</span>
        </div>
      </div>

      {/* Store card */}
      <div className="mt-6 px-5">
        <Link to="/store/$slug" params={{ slug: storeSlug }} className="press glass flex items-center gap-4 rounded-3xl p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl glass-blush text-lg font-black">{storeName?.charAt(0)}</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-black">
              <span className="truncate">{storeName}</span>
              {(boutique?.verified ?? true) && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
            </span>
            <span className="block text-[11px] text-muted-foreground">{boutique?.city ?? "Nairobi"} · Trust score 98</span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto px-5">
        {(["details", "reviews", "questions", "specs"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`press shrink-0 rounded-full px-4 py-2 text-[13px] font-bold capitalize ${tab === t ? "bg-foreground text-background" : "glass"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 px-5">
        <div className="glass rounded-3xl p-5 text-[13px] leading-relaxed">
          {tab === "details" && <p className="text-muted-foreground">{description}</p>}
          {tab === "reviews" && (
            <div className="space-y-4">
              {[["Amina K.", "Impeccable finish, arrived in 4 days."], ["Joy M.", "Fits exactly as the size guide said."]].map(([n, c]) => (
                <div key={n}>
                  <div className="flex items-center gap-2 text-[12px] font-black">
                    {n} <span className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{c}</p>
                </div>
              ))}
            </div>
          )}
          {tab === "questions" && (
            <div className="space-y-3">
              <p className="font-bold">Is this true to size?</p>
              <p className="text-muted-foreground">Yes — the atelier recommends your usual size, or size down for a sharper fit.</p>
              <button className="press glass-blush mt-2 flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-extrabold">
                <MessageCircle className="h-3.5 w-3.5" /> Ask the seller
              </button>
            </div>
          )}
          {tab === "specs" && (
            <dl className="grid grid-cols-2 gap-y-3">
              {[["Material", (row?.materials as string) ?? "Satin blend"], ["Origin", boutique?.country ?? "Kenya"], ["Condition", "New"], ["SKU", id.slice(0, 8).toUpperCase()]].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* Trust row */}
      <div className="mt-4 grid grid-cols-3 gap-3 px-5">
        {[{ icon: Truck, t: "Shipping", c: "5–14 days" }, { icon: RotateCcw, t: "Returns", c: "30 days" }, { icon: ShieldCheck, t: "Warranty", c: "1 year" }].map(({ icon: Icon, t, c }) => (
          <div key={t} className="glass rounded-3xl p-4">
            <Icon className="h-4 w-4 text-primary" />
            <div className="mt-2 text-[12px] font-black">{t}</div>
            <div className="text-[11px] text-muted-foreground">{c}</div>
          </div>
        ))}
      </div>

      <Section title="Related products">
        <Rail>{DEMO_PRODUCTS.slice(0, 5).map((p) => <ProductCard key={`rel-${p.id}`} p={p} variant="rail" />)}</Rail>
      </Section>
      <Section title="Customers also bought">
        <Rail>{[...DEMO_PRODUCTS].reverse().slice(0, 5).map((p) => <ProductCard key={`cab-${p.id}`} p={p} variant="rail" />)}</Rail>
      </Section>
      <Section title="Recently viewed">
        <Rail>{DEMO_PRODUCTS.slice(2, 7).map((p) => <ProductCard key={`rv-${p.id}`} p={{ ...p, badge: null }} variant="rail" />)}</Rail>
      </Section>

      <div className="mt-10 px-5">
        <button onClick={() => toast.success("Report submitted")} className="press flex items-center gap-2 text-[12px] font-bold text-muted-foreground">
          <Flag className="h-3.5 w-3.5" /> Report this listing
        </button>
      </div>

      {/* Sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 px-5 pb-6 pt-4" style={{ background: "linear-gradient(0deg, var(--background) 62%, transparent)" }}>
        <button
          onClick={() => {
            cart.add({ productId: id, title, priceCents: price, imageUrl: gallery[0], sellerId: (row?.owner_id as string) ?? "demo" });
            toast.success("Added to bag");
          }}
          className="press glass flex-1 rounded-full py-4 text-sm font-extrabold"
        >
          Add to bag
        </button>
        <Link to="/cart" className="press glass-cherry flex-1 rounded-full py-4 text-center text-sm font-extrabold">
          Buy now
        </Link>
      </div>
    </div>
  );
}
