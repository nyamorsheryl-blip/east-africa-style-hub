import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Play, BadgeCheck, Bookmark } from "lucide-react";
import { buildFeed, COLLECTIONS, type FeedItem } from "@/lib/social-data";
import { DEMO_PRODUCTS, DEMO_STORES } from "@/lib/demo-data";
import { formatMoney } from "@/lib/format";
import { Skeleton } from "@/components/ml/states";

function Tile({ item, liked, onLike }: { item: FeedItem; liked: boolean; onLike: () => void }) {
  const ratio = item.ratio;
  const style = { aspectRatio: `1 / ${ratio}` };

  const LikeBtn = (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLike(); }}
      aria-label={liked ? "Unlike" : "Like"}
      className={`press absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full backdrop-blur-md ${liked ? "bg-primary text-primary-foreground" : "bg-card/85"}`}
    >
      <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
    </button>
  );

  if (item.kind === "product") {
    const p = DEMO_PRODUCTS.find((d) => d.id === item.id)!;
    return (
      <Link to="/product/$id" params={{ id: p.id }} className="press glass mb-3 block break-inside-avoid overflow-hidden rounded-3xl">
        <span className="relative block overflow-hidden bg-muted" style={style}>
          <img src={p.image} alt={p.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
          {LikeBtn}
        </span>
        <span className="block p-3">
          <span className="block truncate text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">{p.store}</span>
          <span className="mt-1 block line-clamp-2 text-[13px] font-bold leading-snug">{p.title}</span>
          <span className="mt-1.5 block text-[14px] font-black">{formatMoney(p.sale_price_cents ?? p.price_cents)}</span>
        </span>
      </Link>
    );
  }

  if (item.kind === "collection") {
    const c = COLLECTIONS.find((x) => x.id === item.id)!;
    return (
      <Link to="/social" className="press mb-3 block break-inside-avoid overflow-hidden rounded-3xl">
        <span className="relative block overflow-hidden bg-muted" style={style}>
          <img src={c.image} alt={c.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, color-mix(in oklab, black 68%, transparent))" }} />
          <span className="absolute inset-x-3 bottom-3 text-white">
            <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] opacity-80">Collection · {c.items} items</span>
            <span className="mt-0.5 block text-[15px] font-black leading-tight">{c.title}</span>
            <span className="mt-0.5 block text-[11px] opacity-85">{c.curator} · ♡ {c.likes}</span>
          </span>
          {LikeBtn}
        </span>
      </Link>
    );
  }

  if (item.kind === "video") {
    return (
      <div className="press mb-3 break-inside-avoid overflow-hidden rounded-3xl">
        <div className="relative overflow-hidden bg-muted" style={style}>
          <img src={item.image} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="glass-strong grid h-14 w-14 place-items-center rounded-full">
              <Play className="h-5 w-5 translate-x-0.5" fill="currentColor" />
            </span>
          </span>
          <span className="absolute inset-x-3 bottom-3 text-white drop-shadow">
            <span className="block text-[13px] font-black leading-tight">{item.title}</span>
            <span className="block text-[11px] opacity-85">{item.creator}</span>
          </span>
          {LikeBtn}
        </div>
      </div>
    );
  }

  if (item.kind === "boutique") {
    const s = DEMO_STORES.find((d) => d.slug === item.slug)!;
    return (
      <Link to="/store/$slug" params={{ slug: s.slug }} className="press glass mb-3 block break-inside-avoid overflow-hidden rounded-3xl">
        <span className="relative block overflow-hidden bg-muted" style={style}>
          <img src={s.image} alt={s.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </span>
        <span className="flex items-center gap-2 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl glass-blush text-[13px] font-black">{s.name.charAt(0)}</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 text-[13px] font-black">
              <span className="truncate">{s.name}</span>
              {s.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </span>
            <span className="block text-[11px] text-muted-foreground">{s.followers} followers</span>
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link to="/lookbook/$id" params={{ id: item.id }} className="press mb-3 block break-inside-avoid overflow-hidden rounded-3xl">
      <span className="relative block overflow-hidden bg-muted" style={style}>
        <img src={item.image} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, color-mix(in oklab, black 25%, transparent), transparent 45%, color-mix(in oklab, black 70%, transparent))" }} />
        <span className="absolute left-3 top-3 rounded-full bg-white/18 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md">
          Editorial
        </span>
        <span className="absolute inset-x-3 bottom-3 text-white">
          <span className="block text-[16px] font-black leading-tight">{item.title}</span>
          <span className="mt-0.5 block text-[11px] opacity-85">{item.copy}</span>
        </span>
        <span className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-card/85 backdrop-blur-md">
          <Bookmark className="h-4 w-4" />
        </span>
      </span>
    </Link>
  );
}

export function MasonryFeed() {
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || pages >= 6) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLoading(true);
        window.setTimeout(() => { setPages((p) => p + 1); setLoading(false); }, 500);
      }
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [pages]);

  const items = Array.from({ length: pages }).flatMap((_, i) => buildFeed(i));

  return (
    <div className="px-5">
      <div className="columns-2 gap-3 md:columns-3 xl:columns-4">
        {items.map((item, i) => {
          const key = `${item.kind}-${i}`;
          return <Tile key={key} item={item} liked={!!liked[key]} onLike={() => setLiked((l) => ({ ...l, [key]: !l[key] }))} />;
        })}
      </div>
      {loading && (
        <div className="columns-2 gap-3 md:columns-3 xl:columns-4">
          {[1.3, 1, 1.5, 1.1].map((r, i) => (
            <Skeleton key={i} className="mb-3 w-full rounded-3xl" style={{ aspectRatio: `1 / ${r}` }} />
          ))}
        </div>
      )}
      <div ref={sentinel} className="h-8" />
      {pages >= 6 && <p className="pb-4 text-center text-[12px] font-bold text-muted-foreground">You're all caught up ✨</p>}
    </div>
  );
}
