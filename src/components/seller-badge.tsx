import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCheck, MapPin, Package } from "lucide-react";
import { useState } from "react";

type Props = {
  ownerId: string;
  name: string;
  location?: string | null;
  verified: boolean;
};

/**
 * Small buyer-facing seller card.
 * - Shows boutique name, verification badge, location, and lifetime units sold.
 * - Tap toggles the surface: verified boutiques flip to deep plum;
 *   unverified boutiques stay white (visual trust cue).
 */
export function SellerBadge({ ownerId, name, location, verified }: Props) {
  const [active, setActive] = useState(false);

  const { data: unitsSold } = useQuery({
    queryKey: ["seller-units-sold", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("quantity")
        .eq("seller_id", ownerId);
      if (error) throw error;
      return (data ?? []).reduce((s, r) => s + (r.quantity ?? 0), 0);
    },
  });

  const isDark = verified && active;

  return (
    <button
      type="button"
      onClick={() => setActive((v) => !v)}
      aria-pressed={active}
      className={`w-full text-left rounded-2xl border transition-all duration-300 px-4 py-3 flex items-center gap-3 ${
        isDark
          ? "bg-plum text-cream border-plum shadow-[var(--shadow-glow)]"
          : "bg-white text-plum border-plum/10 hover:border-plum/25"
      }`}
    >
      <div
        className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
          isDark ? "bg-cream/15 text-cream" : "bg-blush/50 text-plum"
        }`}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-extrabold truncate">{name}</span>
          {verified ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wider ${
                isDark ? "bg-lime/25 text-lime" : "bg-berry/15 text-berry"
              }`}
            >
              <BadgeCheck className="h-3 w-3" /> VERIFIED
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-plum/5 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-plum/50">
              UNVERIFIED
            </span>
          )}
        </div>
        <div className={`mt-0.5 flex items-center gap-3 text-[11px] font-semibold ${isDark ? "text-cream/75" : "text-plum/60"}`}>
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {location}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Package className="h-3 w-3" />
            {unitsSold ?? 0} sold
          </span>
        </div>
      </div>
    </button>
  );
}
