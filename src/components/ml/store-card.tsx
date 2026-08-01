import { Link } from "@tanstack/react-router";
import { BadgeCheck, Star } from "lucide-react";

export type StoreCardData = {
  slug: string;
  name: string;
  city: string;
  rating: number;
  followers: string;
  trust: number;
  image: string;
  verified: boolean;
};

export function StoreCard({ s }: { s: StoreCardData }) {
  return (
    <Link
      to="/store/$slug"
      params={{ slug: s.slug }}
      className="press glass w-[228px] shrink-0 snap-start overflow-hidden rounded-3xl"
    >
      <div className="relative h-24 overflow-hidden">
        <img src={s.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent, color-mix(in oklab, black 45%, transparent))" }} />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-black">{s.name}</span>
          {s.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{s.city}</div>
        <div className="mt-3 flex items-center gap-3 text-[11px] font-bold">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" /> {s.rating}
          </span>
          <span className="text-muted-foreground">{s.followers} followers</span>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
            <span>Trust score</span>
            <span className="text-foreground">{s.trust}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${s.trust}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
