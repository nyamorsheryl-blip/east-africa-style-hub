import { useMemo, useState } from "react";
import { Star, ThumbsUp, BadgeCheck, Play, PenLine, SlidersHorizontal } from "lucide-react";
import { REVIEWS, RATING_BREAKDOWN } from "@/lib/social-data";

const SORTS = ["Most helpful", "Newest", "Highest", "Lowest"] as const;
const FILTERS = ["All", "With photos", "With video", "Verified", "5★", "4★"] as const;

export function Stars({ n, className = "h-3.5 w-3.5" }: { n: number; className?: string }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${className} ${i < Math.round(n) ? "fill-current text-foreground" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

export function ReviewsPanel({ rating, total }: { rating: number; total: number }) {
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Most helpful");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const max = Math.max(...RATING_BREAKDOWN.map((r) => r.count));

  const list = useMemo(() => {
    let out = [...REVIEWS];
    if (filter === "With photos") out = out.filter((r) => r.photos.length);
    if (filter === "With video") out = out.filter((r) => r.video);
    if (filter === "Verified") out = out.filter((r) => r.verified);
    if (filter === "5★") out = out.filter((r) => r.rating === 5);
    if (filter === "4★") out = out.filter((r) => r.rating === 4);
    if (sort === "Highest") out.sort((a, b) => b.rating - a.rating);
    if (sort === "Lowest") out.sort((a, b) => a.rating - b.rating);
    if (sort === "Most helpful") out.sort((a, b) => b.helpful - a.helpful);
    return out;
  }, [sort, filter]);

  const photos = REVIEWS.flatMap((r) => r.photos);

  return (
    <div className="space-y-4">
      <div className="glass rounded-3xl p-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5">
          <div className="text-center">
            <div className="text-4xl font-black tracking-tight">{rating.toFixed(1)}</div>
            <div className="mt-1 flex justify-center"><Stars n={rating} /></div>
            <div className="mt-1 text-[11px] text-muted-foreground">{total} reviews</div>
          </div>
          <div className="min-w-0 space-y-1.5">
            {RATING_BREAKDOWN.map((r) => (
              <div key={r.stars} className="flex items-center gap-2">
                <span className="w-4 text-[11px] font-bold">{r.stars}</span>
                <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ width: `${(r.count / max) * 100}%` }}
                  />
                </span>
                <span className="w-8 text-right text-[11px] text-muted-foreground">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="btn-base btn-primary mt-5 w-full">
          <PenLine className="h-4 w-4" /> Write a review
        </button>
      </div>

      {photos.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <h4 className="text-[13px] font-black">Photos from shoppers</h4>
            <span className="text-[11px] text-muted-foreground">{photos.length} photos</span>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {photos.map((src, i) => (
              <img key={i} src={src} alt="" loading="lazy" className="press h-24 w-20 shrink-0 rounded-2xl object-cover" />
            ))}
          </div>
        </div>
      )}

      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </span>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold ${filter === f ? "bg-foreground text-background" : "glass"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {SORTS.map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            aria-pressed={sort === s}
            className={`press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold ${sort === s ? "glass-blush" : "glass"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((r) => (
          <article key={r.id} className="glass slide-up rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full glass-blush text-[12px] font-black">{r.initials}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[13px] font-black">
                  <span className="truncate">{r.name}</span>
                  {r.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <Stars n={r.rating} className="h-3 w-3" />
                  <span className="text-[11px] text-muted-foreground">{r.date}</span>
                </div>
              </div>
              {r.fit && <span className="glass shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold">{r.fit}</span>}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{r.body}</p>
            {(r.photos.length > 0 || r.video) && (
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                {r.video && (
                  <span className="relative grid h-24 w-20 shrink-0 place-items-center rounded-2xl glass-dark">
                    <Play className="h-5 w-5" fill="currentColor" />
                  </span>
                )}
                {r.photos.map((src, i) => (
                  <img key={i} src={src} alt="" loading="lazy" className="h-24 w-20 shrink-0 rounded-2xl object-cover" />
                ))}
              </div>
            )}
            <button
              onClick={() => setLiked((l) => ({ ...l, [r.id]: !l[r.id] }))}
              aria-pressed={!!liked[r.id]}
              className={`press mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold ${liked[r.id] ? "glass-blush" : "glass"}`}
            >
              <ThumbsUp className="h-3.5 w-3.5" /> Helpful · {r.helpful + (liked[r.id] ? 1 : 0)}
            </button>
          </article>
        ))}
        {list.length === 0 && <p className="px-2 text-[13px] text-muted-foreground">No reviews match that filter yet.</p>}
      </div>
    </div>
  );
}
