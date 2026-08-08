import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Star, Eye } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist-hook";
import { QuickView } from "@/components/ml/quick-view";


export type ProductCardData = {
  id: string;
  title: string;
  store?: string;
  boutique?: string;
  price_cents: number;
  sale_price_cents?: number | null;
  currency?: string;
  image: string;
  badge?: string | null;
  rating?: number;
  reviews?: number;
  swatches?: string[];
};

const BADGE_TONE: Record<string, string> = {
  SALE: "bg-primary text-primary-foreground",
  FLASH: "bg-primary text-primary-foreground",
  NEW: "bg-secondary text-secondary-foreground",
  TRENDING: "bg-foreground text-background",
  BESTSELLER: "bg-foreground text-background",
  LUXURY: "bg-foreground text-background",
};

export function ProductCard({ p, variant = "grid" }: { p: ProductCardData; variant?: "grid" | "rail" | "list" }) {
  const price = p.sale_price_cents ?? p.price_cents;
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(p.id);
  const store = p.store ?? p.boutique;
  const off =
    p.sale_price_cents && p.price_cents > p.sale_price_cents
      ? Math.round(((p.price_cents - p.sale_price_cents) / p.price_cents) * 100)
      : null;

  if (variant === "list") {
    return (
      <Link
        to="/product/$id"
        params={{ id: p.id }}
        className="press glass flex gap-4 rounded-3xl p-3"
      >
        <img src={p.image} alt={p.title} loading="lazy" className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1 py-0.5">
          {store && <div className="truncate text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">{store}</div>}
          <div className="mt-1 line-clamp-2 text-sm font-bold leading-snug">{p.title}</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-base font-black">{formatMoney(price, p.currency ?? "USD")}</span>
            {off && <span className="text-xs text-muted-foreground line-through">{formatMoney(p.price_cents, p.currency ?? "USD")}</span>}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      className={`press glass flex flex-col overflow-hidden rounded-3xl transition-shadow hover:shadow-[var(--shadow-soft)] ${
        variant === "rail" ? "w-[164px] shrink-0 snap-start" : ""
      }`}
    >
      <Link to="/product/$id" params={{ id: p.id }} className="relative block aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={p.image}
          alt={p.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
        {p.badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${
              BADGE_TONE[p.badge] ?? "bg-foreground text-background"
            }`}
          >
            {p.badge}
            {off && (p.badge === "SALE" || p.badge === "FLASH") ? ` −${off}%` : ""}
          </span>
        )}
        <button
          type="button"
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggle(p.id);
          }}
          className={`press absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md ${
            saved ? "bg-primary text-primary-foreground" : "bg-card/85 text-foreground"
          }`}
        >
          <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          aria-label={`Quick view ${p.title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setQuick(true);
          }}
          className="press absolute bottom-3 right-3 flex h-9 items-center gap-1.5 rounded-full bg-card/85 px-3 text-[10px] font-extrabold backdrop-blur-md"
        >
          <Eye className="h-3.5 w-3.5" /> Quick view
        </button>
      </Link>


      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {store && (
          <div className="truncate text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">{store}</div>
        )}
        <div className="line-clamp-2 text-[13px] font-bold leading-snug">{p.title}</div>
        {p.rating != null && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="h-3 w-3 fill-current text-foreground" />
            <span className="font-bold text-foreground">{p.rating.toFixed(1)}</span>
            {p.reviews != null && <span>({p.reviews})</span>}
          </div>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-black">{formatMoney(price, p.currency ?? "USD")}</span>
          {off && (
            <span className="text-[11px] text-muted-foreground line-through">
              {formatMoney(p.price_cents, p.currency ?? "USD")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CardShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl p-5 ${className}`}>{children}</div>;
}
