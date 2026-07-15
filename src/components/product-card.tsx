import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { formatMoney } from "@/lib/format";

export type ProductCardData = {
  id: string;
  title: string;
  boutique?: string;
  price_cents: number;
  sale_price_cents?: number | null;
  currency?: string;
  image: string;
  badge?: "SALE" | "BESTSELLER" | "LUXURY" | null;
  discountPct?: number;
  swatches?: string[];
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const price = p.sale_price_cents ?? p.price_cents;
  const badgeStyle =
    p.badge === "LUXURY"
      ? "bg-plum text-lime"
      : "bg-berry text-white";

  return (
    <div className="glass rounded-3xl overflow-hidden flex flex-col">
      <Link to="/product/$id" params={{ id: p.id }} className="relative block aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={p.image}
          alt={p.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {p.badge && (
          <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wide ${badgeStyle}`}>
            {p.badge}
            {p.badge === "SALE" && p.discountPct ? ` −${p.discountPct}%` : ""}
          </span>
        )}
        <button
          aria-label="Save"
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 backdrop-blur-md text-plum hover:bg-white"
        >
          <Heart className="h-4 w-4" />
        </button>
      </Link>
      <div className="p-3 flex-1 flex flex-col gap-2">
        {p.boutique && (
          <div className="text-[10px] font-extrabold tracking-widest text-berry uppercase">
            {p.boutique}
          </div>
        )}
        <div className="text-sm font-bold text-plum leading-tight line-clamp-2">
          {p.title}
        </div>
        {p.swatches && p.swatches.length > 0 && (
          <div className="flex gap-1.5">
            {p.swatches.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-full border border-white/80 shadow-sm"
                style={{ background: c }}
              />
            ))}
          </div>
        )}
        <div className="mt-1 flex items-center justify-between">
          <div className="font-extrabold text-plum text-base">
            {formatMoney(price, p.currency ?? "USD")}
          </div>
          <button className="rounded-full bg-berry px-4 py-2 text-xs font-extrabold text-white hover:opacity-90">
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
