import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  X, Heart, ShoppingBag, Star, ChevronLeft, ChevronRight, Play, Minus, Plus, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist-hook";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { SWATCHES, SIZES } from "@/lib/social-data";

type Slide = { src: string; kind: "image" | "video" };

/** Premium quick-view: media carousel, options, add to bag and wishlist. */
export function QuickView({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const cart = useCart();
  const { isSaved, toggle } = useWishlist();
  const [i, setI] = useState(0);
  const [colour, setColour] = useState(SWATCHES[0].name);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { data } = useQuery({
    queryKey: ["quick-view", id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, boutiques(name, slug, verified)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!open) return;
    setI(0);
    setQty(1);
    setSize(null);
    setAdded(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((v) => v + 1);
      if (e.key === "ArrowLeft") setI((v) => Math.max(0, v - 1));
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const demo = DEMO_PRODUCTS.find((d) => d.id === id) ?? DEMO_PRODUCTS[0];
  const row = data as Record<string, unknown> | null;
  const boutique = (row?.boutiques as { name: string; verified: boolean } | null) ?? null;
  const images = ((row?.images as string[] | null) ?? []).filter(Boolean);
  const base = images.length ? images : [demo.image, demo.image];
  const slides: Slide[] = [
    ...base.map((src) => ({ src, kind: "image" as const })),
    { src: base[0], kind: "video" as const },
  ];
  const idx = Math.min(slides.length - 1, Math.max(0, i));
  const title = (row?.title as string) ?? demo.title;
  const currency = (row?.currency as string) ?? "USD";
  const listPrice = (row?.price_cents as number) ?? demo.price_cents;
  const salePrice = (row?.sale_price_cents as number | null) ?? demo.sale_price_cents ?? null;
  const price = salePrice ?? listPrice;
  const off = salePrice ? Math.round(((listPrice - salePrice) / listPrice) * 100) : 0;
  const storeName = boutique?.name ?? demo.store;
  const saved = isSaved(id);

  return createPortal(
    <div
      className="fade-in fixed inset-0 z-[110] flex items-end justify-center bg-foreground/45 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} quick view`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong pop-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] shadow-[var(--shadow-soft)] sm:rounded-[2rem]"
      >
        {/* Media carousel */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[2rem] bg-muted sm:rounded-t-[2rem]">
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-foreground/20 sm:hidden" />
          {slides[idx].kind === "video" ? (
            <div className="absolute inset-0">
              <img src={slides[idx].src} alt="" className="h-full w-full object-cover" ref={undefined} />
              <span className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="glass-strong grid h-16 w-16 place-items-center rounded-full">
                  <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
                </span>
              </span>
              <video ref={videoRef} className="hidden" />
            </div>
          ) : (
            <img
              key={idx}
              src={slides[idx].src}
              alt={`${title} — view ${idx + 1}`}
              className="fade-in h-full w-full object-cover"
            />
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick view"
            className="press absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-card/85 backdrop-blur-md"
          >
            <X className="h-4 w-4" />
          </button>

          {slides.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous media"
                onClick={() => setI(idx === 0 ? slides.length - 1 : idx - 1)}
                className="press absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-card/80 backdrop-blur-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next media"
                onClick={() => setI((idx + 1) % slides.length)}
                className="press absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-card/80 backdrop-blur-md"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {slides.map((_, n) => (
              <span
                key={n}
                className={`h-1.5 rounded-full transition-all duration-300 ${n === idx ? "w-6 bg-primary" : "w-1.5 bg-background/70"}`}
              />
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4 p-5">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">{storeName}</div>
            <h2 className="mt-1 text-lg font-black leading-tight">{title}</h2>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3 fill-current text-foreground" />
              <span className="font-bold text-foreground">{demo.rating.toFixed(1)}</span>
              <span>({demo.reviews})</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">{formatMoney(price, currency)}</span>
            {off > 0 && (
              <>
                <span className="text-sm text-muted-foreground line-through">{formatMoney(listPrice, currency)}</span>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold text-primary-foreground">−{off}%</span>
              </>
            )}
          </div>

          {/* Colour */}
          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Colour — {colour}</div>
            <div className="flex gap-2">
              {SWATCHES.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  aria-label={s.name}
                  aria-pressed={colour === s.name}
                  onClick={() => setColour(s.name)}
                  style={{ background: s.hex }}
                  className={`press h-8 w-8 rounded-full border-2 transition-transform ${colour === s.name ? "scale-110 border-foreground" : "border-border"}`}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Size</div>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  onClick={() => setSize(s)}
                  className={`press min-w-11 rounded-2xl px-3 py-2 text-xs font-extrabold ${size === s ? "bg-foreground text-background" : "glass"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Quantity</span>
            <div className="glass flex items-center gap-3 rounded-full px-2 py-1.5">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="press grid h-8 w-8 place-items-center rounded-full">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-6 text-center text-sm font-black">{qty}</span>
              <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(20, q + 1))} className="press grid h-8 w-8 place-items-center rounded-full">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => void toggle(id)}
              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              className={`press grid h-12 w-12 shrink-0 place-items-center rounded-full ${saved ? "bg-primary text-primary-foreground" : "glass"}`}
            >
              <Heart className="h-[18px] w-[18px]" fill={saved ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => {
                void cart.add(
                  { productId: id, title, priceCents: price, imageUrl: base[0], sellerId: (row?.owner_id as string) ?? "demo" },
                  qty,
                );
                setAdded(true);
                toast.success(size ? `Added — size ${size}` : "Added to bag");
              }}
              className={`press glass-cherry flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-[13px] font-extrabold ${added ? "pop-in" : ""}`}
            >
              <ShoppingBag className="h-4 w-4" /> {added ? "Added to bag" : "Add to bag"}
            </button>
          </div>

          <Link
            to="/product/$id"
            params={{ id }}
            onClick={onClose}
            className="press glass flex items-center justify-center gap-1.5 rounded-full py-3 text-[12px] font-extrabold"
          >
            View full details <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
