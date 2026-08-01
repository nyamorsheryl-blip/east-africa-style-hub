import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BadgeCheck, Star, MapPin, MessageCircle } from "lucide-react";
import { BottomNav } from "@/components/ml/bottom-nav";
import { ProductCard } from "@/components/ml/product-card";
import { DEMO_STORES, DEMO_PRODUCTS } from "@/lib/demo-data";

export const Route = createFileRoute("/store/$slug")({
  head: () => ({
    meta: [
      { title: "Boutique — MaeLove" },
      { name: "description", content: "Browse this MaeLove boutique's products, reviews, policies and trust score, and follow the store for new drops." },
      { property: "og:title", content: "Boutique — MaeLove" },
      { property: "og:description", content: "Verified boutique storefront on MaeLove." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorePage,
});

const TABS = ["Products", "Reviews", "About", "Policies"] as const;

function StorePage() {
  const { slug } = Route.useParams();
  const store = DEMO_STORES.find((s) => s.slug === slug) ?? DEMO_STORES[0];
  const [tab, setTab] = useState<(typeof TABS)[number]>("Products");
  const [following, setFollowing] = useState(false);

  return (
    <div className="min-h-screen pb-32">
      <div className="relative h-52">
        <img src={store.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent, color-mix(in oklab, black 55%, transparent))" }} />
        <Link to="/" aria-label="Back" className="press absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-card/80 backdrop-blur-md">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <div className="rise -mt-12 px-5">
        <div className="glass-strong rounded-[2rem] p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl glass-blush text-2xl font-black">{store.name.charAt(0)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-lg font-black tracking-tight">{store.name}</span>
                {store.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> {store.city}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[[`${store.rating}`, "Rating"], [store.followers, "Followers"], [`${store.trust}`, "Trust score"]].map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-card/60 py-3">
                <div className="flex items-center justify-center gap-1 text-base font-black">
                  {l === "Rating" && <Star className="h-3.5 w-3.5 fill-current" />} {v}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={() => setFollowing((f) => !f)} className={`press flex-1 rounded-full py-3 text-sm font-extrabold ${following ? "glass" : "glass-cherry"}`}>
              {following ? "Following" : "Follow store"}
            </button>
            <Link to="/messages" aria-label="Contact store" className="press glass flex h-12 w-12 items-center justify-center rounded-full">
              <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto px-5">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`press shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${tab === t ? "bg-foreground text-background" : "glass"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "Products" && (
          <div className="grid grid-cols-2 gap-3 px-5">
            {DEMO_PRODUCTS.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
        {tab === "Reviews" && (
          <div className="space-y-3 px-5">
            {[["Amina K.", "Beautiful packaging and fast shipping."], ["Joy M.", "The tailoring service was worth every shilling."], ["Peter O.", "Great communication throughout."]].map(([n, c]) => (
              <div key={n} className="glass rounded-3xl p-5">
                <div className="flex items-center gap-2 text-[12px] font-black">
                  {n} <span className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</span>
                </div>
                <p className="mt-1.5 text-[13px] text-muted-foreground">{c}</p>
              </div>
            ))}
          </div>
        )}
        {tab === "About" && (
          <div className="px-5">
            <div className="glass rounded-3xl p-5 text-[13px] leading-relaxed text-muted-foreground">
              {store.name} is a small-batch atelier in {store.city}, producing considered pieces with local artisans. Every order is cut, finished and packed by hand.
            </div>
          </div>
        )}
        {tab === "Policies" && (
          <div className="space-y-3 px-5">
            {[["Shipping", "Dispatched in 1–3 days. Worldwide delivery in 5–14 days."], ["Returns", "30-day returns on unworn items with tags attached."], ["Warranty", "12-month craftsmanship warranty on all pieces."]].map(([t, c]) => (
              <div key={t} className="glass rounded-3xl p-5">
                <div className="text-[13px] font-black">{t}</div>
                <p className="mt-1 text-[13px] text-muted-foreground">{c}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
